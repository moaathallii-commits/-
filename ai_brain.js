// ============================================================================
// عقل الذكاء والتعلم الذاتي المستقل لمتجر معاذ (ai_brain.js)
// - فهم المرادفات المحلية والفصحى وتصحيح الأخطاء الإملائية تلقائياً (Fuzzy Matching)
// - نظام تعلم ذاتي متقدم:
//   1) ترابط الاستعلامات بالمنتجات (Query-to-Product Reinforcement)
//   2) ترابط السلة المشترك (Co-Occurrence / Basket Affinity)
//   3) التعلّم من الرفض والتجاهل (Implicit Negative Feedback / Downranking)
//   4) تفضيلات الأوقات وأيام الأسبوع وتلاشي الأوزان القديمة (Recency Decay)
//   5) التنبؤ بالطلبات الدورية وإعادة الطلب الذكية (Predictive Reorder)
// - يعمل محلياً بالكامل (localStorage) + مزامنة مرادفات جماعية اختيارية عبر Firebase
// - معزول تماماً عن الدفع وشام كاش والإيصالات المالية
// ============================================================================

(function () {
  if (window.MoaathAIBrain) return;

  const PROFILE_KEY = "moaath_ai_brain_profile_v2";
  const LEGACY_PROFILE_KEY = "moaath_ai_brain_profile_v1";
  const MAX_HISTORY = 60;

  const DEFAULT_SYNONYM_GROUPS = [
    ["دبس بندورة", "دبس بندوره", "مربى بندورة", "مربى بندوره", "رب بندورة", "رب بندوره", "رب البندورة", "رب البندوره", "معجون الطماطم", "معجون طماطم", "صلصة طماطم", "صلصة بندورة", "صلصه", "صلصة"],
    ["بندورة", "بندوره", "طماطم", "طماطة", "طماطه"],
    ["بطاطا", "بطاطس", "بطاطا حلوة", "بطاطا حلوه"],
    ["رز", "ارز", "أرز", "تمن", "رز مصري", "رز بسمتي", "رز حبة قصيرة", "رز حبة طويلة"],
    ["برغل", "برغل خشن", "برغل ناعم", "برغل أسمر", "برغل اسمر", "برغل أبيض", "برغل ابيض"],
    ["فريكة", "فريكه", "فريك", "فريكة خضراء", "فريكه خضراء"],
    ["عدس", "عدس أحمر", "عدس احمر", "عدس أصفر", "عدس اصفر", "عدس بني", "عدس مجروش", "عدس حب"],
    ["طحين", "دقيق", "طحين أبيض", "طحين ابيض", "طحين أسمر", "طحين اسمر", "طحين فرخة", "طحين خبز"],
    ["سميد", "سميد ناعم", "سميد خشن", "سميد وسط"],
    ["نشا", "نشاء", "نشا الذرة", "نشاء الذرة", "كورن فلور"],
    ["سكر", "سكر أبيض", "سكر ابيض", "سكر ناعم", "سكر بودرة", "سكر حبيبات"],
    ["ملح", "ملح طعام", "ملح ناعم", "ملح خشن", "ملح بحري"],
    ["زيت", "زيت نباتي", "زيت قلي", "زيت طبخ", "زيت ذرة", "زيت دوار الشمس", "زيت صويا"],
    ["زيت زيتون", "زيتون", "زيت بلدي"],
    ["سمن", "سمنة", "سمنه", "سمن حيواني", "سمن نباتي", "زبدة", "زبده"],
    ["بهار", "بهارات", "توابل", "بهار مشكل", "سبع بهارات", "بهارات مشكلة"],
    ["كمون", "كمون مطحون", "كمون حب"],
    ["فلفل", "فلفل أسود", "فلفل اسود", "فلفل أحمر", "فلفل احمر", "فلفل حار", "شطة", "فليفلة", "فليفله"],
    ["كركم", "عصفر", "كاري", "قرفة", "دارسين", "هيل", "حبهان", "كزبرة", "كزبره", "نعناع", "نعنع", "زعتر"],
    ["لبن", "زبادي", "رائب", "روب", "لبن رائب", "لبن زبادي"],
    ["لبنة", "لبنه", "لبنة مكبسة", "لبنه مكبسه", "لبنة كرات"],
    ["جبن", "جبنة", "جبنه", "جبن أبيض", "جبن ابيض", "جبن بلدي", "قشقوان", "عكاوي", "شلل", "موزاريلا", "جبن مثلثات", "جبن كريمي"],
    ["حليب", "حليب سائل", "حليب بودرة", "حليب بودره", "حليب مجفف", "نيدو"],
    ["بيض", "بيض بلدي", "بيض مزارع", "كرتونة بيض", "صحن بيض"],
    ["خبز", "صمون", "توست", "خبز عربي", "خبز سياحي", "خبز مشروح", "رغيف", "أرغفة"],
    ["متة", "مته", "خارطة", "خورطة", "بيبوري", "اماندا", "أماندا", "كاناريا", "كاس متة", "بومبيليا"],
    ["شاي", "شاي أحمر", "شاي احمر", "شاي أخضر", "شاي اخضر", "شاي فرط", "شاي أكياس", "شاي اكياس", "ليبتون"],
    ["قهوة", "قهوه", "بن", "قهوة عربية", "قهوة تركية", "نسكافيه", "كابتشينو"],
    ["عصير", "مشروب", "مشروبات", "شراب", "كولا", "بيبسي", "سفن", "مشروبات غازية", "غازيات"],
    ["ماء", "مياه", "مي", "ميه", "ماء شرب"],
    ["بزر", "بذر", "لب", "موالح", "تسالي", "نقارش", "مكسرات", "بزر دوار الشمس", "بزر أبيض", "بزر ابيض", "قضامة", "قضامه"],
    ["شيبس", "شبس", "بطاطا شيبس", "مقرمشات", "سناكس", "كناكر"],
    ["بسكوت", "بسكويت", "بيسكويت", "بسكوت شاي", "بسكوت مالح"],
    ["شوكولاتة", "شوكولاته", "شوكولا", "شكولاته", "كاكاو", "بودرة كاكاو"],
    ["حلاوة", "حلاوه", "حلاوة طحينية", "حلاوه طحينيه", "طحينة", "طحينه", "مربى", "عسل", "دبس"],
    ["سائل جلي", "دواء جلي", "دوا جلي", "جلي", "صابون جلي", "سائل صحون", "فيري"],
    ["مسحوق غسيل", "دواء غسيل", "دوا غسيل", "غسيل", "مسحوق غسيل ملابس", "تايد", "اريال", "برسيل", "اومو"],
    ["كلور", "كلوركس", "مبيض", "فلاش", "معقم", "مطهر", "منظف", "ديتول"],
    ["صابون", "شامبو", "سائل يدين", "صابون يدين", "معجون أسنان", "معجون اسنان", "ليفة", "ليف", "إسفنج", "اسفنج"],
    ["حفاضات", "فوط أطفال", "فوط اطفال", "بامبرز", "حفوضات", "محارم", "مناديل", "كلينكس", "فاين"]
  ];

  let dynamicSynonymGroups = [];

  (function loadInitialSynonyms() {
    const initial = [];
    if (window.MoaathAIRecipes && Array.isArray(window.MoaathAIRecipes.interchangeableGroups)) {
      initial.push(...window.MoaathAIRecipes.interchangeableGroups);
    }
    ["moaath_store_local_synonyms", "moaath_local_synonyms_v69", "moaath_local_synonyms_v68"].forEach(k => {
      try {
        const raw = JSON.parse(localStorage.getItem(k) || "{}");
        if (raw && typeof raw === "object") {
          Object.values(raw).forEach(g => {
            if (Array.isArray(g) && g.length >= 2) initial.push(g);
          });
        }
      } catch (_) {}
    });
    if (initial.length) dynamicSynonymGroups = initial;
  })();

  function normalizeArabicText(str) {
    return String(str || "")
      .toLowerCase()
      .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .replace(/[^\w\u0600-\u06FF\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function stripAlPrefix(word) {
    if (word.length > 3 && word.startsWith("ال")) return word.slice(2);
    return word;
  }

  function tokenize(str) {
    const stopWords = new Set([
      "لو", "سمحت", "اريد", "بدي", "ابغى", "ابي", "اعطني", "هات", "ممكن",
      "من", "في", "على", "الى", "إلى", "عن", "مع", "يا", "شو",
      "تجهيز", "فاتوره", "فاتورة", "طلب", "مواد", "اغراض", "أغراض", "بعض", "شوية", "كم"
    ]);
    return normalizeArabicText(str)
      .split(/\s+/)
      .filter(w => w.length >= 2 && !stopWords.has(w));
  }

  function levenshtein(a, b) {
    if (a === b) return 0;
    const al = a.length, bl = b.length;
    if (!al) return bl;
    if (!bl) return al;
    if (Math.abs(al - bl) > 2) return 99;
    const prev = new Array(bl + 1);
    const curr = new Array(bl + 1);
    for (let j = 0; j <= bl; j++) prev[j] = j;
    for (let i = 1; i <= al; i++) {
      curr[0] = i;
      const ca = a.charCodeAt(i - 1);
      for (let j = 1; j <= bl; j++) {
        const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
        curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      }
      for (let j = 0; j <= bl; j++) prev[j] = curr[j];
    }
    return prev[bl];
  }

  function isFuzzyMatch(wordA, wordB) {
    const a = stripAlPrefix(wordA);
    const b = stripAlPrefix(wordB);
    if (!a || !b) return { match: false, score: 0 };
    if (a === b) return { match: true, score: 1.0 };
    if (a.length >= 3 && b.length >= 3 && (b.includes(a) || a.includes(b))) {
      return { match: true, score: 0.88 };
    }
    const maxLen = Math.max(a.length, b.length);
    if (maxLen < 3) return { match: false, score: 0 };
    const dist = levenshtein(a, b);
    const allowed = maxLen <= 4 ? 1 : 2;
    if (dist <= allowed) {
      return { match: true, score: Math.max(0.55, 1 - dist / maxLen) };
    }
    return { match: false, score: 0 };
  }

  function getAllSynonymGroups() {
    const extraFromRecipes = (window.MoaathAIRecipes && Array.isArray(window.MoaathAIRecipes.interchangeableGroups))
      ? window.MoaathAIRecipes.interchangeableGroups
      : [];
    return [...dynamicSynonymGroups, ...extraFromRecipes, ...DEFAULT_SYNONYM_GROUPS];
  }

  function expandWithSynonyms(tokens) {
    const expanded = new Map();
    const groups = getAllSynonymGroups();
    tokens.forEach(tok => {
      const cleanTok = stripAlPrefix(tok);
      expanded.set(tok, 1.0);
      if (cleanTok !== tok) expanded.set(cleanTok, 0.98);
      groups.forEach(group => {
        const normGroup = group.map(normalizeArabicText).filter(Boolean);
        const hit = normGroup.some(g => {
          const gWords = g.split(/\s+/);
          return g === tok || g === cleanTok || gWords.some(gw => isFuzzyMatch(tok, gw).match);
        });
        if (hit) {
          normGroup.forEach(syn => {
            if (!expanded.has(syn)) expanded.set(syn, 0.82);
            syn.split(/\s+/).forEach(sw => {
              if (sw.length >= 2 && !expanded.has(sw)) expanded.set(sw, 0.75);
            });
          });
        }
      });
    });
    return expanded;
  }

  function getTimeSlot() {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return "morning";
    if (h >= 12 && h < 18) return "afternoon";
    return "evening";
  }

  function loadProfile() {
    try {
      let raw = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null");
      if (!raw) {
        raw = JSON.parse(localStorage.getItem(LEGACY_PROFILE_KEY) || "{}");
      }
      return {
        searchHistory: Array.isArray(raw.searchHistory) ? raw.searchHistory : [],
        productAffinity: raw.productAffinity && typeof raw.productAffinity === "object" ? raw.productAffinity : {},
        categoryAffinity: raw.categoryAffinity && typeof raw.categoryAffinity === "object" ? raw.categoryAffinity : {},
        queryToProduct: raw.queryToProduct && typeof raw.queryToProduct === "object" ? raw.queryToProduct : {},
        coOccurrence: raw.coOccurrence && typeof raw.coOccurrence === "object" ? raw.coOccurrence : {},
        ignoredPenalty: raw.ignoredPenalty && typeof raw.ignoredPenalty === "object" ? raw.ignoredPenalty : {},
        personaAffinity: raw.personaAffinity && typeof raw.personaAffinity === "object" ? raw.personaAffinity : {},
        recipeAffinity: raw.recipeAffinity && typeof raw.recipeAffinity === "object" ? raw.recipeAffinity : {},
        timeHabits: raw.timeHabits && typeof raw.timeHabits === "object"
          ? raw.timeHabits
          : { morning: {}, afternoon: {}, evening: {} }
      };
    } catch (_) {
      return {
        searchHistory: [],
        productAffinity: {},
        categoryAffinity: {},
        queryToProduct: {},
        coOccurrence: {},
        ignoredPenalty: {},
        personaAffinity: {},
        recipeAffinity: {},
        timeHabits: { morning: {}, afternoon: {}, evening: {} }
      };
    }
  }

  function saveProfile(profile) {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch (_) {}
  }

  function recordSearch(rawQuery, matchedCount) {
    const norm = normalizeArabicText(rawQuery);
    if (!norm) return;
    const profile = loadProfile();
    profile.searchHistory.unshift({
      q: String(rawQuery || "").trim().slice(0, 80),
      norm,
      matchedCount: Number(matchedCount) || 0,
      ts: Date.now()
    });
    if (profile.searchHistory.length > MAX_HISTORY) {
      profile.searchHistory = profile.searchHistory.slice(0, MAX_HISTORY);
    }
    saveProfile(profile);

    if (matchedCount === 0 && typeof db !== "undefined" && db.ref) {
      try {
        const key = norm.slice(0, 40).replace(/[.#$/[\]]/g, "_");
        if (key) {
          db.ref(`ai_brain/unmatched_queries/${key}`).transaction(cur => ({
            id: key,
            query: String(rawQuery || "").trim().slice(0, 80),
            count: (cur?.count || 0) + 1,
            lastSeen: new Date().toISOString()
          }));
        }
      } catch (_) {}
    }
  }

  // التعلّم الإيجابي من اختيار الزبون (إضافة للسلة + استعلام + وقت + تفضيل الكمية)
  function recordCustomerChoice(productId, category, qty = 1, lastQuery = "") {
    if (!productId) return;
    const profile = loadProfile();
    const now = Date.now();
    const slot = getTimeSlot();
    const cleanQty = Math.max(1, Number(qty) || 1);

    const pStat = profile.productAffinity[productId] || { adds: 0, totalQty: 0, lastAddedAt: 0, avgQty: 1 };
    pStat.adds = Math.min(120, (pStat.adds || 0) + 1);
    pStat.totalQty = Math.min(600, (pStat.totalQty || 0) + cleanQty);
    pStat.avgQty = Math.max(1, Math.round(pStat.totalQty / pStat.adds));
    pStat.lastAddedAt = now;
    profile.productAffinity[productId] = pStat;

    // تخفيف عقوبة التجاهل السابقة عند اختيار الصنف لاحقاً
    if (profile.ignoredPenalty[productId]) {
      profile.ignoredPenalty[productId] = Math.max(0, profile.ignoredPenalty[productId] - 2);
    }

    if (category) {
      profile.categoryAffinity[category] = Math.min(120, (profile.categoryAffinity[category] || 0) + 1);
    }

    profile.timeHabits[slot] = profile.timeHabits[slot] || {};
    profile.timeHabits[slot][productId] = Math.min(60, (profile.timeHabits[slot][productId] || 0) + 1);

    const normQ = normalizeArabicText(lastQuery);
    if (normQ && normQ.length >= 2) {
      profile.queryToProduct[normQ] = profile.queryToProduct[normQ] || {};
      profile.queryToProduct[normQ][productId] = Math.min(40, (profile.queryToProduct[normQ][productId] || 0) + 2);
    }

    saveProfile(profile);
  }

  // التعلّم الترابطي من السلة المشتركة (الأصناف التي يختارها الزبون معاً في نفس الجلسة)
  function recordBasketCoOccurrence(productIds) {
    const unique = Array.from(new Set((productIds || []).filter(Boolean)));
    if (unique.length < 2) return;
    const profile = loadProfile();
    for (let i = 0; i < unique.length; i++) {
      const a = unique[i];
      profile.coOccurrence[a] = profile.coOccurrence[a] || {};
      for (let j = 0; j < unique.length; j++) {
        if (i === j) continue;
        const b = unique[j];
        profile.coOccurrence[a][b] = Math.min(40, (profile.coOccurrence[a][b] || 0) + 1);
      }
    }
    saveProfile(profile);
  }

  // التعلّم السلبي الضمني عند تجاهل صنف مقترح عدة مرات (بدون حذفه نهائياً)
  function recordIgnoredSuggestions(ignoredProductIds) {
    const unique = Array.from(new Set((ignoredProductIds || []).filter(Boolean)));
    if (!unique.length) return;
    const profile = loadProfile();
    unique.forEach(pid => {
      profile.ignoredPenalty[pid] = Math.min(15, (profile.ignoredPenalty[pid] || 0) + 1);
    });
    saveProfile(profile);
  }

  function recordPersonaUsage(personaId) {
    if (!personaId) return;
    const profile = loadProfile();
    profile.personaAffinity[personaId] = Math.min(200, (profile.personaAffinity[personaId] || 0) + 1);
    saveProfile(profile);
  }

  function recordRecipeUsage(recipeTitle) {
    const norm = normalizeArabicText(recipeTitle);
    if (!norm) return;
    const profile = loadProfile();
    profile.recipeAffinity[norm] = Math.min(100, (profile.recipeAffinity[norm] || 0) + 1);
    saveProfile(profile);
  }

  function getPreferredQty(productId, fallbackQty = 1) {
    const profile = loadProfile();
    const avg = profile.productAffinity?.[productId]?.avgQty;
    return avg && avg >= 1 ? Math.min(10, avg) : fallbackQty;
  }

  function getHabitBoost(productId, category, normQuery, activeCartIds = []) {
    const profile = loadProfile();
    let boost = 0;

    if (normQuery && profile.queryToProduct[normQuery]?.[productId]) {
      boost += profile.queryToProduct[normQuery][productId] * 6;
    }

    const pStat = profile.productAffinity[productId];
    if (pStat) {
      const daysAgo = (Date.now() - (pStat.lastAddedAt || 0)) / (1000 * 60 * 60 * 24);
      const recencyFactor = daysAgo <= 7 ? 1.45 : (daysAgo <= 30 ? 1.0 : 0.6);
      boost += Math.min(20, (pStat.adds || 0) * 2.3) * recencyFactor;
    }

    if (category && profile.categoryAffinity[category]) {
      boost += Math.min(9, profile.categoryAffinity[category] * 0.85);
    }

    const slot = getTimeSlot();
    const slotCount = profile.timeHabits?.[slot]?.[productId] || 0;
    if (slotCount > 0) {
      boost += Math.min(7, slotCount * 1.6);
    }

    // تعزيز الترابط مع محتويات السلة الحالية
    if (Array.isArray(activeCartIds) && activeCartIds.length) {
      let coScore = 0;
      activeCartIds.forEach(cid => {
        coScore += (profile.coOccurrence?.[cid]?.[productId] || 0) * 2.5;
      });
      boost += Math.min(14, coScore);
    }

    // خصم لطيف للأصناف التي تجاهلها الزبون مراراً
    const penalty = profile.ignoredPenalty?.[productId] || 0;
    if (penalty > 0) {
      boost -= Math.min(10, penalty * 1.2);
    }

    return boost;
  }

  function smartSearch(rawQuery, productsObj, categoriesArr, getAvailFn, getPriceFn, activeCartIds = []) {
    const normQuery = normalizeArabicText(rawQuery);
    const tokens = tokenize(rawQuery);
    if (!tokens.length) {
      return { matchedCategories: [], items: [], usedAlternative: false, usedFuzzy: false, usedSynonym: false };
    }

    const budgetMatch = normQuery.match(/(\d{2,7})/);
    const maxBudget = budgetMatch ? parseInt(budgetMatch[1], 10) : null;
    const expandedTerms = expandWithSynonyms(tokens);

    const storeCats = (Array.isArray(categoriesArr) ? categoriesArr : []).filter(c => c && c !== "الكل");
    const matchedCategories = storeCats.filter(catName => {
      const cNorm = normalizeArabicText(catName);
      const cWords = cNorm.split(/\s+/).filter(Boolean);
      for (const [term] of expandedTerms.entries()) {
        if (cNorm.includes(term) || cWords.some(cw => isFuzzyMatch(term, cw).match)) {
          return true;
        }
      }
      return false;
    });

    const results = [];
    let outOfStockCategory = null;
    let usedFuzzy = false;
    let usedSynonym = false;

    Object.keys(productsObj || {}).forEach(pid => {
      const p = productsObj[pid];
      if (!p) return;
      const avail = typeof getAvailFn === "function" ? getAvailFn(pid) : (parseInt(p.stock, 10) || 0);
      const price = typeof getPriceFn === "function" ? getPriceFn(pid) : 0;
      const pNameNorm = normalizeArabicText(p.name || "");
      const pWords = pNameNorm.split(/\s+/).filter(Boolean);
      const pCat = p.category || "";

      let textScore = 0;
      let matchType = "";

      if (pNameNorm.includes(normQuery)) {
        textScore += 35;
        matchType = "مطابقة مباشرة";
      }

      for (const [term, weight] of expandedTerms.entries()) {
        if (pNameNorm.includes(term)) {
          const pts = 22 * weight;
          textScore += pts;
          if (!matchType) matchType = weight < 0.9 ? "مرادف مطابق" : "متوفر في الفرع";
          if (weight < 0.9) usedSynonym = true;
          continue;
        }
        for (const pw of pWords) {
          const fz = isFuzzyMatch(term, pw);
          if (fz.match) {
            textScore += 18 * weight * fz.score;
            if (fz.score < 0.99) usedFuzzy = true;
            if (!matchType) matchType = fz.score < 0.99 ? "تصحيح إملائي تلقائي" : "مطابقة ذكية";
            break;
          }
        }
      }

      const inCat = matchedCategories.includes(pCat);
      if (inCat) {
        textScore += 12;
        if (!matchType) matchType = `قسم: ${pCat}`;
      }

      if (textScore > 0) {
        if (avail <= 0) {
          outOfStockCategory = outOfStockCategory || pCat;
          return;
        }
        if (maxBudget && price > maxBudget) return;

        const habitBoost = getHabitBoost(pid, pCat, normQuery, activeCartIds);
        const finalReason = habitBoost >= 8 ? "من اختياراتك المعتادة" : matchType;
        results.push({
          id: pid,
          name: p.name,
          suggestedQty: getPreferredQty(pid, 1),
          reason: finalReason,
          score: textScore + habitBoost
        });
      }
    });

    if (!results.length && outOfStockCategory) {
      Object.keys(productsObj || {}).forEach(pid => {
        const p = productsObj[pid];
        if (!p || p.category !== outOfStockCategory) return;
        const avail = typeof getAvailFn === "function" ? getAvailFn(pid) : (parseInt(p.stock, 10) || 0);
        if (avail <= 0) return;
        const habitBoost = getHabitBoost(pid, p.category, normQuery, activeCartIds);
        results.push({
          id: pid,
          name: p.name,
          suggestedQty: getPreferredQty(pid, 1),
          reason: `بديل متوفر في قسم (${outOfStockCategory})`,
          score: 5 + habitBoost
        });
      });
    }

    results.sort((a, b) => b.score - a.score);
    const topItems = results.slice(0, 8);
    recordSearch(rawQuery, topItems.length);

    return {
      matchedCategories,
      items: topItems,
      usedAlternative: !!outOfStockCategory && results.length > 0 && topItems.every(x => x.reason.startsWith("بديل")),
      usedFuzzy,
      usedSynonym
    };
  }

  function getPersonalHabitSuggestions(productsObj, getAvailFn, limit = 8) {
    const profile = loadProfile();
    const slot = getTimeSlot();
    return Object.keys(productsObj || {})
      .filter(pid => (typeof getAvailFn === "function" ? getAvailFn(pid) : 0) > 0)
      .map(pid => {
        const p = productsObj[pid];
        const score = getHabitBoost(pid, p.category || "", "", []);
        const isTimeHabit = (profile.timeHabits?.[slot]?.[pid] || 0) > 0;
        return {
          id: pid,
          name: p.name,
          suggestedQty: getPreferredQty(pid, 1),
          score,
          reason: isTimeHabit ? "تعتاد طلبه في هذا الوقت" : "من مفضلاتك المتكررة"
        };
      })
      .filter(x => x.score > 2)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // التنبؤ الذكي بالأصناف التي حان موعد إعادة طلبها (بناءً على الفاصل الزمني المعتاد للزبون)
  function getPredictiveReorderSuggestions(productsObj, getAvailFn, limit = 6) {
    const profile = loadProfile();
    const now = Date.now();
    return Object.keys(productsObj || {})
      .filter(pid => (typeof getAvailFn === "function" ? getAvailFn(pid) : 0) > 0)
      .map(pid => {
        const stat = profile.productAffinity?.[pid];
        if (!stat || (stat.adds || 0) < 2) return null;
        const daysSinceLast = (now - (stat.lastAddedAt || 0)) / (1000 * 60 * 60 * 24);
        if (daysSinceLast < 2 || daysSinceLast > 45) return null;
        const score = Math.min(25, stat.adds * 3) + Math.min(10, daysSinceLast);
        return {
          id: pid,
          name: productsObj[pid].name,
          suggestedQty: getPreferredQty(pid, 1),
          score,
          reason: `تطلبه باستمرار (آخر مرة منذ ${Math.round(daysSinceLast)} يوم)`
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  function getRecentSearches(limit = 5) {
    const profile = loadProfile();
    const seen = new Set();
    const out = [];
    for (const item of profile.searchHistory) {
      if (!item?.q || seen.has(item.norm)) continue;
      seen.add(item.norm);
      out.push(item.q);
      if (out.length >= limit) break;
    }
    return out;
  }

  if (typeof db !== "undefined" && db.ref) {
    try {
      db.ref("ai_brain/synonyms").on("value", snap => {
        const val = snap.val();
        if (val && typeof val === "object") {
          dynamicSynonymGroups = Object.values(val)
            .map(g => (Array.isArray(g) ? g : String(g || "").split(/[،,]/).map(s => s.trim()).filter(Boolean)))
            .filter(arr => arr.length >= 2);
        }
      });
    } catch (_) {}
  }

  window.MoaathAIBrain = {
    version: "2.0-self-learning",
    normalizeArabicText,
    tokenize,
    isFuzzyMatch,
    expandWithSynonyms,
    smartSearch,
    recordSearch,
    recordCustomerChoice,
    recordBasketCoOccurrence,
    recordIgnoredSuggestions,
    recordPersonaUsage,
    recordRecipeUsage,
    getPreferredQty,
    getHabitBoost,
    getPersonalHabitSuggestions,
    getPredictiveReorderSuggestions,
    getRecentSearches,
    getProfileSummary: () => {
      const p = loadProfile();
      return {
        version: "2.0-self-learning",
        searchesCount: p.searchHistory.length,
        learnedProducts: Object.keys(p.productAffinity).length,
        learnedQueries: Object.keys(p.queryToProduct).length,
        coOccurrenceLinks: Object.keys(p.coOccurrence).length,
        ignoredPenaltiesCount: Object.keys(p.ignoredPenalty).length,
        dynamicSynonyms: dynamicSynonymGroups.length
      };
    }
  };
})();
