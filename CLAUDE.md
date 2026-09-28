# CLAUDE.md — HostSays

You are building **HostSays** (hostsays.com): a marketplace where travellers discover and book tourism experiences (safaris, ocean trips, adventures) recommended by local accommodation hosts. Hosts earn commission when their guests book.

**Read these before writing any code, in this order:**
1. `docs/01-concept.md` — what we're building and why
2. `docs/02-business-rules.md` — money, booking, cancellation and attribution rules (source of truth)
3. `docs/03-site-structure.md` — every page and URL
4. `docs/04-design-system.md` — visual design, taken from the approved homepage
5. `docs/05-data-model.md` — database schema and security
6. `docs/06-booking-flow.md` — booking state machine and payments
7. `docs/07-host-attribution.md` — how host referrals are tracked
8. `docs/08-emails.md` — transactional emails
9. `docs/09-build-plan.md` — build order and checklists. **Work through this phase by phase.**
10. `docs/10-open-questions.md` — undecided items. Don't invent answers; ask Josh.

## Stack (decided)
- **Next.js** (App Router, TypeScript, server components by default)
- **Supabase**: Postgres, Auth, Storage, Row Level Security
- **Paystack**: 10% booking deposits, refunds, webhooks (ZAR)
- **Resend** + React Email for transactional emails
- **Tailwind CSS** with the CSS variables from `docs/04-design-system.md`
- **Render** for hosting (Web Service, Frankfurt, `render.yaml`), a Render Cron Job for scheduled jobs
- **Zod** for validating every form and API input

## Reference material
- `reference/homepage-prototype.html` — the approved homepage. **Match this design exactly** when building the real homepage. Open it in a browser.
- `reference/homepage-prototype-template.html` — same page with readable image placeholders (`__HERO__` etc.)
- `reference/mockups/homepage-mockup.png` — the original design mockup
- `reference/booking-flow-prototype-v1.html` — early prototype of the booking loop (request → confirm → pay → complete). Use it for flow logic only, **not** styling. Note: it uses old numbers (15% deposit, 5% host); the correct numbers are in `docs/02-business-rules.md`.
- `reference/assets/` — placeholder photos cropped from the mockup. Use them for seed data only; they will be replaced with real photos.

## Rules for working on this project
- `docs/02-business-rules.md` wins over anything else, including the prototypes.
- All money is stored as **integer cents (ZAR)**. Never use floats for money.
- All percentages come from one config file (`lib/config.ts`), never hard-coded in components.
- Every table has RLS enabled. Service-role key is used **only** in server code (webhooks, cron, admin actions).
- Never trust the client for prices, deposits, commission or booking status. Compute them on the server.
- Guests have **no accounts**. Guest booking pages are accessed by an unguessable token.
- Keep copy warm, local and plain. South African English spelling (colour, favourite, organise).
- Mobile-first. Most guests will book on their phones.
- After finishing each phase in `docs/09-build-plan.md`, tick its checklist and summarise what changed.
- If a decision isn't covered in the docs, stop and ask rather than guessing.

## Commands
- `npm run dev` — local dev server (http://localhost:3000)
- `npm run build` — production build
- `npm run lint` / `npm run typecheck`
- `npm run db:start` / `npm run db:stop` — local Supabase (needs Docker)
- `npm run db:reset` — reapply migrations + `supabase/seed.sql` (local only)
- `npm run db:push` — apply new migrations to the linked hosted project
- `npm run db:types` — regenerate `lib/supabase/database.types.ts` from the linked project (run after every migration)
- `npm run db:seed` — load/refresh demo data, photos and the admin user (`scripts/seed.mts`, safe to re-run)
- `npm run db:test` — RLS and integrity checks against the linked project (`supabase/tests/`, rolled back)
- Hosted project: `hostsays` (ref `dbcvagwmyofmlricojdb`, West EU). It's under a separate Supabase account from the claude.ai connector, so use the CLI (already logged in and linked), not the connector.

## Next.js 16 notes
- This is Next.js 16: middleware is now `proxy.ts` (same API, exported `proxy` function). Read `AGENTS.md` and the bundled docs in `node_modules/next/dist/docs/` before using unfamiliar APIs.
- Tailwind v4: tokens are mapped in `app/globals.css` (`@theme inline`), not a `tailwind.config` file. Breakpoints match the prototype: `sm` 620px, `md` 980px, `lg` 1180px.
