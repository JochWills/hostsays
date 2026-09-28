# 03 — Site Structure

## Route map (Next.js App Router)

### Public
| Route | Page | Notes |
|---|---|---|
| `/` | Home | Match `reference/homepage-prototype.html` exactly |
| `/explore` | All experiences | Filters: area, category, date, group size, price. Sort: most recommended (default), price |
| `/[slug]` | **Area page OR host storefront** | Shared namespace — see "Slug resolution" below |
| `/[area]/[category]` | Area + category page | e.g. `/addo/safari`. SEO landing pages |
| `/x/[experience-slug]` | Experience page | Details, host recommendations, reviews, booking panel |
| `/o/[operator-slug]` | Operator page | All of an operator's experiences |
| `/how-it-works` | Guest explainer | Request → confirm → deposit → go |
| `/hosts` | Hosts directory | All verified hosts, filter by area; cards link to storefronts |
| `/areas` | Areas directory | All live areas; cards link to area pages |
| `/for-hosts` | For hosts | Pitch + apply form |
| `/for-operators` | For operators | Pitch + apply form |
| `/about` | About | Story, trust, commission disclosure |
| `/help` | FAQ | Guests, hosts, operators |
| `/terms`, `/privacy`, `/cancellations`, `/operator-terms` | Legal | Placeholder content in development |

### Guest (no account needed)
| Route | Page |
|---|---|
| `/b/[token]` | Booking status, pay deposit, voucher, cancel, review — all on one page that changes by status |
| `/b/[token]/pay` | Starts Paystack checkout (server redirect) |
| `/b/[token]/review` | Review form (only when completed) |

### Operator one-tap links (no sign-in, from emails)
| Route | Page |
|---|---|
| `/r/[token]` | Signed, expiring link. Shows one request (Accept / Offer another time / Decline) or the coming week's availability ("this day is full"). Only button presses (POST) change anything. |
| `/api/calendar/[feed_token].ics` | Operator's private calendar feed of HostSays bookings |

### Auth
| Route | Page |
|---|---|
| `/signup` | Choose guest / host / operator, then that sign-up form (`?as=guest\|host\|operator`). Sends a confirmation email |
| `/login` | Email magic link / password for everyone with an account |
| `/account` | Guest account (`role = guest`): their bookings (placeholder until bookings are built) |
| `/auth/callback` | Supabase auth callback |
| `/invite/[token]` | Accept an invite (host staff, operator claiming an admin-built account) |

### Host portal (`role = host`)
| Route | Page |
|---|---|
| `/host` | Dashboard: storefront visits, requests, completed bookings, earned, pending |
| `/host/picks` | Recommend experiences, write tips (max 200 chars), reorder |
| `/host/storefront` | Photo, welcome note, featured picks, preview |
| `/host/share` | Storefront link, QR code (PNG download), printable room card (A5/A6 PDF or print page), email welcome template |
| `/host/earnings` | Referred bookings table, monthly statements, payout history |
| `/host/team` | Staff logins (hotels) — invite/remove |
| `/host/settings` | Contact details, banking details, notification preferences |

### Operator portal (`role = operator`)
| Route | Page |
|---|---|
| `/operator` | Dashboard: new requests with countdown, upcoming trips, stats |
| `/operator/requests` | Accept, Offer another time (1–3 dates/times), or Decline (reason) |
| `/operator/bookings` | Upcoming and past; mark completed / no-show; cancel (reason, weather flag) |
| `/operator/experiences` | List; create/edit (submits for approval) |
| `/operator/experiences/[id]` | Edit form with photos, pricing, slots, policies |
| `/operator/availability` | Weekly slots and capacity; close a day or one slot, or change spots left on a date; connect a calendar (import) and copy the private calendar address (export) |
| `/operator/statements` | Bookings and deposits collected by HostSays |
| `/operator/settings` | Business details, team, notification email, accept operator terms |

### Admin (`role = admin`)
| Route | Page |
|---|---|
| `/admin` | Overview: bookings today, pending approvals, strikes |
| `/admin/approvals` | Host applications, operator applications, listing submissions/edits |
| `/admin/bookings` | Search all bookings, override status, trigger refunds |
| `/admin/operators` | List; **create operator on behalf**; send claim invite |
| `/admin/experiences` | Create/edit any experience |
| `/admin/hosts` | List, verify, suspend, set commission rate |
| `/admin/recommendations` | Moderate recommendations and tips |
| `/admin/payouts` | Monthly payout run, CSV export, mark paid |
| `/admin/content` | Areas, categories, homepage featured items |

## Slug resolution for `/[slug]`
Areas and hosts share the top-level namespace.
1. Look up `areas.slug`. If found → render area page.
2. Else look up `hosts.slug` where `status = 'verified'`. If found → render host storefront **and set session attribution** (see `07-host-attribution.md`).
3. Else 404.

**Reserved slugs** (block for hosts and areas): `explore, x, o, b, r, host, hosts, areas, for-hosts, for-operators, operator, operators, admin, login, signup, sign-up, join, auth, invite, about, help, terms, privacy, cancellations, operator-terms, how-it-works, api, search, book, bookings, account, settings, static, images, favicon.ico, robots.txt, sitemap.xml, coming-soon, preview`.
When a host picks a slug, also block any existing area slug and validate: lowercase letters, numbers and hyphens, 3–40 characters.

## Global UI
- **Header** (on every public page): logo, nav (Experiences → `/explore`, Hosts → `/hosts`, Areas → `/areas`, How it works, For Hosts → `/for-hosts`), search icon, Sign in, "List your experience" button. On the homepage it sits transparent over the hero; elsewhere it's solid.
- **"Staying at [Host]" pill** in the header when a host is remembered this session, with × to clear.
- **Footer:** links, commission disclosure, legal links.

## Page contents

### Home `/`
Build to match `reference/homepage-prototype.html`:
1. Hero: headline "Things to do, *recommended by local hosts.*", lead copy, search bar (Where / What / When / Search), category chips
2. "Most recommended by hosts" — 4 experience cards
3. "Hosts who know the area" — 4 host cards linking to storefronts
4. Right column: "For guesthouses" promo and "For tourism operators" promo
5. "How booking works" 4 steps
6. Live areas line with commission disclosure
7. Footer
Content (featured experiences and hosts) comes from the database, managed in `/admin/content`.

### Experience page `/x/[slug]`
- Photo gallery (first photo large)
- Title, operator (link), area, duration, group size, price per person
- **Host recommendations block:** "Recommended by N local hosts", avatars, and 2–3 tips with host name + area (link to storefronts)
- Description, what's included, what to bring, meeting point (map link)
- Cancellation policy (standard text + operator's own balance terms)
- Reviews (only if 3+)
- **Booking panel** (sticky on desktop, bottom sheet on mobile):
  - Date (min tomorrow; disable blackout dates and days without slots), time slot, people (within min/max)
  - "Where are you staying?" — searchable select of verified hosts + "Somewhere else / not listed". Pre-filled from session attribution.
  - Name, email, phone, notes
  - Price summary: total, "10% deposit after confirmation", "Balance paid to operator on the day"
  - Button: **Send request**. Note: "No payment now. [Operator] will confirm within 12 hours."
- "More from this operator", "Hosts also recommend"

### Host storefront `/[host-slug]`
- Host photo, name, area, welcome note
- "Our picks" — recommended experiences in the host's chosen order, each with the host's tip
- Category filter
- Line: "Book here and [Host] is credited automatically."
- "Powered by HostSays" footer

### Area page `/[area-slug]`
- "What [Area] hosts say to do"
- Most-recommended experiences, category sections
- Verified hosts in the area (link to storefronts)
- Short SEO intro text (editable in admin)

### Guest booking page `/b/[token]`
Changes by status:
- `requested`: "Waiting for [Operator] to confirm (by [time])", Cancel request
- `offered`: "[Operator] can't do [date], but can do…": one button per offered date/time (full ones greyed out), "None of these work", pick-by time
- `confirmed`: "Confirmed! Pay your R[deposit] deposit by [time] to lock it in", Pay button, policy reminder
- `paid`: Voucher — reference, experience, date/time, meeting point, **"Balance due to operator on the day: R[balance]"** in large text, operator contact, Cancel (with the right refund message)
- `completed`: Thanks + review form link
- `declined` / `expired` / `offer_expired` / `payment_expired`: explanation + 3 similar experiences
- `cancelled_*`: refund status

## SEO
- **Indexing is off until launch.** `ALLOW_INDEXING=false` (Render env) makes `robots.txt` disallow everything and adds `noindex` to every page, because demo listings use real business names with placeholder prices. Set it to `true` when listings are real.
- Server-render all public pages. Unique title/description per page.
- `sitemap.xml` with areas, area+category pages, experiences, operators, verified host storefronts.
- JSON-LD on experience pages (Product/Offer or TouristTrip) — keep it valid and simple.
- Open Graph images from the first experience photo.
