/**
 * Every business number lives here. Source of truth: docs/02-business-rules.md.
 * Never hard-code these in components, and never trust them from the client.
 */

// ---------- Money ----------
/** Share of the booking total the guest pays online as a deposit. */
export const DEPOSIT_RATE = 0.1;
/** Default host commission ("Founding host rate"). Each host stores its own `commission_rate`. */
export const HOST_COMMISSION_RATE = 0.06;
/** All money is stored as integer cents in this currency. */
export const CURRENCY = "ZAR";
/** Timezone used for "days before the experience" and scheduled jobs. */
export const TIMEZONE = "Africa/Johannesburg";

// ---------- Booking windows ----------
/** Operator must accept or decline within this many hours. */
export const CONFIRM_WINDOW_HOURS = 12;
/** Guest must pay the deposit within this many hours of confirmation. */
export const PAYMENT_WINDOW_HOURS = 24;
/** Earliest bookable date, in days from today (1 = tomorrow). */
export const MIN_LEAD_DAYS = 1;
/** Remind the operator when this many hours are left to respond. */
export const REQUEST_REMINDER_HOURS_LEFT = 3;
/** Remind the guest when this many hours are left to pay. */
export const PAYMENT_REMINDER_HOURS_LEFT = 6;
/** Most other dates/times an operator can offer instead of the requested one. */
export const MAX_ALTERNATIVES = 3;
/** Guest must pick one of the operator's offered times within this many hours. */
export const OFFER_WINDOW_HOURS = 24;
/** One-tap operator email links (other than request links, which expire at the reply deadline) last this long. */
export const ACTION_LINK_DAYS = 7;

// ---------- Cancellations ----------
/** Guest cancellations this many days or more before the experience get a full deposit refund. */
export const FREE_CANCELLATION_DAYS = 7;

// ---------- After the experience ----------
/** Remind the operator to mark completed / no-show this many days after the date. */
export const COMPLETION_REMINDER_DAYS = 3;
/** Auto-complete (and flag for admin) this many days after the date. */
export const AUTO_COMPLETE_DAYS = 7;

// ---------- Operator reliability ----------
export const STRIKE_LIMIT = 3;
export const STRIKE_WINDOW_DAYS = 90;

// ---------- Hosts ----------
/** Max length of a host's tip on a recommendation. */
export const TIP_MAX_LENGTH = 200;

// ---------- Reviews ----------
/** Reviews and ratings show publicly only once an experience has this many. */
export const MIN_REVIEWS_TO_SHOW = 3;

// ---------- Attribution ----------
/** Session cookie holding the remembered host slug. See docs/07-host-attribution.md. */
export const HOST_COOKIE = "hs_host";
