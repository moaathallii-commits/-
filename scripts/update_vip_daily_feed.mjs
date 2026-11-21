// ============================================================================
// سكربت التحديث اليومي التلقائي لغرف VIP وصورها (scripts/update_vip_daily_feed.mjs)
// - يولد بطاقات وصور SVG خفيفة جداً وسريعة التحميل في مجلد vip_media/
// - يحدّث ملف vip_media/daily_vip_feed.json يومياً لجميع الشخصيات الثماني:
//   (كابتن صخر، الشيف الذهبي، الأميرة ليلى، السيد فريد، فادي الفرفوش،
//    كابتن زين، المحقق ريو، وريتاج)
// - يعمل محلياً دون استهلاك حصة Gemini API ويدعم الكاش الدائم على الهاتف
// - معزول تماماً عن الدفع وشام كاش والإيصالات المالية
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
  <text x="445" y="245" fill="#9ca3af" font-family="sans-serif" font-size="13" text-anchor="end">غرف VIP اليومية • متجر معاذ</text>
</svg>`;
}

const ASSETS = [
  { file: "coach_warmup.svg", title: "إحماء وتنشيط المفاصل", sub: "5 دقائق حركة خفيفة قبل التمرين", accent: "#10b981", icon: "🔥" },
  { file: "coach_pushup.svg", title: "تمرين الضغط (Push-Up)", sub: "4×12 تكرار • ظهر مستقيم", accent: "#10b981", icon: "💪" },
  { file: "coach_plank.svg", title: "تمرين البلانك (Plank)", sub: "شد الجذع والبطن • ثبات 3×40 ثانية", accent: "#10b981", icon: "⏱️" },
  { file: "coach_squat.svg", title: "تمرين السكوات (Squat)", sub: "نزول متوازن للأرجل • 4×15 تكرار", accent: "#10b981", icon: "🏋️" },
  { file: "coach_cardio.svg", title: "كارديو وحرق سريع", sub: "قفز خفيف ورفع ركبتين بنشاط", accent: "#10b981", icon: "⚡" },
  { file: "coach_stretch.svg", title: "إطالة واستشفاء عضلي", sub: "تمدد هادئ وتنفس عميق بعد التمرين", accent: "#10b981", icon: "🧘" },
  { file: "chef_maqlouba.svg", title: "مقلوبة باذنجان أصلية", sub: "طبقات مقرمشة مع رز متبل بالبهارات", accent: "#f59e0b", icon: "🍲" },
  { file: "chef_moujaddara.svg", title: "مجدرة برغل بالزيت", sub: "برغل وعدس مع بصل مقرمش وكمون", accent: "#f59e0b", icon: "🍛" },
  { file: "chef_bechamel.svg", title: "معكرونة بالبشاميل", sub: "صوص كريمي غني مع جبن محمر", accent: "#f59e0b", icon: "🧀" },
  { file: "layla_hospitality.svg", title: "جناح الضيافة الملكي", sub: "تنسيق القهوة والحلويات بذوق راقٍ", accent: "#ec4899", icon: "👑" },
  { file: "farid_pantry.svg", title: "دفتر مؤونة البيت المنظم", sub: "تدقيق الأساسيات وتوازن الميزانية", accent: "#8b5cf6", icon: "📋" },
  { file: "fadi_comic_1.svg", title: "موقف فادي الفرفوش", sub: "كيس الدكان يلي بدو كرسي لحالو!", accent: "#f97316", icon: "😂" },
  { file: "fadi_comic_2.svg", title: "كوميديا البراد اليومية", sub: "فتح البراد 5 مرات قبل ما يطلب", accent: "#f97316", icon: "🤣" },
  { file: "zain_mission.svg", title: "مهمة كابتن زين اليومية", sub: "اجمع نقاط الخبرة XP ووقود الأبطال", accent: "#ef4444", icon: "⚔️" },
  { file: "ryu_radar.svg", title: "رادار المحقق ريو", sub: "لغز اليوم وكشف أوفر الصفقات", accent: "#38bdf8", icon: "🔍" },
  { file: "ritaj_mood.svg", title: "إشراقة ريتاج اليومية", sub: "اختر مزاجك واحصل على اقتراح لطيف", accent: "#f472b6", icon: "🌸" }
];

for (const a of ASSETS) {
  const outPath = path.join(MEDIA_DIR, a.file);
  fs.writeFileSync(outPath, makeCardSVG(a.title, a.sub, a.accent, a.icon), "utf8");
}

const today = new Date();
const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
const mod2 = dayOfYear % 2;
const mod3 = dayOfYear % 3;

const COACH_ROTATIONS = [
  {
    title: "قوة الجزء العلوي والجذع",
    categoryTag: "strength",
    imageUrl: "vip_media/coach_pushup.svg",
    exercises: [
      { name: "إحماء مفاصل وكتفين 5 دقائق", img: "vip_media/coach_warmup.svg" },
      { name: "تمرين ضغط 4×12 تكرار", img: "vip_media/coach_pushup.svg" },
      { name: "بلانك ثابت 3×40 ثانية", img: "vip_media/coach_plank.svg" },
      { name: "تمدد للصدر والذراعين 4 دقائق", img: "vip_media/coach_stretch.svg" }
    ],
    nutritionTip: "وجبة بروتين (بيض أو عدس أو تونة خلال ساعتين بعد التمرين) مع شرب الماء بانتظام.",
    recoveryTip: "النوم الكافي وتمديد العضلات بعد التمرين يحميك من الشد العضلي غداً.",
    keywords: ["بيض", "عدس", "تونة", "حليب", "رز", "ماء"]
  },
  {
    title: "قوة الأرجل والتحمل",
    categoryTag: "legs",
    imageUrl: "vip_media/coach_squat.svg",
    exercises: [
      { name: "إحماء مشي بالمكان 5 دقائق", img: "vip_media/coach_warmup.svg" },
      { name: "سكوات حر 4×15 تكرار", img: "vip_media/coach_squat.svg" },
      { name: "لانجز أمامي 3×12 لكل رجل", img: "vip_media/coach_squat.svg" },
      { name: "إطالة للأرجل 5 دقائق", img: "vip_media/coach_stretch.svg" }
    ],
    nutritionTip: "اشرب كوبين ماء قبل وبعد التمرين لتعويض السوائل ودعم الأداء العضلي.",
    recoveryTip: "راحة الأرجل بعد تمرين التحمل تعزز نمو القوة دون إجهاد زائد.",
    keywords: ["ماء", "حليب", "شوفان", "رز", "بيض"]
  },
  {
    title: "كارديو وحرق دهون سريع",
    categoryTag: "cardio",
    imageUrl: "vip_media/coach_cardio.svg",
    exercises: [
      { name: "قفز حبل أو نط خفيف 4 جولات", img: "vip_media/coach_cardio.svg" },
      { name: "تسلق الجبل 3×30 ثانية", img: "vip_media/coach_plank.svg" },
      { name: "رفع ركبتين سريع 3×30 ثانية", img: "vip_media/coach_cardio.svg" },
      { name: "تهدئة وتنفس عميق 4 دقائق", img: "vip_media/coach_stretch.svg" }
    ],
    nutritionTip: "خفّف السكريات المسائية وركّز على الخضار واللبن والماء.",
    recoveryTip: "تهدئة نبض القلب تدريجياً في النهاية تجعل الانتعاش أسرع وأكثر أماناً.",
    keywords: ["ماء", "لبن", "خضار", "عصير", "شاي"]
  }
];

const CHEF_ROTATIONS = [
  {
    recipeTitle: "مقلوبة باذنجان على أصولها",
    imageUrl: "vip_media/chef_maqlouba.svg",
    baseServings: 4,
    ingredients: [
      { n: "رز", q: 2, u: "كوب" },
      { n: "باذنجان", q: 2, u: "حبة" },
      { n: "بطاطا", q: 2, u: "حبة" },
      { n: "بندورة", q: 2, u: "حبة" },
      { n: "بهار مشكل", q: 1, u: "ملعقة" }
    ],
    steps: [
      "قطّع الباذنجان والبطاطا شرائح واقلهما حتى يأخذا لوناً ذهبياً.",
      "رتّب شرائح البندورة في قاع القدر ثم الخضار والرز المغسول.",
      "أضف المرق المتبل واتركها تغلي ثم على نار هادئة 25 دقيقة."
    ],
    keywords: ["رز", "باذنجان", "بطاطا", "بندورة", "بهار", "زيت"]
  },
  {
    recipeTitle: "مجدرة برغل بالزيت والكمون",
    imageUrl: "vip_media/chef_moujaddara.svg",
    baseServings: 4,
    ingredients: [
      { n: "برغل خشن", q: 1.5, u: "كوب" },
      { n: "عدس حب", q: 1, u: "كوب" },
      { n: "بصل", q: 3, u: "حبات" },
      { n: "زيت زيتون", q: 4, u: "ملاعق" },
      { n: "كمون", q: 1, u: "ملعقة" }
    ],
    steps: [
      "اسلق العدس نصف سلقة ثم أضف البرغل والملح والكمون.",
      "حمّر البصل المفروم بزيت الزيتون حتى يصبح مقرمشاً.",
      "اسكب المجدرة وزيّنها بالبصل المقرمش ورشة زيت زيتون."
    ],
    keywords: ["برغل", "عدس", "بصل", "زيتون", "كمون", "ملح"]
  },
  {
    recipeTitle: "معكرونة بالبشاميل الكريمية",
    imageUrl: "vip_media/chef_bechamel.svg",
    baseServings: 4,
    ingredients: [
      { n: "معكرونة", q: 1, u: "عبوة" },
      { n: "حليب", q: 4, u: "أكواب" },
      { n: "طحين", q: 3, u: "ملاعق" },
      { n: "سمن أو زبدة", q: 3, u: "ملاعق" },
      { n: "جبن مبشور", q: 1, u: "كوب" }
    ],
    steps: [
      "اسلق المعكرونة في ماء مملح وصفّها جانباً.",
      "حمّص الطحين بالسمن ثم أضف الحليب تدريجياً مع التحريك.",
      "امزج المعكرونة مع البشاميل والجبن وحمّرها في الفرن."
    ],
    keywords: ["معكرونة", "حليب", "طحين", "سمن", "جبن", "ملح"]
  }
];

const LAYLA_ROTATIONS = [
  {
    title: "ضيافة القهوة وحلى البسكويت الملكي",
    imageUrl: "vip_media/layla_hospitality.svg",
    detail: "نسّق فناجين القهوة مع طبق حلى بارد بالبسكويت والشوكولاتة بترتيب أنيق.",
    careTip: "الاهتمام بالتفاصيل الصغيرة في التقديم يترك أثراً راقياً.",
    keywords: ["بسكوت", "شوكولاتة", "قهوة", "شاي", "حليب"]
  },
  {
    title: "ركن العناية والصفاء المسائي",
    imageUrl: "vip_media/layla_hospitality.svg",
    detail: "حضّر كوباً دافئاً مهدئاً ورتّب ركن الضيافة والمناديل بهدوء.",
    careTip: "الذوق الرفيع يظهر في البساطة والترتيب واللطف.",
    keywords: ["شاي", "عسل", "حليب", "مناديل", "صابون"]
  }
];

const FARID_ROTATIONS = [
  {
    title: "تدقيق المؤونة الأساسية للمنزل",
    imageUrl: "vip_media/farid_pantry.svg",
    detail: "مراجعة الأرز، الزيت، السكر، الخبز، وسوائل التنظيف لضمان عدم نفادها.",
    budgetTip: "قسّم المشتريات إلى أساسيات ضرورية وكماليات مؤجلة.",
    checklist: ["رز أو برغل", "زيت طبخ", "سكر وشاي", "خبز طازج", "سائل جلي ومنظفات"],
    keywords: ["رز", "زيت", "سكر", "خبز", "سائل جلي"]
  },
  {
    title: "تنظيم قائمة الفطور والأسبوع",
    imageUrl: "vip_media/farid_pantry.svg",
    detail: "تجهيز البيض والجبن واللبن والحليب لتأمين فطور منظم طوال الأسبوع.",
    budgetTip: "الشراء المنظم يوفر الوقت ويقلل الهدر اليومي.",
    checklist: ["بيض طازج", "جبن أو لبنة", "حليب", "مربى أو حلاوة", "مناديل"],
    keywords: ["بيض", "جبن", "حليب", "حلاوة", "مناديل"]
  }
];

const FADI_ROTATIONS = [
  {
    joke: "مرة واحد راح عالدكان بدو غرضين، طلع ومعو كيس كامل قال للمحاسب: هاد الكيس لحالو بدو كرسي!",
    imageUrl: "vip_media/fadi_comic_1.svg",
    moodPick: "تشكيلة سهرة ومتة وبزر وشيبس لرفع المزاج.",
    keywords: ["متة", "بزر", "شيبس", "بسكوت", "عصير"]
  },
  {
    joke: "واحد فتح البراد 5 مرات ورا بعض على أمل يطلع فيه شي جديد.. وبالمرة السادسة اقتنع يطلب من متجر معاذ!",
    imageUrl: "vip_media/fadi_comic_2.svg",
    moodPick: "موالح وبزر وشاي سريع لإنقاذ السهرة.",
    keywords: ["بزر", "شاي", "بسكوت", "شيبس", "متة"]
  },
  {
    joke: "قالولو شو خطتك اليوم؟ قال: كاسة متة وصحن بزر والباقي على الله!",
    imageUrl: "vip_media/fadi_comic_1.svg",
    moodPick: "عدة المتة والتسالي الكاملة.",
    keywords: ["متة", "بزر", "سكر", "شيبس", "شوكولاتة"]
  }
];

const ZAIN_ROTATIONS = [
  {
    mission: "مهمة اليوم: جهّز وجبة طاقة متكاملة وأكمل هدفك اليومي بثبات.",
    badge: "روح قتالية",
    xpReward: 150,
    imageUrl: "vip_media/zain_mission.svg",
    keywords: ["رز", "بيض", "حليب", "عصير", "بسكوت"]
  },
  {
    mission: "مهمة اليوم: تحدي السرعة والانضباط — اختر أصنافك الأساسية دون تردد.",
    badge: "بطل الميدان",
    xpReward: 200,
    imageUrl: "vip_media/zain_mission.svg",
    keywords: ["عدس", "برغل", "شاي", "ماء"]
  }
];

const RYU_ROTATIONS = [
  {
    mystery: "ما الشيء الذي يكتب ولا يقرأ؟",
    answer: "القلم — والصفقة الأذكى تجمع الجودة والسعر المناسب.",
    clue: "اضغط رادار الصفقات بالأسفل لاكتشاف أوفر الأصناف الآن.",
    imageUrl: "vip_media/ryu_radar.svg",
    keywords: ["سكر", "زيت", "شاي", "جبن", "خبز"]
  },
  {
    mystery: "ما الشيء الذي كلما زاد نقص؟",
    answer: "العمر — والوقت الأنسب لتنظيم طلباتك هو الآن.",
    clue: "قارن أسعار الأصناف المتوفرة قبل الإضافة.",
    imageUrl: "vip_media/ryu_radar.svg",
    keywords: ["رز", "حليب", "بيض", "بندورة", "بطاطا"]
  }
];

const RITAJ_ROTATIONS = [
  {
    message: "ريتاج تقول لك: ابتسامتك اليوم تصنع فرقاً كبيراً، ودلّل نفسك بحلى أو مشروب تحبه.",
    sweetIdea: "حلى بارد بالبسكويت أو كيك منزلي خفيف.",
    imageUrl: "vip_media/ritaj_mood.svg",
    keywords: ["بسكوت", "شوكولاتة", "حليب", "سكر", "عصير"]
  },
  {
    message: "إشراقة ريتاج اليوم: كل يوم فرصة جديدة لطاقة حلوة واختيارات تسعد قلبك.",
    sweetIdea: "مهلبية أو كاسترد حلو أو شوكولاتة خفيفة للمساء.",
    imageUrl: "vip_media/ritaj_mood.svg",
    keywords: ["حليب", "نشا", "سكر", "شوكولاتة", "بسكوت"]
  }
];

const feedPayload = {
  updatedAt: today.toISOString(),
  dateKey: today.toISOString().slice(0, 10),
  dateLabel: today.toLocaleDateString("ar-SY"),
  dayIndex: dayOfYear,
  rooms: {
    coach_sakhr: COACH_ROTATIONS[mod3],
    grand_chef: CHEF_ROTATIONS[mod3],
    princess_layla: LAYLA_ROTATIONS[mod2],
    butler_farid: FARID_ROTATIONS[mod2],
    friend_fadi: FADI_ROTATIONS[mod3],
    anime_zain: ZAIN_ROTATIONS[mod2],
    anime_ryu: RYU_ROTATIONS[mod2],
    anime_ritaj: RITAJ_ROTATIONS[mod2]
  }
};

fs.writeFileSync(path.join(MEDIA_DIR, "daily_vip_feed.json"), JSON.stringify(feedPayload, null, 2), "utf8");
console.log(`تم تحديث ${ASSETS.length} صورة توضيحية وملف daily_vip_feed.json لجميع الشخصيات الـ 8 بنجاح.`);
