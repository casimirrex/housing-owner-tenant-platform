INSERT INTO site_overview (overview_key, eyebrow, title, description) VALUES
  ('default', 'Website Blueprint', 'The pages your owner-tenant platform needs before launch.',
   'This page is driven by a separate Spring Boot API instead of hardcoded frontend content. It keeps the website blueprint dynamic, lets the frontend fetch live data, and gives you a clean place to extend the page model later.');

INSERT INTO site_overview_launch_city (overview_key, sort_order, city) VALUES
  ('default', 1, 'Bengaluru'),
  ('default', 2, 'Pune'),
  ('default', 3, 'Hyderabad'),
  ('default', 4, 'NCR-Delhi'),
  ('default', 5, 'Chennai');

INSERT INTO site_overview_journey_phase (overview_key, sort_order, label, detail) VALUES
  ('default', 1, 'Discovery', 'Landing page and city pages bring users into the funnel through brand, SEO, and location-first exploration.'),
  ('default', 2, 'Evaluation', 'Listing results and property detail pages help people compare options quickly with filters, map context, and trust signals.'),
  ('default', 3, 'Trust', 'About, support, privacy, and terms pages reduce friction and make the product feel safe, credible, and complete.');

INSERT INTO site_overview_shipping_note (overview_key, sort_order, note) VALUES
  ('default', 1, 'Treat the home page, city pages, results page, property page, privacy policy, and terms as launch-blocking.'),
  ('default', 2, 'Ship About / How it works and Contact / Support right after the core funnel if they are not available on day one.'),
  ('default', 3, 'Keep the content model flexible so more cities, legal pages, and funnel variants can be added without redesigning the page.');

INSERT INTO page_blueprint (sort_order, page, purpose, status) VALUES
  (1, 'Landing / Home page', 'Brand, search entry, and city-based discovery.', 'Required'),
  (2, 'City landing page', 'Bengaluru, Pune, Hyderabad, NCR-Delhi, and Chennai entry pages.', 'Required'),
  (3, 'Listing results page', 'Search results with filters plus map and list browsing options.', 'Required'),
  (4, 'Property detail page', 'Full property information, trust signals, and conversion CTAs.', 'Required'),
  (5, 'About / How it works', 'Product explanation, education, and trust-building.', 'Recommended'),
  (6, 'Contact / Support page', 'Customer support, enquiries, and fallback human assistance.', 'Recommended'),
  (7, 'Privacy Policy', 'Legal and compliance coverage for data handling.', 'Required'),
  (8, 'Terms & Conditions', 'Legal and compliance terms for product usage.', 'Required');

INSERT INTO product_page_catalog (sort_order, page, purpose, source) VALUES
  (1, 'Splash / intro equivalent', 'Web onboarding entry experience', 'PRD'),
  (2, 'Login page', 'Phone/email/social login', 'PRD'),
  (3, 'OTP verification page', 'OTP entry and retry/change-number flow', 'PRD'),
  (4, 'Sign up page', 'New user registration', 'PRD'),
  (5, 'Home / discovery dashboard', 'Smart search, recommendations, trust layer', 'PRD'),
  (6, 'Search results page', 'List view + map view + quick filters', 'PRD'),
  (7, 'Property detail page', 'Images, amenities, trust, owner info, reviews/FAQ', 'PRD'),
  (8, 'Matches page', 'Personalized matches', 'SOW says build, client must define'),
  (9, 'Dashboard page', 'Tenant dashboard', 'SOW says build, client must define'),
  (10, 'Profile page', 'User profile, settings, verification status', 'SOW says build, client must define'),
  (11, 'Visit scheduling page', 'Schedule visit / slot flow', 'SOW Phase 1'),
  (12, 'Saved / shortlist page', 'Optional but strongly recommended', 'Implied by marketplace UX'),
  (13, 'Notifications page', 'Alerts, matches, reminders', 'Phase 2 / smart alerts'),
  (14, 'e-KYC page', 'KYC upload / verification flow', 'Phase 2'),
  (15, 'Payments page', 'UPI payment journey', 'Phase 2'),
  (16, 'e-Agreement page', 'Agreement review/sign flow', 'Phase 2'),
  (17, 'Monthly rent dashboard', 'Payment history / upcoming dues', 'Phase 2');

INSERT INTO backend_layer (layer, recommended_tech_stack, purpose) VALUES
  ('Backend', 'Java + Spring Boot', 'Core APIs, business logic, auth, listings, search, payments, agreements, and workflow orchestration.');

INSERT INTO web_content_page (
  slug, eyebrow, title, description, page_type, cta_label, cta_href, updated_at
) VALUES
  ('how-it-works', 'Trust journey', 'How discovery becomes a reliable rental workflow',
   'This Phase 1 page is driven by backend content so the web experience can evolve without hardcoded copy releases.',
   'INFORMATIONAL', 'Start search', '/search', TIMESTAMPTZ '2026-04-09T12:00:00Z'),
  ('about', 'Brand story', 'A calmer rental experience for both tenants and owners',
   'The about page now comes from the backend so brand positioning, mission language, and market narrative can change without a frontend-only release.',
   'INFORMATIONAL', 'Explore Bengaluru', '/cities/bengaluru', TIMESTAMPTZ '2026-04-09T12:00:00Z'),
  ('contact', 'Support flow', 'Talk to the team behind the trust layer',
   'The support page is fully dynamic and the enquiry form now posts to the Spring Boot backend instead of stopping at frontend validation.',
   'SUPPORT', 'View login help', '/login', TIMESTAMPTZ '2026-04-09T12:00:00Z'),
  ('privacy-policy', 'Legal', 'Privacy policy for a trust-first rental platform',
   'Privacy language is sourced from the backend so policy updates can ship with legal review instead of page rewrites inside the Next.js repo.',
   'LEGAL', 'Read terms', '/terms-conditions', TIMESTAMPTZ '2026-04-09T12:00:00Z'),
  ('terms-conditions', 'Legal', 'Terms and conditions for using Rent and Beyond',
   'Terms content is API-driven so contractual copy can change independently of layout releases.',
   'LEGAL', 'Read privacy policy', '/privacy-policy', TIMESTAMPTZ '2026-04-09T12:00:00Z'),
  ('login', 'Authentication', 'Login, Google Sign-In, and session control for the web app',
   'The login page is backed by content and live auth APIs, so Google Sign-In, email or phone login, refresh, and logout all sit inside one real flow.',
   'AUTH', 'Open logout page', '/logout', TIMESTAMPTZ '2026-04-09T12:00:00Z'),
  ('onboarding', 'Finish setup', 'Complete your renter profile and start exploring homes',
   'The onboarding page is backend-driven and now focuses on the practical steps after sign-up: profile details, search preferences, account security, and readiness for home discovery.',
   'AUTH', 'Explore homes', '/search', TIMESTAMPTZ '2026-04-13T09:30:00Z'),
  ('signup', 'Authentication', 'Register with email or phone for the web application',
   'The signup page is backend-driven and starts a real registration flow through the Spring Boot auth APIs for email and phone onboarding.',
   'AUTH', 'Already have an account? Login', '/login', TIMESTAMPTZ '2026-04-09T12:00:00Z'),
  ('logout', 'Authentication', 'Logout and session sign-out for the web application',
   'Logout is treated as an explicit first-class web requirement and is powered by its own backend API so sessions can be ended intentionally.',
   'AUTH', 'Return to login', '/login', TIMESTAMPTZ '2026-04-09T12:00:00Z');

INSERT INTO web_content_section (slug, sort_order, heading, body) VALUES
  ('how-it-works', 1, 'Search with more context',
   'Start from city, locality, landmark, office corridor, or lifestyle preference so discovery feels guided instead of noisy.'),
  ('how-it-works', 2, 'Use trust cues early',
   'Property detail surfaces verification, owner responsiveness, ratings, FAQ, and shortlist actions before the renter commits effort.'),
  ('how-it-works', 3, 'Move into operational workflows',
   'Visit scheduling begins in Phase 1, while KYC, payments, and agreement flows can layer in without redesigning the funnel.'),
  ('about', 1, 'Why the product exists',
   'Rent and Beyond is designed for renters who want more confidence, and owners who want a clearer presentation of their homes.'),
  ('about', 2, 'What Phase 1 must do',
   'The web app has to capture branded discovery, city-led SEO, search, property trust, legal clarity, support access, and authentication fundamentals.'),
  ('about', 3, 'How web and mobile differ',
   'The web app carries public discovery, SEO, and broad authenticated access, while the mobile app extends the on-the-go tenant journey.'),
  ('contact', 1, 'Human support coverage',
   'Support should be available for account access, shortlist confusion, visit coordination, owner issues, and legal or policy questions.'),
  ('contact', 2, 'Response expectations',
   'Enquiries should be captured with enough context to route them quickly and feed future support analytics.'),
  ('privacy-policy', 1, 'What data is collected',
   'The platform handles account, preference, shortlist, visit, and future KYC or payment-related data.'),
  ('privacy-policy', 2, 'How integrations are disclosed',
   'Maps, analytics, monitoring, storage, and cloud infrastructure use should be described clearly for users and compliance review.'),
  ('privacy-policy', 3, 'What future workflows add',
   'Phase 2 expands sensitive data handling through KYC, payments, and agreements, so the policy must be flexible and explicit.'),
  ('terms-conditions', 1, 'Platform responsibilities',
   'Terms should define the platform role, owner obligations, tenant conduct, and the limits of listing, pricing, and availability guarantees.'),
  ('terms-conditions', 2, 'Trust and verification expectations',
   'The terms should clarify how verification indicators, shortlist actions, and owner communications are meant to be used.'),
  ('terms-conditions', 3, 'Future transaction workflows',
   'The legal baseline should make room for recurring rent, UPI payments, e-agreements, and other workflow expansion areas.'),
  ('login', 1, 'Authentication methods in scope',
   'The PRD explicitly supports phone, email, Google, and Apple sign-in patterns, plus OTP verification or change-number flows.'),
  ('login', 2, 'Logout as a standard function',
   'Even though logout was not separately emphasized in the PRD, it is now included as a standard web authentication capability.'),
  ('login', 3, 'What the page calls',
   'The page exercises login, Google sign-in, refresh, and logout endpoints against the Spring Boot backend.'),
  ('onboarding', 1, 'Complete your profile',
   'The first part of onboarding focuses on the renter details that make the account feel complete, including identity basics, city, occupation, and profile photo.'),
  ('onboarding', 2, 'Set your search preferences',
   'After the profile is in place, the app collects budget, BHK, commute, and lifestyle preferences so recommendations and discovery feel more relevant.'),
  ('onboarding', 3, 'Finish account readiness',
   'The final step helps the renter review progress, add an app password if needed, and continue into home search with a clearer sense of completion.'),
  ('signup', 1, 'Registration methods in scope',
   'The PRD supports phone number, email, Google, and Apple registration flows, with OTP verification when phone-led onboarding is used.'),
  ('signup', 2, 'What this web page starts',
   'This web signup experience starts email registration or phone registration by calling the backend auth flow APIs and showing the next step.'),
  ('signup', 3, 'How the user continues',
   'Email flows continue into profile completion, while phone flows move into OTP verification and then deeper onboarding.'),
  ('logout', 1, 'Why explicit sign-out matters',
   'A production web app should let users end active sessions intentionally instead of assuming browser close is enough.'),
  ('logout', 2, 'What the logout route does',
   'The web logout page calls the backend sign-out endpoint with the active refresh token and confirms that the session has been revoked.');

INSERT INTO web_content_bullet (slug, section_sort_order, bullet_sort_order, bullet) VALUES
  ('how-it-works', 1, 1, 'Landing, city, and search pages all seed the same trust-first funnel.'),
  ('how-it-works', 1, 2, 'Search supports map-aware discovery and structured filtering.'),
  ('how-it-works', 2, 1, 'Property detail combines amenities, owner info, reviews, and FAQ.'),
  ('how-it-works', 2, 2, 'Shortlist and visit actions keep evaluation connected to conversion.'),
  ('how-it-works', 3, 1, 'Visit scheduling is Phase 1.'),
  ('how-it-works', 3, 2, 'KYC, payments, and agreements extend the same journey later.'),
  ('about', 1, 1, 'Reduce renter anxiety in fast-moving city markets.'),
  ('about', 1, 2, 'Give owners a stronger trust and response narrative.'),
  ('about', 2, 1, 'Public discovery and SEO pages are launch-critical.'),
  ('about', 2, 2, 'Authentication and legal clarity are part of the real product, not afterthoughts.'),
  ('about', 3, 1, 'Web carries broad discovery and entry.'),
  ('about', 3, 2, 'Mobile carries deeper daily tenant journey motion.'),
  ('contact', 1, 1, 'Account and login support'),
  ('contact', 1, 2, 'Search, shortlist, and visit support'),
  ('contact', 1, 3, 'Owner, trust, and policy support'),
  ('contact', 2, 1, 'Capture name, email, optional phone, city, and message'),
  ('contact', 2, 2, 'Persist each enquiry for routing and reporting'),
  ('privacy-policy', 1, 1, 'Account profile and authentication data'),
  ('privacy-policy', 1, 2, 'Preference, shortlist, and visit activity'),
  ('privacy-policy', 2, 1, 'Maps and geospatial services'),
  ('privacy-policy', 2, 2, 'Analytics, monitoring, storage, and cloud hosting'),
  ('privacy-policy', 3, 1, 'KYC verification flows'),
  ('privacy-policy', 3, 2, 'Payments, rent history, and agreement records'),
  ('terms-conditions', 1, 1, 'Owner obligations and listing accuracy'),
  ('terms-conditions', 1, 2, 'Tenant conduct and responsible usage'),
  ('terms-conditions', 2, 1, 'Trust badges are indicators, not absolute guarantees'),
  ('terms-conditions', 2, 2, 'Users should still confirm availability and fit'),
  ('terms-conditions', 3, 1, 'Prepare terms for payment and agreement workflows'),
  ('terms-conditions', 3, 2, 'Avoid rewriting the contract model during Phase 2'),
  ('login', 1, 1, 'Email or phone login'),
  ('login', 1, 2, 'Google Sign-In'),
  ('login', 1, 3, 'OTP and session refresh support'),
  ('login', 2, 1, 'Logout or session sign-out is explicitly included'),
  ('login', 2, 2, 'Separate logout page is available for web testing'),
  ('login', 3, 1, 'POST /auth/login'),
  ('login', 3, 2, 'POST /auth/oauth/google'),
  ('login', 3, 3, 'POST /auth/token/refresh and POST /auth/logout'),
  ('onboarding', 1, 1, 'Add your name, city, and occupation'),
  ('onboarding', 1, 2, 'Upload a profile photo when available'),
  ('onboarding', 1, 3, 'Build a stronger trust signal for owners and search'),
  ('onboarding', 2, 1, 'Save budget and BHK preferences'),
  ('onboarding', 2, 2, 'Capture commute goals and preferred localities'),
  ('onboarding', 2, 3, 'Include lifestyle and pet-friendly preferences'),
  ('onboarding', 3, 1, 'Review profile, preference, and verification progress'),
  ('onboarding', 3, 2, 'Set or update an app password for direct sign-in'),
  ('onboarding', 3, 3, 'Continue into search once the account feels ready'),
  ('signup', 1, 1, 'Phone number registration'),
  ('signup', 1, 2, 'Email registration'),
  ('signup', 1, 3, 'Google and Apple remain supported auth directions'),
  ('signup', 2, 1, 'POST /auth/register/email'),
  ('signup', 2, 2, 'POST /auth/register/phone'),
  ('signup', 2, 3, 'Flow response shows next step and masked destination'),
  ('signup', 3, 1, 'Email registration returns COMPLETE_SIGN_UP'),
  ('signup', 3, 2, 'Phone registration returns VERIFY_OTP'),
  ('logout', 1, 1, 'Users should see session state before sign-out'),
  ('logout', 1, 2, 'Sign-out confirmation should be visible in the UI'),
  ('logout', 2, 1, 'POST /auth/logout revokes the active session'),
  ('logout', 2, 2, 'The UI clears local session state after success');

INSERT INTO users (
  user_id, full_name, email, phone_number, password_hash, role, profile_status, city,
  date_of_birth, gender, occupation, emergency_contact_name, emergency_contact_phone,
  employment_type, employer_name, monthly_income_range, previous_landlord_name,
  previous_landlord_phone, aadhaar_last4, pan_card_number, government_id_type,
  government_id_photo_url, upi_id, photo_url, profile_completion
) VALUES
  ('user_1a2b3c4d', 'Aarav Kumar', 'aarav@example.com', '+919876543210', '$2a$10$pD33F0UkOrj67OP8spOMZOgsxulCVSbXAkRf23fOIxWMEjdNZ3U..', 'TENANT', 'VERIFIED', 'Bengaluru',
   DATE '1995-08-14', 'Male', 'Software Engineer', 'Meera Kumar', '+919912345678',
   'SALARIED', 'Infosys', 'Rs. 90,000-1,20,000', 'Sanjay Menon',
   '+919800112233', '4821', 'ABCDE1234F', 'Driving Licence',
   'https://images.example.com/users/aarav-id-front.jpg', 'aarav@upi', 'https://images.example.com/users/aarav.jpg', 92),
  ('owner_101', 'Rohit Mehta', 'rohit.mehta@example.com', '+919888882109', '$2a$10$pD33F0UkOrj67OP8spOMZOgsxulCVSbXAkRf23fOIxWMEjdNZ3U..', 'OWNER', 'VERIFIED', 'Bengaluru',
   NULL, 'Male', 'Business Owner', NULL, NULL,
   NULL, NULL, NULL, NULL,
   NULL, NULL, NULL, NULL,
   NULL, NULL, 'https://images.example.com/users/rohit.jpg', 100),
  ('owner_204', 'Swati Narang', 'swati.narang@example.com', '+919777774432', '$2a$10$pD33F0UkOrj67OP8spOMZOgsxulCVSbXAkRf23fOIxWMEjdNZ3U..', 'OWNER', 'VERIFIED', 'Bengaluru',
   NULL, 'Female', 'Consultant', NULL, NULL,
   NULL, NULL, NULL, NULL,
   NULL, NULL, NULL, NULL,
   NULL, NULL, 'https://images.example.com/users/swati.jpg', 100),
  ('user_7n6m5l4k', 'Divya Nair', 'divya.nair@example.com', '+919700112244', '$2a$10$pD33F0UkOrj67OP8spOMZOgsxulCVSbXAkRf23fOIxWMEjdNZ3U..', 'TENANT', 'VERIFIED', 'Bengaluru',
   DATE '1997-11-03', 'Female', 'Product Designer', 'Nikhil Nair', '+919933221144',
   'SALARIED', 'Freshworks', 'Rs. 60,000-90,000', 'Ramesh Iyer',
   '+919811110022', '7192', 'FGHIJ5678K', 'Passport',
   'https://images.example.com/users/divya-id-front.jpg', 'divya@upi', 'https://images.example.com/users/divya.jpg', 84),
  ('owner_188', 'Aditi Khanna', 'aditi.khanna@example.com', '+919666667788', '$2a$10$pD33F0UkOrj67OP8spOMZOgsxulCVSbXAkRf23fOIxWMEjdNZ3U..', 'OWNER', 'VERIFIED', 'Pune',
   NULL, 'Female', 'Architect', NULL, NULL,
   NULL, NULL, NULL, NULL,
   NULL, NULL, NULL, NULL,
   NULL, NULL, 'https://images.example.com/users/aditi.jpg', 100);

INSERT INTO subscription_plans (
  plan_code, role, plan_name, description, billing_period, price_amount, currency, validity_days, active
) VALUES
  ('TENANT_PREMIUM_ANNUAL', 'TENANT', 'Tenant Premium', 'Unlock full property details, exact address, owner profile, and advanced trust insights.', 'ANNUAL', 1000, 'INR', 365, TRUE),
  ('OWNER_PREMIUM_ANNUAL', 'OWNER', 'Owner Premium', 'Required to publish property listings. One annual fee gives you unlimited listings, owner dashboard, and tenant matching.', 'ANNUAL', 1000, 'INR', 365, TRUE);

INSERT INTO user_subscriptions (
  subscription_id, user_id, plan_code, status, started_at, expires_at,
  activated_via, amount_paid, currency, payment_reference, created_at, updated_at
) VALUES
  ('sub_tenant_premium_1001', 'user_1a2b3c4d', 'TENANT_PREMIUM_ANNUAL', 'ACTIVE',
   TIMESTAMPTZ '2026-04-01T08:00:00Z', TIMESTAMPTZ '2027-04-01T08:00:00Z',
   'SEEDED', 1000, 'INR', 'seed_premium_activation_1001',
   TIMESTAMPTZ '2026-04-01T08:00:00Z', TIMESTAMPTZ '2026-04-01T08:00:00Z');

INSERT INTO user_preferences (
  user_id, preference_profile_id, budget_min, budget_max, bhk_preference,
  furnishing_preference, commute_location, move_in_date, pet_friendly, tenant_type
) VALUES
  ('user_1a2b3c4d', 'pref_2eac91f4', 15000, 35000, '1BHK,2BHK',
   'Semi Furnished, Fully Furnished', 'Manyata Tech Park', DATE '2026-04-25', TRUE, 'WORKING_PROFESSIONAL'),
  ('user_7n6m5l4k', 'pref_8h3s21la', 18000, 42000, '1BHK,2BHK',
   'Fully Furnished', 'Outer Ring Road', DATE '2026-05-10', FALSE, 'WORKING_PROFESSIONAL');

INSERT INTO user_preferred_localities (user_id, sort_order, locality) VALUES
  ('user_1a2b3c4d', 1, 'Koramangala'),
  ('user_1a2b3c4d', 2, 'HSR Layout'),
  ('user_7n6m5l4k', 1, 'Indiranagar'),
  ('user_7n6m5l4k', 2, 'Whitefield');

INSERT INTO user_lifestyle_tags (user_id, sort_order, tag) VALUES
  ('user_1a2b3c4d', 1, 'near-metro'),
  ('user_1a2b3c4d', 2, 'family-friendly'),
  ('user_7n6m5l4k', 1, 'design-studio-commute'),
  ('user_7n6m5l4k', 2, 'natural-light');

INSERT INTO location_suggestions (label, type, city, lat, lng) VALUES
  ('Indiranagar', 'AREA', 'Bengaluru', 12.9784, 77.6408),
  ('Indiranagar Metro', 'LANDMARK', 'Bengaluru', 12.9781, 77.6409),
  ('Manyata Tech Park', 'OFFICE', 'Bengaluru', 13.0475, 77.6200),
  ('HSR Layout', 'AREA', 'Bengaluru', 12.9116, 77.6474),
  ('Whitefield', 'AREA', 'Bengaluru', 12.9698, 77.7499),
  ('Koregaon Park', 'AREA', 'Pune', 18.5362, 73.8930),
  ('Gachibowli', 'AREA', 'Hyderabad', 17.4401, 78.3489);

INSERT INTO search_filter_metadata (filter_category, sort_order, filter_value, city) VALUES
  ('budgetRanges', 1, '0-15000', NULL),
  ('budgetRanges', 2, '15000-25000', NULL),
  ('budgetRanges', 3, '25000-40000', NULL),
  ('budgetRanges', 4, '40000+', NULL),
  ('bhkOptions', 1, 'Studio', NULL),
  ('bhkOptions', 2, '1BHK', NULL),
  ('bhkOptions', 3, '2BHK', NULL),
  ('bhkOptions', 4, '3BHK', NULL),
  ('furnishingOptions', 1, 'Unfurnished', NULL),
  ('furnishingOptions', 2, 'Semi Furnished', NULL),
  ('furnishingOptions', 3, 'Fully Furnished', NULL),
  ('tenantTypes', 1, 'WORKING_PROFESSIONAL', NULL),
  ('tenantTypes', 2, 'FAMILY', NULL),
  ('tenantTypes', 3, 'STUDENT', NULL),
  ('quickFilters', 1, 'Verified', NULL),
  ('quickFilters', 2, 'Pet Friendly', NULL),
  ('quickFilters', 3, 'Near Metro', NULL),
  ('quickFilters', 4, 'Premium', NULL);

INSERT INTO listings (
  listing_id, owner_id, owner_managed, property_type, title, subtitle, city, locality, address, description,
  rent, deposit, maintenance, brokerage, bhk, bathrooms, balconies, area_sq_ft, furnishing, floor_no, total_floors,
  facing, parking, availability_date, availability_status, lat, lng, verified, premium, pet_friendly, tenant_type,
  posted_label, urgency_label, recommendation_reason, recommendation_score, trending, new_listing,
  owner_name, owner_phone_masked, owner_preferred_language, owner_badge, owner_years_on_platform,
  verification_label, owner_response_rate, average_rating, rating_count, last_updated_label,
  can_schedule_visit, can_call_owner, can_chat_owner, can_save, can_start_kyc, status, created_at
) VALUES
  ('listing_001', 'owner_101', FALSE, 'Apartment', 'Sunny 2BHK near Indiranagar Metro', 'Verified family-friendly apartment in a gated community',
   'Bengaluru', 'Indiranagar', '12th Main Road, HAL 2nd Stage, Indiranagar, Bengaluru',
   'Bright 2BHK with metro access, strong ventilation, and a responsive owner.',
   32000, 96000, 3500, 0, '2BHK', 2, 1, 1180, 'Semi Furnished', 3, 8, 'East', '1 covered parking',
   DATE '2026-04-15', 'AVAILABLE', 12.9784, 77.6408, TRUE, TRUE, TRUE, 'WORKING_PROFESSIONAL',
   'Added 2 hours ago', 'High demand', 'Matches your commute and budget range', 0.94, TRUE, FALSE,
   'Rohit Mehta', '+91******2109', 'English, Hindi', 'Top responsive owner', 3,
   'Verified by Housing Platform', 96, 4.7, 28, 'Updated today',
   TRUE, TRUE, TRUE, TRUE, TRUE, 'PUBLISHED', TIMESTAMPTZ '2026-04-07T08:00:00Z'),
  ('listing_002', 'owner_101', FALSE, 'Apartment', 'Compact 1BHK for working professionals', 'Compact layout with fast access to coworking hubs',
   'Bengaluru', 'HSR Layout', '17th Cross Road, HSR Layout, Bengaluru',
   'Efficient 1BHK designed for solo professionals who want a furnished ready-to-move option.',
   21000, 63000, 2500, 0, '1BHK', 1, 1, 620, 'Fully Furnished', 2, 5, 'North', 'Bike parking',
   DATE '2026-04-17', 'AVAILABLE', 12.9121, 77.6446, TRUE, FALSE, FALSE, 'WORKING_PROFESSIONAL',
   'Added today', NULL, 'Popular with similar tenants', 0.91, TRUE, TRUE,
   'Rohit Mehta', '+91******2109', 'English, Hindi', 'Fast-response owner', 3,
   'Verified by Housing Platform', 92, 4.4, 12, 'Updated today',
   TRUE, TRUE, TRUE, TRUE, FALSE, 'PUBLISHED', TIMESTAMPTZ '2026-04-08T09:30:00Z'),
  ('listing_003', 'owner_188', FALSE, 'Apartment', 'Verified 2BHK in Koregaon Park', 'Trusted owner and premium neighborhood access',
   'Pune', 'Koregaon Park', 'Lane 5, Koregaon Park, Pune',
   'Well-maintained home with tasteful interiors and immediate move-in availability.',
   29000, 87000, 2500, 0, '2BHK', 2, 1, 1105, 'Semi Furnished', 2, 6, 'West', '1 open parking',
   DATE '2026-04-18', 'AVAILABLE', 18.5362, 73.8930, TRUE, TRUE, TRUE, 'FAMILY',
   'Added 1 day ago', NULL, 'Strong trust score and premium owner', 0.89, FALSE, TRUE,
   'Aditi Khanna', '+91******7788', 'English, Marathi', 'Trusted repeat owner', 4,
   'Verified by Housing Platform', 91, 4.6, 19, 'Updated today',
   TRUE, TRUE, TRUE, TRUE, FALSE, 'PUBLISHED', TIMESTAMPTZ '2026-04-06T10:00:00Z'),
  ('listing_004', 'owner_204', FALSE, 'Apartment', 'Family-ready 3BHK close to Whitefield', 'Large home with school access and flexible visit slots',
   'Bengaluru', 'Whitefield', 'Near ITPL Main Road, Whitefield, Bengaluru',
   'Spacious 3BHK designed for families with broad balconies and practical storage.',
   41000, 120000, 4500, 0, '3BHK', 3, 2, 1620, 'Unfurnished', 5, 10, 'North-East', '2 covered parking',
   DATE '2026-04-20', 'AVAILABLE', 12.9698, 77.7499, TRUE, TRUE, TRUE, 'FAMILY',
   'Added 4 hours ago', 'Limited slots', 'Best fit for larger family households', 0.88, TRUE, FALSE,
   'Swati Narang', '+91******4432', 'English', 'Family-friendly owner', 2,
   'Verified by Housing Platform', 93, 4.5, 16, 'Updated 1 day ago',
   TRUE, TRUE, FALSE, TRUE, TRUE, 'PUBLISHED', TIMESTAMPTZ '2026-04-08T06:30:00Z'),
  ('listing_005', 'owner_204', FALSE, 'Apartment', 'Newly listed 1BHK in Gachibowli', 'Fresh inventory in a fast-moving micro-market',
   'Hyderabad', 'Gachibowli', 'Financial District Road, Gachibowli, Hyderabad',
   'Freshly listed furnished 1BHK with easy access to offices and daily needs.',
   23000, 69000, 1800, 0, '1BHK', 1, 1, 650, 'Fully Furnished', 4, 9, 'East', '1 bike parking',
   DATE '2026-04-16', 'AVAILABLE', 17.4401, 78.3489, FALSE, FALSE, FALSE, 'STUDENT',
   'Added 30 minutes ago', 'Just listed', 'Fresh inventory in a fast-moving micro-market', 0.86, FALSE, TRUE,
   'Swati Narang', '+91******4432', 'English', 'Responsive owner', 2,
   'Pending verification', 88, 4.1, 7, 'Updated today',
   TRUE, TRUE, TRUE, TRUE, FALSE, 'PUBLISHED', TIMESTAMPTZ '2026-04-09T07:30:00Z'),
  ('listing_006', 'owner_204', FALSE, 'Studio', 'Premium studio near Delhi Cyber City', 'Business-district studio with flexible move-in',
   'NCR-Delhi', 'Gurugram', 'DLF Cyber City, Gurugram',
   'Well-located premium studio with business-district proximity and managed services.',
   27000, 81000, 3000, 0, 'Studio', 1, 0, 480, 'Fully Furnished', 7, 14, 'North', 'No dedicated parking',
   DATE '2026-04-19', 'AVAILABLE', 28.4941, 77.0890, TRUE, TRUE, FALSE, 'WORKING_PROFESSIONAL',
   'Added today', NULL, 'Close to business district and transit', 0.84, TRUE, FALSE,
   'Swati Narang', '+91******4432', 'English', 'Premium owner listing', 2,
   'Verified by Housing Platform', 90, 4.3, 10, 'Updated today',
   TRUE, TRUE, TRUE, TRUE, FALSE, 'PUBLISHED', TIMESTAMPTZ '2026-04-08T12:00:00Z'),
  ('listing_007', 'owner_101', FALSE, 'Apartment', 'Pet-friendly 2BHK near Manyata Tech Park', 'Commute-friendly home with pet acceptance',
   'Bengaluru', 'Nagawara', 'Outer Ring Road, Nagawara, Bengaluru',
   'Pet-friendly 2BHK with quick commute access to Manyata Tech Park.',
   34000, 102000, 2800, 0, '2BHK', 2, 1, 1160, 'Semi Furnished', 6, 12, 'South-East', '1 covered parking',
   DATE '2026-04-21', 'AVAILABLE', 13.0481, 77.6206, TRUE, TRUE, TRUE, 'FAMILY',
   'Added yesterday', NULL, 'Strong fit for pet-friendly and tech-park commute filters', 0.91, FALSE, FALSE,
   'Rohit Mehta', '+91******2109', 'English, Hindi', 'Top responsive owner', 3,
   'Verified by Housing Platform', 95, 4.6, 14, 'Updated today',
   TRUE, TRUE, TRUE, TRUE, TRUE, 'PUBLISHED', TIMESTAMPTZ '2026-04-07T14:30:00Z'),
  ('owner_listing_2000', 'owner_101', TRUE, 'Apartment', 'Semi-furnished 2BHK in HSR Layout', 'Owner-managed listing ready for publication',
   'Bengaluru', 'HSR Layout', '5th Sector, HSR Layout, Bengaluru',
   'Owner-managed listing with strong family appeal and gated community access.',
   32000, 96000, 2200, 0, '2BHK', 2, 1, 1090, 'Semi Furnished', 3, 6, 'East', '1 covered parking',
   DATE '2026-04-18', 'AVAILABLE', 12.9116, 77.6474, TRUE, FALSE, FALSE, 'FAMILY',
   'Added 2 days ago', NULL, NULL, NULL, FALSE, FALSE,
   'Rohit Mehta', '+91******2109', 'English, Hindi', 'Owner draft', 3,
   'Verified by Housing Platform', 96, 4.5, 8, 'Updated today',
   TRUE, TRUE, TRUE, TRUE, FALSE, 'PUBLISHED', TIMESTAMPTZ '2026-04-07T08:15:00Z'),
  ('owner_listing_2001', 'owner_101', TRUE, 'Apartment', 'Family 3BHK near Whitefield Main Road', 'Owner draft for a larger household listing',
   'Bengaluru', 'Whitefield', 'Main Road, Whitefield, Bengaluru',
   'Draft owner listing prepared for a family-sized home in Whitefield.',
   41000, 120000, 3000, 0, '3BHK', 3, 2, 1540, 'Unfurnished', 4, 9, 'North', '1 covered parking',
   DATE '2026-04-22', 'AVAILABLE', 12.9698, 77.7499, FALSE, FALSE, FALSE, 'FAMILY',
   'Added 1 day ago', NULL, NULL, NULL, FALSE, FALSE,
   'Rohit Mehta', '+91******2109', 'English, Hindi', 'Owner draft', 3,
   'Pending verification', 90, 0.0, 0, 'Updated today',
   TRUE, TRUE, FALSE, TRUE, FALSE, 'DRAFT', TIMESTAMPTZ '2026-04-08T06:45:00Z');

INSERT INTO listing_amenities (listing_id, sort_order, amenity) VALUES
  ('listing_001', 1, 'Lift'),
  ('listing_001', 2, 'Power Backup'),
  ('listing_001', 3, 'Gated Community'),
  ('listing_001', 4, 'Visitor Parking'),
  ('listing_001', 5, 'Near Metro'),
  ('listing_002', 1, 'Lift'),
  ('listing_002', 2, 'Wi-Fi Ready'),
  ('listing_002', 3, 'Power Backup'),
  ('listing_003', 1, 'Power Backup'),
  ('listing_003', 2, 'Security'),
  ('listing_003', 3, 'Pet Friendly'),
  ('listing_003', 4, 'Water Purifier'),
  ('listing_004', 1, 'Lift'),
  ('listing_004', 2, 'Gym'),
  ('listing_004', 3, 'Children''s Play Area'),
  ('listing_004', 4, 'Security'),
  ('listing_004', 5, 'Clubhouse'),
  ('listing_005', 1, 'Lift'),
  ('listing_005', 2, 'Security'),
  ('listing_006', 1, 'Managed Lobby'),
  ('listing_006', 2, 'Power Backup'),
  ('listing_007', 1, 'Lift'),
  ('listing_007', 2, 'Pet Area'),
  ('listing_007', 3, 'Power Backup'),
  ('owner_listing_2000', 1, 'Lift'),
  ('owner_listing_2000', 2, 'Power Backup'),
  ('owner_listing_2000', 3, 'Gated Community'),
  ('owner_listing_2001', 1, 'Gym'),
  ('owner_listing_2001', 2, 'Security'),
  ('owner_listing_2001', 3, 'Clubhouse');

INSERT INTO listing_photos (listing_id, sort_order, photo_url) VALUES
  ('listing_001', 1, 'https://images.example.com/listings/listing_001/cover.jpg'),
  ('listing_001', 2, 'https://images.example.com/listings/listing_001/living-room.jpg'),
  ('listing_001', 3, 'https://images.example.com/listings/listing_001/bedroom.jpg'),
  ('listing_003', 1, 'https://images.example.com/listings/listing_003/cover.jpg'),
  ('listing_003', 2, 'https://images.example.com/listings/listing_003/dining.jpg'),
  ('listing_004', 1, 'https://images.example.com/listings/listing_004/cover.jpg'),
  ('listing_004', 2, 'https://images.example.com/listings/listing_004/kitchen.jpg'),
  ('listing_007', 1, 'https://images.example.com/listings/listing_007/cover.jpg'),
  ('owner_listing_2000', 1, 'https://images.example.com/owners/owner_listing_2000/cover.jpg'),
  ('owner_listing_2000', 2, 'https://images.example.com/owners/owner_listing_2000/bedroom.jpg'),
  ('owner_listing_2001', 1, 'https://images.example.com/owners/owner_listing_2001/cover.jpg');

INSERT INTO listing_trust_badges (listing_id, sort_order, badge) VALUES
  ('listing_001', 1, 'No brokerage'),
  ('listing_001', 2, 'Digital agreement ready'),
  ('listing_001', 3, 'Owner background checked'),
  ('listing_003', 1, 'Pet friendly'),
  ('listing_003', 2, 'Trusted repeat owner'),
  ('listing_004', 1, 'Popular with families'),
  ('listing_004', 2, 'Flexible visit slots');

INSERT INTO property_reviews (review_id, listing_id, reviewer_name, rating, headline, comment, reviewer_type, created_at) VALUES
  ('review_9001', 'listing_001', 'Priya S.', 5, 'Very smooth visit experience', 'The owner was responsive and the listing matched the photos.', 'Tenant', DATE '2026-03-28'),
  ('review_9002', 'listing_001', 'Nikhil R.', 4, 'Good metro connectivity', 'Commute was easy and the building felt secure.', 'Tenant', DATE '2026-03-10'),
  ('review_9003', 'listing_001', 'Arjun M.', 5, 'Trustworthy listing', 'Verification details helped me shortlist this quickly.', 'Prospective Tenant', DATE '2026-02-14'),
  ('review_9101', 'listing_004', 'Sonal P.', 5, 'Great for families', 'Spacious layout and the play area was a big plus for us.', 'Tenant', DATE '2026-03-18'),
  ('review_9102', 'listing_004', 'Rahul T.', 4, 'Good visit scheduling support', 'The owner shared slots quickly and the area felt calm.', 'Prospective Tenant', DATE '2026-03-02'),
  ('review_9201', 'listing_003', 'Mira K.', 5, 'Peaceful neighborhood', 'The property was well kept and the owner answered everything clearly.', 'Tenant', DATE '2026-03-21');

INSERT INTO property_faq (listing_id, sort_order, question, answer) VALUES
  ('listing_001', 1, 'Is the property available for families?', 'Yes, the owner is open to family and working professional tenants.'),
  ('listing_001', 2, 'How far is the nearest metro station?', 'Indiranagar Metro is around a 7-minute walk from the building.'),
  ('listing_001', 3, 'Is brokerage applicable?', 'No, this listing is available without brokerage.'),
  ('listing_004', 1, 'Are school buses available nearby?', 'Yes, several major school routes pass through the Whitefield main road.'),
  ('listing_004', 2, 'Can weekend visits be scheduled?', 'Yes, weekend and evening visit slots are currently enabled.'),
  ('listing_003', 1, 'Are pets allowed?', 'Yes, small pets are allowed subject to society rules.'),
  ('listing_003', 2, 'Is the apartment ready to move in?', 'Yes, it is available for move-in from the listed available date.');

INSERT INTO saved_listings (user_id, listing_id, saved_at) VALUES
  ('user_1a2b3c4d', 'listing_001', TIMESTAMPTZ '2026-04-08T08:00:00Z'),
  ('user_1a2b3c4d', 'listing_003', TIMESTAMPTZ '2026-04-08T08:05:00Z'),
  ('user_1a2b3c4d', 'listing_004', TIMESTAMPTZ '2026-04-08T08:10:00Z'),
  ('user_1a2b3c4d', 'listing_007', TIMESTAMPTZ '2026-04-08T08:15:00Z');

INSERT INTO matches (user_id, listing_id, match_score, match_reason) VALUES
  ('user_1a2b3c4d', 'listing_001', 0.93, 'Matches your saved commute and family-friendly preferences'),
  ('user_1a2b3c4d', 'listing_007', 0.91, 'Strong fit for pet-friendly and tech-park commute filters'),
  ('user_1a2b3c4d', 'listing_004', 0.88, 'High match for larger household needs and visit intent'),
  ('user_1a2b3c4d', 'listing_003', 0.86, 'Aligns with trust-first shortlist behavior'),
  ('user_1a2b3c4d', 'listing_006', 0.81, 'Good fit for quick-move and business-district proximity');

INSERT INTO alerts (user_id, severity, summary, is_read, is_urgent, created_at) VALUES
  ('user_1a2b3c4d', 'INFO', 'New property matches are available', FALSE, FALSE, TIMESTAMPTZ '2026-04-09T05:00:00Z'),
  ('user_1a2b3c4d', 'INFO', 'Owner responded to your enquiry', FALSE, FALSE, TIMESTAMPTZ '2026-04-09T05:05:00Z'),
  ('user_1a2b3c4d', 'WARNING', 'Visit tomorrow needs confirmation', FALSE, TRUE, TIMESTAMPTZ '2026-04-09T05:10:00Z'),
  ('user_1a2b3c4d', 'WARNING', 'A saved property is in high demand', FALSE, TRUE, TIMESTAMPTZ '2026-04-09T05:12:00Z'),
  ('user_1a2b3c4d', 'INFO', 'New shortlist recommendations available', FALSE, FALSE, TIMESTAMPTZ '2026-04-09T05:15:00Z');

INSERT INTO visit_slots (listing_id, slot_id, slot_date, label, start_time, end_time, available) VALUES
  ('listing_001', 'slot_morning_1', DATE '2026-04-12', '10:00 AM - 10:30 AM', '10:00', '10:30', TRUE),
  ('listing_001', 'slot_noon_1', DATE '2026-04-12', '12:30 PM - 1:00 PM', '12:30', '13:00', TRUE),
  ('listing_001', 'slot_afternoon_1', DATE '2026-04-12', '2:30 PM - 3:00 PM', '14:30', '15:00', TRUE),
  ('listing_001', 'slot_evening_1', DATE '2026-04-12', '6:00 PM - 6:30 PM', '18:00', '18:30', TRUE),
  ('listing_004', 'slot_evening_1', DATE '2026-04-13', '6:00 PM - 6:30 PM', '18:00', '18:30', TRUE),
  ('listing_003', 'slot_afternoon_1', DATE '2026-04-07', '2:30 PM - 3:00 PM', '14:30', '15:00', TRUE);

INSERT INTO visit_rules (sort_order, rule_text) VALUES
  (1, 'Carry a valid government ID for gated communities.'),
  (2, 'Arrive within 10 minutes of the selected slot.'),
  (3, 'Rescheduling is allowed up to 2 hours before the visit.');

INSERT INTO visits (visit_id, user_id, listing_id, slot_id, slot_label, preferred_date, notes, status, scheduled_at) VALUES
  ('visit_1001', 'user_1a2b3c4d', 'listing_001', 'slot_morning_1', '10:00 AM - 10:30 AM', DATE '2026-04-12', 'Please call before arrival.', 'SCHEDULED', TIMESTAMPTZ '2026-04-12T04:30:00Z'),
  ('visit_1002', 'user_1a2b3c4d', 'listing_004', 'slot_evening_1', '6:00 PM - 6:30 PM', DATE '2026-04-13', 'Need parking guidance at the gate.', 'SCHEDULED', TIMESTAMPTZ '2026-04-13T12:30:00Z'),
  ('visit_1000', 'user_1a2b3c4d', 'listing_003', 'slot_afternoon_1', '2:30 PM - 3:00 PM', DATE '2026-04-07', 'Visited with spouse.', 'COMPLETED', TIMESTAMPTZ '2026-04-07T09:00:00Z');

INSERT INTO payment_records (
  payment_id, tenant_user_id, owner_user_id, listing_id, payment_kind, payment_label,
  provider, provider_order_id, provider_payment_id, provider_signature, receipt,
  amount, currency, status, due_date, description, notes, created_at, updated_at, paid_at
) VALUES
  ('payment_3000', 'user_1a2b3c4d', 'owner_101', 'listing_001', 'SECURITY_DEPOSIT', 'Security deposit',
   'MOCK', 'mock_order_payment_3000', 'mock_pay_payment_3000', 'mock_signature',
   'receipt_payment_3000', 96000, 'INR', 'CAPTURED', DATE '2026-04-10',
   'Security deposit for Sunny 2BHK near Indiranagar Metro', 'Paid during booking confirmation.',
   TIMESTAMPTZ '2026-04-09T09:00:00Z', TIMESTAMPTZ '2026-04-09T09:05:00Z', TIMESTAMPTZ '2026-04-09T09:05:00Z'),
  ('payment_3001', 'user_1a2b3c4d', 'owner_101', 'listing_001', 'MONTHLY_RENT', 'April 2026 rent',
   'MOCK', NULL, NULL, NULL,
   'receipt_payment_3001', 32000, 'INR', 'DUE', DATE '2026-04-18',
   'April 2026 rent for Sunny 2BHK near Indiranagar Metro', 'Due before move-in handover.',
   TIMESTAMPTZ '2026-04-10T07:30:00Z', TIMESTAMPTZ '2026-04-10T07:30:00Z', NULL),
  ('payment_3002', 'user_1a2b3c4d', 'owner_204', 'listing_004', 'BOOKING_TOKEN', 'Whitefield booking token',
   'MOCK', NULL, NULL, NULL,
   'receipt_payment_3002', 5000, 'INR', 'DUE', DATE '2026-04-20',
   'Booking token for Family-ready 3BHK close to Whitefield', 'Unlocks the next round of owner discussions.',
   TIMESTAMPTZ '2026-04-11T08:10:00Z', TIMESTAMPTZ '2026-04-11T08:10:00Z', NULL),
  ('payment_3003', 'user_1a2b3c4d', 'owner_188', 'listing_003', 'MONTHLY_RENT', 'March 2026 rent',
   'MOCK', 'mock_order_payment_3003', 'mock_pay_payment_3003', 'mock_signature',
   'receipt_payment_3003', 29000, 'INR', 'CAPTURED', DATE '2026-03-05',
   'March 2026 rent for Verified 2BHK in Koregaon Park', 'Captured through the local sandbox flow.',
   TIMESTAMPTZ '2026-03-03T10:00:00Z', TIMESTAMPTZ '2026-03-05T05:35:00Z', TIMESTAMPTZ '2026-03-05T05:35:00Z');

INSERT INTO wallet_accounts (
  wallet_id, user_id, balance, currency, created_at, updated_at
) VALUES
  ('wallet_seed_aarav', 'user_1a2b3c4d', 1200, 'INR', TIMESTAMPTZ '2026-04-01T08:00:00Z', TIMESTAMPTZ '2026-04-20T09:30:00Z'),
  ('wallet_seed_divya', 'user_7n6m5l4k', 650, 'INR', TIMESTAMPTZ '2026-04-05T08:00:00Z', TIMESTAMPTZ '2026-04-22T10:15:00Z');

INSERT INTO wallet_transactions (
  txn_id, wallet_id, user_id, txn_type, amount, currency, status, provider,
  provider_order_id, provider_payment_id, client_secret, description, created_at, completed_at
) VALUES
  ('wtxn_seed_aarav_001', 'wallet_seed_aarav', 'user_1a2b3c4d', 'TOPUP', 1200, 'INR', 'COMPLETED', 'SEEDED',
   'seed_order_aarav_001', 'seed_payment_aarav_001', NULL, 'Initial wallet balance for premium demo access.',
   TIMESTAMPTZ '2026-04-01T08:00:00Z', TIMESTAMPTZ '2026-04-01T08:00:00Z'),
  ('wtxn_seed_divya_001', 'wallet_seed_divya', 'user_7n6m5l4k', 'TOPUP', 650, 'INR', 'COMPLETED', 'SEEDED',
   'seed_order_divya_001', 'seed_payment_divya_001', NULL, 'Initial wallet balance for standard tenant upgrade testing.',
   TIMESTAMPTZ '2026-04-05T08:00:00Z', TIMESTAMPTZ '2026-04-05T08:00:00Z');

-- Free-trial limits. Adjust limit values via SQL UPDATE; no redeploy needed.
INSERT INTO feature_entitlements (feature_key, plan_tier, free_limit, description) VALUES
  ('OWNER_LISTING_POST',   'FREE',    3,    'Owner can publish 3 listings on free tier'),
  ('OWNER_LISTING_POST',   'PREMIUM', NULL, 'Owner premium: unlimited listings'),
  ('TENANT_PROPERTY_VIEW', 'FREE',    3,    'Tenant can view full details of 3 unique properties on free tier'),
  ('TENANT_PROPERTY_VIEW', 'PREMIUM', NULL, 'Tenant premium: unlimited property views')
ON CONFLICT (feature_key, plan_tier) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- Backfill user_roles from existing users.role
-- Every user starts with exactly the role they registered as. Adding a second
-- role (TENANT ↔ OWNER) is done at runtime via POST /api/v1/auth/roles/add.
-- Idempotent — re-running this block creates no duplicates.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO user_roles (user_id, role, granted_at)
SELECT user_id, role, COALESCE(updated_at, CURRENT_TIMESTAMP) FROM users
ON CONFLICT (user_id, role) DO NOTHING;

-- Tier 1: locality nickname → canonical mapping. Seeded once; admins can extend later.
INSERT INTO locality_aliases (alias, canonical, city) VALUES
  ('hsr', 'HSR Layout', 'Bengaluru'),
  ('btm', 'BTM Layout', 'Bengaluru'),
  ('koramangala 4th block', 'Koramangala', 'Bengaluru'),
  ('koramangala 5th block', 'Koramangala', 'Bengaluru'),
  ('koramangala 6th block', 'Koramangala', 'Bengaluru'),
  ('koramangala 7th block', 'Koramangala', 'Bengaluru'),
  ('indira nagar', 'Indiranagar', 'Bengaluru'),
  ('jp nagar', 'JP Nagar', 'Bengaluru'),
  ('mg road', 'MG Road', 'Bengaluru'),
  ('whitefield ecc', 'Whitefield', 'Bengaluru'),
  ('marathahalli bridge', 'Marathahalli', 'Bengaluru'),
  ('bandra w', 'Bandra West', NULL),
  ('bandra e', 'Bandra East', NULL),
  ('andheri w', 'Andheri West', NULL),
  ('andheri e', 'Andheri East', NULL),
  ('cp', 'Connaught Place', 'NCR-Delhi'),
  ('saket', 'Saket', 'NCR-Delhi'),
  ('hitec city', 'HITEC City', 'Hyderabad'),
  ('hi-tech city', 'HITEC City', 'Hyderabad'),
  ('jubilee hls', 'Jubilee Hills', 'Hyderabad'),
  ('omr', 'OMR', 'Chennai'),
  ('ecr', 'ECR', 'Chennai')
ON CONFLICT (alias) DO NOTHING;

-- Tier 1: bootstrap an admin if none exists. Default tester user_1a2b3c4d
-- is promoted only when there is no other ADMIN.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE role = 'ADMIN') THEN
    UPDATE users SET role = 'ADMIN' WHERE user_id = 'user_1a2b3c4d';
    INSERT INTO user_roles (user_id, role, granted_at)
    VALUES ('user_1a2b3c4d', 'ADMIN', CURRENT_TIMESTAMP)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;
