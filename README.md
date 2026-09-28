# HostSays

**Things to do, recommended by local hosts. Book in minutes.**

HostSays is a booking platform for tourism experiences on the Eastern Cape coast of South Africa. Operators (game reserves, dive centres, charters, tour guides) list experiences. Accommodation hosts (guesthouses, B&Bs, self-catering, Airbnb hosts, hotels) recommend them to their guests and earn commission on bookings.

## Getting started with Claude Code
1. Open this folder in Claude Code.
2. Claude Code reads `CLAUDE.md` automatically. It points to everything in `docs/`.
3. Start with: *"Read CLAUDE.md and all docs, then start Phase 0 of docs/09-build-plan.md."*

## What you need before building
- A Supabase project (URL, anon key, service-role key)
- A Paystack account (test keys first)
- A Resend account and a verified sending domain (hostsays.com)
- A Render account (paid instance, so the site never sleeps)
- The domains hostsays.com and hostsays.co.za

Copy `.env.example` to `.env.local` and fill in the values.

## Folder layout
```
CLAUDE.md                 Instructions for Claude Code
README.md                 This file
.env.example              Environment variables needed
docs/                     Product spec (read in numbered order)
reference/                Approved homepage, mockup, early prototype, placeholder photos
```
