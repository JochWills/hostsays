# 06 — Booking Flow and Payments

## State machine
```
requested ──accept──▶ confirmed ──pay──▶ paid ──mark completed──▶ completed
    │                    │                 │ └─mark no-show──────▶ no_show
    │                    │                 ├─guest cancels ≥7d──▶ cancelled_guest_refunded
    │                    │                 ├─guest cancels <7d──▶ cancelled_guest_late
    │                    │                 └─operator cancels───▶ cancelled_by_operator
    │                    ├─24h unpaid───────────────────────────▶ payment_expired
    │                    └─guest cancels────────────────────────▶ cancelled_by_guest_request
    ├─decline───────────────────────────────────────────────────▶ declined
    ├─12h no response───────────────────────────────────────────▶ expired
    ├─guest cancels─────────────────────────────────────────────▶ cancelled_by_guest_request
    └─offer another time──▶ offered ──guest picks an option──▶ confirmed (same path as above)
                              ├─"none of these work"─────────────▶ cancelled_by_guest_request
                              └─24h no pick─────────────────────▶ offer_expired
```
Implement transitions in one module (`lib/bookings/transitions.ts`) with a whitelist. Any other transition throws. Each transition: updates status + timestamp, sets commission status, sends emails, logs strikes where relevant.

## 1. Request (guest)
Server action `createBookingRequest`:
1. Validate input with Zod (date ≥ tomorrow, not a blackout, slot exists for that weekday, people within min/max).
2. Load experience price **from the database**. Compute:
   - `total = unit_price × people` (or group price)
   - `deposit = round(total × DEPOSIT_RATE)`
   - if host selected and verified: `host_commission = round(total × host.commission_rate)`, else 0
   - `platform = deposit − host_commission`
   - `balance = total − deposit`
3. Resolve host: use the submitted `host_id` (from the "Where are you staying?" field). Store `attribution` = `storefront` / `ref_link` if it matches the session host, `selected` if chosen manually, `none` if "Somewhere else".
4. Generate `reference` (e.g. `HS-` + 5 chars, no ambiguous letters) and `token` (crypto random, 32 bytes).
5. `respond_by = now() + 12h`. Status `requested`.
6. Emails: guest "Request received" (link to `/b/[token]`), operator "New booking request" (link to `/operator/requests`).
7. Redirect guest to `/b/[token]`.

Rate-limit requests per IP/email to prevent spam.

## 2. Operator responds
The operator answers from `/operator/requests` or from the one-tap link in the request email (see **One-tap links** below).

- **Accept:** check capacity (confirmed + paid people for that date/slot + this booking ≤ capacity) and that the slot isn't closed (blackout, override or calendar sync). Status `confirmed`, `pay_by = now() + 24h`. Email guest with pay link.
- **Offer another time:** operator picks 1–`MAX_ALTERNATIVES` dates/slots from their own available slots (same rules as a guest request: ≥ tomorrow, slot exists, not closed, capacity for this group). Save them in `booking_offers`, status `offered`, `offer_expires_at = now() + OFFER_WINDOW_HOURS`. Email guest "[Operator] can't do [date], but can do…" with one button per option. Counts as a response: **no strike**.
  - **Guest picks an option** (`/b/[token]`): re-check capacity for that option (show it as unavailable if it has filled since). Move the booking's `date`/`start_time` to the option (the original stays in `requested_date`/`requested_start_time`). Money doesn't change: the price is per experience. Status `confirmed`, `pay_by = now() + 24h`, same emails as Accept.
  - **"None of these work":** `cancelled_by_guest_request`, show 3 similar experiences.
  - **No pick in time:** `offer_expired` (cron), email guest similar experiences. No strike.
- **Decline:** reason required (dropdown: fully booked with nothing else free, not operating, weather, other). No date to suggest: that's what "Offer another time" is for. Email guest with 3 similar experiences.

### One-tap links (no sign-in)
Operators often live in WhatsApp, not a dashboard, so every operator email that asks for an action carries private links that work without signing in.
- Link = `/r/[token]`, where the token is an HMAC-SHA256-signed payload (`operator_id`, `booking_id` or scope, purpose, expiry) using `ACTION_LINK_SECRET`. Verify signature and expiry on the server; never trust anything else in the URL.
- **GET only shows a page** (request summary + big Accept / Offer another time / Decline buttons, or the week's availability). **Only a POST changes anything**, because email scanners open links automatically.
- Request links expire at `respond_by` (or once answered); other links after `ACTION_LINK_DAYS`. Actions go through the same transition whitelist, so a repeated tap is harmless.
- Signed-in operators get the same actions in the portal.

## Availability (what guests can request)
A date + slot is **requestable** when all of these hold:
1. The experience has an `experience_slots` row for that weekday and start time.
2. The date is ≥ tomorrow (`MIN_LEAD_DAYS`) and not in `experience_blackouts` (whole day closed).
3. No `slot_overrides` row sets capacity 0 for that date + slot. An override with a number replaces the weekly capacity for that date ("2 spots left").
4. No `calendar_busy` event overlaps `[start_time, start_time + duration_minutes)` on that date (all-day events block the whole day).
5. Confirmed + paid people for that date + slot + this group ≤ capacity.

Show unavailable slots as "Full" rather than hiding them, so guests understand why.

**Calendar import** (`operator_calendars`): the operator pastes a private iCal (.ics) address from Google, Outlook or Apple Calendar, for all experiences or one. `sync-calendars` fetches it every 15 minutes and replaces that calendar's `calendar_busy` rows for the next 12 months. Only event times are stored, never titles or descriptions (they may hold other people's details). Fetch safely: `https` only, block private/internal IP addresses (resolve the host first), 10 s timeout, 5 MB limit, no redirects to other hosts. After 3 failures in a row, email the operator and show a warning in the portal; keep the last good data.

**Calendar export:** `GET /api/calendar/[feed_token].ics` lists the operator's `confirmed` and `paid` bookings (`requested`/`offered` as tentative) for the next 12 months: experience, time, reference, guest first name, group size, balance to collect. No guest phone or email. `feed_token` is random per operator and can be regenerated from the portal (old address stops working).

## 3. Guest pays deposit (Paystack)
1. `/b/[token]/pay` (server): check status is `confirmed` and `pay_by` not passed.
2. Call Paystack **Initialize Transaction**: amount in kobo-equivalent cents (`deposit_cents`), currency `ZAR`, `email = guest_email`, `reference` = unique payment ref, `callback_url = /b/[token]?paid=1`, `metadata = { booking_id, booking_reference }`.
3. Create a `payments` row with status `initialized`. Redirect to Paystack `authorization_url`.
4. **Webhook** `POST /api/paystack/webhook`:
   - Verify the `x-paystack-signature` header (HMAC SHA512 of raw body with secret key). Reject if invalid.
   - On `charge.success`: find payment by reference, **verify amount and currency match**, mark payment `success`, set booking `paid`, `paid_at`, `host_commission_status = 'pending'`. Idempotent (ignore duplicates).
   - Emails: guest voucher, operator "Booking paid", host "New booking from your guest" (if credited).
5. The callback page should also call Paystack **Verify Transaction** as a fallback, but the webhook is the source of truth.
6. If a payment succeeds after `pay_by` passed (edge case), keep the booking if capacity allows; otherwise refund automatically and notify admin.

## 4. Cancellations and refunds
| Action | Who | Condition | Result |
|---|---|---|---|
| Cancel request | Guest | `requested` or `confirmed` | `cancelled_by_guest_request`, nothing to refund |
| Cancel booking | Guest | `paid`, experience date ≥ 7 days away | Paystack refund of full deposit → `cancelled_guest_refunded`, commission `void` |
| Cancel booking | Guest | `paid`, < 7 days away | No refund → `cancelled_guest_late`, commission `payable` after the experience date |
| Cancel trip | Operator | `paid` | Full refund → `cancelled_by_operator`, commission `void`; strike unless weather |

- Refunds use the Paystack **Refund** API with the transaction reference. Mark payment `refund_pending`, then `refunded` via the `refund.processed` webhook.
- "7 days away" = experience date minus today in Africa/Johannesburg time ≥ 7 days.
- Always show the guest exactly what will happen **before** they confirm a cancellation.

## 5. After the experience
- Operator marks `completed` or `no_show` (only on/after the experience date).
- `completed` → commission `payable`, review request email to guest.
- `no_show` → commission `payable`, no review request.
- If the operator doesn't mark it within 3 days after the date, send a reminder; after 7 days, auto-complete (flag for admin).

## Scheduled jobs (Supabase Cron → `/api/cron/*`, protected by `CRON_SECRET`)
One Supabase Cron job (pg_cron + pg_net, secret kept in Supabase Vault) runs every 15 minutes and calls the app's cron endpoints with `Authorization: Bearer $CRON_SECRET`. Daily and monthly jobs check the time (Africa/Johannesburg) themselves and must be idempotent, so a missed or repeated run is harmless. On Render's free plan the first call may wake the site, so allow a long timeout.

| Job | Frequency | Does |
|---|---|---|
| `expire-requests` | every 15 min | `requested` past `respond_by` → `expired`, strike, email guest alternatives |
| `request-reminders` | every 15 min | Email operator when 3h left to respond |
| `expire-payments` | every 15 min | `confirmed` past `pay_by` → `payment_expired`, email guest |
| `expire-offers` | every 15 min | `offered` past `offer_expires_at` → `offer_expired`, email guest alternatives |
| `sync-calendars` | every 15 min | Fetch each operator's imported calendar, refresh `calendar_busy` (see Availability) |
| `weekly-availability` | Mondays 07:00 SAST | Email each operator their coming week with one-tap "this day is full" links |
| `payment-reminders` | hourly | Email guest when 6h left to pay |
| `day-before` | daily 08:00 SAST | Reminders to guests and operators for tomorrow's bookings |
| `completion-reminders` | daily | Operators with unmarked past bookings; auto-complete after 7 days |
| `late-cancel-commission` | daily | `cancelled_guest_late` whose date has passed → commission `payable` |
| `strike-check` | daily | Operators with 3+ strikes in 90 days → email admin |
| `monthly-payouts` | 1st of month 06:00 SAST | Draft payouts for previous month, email admin |

## Payouts (admin)
1. Draft: for each host, sum `host_commission_cents` of bookings with commission `payable` whose date is in the previous month.
2. Admin reviews at `/admin/payouts`, exports CSV (host name, bank details, amount, reference).
3. Admin pays by EFT, marks payout `paid` → bookings' commission `paid`, statement email to host.
4. Hosts without confirmed bank details are skipped and reminded.
