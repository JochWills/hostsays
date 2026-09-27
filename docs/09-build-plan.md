# 09 — Build Plan

Work through phases in order. Tick items as you go (`- [x]`). After each phase: run lint, typecheck and build, and summarise changes.

## Phase 0 — Setup
- [ ] Scaffold Next.js (App Router, TypeScript, ESLint, Tailwind, `src/` optional)
- [ ] Add Supabase (`@supabase/ssr`), Zod, Resend, React Email, Lucide icons
- [ ] `lib/config.ts` with every constant from `02-business-rules.md`
- [ ] Design tokens and fonts from `04-design-system.md` (CSS variables + Tailwind theme, Manrope + Playfair Display via `next/font`)
- [ ] Supabase local dev set up; `.env.local` from `.env.example`
- [ ] Basic layout: header, footer, "Staying at" pill slot

## Phase 1 — Database
- [ ] Migrations for all enums and tables in `05-data-model.md`
- [ ] RLS policies for every table
- [ ] Views: `experience_cards`, `host_storefront`, host-safe booking view
- [ ] Seed data (areas, demo operators/experiences/hosts/recommendations, admin user) using `reference/assets/` images uploaded to Storage
- [ ] Typed Supabase client (`supabase gen types`)

## Phase 2 — Public site
- [ ] Homepage matching `reference/homepage-prototype.html` (pixel-close on desktop and mobile), data from DB
- [ ] `/explore` with filters and sorting
- [ ] `/[slug]` resolver: area page or host storefront (+ reserved slugs)
- [ ] `/[area]/[category]` pages
- [ ] `/x/[slug]` experience page (without booking submit yet)
- [ ] `/o/[slug]` operator page
- [ ] Static pages: how-it-works, hosts, operators, about, help, legal placeholders
- [ ] SEO: metadata, sitemap, robots, JSON-LD, OG images

## Phase 3 — Host attribution
- [ ] Middleware sets `hs_host` session cookie from storefronts and `?ref=`
- [ ] "Staying at" header pill with clear
- [ ] Storefront visit counter
- [ ] Booking form host select, pre-filled and changeable

## Phase 4 — Booking engine
- [ ] `lib/bookings/pricing.ts` (pure functions + unit tests for deposit/commission/rounding)
- [ ] `lib/bookings/transitions.ts` (whitelisted state machine + tests)
- [ ] `createBookingRequest` server action with validation, capacity/blackout checks, rate limiting
- [ ] Guest page `/b/[token]` for every status
- [ ] Paystack initialize, webhook (signature + amount verification, idempotent), verify fallback
- [ ] Guest cancellation with correct refund logic; Paystack refunds + refund webhook
- [ ] Emails for all guest events (`08-emails.md`)

## Phase 5 — Operator portal
- [ ] Auth (login, invites, roles), route protection
- [ ] Requests: accept/decline with countdown
- [ ] Bookings: complete, no-show, cancel (weather flag)
- [ ] Experiences CRUD with photo upload → submit for approval; live edits go to `pending_changes`
- [ ] Availability: weekly slots, capacity, blackouts
- [ ] Statements
- [ ] Operator terms acceptance
- [ ] Operator emails

## Phase 6 — Host portal
- [ ] Apply form (`/hosts`) → pending application
- [ ] Dashboard stats
- [ ] Picks: recommend, tip (≤200 chars), reorder, remove
- [ ] Storefront settings + preview
- [ ] Share tools: link, QR PNG, printable A5/A6 room card, welcome text
- [ ] Earnings table + statements
- [ ] Team (staff invites) and banking details
- [ ] Host emails

## Phase 7 — Admin
- [ ] Approvals (hosts, operators, listings, listing edits)
- [ ] Create operator + experiences on behalf; send claim invite
- [ ] Bookings search + manual status override + refunds
- [ ] Hosts: verify, suspend, commission rate
- [ ] Recommendations moderation
- [ ] Content: areas, categories, homepage featured items
- [ ] Payouts: monthly draft, CSV export, mark paid, statements

## Phase 8 — Scheduled jobs
- [ ] All cron jobs in `06-booking-flow.md`, protected with `CRON_SECRET`, idempotent
- [ ] Vercel cron config

## Phase 9 — Reviews
- [ ] Review form from completed bookings
- [ ] Show on experience pages once 3+ reviews; ratings on cards
- [ ] Admin hide

## Phase 10 — Launch readiness
- [ ] Real legal pages (terms, operator agreement, privacy/POPIA, cancellation policy)
- [ ] Paystack live keys, webhook URL registered, test a real R10 payment and refund
- [ ] Resend domain verified (SPF/DKIM)
- [ ] Error monitoring (e.g. Sentry) and basic analytics
- [ ] Replace placeholder photos and demo operators with real, approved content
- [ ] Mobile QA on real phones; accessibility check
- [ ] Soft launch with first hosts and operators

## Later (not now)
- WhatsApp notifications
- Instant booking for fixed-slot experiences
- Operator booking-system integrations (e.g. Bókun, Rezdy, FareHarbor)
- Packages/bundles, featured placements (clearly labelled), tiered host commission
- Afrikaans/German languages, mobile app
