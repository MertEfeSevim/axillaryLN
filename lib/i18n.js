// Arayuz metinleri, FIS degisken adlari ve uyelik fonksiyonu etiketleri burada toplanir.
// Secilen dil localStorage'da saklanir; sonraki ziyaretlerde korunmasi icin
// ayni secim bir cerezde de tutulur.

export const DEFAULT_LANGUAGE = "tr";
export const LANGUAGE_COOKIE = "axln_lang";
export const LANGUAGE_MAX_AGE = 60 * 60 * 24 * 365;

const STORAGE_KEY = "axillaryLN.lang";

export const LANGUAGES = [
  { code: "tr", short: "TR", name: "Turkce" },
  { code: "en", short: "EN", name: "English" },
];

export function normalizeLanguage(value) {
  return LANGUAGES.some((language) => language.code === value) ? value : DEFAULT_LANGUAGE;
}

// ---------- arayuz metinleri ----------

const UI = {
  tr: {
    tagline: "aksiller lenf nodu tutulumu · bulanik cikarim",
    languageLabel: "dil secimi",
    groups: {
      nodalSystem: "lenf nodu",
      primarySystem: "primer tumor",
    },
    reset: "sifirla",
    archive: "arsiv",
    save: "kaydet",
    saved: "kaydedildi",
    backToCalc: "hesaplamaya don",
    archiveCount: (count) => `${count} kayit`,
    archiveEmpty: "henuz kayit yok",
    archiveRowInfo: "kayit detayi",
    deleteEntry: "kaydi sil",
    positive: "pozitif",
    negative: "negatif",
    thresholdMark: (threshold) => `esik ${threshold}`,
    modelInfoLabel: "Model hakkinda",
    modelInfoTitle: "Uc asamali Mamdani modeli",
    modelInfoBody:
      "Lenf nodu ve primer tumor sistemleri bagimsiz birer skor uretir; bu iki skor final sisteme girdi olur.",
    modelInfoDefuzz: (threshold) => [
      "Durulastirma ",
      { code: "centroid" },
      ", cikis ",
      { code: "0-1" },
      " araliginda sureklidir ve ",
      { code: threshold },
      " ve uzeri pozitif kabul edilir.",
    ],
    systemInfoLabel: (fileName) => `${fileName} detaylari`,
    ruleCount: "kural sayisi",
    defuzzification: "durulastirma",
    output: "cikis",
    membershipInfoLabel: (name) => `${name} uyelik fonksiyonlari`,
    variable: "degisken",
    resultInfoLabel: "Sonuc nasil hesaplanir",
    resultInfoTitle: "Nasil hesaplanir",
    resultInfoFlow: (nodalName, primaryName, fileName) => [
      { code: nodalName },
      " ve ",
      { code: primaryName },
      " crisp degerleri ",
      { code: fileName },
      " icine verilir.",
    ],
    resultInfoLevel: (threshold) => [
      "Seviye en yuksek uyelik derecesinden, karar ise sabit ",
      { code: threshold },
      " esiginden gelir; ikisi 0.60-0.65 bandinda ayrisabilir.",
    ],
    sources: "kaynak",
    loading: "modeller yukleniyor",
    loadErrorTitle: "FIS dosyalari okunamadi",
  },
  en: {
    tagline: "axillary lymph node involvement · fuzzy inference",
    languageLabel: "language",
    groups: {
      nodalSystem: "lymph node",
      primarySystem: "primary tumor",
    },
    reset: "reset",
    archive: "archive",
    save: "save",
    saved: "saved",
    backToCalc: "back to calculator",
    archiveCount: (count) => `${count} ${count === 1 ? "entry" : "entries"}`,
    archiveEmpty: "no saved runs yet",
    archiveRowInfo: "entry details",
    deleteEntry: "delete entry",
    positive: "positive",
    negative: "negative",
    thresholdMark: (threshold) => `cutoff ${threshold}`,
    modelInfoLabel: "About the model",
    modelInfoTitle: "Three stage Mamdani model",
    modelInfoBody:
      "The lymph node and primary tumor systems each produce their own score; both scores become inputs of the final system.",
    modelInfoDefuzz: (threshold) => [
      "Defuzzification is ",
      { code: "centroid" },
      ", the output is continuous over ",
      { code: "0-1" },
      " and ",
      { code: threshold },
      " or above counts as positive.",
    ],
    systemInfoLabel: (fileName) => `${fileName} details`,
    ruleCount: "rule count",
    defuzzification: "defuzzification",
    output: "output",
    membershipInfoLabel: (name) => `${name} membership functions`,
    variable: "variable",
    resultInfoLabel: "How the result is computed",
    resultInfoTitle: "How it is computed",
    resultInfoFlow: (nodalName, primaryName, fileName) => [
      "The crisp ",
      { code: nodalName },
      " and ",
      { code: primaryName },
      " values are fed into ",
      { code: fileName },
      ".",
    ],
    resultInfoLevel: (threshold) => [
      "The level comes from the strongest membership, the verdict from the fixed ",
      { code: threshold },
      " cutoff; the two can disagree inside the 0.60-0.65 band.",
    ],
    sources: "source",
    loading: "loading models",
    loadErrorTitle: "FIS files could not be read",
  },
};

// ---------- FIS degiskenleri ----------

const VARIABLES = {
  tr: {
    cortical_thickness: "kortikal kalinlik",
    fatty_hilum_status: "yagli hilus",
    short_axis_mm: "kisa aks capi",
    tumor_size_mm: "tumor boyutu",
    tumor_margin: "tumor kenari",
    peritumoral_edema: "peritumoral odem",
    nodal_suspicion: "lenf nodu suphesi",
    primary_tumor_risk: "primer tumor riski",
    axillary_risk: "aksiller risk",
    nodal_in: "lenf nodu skoru",
    primary_in: "primer tumor skoru",
  },
  en: {
    cortical_thickness: "cortical thickness",
    fatty_hilum_status: "fatty hilum",
    short_axis_mm: "short axis",
    tumor_size_mm: "tumor size",
    tumor_margin: "tumor margin",
    peritumoral_edema: "peritumoral edema",
    nodal_suspicion: "nodal suspicion",
    primary_tumor_risk: "primary tumor risk",
    axillary_risk: "axillary risk",
    nodal_in: "nodal score",
    primary_in: "primary score",
  },
};

// Cikis degiskenlerinin ortak seviye etiketleri: low / intermediate / high
const LEVELS = {
  tr: {
    low: "dusuk",
    intermediate: "orta",
    high: "yuksek",
  },
  en: {
    low: "low",
    intermediate: "intermediate",
    high: "high",
  },
};

// Uyelik fonksiyonu etiketleri degiskene gore degisir: 'absent' hem hilusta hem
// odemde geciyor ama ayni sey degil, bu yuzden anahtarlar degisken altinda tutulur.
const TERMS = {
  tr: {
    cortical_thickness: { thin: "ince", borderline: "sinirda", thick: "kalin" },
    fatty_hilum_status: { present: "mevcut", faint: "silik", absent: "yok" },
    short_axis_mm: { small: "kucuk", intermediate: "orta", large: "buyuk" },
    tumor_size_mm: { small: "kucuk", medium: "orta", large: "buyuk" },
    tumor_margin: { nonspiculated: "duzgun", spiculated: "spikule" },
    peritumoral_edema: { absent: "yok", present: "var" },
  },
  en: {
    cortical_thickness: { thin: "thin", borderline: "borderline", thick: "thick" },
    fatty_hilum_status: { present: "present", faint: "faint", absent: "absent" },
    short_axis_mm: { small: "small", intermediate: "intermediate", large: "large" },
    tumor_size_mm: { small: "small", medium: "medium", large: "large" },
    tumor_margin: { nonspiculated: "non-spiculated", spiculated: "spiculated" },
    peritumoral_edema: { absent: "absent", present: "present" },
  },
};

// ---------- giris ekrani ----------

const LOGIN = {
  tr: {
    prompt: "erisim kodu",
    submit: "gir",
    failed: "kod hatali",
  },
  en: {
    prompt: "access code",
    submit: "enter",
    failed: "wrong code",
  },
};

export function loginCopy(language) {
  return LOGIN[normalizeLanguage(language)];
}

// ---------- cevirmen ----------

export function createTranslator(language) {
  const code = normalizeLanguage(language);
  const ui = UI[code];

  return {
    language: code,
    ui,
    variable: (variableId) => VARIABLES[code][variableId] || variableId,
    // Bilinmeyen anahtar oldugu gibi doner: model dosyalarina yeni bir uyelik
    // fonksiyonu eklendiginde arayuz bos etiket gostermez.
    term: (variableId, key) =>
      (TERMS[code][variableId] && TERMS[code][variableId][key]) || LEVELS[code][key] || key,
    level: (key) => LEVELS[code][key] || key,
    verdict: (isPositive) => (isPositive ? ui.positive : ui.negative),
    group: (systemId) => ui.groups[systemId] || systemId,
  };
}

// ---------- istemci tarafi saklama ----------

// Once cerez okunur: giris ekranindaki secim yalnizca oraya yazilabildigi icin
// en guncel tercih cerezde durur, localStorage yedek kalir.
export function readStoredLanguage() {
  const fromCookie = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${LANGUAGE_COOKIE}=([^;]*)`),
  );

  if (fromCookie) {
    return normalizeLanguage(decodeURIComponent(fromCookie[1]));
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (stored) {
      return normalizeLanguage(stored);
    }
  } catch {
    // depolama kapali olabilir; varsayilana duseriz
  }

  return DEFAULT_LANGUAGE;
}

export function storeLanguage(language) {
  const code = normalizeLanguage(language);

  try {
    window.localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // depolama kapali olabilir; cerez yine de secimi tasir
  }

  document.cookie = `${LANGUAGE_COOKIE}=${code}; path=/; max-age=${LANGUAGE_MAX_AGE}; samesite=lax`;

  return code;
}
