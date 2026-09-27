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
    └─guest cancels─────────────────────────────────────────────▶ cancelled_by_guest_request
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
- **Accept:** check capacity (confirmed + paid people for that date/slot + this booking ≤ capacity). Status `confirmed`, `pay_by = now() + 24h`. Email guest with pay link.
- **Decline:** reason required (dropdown: fully booked, weather, not operating, other) + optional alternative date. Email guest with alternatives.

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

## Scheduled jobs (Vercel Cron → `/api/cron/*`, protected by `CRON_SECRET`)
| Job | Frequency | Does |
|---|---|---|
| `expire-requests` | every 15 min | `requested` past `respond_by` → `expired`, strike, email guest alternatives |
| `request-reminders` | every 15 min | Email operator when 3h left to respond |
| `expire-payments` | every 15 min | `confirmed` past `pay_by` → `payment_expired`, email guest |
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
