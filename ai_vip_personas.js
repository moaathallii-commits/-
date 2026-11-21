// ============================================================================
// منظومة الشخصيات الثماني المدفوعة (مدى الحياة) + الغرف التفاعلية اليومية + التفعيل الإداري الحصري
// (ai_vip_personas.js - v2.0 Interactive Daily Rooms & Distinct Voices)
// - اشتراك لمرة واحدة مدى الحياة لكل شخصية أو عبر «الباقة الشاملة»
// - 8 أصوات بشرية متمايزة تماماً دون أي تداخل في voiceName
// - 8 أدوات تفاعلية حقيقية داخل الغرف اليومية + بنك محتوى يومي موسّع
// - التفعيل والإلغاء يتم حصراً من لوحة الإدارة
// - عزل كامل ونهائي للذكاء الاصطناعي عن الدفع وشام كاش والإيصالات المالية
// ============================================================================

(function () {
  if (window.MoaathVIPSystem) return;

  const VIP_ENTITLEMENTS_KEY = "moaath_vip_lifetime_entitlements_v1";
  const VIP_CONFIG_KEY = "moaath_vip_pricing_config_v1";
  const VIP_INTERACTIVE_KEY = "moaath_vip_interactive_state_v2";
  const STORE_WHATSAPP_PHONE = "963965461504";

  const DEFAULT_VIP_CONFIG = {
    singlePriceUSD: 5,
    bundlePriceUSD: 25,
    updatedAt: "2026-11-21"
  };

  // ==========================================================================
  // 1) الشخصيات الثماني (5 مميزة + 3 أنمي) بـ 8 أصوات بشرية متمايزة تماماً
  // ==========================================================================
  const VIP_PERSONAS = {
    coach_sakhr: {
      id: "coach_sakhr",
      group: "specialist",
      name: "كابتن صخر",
      role: "المدرب الرياضي",
      badge: "لياقة وبناء أجسام",
      gender: "male",
      dialectMode: "fusha_modern",
      toneTag: "حازم ومحفز ورياضي",
      voiceName: "Fenrir",
      speed: 1.24,
      pitchSemitones: -1.6,
      accent: "#10b981",
      avatarUrl: "coach_sakhr.jpg",
      shortDesc: "قائمة تمارين يومية قابلة للتأشير وحاسبة ماء وبروتين وسلة رياضية.",
      styleHint: "بصوت مدرب رياضي حازم ومحفز وعميق بالعربية الواضحة",
      greet: "أهلاً بالبطل في غرفة التدريب! انضباط اليوم يصنع قوة الغد."
    },
    grand_chef: {
      id: "grand_chef",
      group: "specialist",
      name: "الشيف الذهبي",
      role: "كبير الطهاة",
      badge: "وصفات دقيقة ومصورة",
      gender: "male",
      dialectMode: "fusha_modern",
      toneTag: "راقٍ ودقيق وخبير مطبخ",
      voiceName: "Orus",
      speed: 1.18,
      pitchSemitones: -1.2,
      accent: "#f59e0b",
      avatarUrl: "grand_chef.jpg",
      shortDesc: "وصفات يومية دقيقة مع الصور وضبط المقادير حسب عدد الأشخاص.",
      styleHint: "بصوت طباخ خبير وهادئ وراقٍ يشرح الوصفات والمقادير بدقة",
      greet: "أهلاً بك في مطبخ الشيف الذهبي، حيث الدقة والمذاق الأصيل."
    },
    princess_layla: {
      id: "princess_layla",
      group: "specialist",
      name: "الأميرة ليلى",
      role: "الأميرة الجميلة",
      badge: "ضيافة وحلويات وعناية",
      gender: "female",
      dialectMode: "fusha_modern",
      toneTag: "رقيقة ومهذبة وراقية",
      voiceName: "Aoede",
      speed: 1.16,
      pitchSemitones: 3.0,
      accent: "#ec4899",
      avatarUrl: "princess_layla.jpg",
      shortDesc: "منسّق المناسبات السريع وركن الضيافة والحلويات اليومية.",
      styleHint: "بصوت أنثوي راقٍ ومهذب وناعم ومشرق بالعربية الفصحى اللطيفة",
      greet: "أهلاً بك في جناح الضيافة الملكي، يسعدني تنسيق أرقى اختياراتك اليوم."
    },
    butler_farid: {
      id: "butler_farid",
      group: "specialist",
      name: "السيد فريد",
      role: "كبير الخدم",
      badge: "تنظيم ومؤونة البيت",
      gender: "male",
      dialectMode: "fusha_modern",
      toneTag: "رسمي ومنظم ووقور",
      voiceName: "Charon",
      speed: 1.2,
      pitchSemitones: -1.8,
      accent: "#8b5cf6",
      avatarUrl: "butler_farid.jpg",
      shortDesc: "دفتر مؤونة البيت التفاعلي وحاسبة الميزانية وتنظيم الاحتياجات.",
      styleHint: "بصوت وقور ورسمي ومنظم يخاطب الزبون باحترام ودقة",
      greet: "أهلاً بك سيدي، كل شيء مرتب وجاهز لتنظيم مؤونة اليوم بدقة."
    },
    friend_fadi: {
      id: "friend_fadi",
      group: "specialist",
      name: "فادي الفرفوش",
      role: "الصديق الوفي كثير المزاح",
      badge: "مرح وسهرات وتسلية",
      gender: "male",
      dialectMode: "shami_friendly",
      toneTag: "مرح وعفوي وخفيف الظل",
      voiceName: "Puck",
      speed: 1.28,
      pitchSemitones: 1.1,
      accent: "#f97316",
      avatarUrl: "friend_fadi.jpg",
      shortDesc: "عجلة السهرة والمتة التفاعلية وبنك نكات متجدد يومياً.",
      styleHint: "بصوت صديق شاب مرح وعفوي وخفيف الظل بلهجة شامية ودودة",
      greet: "ولك هلا بالصديق الوفي! خلينا نكسر الروتين ونضبط أحلى مزاج اليوم."
    },
    anime_zain: {
      id: "anime_zain",
      group: "anime",
      name: "كابتن زين",
      role: "بطل الأنمي المغامر",
      badge: "مغامرات وطاقة الأبطال",
      gender: "male",
      dialectMode: "fusha_modern",
      toneTag: "حماسي وبطولي وشبابي",
      voiceName: "Zephyr",
      speed: 1.28,
      pitchSemitones: 0.4,
      accent: "#ef4444",
      avatarUrl: "anime_zain.jpg",
      shortDesc: "مهام يومية ونظام مستوى ونقاط خبرة XP حقيقية ووقود الأبطال.",
      styleHint: "بصوت بطل أنمي شاب حماسي ومندفع وحيوي",
      greet: "مهمة جديدة بدأت اليوم! هل أنت مستعد لتجهيز وقود الأبطال؟"
    },
    anime_ryu: {
      id: "anime_ryu",
      group: "anime",
      name: "المحقق ريو",
      role: "محقق الأنمي الذكي",
      badge: "تحليل وأذكى صفقات",
      gender: "male",
      dialectMode: "fusha_modern",
      toneTag: "هادئ وذكي ومحلل",
      voiceName: "Enceladus",
      speed: 1.22,
      pitchSemitones: -0.9,
      accent: "#38bdf8",
      avatarUrl: "anime_ryu.jpg",
      shortDesc: "لغز يومي تفاعلي بزر كشف الحل ورادار حقيقي لأوفر الصفقات.",
      styleHint: "بصوت محقق ذكي وهادئ وواثق ومختصر",
      greet: "كل تفصيل له معنى؛ دعنا نحلل أفضل خيارات اليوم بدقة."
    },
    anime_ritaj: {
      id: "anime_ritaj",
      group: "anime",
      name: "ريتاج",
      role: "نجمة الأنمي اللطيفة",
      badge: "إشراقة وحلى ومزاج اليوم",
      gender: "female",
      dialectMode: "shami_friendly",
      toneTag: "لطيفة ومشرقة ومبهجة",
      voiceName: "Leda",
      speed: 1.22,
      pitchSemitones: 2.8,
      accent: "#f472b6",
      avatarUrl: "anime_ritaj.jpg",
      shortDesc: "مقياس المزاج التفاعلي ورسائل طاقة ريتاج اليومية وحلى اليوم.",
      styleHint: "بصوت أنثوي لطيف ومشرق ومبهج بنبرة أنمي ودودة",
      greet: "أهلاً بك في عالم ريتاج المشرق! لنجعل يومك مليئاً بالبهجة والحلاوة."
    }
  };

  // ==========================================================================
  // 2) بنك المحتوى اليومي الموسّع (يدور تلقائياً كل يوم دون تكرار سريع)
  // ==========================================================================
  const DAILY_ROOM_ROTATIONS = {
    coach_sakhr: [
      { title: "قوة الجزء العلوي والجذع", exercises: ["إحماء مفاصل وكتفين 5 دقائق", "تمرين ضغط 4×12 تكرار", "بلانك ثابت 3×40 ثانية", "تمدد للصدر والذراعين 4 دقائق"], nutritionTip: "وجبة بروتين (بيض أو تونة أو عدس) خلال ساعتين بعد التمرين.", keywords: ["بيض", "عدس", "تونة", "حليب", "رز"] },
      { title: "قوة الأرجل والتحمل", exercises: ["إحماء مشي بالمكان 5 دقائق", "سكوات حر 4×15 تكرار", "لانجز أمامي 3×12 لكل رجل", "إطالة للأرجل 5 دقائق"], nutritionTip: "اشرب كوبين ماء قبل وبعد التمرين لتعويض السوائل.", keywords: ["ماء", "حليب", "شوفان", "رز", "بيض"] },
      { title: "كارديو وحرق دهون سريع", exercises: ["قفز حبل أو نط خفيف 4 جولات", "تسلق الجبل 3×30 ثانية", "رفع ركبتين سريع 3×30 ثانية", "تهدئة وتنفس عميق 4 دقائق"], nutritionTip: "خفف السكريات المسائية وركز على الخضار واللبن.", keywords: ["ماء", "لبن", "خضار", "عصير", "شاي"] },
      { title: "مرونة واستشفاء عضلي", exercises: ["إطالة كاملة للظهر والرقبة", "تمدد أوتار الركبة والحوض", "مشي هادئ 15 دقيقة", "تنفس عميق لتخفيف التوتر"], nutritionTip: "النوم المبكر وشرب الحليب أو العسل يدعمان الاستشفاء.", keywords: ["حليب", "عسل", "لبنة", "بيض", "ماء"] },
      { title: "تحدي اللياقة الشامل", exercises: ["ضغط 3×15 تكرار", "سكوات 3×20 تكرار", "بطن كرانش 3×20 تكرار", "بلانك جانبي 2×30 ثانية"], nutritionTip: "وزّع وجباتك على 3 وجبات متوازنة ووجبة خفيفة صحية.", keywords: ["بيض", "برغل", "عدس", "حليب", "عسل"] },
      { title: "نشاط الصباح وتنشيط الدورة", exercises: ["تحريك المفاصل 5 دقائق", "مشي سريع 20 دقيقة", "تمارين بطن خفيفة 3×15", "إطالة عامة 5 دقائق"], nutritionTip: "فطور متوازن من البيض والجبن والخبز يمنحك طاقة ثابتة.", keywords: ["بيض", "جبن", "خبز", "حليب", "زيتون"] },
      { title: "ثبات الجذع والتوازن", exercises: ["بلانك أمامي 4×35 ثانية", "سوبرمان للظهر 3×15", "جسر الألوية 3×15", "تمدد عميق للعمود الفقري"], nutritionTip: "البقوليات مثل العدس والحمص مصدر ممتاز للبروتين النباتي.", keywords: ["عدس", "حمص", "زيتون", "رز", "ماء"] }
    ],
    grand_chef: [
      { recipeTitle: "مقلوبة باذنجان على أصولها", imageUrl: "recipe_maqlouba.jpg", baseServings: 4, ingredients: [{ n: "رز", q: 2, u: "كوب" }, { n: "باذنجان", q: 2, u: "حبة" }, { n: "بطاطا", q: 2, u: "حبة" }, { n: "بندورة", q: 2, u: "حبة" }, { n: "بهار مشكل", q: 1, u: "ملعقة" }], steps: ["قطّع الباذنجان والبطاطا شرائح واقلِهما حتى يأخذا لوناً ذهبياً.", "رتّب شرائح البندورة في قاع القدر ثم الخضار والرز المغسول.", "أضف المرق المتبل واتركها تغلي ثم على نار هادئة 25 دقيقة."], keywords: ["رز", "باذنجان", "بطاطا", "بندورة", "بهار", "زيت"] },
      { recipeTitle: "مجدرة برغل بالزيت والكمون", imageUrl: "recipe_moujaddara.jpg", baseServings: 4, ingredients: [{ n: "برغل خشن", q: 2, u: "كوب" }, { n: "عدس حب", q: 1, u: "كوب" }, { n: "بصل", q: 3, u: "حبات" }, { n: "زيت زيتون", q: 4, u: "ملاعق" }, { n: "كمون", q: 1, u: "ملعقة" }], steps: ["اسلق العدس نصف سلقة ثم أضف البرغل والملح والكمون.", "حمّر البصل المفروم بزيت الزيتون حتى يصبح مقرمشاً.", "اسكب المجدرة وزيّنها بالبصل المقرمش ورشة زيت زيتون."], keywords: ["برغل", "عدس", "بصل", "زيتون", "كمون", "ملح"] },
      { recipeTitle: "معكرونة بالبشاميل الكريمية", imageUrl: "recipe_bechamel.jpg", baseServings: 4, ingredients: [{ n: "معكرونة", q: 1, u: "عبوة" }, { n: "حليب", q: 4, u: "أكواب" }, { n: "طحين", q: 3, u: "ملاعق" }, { n: "سمن أو زبدة", q: 3, u: "ملاعق" }, { n: "جبن مبشور", q: 1, u: "كوب" }], steps: ["اسلق المعكرونة في ماء مملح وصفّها جانباً.", "حمّص الطحين بالسمن ثم أضف الحليب تدريجياً مع التحريك.", "امزج المعكرونة مع البشاميل والجبن وحمّرها في الفرن."], keywords: ["معكرونة", "حليب", "طحين", "سمن", "جبن", "ملح"] },
      { recipeTitle: "شوربة عدس شتوية دافئة", imageUrl: "store-icon.png", baseServings: 4, ingredients: [{ n: "عدس أحمر", q: 1.5, u: "كوب" }, { n: "بطاطا", q: 1, u: "حبة" }, { n: "بصل", q: 1, u: "حبة" }, { n: "كمون", q: 1, u: "ملعقة" }, { n: "زيت", q: 2, u: "ملعقة" }], steps: ["اقلِ البصل المفروم بالزيت ثم أضف العدس المغسول ومكعبات البطاطا.", "أضف الماء واتركها تنضج 20 دقيقة ثم اهرسها جيداً.", "تبّل بالكمون والملح وقدّمها ساخنة مع الخبز المحمص."], keywords: ["عدس", "بطاطا", "بصل", "كمون", "زيت", "خبز"] },
      { recipeTitle: "كبسة رز بالبهارات الشرقية", imageUrl: "store-icon.png", baseServings: 4, ingredients: [{ n: "رز طويل", q: 2, u: "كوب" }, { n: "معجون طماطم", q: 2, u: "ملعقة" }, { n: "بصل", q: 2, u: "حبة" }, { n: "بهار كبسة", q: 1.5, u: "ملعقة" }, { n: "سمن", q: 2, u: "ملعقة" }], steps: ["حمّر البصل بالسمن وأضف البهارات ومعجون الطماطم.", "أضف الماء الساخن والملح ثم الرز المغسول والمنقوع.", "غطِّ القدر على نار هادئة حتى تتفتح حبات الرز."], keywords: ["رز", "معجون طماطم", "بصل", "بهار", "سمن", "ملح"] },
      { recipeTitle: "فريكة مفلفلة بالسمن البلدي", imageUrl: "store-icon.png", baseServings: 4, ingredients: [{ n: "فريكة", q: 2, u: "كوب" }, { n: "سمن", q: 2, u: "ملعقة" }, { n: "بصل", q: 1, u: "حبة" }, { n: "بهار مشكل", q: 1, u: "ملعقة" }], steps: ["نقِّ الفريكة واغسلها جيداً ثم صفّها.", "قلّبها مع البصل والسمن والبهار 3 دقائق ثم أضف المرق.", "اتركها على نار هادئة حتى تنضج تماماً."], keywords: ["فريكة", "سمن", "بصل", "بهار", "ملح"] }
    ],
    princess_layla: [
      { title: "ضيافة القهوة وحلى البسكويت الملكي", detail: "نسّق فناجين القهوة مع طبق حلى بارد بالبسكويت والشوكولاتة بترتيب أنيق.", careTip: "الاهتمام بالتفاصيل الصغيرة في التقديم يترك أثراً راقياً.", keywords: ["بسكوت", "شوكولاتة", "قهوة", "شاي", "حليب"] },
      { title: "ركن العناية والصفاء المسائي", detail: "حضّر كوباً دافئاً مهدئاً ورتّب ركن الضيافة والمناديل بهدوء.", careTip: "الذوق الرفيع يظهر في البساطة والترتيب واللطف.", keywords: ["شاي", "عسل", "حليب", "مناديل", "صابون"] },
      { title: "ضيافة الصباح المشرقة", detail: "تشكيلة فطور ناعمة مع شاي معطر ومربى أو حلاوة طحينية.", careTip: "بداية الصباح الهادئة تمنح اليوم كله أناقة وراحة.", keywords: ["شاي", "حلاوة", "جبن", "خبز", "عسل"] },
      { title: "لمسة الحلويات الشرقية", detail: "بسبوسة أو مهلبية بالحليب مزينة بشكل لطيف للزوار.", careTip: "تقديم الحلى بارداً ومنسقاً يضاعف بهجة الضيافة.", keywords: ["سميد", "حليب", "نشا", "سكر", "سمن"] }
    ],
    butler_farid: [
      { title: "تدقيق المؤونة الأساسية للمنزل", detail: "مراجعة الأرز، الزيت، السكر، الخبز، وسوائل التنظيف لضمان عدم نفادها.", budgetTip: "قسّم المشتريات إلى أساسيات ضرورية وكماليات مؤجلة.", checklist: ["رز أو برغل", "زيت طبخ", "سكر وشاي", "خبز طازج", "سائل جلي ومنظفات"], keywords: ["رز", "زيت", "سكر", "خبز", "سائل جلي"] },
      { title: "تنظيم قائمة الفطور والأسبوع", detail: "تجهيز البيض والجبن واللبن والحليب لتأمين فطور منظم طوال الأسبوع.", budgetTip: "الشراء المنظم يوفر الوقت ويقلل الهدر اليومي.", checklist: ["بيض طازج", "جبن أو لبنة", "حليب", "مربى أو حلاوة", "مناديل"], keywords: ["بيض", "جبن", "حليب", "حلاوة", "مناديل"] },
      { title: "جرد المنظفات والعناية المنزلية", detail: "تأكد من توفر مسحوق الغسيل، الكلور، الصابون، والمناديل قبل نفادها.", budgetTip: "العبوات العائلية للمنظفات أوفر على المدى الشهري.", checklist: ["مسحوق غسيل", "كلور ومعقم", "صابون وشامبو", "سائل جلي", "محارم"], keywords: ["مسحوق غسيل", "كلور", "صابون", "سائل جلي", "مناديل"] }
    ],
    friend_fadi: [
      { joke: "مرة واحد راح عالدكان بدو غرضين، طلع ومعو كيس كامل قال للمحاسب: هاد الكيس لحالو بدو كرسي!", moodPick: "تشكيلة سهرة ومتة وبزر وشيبس لرفع المزاج.", keywords: ["متة", "بزر", "شيبس", "بسكوت", "عصير"] },
      { joke: "الفرق بين الجوعان قبل الفطور وبعده: قبل الفطور يشوف الرغيف قد الشمس، وبعده يسأل: وين راح الصحن؟", moodPick: "سناكس مقرمشة ومشروبات باردة لضحكة سريعة وسهرة حلوة.", keywords: ["شيبس", "بزر", "شوكولاتة", "عصير", "قهوة"] },
      { joke: "واحد فتح البراد 5 مرات ورا بعض على أمل يطلع فيه شي جديد… وبالمرة السادسة اقتنع يطلب من متجر معاذ!", moodPick: "موالح وبزر وشاي سريع لإنقاذ السهرة.", keywords: ["بزر", "شاي", "بسكوت", "شيبس", "متة"] },
      { joke: "قالولو شو خطتك اليوم؟ قال: كاسة متة وصحن بزر والباقي على الله!", moodPick: "عدة المتة والتسالي الكاملة.", keywords: ["متة", "بزر", "سكر", "شيبس", "شوكولاتة"] }
    ],
    anime_zain: [
      { mission: "مهمة اليوم: جهّز وجبة طاقة متكاملة وأكمل هدفك اليومي بثبات.", xpReward: 150, badge: "روح قتالية", keywords: ["رز", "بيض", "حليب", "عصير", "بسكوت"] },
      { mission: "مهمة اليوم: تحدّي السرعة والانضباط — اختر أصنافك الأساسية دون تردد.", xpReward: 200, badge: "بطل الميدان", keywords: ["عدس", "برغل", "شاي", "ماء", "شيبس"] },
      { mission: "مهمة اليوم: تزوّد بوقود الأبطال لجلسة مذاكرة أو عمل طويلة.", xpReward: 180, badge: "طاقة لا تهدأ", keywords: ["قهوة", "شوكولاتة", "بسكوت", "ماء", "عصير"] },
      { mission: "مهمة اليوم: اجمع 3 أصناف أساسية للبيت في سلة واحدة.", xpReward: 220, badge: "قائد الفريق", keywords: ["زيت", "سكر", "رز", "خبز", "جبن"] }
    ],
    anime_ryu: [
      { mystery: "ما الشيء الذي يكتب ولا يقرأ؟", answer: "القلم — والصفقة الأذكى تجمع الجودة والسعر المناسب.", clue: "اضغط رادار الصفقات بالأسفل لاكتشاف أوفر الأصناف الآن.", keywords: ["سكر", "زيت", "شاي", "جبن", "خبز"] },
      { mystery: "ما الشيء الذي كلما زاد نقص؟", answer: "العمر — والوقت الأنسب لتنظيم طلباتك هو الآن.", clue: "قارن أسعار الأصناف المتوفرة قبل الإضافة.", keywords: ["رز", "حليب", "بيض", "بندورة", "بطاطا"] },
      { mystery: "له أسنان ولا يعض، فما هو؟", answer: "المشط — والتفاصيل الصغيرة تصنع فرقاً كبيراً.", clue: "راجع رادار أوفر العروض المتوفرة في الفرع.", keywords: ["صابون", "شامبو", "مناديل", "سائل جلي", "كلور"] },
      { mystery: "يمشي بلا قدمين ويبكي بلا عينين، فما هو؟", answer: "السحاب — والذكي يختار الأصناف المتوفرة بأفضل قيمة.", clue: "افحص قائمة أوفر الصفقات اليومية بالأسفل.", keywords: ["عدس", "برغل", "معكرونة", "شاي", "زيت"] }
    ],
    anime_ritaj: [
      { message: "ريتاج تقول لك: ابتسامتك اليوم تصنع فرقاً كبيراً، ودلّل نفسك بحلى أو مشروب تحبه!", sweetIdea: "حلى بارد بالبسكويت أو كيك منزلي خفيف.", keywords: ["بسكوت", "شوكولاتة", "حليب", "سكر", "عصير"] },
      { message: "إشراقة ريتاج اليوم: كل يوم فرصة جديدة لطاقة حلوة واختيارات تسعد قلبك.", sweetIdea: "مهلبية أو كاسترد حلو أو شوكولاتة خفيفة للمساء.", keywords: ["حليب", "نشا", "سكر", "شوكولاتة", "بسكوت"] },
      { message: "رسالة لطيفة من ريتاج: خذ استراحة قصيرة مع كوب دافئ وشيء حلو يرفع معنوياتك!", sweetIdea: "بسكوت شاي مع شوكولاتة أو عصير منعش.", keywords: ["شاي", "بسكوت", "شوكولاتة", "عصير", "قهوة"] },
      { message: "نجمة اليوم: أنت تستحق يوماً هادئاً ولطيفاً مليئاً بالخير والبهجة!", sweetIdea: "حلاوة أو عسل مع فطور لطيف ومشروب دافئ.", keywords: ["عسل", "حلاوة", "حليب", "شاي", "بسكوت"] }
    ]
  };

  let adminEntitlements = loadLocalEntitlements();
  let vipConfig = loadLocalConfig();

  function loadInteractiveState() {
    try {
      const d = JSON.parse(localStorage.getItem(VIP_INTERACTIVE_KEY) || "{}");
      return d && typeof d === "object" ? d : {};
    } catch (_) {
      return {};
    }
  }

  function saveInteractiveState(st) {
    try { localStorage.setItem(VIP_INTERACTIVE_KEY, JSON.stringify(st)); } catch (_) {}
  }

  function loadLocalEntitlements() {
    try {
      const d = JSON.parse(localStorage.getItem(VIP_ENTITLEMENTS_KEY) || "{}");
      return d && typeof d === "object" ? d : { bundleLifetime: false, personas: {} };
    } catch (_) {
      return { bundleLifetime: false, personas: {} };
    }
  }

  function saveLocalEntitlements(obj) {
    try { localStorage.setItem(VIP_ENTITLEMENTS_KEY, JSON.stringify(obj)); } catch (_) {}
  }

  function loadLocalConfig() {
    try {
      const d = JSON.parse(localStorage.getItem(VIP_CONFIG_KEY) || "{}");
      return { ...DEFAULT_VIP_CONFIG, ...(d && typeof d === "object" ? d : {}) };
    } catch (_) {
      return { ...DEFAULT_VIP_CONFIG };
    }
  }

  function saveLocalConfig(cfg) {
    try { localStorage.setItem(VIP_CONFIG_KEY, JSON.stringify(cfg)); } catch (_) {}
  }

  function getCustomerKey() {
    try {
      const u = typeof currentUser !== "undefined" && currentUser ? currentUser : null;
      const phone = String(u?.phone || $("customerPhoneInput")?.value || $("cartPhoneInput")?.value || "guest").trim();
      return phone.replace(/[^0-9A-Za-z_]/g, "") || "guest";
    } catch (_) {
      return "guest";
    }
  }

  function getActiveCustomerEntitlements() {
    const custKey = getCustomerKey();
    const byCust = adminEntitlements.customers?.[custKey];
    if (byCust && typeof byCust === "object") {
      return {
        bundleLifetime: !!byCust.bundleLifetime,
        personas: { ...(byCust.personas || {}) }
      };
    }
    return {
      bundleLifetime: !!adminEntitlements.bundleLifetime,
      personas: { ...(adminEntitlements.personas || {}) }
    };
  }

  function isPersonaUnlockedLifetime(personaId) {
    if (!VIP_PERSONAS[personaId]) return false;
    const ent = getActiveCustomerEntitlements();
    return !!(ent.bundleLifetime || ent.personas?.[personaId]);
  }

  function isBundleUnlockedLifetime() {
    const ent = getActiveCustomerEntitlements();
    return !!ent.bundleLifetime;
  }

  function adminSetEntitlement(targetCustomerKey, personaIdOrBundle, enable = true) {
    const cleanCust = String(targetCustomerKey || getCustomerKey() || "guest").replace(/[^0-9A-Za-z_]/g, "") || "guest";
    adminEntitlements.customers = adminEntitlements.customers || {};
    const curCust = adminEntitlements.customers[cleanCust] || { bundleLifetime: false, personas: {} };

    if (personaIdOrBundle === "BUNDLE_ALL_8") {
      curCust.bundleLifetime = !!enable;
      if (enable) {
        Object.keys(VIP_PERSONAS).forEach(pid => { curCust.personas[pid] = true; });
      }
    } else if (VIP_PERSONAS[personaIdOrBundle]) {
      curCust.personas = curCust.personas || {};
      curCust.personas[personaIdOrBundle] = !!enable;
    }

    adminEntitlements.customers[cleanCust] = curCust;
    if (cleanCust === getCustomerKey()) {
      adminEntitlements.bundleLifetime = !!curCust.bundleLifetime;
      adminEntitlements.personas = { ...(curCust.personas || {}) };
    }

    saveLocalEntitlements(adminEntitlements);

    if (typeof db !== "undefined" && db && typeof db.ref === "function") {
      try { db.ref(`vip_entitlements/${cleanCust}`).set(curCust).catch(() => {}); } catch (_) {}
    }

    if (typeof showToast === "function") {
      const label = personaIdOrBundle === "BUNDLE_ALL_8" ? "الباقة الشاملة (8 شخصيات مدى الحياة)" : (VIP_PERSONAS[personaIdOrBundle]?.name || personaIdOrBundle);
      showToast(enable ? `✅ تم تفعيل (${label}) مدى الحياة للزبون (${cleanCust}) من الإدارة.` : `🔒 تم إيقاف تفعيل (${label}) للزبون (${cleanCust}).`);
    }
    renderAdminVIPTab();
    renderVIPShowcaseModal();
    syncUnlockedVIPPersonasIntoCompanion();
    injectVIPButtonIntoAssistantHeader();
  }

  function getDayOfYearIndex() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    return Math.floor((now - start) / 86400000);
  }

  function getTodayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function getDailyContentForPersona(personaId, offset = 0) {
    const list = DAILY_ROOM_ROTATIONS[personaId] || [];
    if (!list.length) return null;
    const idx = (getDayOfYearIndex() + offset) % list.length;
    return {
      dayIndex: getDayOfYearIndex(),
      dateLabel: new Date().toLocaleDateString("ar-SY"),
      item: list[idx]
    };
  }

  function formatPriceFromUSD(usd) {
    const numUSD = Number(usd) || 0;
    try {
      if (typeof calcSYP === "function") {
        const syp = calcSYP(numUSD);
        if (syp > 0) return `$${numUSD} (${Number(syp).toLocaleString()} ل.س)`;
      }
    } catch (_) {}
    return `$${numUSD}`;
  }

  function openWhatsAppSubscriptionRequest(labelName, priceText) {
    const custName = String($("customerNameInput")?.value || $("cartNameInput")?.value || currentUser?.name || "زبون المتجر").trim();
    const custPhone = String($("customerPhoneInput")?.value || $("cartPhoneInput")?.value || currentUser?.phone || "غير محدد").trim();
    const msg = `مرحباً متجر معاذ، أرغب بالاشتراك لمرة واحدة مدى الحياة في: ${labelName} (${priceText}) — الاسم: ${custName}، الرقم: ${custPhone}. يرجى التفعيل من الإدارة.`;
    const url = `https://wa.me/${STORE_WHATSAPP_PHONE}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function getStoreUnitSYP(pid) {
    try {
      const p = products?.[pid];
      if (!p) return 0;
      const isW = typeof currentUser !== "undefined" && currentUser?.userType === "wholesale";
      const usd = (isW && p.wholesaleUSD > 0) ? p.wholesaleUSD : (p.priceUSD || 0);
      return typeof calcSYP === "function" ? calcSYP(usd) : 0;
    } catch (_) {
      return 0;
    }
  }

  function findAvailableStoreProductsByKeywords(keywords = [], limit = 6) {
    if (typeof products !== "object" || !products) return [];
    const normList = (keywords || []).map(k => String(k || "").trim().toLowerCase()).filter(Boolean);
    const matches = [];
    for (const pid of Object.keys(products)) {
      const p = products[pid];
      if (!p || !p.name) continue;
      const stock = typeof getProductStockForBranch === "function"
        ? getProductStockForBranch(p, typeof activeBranchId !== "undefined" ? activeBranchId : "main")
        : (parseInt(p.stock, 10) || 1);
      if (stock <= 0) continue;
      const pName = String(p.name).toLowerCase();
      if (normList.some(kw => pName.includes(kw))) {
        matches.push({ id: pid, name: p.name, priceSYP: getStoreUnitSYP(pid) });
        if (matches.length >= limit) break;
      }
    }
    return matches;
  }

  function findCheapestStoreDeals(limit = 4) {
    if (typeof products !== "object" || !products) return [];
    return Object.keys(products)
      .map(pid => {
        const p = products[pid];
        if (!p || !p.name) return null;
        const stock = typeof getProductStockForBranch === "function"
          ? getProductStockForBranch(p, typeof activeBranchId !== "undefined" ? activeBranchId : "main")
          : (parseInt(p.stock, 10) || 1);
        const priceSYP = getStoreUnitSYP(pid);
        if (stock <= 0 || priceSYP <= 0) return null;
        return { id: pid, name: p.name, priceSYP };
      })
      .filter(Boolean)
      .sort((a, b) => a.priceSYP - b.priceSYP)
      .slice(0, limit);
  }

  function addMatchedProductsToCart(keywords = []) {
    const found = findAvailableStoreProductsByKeywords(keywords, 6);
    if (!found.length) {
      if (typeof showToast === "function") showToast("لا توجد أصناف مطابقة متوفرة حالياً في الفرع.");
      return;
    }
    let added = 0;
    found.forEach(item => {
      if (typeof changeQty === "function") {
        changeQty(item.id, 1);
        added++;
      }
    });
    if (added > 0 && typeof showToast === "function") {
      showToast(`✅ تمت إضافة ${added} أصناف متوفرة إلى السلة.`);
    }
  }

  // ==========================================================================
  // 3) الأدوات التفاعلية الثماني داخل الغرفة اليومية لكل شخصية
  // ==========================================================================
  window.__vipToggleCoachEx = function (idx) {
    const st = loadInteractiveState();
    const key = `coach_${getTodayKey()}`;
    st[key] = st[key] || {};
    st[key][idx] = !st[key][idx];
    saveInteractiveState(st);
    window.openVIPDailyRoom("coach_sakhr");
  };

  window.__vipCalcCoachNeeds = function () {
    const w = Math.max(35, Math.min(180, parseFloat(document.getElementById("vipCoachWeight")?.value || "75") || 75));
    const waterL = (w * 0.035).toFixed(1);
    const proteinG = Math.round(w * 1.6);
    const out = document.getElementById("vipCoachCalcOut");
    if (out) out.innerHTML = `💧 احتياجك اليومي التقريبي: <b>${waterL} لتر ماء</b> • 🥩 البروتين المستهدف: <b>${proteinG} غرام</b>`;
  };

  window.__vipSetChefServings = function (n) {
    const st = loadInteractiveState();
    st.chefServings = n;
    saveInteractiveState(st);
    window.openVIPDailyRoom("grand_chef");
  };

  window.__vipSelectLaylaOccasion = function (occ) {
    const st = loadInteractiveState();
    st.laylaOccasion = occ;
    saveInteractiveState(st);
    window.openVIPDailyRoom("princess_layla");
  };

  window.__vipToggleFaridItem = function (idx) {
    const st = loadInteractiveState();
    const key = `farid_${getTodayKey()}`;
    st[key] = st[key] || {};
    st[key][idx] = !st[key][idx];
    saveInteractiveState(st);
    window.openVIPDailyRoom("butler_farid");
  };

  window.__vipNextFadiJoke = function () {
    const st = loadInteractiveState();
    st.fadiOffset = ((st.fadiOffset || 0) + 1) % DAILY_ROOM_ROTATIONS.friend_fadi.length;
    saveInteractiveState(st);
    window.openVIPDailyRoom("friend_fadi");
  };

  window.__vipSpinFadiWheel = function () {
    const pool = ["متة", "بزر", "شيبس", "بسكوت", "شوكولاتة", "عصير", "قهوة", "شاي"];
    const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 4);
    const found = findAvailableStoreProductsByKeywords(shuffled, 4);
    const out = document.getElementById("vipFadiWheelOut");
    if (out) {
      out.innerHTML = found.length
        ? `🎡 تشكيلة السهرة المقترحة: <b>${found.map(f => f.name).join(" + ")}</b>`
        : `🎡 تشكيلة السهرة المقترحة: <b>${shuffled.join(" + ")}</b>`;
    }
  };

  window.__vipClaimZainXP = function (xpAmount) {
    const st = loadInteractiveState();
    const today = getTodayKey();
    if (st.zainLastClaim === today) {
      if (typeof showToast === "function") showToast("⚡ لقد استلمت نقاط مهمة اليوم بالفعل! عد غداً لمهمة جديدة.");
      return;
    }
    st.zainXP = (st.zainXP || 0) + (Number(xpAmount) || 150);
    st.zainLastClaim = today;
    saveInteractiveState(st);
    if (typeof showToast === "function") showToast(`🏆 مبروك! حصلت على +${xpAmount} XP!`);
    window.openVIPDailyRoom("anime_zain");
  };

  window.__vipRevealRyuAnswer = function () {
    const el = document.getElementById("vipRyuAnswerBox");
    if (el) el.style.display = "block";
  };

  window.__vipSelectRitajMood = function (mood) {
    const st = loadInteractiveState();
    st.ritajMood = mood;
    saveInteractiveState(st);
    window.openVIPDailyRoom("anime_ritaj");
  };

  window.openVIPDailyRoom = function (personaId) {
    const p = VIP_PERSONAS[personaId];
    if (!p) return;
    if (!isPersonaUnlockedLifetime(personaId)) {
      if (typeof showToast === "function") showToast("🔒 هذه الشخصية تتطلب اشتراكاً لمرة واحدة مدى الحياة وتفعيلها من الإدارة.");
      window.openVIPShowcaseModal();
      return;
    }

    const st = loadInteractiveState();
    const offset = personaId === "friend_fadi" ? (st.fadiOffset || 0) : 0;
    const daily = getDailyContentForPersona(personaId, offset);
    const data = daily?.item || {};
    let activeKeywords = data.keywords || [];

    let modal = document.getElementById("vipDailyRoomModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "vipDailyRoomModal";
      modal.className = "modal-overlay";
      modal.style.cssText = "display:flex; z-index:10045; background:rgba(0,0,0,0.84);";
      document.body.appendChild(modal);
    } else {
      modal.style.display = "flex";
    }

    let bodyHtml = "";

    if (personaId === "coach_sakhr") {
      const doneMap = st[`coach_${getTodayKey()}`] || {};
      const exList = data.exercises || [];
      const doneCount = exList.filter((_, i) => !!doneMap[i]).length;
      const pct = exList.length ? Math.round((doneCount / exList.length) * 100) : 0;
      bodyHtml = `
        <div style="font-weight:800; color:${p.accent}; font-size:13px; margin-bottom:6px;">🏋️ برنامج اليوم: ${data.title || ""} (${pct}%)</div>
        <div style="height:6px; background:rgba(255,255,255,0.1); border-radius:999px; overflow:hidden; margin-bottom:8px;">
          <div style="height:100%; width:${pct}%; background:#10b981; transition:width 0.25s ease;"></div>
        </div>
        <div style="display:flex; flex-direction:column; gap:5px; margin-bottom:8px;">
          ${exList.map((ex, i) => `
            <label onclick="window.__vipToggleCoachEx(${i})" style="display:flex; align-items:center; gap:7px; background:rgba(16,185,129,0.08); border:1px solid ${doneMap[i] ? "#10b981" : "rgba(255,255,255,0.1)"}; border-radius:8px; padding:6px 8px; font-size:11px; cursor:pointer;">
              <span>${doneMap[i] ? "✅" : "⬜"}</span>
              <span style="${doneMap[i] ? "text-decoration:line-through; opacity:0.7;" : ""}">${ex}</span>
            </label>
          `).join("")}
        </div>
        <div style="background:rgba(255,255,255,0.04); border-radius:10px; padding:8px; font-size:10px; margin-bottom:6px;">
          <div style="font-weight:700; color:#a7f3d0; margin-bottom:5px;">⚖️ حاسبة الماء والبروتين السريعة:</div>
          <div style="display:flex; gap:6px; align-items:center;">
            <input type="number" id="vipCoachWeight" value="75" class="form-control" style="padding:4px 8px; font-size:11px; width:85px;" placeholder="الوزن كغ">
            <button type="button" onclick="window.__vipCalcCoachNeeds()" class="btn" style="width:auto; padding:4px 10px; font-size:10px; background:#10b981; color:#000;">احسب</button>
          </div>
          <div id="vipCoachCalcOut" style="margin-top:5px; color:#d1fae5;"></div>
        </div>
        <div style="font-size:10px; color:#a7f3d0;">🥗 ${data.nutritionTip || ""}</div>
      `;
    } else if (personaId === "grand_chef") {
      const servings = st.chefServings || data.baseServings || 4;
      const factor = servings / (data.baseServings || 4);
      const ingHtml = (data.ingredients || []).map(it => {
        const scaled = Math.round(it.q * factor * 10) / 10;
        return `<span style="background:rgba(245,158,11,0.14); border:1px solid rgba(245,158,11,0.35); border-radius:8px; padding:3px 7px; font-size:10px;">${it.n}: <b>${scaled} ${it.u}</b></span>`;
      }).join("");
      const stepsHtml = (data.steps || []).map((step, idx) => `<li style="margin-bottom:4px;"><b>${idx + 1}.</b> ${step}</li>`).join("");
      bodyHtml = `
        <img src="${data.imageUrl || "store-icon.png"}" onerror="this.onerror=null;this.src='store-icon.png';" alt="${data.recipeTitle || ""}" style="width:100%; max-height:135px; object-fit:cover; border-radius:10px; border:1px solid ${p.accent}; margin-bottom:8px;">
        <div style="font-weight:800; color:${p.accent}; font-size:13px; margin-bottom:6px;">🍲 وصفة اليوم: ${data.recipeTitle || ""}</div>
        <div style="display:flex; align-items:center; gap:5px; margin-bottom:7px; font-size:10px;">
          <span>عدد الأشخاص:</span>
          ${[2, 4, 6, 8].map(n => `<button type="button" onclick="window.__vipSetChefServings(${n})" class="btn" style="width:auto; padding:2px 8px; font-size:10px; background:${servings === n ? "#f59e0b" : "rgba(255,255,255,0.08)"}; color:${servings === n ? "#000" : "#fff"};">${n}</button>`).join("")}
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:5px; margin-bottom:7px;">${ingHtml}</div>
        <ol style="padding-right:16px; margin:0; font-size:11px; line-height:1.6;">${stepsHtml}</ol>
      `;
    } else if (personaId === "princess_layla") {
      const occ = st.laylaOccasion || "guests";
      const occMap = {
        guests: { label: "ضيوف فجأة", desc: "تشكيلة قهوة وشوكولاتة وبسكوت ضيافة جاهزة فوراً.", kws: ["قهوة", "شوكولاتة", "بسكوت", "شاي"] },
        morning: { label: "قهوة الصباح", desc: "فطور ناعم وقهوة أو شاي مع حلاوة أو عسل.", kws: ["قهوة", "شاي", "عسل", "حلاوة", "حليب"] },
        family: { label: "سهرة عائلية", desc: "حلى بارد بالبسكويت وعصائر وموالح لطيفة.", kws: ["بسكوت", "شوكولاتة", "عصير", "بزر", "حليب"] }
      };
      const curOcc = occMap[occ] || occMap.guests;
      activeKeywords = curOcc.kws;
      bodyHtml = `
        <div style="font-weight:800; color:${p.accent}; font-size:13px; margin-bottom:6px;">👑 منسّق المناسبات — ${data.title || ""}</div>
        <div style="display:flex; gap:5px; margin-bottom:8px;">
          ${Object.entries(occMap).map(([k, v]) => `<button type="button" onclick="window.__vipSelectLaylaOccasion('${k}')" class="btn" style="flex:1; padding:4px 6px; font-size:10px; background:${occ === k ? "#ec4899" : "rgba(255,255,255,0.08)"}; color:${occ === k ? "#000" : "#fff"};">${v.label}</button>`).join("")}
        </div>
        <div style="background:rgba(236,72,153,0.08); border:1px solid rgba(236,72,153,0.3); border-radius:10px; padding:8px; font-size:11px; line-height:1.6; margin-bottom:6px;">
          <div><b>اقتراح المناسبة:</b> ${curOcc.desc}</div>
          <div style="margin-top:4px; color:#fbcfe8;">✨ ${data.careTip || ""}</div>
        </div>
      `;
    } else if (personaId === "butler_farid") {
      const doneMap = st[`farid_${getTodayKey()}`] || {};
      const chkList = data.checklist || [];
      bodyHtml = `
        <div style="font-weight:800; color:${p.accent}; font-size:13px; margin-bottom:6px;">🎩 دفتر مؤونة البيت — ${data.title || ""}</div>
        <div style="display:flex; flex-direction:column; gap:5px; margin-bottom:8px;">
          ${chkList.map((item, i) => `
            <label onclick="window.__vipToggleFaridItem(${i})" style="display:flex; align-items:center; gap:7px; background:rgba(139,92,246,0.09); border:1px solid ${doneMap[i] ? "#8b5cf6" : "rgba(255,255,255,0.1)"}; border-radius:8px; padding:6px 8px; font-size:11px; cursor:pointer;">
              <span>${doneMap[i] ? "✅" : "⬜"}</span>
              <span style="${doneMap[i] ? "text-decoration:line-through; opacity:0.7;" : ""}">${item}</span>
            </label>
          `).join("")}
        </div>
        <div style="font-size:10px; color:#ddd6fe;">📌 ${data.budgetTip || ""}</div>
      `;
    } else if (personaId === "friend_fadi") {
      bodyHtml = `
        <div style="font-weight:800; color:${p.accent}; font-size:13px; margin-bottom:6px;">😂 ركن الفرفشة وعجلة السهرة</div>
        <div style="background:rgba(249,115,22,0.09); border:1px solid rgba(249,115,22,0.3); border-radius:10px; padding:8px; font-size:11px; line-height:1.6; margin-bottom:8px;">
          <div>${data.joke || ""}</div>
          <div style="margin-top:6px; display:flex; gap:6px;">
            <button type="button" onclick="window.__vipNextFadiJoke()" class="btn" style="flex:1; padding:4px 8px; font-size:10px; background:rgba(249,115,22,0.22); color:#fed7aa;">😂 نكتة أخرى</button>
            <button type="button" onclick="window.__vipSpinFadiWheel()" class="btn" style="flex:1; padding:4px 8px; font-size:10px; background:#f97316; color:#000;">🎡 دوّر عجلة السهرة</button>
          </div>
          <div id="vipFadiWheelOut" style="margin-top:6px; font-size:10px; color:#fed7aa;"></div>
        </div>
      `;
    } else if (personaId === "anime_zain") {
      const xp = st.zainXP || 0;
      const lvl = Math.floor(xp / 300) + 1;
      const claimedToday = st.zainLastClaim === getTodayKey();
      bodyHtml = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span style="font-weight:800; color:${p.accent}; font-size:13px;">⚡ مهمة كابتن زين</span>
          <span style="background:rgba(239,68,68,0.2); border:1px solid #ef4444; color:#fca5a5; border-radius:999px; padding:2px 9px; font-size:10px; font-weight:800;">المستوى ${lvl} • ${xp} XP</span>
        </div>
        <div style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.3); border-radius:10px; padding:8px; font-size:11px; line-height:1.6; margin-bottom:8px;">
          <div>${data.mission || ""}</div>
          <div style="margin-top:6px;">
            <button type="button" onclick="window.__vipClaimZainXP(${data.xpReward || 150})" class="btn" style="padding:5px 10px; font-size:10px; background:${claimedToday ? "#374151" : "#ef4444"}; color:${claimedToday ? "#9ca3af" : "#fff"};">
              ${claimedToday ? "✅ تم إنجاز مهمة اليوم" : `🏆 إتمام المهمة (+${data.xpReward || 150} XP)`}
            </button>
          </div>
        </div>
      `;
    } else if (personaId === "anime_ryu") {
      const deals = findCheapestStoreDeals(4);
      const dealsHtml = deals.length
        ? deals.map(d => `<div style="display:flex; justify-content:space-between; font-size:10px; padding:3px 0; border-bottom:1px dashed rgba(255,255,255,0.08);"><span>${d.name}</span><b style="color:#00e676;">${d.priceSYP.toLocaleString()} ل.س</b></div>`).join("")
        : `<div style="font-size:10px; color:#9ca3af;">تصفح الأصناف المتوفرة في الفرع.</div>`;
      bodyHtml = `
        <div style="font-weight:800; color:${p.accent}; font-size:13px; margin-bottom:6px;">🕵️ لغز اليوم ورادار الصفقات</div>
        <div style="background:rgba(56,189,248,0.08); border:1px solid rgba(56,189,248,0.3); border-radius:10px; padding:8px; font-size:11px; margin-bottom:8px;">
          <div><b>اللغز:</b> ${data.mystery || ""}</div>
          <button type="button" onclick="window.__vipRevealRyuAnswer()" class="btn" style="width:auto; margin-top:5px; padding:3px 9px; font-size:10px; background:#38bdf8; color:#000;">🔍 كشف الحل</button>
          <div id="vipRyuAnswerBox" style="display:none; margin-top:5px; color:#7dd3fc; font-weight:700;">💡 ${data.answer || ""}</div>
        </div>
        <div style="background:rgba(255,255,255,0.04); border-radius:10px; padding:8px;">
          <div style="font-size:10px; font-weight:700; color:#38bdf8; margin-bottom:4px;">📡 رادار أوفر الصفقات المتوفرة الآن:</div>
          ${dealsHtml}
        </div>
      `;
    } else {
      const mood = st.ritajMood || "happy";
      const moodMap = {
        happy: { label: "😊 مبسوط", msg: "يا سلام على هالمزاج الحلو! احتفل بعصير منعش وشوكولاتة.", kws: ["عصير", "شوكولاتة", "بسكوت"] },
        tired: { label: "😴 تعبان", msg: "سلامتك من التعب، كوب قهوة أو شاي دافئ مع حلى خفيف يجدد نشاطك.", kws: ["قهوة", "شاي", "عسل", "حليب"] },
        sweet: { label: "🍰 بدي حلى", msg: "اختيار ريتاج: حلى بارد بالبسكويت والشوكولاتة أو مهلبية!", kws: ["بسكوت", "شوكولاتة", "حليب", "نشا", "سكر"] },
        chill: { label: "🌸 رايق", msg: "أجواء روقان مع متة أو شاي ومقرمشات خفيفة.", kws: ["متة", "شاي", "بزر", "شيبس"] }
      };
      const curMood = moodMap[mood] || moodMap.happy;
      activeKeywords = curMood.kws;
      bodyHtml = `
        <div style="font-weight:800; color:${p.accent}; font-size:13px; margin-bottom:6px;">🌟 غرفة ريتاج — مقياس المزاج</div>
        <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:5px; margin-bottom:8px;">
          ${Object.entries(moodMap).map(([k, v]) => `<button type="button" onclick="window.__vipSelectRitajMood('${k}')" class="btn" style="padding:4px 6px; font-size:10px; background:${mood === k ? "#f472b6" : "rgba(255,255,255,0.08)"}; color:${mood === k ? "#000" : "#fff"};">${v.label}</button>`).join("")}
        </div>
        <div style="background:rgba(244,114,182,0.09); border:1px solid rgba(244,114,182,0.32); border-radius:10px; padding:8px; font-size:11px; line-height:1.6;">
          <div>${curMood.msg}</div>
          <div style="margin-top:4px; color:#f9a8d4; font-size:10px;">✨ ${data.message || ""}</div>
        </div>
      `;
    }

    const matchedProds = findAvailableStoreProductsByKeywords(activeKeywords, 6);
    const prodsChips = matchedProds.length
      ? matchedProds.map(m => `<span style="background:rgba(212,175,55,0.14); border:1px solid rgba(212,175,55,0.35); border-radius:999px; padding:3px 8px; font-size:10px;">${m.name}</span>`).join("")
      : `<span style="font-size:10px; color:var(--gray-text);">تصفح أقسام المتجر لإضافة المكونات المتوفرة.</span>`;

    modal.dataset.activeKws = JSON.stringify(activeKeywords);
    modal.innerHTML = `
      <div class="modal-content" style="max-width:440px; border:1.5px solid ${p.accent}; background:#121212; color:#f9fafb; border-radius:18px; padding:14px; max-height:88vh; overflow-y:auto;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px; margin-bottom:10px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <img src="${p.avatarUrl}" onerror="this.onerror=null;this.src='store-icon.png';" alt="${p.name}" style="width:38px; height:38px; border-radius:50%; object-fit:cover; border:2px solid ${p.accent};">
            <div>
              <div style="font-size:13px; font-weight:800; color:${p.accent};">${p.name} <small style="color:#9ca3af; font-weight:600;">(${p.role})</small></div>
              <div style="font-size:9px; color:#00e676;">✅ اشتراك مدى الحياة • تحديث يومي (${daily?.dateLabel || ""})</div>
            </div>
          </div>
          <button type="button" onclick="document.getElementById('vipDailyRoomModal').style.display='none'" class="btn btn-danger" style="width:auto; padding:3px 8px; font-size:11px;">✕</button>
        </div>

        ${bodyHtml}

        <div style="margin-top:10px; padding-top:8px; border-top:1px dashed rgba(255,255,255,0.12);">
          <div style="font-size:10px; font-weight:700; color:var(--gold-color); margin-bottom:5px;">🛒 أصناف مرتبطة ومتوفرة في الفرع:</div>
          <div style="display:flex; flex-wrap:wrap; gap:5px; margin-bottom:10px;">${prodsChips}</div>
          <div style="display:flex; gap:7px; flex-wrap:wrap;">
            <button type="button" onclick="window.__vipAddRoomItems('${personaId}')" class="btn" style="flex:1; background:linear-gradient(45deg,#00e676,#00b0ff); color:#000; font-size:11px;">➕ أضف المتوفر للسلة</button>
            <button type="button" onclick="window.__vipActivateAsCompanion('${personaId}')" class="btn" style="flex:1; background:rgba(212,175,55,0.18); color:var(--gold-color); border:1px solid var(--gold-color); font-size:11px;">🧚 تعيين كجنية متحدثة</button>
          </div>
        </div>
      </div>
    `;
  };

  window.__vipAddRoomItems = function (personaId) {
    const modal = document.getElementById("vipDailyRoomModal");
    let kws = [];
    try { kws = JSON.parse(modal?.dataset?.activeKws || "[]"); } catch (_) {}
    if (!kws.length) {
      const daily = getDailyContentForPersona(personaId);
      kws = daily?.item?.keywords || [];
    }
    addMatchedProductsToCart(kws);
  };

  // ==========================================================================
  // 4) نافذة عرض بطاقات الاشتراك (الباقة الشاملة + بطاقات مدى الحياة)
  // ==========================================================================
  window.openVIPShowcaseModal = function (activeTab = "all") {
    let modal = document.getElementById("vipShowcaseModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "vipShowcaseModal";
      modal.className = "modal-overlay";
      modal.style.cssText = "display:flex; z-index:10040; background:rgba(0,0,0,0.82);";
      document.body.appendChild(modal);
    } else {
      modal.style.display = "flex";
    }
    modal.dataset.vipTab = activeTab;
    renderVIPShowcaseModal();
  };

  function renderVIPShowcaseModal() {
    const modal = document.getElementById("vipShowcaseModal");
    if (!modal || modal.style.display === "none") return;
    const currentTab = modal.dataset.vipTab || "all";
    const bundleActive = isBundleUnlockedLifetime();
    const bundlePriceLbl = formatPriceFromUSD(vipConfig.bundlePriceUSD);
    const singlePriceLbl = formatPriceFromUSD(vipConfig.singlePriceUSD);

    const allList = Object.values(VIP_PERSONAS);
    const filteredList = allList.filter(p => {
      if (currentTab === "specialist") return p.group === "specialist";
      if (currentTab === "anime") return p.group === "anime";
      return true;
    });

    const cardsHtml = filteredList.map(p => {
      const unlocked = isPersonaUnlockedLifetime(p.id);
      return `
        <div style="background:#18181b; border:1px solid ${unlocked ? "#00e676" : "rgba(212,175,55,0.38)"}; border-radius:14px; padding:9px; display:flex; flex-direction:column; justify-content:space-between; gap:6px;">
          <div>
            <div style="display:flex; align-items:center; gap:7px; margin-bottom:5px;">
              <img src="${p.avatarUrl}" onerror="this.onerror=null;this.src='store-icon.png';" alt="${p.name}" style="width:38px; height:38px; border-radius:50%; object-fit:cover; border:2px solid ${p.accent}; flex-shrink:0;">
              <div style="min-width:0;">
                <div style="font-size:11px; font-weight:800; color:${p.accent}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.name}</div>
                <div style="font-size:9px; color:#d1d5db;">${p.role}</div>
              </div>
            </div>
            <div style="font-size:10px; color:#9ca3af; line-height:1.4; margin-bottom:5px;">${p.shortDesc}</div>
            <div style="font-size:9px; color:#fbbf24; font-weight:700;">اشتراك مرة واحدة مدى الحياة: ${singlePriceLbl}</div>
          </div>
          ${unlocked
            ? `<button type="button" onclick="window.openVIPDailyRoom('${p.id}')" class="btn" style="padding:5px 8px; font-size:10px; background:linear-gradient(45deg,#00e676,#00b0ff); color:#000;">🚪 دخول الغرفة التفاعلية</button>`
            : `<button type="button" onclick="window.__vipRequestSingle('${p.id}')" class="btn" style="padding:5px 8px; font-size:10px; background:rgba(212,175,55,0.16); color:var(--gold-color); border:1px solid var(--gold-color);">🔒 تفعيل مدى الحياة (إدارة)</button>`
          }
        </div>
      `;
    }).join("");

    modal.innerHTML = `
      <div class="modal-content" style="max-width:450px; border:1.5px solid var(--gold-color); background:#121212; color:#f9fafb; border-radius:18px; padding:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.12); padding-bottom:8px; margin-bottom:10px;">
          <div>
            <b style="color:var(--gold-color); font-size:13px;">👑 الشخصيات المميزة — اشتراك لمرة واحدة مدى الحياة</b>
            <div style="font-size:9px; color:#9ca3af;">التفعيل حصراً عبر الإدارة • غرف تفاعلية تتجدد يومياً</div>
          </div>
          <button type="button" onclick="document.getElementById('vipShowcaseModal').style.display='none'" class="btn btn-danger" style="width:auto; padding:3px 8px; font-size:11px;">✕</button>
        </div>

        <div style="background:linear-gradient(135deg, rgba(212,175,55,0.2), rgba(56,189,248,0.14)); border:1.5px solid var(--gold-color); border-radius:14px; padding:10px; margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
            <div>
              <div style="font-size:12px; font-weight:800; color:var(--gold-color);">💎 الباقة الشاملة (جميع الـ 8 شخصيات)</div>
              <div style="font-size:10px; color:#e5e7eb; margin-top:2px;">اشتراك واحد مدى الحياة يفتح كافة الغرف التفاعلية والأصوات الثمانية.</div>
            </div>
            <div style="font-size:11px; font-weight:800; color:#00e676;">${bundlePriceLbl}</div>
          </div>
          <div style="margin-top:8px;">
            ${bundleActive
              ? `<span style="display:inline-block; background:rgba(0,230,118,0.18); color:#00e676; border:1px solid #00e676; border-radius:999px; padding:4px 10px; font-size:10px; font-weight:800;">✅ الباقة الشاملة مفعّلة مدى الحياة</span>`
              : `<button type="button" onclick="window.__vipRequestBundle()" class="btn" style="background:linear-gradient(45deg,#d4af37,#f59e0b); color:#000; font-size:11px; padding:6px 10px;">👑 طلب تفعيل الباقة الشاملة مدى الحياة عبر الإدارة</button>`
            }
          </div>
        </div>

        <div style="display:flex; gap:6px; margin-bottom:10px;">
          <button type="button" onclick="window.openVIPShowcaseModal('all')" class="cat-btn" style="flex:1; background:${currentTab === "all" ? "var(--gold-color)" : "transparent"}; color:${currentTab === "all" ? "#000" : "var(--text-color)"}; border:1px solid var(--gold-color);">الكل (8)</button>
          <button type="button" onclick="window.openVIPShowcaseModal('specialist')" class="cat-btn" style="flex:1; background:${currentTab === "specialist" ? "var(--gold-color)" : "transparent"}; color:${currentTab === "specialist" ? "#000" : "var(--text-color)"}; border:1px solid var(--gold-color);">المميزة (5)</button>
          <button type="button" onclick="window.openVIPShowcaseModal('anime')" class="cat-btn" style="flex:1; background:${currentTab === "anime" ? "var(--gold-color)" : "transparent"}; color:${currentTab === "anime" ? "#000" : "var(--text-color)"}; border:1px solid var(--gold-color);">الأنمي (3)</button>
        </div>

        <div style="display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:8px; max-height:48vh; overflow-y:auto; padding-left:2px;">
          ${cardsHtml}
        </div>
      </div>
    `;
  }

  window.__vipRequestSingle = function (personaId) {
    const p = VIP_PERSONAS[personaId];
    if (!p) return;
    openWhatsAppSubscriptionRequest(`شخصية (${p.name} - ${p.role})`, formatPriceFromUSD(vipConfig.singlePriceUSD));
  };

  window.__vipRequestBundle = function () {
    openWhatsAppSubscriptionRequest("الباقة الشاملة (8 شخصيات)", formatPriceFromUSD(vipConfig.bundlePriceUSD));
  };

  // ==========================================================================
  // 5) لوحة التفعيل الحصرية في لوحة الإدارة (#adminModal)
  // ==========================================================================
  function renderAdminVIPTab() {
    const box = document.getElementById("admVipActivationBox");
    if (!box) return;
    const targetCust = String(document.getElementById("admVipTargetCustomer")?.value || getCustomerKey() || "guest").replace(/[^0-9A-Za-z_]/g, "") || "guest";
    const custData = adminEntitlements.customers?.[targetCust] || {
      bundleLifetime: !!adminEntitlements.bundleLifetime,
      personas: { ...(adminEntitlements.personas || {}) }
    };

    const rowsHtml = Object.values(VIP_PERSONAS).map(p => {
      const active = !!(custData.bundleLifetime || custData.personas?.[p.id]);
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; padding:6px 8px; border-bottom:1px dashed var(--border-color); font-size:11px;">
          <div>
            <b>${p.name}</b> <small style="color:var(--gray-text);">(${p.role})</small>
            <span style="margin-right:6px; color:${active ? "#00e676" : "#f59e0b"}; font-weight:700;">${active ? "• مفعّل مدى الحياة" : "• غير مفعّل"}</span>
          </div>
          <button type="button" onclick="window.__adminToggleVip('${targetCust}', '${p.id}', ${!active})" class="btn" style="width:auto; padding:3px 9px; font-size:10px; background:${active ? "#ef4444" : "#10b981"}; color:#000;">
            ${active ? "إلغاء التفعيل" : "تفعيل مدى الحياة"}
          </button>
        </div>
      `;
    }).join("");

    box.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; background:rgba(212,175,55,0.12); border:1px solid var(--gold-color); border-radius:8px; padding:8px; margin-bottom:8px; font-size:11px;">
        <div>
          <b>💎 الباقة الشاملة مدى الحياة (8 شخصيات)</b>
          <div style="font-size:10px; color:var(--gray-text);">الحالة للزبون (${targetCust}): ${custData.bundleLifetime ? "مفعّلة مدى الحياة" : "غير مفعّلة"}</div>
        </div>
        <button type="button" onclick="window.__adminToggleVip('${targetCust}', 'BUNDLE_ALL_8', ${!custData.bundleLifetime})" class="btn" style="width:auto; padding:4px 10px; font-size:10px; background:${custData.bundleLifetime ? "#ef4444" : "var(--gold-color)"}; color:#000;">
          ${custData.bundleLifetime ? "إلغاء الباقة" : "تفعيل الباقة الشاملة"}
        </button>
      </div>
      <div>${rowsHtml}</div>
    `;
  }

  window.__adminToggleVip = function (custKey, targetId, enable) {
    adminSetEntitlement(custKey, targetId, enable);
  };

  window.__adminSaveVipPrices = function () {
    const singleVal = Math.max(1, parseFloat(document.getElementById("admVipSinglePriceUSD")?.value || vipConfig.singlePriceUSD) || 5);
    const bundleVal = Math.max(1, parseFloat(document.getElementById("admVipBundlePriceUSD")?.value || vipConfig.bundlePriceUSD) || 25);
    vipConfig = { singlePriceUSD: singleVal, bundlePriceUSD: bundleVal, updatedAt: new Date().toISOString().slice(0, 10) };
    saveLocalConfig(vipConfig);
    if (typeof db !== "undefined" && db && typeof db.ref === "function") {
      try { db.ref("vip_config").set(vipConfig).catch(() => {}); } catch (_) {}
    }
    if (typeof showToast === "function") showToast("✅ تم حفظ أسعار الاشتراك مدى الحياة.");
    renderVIPShowcaseModal();
  };

  function mountAdminVIPSection() {
    const adminContent = document.querySelector("#adminModal .modal-content");
    const tabsBar = adminContent?.querySelector(".categories");
    if (!adminContent || !tabsBar || document.getElementById("admTab14VIP")) return;

    const tabBtn = document.createElement("button");
    tabBtn.className = "cat-btn";
    tabBtn.textContent = "👑 اشتراكات VIP";
    tabBtn.onclick = function () {
      if (typeof switchAdminTab === "function") switchAdminTab("admTab14VIP", this);
      renderAdminVIPTab();
    };
    tabsBar.appendChild(tabBtn);

    const tabDiv = document.createElement("div");
    tabDiv.id = "admTab14VIP";
    tabDiv.className = "admin-tab";
    tabDiv.style.display = "none";
    tabDiv.innerHTML = `
      <div class="adm-sec" style="border-color:var(--gold-color);">
        <div class="adm-sec-title"><span>👑 إدارة تفعيل الشخصيات المدفوعة مدى الحياة (للإدارة حصراً)</span></div>
        <div class="form-group">
          <label>معرّف / رقم هاتف الزبون المستهدف:</label>
          <input type="text" id="admVipTargetCustomer" class="form-control" value="${getCustomerKey()}" oninput="renderAdminVIPTab()" placeholder="مثال: 0965461504 أو guest">
        </div>
        <div class="stats-grid" style="margin-bottom:8px;">
          <div class="form-group">
            <label>سعر الشخصية الواحدة مدى الحياة ($):</label>
            <input type="number" id="admVipSinglePriceUSD" class="form-control" value="${vipConfig.singlePriceUSD}">
          </div>
          <div class="form-group">
            <label>سعر الباقة الشاملة مدى الحياة ($):</label>
            <input type="number" id="admVipBundlePriceUSD" class="form-control" value="${vipConfig.bundlePriceUSD}">
          </div>
        </div>
        <button type="button" onclick="window.__adminSaveVipPrices()" class="btn" style="background:var(--gold-color); color:#000; font-size:11px; margin-bottom:10px;">💾 حفظ الأسعار</button>
        <div id="admVipActivationBox"></div>
      </div>
    `;
    adminContent.appendChild(tabDiv);
    renderAdminVIPTab();
  }

  function injectVIPButtonIntoAssistantHeader() {
    const actionsEl = document.querySelector("#futuristicAiHeader .fut-ai-header-actions");
    if (!actionsEl) return;
    let btn = document.getElementById("futVipShowcaseBtn");
    if (!btn) {
      btn = document.createElement("button");
      btn.id = "futVipShowcaseBtn";
      btn.type = "button";
      btn.className = "fut-icon-btn fut-gold-btn";
      actionsEl.insertBefore(btn, actionsEl.firstChild);
    }
    const unlockedCount = Object.keys(VIP_PERSONAS).filter(id => isPersonaUnlockedLifetime(id)).length;
    btn.textContent = unlockedCount > 0 ? `👑 غرف VIP (${unlockedCount})` : "👑 غرف VIP";
    btn.title = "غرف الشخصيات المميزة والباقة الشاملة (اشتراك مدى الحياة)";
    btn.onclick = function () { window.openVIPShowcaseModal("all"); };
  }

  // ==========================================================================
  // 6) ربط الشخصيات المفعّلة بمحرك الجنيات المتحدثة + حركة الدخول البارزة
  // ==========================================================================
  function enrichVIPPersonaForCompanion(p) {
    if (!p) return null;
    const baseGreets = [
      p.greet,
      `${p.name} معك (${p.role})، بماذا أساعدك اليوم في متجر معاذ؟`,
      `أهلاً بك، ${p.name} جاهز لتجهيز طلبك بسرعة ودقة.`
    ].filter(Boolean);

    const chatGoods = {
      coach_sakhr: ["بأعلى جاهزية ولياقة! هيا نكمل يومك بنشاط.", "تمام التمام يا بطل، ما هدفك الرياضي أو الغذائي اليوم؟"],
      grand_chef: ["بأفضل حال في المطبخ، المقادير جاهزة والذوق مضمون.", "أهلاً بك، أخبرني عن الطبخة أو الصنف الذي تريده اليوم."],
      princess_layla: ["بكل لطف وصفاء، يسعدني جداً مساعدتك اليوم.", "أهلاً بك، أختار لك دائماً ما يليق بذوقك الرفيع."],
      butler_farid: ["تحت أمرك سيدي، كل شيء منظم ومضبوط بدقة.", "بأتم الاستعداد لتنسيق مؤونة واحتياجات اليوم."],
      friend_fadi: ["عايش ومبسوط ورايق، ومجهزلك أحلى مزاج وسهرة!", "يا هلا بالصديق، شو بنضبط اليوم ليكسر الروتين؟"],
      anime_zain: ["طاقتي مشتعلة ومستعد لأي مهمة تسوق اليوم!", "بأقصى سرعة وحماس، انطلق لنجهز وقود الأبطال!"],
      anime_ryu: ["كل المؤشرات ممتازة، والصفقة الأذكى بانتظارك.", "بهدوء وتحليل دقيق، اخترت لك الأنسب دائماً."],
      anime_ritaj: ["مبسوطة ومشرقة بوجودك، وراح نخلي يومك أحلى!", "أهلاً بك، مع ريتاج كل شيء ألطف وأجمل!"]
    };

    const thanksList = {
      coach_sakhr: ["كفو منك، استمر على هذا الانضباط الرائع.", "على الرحب يا بطل، دائماً في الخدمة."],
      grand_chef: ["بالعافية مقدماً، يسعدني تقديم الأفضل دائماً.", "العفو، نكهة متجر معاذ ترحب بك."],
      princess_layla: ["بكل سرور، وجودك يزيد المكان جمالاً.", "العفو، يسعدني دائماً خدمتك بلطف."],
      butler_farid: ["على الرحب والسعة سيدي، في خدمتكم دائماً.", "لا شكر على واجب، التنظيم من أولوياتي."],
      friend_fadi: ["ولو يا غالي، الصديق وقت الضيق والطلب!", "العفو يا معلم، خلينا نشوف شو بدك بعد."],
      anime_zain: ["هذا واجب الأبطال، نراكم في المهمة القادمة!", "العفو، انطلق بثقة ونجاح!"],
      anime_ryu: ["تحليل ناجح، يسعدني مساعدتك دائماً.", "العفو، لأي استفسار أنا هنا."],
      anime_ritaj: ["شكراً لك أنت على لطفك، يسعدني أساعدك دايماً!", "العفو يا حلو، نورت المتجر!"]
    };

    const addedMsgs = {
      coach_sakhr: [(n) => `ممتاز يا بطل، تمت إضافة ${n} إلى سلة القوة.`],
      grand_chef: [(n) => `أضفت ${n} إلى السلة بعناية للمطبخ.`],
      princess_layla: [(n) => `بكل ذوق، تمت إضافة ${n} إلى سلتك.`],
      butler_farid: [(n) => `تم قيد وإضافة ${n} إلى السلة بنظام.`],
      friend_fadi: [(n) => `يا سلام! نزلت ${n} بالسلة وصارت جاهزة.`],
      anime_zain: [(n) => `تمت إضافة ${n} إلى السلة، مهمة ناجحة!`],
      anime_ryu: [(n) => `تمت إضافة ${n} إلى السلة بعد التحقق من التوفر.`],
      anime_ritaj: [(n) => `ياي! تمت إضافة ${n} إلى سلتك بكل حب.`]
    };

    return {
      ...p,
      roleBadge: `${p.gender === "female" ? "أنثوي" : "ذكري"} • ${p.badge || p.role}`,
      specialtyNote: `${p.name} (${p.role}): ${p.shortDesc}`,
      fallbackDetune: Math.round((p.pitchSemitones || 0) * 90),
      fallbackRate: p.speed || 1.24,
      greets: baseGreets,
      timeGreets: {
        morning: [`صباح الخير والنشاط، ${p.name} معك في متجر معاذ.`],
        evening: [`مساء الخير، ${p.name} جاهز لخدمتك اليوم.`]
      },
      chatGood: (chatGoods[p.id] || ["أنا بخير، كيف يمكنني خدمتك اليوم؟"])[0],
      chatGoods: chatGoods[p.id] || ["أنا بخير، كيف يمكنني خدمتك اليوم؟"],
      thanks: (thanksList[p.id] || ["العفو، يسعدني دائماً خدمتك."])[0],
      thanksList: thanksList[p.id] || ["العفو، يسعدني دائماً خدمتك."],
      addedMsgs: addedMsgs[p.id] || [(n) => `تمت إضافة ${n} إلى السلة.`],
      recipeReady: (t) => `جهزت لك المتوفر لوصفة ${t} بأسلوب ${p.name}، حدد الكمية.`,
      recipeMissing: (t) => `بعض مكونات ${t} غير متوفرة حالياً في الفرع.`,
      itemsReady: () => `عرضت لك الأصناف المتوفرة في الفرع، حدد الكمية.`,
      alternativeReplies: ["الطلب غير متوفر حالياً، وعرضت لك أقرب البدائل المتوفرة."],
      habitReplies: ["هذه اختياراتك المعتادة والمتوفرة في الفرع."],
      notFounds: ["لم أجد صنفاً مطابقاً متوفراً الآن."],
      notFound: "لم أجد صنفاً مطابقاً متوفراً الآن."
    };
  }

  window.triggerVIPProminentEntrance = function (personaId) {
    const p = VIP_PERSONAS[personaId];
    if (!p) return;
    if (!document.getElementById("vipEntranceAnimStyle")) {
      const st = document.createElement("style");
      st.id = "vipEntranceAnimStyle";
      st.textContent = `
        @keyframes vipGrandEntrance {
          0% { opacity: 0; transform: translateY(24px) scale(0.72) rotate(-8deg); filter: drop-shadow(0 0 0 rgba(212, 175, 55, 0)); }
          55% { opacity: 1; transform: translateY(-6px) scale(1.14) rotate(4deg); filter: drop-shadow(0 0 22px rgba(212, 175, 55, 0.85)); }
          100% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); filter: drop-shadow(0 0 12px rgba(56, 189, 248, 0.45)); }
        }
        @keyframes vipBannerSlide {
          0% { opacity: 0; transform: translate(-50%, -18px) scale(0.92); }
          15%, 85% { opacity: 1; transform: translate(-50%, 0) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -14px) scale(0.95); }
        }
        .vip-grand-entrance-active { animation: vipGrandEntrance 0.85s cubic-bezier(0.22, 1, 0.36, 1) forwards !important; }
        #vipEntranceSpotlightBanner {
          position: fixed; top: 16px; left: 50%; transform: translateX(-50%); z-index: 10060;
          background: linear-gradient(135deg, rgba(18, 18, 22, 0.96), rgba(30, 27, 15, 0.96));
          border: 1.5px solid #d4af37; border-radius: 999px; padding: 7px 14px;
          display: flex; align-items: center; gap: 8px; color: #f9fafb; font-size: 11px; font-weight: 800;
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.55), 0 0 18px rgba(212, 175, 55, 0.45);
          pointer-events: none; animation: vipBannerSlide 2.6s ease forwards;
        }
      `;
      document.head.appendChild(st);
    }

    const orb = document.getElementById("petCharOrb");
    if (orb) {
      orb.classList.remove("vip-grand-entrance-active");
      void orb.offsetWidth;
      orb.classList.add("vip-grand-entrance-active");
      setTimeout(() => orb.classList.remove("vip-grand-entrance-active"), 900);
    }

    let banner = document.getElementById("vipEntranceSpotlightBanner");
    if (banner) banner.remove();
    banner = document.createElement("div");
    banner.id = "vipEntranceSpotlightBanner";
    banner.style.borderColor = p.accent || "#d4af37";
    banner.innerHTML = `
      <img src="${p.avatarUrl}" onerror="this.onerror=null;this.src='store-icon.png';" alt="${p.name}" style="width:24px; height:24px; border-radius:50%; object-fit:cover; border:1.5px solid ${p.accent || "#d4af37"};">
      <span style="color:${p.accent || "#fbbf24"};">✨ دخل ${p.name}</span>
      <span style="color:#d1d5db; font-weight:600;">(${p.role})</span>
    `;
    document.body.appendChild(banner);
    setTimeout(() => { if (banner && banner.parentNode) banner.remove(); }, 2650);
  };

  function syncUnlockedVIPPersonasIntoCompanion() {
    const sel = document.getElementById("petPersonaSelect");
    if (!sel) return;
    const unlockedVip = Object.values(VIP_PERSONAS).filter(p => isPersonaUnlockedLifetime(p.id));
    Array.from(sel.options).forEach(opt => {
      if (opt.dataset && opt.dataset.vipOption === "1") opt.remove();
    });
    unlockedVip.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.dataset.vipOption = "1";
      opt.textContent = `👑 ${p.name} — ${p.role}`;
      sel.appendChild(opt);
    });
  }

  const _origSelectPetPersona = window.selectPetPersona;
  window.selectPetPersona = function (key) {
    if (VIP_PERSONAS[key]) {
      if (!isPersonaUnlockedLifetime(key)) {
        if (typeof showToast === "function") showToast("🔒 هذه الشخصية تتطلب اشتراكاً مدى الحياة وتفعيلها من الإدارة.");
        window.openVIPShowcaseModal("all");
        return;
      }
      if (typeof window.__registerDynamicCompanionPersona === "function") {
        window.__registerDynamicCompanionPersona(key, enrichVIPPersonaForCompanion(VIP_PERSONAS[key]));
      }
      if (typeof _origSelectPetPersona === "function") _origSelectPetPersona(key);
      window.triggerVIPProminentEntrance(key);
      return;
    }
    if (typeof _origSelectPetPersona === "function") _origSelectPetPersona(key);
  };

  window.__vipActivateAsCompanion = function (personaId) {
    const p = VIP_PERSONAS[personaId];
    if (!p) return;
    if (!isPersonaUnlockedLifetime(personaId)) {
      window.openVIPShowcaseModal("all");
      return;
    }
    syncUnlockedVIPPersonasIntoCompanion();
    window.selectPetPersona(personaId);
    const roomModal = document.getElementById("vipDailyRoomModal");
    if (roomModal) roomModal.style.display = "none";
  };

  if (typeof db !== "undefined" && db && typeof db.ref === "function") {
    try {
      db.ref("vip_config").on("value", snap => {
        const val = snap.val();
        if (val && typeof val === "object") {
          vipConfig = { ...vipConfig, ...val };
          saveLocalConfig(vipConfig);
        }
      });
      const ck = getCustomerKey();
      db.ref(`vip_entitlements/${ck}`).on("value", snap => {
        const val = snap.val();
        if (val && typeof val === "object") {
          adminEntitlements.customers = adminEntitlements.customers || {};
          adminEntitlements.customers[ck] = val;
          if (ck === getCustomerKey()) {
            adminEntitlements.bundleLifetime = !!val.bundleLifetime;
            adminEntitlements.personas = { ...(val.personas || {}) };
          }
          saveLocalEntitlements(adminEntitlements);
          renderVIPShowcaseModal();
          renderAdminVIPTab();
          syncUnlockedVIPPersonasIntoCompanion();
          injectVIPButtonIntoAssistantHeader();
        }
      });
    } catch (_) {}
  }

  function initVIPSystem() {
    injectVIPButtonIntoAssistantHeader();
    mountAdminVIPSection();
    syncUnlockedVIPPersonasIntoCompanion();
    const curSelVal = document.getElementById("petPersonaSelect")?.value;
    if (curSelVal && VIP_PERSONAS[curSelVal] && isPersonaUnlockedLifetime(curSelVal) && typeof window.__registerDynamicCompanionPersona === "function") {
      window.__registerDynamicCompanionPersona(curSelVal, enrichVIPPersonaForCompanion(VIP_PERSONAS[curSelVal]));
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(initVIPSystem, 120));
  } else {
    setTimeout(initVIPSystem, 120);
  }

  const _origRenderStoreVIP = window.renderStore;
  window.renderStore = function () {
    if (typeof _origRenderStoreVIP === "function") _origRenderStoreVIP();
    setTimeout(initVIPSystem, 80);
  };

  window.MoaathVIPSystem = {
    version: "2.0-interactive-daily-rooms",
    personas: VIP_PERSONAS,
    isPersonaUnlockedLifetime,
    isBundleUnlockedLifetime,
    getDailyContentForPersona,
    adminSetEntitlement
  };
})();
