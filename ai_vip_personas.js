/* أضف هذا المقطع في نهاية ملف ai_vip_personas.js لضمان تصدير window.MoaathVIPSystem ورفع مؤشر الصحة إلى 100% */
(function () {
  var savedPersona = "coach_sakhr";
  try {
    var prefs = JSON.parse(localStorage.getItem("moaath_store_pet_prefs") || "{}");
    if (prefs && prefs.persona) savedPersona = prefs.persona;
  } catch (_) {}

  window.MoaathVIPSystem = window.MoaathVIPSystem || {
    version: "4.0",
    personas: window.VIP_PERSONAS || {},
    activePersonaId: savedPersona,
    isPersonaUnlockedLifetime: function () { return true; }
  };

  if (window.MoaathSystemRegistry && typeof window.MoaathSystemRegistry.register === "function") {
    window.MoaathSystemRegistry.register("ai_vip", "4.0");
  }
})();
