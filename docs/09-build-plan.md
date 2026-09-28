# 09 — Build Plan

Work through phases in order. Tick items as you go (`- [x]`). After each phase: run lint, typecheck and build, and summarise changes.

## Phase 0 — Setup
- [x] Scaffold Next.js (App Router, TypeScript, ESLint, Tailwind, `src/` optional)
- [x] Add Supabase (`@supabase/ssr`), Zod, Resend, React Email, Lucide icons
- [x] `lib/config.ts` with every constant from `02-business-rules.md`
- [x] Design tokens and fonts from `04-design-system.md` (CSS variables + Tailwind theme, Manrope + Playfair Display via `next/font`)
- [x] Supabase set up; `.env.local` from `.env.example` — linked to hosted project `hostsays` (`dbcvagwmyofmlricojdb`, eu-west-1) via the CLI. Local Docker stack optional for later.
- [x] Basic layout: header, footer, "Staying at" pill slot

## Phase 1 — Database
- [x] Migrations for all enums and tables in `05-data-model.md`
- [x] RLS policies for every table
- [x] Views: `experience_cards`, `host_storefront`, `host_cards`, host-safe bookings (`host_bookings()` function)
- [x] Seed data (areas, demo operators/experiences/hosts/recommendations, admin user) using `reference/assets/` images uploaded to Storage — `npm run db:seed`
- [x] Typed Supabase client (`supabase gen types`) — `npm run db:types` → `lib/supabase/database.types.ts`

## Phase 2 — Public site
- [x] Homepage matching `reference/homepage-prototype.html` (pixel-close on desktop and mobile), data from DB
- [x] `/explore` with filters and sorting
- [x] `/[slug]` resolver: area page or host storefront (+ reserved slugs)
- [x] `/[area]/[category]` pages
- [x] `/x/[slug]` experience page (without booking submit yet)
- [x] `/o/[slug]` operator page
- [x] `/hosts` and `/areas` directory pages
- [x] Static pages: how-it-works, for-hosts, for-operators, about, help, legal placeholders
- [x] SEO: metadata, sitemap, robots, JSON-LD, OG images

## Phase 3 — Host attribution
- [ ] Middleware sets `hs_host` session cookie from storefronts and `?ref=`
- [ ] "Staying at" header pill with clear
- [ ] Storefront visit counter
- [ ] Booking form host select, pre-filled and changeable

## Phase 4 — Booking engine
- [ ] `lib/bookings/pricing.ts` (pure functions + unit tests for deposit/commission/rounding) — _functions written (used by the booking panel preview); no test runner or tests yet._
- [ ] `lib/bookings/transitions.ts` (whitelisted state machine + tests)
- [ ] Migration for offers and availability (see note in `05-data-model.md`): `offered`/`offer_expired`, `booking_offers`, `slot_overrides`, `operator_calendars`, `calendar_busy`, `calendar_feed_token`
- [ ] `lib/bookings/availability.ts`: one function deciding if a date + slot is requestable (slots, blackouts, overrides, calendar busy, capacity) + tests
- [ ] `createBookingRequest` server action with validation, availability checks, rate limiting
- [ ] Guest page `/b/[token]` for every status, including picking an offered time
- [ ] Paystack initialize, webhook (signature + amount verification, idempotent), verify fallback
- [ ] Guest cancellation with correct refund logic; Paystack refunds + refund webhook
- [ ] Emails for all guest events (`08-emails.md`)

## Phase 5 — Operator portal
- [ ] Auth (login, invites, roles), route protection — _started early: `/login` (password or emailed link), `/auth/callback`, sign-out, role guards and placeholder `/admin`, `/host`, `/operator` pages; `/signup` for guests, hosts and operators. Invites still to do._
- [ ] Requests: accept / offer another time / decline with countdown
- [ ] One-tap links `/r/[token]` (signed, expiring, GET shows, POST acts) for requests, weekly availability and mark completed
- [ ] Bookings: complete, no-show, cancel (weather flag)
- [ ] Experiences CRUD with photo upload → submit for approval; live edits go to `pending_changes` — _done except live edits: details and photos of live/in-review listings are locked ("email us") until `pending_changes` is built._
- [ ] Availability: weekly slots, capacity, blackouts, close a slot / change spots left on a date — _weekly times and closed dates done (on each experience); per-date slot overrides need the Phase 4 migration._
- [ ] Calendar import (safe .ics fetch) and private calendar export feed
- [ ] Statements
- [x] Operator terms acceptance (at sign-up; shown in settings)
- [ ] Operator emails

## Phase 6 — Host portal
- [x] Apply form → pending application (done as `/signup?as=host`, with operators and optional guest accounts)
- [ ] Dashboard stats — _visits, picks and commission rate shown; booking numbers arrive with bookings._
- [x] Picks: recommend, tip (≤200 chars), reorder, remove
- [x] Storefront settings + preview (photo, welcome note, link to the live page)
- [ ] Share tools: link, QR PNG, printable A5/A6 room card, welcome text — _link, QR (SVG + PNG download) and welcome text done; room card still to do._
- [ ] Earnings table + statements
- [ ] Team (staff invites) and banking details — _banking details done; team invites still to do._
- [ ] Host emails

## Phase 7 — Admin
- [ ] Approvals (hosts, operators, listings, listing edits) — _hosts, operators and new listings done at `/admin/approvals` (listing review page at `/admin/experiences/[id]`); live listing edits still to do._
- [ ] Create operator + experiences on behalf; send claim invite
- [ ] Bookings search + manual status override + refunds
- [ ] Hosts: verify, suspend, commission rate — _verify/suspend done; commission rate edit still to do._
- [ ] Recommendations moderation
- [ ] Content: areas, categories, homepage featured items
- [ ] Payouts: monthly draft, CSV export, mark paid, statements

## Phase 8 — Scheduled jobs
- [ ] All cron jobs in `06-booking-flow.md` (incl. `expire-offers`, `sync-calendars`, `weekly-availability`), protected with `CRON_SECRET`, idempotent
- [ ] Supabase Cron schedule (pg_cron + pg_net, every 15 min) calling `/api/cron/*` with `CRON_SECRET` from Supabase Vault

## Phase 9 — Reviews
- [ ] Review form from completed bookings
- [ ] Show on experience pages once 3+ reviews; ratings on cards
- [ ] Admin hide

## Phase 10 — Launch readiness
- [ ] Real legal pages (terms, operator agreement, privacy/POPIA, cancellation policy)
- [ ] Paystack live keys, webhook URL registered, test a real R10 payment and refund
- [x] Resend domain verified (SPF/DKIM) — hostsays.com verified; Supabase auth emails go through Resend SMTP
- [ ] Error monitoring (e.g. Sentry) and basic analytics
- [ ] Replace placeholder photos and demo operators with real, approved content
- [ ] Mobile QA on real phones; accessibility check
- [ ] Soft launch with first hosts and operators

## Later (not now)
- WhatsApp notifications
- Instant booking for fixed-slot experiences
- Operator booking-system integrations (e.g. Bókun, Rezdy, FareHarbor) via the open **OCTO** standard: build once, not per system. Gives live spots left and instant booking. Only when enough operators use OCTO-compatible software.
- Packages/bundles, featured placements (clearly labelled), tiered host commission
- Afrikaans/German languages, mobile app
