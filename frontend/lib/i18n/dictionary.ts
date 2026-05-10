/**
 * Tier 3 — i18n scaffold.
 *
 * Pure-data dictionary keyed by locale → string-key → translation. No
 * external library; we hand-roll a minimal `t()` helper in `useTranslation`
 * so we can layer on next-intl or react-i18next later without rewriting
 * call sites.
 *
 * Add new keys to `en` first; missing translations fall back to en.
 */

export const SUPPORTED_LOCALES = ["en", "hi", "kn", "ta"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: "English",
  hi: "हिन्दी",
  kn: "ಕನ್ನಡ",
  ta: "தமிழ்"
};

export const DEFAULT_LOCALE: SupportedLocale = "en";

type DictionaryShape = {
  "nav.search": string;
  "nav.messages": string;
  "nav.notifications": string;
  "nav.savedSearches": string;
  "nav.signIn": string;
  "nav.signUp": string;
  "search.placeholder": string;
  "search.applyFilters": string;
  "search.useMyLocation": string;
  "search.amenities": string;
  "common.loading": string;
  "common.error": string;
  "common.retry": string;
};

type Dictionary = Record<SupportedLocale, Partial<DictionaryShape>>;

export const dictionaries: Dictionary = {
  en: {
    "nav.search": "Search",
    "nav.messages": "Messages",
    "nav.notifications": "Notifications",
    "nav.savedSearches": "Saved searches",
    "nav.signIn": "Sign in",
    "nav.signUp": "Sign up",
    "search.placeholder": "Search localities, BHK, amenities…",
    "search.applyFilters": "Apply filters",
    "search.useMyLocation": "Use my location",
    "search.amenities": "Amenities",
    "common.loading": "Loading…",
    "common.error": "Something went wrong",
    "common.retry": "Try again"
  },
  hi: {
    "nav.search": "खोज",
    "nav.messages": "संदेश",
    "nav.notifications": "सूचनाएँ",
    "nav.savedSearches": "सहेजी गई खोज",
    "nav.signIn": "साइन इन",
    "nav.signUp": "साइन अप",
    "search.placeholder": "इलाके, BHK, सुविधाएँ खोजें…",
    "search.applyFilters": "फ़िल्टर लागू करें",
    "search.useMyLocation": "मेरा स्थान उपयोग करें",
    "search.amenities": "सुविधाएँ",
    "common.loading": "लोड हो रहा है…",
    "common.error": "कुछ गलत हो गया",
    "common.retry": "फिर से कोशिश करें"
  },
  kn: {
    "nav.search": "ಹುಡುಕು",
    "nav.messages": "ಸಂದೇಶಗಳು",
    "nav.notifications": "ಅಧಿಸೂಚನೆಗಳು",
    "nav.savedSearches": "ಉಳಿಸಿದ ಹುಡುಕಾಟ",
    "nav.signIn": "ಸೈನ್ ಇನ್",
    "nav.signUp": "ಸೈನ್ ಅಪ್",
    "search.placeholder": "ಪ್ರದೇಶ, BHK, ಸೌಲಭ್ಯಗಳನ್ನು ಹುಡುಕಿ…",
    "search.applyFilters": "ಫಿಲ್ಟರ್ ಅನ್ವಯಿಸಿ",
    "search.useMyLocation": "ನನ್ನ ಸ್ಥಳ ಬಳಸಿ",
    "search.amenities": "ಸೌಲಭ್ಯಗಳು",
    "common.loading": "ಲೋಡ್ ಆಗುತ್ತಿದೆ…",
    "common.error": "ಏನೋ ತಪ್ಪಾಗಿದೆ",
    "common.retry": "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ"
  },
  ta: {
    "nav.search": "தேடல்",
    "nav.messages": "செய்திகள்",
    "nav.notifications": "அறிவிப்புகள்",
    "nav.savedSearches": "சேமித்த தேடல்கள்",
    "nav.signIn": "உள்நுழை",
    "nav.signUp": "பதிவு",
    "search.placeholder": "பகுதிகள், BHK, வசதிகள் தேடவும்…",
    "search.applyFilters": "வடிகட்டிகளை பயன்படுத்து",
    "search.useMyLocation": "என் இருப்பிடத்தை பயன்படுத்து",
    "search.amenities": "வசதிகள்",
    "common.loading": "ஏற்றுகிறது…",
    "common.error": "ஏதோ தவறு நடந்துவிட்டது",
    "common.retry": "மீண்டும் முயற்சி செய்"
  }
};

export type TranslationKey = keyof DictionaryShape;
