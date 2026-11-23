// ============================================================================
// Cloudflare Worker لمتجر معاذ (كاش سحابي مشترك + قاطع دائرة وتبريد تلقائي للمفاتيح)
// - تخزين الصوت البشري في Cloudflare Edge Cache لمدة 30 يوماً لجميع الزبائن
// - قاطع دائرة ذكي وتبريد تلقائي (15 دقيقة) لأي مفتاح يُرجع 429
// - يقرأ المفاتيح المتاحة (GEMINI_API_KEY_1, GEMINI_API_KEY, GEMINI_API_KEY_2) دون الاعتماد على GEMINI_API_KEY_3
// - حظر كامل ونهائي لأي تدخل للذكاء الاصطناعي في الدفع أو شام كاش أو الإيصالات
// ============================================================================

let keyRotationCursor = 0;
const keyCooldownUntil = new Map();
const COOLDOWN_MS = 15 * 60 * 1000; // 15 دقيقة تبريد تلقائي عند 429
const EDGE_CACHE_TTL_SEC = 60 * 60 * 24 * 30; // 30 يوماً في كاش Cloudflare

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function getRotatedGeminiKeys(env) {
  const keys = [
    env.GEMINI_API_KEY_1,
    env.GEMINI_API_KEY,
    env.GEMINI_API_KEY_2
  ]
    .map(k => String(k || "").trim())
    .filter(Boolean);

  if (keys.length <= 1) return keys;
  const start = keyRotationCursor % keys.length;
  keyRotationCursor = (keyRotationCursor + 1) % keys.length;
  return [...keys.slice(start), ...keys.slice(0, start)];
}

function getAvailableKeys(allKeys) {
  const now = Date.now();
  const active = [];
  let minRemainingMs = Infinity;

  for (const k of allKeys) {
    const until = keyCooldownUntil.get(k) || 0;
    if (until <= now) {
      active.push(k);
    } else {
      minRemainingMs = Math.min(minRemainingMs, until - now);
    }
  }

  return {
    active,
    retryAfterSec: minRemainingMs === Infinity ? 0 : Math.max(30, Math.ceil(minRemainingMs / 1000))
  };
}

function markKeyCooldown(key, ms = COOLDOWN_MS) {
  keyCooldownUntil.set(key, Date.now() + ms);
}

async function buildEdgeCacheRequest(partsObj) {
  const raw = JSON.stringify(partsObj);
  const data = new TextEncoder().encode(raw);
  const hashBuf = await crypto.subtle.digest("SHA-256", data);
  const hashHex = Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  return new Request(`https://moaath-tts-cache.internal/v1/${hashHex}`, { method: "GET" });
}

function safeParseJsonObject(rawText) {
  const str = String(rawText || "").trim();
  if (!str) return {};
  try {
    const parsed = JSON.parse(str);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_) {}
  const match = str.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_) {}
  }
  return {};
}

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ ok: false, error: "Method Not Allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    try {
      const body = await request.json();
      const mode = String(body.mode || "companion_shop");

      // إلغاء وحظر أي تدخل للذكاء الاصطناعي في الدفع أو شام كاش أو الإيصالات المالية
      if (/payment|receipt|shamcash|sham_cash|pay|checkout|invoice_payment/i.test(mode)) {
        return new Response(JSON.stringify({
          ok: false,
          error: "ShamCash and payment verification by AI is completely disabled"
        }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const allApiKeys = getRotatedGeminiKeys(env);

      // =====================================================================
      // وضع تحويل النص إلى صوت بشري عربي (mode: "tts") + كاش سحابي + تبريد تلقائي
      // =====================================================================
      // =====================================================================
      // وضع التحديث اليومي لغرف VIP مع كاش سحابي مشترك (Cloudflare Edge Cache 24h)
      // - يُولّد أو يُحفظ مرة واحدة في السحابة لجميع المشتركين لتوفير الحصص المجانية
      // =====================================================================
      if (mode === "vip_daily_feed") {
        const dateKey = String(body.dateKey || new Date().toISOString().slice(0, 10)).trim();
        const edgeCache = typeof caches !== "undefined" ? caches.default : null;
        let feedCacheReq = null;
        if (edgeCache) {
          try {
            feedCacheReq = new Request(`https://moaath-vip-feed.internal/v1/${encodeURIComponent(dateKey)}`, { method: "GET" });
            const hit = await edgeCache.match(feedCacheReq);
            if (hit) {
              const cachedData = await hit.json();
              return new Response(JSON.stringify({ ok: true, edgeCache: "HIT", data: cachedData }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json", "X-Moaath-Cache": "HIT" }
              });
            }
          } catch (_) {}
        }
        return new Response(JSON.stringify({ ok: false, edgeCache: "MISS", error: "Use repo daily_vip_feed.json or scheduled Action" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (mode === "tts") {
        const text = String(body.text || "").trim().slice(0, 260);
        const voiceName = String(body.voiceName || "Puck").trim();
        const gender = String(body.gender || "male").trim();
        const toneTag = String(body.toneTag || "").trim();
        const dialectMode = String(body.dialectMode || "shami_friendly").trim();
        const skipGemini = !!body.skipGemini;
        const pitchSemitones = typeof body.pitchSemitones === "number" ? body.pitchSemitones : 0;
        const styleHint = String(body.styleHint || "تحدث بالعربية الواضحة بصوت بشري طبيعي").trim().slice(0, 220);

        if (!text) {
          return new Response(JSON.stringify({ ok: false, error: "Empty TTS text" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        // 1) فحص الكاش السحابي المشترك (Cloudflare Edge Cache) قبل لمس حصة Gemini
        let edgeCacheReq = null;
        const edgeCache = typeof caches !== "undefined" ? caches.default : null;
        if (edgeCache) {
          try {
            edgeCacheReq = await buildEdgeCacheRequest({ voiceName, gender, toneTag, dialectMode, text });
            const cachedResp = await edgeCache.match(edgeCacheReq);
            if (cachedResp) {
              const cachedJson = await cachedResp.json();
              return new Response(JSON.stringify({
                ...cachedJson,
                edgeCache: "HIT"
              }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json", "X-Moaath-Cache": "HIT" }
              });
            }
          } catch (_) {}
        }

        let geminiError = null;
        let cooldownActive = false;
        let retryAfterSec = 0;

        // 2) التحقق من المفاتيح النشطة (غير الموجودة في فترة تبريد)
        const { active: availableKeys, retryAfterSec: waitSec } = getAvailableKeys(allApiKeys);
        if (skipGemini) {
          geminiError = "CLIENT_COOLDOWN_SKIP";
          cooldownActive = true;
          retryAfterSec = waitSec || 600;
        } else if (allApiKeys.length === 0) {
          geminiError = "NO_API_KEY";
        } else if (availableKeys.length === 0) {
          geminiError = "ALL_KEYS_COOLDOWN_429";
          cooldownActive = true;
          retryAfterSec = waitSec || 900;
        } else {
          const genderDesc = gender === "female" ? "صوت أنثوي" : "صوت ذكري";
          const pitchDesc = pitchSemitones >= 2 ? "بطبقة صوتية عالية وناعمة"
            : pitchSemitones >= 0.5 ? "بطبقة صوتية مشرقة"
            : pitchSemitones <= -1.5 ? "بطبقة صوتية عميقة ورزينة"
            : "بطبقة صوتية متوازنة";
          const dialectDesc = /fusha/i.test(dialectMode)
            ? "بالعربية الفصحى المبسطة الواضحة"
            : "بلهجة شامية لطيفة ومفهومة وقريبة من الحديث اليومي";
          const voiceDirection = [genderDesc, pitchDesc, toneTag ? `بنبرة ${toneTag}` : "", dialectDesc, styleHint]
            .filter(Boolean)
            .join("، ");

          const ttsStart = Date.now();
          let hitQuotaCount = 0;

          for (let i = 0; i < availableKeys.length; i++) {
            if (Date.now() - ttsStart > 15000) {
              geminiError = geminiError || "TOTAL_BUDGET_15S";
              break;
            }
            const key = availableKeys[i];
            try {
              const ttsUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${encodeURIComponent(key)}`;
              const ttsRes = await fetch(ttsUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [{
                    parts: [{
                      text: `${voiceDirection}. انطق العبارة التالية مباشرة بعفوية ووضوح مع احترام الفواصل ووقفات التنفس الطبيعية، دون أي مقدمات: ${text}`
                    }]
                  }],
                  generationConfig: {
                    responseModalities: ["AUDIO"],
                    speechConfig: {
                      voiceConfig: {
                        prebuiltVoiceConfig: { voiceName }
                      }
                    }
                  }
                }),
                signal: AbortSignal.timeout(10000)
              });

              if (ttsRes.ok) {
                const ttsJson = await ttsRes.json();
                const part = ttsJson?.candidates?.[0]?.content?.parts?.find(p => p?.inlineData?.data);
                if (part?.inlineData?.data) {
                  const successPayload = {
                    ok: true,
                    source: "gemini_tts",
                    keySlot: i + 1,
                    mimeType: part.inlineData.mimeType || "audio/L16;codec=pcm;rate=24000",
                    audioBase64: part.inlineData.data
                  };

                  if (edgeCache && edgeCacheReq) {
                    const cacheResp = new Response(JSON.stringify(successPayload), {
                      status: 200,
                      headers: {
                        "Content-Type": "application/json",
                        "Cache-Control": `public, max-age=${EDGE_CACHE_TTL_SEC}`
                      }
                    });
                    if (ctx && typeof ctx.waitUntil === "function") {
                      ctx.waitUntil(edgeCache.put(edgeCacheReq, cacheResp).catch(() => {}));
                    } else {
                      edgeCache.put(edgeCacheReq, cacheResp).catch(() => {});
                    }
                  }

                  return new Response(JSON.stringify({ ...successPayload, edgeCache: "MISS_STORED" }), {
                    status: 200,
                    headers: { ...corsHeaders, "Content-Type": "application/json", "X-Moaath-Cache": "MISS" }
                  });
                }
                geminiError = "NO_AUDIO_PART";
              } else {
                let errTxt = "";
                try {
                  const errJson = await ttsRes.json();
                  errTxt = errJson?.error?.message || "";
                } catch (_) {}
                geminiError = `HTTP_${ttsRes.status}${errTxt ? ": " + errTxt.slice(0, 80) : ""}`;
                if (ttsRes.status === 429 || /QUOTA|RESOURCE_EXHAUSTED/i.test(errTxt)) {
                  markKeyCooldown(key, COOLDOWN_MS);
                  hitQuotaCount++;
                }
              }
            } catch (e) {
              geminiError = e?.name === "TimeoutError" ? "TIMEOUT_10S" : (e?.message || "GEMINI_FETCH_ERR");
            }
          }

          if (hitQuotaCount >= availableKeys.length && availableKeys.length > 0) {
            cooldownActive = true;
            retryAfterSec = Math.ceil(COOLDOWN_MS / 1000);
          }
        }

        // البديل التلقائي: Google TTS MP3
        try {
          const gUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ar&q=${encodeURIComponent(text.slice(0, 180))}`;
          const gRes = await fetch(gUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            },
            signal: AbortSignal.timeout(7000)
          });
          if (gRes.ok) {
            const buf = await gRes.arrayBuffer();
            const b64 = arrayBufferToBase64(buf);
            return new Response(JSON.stringify({
              ok: true,
              source: "google_tts",
              geminiError,
              cooldownActive,
              retryAfterSec,
              edgeCache: "BYPASS",
              mimeType: "audio/mpeg",
              audioBase64: b64
            }), {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
        } catch (_) {}

        return new Response(JSON.stringify({ ok: false, error: "TTS unavailable", geminiError, cooldownActive, retryAfterSec }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (!allApiKeys.length) {
        return new Response(JSON.stringify({ ok: false, error: "GEMINI_API_KEY is not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const promptText = String(body.prompt || "").trim();
      const catalogSummary = Array.isArray(body.catalog) ? body.catalog.slice(0, 70) : [];
      const currentCart = Array.isArray(body.currentCart) ? body.currentCart : [];
      const storeMeta = body.storeMeta || {};
      const imageBase64 = body.imageBase64 || null;
      const imageMimeType = body.imageMimeType || "image/jpeg";

      const candidateModels = ["gemini-2.5-flash-lite", "gemini-2.5-flash"];
      let systemInstruction = "";
      let userParts = [];

      if (mode === "supplier_invoice_ocr") {
        systemInstruction =
          "أنت محاسب مخزون لمتجر معاذ. اقرأ صورة فاتورة الجملة واستخرج الأصناف والكميات وأسعار الجملة فقط (لا علاقة لك بدفع الزبائن أو شام كاش أو التحويلات). أجب بصيغة JSON فقط: " +
          '{"supplierName": "string_or_null", "invoiceDate": "string_or_null", "totalAmount": number_or_null, "items": [{"name": "اسم الصنف", "qty": 1, "unitCost": 0, "totalCost": 0}], "notes": "ملاحظات"}';
        userParts.push({ text: "اقرأ فاتورة المورد واستخرج الأصناف بصيغة JSON فقط." });
        if (imageBase64) userParts.push({ inlineData: { mimeType: imageMimeType, data: imageBase64 } });
      } else if (mode === "debt_reminder") {
        const info = body.debtInfo || {};
        systemInstruction =
          'أنت مساعد إداري لمتجر معاذ. اكتب رسالة واتساب قصيرة ومهذبة جداً لتذكير الزبون برصيده المستحق دون أي تحقق دفع. أجب بـ JSON فقط: {"message": "نص الرسالة"}';
        userParts.push({ text: `الزبون: ${info.customerName || ""}، المبلغ: ${info.amount || 0}، التأخير: ${info.daysOverdue || 0} يوم.` });
      } else if (mode === "daily_brief") {
        const stats = body.stats || {};
        systemInstruction =
          'أنت مستشار مبيعات لمتجر معاذ. حلل أرقام اليوم وقدّم ملخصاً قصيراً مع 3 إلى 5 توصيات عملية بـ JSON فقط: {"summary": "ملخص", "actions": ["توصية 1"]}';
        userParts.push({ text: `بيانات اليوم: ${JSON.stringify(stats)}` });
      } else {
        const convHistory = Array.isArray(body.history) ? body.history.slice(-6) : [];
        const customerProfile = body.customerProfile && typeof body.customerProfile === "object" ? body.customerProfile : null;
        const pName = String(storeMeta.persona || "مساعد المتجر").trim();
        const pRole = String(storeMeta.personaRole || "").trim();
        const pTone = String(storeMeta.personaTone || "").trim();
        const pStyle = String(storeMeta.personaStyle || "").trim();
        const shopDialect = /fusha/i.test(String(storeMeta.dialectMode || ""))
          ? "بالعربية الفصحى المبسطة الواضحة"
          : "باللهجة الشامية السورية الطبيعية القريبة من الناس";

        const profileNotes = [];
        if (customerProfile) {
          if (customerProfile.firstName) profileNotes.push(`اسم الزبون: ${customerProfile.firstName}`);
          if (Array.isArray(customerProfile.topItems) && customerProfile.topItems.length) {
            profileNotes.push(`أكثر أصناف يطلبها عادةً: ${customerProfile.topItems.slice(0, 3).join("، ")}`);
          }
          if (customerProfile.prefersBulk) profileNotes.push("يميل لشراء الطرود والكميات العائلية الموفرة");
          if (customerProfile.avgBasketSYP > 0) profileNotes.push(`متوسط فاتورته المعتاد: ${customerProfile.avgBasketSYP} ل.س`);
          if (customerProfile.orderCount > 0) profileNotes.push(`عدد طلباته السابقة: ${customerProfile.orderCount}`);
        }
        const profileBlock = profileNotes.length
          ? `ذاكرة الزبون المختصرة (استخدمها بلطف لتخصيص الاقتراحات دون إزعاجه): ${profileNotes.join(" | ")}. `
          : "";

        systemInstruction =
          `أنت "${pName}" (${pRole}${pTone ? " - نبرة: " + pTone : ""})، مساعد مبيعات بشري ذكي في متجر معاذ بقرية العوينة. ` +
          (pStyle ? `أسلوبك المميز: ${pStyle}. ` : "") +
          profileBlock +
          `تحدث ${shopDialect} بروح الشخصية 100%، واجعل ردك قصيراً وذكياً وطبيعياً (8 إلى 22 كلمة) بدون رموز تعبيرية أو أحرف إنجليزية. ` +
          `مهمتك: فهم الطلبات المركّبة والعامية (مثل الميزانية، عدد الأشخاص، الوجبات أو السهرات)، واختيار أصناف متوفرة حصراً من قائمة المنتجات المرفقة مع تقدير الكمية المناسبة (qty) لكل صنف بحيث لا تتجاوز الميزانية إن ذُكرت. ` +
          `يُمنع منعاً باتاً التدخل في الدفع أو شام كاش أو الإيصالات أو التحويلات. ` +
          'أجب بصيغة JSON فقط: {"mood": "happy|choice|helpful", "reply": "رد بشري شامي بأسلوب الشخصية", "parsedIntent": {"budgetSYP": null, "peopleCount": null}, "items": [{"id": "PROD_ID", "qty": 1, "reason": "سبب قصير"}], "choices": [{"id": "PROD_ID", "label": "اسم الصنف", "reason": "سبب قصير"}]}';

        const historyStr = convHistory.length
          ? convHistory.map(m => `${m.role === "assistant" ? pName : "الزبون"}: ${String(m.text || "").slice(0, 140)}`).join("\n")
          : "بداية المحادثة";

        const outOfStockCtx = body.outOfStockContext && typeof body.outOfStockContext === "object" ? body.outOfStockContext : null;
        const oosNote = outOfStockCtx
          ? `\nتنبيه نفاد: الصنف المطلوب (${String(outOfStockCtx.requestedName || "").slice(0, 80)}) نافد حالياً في الفرع، والبدائل المتوفرة هي: ${JSON.stringify(outOfStockCtx.alternatives || [])}. اكتب في حقل reply جملة إقناع شامية قصيرة ومقنعة بأسلوب الشخصية تشرح فيها سبب التبديل وميزة البديل أو سعره دون مبالغة أو ضغط.`
          : "";

        userParts.push({
          text: `سجل آخر الرسائل:\n${historyStr}\n\nالمنتجات المتوفرة حالياً:\n${JSON.stringify(catalogSummary)}\n\nالسلة الحالية: ${JSON.stringify(currentCart)}${oosNote}\nطلب الزبون الآن: ${promptText}`
        });
      }

      const geminiPayload = {
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: "user", parts: userParts }],
        generationConfig: { temperature: 0.35, responseMimeType: "application/json" }
      };

      let gemData = null;
      let usedModel = candidateModels[0];
      let lastErrorMsg = "Gemini API error";
      let succeeded = false;

      outer: for (const apiKey of allApiKeys) {
        for (const modelName of candidateModels) {
          usedModel = modelName;
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(apiKey)}`;
          try {
            const gemRes = await fetch(endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(geminiPayload),
              signal: AbortSignal.timeout(9500)
            });
            gemData = await gemRes.json();
            if (gemRes.ok) { succeeded = true; break outer; }
            lastErrorMsg = gemData?.error?.message || `HTTP ${gemRes.status}`;
          } catch (e) {
            lastErrorMsg = e?.message || "Fetch error";
          }
        }
      }

      if (!succeeded) {
        return new Response(JSON.stringify({ ok: false, error: lastErrorMsg }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const rawText = gemData?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      const parsed = safeParseJsonObject(rawText);

      return new Response(JSON.stringify({ ok: true, mode, model: usedModel, data: parsed }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } catch (err) {
      return new Response(JSON.stringify({ ok: false, error: err?.message || "Worker exception" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};
