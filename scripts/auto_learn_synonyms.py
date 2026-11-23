#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
نظام التعلم الذاتي السحابي للمرادفات لمتجر معاذ (الخطوة 4)
- يقرأ الاستعلامات غير المطابقة (ai_brain/unmatched_queries) وقائمة المنتجات (products) من Firebase RTDB.
- يستخدم Gemini API (مع تدوير المفاتيح تلقائياً) لربط الكلمات العامية الشامية بأقرب صنف متوفر في المتجر.
- يحفظ المرادفات المكتشفة في synonyms_auto.json ليقرأها ai_engine.js محلياً بـ 0 استهلاك API أثناء تسوق الزبون.
"""

import json
import os
import time
import urllib.error
import urllib.request

FIREBASE_DB_URL = os.environ.get(
    "FIREBASE_DB_URL",
    "https://moaathstore-d2fd6-default-rtdb.firebaseio.com"
).rstrip("/")
OUT_PATH = "synonyms_auto.json"
MODEL_NAME = os.environ.get("GEMINI_TEXT_MODEL", "gemini-2.5-flash-lite")

API_KEYS = []
for env_name in ["GEMINI_API_KEY", "GEMINI_API_KEY_1", "GEMINI_API_KEY_2", "GEMINI_API_KEY_3", "GEMINI_API_KEY_4"]:
    val = os.environ.get(env_name, "").strip()
    if val and val not in API_KEYS:
        API_KEYS.append(val)


def fetch_json(url: str, timeout: int = 20):
    req = urllib.request.Request(url, headers={"User-Agent": "MoaathStore-AutoLearn/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"[WARN] fetch_json failed for {url}: {e}")
        return None


def call_gemini_synonyms(unmatched_queries, product_names):
    if not API_KEYS:
        print("⚠️ No GEMINI_API_KEY configured.")
        return []

    prompt = (
        "أنت خبير لهجة شامية سورية ومدير مخزون لمتجر معاذ في قرية العوينة.\n"
        "لديك قائمة استعلامات بحث كتبها الزبائن ولم يجدوا لها نتيجة مباشرة، ولديك قائمة أسماء المنتجات الفعلية في المتجر.\n"
        "مهمتك: اربط كل استعلام عامي أو به خطأ إملائي بأقرب كلمة مفتاحية موجودة فعلياً في أسماء المنتجات.\n"
        "أعد النتيجة بصيغة JSON فقط بهذا الشكل:\n"
        '{"synonym_groups": [["الكلمة_العامية", "الكلمة_الموجودة_في_المنتج"], ...]}\n'
        "شروط:\n"
        "- لا تخترع منتجات غير موجودة.\n"
        "- تجاهل أي استعلام عشوائي أو لا علاقة له بالبقالة والمنظفات.\n"
        "- كل مجموعة تحتوي على 2 إلى 4 كلمات قصيرة واضحة.\n\n"
        f"الاستعلامات غير المطابقة:\n{json.dumps(unmatched_queries, ensure_ascii=False)}\n\n"
        f"أسماء المنتجات في المتجر:\n{json.dumps(product_names[:180], ensure_ascii=False)}"
    )

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json"
        }
    }

    for idx, key in enumerate(API_KEYS, start=1):
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL_NAME}:generateContent?key={key}"
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=35) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            raw_txt = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "{}")
            parsed = json.loads(raw_txt)
            groups = parsed.get("synonym_groups", [])
            if isinstance(groups, list):
                print(f"[OK] Gemini returned {len(groups)} synonym groups using key #{idx}.")
                return groups
        except urllib.error.HTTPError as e:
            print(f"[WARN] Key #{idx} HTTP_{e.code}")
            if e.code == 429:
                continue
        except Exception as e:
            print(f"[WARN] Key #{idx} error: {e}")

    return []


def load_existing_file():
    if os.path.exists(OUT_PATH):
        try:
            with open(OUT_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, dict) and isinstance(data.get("groups"), list):
                return data
        except Exception:
            pass
    # مرادفات شامية أساسية كبذرة أولية مضمونة
    return {
        "version": "1.0-auto-synonyms",
        "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "groups": [
            ["بندورة", "طماطم", "بندوره"],
            ["بطاطا", "بطاطس"],
            ["لبن", "زبادي", "رايب"],
            ["دواء جلي", "سائل جلي", "فيري", "جلي"],
            ["دواء غسيل", "مسحوق غسيل", "تايد", "برسيل"],
            ["محارم", "مناديل", "كلينكس"],
            ["بسكوت", "بسكويت"],
            ["شوكولا", "شوكولاتة", "شوكولاته"],
            ["معكرونة", "مكرونة", "سباغيتي"],
            ["رز", "أرز", "ارز"]
        ]
    }


def merge_groups(existing_groups, new_groups):
    seen = set()
    merged = []
    for grp in existing_groups + new_groups:
        if not isinstance(grp, list):
            continue
        clean = []
        for w in grp:
            s = str(w or "").strip()
            if len(s) >= 2 and s not in clean:
                clean.append(s)
        if len(clean) >= 2:
            sig = "|".join(sorted(clean))
            if sig not in seen:
                seen.add(sig)
                merged.append(clean)
    return merged[:250]


def main():
    existing = load_existing_file()
    products_raw = fetch_json(f"{FIREBASE_DB_URL}/products.json") or {}
    unmatched_raw = fetch_json(f"{FIREBASE_DB_URL}/ai_brain/unmatched_queries.json") or {}

    product_names = []
    if isinstance(products_raw, dict):
        for p in products_raw.values():
            if isinstance(p, dict) and p.get("name"):
                product_names.append(str(p["name"]).strip())

    unmatched_queries = []
    if isinstance(unmatched_raw, dict):
        items = sorted(
            [v for v in unmatched_raw.values() if isinstance(v, dict) and v.get("query")],
            key=lambda x: int(x.get("count", 1)),
            reverse=True
        )
        unmatched_queries = [str(x["query"]).strip() for x in items[:40]]

    new_groups = []
    if unmatched_queries and product_names:
        new_groups = call_gemini_synonyms(unmatched_queries, product_names)
    else:
        print(f"[INFO] Skipping Gemini call (unmatched={len(unmatched_queries)}, products={len(product_names)}).")

    merged = merge_groups(existing.get("groups", []), new_groups)
    output = {
        "version": "1.0-auto-synonyms",
        "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "totalGroups": len(merged),
        "groups": merged
    }

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Summary: TotalGroups={len(merged)} | NewlyLearned={len(new_groups)} | Keys={len(API_KEYS)}")


if __name__ == "__main__":
    main()
