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
  // Site chrome
  "chrome.brandTagline": string;
  "chrome.collections": string;
  "chrome.signedInAs": string;
  "chrome.ownerAccount": string;
  "chrome.tenantAccount": string;
  // Role switcher
  "role.actingAsOwner": string;
  "role.actingAsTenant": string;
  "role.switchWorkspace": string;
  "role.ownerWorkspace": string;
  "role.tenantWorkspace": string;
  "role.active": string;
  // Search experience
  "search.placeholder": string;
  "search.applyFilters": string;
  "search.useMyLocation": string;
  "search.amenities": string;
  "search.budget": string;
  "search.bhk": string;
  "search.locating": string;
  "search.findHomesNearYou": string;
  // Owner dashboard
  "owner.plan": string;
  "owner.ownerPremium": string;
  "owner.premiumAnnual": string;
  "owner.premiumActive": string;
  "owner.addProperty": string;
  "owner.liveHomes": string;
  "owner.draftHomes": string;
  "owner.rentPotential": string;
  "owner.listingsWithPayments": string;
  "owner.activeListingFlow": string;
  "owner.activeListingFlowSubtitle": string;
  "owner.activeListingFlowEmpty": string;
  "owner.addPropertyEyebrow": string;
  "owner.useDedicatedPage": string;
  "owner.useDedicatedPageBody": string;
  "owner.startFromOwnerForm": string;
  "owner.openOwnerForm": string;
  // Tenant dashboard / common pages
  "tenant.savedHomes": string;
  "tenant.scheduledVisits": string;
  "tenant.recommended": string;
  "tenant.profileCompletion": string;
  "tenant.alerts": string;
  // Hero / home
  "hero.title": string;
  "hero.subtitle": string;
  "hero.searchCta": string;
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
    "chrome.brandTagline": "Trust-first rental only",
    "chrome.collections": "Collections",
    "chrome.signedInAs": "Signed in as",
    "chrome.ownerAccount": "Owner account",
    "chrome.tenantAccount": "Tenant account",
    "role.actingAsOwner": "Acting as Owner",
    "role.actingAsTenant": "Acting as Tenant",
    "role.switchWorkspace": "Switch workspace",
    "role.ownerWorkspace": "Owner workspace",
    "role.tenantWorkspace": "Tenant workspace",
    "role.active": "Active",
    "search.placeholder": "Search localities, BHK, amenities…",
    "search.applyFilters": "Apply filters",
    "search.useMyLocation": "Use my location",
    "search.amenities": "Amenities",
    "search.budget": "Max budget",
    "search.bhk": "BHK",
    "search.locating": "Locating…",
    "search.findHomesNearYou": "Find homes near you",
    "owner.plan": "Plan",
    "owner.ownerPremium": "Owner Premium",
    "owner.premiumAnnual": "₹1,000 · annual",
    "owner.premiumActive": "Owner Premium is active. You can publish listings.",
    "owner.addProperty": "Add property",
    "owner.liveHomes": "Live homes",
    "owner.draftHomes": "Draft homes",
    "owner.rentPotential": "Rent potential",
    "owner.listingsWithPayments": "Listings with payments",
    "owner.activeListingFlow": "Manage what tenants will see next",
    "owner.activeListingFlowSubtitle": "Active listing flow",
    "owner.activeListingFlowEmpty": "Your owner-managed listings will appear here.",
    "owner.addPropertyEyebrow": "Add property",
    "owner.useDedicatedPage": "Use the dedicated owner publishing page",
    "owner.useDedicatedPageBody": "The dashboard is now focused on management. When you want to publish a property, open the dedicated owner page built for property details, pricing, amenities, and renter-side visibility.",
    "owner.startFromOwnerForm": "Start from a cleaner owner-only property form.",
    "owner.openOwnerForm": "Open property form",
    "tenant.savedHomes": "Saved homes",
    "tenant.scheduledVisits": "Scheduled visits",
    "tenant.recommended": "Recommended",
    "tenant.profileCompletion": "Profile completion",
    "tenant.alerts": "Alerts",
    "hero.title": "Find the home that earns your trust",
    "hero.subtitle": "Verified owners, transparent listings, no broker games.",
    "hero.searchCta": "Browse rentals",
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
    "chrome.brandTagline": "केवल भरोसे-पहले किराया",
    "chrome.collections": "संग्रह",
    "chrome.signedInAs": "साइन इन हैं",
    "chrome.ownerAccount": "मालिक खाता",
    "chrome.tenantAccount": "किरायेदार खाता",
    "role.actingAsOwner": "मालिक के रूप में",
    "role.actingAsTenant": "किरायेदार के रूप में",
    "role.switchWorkspace": "वर्कस्पेस बदलें",
    "role.ownerWorkspace": "मालिक वर्कस्पेस",
    "role.tenantWorkspace": "किरायेदार वर्कस्पेस",
    "role.active": "सक्रिय",
    "search.placeholder": "इलाके, BHK, सुविधाएँ खोजें…",
    "search.applyFilters": "फ़िल्टर लागू करें",
    "search.useMyLocation": "मेरा स्थान उपयोग करें",
    "search.amenities": "सुविधाएँ",
    "search.budget": "अधिकतम बजट",
    "search.bhk": "BHK",
    "search.locating": "स्थान खोज रहे हैं…",
    "search.findHomesNearYou": "अपने पास के घर खोजें",
    "owner.plan": "योजना",
    "owner.ownerPremium": "मालिक प्रीमियम",
    "owner.premiumAnnual": "₹1,000 · वार्षिक",
    "owner.premiumActive": "मालिक प्रीमियम सक्रिय है। आप लिस्टिंग प्रकाशित कर सकते हैं।",
    "owner.addProperty": "संपत्ति जोड़ें",
    "owner.liveHomes": "लाइव घर",
    "owner.draftHomes": "ड्राफ्ट घर",
    "owner.rentPotential": "किराया संभावना",
    "owner.listingsWithPayments": "भुगतान वाली लिस्टिंग",
    "owner.activeListingFlow": "किरायेदार आगे क्या देखेंगे, प्रबंधित करें",
    "owner.activeListingFlowSubtitle": "सक्रिय लिस्टिंग प्रवाह",
    "owner.activeListingFlowEmpty": "आपकी मालिक-प्रबंधित लिस्टिंग यहाँ दिखेगी।",
    "owner.addPropertyEyebrow": "संपत्ति जोड़ें",
    "owner.useDedicatedPage": "समर्पित मालिक प्रकाशन पृष्ठ का उपयोग करें",
    "owner.useDedicatedPageBody": "डैशबोर्ड अब प्रबंधन पर केंद्रित है। जब आप कोई संपत्ति प्रकाशित करना चाहें, तो संपत्ति विवरण, मूल्य निर्धारण, सुविधाओं और किरायेदार-पक्ष दृश्यता के लिए बनाया गया समर्पित मालिक पृष्ठ खोलें।",
    "owner.startFromOwnerForm": "एक स्वच्छ मालिक-केवल संपत्ति फॉर्म से शुरू करें।",
    "owner.openOwnerForm": "संपत्ति फॉर्म खोलें",
    "tenant.savedHomes": "सहेजे गए घर",
    "tenant.scheduledVisits": "निर्धारित विज़िट",
    "tenant.recommended": "अनुशंसित",
    "tenant.profileCompletion": "प्रोफ़ाइल पूर्णता",
    "tenant.alerts": "अलर्ट",
    "hero.title": "वह घर खोजें जो आपका भरोसा कमाए",
    "hero.subtitle": "सत्यापित मालिक, पारदर्शी लिस्टिंग, कोई दलाल खेल नहीं।",
    "hero.searchCta": "किराया देखें",
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
    "chrome.brandTagline": "ನಂಬಿಕೆ-ಮೊದಲ ಬಾಡಿಗೆ ಮಾತ್ರ",
    "chrome.collections": "ಸಂಗ್ರಹಗಳು",
    "chrome.signedInAs": "ಸೈನ್ ಇನ್ ಆಗಿದ್ದೀರಿ",
    "chrome.ownerAccount": "ಮಾಲೀಕ ಖಾತೆ",
    "chrome.tenantAccount": "ಬಾಡಿಗೆದಾರ ಖಾತೆ",
    "role.actingAsOwner": "ಮಾಲೀಕರಾಗಿ",
    "role.actingAsTenant": "ಬಾಡಿಗೆದಾರರಾಗಿ",
    "role.switchWorkspace": "ವರ್ಕ್‌ಸ್ಪೇಸ್ ಬದಲಿಸಿ",
    "role.ownerWorkspace": "ಮಾಲೀಕ ವರ್ಕ್‌ಸ್ಪೇಸ್",
    "role.tenantWorkspace": "ಬಾಡಿಗೆದಾರ ವರ್ಕ್‌ಸ್ಪೇಸ್",
    "role.active": "ಸಕ್ರಿಯ",
    "search.placeholder": "ಪ್ರದೇಶ, BHK, ಸೌಲಭ್ಯಗಳನ್ನು ಹುಡುಕಿ…",
    "search.applyFilters": "ಫಿಲ್ಟರ್ ಅನ್ವಯಿಸಿ",
    "search.useMyLocation": "ನನ್ನ ಸ್ಥಳ ಬಳಸಿ",
    "search.amenities": "ಸೌಲಭ್ಯಗಳು",
    "search.budget": "ಗರಿಷ್ಠ ಬಜೆಟ್",
    "search.bhk": "BHK",
    "search.locating": "ಸ್ಥಳ ಪತ್ತೆ ಹಚ್ಚುತ್ತಿದೆ…",
    "search.findHomesNearYou": "ನಿಮ್ಮ ಬಳಿ ಮನೆಗಳನ್ನು ಹುಡುಕಿ",
    "owner.plan": "ಯೋಜನೆ",
    "owner.ownerPremium": "ಮಾಲೀಕ ಪ್ರೀಮಿಯಂ",
    "owner.premiumAnnual": "₹1,000 · ವಾರ್ಷಿಕ",
    "owner.premiumActive": "ಮಾಲೀಕ ಪ್ರೀಮಿಯಂ ಸಕ್ರಿಯವಾಗಿದೆ. ನೀವು ಲಿಸ್ಟಿಂಗ್‌ಗಳನ್ನು ಪ್ರಕಟಿಸಬಹುದು.",
    "owner.addProperty": "ಆಸ್ತಿ ಸೇರಿಸಿ",
    "owner.liveHomes": "ಲೈವ್ ಮನೆಗಳು",
    "owner.draftHomes": "ಕರಡು ಮನೆಗಳು",
    "owner.rentPotential": "ಬಾಡಿಗೆ ಸಂಭಾವ್ಯತೆ",
    "owner.listingsWithPayments": "ಪಾವತಿಗಳೊಂದಿಗೆ ಲಿಸ್ಟಿಂಗ್‌ಗಳು",
    "owner.activeListingFlow": "ಬಾಡಿಗೆದಾರರು ಮುಂದೆ ಏನು ನೋಡುತ್ತಾರೆ ಎಂಬುದನ್ನು ನಿರ್ವಹಿಸಿ",
    "owner.activeListingFlowSubtitle": "ಸಕ್ರಿಯ ಲಿಸ್ಟಿಂಗ್ ಹರಿವು",
    "owner.activeListingFlowEmpty": "ನಿಮ್ಮ ಮಾಲೀಕ-ನಿರ್ವಹಿಸಿದ ಲಿಸ್ಟಿಂಗ್‌ಗಳು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ.",
    "owner.addPropertyEyebrow": "ಆಸ್ತಿ ಸೇರಿಸಿ",
    "owner.useDedicatedPage": "ಮೀಸಲಾದ ಮಾಲೀಕ ಪ್ರಕಟಣೆ ಪುಟವನ್ನು ಬಳಸಿ",
    "owner.useDedicatedPageBody": "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಈಗ ನಿರ್ವಹಣೆಯ ಮೇಲೆ ಕೇಂದ್ರೀಕರಿಸಿದೆ. ನೀವು ಆಸ್ತಿಯನ್ನು ಪ್ರಕಟಿಸಲು ಬಯಸಿದಾಗ, ಆಸ್ತಿ ವಿವರಗಳು, ಬೆಲೆ, ಸೌಲಭ್ಯಗಳು ಮತ್ತು ಬಾಡಿಗೆದಾರ-ಬದಿಯ ಗೋಚರತೆಗಾಗಿ ನಿರ್ಮಿಸಲಾದ ಮೀಸಲಾದ ಮಾಲೀಕ ಪುಟವನ್ನು ತೆರೆಯಿರಿ.",
    "owner.startFromOwnerForm": "ಸ್ವಚ್ಛವಾದ ಮಾಲೀಕ-ಮಾತ್ರ ಆಸ್ತಿ ಫಾರ್ಮ್‌ನಿಂದ ಪ್ರಾರಂಭಿಸಿ.",
    "owner.openOwnerForm": "ಆಸ್ತಿ ಫಾರ್ಮ್ ತೆರೆಯಿರಿ",
    "tenant.savedHomes": "ಉಳಿಸಿದ ಮನೆಗಳು",
    "tenant.scheduledVisits": "ನಿಗದಿತ ಭೇಟಿಗಳು",
    "tenant.recommended": "ಶಿಫಾರಸು",
    "tenant.profileCompletion": "ಪ್ರೊಫೈಲ್ ಪೂರ್ಣಗೊಳಿಸುವಿಕೆ",
    "tenant.alerts": "ಎಚ್ಚರಿಕೆಗಳು",
    "hero.title": "ನಿಮ್ಮ ನಂಬಿಕೆ ಗಳಿಸುವ ಮನೆಯನ್ನು ಹುಡುಕಿ",
    "hero.subtitle": "ಪರಿಶೀಲಿಸಿದ ಮಾಲೀಕರು, ಪಾರದರ್ಶಕ ಲಿಸ್ಟಿಂಗ್‌ಗಳು, ದಲ್ಲಾಳಿ ಆಟಗಳಿಲ್ಲ.",
    "hero.searchCta": "ಬಾಡಿಗೆ ಬ್ರೌಸ್ ಮಾಡಿ",
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
    "chrome.brandTagline": "நம்பிக்கை-முதலிடம் வாடகை மட்டும்",
    "chrome.collections": "தொகுப்புகள்",
    "chrome.signedInAs": "உள்நுழைந்துள்ளீர்கள்",
    "chrome.ownerAccount": "உரிமையாளர் கணக்கு",
    "chrome.tenantAccount": "வாடகைதாரர் கணக்கு",
    "role.actingAsOwner": "உரிமையாளராக",
    "role.actingAsTenant": "வாடகைதாரராக",
    "role.switchWorkspace": "பணியிடத்தை மாற்று",
    "role.ownerWorkspace": "உரிமையாளர் பணியிடம்",
    "role.tenantWorkspace": "வாடகைதாரர் பணியிடம்",
    "role.active": "செயலில்",
    "search.placeholder": "பகுதிகள், BHK, வசதிகள் தேடவும்…",
    "search.applyFilters": "வடிகட்டிகளை பயன்படுத்து",
    "search.useMyLocation": "என் இருப்பிடத்தை பயன்படுத்து",
    "search.amenities": "வசதிகள்",
    "search.budget": "அதிகபட்ச பட்ஜெட்",
    "search.bhk": "BHK",
    "search.locating": "இடம் கண்டறியப்படுகிறது…",
    "search.findHomesNearYou": "உங்களுக்கு அருகிலுள்ள வீடுகளைக் கண்டறியவும்",
    "owner.plan": "திட்டம்",
    "owner.ownerPremium": "உரிமையாளர் பிரீமியம்",
    "owner.premiumAnnual": "₹1,000 · ஆண்டு",
    "owner.premiumActive": "உரிமையாளர் பிரீமியம் செயலில் உள்ளது. நீங்கள் பட்டியல்களை வெளியிடலாம்.",
    "owner.addProperty": "சொத்து சேர்",
    "owner.liveHomes": "நேரடி வீடுகள்",
    "owner.draftHomes": "வரைவு வீடுகள்",
    "owner.rentPotential": "வாடகை சாத்தியம்",
    "owner.listingsWithPayments": "கட்டணங்களுடன் பட்டியல்கள்",
    "owner.activeListingFlow": "வாடகைதாரர்கள் அடுத்து என்ன பார்ப்பார்கள் என்பதை நிர்வகிக்கவும்",
    "owner.activeListingFlowSubtitle": "செயலில் உள்ள பட்டியல் ஓட்டம்",
    "owner.activeListingFlowEmpty": "உங்கள் உரிமையாளர்-நிர்வகிக்கப்படும் பட்டியல்கள் இங்கே தோன்றும்.",
    "owner.addPropertyEyebrow": "சொத்து சேர்",
    "owner.useDedicatedPage": "பிரத்யேக உரிமையாளர் வெளியீட்டுப் பக்கத்தைப் பயன்படுத்தவும்",
    "owner.useDedicatedPageBody": "டாஷ்போர்டு இப்போது நிர்வாகத்தில் கவனம் செலுத்துகிறது. நீங்கள் ஒரு சொத்தை வெளியிட விரும்பும்போது, ​​சொத்து விவரங்கள், விலை, வசதிகள் மற்றும் வாடகைதாரர்-பக்க தெரிவுநிலைக்காக கட்டப்பட்ட பிரத்யேக உரிமையாளர் பக்கத்தைத் திறக்கவும்.",
    "owner.startFromOwnerForm": "சுத்தமான உரிமையாளர்-மட்டும் சொத்து படிவத்தில் இருந்து தொடங்கவும்.",
    "owner.openOwnerForm": "சொத்து படிவத்தைத் திற",
    "tenant.savedHomes": "சேமித்த வீடுகள்",
    "tenant.scheduledVisits": "திட்டமிடப்பட்ட வருகைகள்",
    "tenant.recommended": "பரிந்துரைக்கப்படுகிறது",
    "tenant.profileCompletion": "சுயவிவர நிறைவு",
    "tenant.alerts": "எச்சரிக்கைகள்",
    "hero.title": "உங்கள் நம்பிக்கையைப் பெறும் வீட்டைக் கண்டறியவும்",
    "hero.subtitle": "சரிபார்க்கப்பட்ட உரிமையாளர்கள், வெளிப்படையான பட்டியல்கள், தரகர் விளையாட்டுகள் இல்லை.",
    "hero.searchCta": "வாடகைகளை உலாவவும்",
    "common.loading": "ஏற்றுகிறது…",
    "common.error": "ஏதோ தவறு நடந்துவிட்டது",
    "common.retry": "மீண்டும் முயற்சி செய்",
    "common.cancel": "ரத்து செய்",
    "common.save": "சேமி",
    "common.submit": "சமர்ப்பி"
  }
};

export type TranslationKey = keyof DictionaryShape;
