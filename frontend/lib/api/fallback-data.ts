import type {
  FilterMetadataResponse,
  HomeResponse,
  ListingCollectionResponse,
  ListingSummary,
  PropertyDetailResponse,
  PropertyFaqResponse,
  PropertyReviewsResponse,
  RecommendationItem,
  SearchMapRequest,
  SearchMapResponse,
  SearchResponse,
  WebContentPageResponse
} from "@/lib/api/types";

type QueryValue = string | number | boolean | undefined | null;

const fallbackUpdatedAt = "2026-04-11T08:30:00Z";

const baseListings: ListingSummary[] = [
  {
    listingId: "listing_001",
    title: "Sunlit 2BHK near Indiranagar Metro",
    locality: "Indiranagar",
    city: "Bengaluru",
    rent: 34000,
    bhk: "2BHK",
    verified: true,
    premium: true,
    postedLabel: "Updated today",
    urgencyLabel: "Fast-moving"
  },
  {
    listingId: "listing_002",
    title: "Quiet 1BHK for solo professionals",
    locality: "HSR Layout",
    city: "Bengaluru",
    rent: 22500,
    bhk: "1BHK",
    verified: true,
    premium: false,
    postedLabel: "Added this week"
  },
  {
    listingId: "listing_003",
    title: "Garden-facing 2BHK in Koregaon Park",
    locality: "Koregaon Park",
    city: "Pune",
    rent: 31000,
    bhk: "2BHK",
    verified: true,
    premium: true,
    postedLabel: "New this week"
  },
  {
    listingId: "listing_004",
    title: "Compact 1BHK close to HITEC City",
    locality: "Madhapur",
    city: "Hyderabad",
    rent: 21000,
    bhk: "1BHK",
    verified: true,
    premium: false,
    postedLabel: "Just listed"
  },
  {
    listingId: "listing_005",
    title: "Family-ready 3BHK in Dwarka Sector 6",
    locality: "Dwarka",
    city: "NCR-Delhi",
    rent: 42000,
    bhk: "3BHK",
    verified: true,
    premium: true,
    postedLabel: "Updated yesterday"
  },
  {
    listingId: "listing_006",
    title: "Breezy 2BHK near OMR corridor",
    locality: "Thoraipakkam",
    city: "Chennai",
    rent: 28500,
    bhk: "2BHK",
    verified: true,
    premium: false,
    postedLabel: "Fresh this week"
  }
];

const baseRecommendations: RecommendationItem[] = [
  {
    ...baseListings[0],
    recommendationReason: "Strong commute fit, high response likelihood, and a calmer move-in timeline.",
    score: 94
  },
  {
    ...baseListings[2],
    recommendationReason: "Balanced for neighborhood quality, lifestyle convenience, and premium trust cues.",
    score: 91
  },
  {
    ...baseListings[3],
    recommendationReason: "Good budget match for early-stage renters who want verified stock near work hubs.",
    score: 88
  }
];

const webContentPages: Record<string, WebContentPageResponse> = {
  about: {
    slug: "about",
    eyebrow: "Brand story",
    title: "A calmer rental experience for both tenants and owners",
    description:
      "RentMate is designed to make rental search feel lighter, clearer, and more trustworthy from the first browse to the final decision.",
    pageType: "INFORMATIONAL",
    ctaLabel: "Explore Bengaluru",
    ctaHref: "/cities/bengaluru",
    updatedAt: fallbackUpdatedAt,
    sections: [
      {
        heading: "Why the product exists",
        body: "Rental search often creates stress before it creates clarity. This experience is built to reverse that.",
        bullets: ["Reduce renter anxiety", "Help owners present homes with more trust", "Keep the journey simpler across web and mobile"]
      },
      {
        heading: "What the web app should do well",
        body: "The web app should feel editorial, trustworthy, and easy to scan, with strong city discovery and high-intent search entry points.",
        bullets: ["City-first discovery", "Clear property details", "Simple onboarding and sign-in"]
      }
    ]
  },
  "how-it-works": {
    slug: "how-it-works",
    eyebrow: "Trust journey",
    title: "How discovery becomes a reliable rental workflow",
    description:
      "From the first city search to shortlisting and onboarding, each step is designed to remove friction and improve confidence.",
    pageType: "INFORMATIONAL",
    ctaLabel: "Start search",
    ctaHref: "/search",
    updatedAt: fallbackUpdatedAt,
    sections: [
      {
        heading: "Search with more context",
        body: "Browse by city, locality, landmark, or work corridor instead of starting from a blank slate.",
        bullets: ["Useful search entry points", "Better local context", "Less noisy discovery"]
      },
      {
        heading: "Use trust cues early",
        body: "Verification, responsiveness, and fit indicators appear before the user spends time on the next step.",
        bullets: ["Verified-first inventory", "Clear next actions", "Faster comparison flow"]
      }
    ]
  },
  contact: {
    slug: "contact",
    eyebrow: "Support flow",
    title: "Talk to the team behind the trust layer",
    description:
      "Reach out for help with access, shortlists, visits, profile setup, or general product questions.",
    pageType: "SUPPORT",
    ctaLabel: "View login help",
    ctaHref: "/login",
    updatedAt: fallbackUpdatedAt,
    sections: [
      {
        heading: "Human support coverage",
        body: "Support should feel fast, clear, and reassuring when someone needs help moving forward.",
        bullets: ["Account access help", "Search and shortlist guidance", "Visit and profile assistance"]
      },
      {
        heading: "What to include",
        body: "A short note with your city and the issue you are seeing usually helps route the conversation much faster.",
        bullets: ["Your name", "Your email", "A short summary of the issue"]
      }
    ]
  },
  login: {
    slug: "login",
    eyebrow: "Authentication",
    title: "Login with email, phone, or Gmail",
    description:
      "Choose the sign-in method that fits your moment, then continue into search, saved homes, or onboarding without losing context.",
    pageType: "AUTH",
    ctaLabel: "Open sign up",
    ctaHref: "/signup",
    updatedAt: fallbackUpdatedAt,
    sections: [
      {
        heading: "Sign in your way",
        body: "Email, phone, Gmail, Apple, and OTP-friendly flows are all part of the same polished experience.",
        bullets: ["Email or phone login", "Gmail continuation", "Simple session controls"]
      }
    ]
  },
  signup: {
    slug: "signup",
    eyebrow: "Authentication",
    title: "Create your account in a few steady steps",
    description:
      "Start with email, phone, or Gmail, then move into profile setup and preference details without hitting a dead end.",
    pageType: "AUTH",
    ctaLabel: "Already have an account? Login",
    ctaHref: "/login",
    updatedAt: fallbackUpdatedAt,
    sections: [
      {
        heading: "Registration methods in scope",
        body: "New users can start with the route that feels easiest and continue into the same onboarding journey.",
        bullets: ["Phone number registration", "Email registration", "Gmail continuation"]
      }
    ]
  },
  onboarding: {
    slug: "onboarding",
    eyebrow: "Finish setup",
    title: "Complete your renter profile and get ready to explore homes",
    description:
      "After registration or sign-in, finish the practical details that improve trust, recommendations, and account readiness.",
    pageType: "AUTH",
    ctaLabel: "Explore homes",
    ctaHref: "/search",
    updatedAt: fallbackUpdatedAt,
    sections: [
      {
        heading: "Complete your profile",
        body: "Add your core details so the app can present a fuller renter profile and keep account setup moving smoothly.",
        bullets: ["Name, city, and occupation", "Profile photo", "Clearer account identity"]
      },
      {
        heading: "Set your preferences",
        body: "Save the basics that shape recommendations, from budget and BHK to commute fit and lifestyle tags.",
        bullets: ["Budget and BHK", "Locality and commute fit", "Lifestyle preferences"]
      },
      {
        heading: "Finish account readiness",
        body: "Review what is still missing, secure the account with a password, and continue into search with confidence.",
        bullets: ["Password setup", "Readiness check", "Continue to search"]
      }
    ]
  },
  logout: {
    slug: "logout",
    eyebrow: "Session control",
    title: "Sign out cleanly whenever you are done",
    description:
      "Ending a session should feel as intentional and reliable as starting one, especially on a shared or public device.",
    pageType: "AUTH",
    ctaLabel: "Return to login",
    ctaHref: "/login",
    updatedAt: fallbackUpdatedAt,
    sections: [
      {
        heading: "Why clear sign-out matters",
        body: "A trustworthy product should make it obvious when your session is active and just as obvious when it ends.",
        bullets: ["Clear status", "Predictable controls", "A calmer account experience"]
      }
    ]
  },
  "privacy-policy": {
    slug: "privacy-policy",
    eyebrow: "Legal",
    title: "Privacy policy for a trust-first rental platform",
    description:
      "This product handles account, preference, shortlist, and visit-related information with a focus on clarity and responsible use.",
    pageType: "LEGAL",
    ctaLabel: "Read terms",
    ctaHref: "/terms-conditions",
    updatedAt: fallbackUpdatedAt,
    sections: [
      {
        heading: "What data may be used",
        body: "Basic account and preference details help shape search quality and support interactions.",
        bullets: ["Account profile details", "Search and shortlist activity", "Visit-related information"]
      }
    ]
  },
  "terms-conditions": {
    slug: "terms-conditions",
    eyebrow: "Legal",
    title: "Terms and conditions for using RentMate",
    description:
      "The terms define the responsibilities around listings, platform use, communication, and future workflow expansion.",
    pageType: "LEGAL",
    ctaLabel: "Read privacy policy",
    ctaHref: "/privacy-policy",
    updatedAt: fallbackUpdatedAt,
    sections: [
      {
        heading: "Platform responsibilities",
        body: "The product aims to make discovery easier, but users should still confirm fit, timing, and availability directly.",
        bullets: ["Listing clarity matters", "Communication should stay respectful", "Final decisions still need user review"]
      }
    ]
  }
};

function getListingsForCity(city?: string | null) {
  if (!city) {
    return baseListings;
  }

  const cityMatches = baseListings.filter((listing) => listing.city === city);
  return cityMatches.length ? cityMatches : baseListings;
}

function findListing(propertyId: string) {
  return baseListings.find((listing) => listing.listingId === propertyId) ?? baseListings[0];
}

export function getFallbackHome(city = "Bengaluru"): HomeResponse {
  const cityListings = getListingsForCity(city);
  const recommendations = baseRecommendations.filter((item) => item.city === city);

  return {
    heroSearchConfig: {
      city,
      lat: 12.9716,
      lng: 77.5946,
      searchPlaceholder: "Search by locality, metro, office, or landmark",
      mapEnabled: true,
      smartSuggestionsEnabled: true
    },
    recommendations: recommendations.length ? recommendations : baseRecommendations,
    trending: cityListings.slice(0, 3),
    newListings: cityListings.slice(0, 3).reverse(),
    premiumVerified: cityListings.filter((item) => item.premium).slice(0, 3),
    urgencyListings: cityListings.filter((item) => item.urgencyLabel).slice(0, 3)
  };
}

export function getFallbackListingCollection(city: string): ListingCollectionResponse {
  const items = getListingsForCity(city);
  return {
    items,
    totalCount: items.length
  };
}

export function getFallbackFilterMetadata(): FilterMetadataResponse {
  return {
    budgetRanges: ["15000-25000", "25000-35000", "35000-50000"],
    bhkOptions: ["1BHK", "2BHK", "3BHK"],
    furnishingOptions: ["Semi-furnished", "Fully furnished", "Unfurnished"],
    tenantTypes: ["WORKING_PROFESSIONAL", "FAMILY", "STUDENT"],
    quickFilters: ["Verified", "Near metro", "Pet friendly", "Owner managed"]
  };
}

export function getFallbackSearch(query: Record<string, QueryValue>): SearchResponse {
  const requestedCity = typeof query.city === "string" ? query.city : null;
  const requestedQuery = typeof query.query === "string" ? query.query.toLowerCase() : "";
  const requestedBhk = typeof query.bhk === "string" ? query.bhk : null;
  const requestedBudgetMax = typeof query.budgetMax === "number" ? query.budgetMax : null;
  const requestedVerified = typeof query.verified === "boolean" ? query.verified : null;

  const items = getListingsForCity(requestedCity).filter((listing) => {
    const matchesText =
      !requestedQuery ||
      [listing.title, listing.locality, listing.city].some((value) =>
        value.toLowerCase().includes(requestedQuery)
      );
    const matchesBhk = !requestedBhk || listing.bhk === requestedBhk;
    const matchesBudget = !requestedBudgetMax || listing.rent <= requestedBudgetMax;
    const matchesVerified = requestedVerified === null || listing.verified === requestedVerified;

    return matchesText && matchesBhk && matchesBudget && matchesVerified;
  });

  return {
    items,
    pagination: {
      page: 0,
      pageSize: Math.max(items.length, 1),
      totalItems: items.length,
      totalPages: 1
    },
    appliedFilters: {
      query: typeof query.query === "string" ? query.query : null,
      city: requestedCity,
      budgetMin: null,
      budgetMax: requestedBudgetMax,
      bhk: requestedBhk,
      furnishing: null,
      tenantType: null,
      petFriendly: null,
      verified: requestedVerified,
      sortBy: "recommended"
    },
    summary: {
      summary: `${items.length} homes ready to review in ${requestedCity ?? "your selected city"}`,
      city: requestedCity ?? "Bengaluru",
      sortBy: "recommended",
      resultCount: items.length
    }
  };
}

export function getFallbackSearchMap(request: SearchMapRequest): SearchMapResponse {
  const city =
    request.filters?.city && typeof request.filters.city === "string"
      ? request.filters.city
      : "Bengaluru";
  const items = getListingsForCity(city);

  return {
    pins: items.map((listing, index) => ({
      listingId: listing.listingId,
      title: listing.title,
      locality: listing.locality,
      lat: request.southWestLat + 0.03 + index * 0.01,
      lng: request.southWestLng + 0.03 + index * 0.01,
      rent: listing.rent,
      verified: listing.verified
    })),
    count: items.length,
    clusters: [
      {
        clusterId: `cluster-${city.toLowerCase()}`,
        lat: (request.northEastLat + request.southWestLat) / 2,
        lng: (request.northEastLng + request.southWestLng) / 2,
        count: items.length,
        label: `${items.length} homes`
      }
    ]
  };
}

export function getFallbackPropertyDetail(propertyId: string): PropertyDetailResponse {
  const listing = findListing(propertyId);

  return {
    property: {
      propertyId: listing.listingId,
      title: listing.title,
      subtitle: "Bright layout, practical commute, and a clean move-in-ready presentation.",
      locality: listing.locality,
      city: listing.city,
      address: `${listing.locality}, ${listing.city}`,
      description:
        "This fallback property detail keeps the page useful even when the listing service is unavailable. It still shows the intended layout, hierarchy, and trust cues.",
      availabilityStatus: "AVAILABLE",
      imageUrls: [
        "https://images.example.com/property/primary.jpg",
        "https://images.example.com/property/secondary.jpg"
      ]
    },
    pricing: {
      monthlyRent: listing.rent,
      securityDeposit: listing.rent * 2,
      maintenance: 2500,
      brokerage: 0,
      availableFrom: "Immediate"
    },
    specs: {
      bhk: listing.bhk,
      bathrooms: 2,
      balconies: 1,
      areaSqFt: 980,
      furnishing: "Semi-furnished",
      floor: 3,
      totalFloors: 7,
      facing: "East",
      parking: "Covered parking"
    },
    amenities: ["Lift", "Power backup", "Security", "Geyser points", "Cupboard storage"],
    trustSignals: {
      verified: listing.verified,
      verificationLabel: "Documents reviewed",
      ownerResponseRate: 92,
      ownerResponseTimeLabel: "Replies in about 10 mins",
      averageRating: 4.6,
      ratingCount: 28,
      lastUpdatedLabel: "Updated today",
      propertyTrustScore: {
        title: "Property Trust Score",
        score: 95,
        summary: "Built from listing verification, owner responsiveness, review quality, and freshness of the property information.",
        calculationStage: "Calculated at listing publish and refreshed after review or verification changes."
      },
      neighbourhoodSafetyScore: {
        title: "Neighbourhood Safety Score",
        score: 92,
        summary: "Blends locality reputation, verified tenant feedback, and building context to estimate how reassuring the area feels.",
        calculationStage: "Calculated when the locality goes live and refreshed as neighborhood signals improve."
      },
      priceFairnessScore: {
        title: "Price Fairness Score",
        score: 89,
        summary: "Compares rent, furnishing, and location to nearby verified listings so the asking price feels easier to judge.",
        calculationStage: "Calculated at listing creation and refreshed after major price or amenity updates."
      },
      badges: ["Verified", "Fast response", "Popular locality"]
    },
    ownerInfo: {
      ownerId: "owner_101",
      name: "Rohit Mehta",
      phoneMasked: "+91 98******21",
      responseTimeCommitment: "Replies in about 10 mins during the day",
      preferredLanguage: "English, Hindi",
      badge: "Responsive owner",
      yearsOnPlatform: 4
    },
    ctaFlags: {
      canScheduleVisit: true,
      canCallOwner: true,
      canChatOwner: true,
      canSave: true,
      canStartKyc: true,
      kycRequiredStage: "BEFORE_AGREEMENT",
      kycGuidance:
        "You can browse, shortlist, and schedule visits first. Complete e-KYC before agreement signing and move-in."
    },
    viewerAccess: {
      accessLevel: "FULL",
      viewerRole: "TENANT",
      premiumRequired: true,
      premiumActive: true,
      ownerView: false,
      headline: "Tenant Premium is active",
      message:
        "The fallback data assumes a premium-ready tenant so the page can still render the intended full-detail experience.",
      upgradePlanCode: "TENANT_PREMIUM_ANNUAL",
      upgradePlanName: "Tenant Premium",
      upgradePrice: 500,
      upgradeCurrency: "INR",
      upgradePeriodLabel: "per year"
    }
  };
}

export function getFallbackPropertyReviews(): PropertyReviewsResponse {
  return {
    reviews: [
      {
        reviewId: "review_001",
        reviewerName: "Neha S.",
        rating: 5,
        headline: "Well-kept and exactly as described",
        comment: "The photos matched the home and the visit scheduling process felt straightforward.",
        reviewerType: "Tenant",
        createdAt: fallbackUpdatedAt
      },
      {
        reviewId: "review_002",
        reviewerName: "Rahul P.",
        rating: 4,
        headline: "Good location for daily commute",
        comment: "A practical option with a calm street and clear owner communication.",
        reviewerType: "Tenant",
        createdAt: fallbackUpdatedAt
      }
    ],
    ratingSummary: {
      averageRating: 4.5,
      totalReviews: 2,
      fiveStarCount: 1,
      fourStarCount: 1,
      threeStarCount: 0,
      twoStarCount: 0,
      oneStarCount: 0
    },
    totalCount: 2
  };
}

export function getFallbackPropertyFaq(): PropertyFaqResponse {
  return {
    faqItems: [
      {
        question: "Is the rent negotiable?",
        answer: "The listed rent is a starting point, but the final discussion depends on tenure and move-in timing."
      },
      {
        question: "Can I schedule a visit this week?",
        answer: "Yes. The page keeps the visit call to action active so the intended flow is still visible."
      }
    ]
  };
}

export function getFallbackWebContentPage(slug: string): WebContentPageResponse {
  return webContentPages[slug] ?? webContentPages.about;
}
