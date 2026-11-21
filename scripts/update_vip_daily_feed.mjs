// ============================================================================
// سكربت التحديث اليومي التلقائي لغرف VIP وصورها (scripts/update_vip_daily_feed.mjs)
// - يولّد بطاقات وصور SVG خفيفة جداً وسريعة التحميل في مجلد vip_media/
//   (تمارين كابتن صخر، طبخات الشيف الذهبي، صور فادي المضحكة، وبطاقات بقية الغرف)
// - يحدّث ملف vip_media/daily_vip_feed.json يومياً ليُحمّل تلقائياً على جوال المشترك
// - يعمل محلياً دون استهلاك حصة Gemini API، مع إمكانية استخدام المفاتيح المعتمدة فقط عند الرغبة
// ============================================================================

import fs from "node:fs";
import path from "node:path";

const MEDIA_DIR = path.resolve("vip_media");
fs.mkdirSync(MEDIA_DIR, { recursive: true });

function makeCardSVG(title, subtitle, accent, icon) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="320" viewBox="0 0 640 320">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#121622"/>
      <stop offset="100%" stop-color="#0a0d14"/>
    </linearGradient>
  </defs>
  <rect width="640" height="320" rx="22" fill="url(#bg)"/>
  <rect x="10" y="10" width="620" height="300" rx="18" fill="none" stroke="${accent}" stroke-width="3" stroke-opacity="0.7"/>
  <circle cx="540" cy="160" r="64" fill="${accent}" fill-opacity="0.14" stroke="${accent}" stroke-width="2.5"/>
  <text x="540" y="178" font-size="52" text-anchor="middle">${icon}</text>
  <text x="445" y="135" fill="${accent}" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="end">${title}</text>
  <text x="445" y="185" fill="#e5e7eb" font-family="sans-serif" font-size="18" text-anchor="end">${subtitle}</text>
  <text x="445" y="245" fill="#9ca3af" font-family="sans-serif" font-size="13" text-anchor="end">متجر معاذ • غرف VIP اليومية</text>
</svg>`;
}

const ASSETS = [
  { file: "coach_warmup.svg", title: "إحماء وتنشيط المفاصل", sub: "5 دقائق حركة خفيفة قبل التمرين", accent: "#10b981", icon: "🔥" },
  { file: "coach_pushup.svg", title: "تمرين الضغط (Push-Up)", sub: "ظهر مستقيم • نزول متوازن • 4×12", accent: "#10b981", icon: "💪" },
  { file: "coach_plank.svg", title: "تمرين البلانك (Plank)", sub: "شد الجذع والبطن • ثبات 3×40 ثانية", accent: "#10b981", icon: "🏋️" },
  { file: "coach_squat.svg", title: "تمرين السكوات (Squat)", sub: "نزول متوازن للأرجل • 4×15 تكرار", accent: "#10b981", icon: "🦵" },
  { file: "coach_cardio.svg", title: "كارديو وحرق سريع", sub: "قفز خفيف ورفع ركبتين بنشاط", accent: "#10b981", icon: "⚡" },
  { file: "coach_stretch.svg", title: "إطالة واستشفاء عضلي", sub: "تمدد هادئ وتنفس عميق بعد التمرين", accent: "#10b981", icon: "🧘" },
  { file: "chef_maqlouba.svg", title: "مقلوبة باذنجان أصلية", sub: "طبقات مقرمشة مع رز متبل بالبهارات", accent: "#f59e0b", icon: "🍲" },
  { file: "chef_moujaddara.svg", title: "مجدرة برغل بالزيت", sub: "برغل وعدس مع بصل مقرمش وكمون", accent: "#f59e0b", icon: "🥘" },
  { file: "chef_bechamel.svg", title: "معكرونة بالبشاميل", sub: "صوص كريمي غني مع جبن محمّر", accent: "#f59e0b", icon: "🍝" },
  { file: "layla_hospitality.svg", title: "جناح الضيافة الملكي", sub: "تنسيق القهوة والحلويات بذوق راقٍ", accent: "#ec4899", icon: "👑" },
  { file: "farid_pantry.svg", title: "دفتر مؤونة البيت المنظم", sub: "تدقيق الأساسيات وتوازن الميزانية", accent: "#8b5cf6", icon: "🎩" },
  { file: "fadi_comic_1.svg", title: "موقف فادي الفرفوش", sub: "كيس الدكان يلي بدو كرسي لحالو!", accent: "#f97316", icon: "😂" },
  { file: "fadi_comic_2.svg", title: "كوميديا البراد اليومية", sub: "فتح البراد 5 مرات قبل ما يطلب!", accent: "#f97316", icon: "🤣" },
  { file: "zain_mission.svg", title: "مهمة كابتن زين اليومية", sub: "اجمع نقاط الخبرة XP ووقود الأبطال", accent: "#ef4444", icon: "⚡" },
  { file: "ryu_radar.svg", title: "رادار المحقق ريو", sub: "لغز اليوم وكشف أوفر الصفقات", accent: "#38bdf8", icon: "🕵️" },
  { file: "ritaj_mood.svg", title: "إشراقة ريتاج اليومية", sub: "اختر مزاجك واحصل على اقتراح لطيف", accent: "#f472b6", icon: "🌟" }
];

for (const a of ASSETS) {
  const outPath = path.join(MEDIA_DIR, a.file);
  fs.writeFileSync(outPath, makeCardSVG(a.title, a.sub, a.accent, a.icon), "utf8");
}

const today = new Date();
const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
const feedPayload = {
  updatedAt: today.toISOString(),
  dateKey: today.toISOString().slice(0, 10),
  dateLabel: today.toLocaleDateString("ar-SY"),
  dayIndex: dayOfYear,
  rooms: {
    coach_sakhr: {
      title: dayOfYear % 2 === 0 ? "قوة الجزء العلوي والجذع" : "قوة الأرجل والتحمل",
      categoryTag: dayOfYear % 2 === 0 ? "strength" : "legs",
      imageUrl: dayOfYear % 2 === 0 ? "vip_media/coach_pushup.svg" : "vip_media/coach_squat.svg",
      exercises: dayOfYear % 2 === 0
        ? [
            { name: "إحماء مفاصل وكتفين 5 دقائق", img: "vip_media/coach_warmup.svg" },
            { name: "تمرين ضغط 4×12 تكرار", img: "vip_media/coach_pushup.svg" },
            { name: "بلانك ثابت 3×40 ثانية", img: "vip_media/coach_plank.svg" },
            { name: "تمدد للصدر والذراعين 4 دقائق", img: "vip_media/coach_stretch.svg" }
          ]
        : [
            { name: "إحماء مشي بالمكان 5 دقائق", img: "vip_media/coach_warmup.svg" },
            { name: "سكوات حر 4×15 تكرار", img: "vip_media/coach_squat.svg" },
            { name: "كارديو خفيف 3 جولات", img: "vip_media/coach_cardio.svg" },
            { name: "إطالة للأرجل 5 دقائق", img: "vip_media/coach_stretch.svg" }
          ],
      nutritionTip: "وجبة بروتين (بيض أو عدس أو تونة) مع شرب الماء بانتظام بعد التمرين.",
      keywords: ["بيض", "عدس", "تونة", "حليب", "رز", "ماء"]
    },
    grand_chef: {
      recipeTitle: dayOfYear % 2 === 0 ? "مقلوبة باذنجان على أصولها" : "مجدرة برغل بالزيت والكمون",
      imageUrl: dayOfYear % 2 === 0 ? "vip_media/chef_maqlouba.svg" : "vip_media/chef_moujaddara.svg",
      baseServings: 4,
      ingredients: dayOfYear % 2 === 0
        ? [{ n: "رز", q: 2, u: "كوب" }, { n: "باذنجان", q: 2, u: "حبة" }, { n: "بطاطا", q: 2, u: "حبة" }, { n: "بندورة", q: 2, u: "حبة" }]
        : [{ n: "برغل خشن", q: 2, u: "كوب" }, { n: "عدس حب", q: 1, u: "كوب" }, { n: "بصل", q: 3, u: "حبات" }, { n: "زيت زيتون", q: 4, u: "ملاعق" }],
      steps: dayOfYear % 2 === 0
        ? ["قطّع الباذنجان والبطاطا واقلِهما حتى يأخذا لوناً ذهبياً.", "رتّب شرائح البندورة في قاع القدر ثم الخضار والرز.", "أضف المرق المتبل واتركها على نار هادئة 25 دقيقة."]
        : ["اسلق العدس نصف سلقة ثم أضف البرغل والملح والكمون.", "حمّر البصل بزيت الزيتون حتى يصبح مقرمشاً.", "اسكب المجدرة وزيّنها بالبصل المقرمش."],
      keywords: dayOfYear % 2 === 0 ? ["رز", "باذنجان", "بطاطا", "بندورة", "زيت"] : ["برغل", "عدس", "بصل", "زيتون", "كمون"]
    },
    friend_fadi: {
      joke: dayOfYear % 2 === 0
        ? "مرة واحد راح عالدكان بدو غرضين، طلع ومعو كيس كامل قال للمحاسب: هاد الكيس لحالو بدو كرسي!"
        : "واحد فتح البراد 5 مرات ورا بعض على أمل يطلع فيه شي جديد… وبالمرة السادسة اقتنع يطلب من متجر معاذ!",
      imageUrl: dayOfYear % 2 === 0 ? "vip_media/fadi_comic_1.svg" : "vip_media/fadi_comic_2.svg",
      moodPick: "تشكيلة سهرة ومتة وبزر وشيبس لرفع المزاج.",
      keywords: ["متة", "بزر", "شيبس", "بسكوت", "عصير"]
    }
  }
};

fs.writeFileSync(path.join(MEDIA_DIR, "daily_vip_feed.json"), JSON.stringify(feedPayload, null, 2), "utf8");
console.log(`تم تحديث ${ASSETS.length} صورة توضيحية وملف daily_vip_feed.json بنجاح!`);
