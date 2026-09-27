# 04 — Design System

Taken from the approved homepage: `reference/homepage-prototype.html` (open it in a browser) and `reference/mockups/homepage-mockup.png`. Match this look across the whole site.

## Personality
Premium, warm, outdoorsy travel. Golden-hour photography, lots of white space, rounded cards, deep bush-green actions.

## Colour tokens
Define as CSS variables and map them into Tailwind (`theme.extend.colors`).

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#F6F4EF` | `#121614` | Page background (warm off-white) |
| `--surface` | `#FFFFFF` | `#1B211E` | Cards, panels |
| `--panel` | `#EFECE5` / `rgba(236,232,224,.92)` | `#202723` | Promo panels |
| `--ink` | `#1E2723` | `#E9ECE9` | Main text |
| `--muted` | `#6A706B` | `#A1A9A3` | Secondary text |
| `--line` | `#E4E0D8` | `#2C3531` | Borders, dividers |
| `--green` | `#2D4A3E` | `#5E9A82` | Primary buttons, links, host badge text |
| `--green-ink` | `#FFFFFF` | `#0C1511` | Text on green |
| `--gold` | `#E3A33B` | same | Stars, focus rings |
| `--pill` | `rgba(20,26,22,.62)` | `rgba(10,14,12,.7)` | Location pills over photos |
| Hero base | `#2C1F11` | same | Behind hero photo, left fade |

Dark mode: redefine tokens under `@media (prefers-color-scheme: dark)` guarded by `:root:not([data-theme="light"])`, and again under `:root[data-theme="dark"]`.

## Typography
- **Sans (everything):** Manrope 400/500/600/700/800 (`next/font/google`), fallback `"Segoe UI", system-ui, sans-serif`
- **Serif accent:** Playfair Display italic 600/700 — **only** for the emphasised phrase in big headlines (e.g. *recommended by local hosts.*)
- Scale:
  - Hero H1: `clamp(34px, 4.6vw, 56px)`, weight 800, line-height 1.05, letter-spacing −0.025em
  - Section H2: 20px, weight 700
  - Card title: 14.5–15px, weight 700
  - Body: 15px / 1.5; card descriptions 13px muted
  - Small labels: 11–12.5px

## Layout
- Max width 1536px, side padding `clamp(18px, 5.8vw, 90px)`; hero content inset `clamp(18px, 8.5vw, 130px)`
- Homepage main area: two columns — content `1fr` + sidebar `385px`, gap 22px. Collapses to one column under 1180px.
- Card grids: 4 columns desktop → 2 columns under 980px (keep 2 on phones).
- Mobile-first; test at 390px width.

## Components
- **Header over hero:** transparent, white text, logo 34px weight 800 with a small mountain-line SVG above "Says".
- **Primary button:** `--green` background, white text, radius 14px, padding 13px 26px, weight 600, optional arrow icon.
- **Search bar:** white, radius 14px, 6px inner padding, 3 fields with icons divided by 1px lines, green Search button radius 10px. Stacks on mobile.
- **Category chips:** 38px outlined white circle icon + label; active/hover fills white with green icon. Horizontal scroll on mobile.
- **Experience card:** white, radius 10px, soft shadow `0 1px 2px rgba(30,39,35,.06), 0 6px 18px rgba(30,39,35,.07)`, photo aspect 220/143, location pill bottom-left, heart top-right, body: title, 2-line description, stars + rating (only if 3+ reviews), divider, footer row: host avatars + "N hosts" (left) and "R2,950 pp" (right). Lift 2px on hover.
- **Host card:** same card; location pill top-left; body: name, "N picks" + "Their picks →" link.
- **Promo panel:** `--panel` background, radius 14px, small label, 20px bold heading, muted copy, green button. The host promo has a tilted phone-card preview of a storefront.
- **Steps strip:** white card, numbered green circles.
- **Status pills:** requested (gold tint), confirmed (green tint), paid/completed (green), declined/cancelled/expired (red tint).
- **Icons:** thin line icons (1.8 stroke). Lucide React is fine.

## Imagery
- Warm, golden-hour, real photography. Wide landscapes for heroes; close subjects for cards.
- Placeholder images in `reference/assets/` (cropped from the mockup). Replace with real operator photos (with permission) or licensed stock before launch.
- Use `next/image` with proper sizes; store uploads in Supabase Storage.

## Accessibility
- Visible focus ring (`--gold`, 3px, offset 2px)
- All images have alt text; icon buttons have aria-labels
- Colour contrast AA on text
- Respect `prefers-reduced-motion`
