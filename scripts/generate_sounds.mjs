// ============================================================================
// سكربت بناء مكتبة الأصوات البشرية الثابتة تلقائياً (scripts/generate_sounds.mjs)
// - يقرأ الشخصيات العشر وعباراتها الأساسية مباشرة من ai_personas.js
// - يولّد عدداً محدوداً يومياً (افتراضياً 12 مقطعاً) ضمن الحصة المجانية
// - يحوّل الصوت إلى MP3 خفيف عبر ffmpeg ويحفظه في sounds/<id>_<clip>.mp3
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

const API_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_3
]
  .map(k => String(k || "").trim())
  .filter(Boolean);

if (!API_KEYS.length) {
  console.error("❌ لم يتم العثور على GEMINI_API_KEY في متغيرات البيئة (GitHub Secrets).");
  process.exit(1);
}

function loadPersonas() {
  const code = fs.readFileSync(PERSONAS_FILE, "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  const personas = sandbox.window?.MoaathAIPersonas?.PERSONAS;
  if (!personas || typeof personas !== "object") {
    throw new Error("تعذر قراءة window.MoaathAIPersonas.PERSONAS من ai_personas.js");
  }
  return personas;
}

function getCoreClipPhrasesForPersona(persona) {
  const pickFirst = (arr, fallback) => (Array.isArray(arr) && arr.length ? arr[0] : (fallback || ""));
  const addedSample = Array.isArray(persona.addedMsgs) && typeof persona.addedMsgs[0] === "function"
    ? persona.addedMsgs[0]("صنف واحد")
    : "تمت إضافة صنف واحد إلى السلة.";

  return [
    { key: "greet", text: persona.greet || pickFirst(persona.greets, "") },
    { key: "greetMorning", text: pickFirst(persona.timeGreets?.morning, persona.greet) },
    { key: "greetEvening", text: pickFirst(persona.timeGreets?.evening, persona.greet) },
    { key: "chatGood", text: persona.chatGood || pickFirst(persona.chatGoods, "") },
    { key: "thanks", text: persona.thanks || pickFirst(persona.thanksList, "") },
    { key: "added", text: addedSample },
    { key: "itemsReady", text: typeof persona.itemsReady === "function" ? persona.itemsReady("") : "" },
    { key: "alternative", text: pickFirst(persona.alternativeReplies, "") },
    { key: "habit", text: pickFirst(persona.habitReplies, "") },
    { key: "notFound", text: persona.notFound || pickFirst(persona.notFounds, "") }
  ].filter(x => x.text && x.text.trim());
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
    .replace(/[\u{1F300}-\u{1FAFF}🐾✨🎤🎧🎙️🤔🤩💡📌📍🔊🔇🗣️🍲🌸🛍️🔁⏰✅⚠️🔒🔄🧚🧉🍰💰🛒]/gu, " ")
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
  const tonePrefix = `نوع الصوت: ${genderLabel}${persona.toneTag ? "، النبرة: " + persona.toneTag : ""}`;
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
            text: `${tonePrefix}. ${styleHint}. انطق الجملة التالية بشكل طبيعي وواضح: ${spokenText}`
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
      console.warn(`⚠️ المفتاح رقم ${idx + 1} وصل للحد اليومي (429).`);
      continue;
    } else {
      const txt = await res.text().catch(() => "");
      console.warn(`⚠️ خطأ HTTP ${res.status}: ${txt.slice(0, 120)}`);
    }
  }
  return null;
}

async function main() {
  fs.mkdirSync(SOUNDS_DIR, { recursive: true });
  const personas = loadPersonas();
  const tasks = [];

  for (const persona of Object.values(personas)) {
    const clips = getCoreClipPhrasesForPersona(persona);
    for (const clip of clips) {
      const outPath = path.join(SOUNDS_DIR, `${persona.id}_${clip.key}.mp3`);
      if (fs.existsSync(outPath) && fs.statSync(outPath).size > 1024) continue;
      tasks.push({ persona, clip, outPath });
    }
  }

  console.log(`📋 المقاطع الناقصة حالياً: ${tasks.length} | الحد الأقصى لهذه الجولة: ${MAX_CLIPS_PER_RUN}`);
  if (!tasks.length) {
    console.log("✅ جميع المقاطع البشرية الأساسية (100 مقطع) مكتملة ومخزنة في sounds/!");
    return;
  }

  const keyIndexRef = { value: 0 };
  let created = 0;

  for (const task of tasks.slice(0, MAX_CLIPS_PER_RUN)) {
    const spokenText = normalizeTextForSpeech(task.clip.text);
    console.log(`🎙️ توليد: ${path.basename(task.outPath)} ...`);
    const audio = await generateClip(task.persona, spokenText, keyIndexRef);

    if (!audio) {
      console.warn("🛑 توقف مؤقت بسبب نفاد الحصة اليومية؛ سيتم حفظ المقاطع التي تم توليدها وإكمال الباقي غداً.");
      break;
    }

    convertPcmToMp3(audio.pcmBuffer, audio.rate, task.outPath);
    created++;
    console.log(`✅ تم الحفظ: ${path.basename(task.outPath)}`);

    if (created < MAX_CLIPS_PER_RUN) {
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_CALLS_MS));
    }
  }

  console.log(`🎉 انتهت الجولة بنجاح — تم توليد ${created} مقطعاً جديداً.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
