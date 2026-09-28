# 02 — Business Rules (source of truth)

If anything in code or prototypes disagrees with this file, this file wins. Put all numbers in `lib/config.ts`.

## Money

| Setting | Value | Config key |
|---|---|---|
| Booking deposit (paid online by guest) | **10%** of booking total | `DEPOSIT_RATE = 0.10` |
| Host commission (if a host is credited) | **6%** of booking total | `HOST_COMMISSION_RATE = 0.06` |
| HostSays share | **4%** of booking total (deposit minus host commission) | derived |
| No host credited | HostSays keeps the full 10% | derived |
| Currency | ZAR, stored as integer cents | — |

- The **booking total** = operator's listed price per person × number of people (or a fixed group price if the listing uses one).
- The deposit **counts toward the total**. The guest never pays more than the listed price.
- The guest pays the **balance (90%) directly to the operator**, on the day or however the operator normally takes payment. HostSays never handles the balance.
- Paystack fees are paid from HostSays's share.
- Rounding: compute deposit and commission in cents with `Math.round`. HostSays share = deposit − host commission (so the numbers always add up).
- The 6% is marketed as the **"Founding host rate"**. Store each host's rate on the host record (`commission_rate`, default 0.06) so it can change later per host.

**Example:** R2,000 booking → R200 deposit online → R120 to host, R80 to HostSays → R1,800 paid to operator on the day.

## Booking model
- **Request-to-book only** at launch. No instant booking.
- Guest sends a request (date, time slot, group size, contact details). **No payment at request time.**
- Operator must **accept or decline within 12 hours** (`CONFIRM_WINDOW_HOURS = 12`). A reminder email goes out before expiry. Unanswered requests expire automatically.
- If accepted, the guest has **24 hours to pay** the deposit (`PAYMENT_WINDOW_HOURS = 24`). If unpaid, the hold is released and the booking becomes `payment_expired`.
- Requests can't be made for the same day at launch; minimum date is tomorrow (`MIN_LEAD_DAYS = 1`). Confirm this with Josh if it needs changing.
- The operator has three choices: **Accept**, **Offer another time**, or **Decline**.
- **Offer another time:** the operator suggests 1–3 other dates/times (`MAX_ALTERNATIVES = 3`). The guest has 24 hours to pick one (`OFFER_WINDOW_HOURS = 24`). Picking one confirms the booking straight away (the operator already agreed), so the guest goes directly to paying the deposit. If none suit, the guest taps "None of these work" and is shown similar experiences. An offer counts as a response: **no strike**.
- **Decline** is for when there's nothing to offer (not operating, weather, other). The guest is shown similar experiences.

## How any operator works with HostSays
We never plug into how an operator runs their business. Whatever they use (WhatsApp, a diary, booking software), every operator only has to do three things with us:
1. **Answer requests:** Accept, Offer another time, or Decline. They check their own diary or system however they like.
2. **Treat our deposit as part-payment.** The guest pays 10% online to HostSays; the operator collects the 90% balance however they normally do (cash, card machine, EFT, their own payment link). We never handle the balance.
3. **Confirm the trip happened:** Done or No-show.

Operators agree to two rules in their terms (checkbox before going live):
- **Price parity:** the price on HostSays is the same as booking with them directly.
- **The deposit counts as paid:** they only collect the balance, never the full price again.

The operator's phone number and email are **never shown to guests before the deposit is paid**, so bookings can't be moved off the platform.

**One-tap links:** every email asking an operator to act (new request, reminders, weekly availability check, mark completed) contains private links that work **without signing in**. They open a short page with big buttons; the action only happens when a button is pressed (email scanners open links automatically, so a link alone must never change anything). Links expire (a request link at its reply deadline, others after 7 days).

## Availability
Guests can only request dates and times the operator has set up (weekly time slots with a capacity). A slot shows as full when confirmed + paid bookings reach its capacity. Operators keep this up to date in up to three ways:
1. **By hand (everyone):** one tap to close a day or a single time slot, or to change the spots left on a date. A **weekly email** (Monday morning) shows the coming week with one-tap "this day is full" links.
2. **Calendar sync (optional, recommended):**
   - **Import:** the operator pastes their calendar's private address (Google, Outlook or Apple Calendar all provide one). We check it every 15 minutes. Any event that overlaps a time slot closes that slot; an all-day event closes the whole day. A calendar can apply to all of an operator's experiences or to one.
   - **Export:** each operator gets a private calendar address listing their HostSays bookings, to add to their own calendar so they don't double-book elsewhere.
   - A calendar only says busy or free, not "3 spots left". That suits operators who run one trip at a time.
3. **Booking-system connection (later):** live spots left and instant booking through the open **OCTO** standard, built once rather than per system. Only once many operators use OCTO-compatible software.

No sync is perfect, so request-to-book and "Offer another time" stay as the safety net.

## Guests
- **Guests never need an account to book.** Each booking has a secret token; the guest manages it at `/b/[token]`, linked from every email.
- **Optional guest accounts** (decided with Josh): a guest can sign up (`/signup?as=guest`) to see their bookings in one place at `/account`. Bookings are linked to an account by its **confirmed** email address (once bookings are built). The token link keeps working either way.
- Guest provides: name, email, phone (WhatsApp number), group size, date, time slot, optional notes, and "Where are you staying?".

## Cancellations and no-shows

| Situation | Guest deposit | Host commission | HostSays share |
|---|---|---|---|
| Guest cancels **7+ days** before the experience date | Full refund | None | None |
| Guest cancels **within 7 days** | Kept (no refund) | Paid as normal | Kept |
| Guest **no-show** | Kept | Paid as normal | Kept |
| **Operator cancels** (any reason, including weather) | Full refund | None | None |
| Request declined or expired (before payment) | Nothing was paid | None | None |

- Config: `FREE_CANCELLATION_DAYS = 7`.
- The cancellation policy must be shown clearly **before payment**: *"Free cancellation up to 7 days before. Within 7 days, the deposit is non-refundable. If the operator cancels, you get a full refund."*
- Operators may state their own late-cancellation terms for the **balance** on their listing (free text field). HostSays doesn't enforce these.
- On operator cancellation, the guest is offered alternative experiences.

## Operator reliability
- Operator cancellations (not weather) and expired requests count as **strikes**.
- **3 strikes in 90 days** → admin is notified to review and may suspend the operator.
- Weather cancellations must include a reason and are not strikes.
- Track average response time per operator (used for ranking later).

## Sign-up
- Anyone can sign up at `/signup` as a **guest**, **host** or **operator** (email + password; they must confirm their email).
  - Host: name, property name, type, area, listing link (Booking.com/Airbnb/website), WhatsApp number.
  - Operator: name, business name, area, website (optional), WhatsApp number. Their email receives booking requests.
  - Everyone ticks the terms (operators: the operator terms). The time is stored.
- Nothing is created until the email is confirmed: the details wait in the auth user's metadata, then become the profile and a **pending** host or operator (`public.complete_signup`).
- **Admin verifies** hosts and operators at `/admin` (Verify / Reject). Pending and rejected ones never appear on the site. Pending operators can sign in and prepare listings; listings still need approval.

## Hosts
- Any accommodation type can join: guesthouse, B&B, self-catering, Airbnb host, hotel, lodge.
- **Verification:** host applies with a link to their Booking.com, Airbnb or own website listing, plus contact details. Admin checks it's real and approves. Only **verified** hosts can recommend experiences, have a public storefront, or earn commission.
- **Hotels and larger properties** can have **multiple staff logins** on one host account.
- Hosts **cannot** recommend experiences they own or run.
- Every recommendation needs a **tip** (max 200 characters).
- Host commission is earned on **any** booking credited to them — not only experiences they recommend.

## Host attribution (summary — full detail in `07-host-attribution.md`)
- Visiting a host storefront or a link with `?ref=[host-slug]` remembers that host **for the current browser session**.
- The "Where are you staying?" field is **pre-filled** with that host on every booking form. The guest **can change it**.
- **Whichever host is selected at the time of booking gets the commission.** "Somewhere else / not listed" = no host credited.

## Payouts
- **Monthly** by EFT. Commission is payable for bookings whose experience date fell in the previous month and whose status is `completed`, `no_show`, or `cancelled_guest_late`.
- Paid in the **first week** of the following month. Hosts get a monthly statement (email + portal).
- Admin exports a CSV for the bank payment, then marks the payout as paid.
- Hosts must add and confirm banking details before their first payout.

## Operators and listings
- Operators create their own listings; **admin approves** before they go live. Edits to live listings also need approval (except availability changes).
- **Admin can edit any host, operator or listing directly, at any status.** Admin edits to live listings show straight away (no approval step). Login emails and passwords stay with the account holder.
- **Admin can delete a host, operator or listing** after a confirm. Anything with bookings, payouts, reviews or strikes can't be deleted (money and history records); suspend or pause it instead. Deleting a host or operator also deletes the sign-in accounts that belong only to it.
- **Admin can create an operator and its listings on the operator's behalf.** The operator can later claim the account by email invite and take over editing.
- Operators sign up to the commission terms (checkbox + timestamp) before going live.

## Reviews
- Collected from guests after a booking is `completed`.
- Shown publicly on an experience only once it has **3 or more reviews** (`MIN_REVIEWS_TO_SHOW = 3`).
- One review per booking.

## Notifications
- **Email only** at launch (Resend). WhatsApp alerts come after launch (decided with Josh), using the same one-tap links.
- No "I'm flexible" option on the request form (decided with Josh). Guests pick one date and time; "Offer another time" covers clashes.
- Full list in `08-emails.md`.

## Legal and trust
- Show on the site: "Hosts earn a commission when you book through them."
- HostSays is a **booking intermediary**, not the activity provider. Terms must say so.
- POPIA: collect only needed guest data, show a privacy notice, and allow deletion requests.
- Terms of service, operator agreement, privacy policy and cancellation policy pages are required before real payments (placeholders are fine in development).
