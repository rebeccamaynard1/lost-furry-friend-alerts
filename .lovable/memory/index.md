Fur Babies Lost & Found USA - pet recovery app. Little Foot photo is the logo.

## Design System
- Fonts: Nunito (headings), Quicksand (body)
- Colors: soft blue primary (199 78% 48%), accent orange (30 90% 55%)
- Status colors: --lost (red), --found (green), --sighting (orange), --shelter (purple)
- All colors in HSL, use semantic tokens only

## Stripe
- Premium subscription: $4.99/month (price ID needs to be created - key lacks product_write permission)
- Donations: variable amount via price_data
- Edge functions: create-checkout, check-subscription, create-donation

## Auth
- Email/password auth, email verification required (NOT auto-confirmed)
- AuthProvider wraps app, provides user/isPremium/subscriptionEnd

## Edge Functions
- process-alerts: sends notifications on lost/found reports
- match-sighting: auto-attaches sightings to nearest lost pet within 2mi
- mark-reunited: marks pet reunited + notifies contributors
- generate-flyer: generates HTML flyer for lost pets with QR code

## Database
- Tables: profiles, lost_pets, found_pets, sightings, messages, shelters, volunteers, rural_partners, sponsors, user_roles, notifications, donations
- lost_pets has boosted/boosted_at columns
- profiles has alert_radius_miles, state columns
- pet-photos storage bucket (public) for all uploads

## Components
- PhotoUpload: reusable photo upload to pet-photos bucket
- SpotlightSection: weekly rotating featured pets/shelters/volunteers
- MemorialFooter: "In Loving Memory of Little Foot" on all pages
- GlobalSearch: search across lost_pets, found_pets, shelters
- NotificationBell: real-time notification dropdown

## Pages
- Home, ReportLost, ReportFound, Map, Sightings, Messages, MyPets
- Shelters, Volunteers, RuralPartners, Sponsors, Donate, Premium
- Admin, Login, Signup, PaymentSuccess, Help, NotificationSettings
