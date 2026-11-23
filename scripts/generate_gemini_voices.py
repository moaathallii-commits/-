#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
مولّد ومحدّث مكتبة أصوات Gemini API البشرية الشامية لمتجر معاذ (تحديث سحابي تلقائي كل ساعة)
- يولّد دفعة ذكية في كل تشغيل (مثلاً 15 مقطعاً كل ساعة) لحماية الحصة المجانية وتوسيع المكتبة تدريجياً.
- يدعم تدوير عدة مفاتيح API تلقائياً (GEMINI_API_KEY, GEMINI_API_KEY_1, GEMINI_API_KEY_2, GEMINI_API_KEY_3).
- يحفظ الملفات في مجلد sounds_gemini/ ويبني فهرس sounds_gemini_manifest.json لتنزيلها إلى ذاكرة هواتف الزبائن.
"""

import base64
import json
import os
import struct
import time
import urllib.error
import urllib.request

OUT_DIR = "sounds_gemini"
MANIFEST_PATH = "sounds_gemini_manifest.json"
MAX_CLIPS_PER_RUN = int(os.environ.get("MAX_CLIPS_PER_RUN", "15"))
DELAY_BETWEEN_CALLS = float(os.environ.get("DELAY_BETWEEN_CALLS", "4.5"))
TTS_MODEL = os.environ.get("GEMINI_TTS_MODEL", "gemini-2.5-flash-preview-tts")

# جمع جميع مفاتيح Gemini المتوفرة في GitHub Secrets لتدويرها تلقائياً
API_KEYS = []
for env_name in ["GEMINI_API_KEY", "GEMINI_API_KEY_1", "GEMINI_API_KEY_2", "GEMINI_API_KEY_3", "GEMINI_API_KEY_4"]:
    val = os.environ.get(env_name, "").strip()
    if val and val not in API_KEYS:
        API_KEYS.append(val)

# توزيع أصوات Gemini البشرية لـ 16 شخصية (8 أساسية + 8 VIP) باللهجة الشامية السورية
PERSONA_CONFIGS = {
    "buddy":          {"voice": "Puck",   "hint": "تحدث باللهجة الشامية السورية بصوت شاب دافئ ومبتسم وودود"},
    "lolo":           {"voice": "Kore",   "hint": "تحدثي باللهجة الشامية السورية بصوت أنثوي شاب مشرق وسريع ونشيط"},
    "noor":           {"voice": "Aoede",  "hint": "تحدثي باللهجة الشامية السورية بصوت أنثوي هادئ ودافئ ومريح للأعصاب"},
    "chef":           {"voice": "Charon", "hint": "تحدث باللهجة الشامية السورية بصوت رجولي واثق وعملي كطباخ ماهر"},
    "pastry":         {"voice": "Kore",   "hint": "تحدثي باللهجة الشامية السورية بصوت أنثوي ناعم ودافئ وحنون"},
    "athlete":        {"voice": "Fenrir", "hint": "تحدث باللهجة الشامية السورية بصوت شبابي قوي وسريع وحاسم"},
    "sheikh":         {"voice": "Puck",   "hint": "تحدث باللهجة الشامية السورية بصوت شبابي مرح ومشاغب وخفيف الدم"},
    "friend_saad":    {"voice": "Charon", "hint": "تحدث باللهجة الشامية السورية بصوت رجولي هادئ ومتزن وموثوق"},
    "coach_sakhr":    {"voice": "Fenrir", "hint": "تحدث باللهجة الشامية السورية بصوت جهوري عميق وحماسي كمدرب رياضي"},
    "grand_chef":     {"voice": "Charon", "hint": "تحدث باللهجة الشامية السورية بصوت وقور وفخم وواثق كشيف عالمي"},
    "princess_layla": {"voice": "Aoede",  "hint": "تحدثي باللهجة الشامية السورية بصوت أنثوي راقٍ وناعم وهادئ"},
    "butler_farid":   {"voice": "Orus",   "hint": "تحدث باللهجة الشامية السورية بصوت رجولي منضبط ودقيق ومنظم"},
    "friend_fadi":    {"voice": "Puck",   "hint": "تحدث باللهجة الشامية السورية بصوت شبابي عفوي ودافئ كصديق سهرة"},
    "anime_zain":     {"voice": "Puck",   "hint": "تحدث باللهجة الشامية السورية بصوت شبابي حيوي ومندفع وحماسي جداً"},
    "anime_ryu":      {"voice": "Charon", "hint": "تحدث باللهجة الشامية السورية بصوت شاب هادئ وذكي وتحليلي"},
    "anime_ritaj":    {"voice": "Kore",   "hint": "تحدثي باللهجة الشامية السورية بصوت أنثوي شاب مرح ومبهج ولطيف"},
}

# العبارات الأساسية ذات الأولوية القصوى لكل شخصية (تُبنى تدريجياً كل ساعة)
CORE_PHRASES = {
    "greet": [
        "يا أهلاً وسهلاً! نورت متجر معاذ. خبرني شو ببالك اليوم؟",
        "أهلاً بك يا غالي، المتجر منور بوجودك. بشو نبدأ سلتك اليوم؟"
    ],
    "greetMorning": [
        "صباح الخير والنشاط! نورت متجر معاذ، بشو نبدأ سلتك الصباحية؟"
    ],
    "greetEvening": [
        "مساء الخير والروقان! نورت متجر معاذ، شو نجهزلك الليلة؟"
    ],
    "chatGood": [
        "أنا بخير والحمد لله، كيف بقدر أساعدك اليوم؟"
    ],
    "thanks": [
        "العفو يا غالي، تكرم عينك ويسعدني دائماً أكون بخدمتك."
    ],
    "added": [
        "اختيار موفق، تمت إضافة الصنف إلى السلة بنجاح.",
        "ممتاز، صار طلبك جاهز بالسلة، نضيف شي تاني؟"
    ],
    "itemsReady": [
        "تفضل، عرضتلك الأصناف المتوفرة بالفرع هلق، حدد الكمية."
    ],
    "notFound": [
        "عذراً يا غالي، ما لقيت هاد الصنف متوفر هلق، جرب اسم أقرب."
    ]
}


def pcm_to_wav(pcm_bytes: bytes, sample_rate: int = 24000) -> bytes:
    header = bytearray(44)
    pcm_len = len(pcm_bytes)
    header[0:4] = b"RIFF"
    struct.pack_into("<I", header, 4, 36 + pcm_len)
    header[8:12] = b"WAVE"
    header[12:16] = b"fmt "
    struct.pack_into("<I", header, 16, 16)
    struct.pack_into("<H", header, 20, 1)
    struct.pack_into("<H", header, 22, 1)
    struct.pack_into("<I", header, 24, sample_rate)
    struct.pack_into("<I", header, 28, sample_rate * 2)
    struct.pack_into("<H", header, 32, 2)
    struct.pack_into("<H", header, 34, 16)
    header[36:40] = b"data"
    struct.pack_into("<I", header, 40, pcm_len)
    return bytes(header) + pcm_bytes


def call_gemini_tts(api_key: str, text: str, voice_name: str, style_hint: str):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{TTS_MODEL}:generateContent?key={api_key}"
    prompt_text = f"{style_hint}. اقرأ الجملة التالية بصوت بشري طبيعي 100% دون أي إضافات: {text}"
    payload = {
        "contents": [{"parts": [{"text": prompt_text}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "voiceConfig": {
                    "prebuiltVoiceConfig": {"voiceName": voice_name}
                }
            }
        }
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
        for part in parts:
            inline = part.get("inlineData") or {}
            b64 = inline.get("data")
            mime = inline.get("mimeType", "")
            if b64:
                raw = base64.b64decode(b64)
                if "pcm" in mime.lower() or "l16" in mime.lower():
                    return pcm_to_wav(raw, 24000), None
                return raw, None
        return None, "NO_AUDIO_IN_RESPONSE"
    except urllib.error.HTTPError as e:
        return None, f"HTTP_{e.code}"
    except Exception as e:
        return None, str(e)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    if not API_KEYS:
        print("⚠️ No GEMINI_API_KEY found in environment secrets. Skipping generation.")
        return

    manifest = {"version": "3.0-gemini-cloud", "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "personas": {}}
    generated_now = 0
    skipped_existing = 0
    key_idx = 0

    for pid, cfg in PERSONA_CONFIGS.items():
        manifest["personas"][pid] = {}
        for intent, phrases in CORE_PHRASES.items():
            manifest["personas"][pid][intent] = []
            for idx, text in enumerate(phrases, start=1):
                fname = f"{pid}_{intent}_{idx}.wav"
                rel_path = f"{OUT_DIR}/{fname}"

                if os.path.exists(rel_path) and os.path.getsize(rel_path) > 1000:
                    skipped_existing += 1
                    manifest["personas"][pid][intent].append({"text": text, "file": rel_path})
                    continue

                if generated_now >= MAX_CLIPS_PER_RUN:
                    continue

                success = False
                for _ in range(len(API_KEYS)):
                    current_key = API_KEYS[key_idx % len(API_KEYS)]
                    key_idx += 1
                    audio_bytes, err = call_gemini_tts(current_key, text, cfg["voice"], cfg["hint"])
                    if audio_bytes and len(audio_bytes) > 1000:
                        with open(rel_path, "wb") as f:
                            f.write(audio_bytes)
                        manifest["personas"][pid][intent].append({"text": text, "file": rel_path})
                        generated_now += 1
                        success = True
                        print(f"[OK] {rel_path} ({len(audio_bytes)} bytes)")
                        break
                    else:
                        print(f"[WARN] {rel_path} failed with key #{key_idx}: {err}")
                        if err == "HTTP_429":
                            continue
                        break

                if not success:
                    print(f"[STOP] Quota or error reached on {rel_path}")
                time.sleep(DELAY_BETWEEN_CALLS)

    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print(f"Summary: Generated={generated_now} | Existing={skipped_existing} | Keys={len(API_KEYS)}")


if __name__ == "__main__":
    main()
