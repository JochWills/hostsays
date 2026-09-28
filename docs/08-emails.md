# 08 — Transactional Emails

Email only at launch (WhatsApp later, with the same one-tap links), sent with **Resend** using **React Email** templates in `emails/`. From: `HostSays <bookings@hostsays.com>`. Reply-to: support address.

Every guest email links to `/b/[token]`. Keep them short, warm and mobile-friendly, in the site's colours (green buttons, off-white background).

## Guest
| Trigger | Subject | Key content |
|---|---|---|
| Request created | Request sent: [Experience] on [date] | "No payment yet. [Operator] will confirm by [time]." |
| Confirmed | Confirmed! Pay your deposit to lock it in | Deposit amount, pay-by time, policy summary, **Pay deposit** button |
| 6h left to pay | Your spot is held until [time] | Pay button |
| Paid | You're booked: [Experience] — [ref] | Voucher: date/time, meeting point + map link, what to bring, **balance due on the day R[x]**, operator contact, cancellation policy |
| Other times offered | [Operator] can't do [date], but can do these | One button per option, pick-by time, "None of these work" |
| Offer expired | Your offered times have lapsed | Link to request again, 3 similar experiences |
| Declined | [Operator] can't take this booking | Reason, 3 similar experiences |
| Expired (no reply) | Sorry, [Operator] didn't respond in time | Alternatives |
| Payment expired | Your hold has expired | Link to request again |
| Cancelled — refunded | Your booking is cancelled and refunded | Refund amount, "3–10 working days" style note (check Paystack timing) |
| Cancelled — late | Your booking is cancelled | Deposit not refunded, per policy |
| Operator cancelled | [Operator] had to cancel — full refund | Reason, refund, alternatives |
| Day before | Tomorrow: [Experience] | Time, meeting point, balance due |
| Completed | How was [Experience]? | Review link |

## Operator (to `operators.contact_email` + all operator members)
| Trigger | Subject | Key content |
|---|---|---|
| New request | New request: [Experience], [date], [people] people — reply by [time] | Guest first name, group, notes, host (if any), one-tap **Accept / Offer another time / Decline** link (no sign-in) |
| 3h left | Reminder: respond by [time] | Same one-tap link |
| Weekly availability | Your week ahead on HostSays | Mondays: next 7 days with HostSays bookings per day and one-tap "this day is full" links |
| Calendar sync failing | We can't read your calendar | Shown after 3 failed syncs; link to fix it in the portal |
| Paid | Booked: [ref] — guest has paid the deposit | Guest name, phone, email, **collect R[balance] on the day** |
| Guest cancelled | Booking [ref] cancelled by guest | Whether the slot is free again |
| Day before | Tomorrow's HostSays guests | List of bookings with balances to collect |
| Mark completed | Please confirm yesterday's trips | One-tap Done / No-show per booking |
| Listing approved/rejected | Your listing is live / needs changes | Link, admin notes |

## Host
| Trigger | Subject | Key content |
|---|---|---|
| Application received | Thanks for applying to HostSays | What happens next |
| Approved | You're verified — set up your picks | Link to `/host/picks`, share tools |
| Guest booked | Your guest booked [Experience] | First name, date, commission amount (pending) |
| Monthly statement | Your HostSays statement for [Month] | Bookings, total commission, payout date |
| Missing bank details | Add your banking details to get paid | Link |

## Admin (to `ADMIN_EMAIL`)
- New host/operator application, listing submitted for review
- Operator hit 3 strikes in 90 days
- Payment/refund anomaly (amount mismatch, late payment, failed refund)
- Monthly payout draft ready
