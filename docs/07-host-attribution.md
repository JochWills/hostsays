# 07 — Host Attribution (Referrals)

## Goal
When a guest arrives through a host, that host is credited for any booking the guest makes in that browser session — unless the guest chooses a different option.

## How a guest gets attributed
| Entry point | Example | Result |
|---|---|---|
| Host storefront | `hostsays.com/onthebay` | Session host = On The Bay, source `storefront` |
| Referral link on any page | `hostsays.com/x/seal-snorkel?ref=onthebay` | Session host = On The Bay, source `ref_link` |
| QR code in room | Encodes `hostsays.com/onthebay?utm_source=qr` | Same as storefront |
| Selected in booking form | Guest picks their accommodation manually | source `selected` |
| "Somewhere else / not listed" | — | No host, source `none` |

## Rules
1. **Duration:** the current browser session only. Use a **session cookie** (no `Expires`/`Max-Age`) named `hs_host`, value = host slug, `SameSite=Lax`, `Secure`, `Path=/`. Set it in middleware when the request hits a verified host storefront or has `?ref=`.
2. **Last touch wins:** visiting a different host's storefront or `?ref=` replaces the session host.
3. **Only verified hosts** can be set. Unknown or unverified slugs are ignored.
4. **Header pill:** when `hs_host` is set, show "Staying at **[Host name]**" with × to clear (clears the cookie).
5. **Booking form:** "Where are you staying?" is a searchable select of verified hosts (name + area) plus "Somewhere else / not listed". Pre-fill it with the session host. **The guest can change it.**
6. **Crediting:** the host selected **when the request is submitted** is stored on the booking (`host_id`) with the right `attribution` value. That host gets the commission. Changing the host later is admin-only.
7. **Commission applies to any experience**, not just ones the host recommends.
8. A host can't be credited for a booking of an experience run by an operator they're a member of (edge case: flag for admin).

## Storefront visit tracking
Increment `storefront_visits` (host, day) once per session per host. Don't count bots (skip common crawler user agents). This powers "Storefront visits" on the host dashboard.

## Host share tools (`/host/share`)
- **Storefront link:** `https://hostsays.com/[slug]` with a copy button
- **QR code:** PNG download (use a QR library server-side), encoding the storefront URL with `?utm_source=qr`
- **Printable room card:** A5 and A6 print layouts: headline "Things to do around [Area]", "Our favourite local experiences, picked by [Host]", large QR code, short line "Scan to browse and request a booking. Pay only once it's confirmed."
- **Email/WhatsApp welcome text** (copy button): *"Hi! Looking for things to do while you're here? These are our favourite local experiences, and you can request a booking in a minute: [link]"*

## What hosts can see
- Storefront visits, number of requests, confirmed/paid, completed, cancelled
- Each referred booking: reference, experience, date, people, status, commission amount and status
- **Not** the guest's email or phone (POPIA). First name only.
