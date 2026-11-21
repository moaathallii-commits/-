// ============================================================================
// سكربت بناء مكتبة الأصوات البشرية الثابتة تلقائياً (scripts/generate_sounds.mjs)
// - يقرأ الشخصيات تلقائياً من ai_personas.js ومن ai_vip_personas.js إن وجد
// - يدعم أي شخصيات تُضاف مستقبلاً دون الحاجة لتعديل أسماء الشخصيات يدوياً
// - يولّد عدداً محدوداً في كل جولة (افتراضياً 12 مقطعاً) ضمن الحصة المجانية
// - يحوّل الصوت إلى MP3 عبر ffmpeg ويحفظه في sounds/<id>_<clip>.mp3
// - يتوقف بأمان عند 429 لحفظ ما تم توليده بالفعل دون خسارة أي مقطع
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";

const MAX_CLIPS_PER_RUN = Math.max(1, parseInt(process.env.MAX_CLIPS_PER_RUN || "12", 10));
const DELAY_BETWEEN_CALLS_MS = 4500;
const SOUNDS_DIR = path.resolve("sounds");
const PERSONAS_FILE = path.resolve("ai_personas.js");
const VIP_PERSONAS_FILE = path.resolve("ai_vip_personas.js");

const API_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2
]
  .map(k => String(k || "").trim())
  .filter(Boolean);

if (!API_KEYS.length) {
  console.error("لم يتم العثور على GEMINI_API_KEY في متغيرات البيئة (GitHub Secrets).");
  process.exit(1);
}

function loadAllPersonasDynamically() {
  const merged = {};

  const createBrowserSandbox = () => {
    const sandbox = {
      window: {},
      document: {
        getElementById: () => null,
        querySelector: () => null,
        querySelectorAll: () => [],
        createElement: () => ({ style: {}, setAttribute: () => {}, appendChild: () => {}, classList: { add: () => {}, remove: () => {} } }),
        head: { appendChild: () => {} },
        body: { appendChild: () => {} },
        addEventListener: () => {}
      },
      localStorage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
      },
      navigator: { onLine: true, vibrate: () => {} },
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      console
    };
    sandbox.window = sandbox;
    sandbox.globalThis = sandbox;
    return sandbox;
  };

  if (fs.existsSync(PERSONAS_FILE)) {
    const code = fs.readFileSync(PERSONAS_FILE, "utf8");
    const sandbox = createBrowserSandbox();
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);
    const baseMap = sandbox.MoaathAIPersonas?.PERSONAS || sandbox.window?.MoaathAIPersonas?.PERSONAS;
    if (baseMap && typeof baseMap === "object") {
      Object.assign(merged, baseMap);
    }
  }

  if (fs.existsSync(VIP_PERSONAS_FILE)) {
    const vipCode = fs.readFileSync(VIP_PERSONAS_FILE, "utf8");
    const vipSandbox = createBrowserSandbox();
    vm.createContext(vipSandbox);
    vm.runInContext(vipCode, vipSandbox);
    const vipMap =
      vipSandbox.MoaathVIPSystem?.personas ||
      vipSandbox.window?.MoaathVIPSystem?.personas ||
      vipSandbox.VIP_PERSONAS;
    if (vipMap && typeof vipMap === "object") {
      for (const [id, p] of Object.entries(vipMap)) {
        if (!merged[id] && p && typeof p === "object") {
          merged[id] = p;
        }
      }
    }
  }

  if (!Object.keys(merged).length) {
    throw new Error("تعذر قراءة أي شخصيات من ai_personas.js أو ai_vip_personas.js");
  }
  return merged;
}

function getCoreClipPhrasesForPersona(persona) {
  if (!persona) return [];
  const pickFirst = (arr, fallback) => (Array.isArray(arr) && arr.length ? arr[0] : (fallback || ""));
  const addedSample = Array.isArray(persona.addedMsgs) && typeof persona.addedMsgs[0] === "function"
    ? persona.addedMsgs[0]("صنف واحد")
    : "تمت إضافة صنف واحد إلى السلة.";
  const pName = persona.name || "المساعد";

  return [
    { key: "greet", text: persona.greet || pickFirst(persona.greets, `أهلاً بك مع ${pName} في متجر معاذ.`) },
    { key: "greetMorning", text: pickFirst(persona.timeGreets?.morning, persona.greet || `صباح الخير مع ${pName}.`) },
    { key: "greetEvening", text: pickFirst(persona.timeGreets?.evening, persona.greet || `مساء الخير مع ${pName}.`) },
    { key: "chatGood", text: persona.chatGood || pickFirst(persona.chatGoods, "أنا بخير والحمد لله، كيف يمكنني خدمتك اليوم؟") },
    { key: "thanks", text: persona.thanks || pickFirst(persona.thanksList, "العفو، يسعدني دائماً خدمتك.") },
    { key: "added", text: addedSample },
    { key: "itemsReady", text: typeof persona.itemsReady === "function" ? persona.itemsReady("") : "عرضت لك الأصناف المتوفرة، حدد الكمية." },
    { key: "alternative", text: pickFirst(persona.alternativeReplies, "عرضت لك أقرب البدائل المتوفرة في الفرع.") },
    { key: "habit", text: pickFirst(persona.habitReplies, "هذه اختياراتك المعتادة والمتوفرة حالياً.") },
    { key: "notFound", text: persona.notFound || pickFirst(persona.notFounds, "لم أجد صنفاً مطابقاً متوفراً الآن.") }
  ].filter(x => x.text && String(x.text).trim());
}

function normalizeTextForSpeech(rawText) {
  const smallMap = {
    "0": "صفر", "1": "واحد", "2": "اثنين", "3": "ثلاثة", "4": "أربعة",
    "5": "خمسة", "6": "ستة", "7": "سبعة", "8": "ثمانية", "9": "تسعة", "10": "عشرة"
  };
  return String(rawText || "")
    .replace(/\b1\s*(مواد|قطع|اصناف|أصناف)\b/g, "صنف واحد")
    .replace(/\b2\s*(مواد|قطع|اصناف|أصناف)\b/g, "صنفين")
    .replace(/\b(\d+)\s*%/g, "$1 بالمئة")
    .replace(/\b(\d+)\s*ل\.?س\b/g, "$1 ليرة")
    .replace(/\b([0-9]|10)\b/g, m => smallMap[m] || m)
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, " ")
    .replace(/[A-Za-z_]+/g, " ")
    .replace(/[•\-_*#|()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function convertPcmToMp3(pcmBuffer, sampleRate, outMp3Path) {
  const tmpPcm = outMp3Path + ".pcm";
  fs.writeFileSync(tmpPcm, pcmBuffer);
  try {
    execFileSync("ffmpeg", [
      "-y",
      "-f", "s16le",
      "-ar", String(sampleRate),
      "-ac", "1",
      "-i", tmpPcm,
      "-codec:a", "libmp3lame",
      "-b:a", "64k",
      outMp3Path
    ], { stdio: "ignore" });
  } finally {
    if (fs.existsSync(tmpPcm)) fs.unlinkSync(tmpPcm);
  }
}

async function generateClip(persona, spokenText, keyIndexRef) {
  const genderLabel = persona.gender === "female" ? "أنثوي" : "ذكري";
  const tonePrefix = `نوع الصوت: ${genderLabel}${persona.toneTag ? `، النبرة: ${persona.toneTag}` : ""}`;
  const styleHint = persona.styleHint || "تحدث بصوت بشري طبيعي وواضح";

  for (let attempt = 0; attempt < API_KEYS.length; attempt++) {
    const idx = (keyIndexRef.value + attempt) % API_KEYS.length;
    const key = API_KEYS[idx];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${encodeURIComponent(key)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${tonePrefix}، ${styleHint}. انطق الجملة التالية بشكل طبيعي وواضح: ${spokenText}`
          }]
        }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: persona.voiceName || "Puck" }
            }
          }
        }
      })
    });

    if (res.ok) {
      const json = await res.json();
      const part = json?.candidates?.[0]?.content?.parts?.find(p => p?.inlineData?.data);
      if (part?.inlineData?.data) {
        keyIndexRef.value = (idx + 1) % API_KEYS.length;
        const rateMatch = String(part.inlineData.mimeType || "").match(/rate=(\d+)/i);
        const rate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
        return { pcmBuffer: Buffer.from(part.inlineData.data, "base64"), rate };
      }
    } else if (res.status === 429) {
      console.warn(`المفتاح رقم ${idx + 1} وصل للحد اليومي (429).`);
      continue;
    } else {
      const txt = await res.text().catch(() => "");
      console.warn(`خطأ HTTP ${res.status}: ${txt.slice(0, 120)}`);
    }
  }
  return null;
}

async function main() {
  fs.mkdirSync(SOUNDS_DIR, { recursive: true });
  const personas = loadAllPersonasDynamically();
  const tasks = [];

  for (const persona of Object.values(personas)) {
    if (!persona || !persona.id) continue;
    const clips = getCoreClipPhrasesForPersona(persona);
    for (const clip of clips) {
      const outPath = path.join(SOUNDS_DIR, `${persona.id}_${clip.key}.mp3`);
      if (fs.existsSync(outPath) && fs.statSync(outPath).size > 512) continue;
      tasks.push({ persona, clip, outPath });
    }
  }

  console.log(`إجمالي الشخصيات المكتشفة: ${Object.keys(personas).length} | المقاطع الناقصة: ${tasks.length} | الحد الأقصى لهذه الجولة: ${MAX_CLIPS_PER_RUN}`);
  if (!tasks.length) {
    console.log("جميع المقاطع البشرية الأساسية مكتملة ومخزنة في sounds/!");
    return;
  }

  const keyIndexRef = { value: 0 };
  let created = 0;

  for (const task of tasks.slice(0, MAX_CLIPS_PER_RUN)) {
    const spokenText = normalizeTextForSpeech(task.clip.text);
    console.log(`توليد: ${path.basename(task.outPath)}...`);
    const audio = await generateClip(task.persona, spokenText, keyIndexRef);
    if (!audio) {
      console.warn("توقف مؤقت بسبب نفاد الحصة اليومية: سيتم حفظ المقاطع التي تم توليدها وإكمال الباقي غداً.");
      break;
    }
    convertPcmToMp3(audio.pcmBuffer, audio.rate, task.outPath);
    if (fs.existsSync(task.outPath) && fs.statSync(task.outPath).size > 512) {
      created++;
      console.log(`تم الحفظ بنجاح (${fs.statSync(task.outPath).size} بايت): ${path.basename(task.outPath)}`);
    } else {
      console.warn(`فشل التحقق من حجم الملف الناتج: ${path.basename(task.outPath)}`);
    }
    if (created < MAX_CLIPS_PER_RUN) {
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_CALLS_MS));
    }
  }

  console.log(`انتهت الجولة بنجاح - تم توليد ${created} مقطعاً جديداً.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
