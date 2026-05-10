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
  "hero.eyebrow": string;
  "hero.ctaSearchHomes": string;
  "hero.ctaRegistration": string;
  "hero.ctaListYourHome": string;
  "hero.cityLive": string;
  "hero.verifiedPicks": string;
  "hero.newListings": string;
  "home.whyEyebrow": string;
  "home.verifiedHomesTitle": string;
  "home.verifiedHomesBody": string;
  "home.cityBasedSearchTitle": string;
  "home.cityBasedSearchBody": string;
  "home.guidedSetupTitle": string;
  "home.guidedSetupBody": string;
  "home.recommendedProperty": string;
  "home.match": string;
  "home.viewProperty": string;
  "home.exploreCitiesEyebrow": string;
  "home.exploreCitiesBody": string;
  "home.featuredHomesEyebrow": string;
  "home.featuredHomesTitle": string;
  "home.featuredHomesBody": string;
  "home.trendingNow": string;
  "home.freshlyListed": string;
  // Auth buttons (guest)
  "auth.listYourProperty": string;
  "auth.signIn": string;
  "auth.registration": string;
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
    "hero.title": "Find the right rental without losing time or clarity.",
    "hero.subtitle": "Search verified homes, register quickly, and continue into onboarding, visits, and payments from one place.",
    "hero.searchCta": "Browse rentals",
    "hero.eyebrow": "Trust-first rentals",
    "hero.ctaSearchHomes": "Search homes",
    "hero.ctaRegistration": "Registration",
    "hero.ctaListYourHome": "List your home",
    "hero.cityLive": "City live",
    "hero.verifiedPicks": "Verified picks",
    "hero.newListings": "New listings",
    "home.whyEyebrow": "Why people use Rent and Beyond",
    "home.verifiedHomesTitle": "Verified homes",
    "home.verifiedHomesBody": "See trust cues before you spend time on a property.",
    "home.cityBasedSearchTitle": "City-based search",
    "home.cityBasedSearchBody": "Start from the city and locality you actually want.",
    "home.guidedSetupTitle": "Guided setup",
    "home.guidedSetupBody": "Registration, onboarding, and payments stay connected.",
    "home.recommendedProperty": "Recommended property",
    "home.match": "Match",
    "home.viewProperty": "View property",
    "home.exploreCitiesEyebrow": "Explore cities",
    "home.exploreCitiesBody": "Browse the main launch cities, then move into search and property details with the same account and payment journey.",
    "home.featuredHomesEyebrow": "Featured homes",
    "home.featuredHomesTitle": "Trending and newly listed homes",
    "home.featuredHomesBody": "These listing sections are kept simple so you can move quickly from discovery into registration, shortlist, and payment.",
    "home.trendingNow": "Trending now",
    "home.freshlyListed": "Freshly listed",
    "auth.listYourProperty": "List your property",
    "auth.signIn": "Sign in",
    "auth.registration": "Registration",
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
    "hero.title": "बिना समय या स्पष्टता खोए सही किराये का घर खोजें।",
    "hero.subtitle": "सत्यापित घर खोजें, जल्दी पंजीकरण करें, और एक ही जगह से ऑनबोर्डिंग, विज़िट और भुगतान जारी रखें।",
    "hero.searchCta": "किराया देखें",
    "hero.eyebrow": "भरोसे-पहले किराये",
    "hero.ctaSearchHomes": "घर खोजें",
    "hero.ctaRegistration": "पंजीकरण",
    "hero.ctaListYourHome": "अपना घर सूचीबद्ध करें",
    "hero.cityLive": "शहर सक्रिय",
    "hero.verifiedPicks": "सत्यापित पसंद",
    "hero.newListings": "नई लिस्टिंग",
    "home.whyEyebrow": "लोग Rent and Beyond क्यों उपयोग करते हैं",
    "home.verifiedHomesTitle": "सत्यापित घर",
    "home.verifiedHomesBody": "किसी संपत्ति पर समय बिताने से पहले विश्वास के संकेत देखें।",
    "home.cityBasedSearchTitle": "शहर-आधारित खोज",
    "home.cityBasedSearchBody": "उस शहर और इलाके से शुरू करें जो आप वास्तव में चाहते हैं।",
    "home.guidedSetupTitle": "मार्गदर्शित सेटअप",
    "home.guidedSetupBody": "पंजीकरण, ऑनबोर्डिंग, और भुगतान जुड़े रहते हैं।",
    "home.recommendedProperty": "अनुशंसित संपत्ति",
    "home.match": "मेल",
    "home.viewProperty": "संपत्ति देखें",
    "home.exploreCitiesEyebrow": "शहर देखें",
    "home.exploreCitiesBody": "मुख्य लॉन्च शहरों को ब्राउज़ करें, फिर उसी खाते और भुगतान यात्रा के साथ खोज और संपत्ति विवरण में जाएँ।",
    "home.featuredHomesEyebrow": "प्रदर्शित घर",
    "home.featuredHomesTitle": "ट्रेंडिंग और नई सूचीबद्ध घर",
    "home.featuredHomesBody": "ये लिस्टिंग सेक्शन सरल रखे गए हैं ताकि आप खोज से पंजीकरण, शॉर्टलिस्ट और भुगतान तक जल्दी पहुँच सकें।",
    "home.trendingNow": "अभी ट्रेंडिंग",
    "home.freshlyListed": "नई सूचीबद्ध",
    "auth.listYourProperty": "अपनी संपत्ति सूचीबद्ध करें",
    "auth.signIn": "साइन इन",
    "auth.registration": "पंजीकरण",
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
    "hero.title": "ಸಮಯ ಅಥವಾ ಸ್ಪಷ್ಟತೆಯನ್ನು ಕಳೆದುಕೊಳ್ಳದೆ ಸರಿಯಾದ ಬಾಡಿಗೆ ಮನೆಯನ್ನು ಹುಡುಕಿ.",
    "hero.subtitle": "ಪರಿಶೀಲಿಸಿದ ಮನೆಗಳನ್ನು ಹುಡುಕಿ, ತ್ವರಿತವಾಗಿ ನೋಂದಣಿ ಮಾಡಿ, ಮತ್ತು ಒಂದೇ ಸ್ಥಳದಿಂದ ಆನ್‌ಬೋರ್ಡಿಂಗ್, ಭೇಟಿಗಳು ಮತ್ತು ಪಾವತಿಗಳನ್ನು ಮುಂದುವರಿಸಿ.",
    "hero.searchCta": "ಬಾಡಿಗೆ ಬ್ರೌಸ್ ಮಾಡಿ",
    "hero.eyebrow": "ನಂಬಿಕೆ-ಮೊದಲ ಬಾಡಿಗೆಗಳು",
    "hero.ctaSearchHomes": "ಮನೆಗಳನ್ನು ಹುಡುಕಿ",
    "hero.ctaRegistration": "ನೋಂದಣಿ",
    "hero.ctaListYourHome": "ನಿಮ್ಮ ಮನೆಯನ್ನು ಪಟ್ಟಿ ಮಾಡಿ",
    "hero.cityLive": "ನಗರ ಲೈವ್",
    "hero.verifiedPicks": "ಪರಿಶೀಲಿಸಿದ ಆಯ್ಕೆಗಳು",
    "hero.newListings": "ಹೊಸ ಲಿಸ್ಟಿಂಗ್‌ಗಳು",
    "home.whyEyebrow": "ಜನರು Rent and Beyond ಅನ್ನು ಏಕೆ ಬಳಸುತ್ತಾರೆ",
    "home.verifiedHomesTitle": "ಪರಿಶೀಲಿಸಿದ ಮನೆಗಳು",
    "home.verifiedHomesBody": "ಒಂದು ಆಸ್ತಿಯ ಮೇಲೆ ಸಮಯ ಕಳೆಯುವ ಮೊದಲು ನಂಬಿಕೆಯ ಸೂಚನೆಗಳನ್ನು ನೋಡಿ.",
    "home.cityBasedSearchTitle": "ನಗರ ಆಧಾರಿತ ಹುಡುಕಾಟ",
    "home.cityBasedSearchBody": "ನೀವು ನಿಜವಾಗಿಯೂ ಬಯಸುವ ನಗರ ಮತ್ತು ಪ್ರದೇಶದಿಂದ ಪ್ರಾರಂಭಿಸಿ.",
    "home.guidedSetupTitle": "ಮಾರ್ಗದರ್ಶಿತ ಸೆಟಪ್",
    "home.guidedSetupBody": "ನೋಂದಣಿ, ಆನ್‌ಬೋರ್ಡಿಂಗ್ ಮತ್ತು ಪಾವತಿಗಳು ಸಂಪರ್ಕಿತವಾಗಿ ಉಳಿಯುತ್ತವೆ.",
    "home.recommendedProperty": "ಶಿಫಾರಸು ಮಾಡಿದ ಆಸ್ತಿ",
    "home.match": "ಹೊಂದಾಣಿಕೆ",
    "home.viewProperty": "ಆಸ್ತಿ ನೋಡಿ",
    "home.exploreCitiesEyebrow": "ನಗರಗಳನ್ನು ಅನ್ವೇಷಿಸಿ",
    "home.exploreCitiesBody": "ಮುಖ್ಯ ಪ್ರಾರಂಭ ನಗರಗಳನ್ನು ಬ್ರೌಸ್ ಮಾಡಿ, ನಂತರ ಅದೇ ಖಾತೆ ಮತ್ತು ಪಾವತಿ ಪ್ರಯಾಣದೊಂದಿಗೆ ಹುಡುಕಾಟ ಮತ್ತು ಆಸ್ತಿ ವಿವರಗಳಿಗೆ ಹೋಗಿ.",
    "home.featuredHomesEyebrow": "ವಿಶೇಷ ಮನೆಗಳು",
    "home.featuredHomesTitle": "ಟ್ರೆಂಡಿಂಗ್ ಮತ್ತು ಹೊಸದಾಗಿ ಪಟ್ಟಿ ಮಾಡಿದ ಮನೆಗಳು",
    "home.featuredHomesBody": "ಈ ಲಿಸ್ಟಿಂಗ್ ವಿಭಾಗಗಳನ್ನು ಸರಳವಾಗಿಡಲಾಗಿದೆ ಆದ್ದರಿಂದ ನೀವು ಶೋಧದಿಂದ ನೋಂದಣಿ, ಶಾರ್ಟ್‌ಲಿಸ್ಟ್ ಮತ್ತು ಪಾವತಿಯವರೆಗೆ ತ್ವರಿತವಾಗಿ ಹೋಗಬಹುದು.",
    "home.trendingNow": "ಈಗ ಟ್ರೆಂಡಿಂಗ್",
    "home.freshlyListed": "ಹೊಸದಾಗಿ ಪಟ್ಟಿಯಾದವು",
    "auth.listYourProperty": "ನಿಮ್ಮ ಆಸ್ತಿಯನ್ನು ಪಟ್ಟಿ ಮಾಡಿ",
    "auth.signIn": "ಸೈನ್ ಇನ್",
    "auth.registration": "ನೋಂದಣಿ",
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
    "hero.title": "நேரத்தையோ தெளிவையோ இழக்காமல் சரியான வாடகை வீட்டைக் கண்டறியவும்.",
    "hero.subtitle": "சரிபார்க்கப்பட்ட வீடுகளைத் தேடுங்கள், விரைவாகப் பதிவு செய்யுங்கள், மற்றும் ஒரே இடத்திலிருந்து ஆன்போர்டிங், வருகைகள் மற்றும் கட்டணங்களைத் தொடரவும்.",
    "hero.searchCta": "வாடகைகளை உலாவவும்",
    "hero.eyebrow": "நம்பிக்கை-முதலிட வாடகைகள்",
    "hero.ctaSearchHomes": "வீடுகளைத் தேடு",
    "hero.ctaRegistration": "பதிவு",
    "hero.ctaListYourHome": "உங்கள் வீட்டைப் பட்டியலிடுங்கள்",
    "hero.cityLive": "நகரம் நேரடி",
    "hero.verifiedPicks": "சரிபார்க்கப்பட்ட தேர்வுகள்",
    "hero.newListings": "புதிய பட்டியல்கள்",
    "home.whyEyebrow": "மக்கள் ஏன் Rent and Beyond ஐப் பயன்படுத்துகிறார்கள்",
    "home.verifiedHomesTitle": "சரிபார்க்கப்பட்ட வீடுகள்",
    "home.verifiedHomesBody": "ஒரு சொத்தில் நேரத்தைச் செலவிடுவதற்கு முன்பு நம்பிக்கை அறிகுறிகளைப் பாருங்கள்.",
    "home.cityBasedSearchTitle": "நகரம்-அடிப்படை தேடல்",
    "home.cityBasedSearchBody": "நீங்கள் உண்மையில் விரும்பும் நகரம் மற்றும் பகுதியிலிருந்து தொடங்குங்கள்.",
    "home.guidedSetupTitle": "வழிகாட்டப்பட்ட அமைப்பு",
    "home.guidedSetupBody": "பதிவு, ஆன்போர்டிங் மற்றும் கட்டணங்கள் இணைக்கப்பட்டிருக்கும்.",
    "home.recommendedProperty": "பரிந்துரைக்கப்பட்ட சொத்து",
    "home.match": "பொருத்தம்",
    "home.viewProperty": "சொத்தைப் பார்",
    "home.exploreCitiesEyebrow": "நகரங்களை ஆராயுங்கள்",
    "home.exploreCitiesBody": "முக்கிய அறிமுக நகரங்களை உலாவவும், பிறகு அதே கணக்கு மற்றும் கட்டண பயணத்துடன் தேடல் மற்றும் சொத்து விவரங்களுக்குச் செல்லவும்.",
    "home.featuredHomesEyebrow": "சிறப்பு வீடுகள்",
    "home.featuredHomesTitle": "டிரெண்டிங் மற்றும் புதிதாக பட்டியலிடப்பட்ட வீடுகள்",
    "home.featuredHomesBody": "இந்த பட்டியல் பிரிவுகள் எளிமையாக வைக்கப்பட்டுள்ளன, இதனால் நீங்கள் கண்டுபிடிப்பிலிருந்து பதிவு, ஷார்ட்லிஸ்ட் மற்றும் கட்டணம் வரை விரைவாக நகரலாம்.",
    "home.trendingNow": "இப்போது டிரெண்டிங்",
    "home.freshlyListed": "புதிதாக பட்டியலிடப்பட்டது",
    "auth.listYourProperty": "உங்கள் சொத்தைப் பட்டியலிடுங்கள்",
    "auth.signIn": "உள்நுழை",
    "auth.registration": "பதிவு",
    "common.loading": "ஏற்றுகிறது…",
    "common.error": "ஏதோ தவறு நடந்துவிட்டது",
    "common.retry": "மீண்டும் முயற்சி செய்",
    "common.cancel": "ரத்து செய்",
    "common.save": "சேமி",
    "common.submit": "சமர்ப்பி"
  }
};

export type TranslationKey = keyof DictionaryShape;
