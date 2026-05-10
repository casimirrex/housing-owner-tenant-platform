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
  // Top nav
  "nav.search": string;
  "nav.cities": string;
  "nav.howItWorks": string;
  "nav.about": string;
  "nav.support": string;
  "nav.payments": string;
  "nav.wallet": string;
  "nav.dashboard": string;
  "nav.messages": string;
  "nav.notifications": string;
  "nav.savedSearches": string;
  "nav.signIn": string;
  "nav.signUp": string;
  "nav.signOut": string;
  // Search experience
  "search.placeholder": string;
  "search.applyFilters": string;
  "search.useMyLocation": string;
  "search.amenities": string;
  "search.budget": string;
  "search.bhk": string;
  "search.locating": string;
  "search.findHomesNearYou": string;
  // Common
  "common.loading": string;
  "common.error": string;
  "common.retry": string;
  "common.cancel": string;
  "common.save": string;
  "common.submit": string;
};

type Dictionary = Record<SupportedLocale, Partial<DictionaryShape>>;

export const dictionaries: Dictionary = {
  en: {
    "nav.search": "Search",
    "nav.cities": "Cities",
    "nav.howItWorks": "How it works",
    "nav.about": "About",
    "nav.support": "Support",
    "nav.payments": "Payments",
    "nav.wallet": "Wallet",
    "nav.dashboard": "Dashboard",
    "nav.messages": "Messages",
    "nav.notifications": "Notifications",
    "nav.savedSearches": "Saved searches",
    "nav.signIn": "Sign in",
    "nav.signUp": "Sign up",
    "nav.signOut": "Sign out",
    "search.placeholder": "Search localities, BHK, amenities…",
    "search.applyFilters": "Apply filters",
    "search.useMyLocation": "Use my location",
    "search.amenities": "Amenities",
    "search.budget": "Max budget",
    "search.bhk": "BHK",
    "search.locating": "Locating…",
    "search.findHomesNearYou": "Find homes near you",
    "common.loading": "Loading…",
    "common.error": "Something went wrong",
    "common.retry": "Try again",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.submit": "Submit"
  },
  hi: {
    "nav.search": "खोज",
    "nav.cities": "शहर",
    "nav.howItWorks": "कैसे काम करता है",
    "nav.about": "हमारे बारे में",
    "nav.support": "सहायता",
    "nav.payments": "भुगतान",
    "nav.wallet": "वॉलेट",
    "nav.dashboard": "डैशबोर्ड",
    "nav.messages": "संदेश",
    "nav.notifications": "सूचनाएँ",
    "nav.savedSearches": "सहेजी गई खोज",
    "nav.signIn": "साइन इन",
    "nav.signUp": "साइन अप",
    "nav.signOut": "साइन आउट",
    "search.placeholder": "इलाके, BHK, सुविधाएँ खोजें…",
    "search.applyFilters": "फ़िल्टर लागू करें",
    "search.useMyLocation": "मेरा स्थान उपयोग करें",
    "search.amenities": "सुविधाएँ",
    "search.budget": "अधिकतम बजट",
    "search.bhk": "BHK",
    "search.locating": "स्थान खोज रहे हैं…",
    "search.findHomesNearYou": "अपने पास के घर खोजें",
    "common.loading": "लोड हो रहा है…",
    "common.error": "कुछ गलत हो गया",
    "common.retry": "फिर से कोशिश करें",
    "common.cancel": "रद्द करें",
    "common.save": "सहेजें",
    "common.submit": "जमा करें"
  },
  kn: {
    "nav.search": "ಹುಡುಕು",
    "nav.cities": "ನಗರಗಳು",
    "nav.howItWorks": "ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ",
    "nav.about": "ನಮ್ಮ ಬಗ್ಗೆ",
    "nav.support": "ಬೆಂಬಲ",
    "nav.payments": "ಪಾವತಿಗಳು",
    "nav.wallet": "ವಾಲೆಟ್",
    "nav.dashboard": "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    "nav.messages": "ಸಂದೇಶಗಳು",
    "nav.notifications": "ಅಧಿಸೂಚನೆಗಳು",
    "nav.savedSearches": "ಉಳಿಸಿದ ಹುಡುಕಾಟ",
    "nav.signIn": "ಸೈನ್ ಇನ್",
    "nav.signUp": "ಸೈನ್ ಅಪ್",
    "nav.signOut": "ಸೈನ್ ಔಟ್",
    "search.placeholder": "ಪ್ರದೇಶ, BHK, ಸೌಲಭ್ಯಗಳನ್ನು ಹುಡುಕಿ…",
    "search.applyFilters": "ಫಿಲ್ಟರ್ ಅನ್ವಯಿಸಿ",
    "search.useMyLocation": "ನನ್ನ ಸ್ಥಳ ಬಳಸಿ",
    "search.amenities": "ಸೌಲಭ್ಯಗಳು",
    "search.budget": "ಗರಿಷ್ಠ ಬಜೆಟ್",
    "search.bhk": "BHK",
    "search.locating": "ಸ್ಥಳ ಪತ್ತೆ ಹಚ್ಚುತ್ತಿದೆ…",
    "search.findHomesNearYou": "ನಿಮ್ಮ ಬಳಿ ಮನೆಗಳನ್ನು ಹುಡುಕಿ",
    "common.loading": "ಲೋಡ್ ಆಗುತ್ತಿದೆ…",
    "common.error": "ಏನೋ ತಪ್ಪಾಗಿದೆ",
    "common.retry": "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ",
    "common.cancel": "ರದ್ದುಮಾಡು",
    "common.save": "ಉಳಿಸು",
    "common.submit": "ಸಲ್ಲಿಸು"
  },
  ta: {
    "nav.search": "தேடல்",
    "nav.cities": "நகரங்கள்",
    "nav.howItWorks": "எப்படி செயல்படுகிறது",
    "nav.about": "எங்களைப் பற்றி",
    "nav.support": "ஆதரவு",
    "nav.payments": "கட்டணங்கள்",
    "nav.wallet": "வாலட்",
    "nav.dashboard": "டாஷ்போர்டு",
    "nav.messages": "செய்திகள்",
    "nav.notifications": "அறிவிப்புகள்",
    "nav.savedSearches": "சேமித்த தேடல்கள்",
    "nav.signIn": "உள்நுழை",
    "nav.signUp": "பதிவு",
    "nav.signOut": "வெளியேறு",
    "search.placeholder": "பகுதிகள், BHK, வசதிகள் தேடவும்…",
    "search.applyFilters": "வடிகட்டிகளை பயன்படுத்து",
    "search.useMyLocation": "என் இருப்பிடத்தை பயன்படுத்து",
    "search.amenities": "வசதிகள்",
    "search.budget": "அதிகபட்ச பட்ஜெட்",
    "search.bhk": "BHK",
    "search.locating": "இடம் கண்டறியப்படுகிறது…",
    "search.findHomesNearYou": "உங்களுக்கு அருகிலுள்ள வீடுகளைக் கண்டறியவும்",
    "common.loading": "ஏற்றுகிறது…",
    "common.error": "ஏதோ தவறு நடந்துவிட்டது",
    "common.retry": "மீண்டும் முயற்சி செய்",
    "common.cancel": "ரத்து செய்",
    "common.save": "சேமி",
    "common.submit": "சமர்ப்பி"
  }
};

export type TranslationKey = keyof DictionaryShape;
