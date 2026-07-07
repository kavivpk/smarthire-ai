# SmartHire AI — Typography & Premium UI Polish Spec

## Objective

**Keep the existing color theme exactly as it is** (dark navy background, blue /
purple / green / orange / red accent colors per feature — do not remove or
replace these). Do two things only:

1. **Overhaul typography** — better font families, proper size scale, clearer
   hierarchy — across the entire project.
2. **Elevate the overall visual polish** so the UI looks like a real,
   production-grade SaaS product (think Linear, Vercel, Notion-level finish)
   instead of a default/templated look — through spacing, elevation, borders,
   micro-interactions, and component refinement. **No color palette changes.**

**Do NOT touch:**
- Any backend code, API routes, or controllers
- Any business logic, state management, form validation, or data fetching
- Any React component logic (useState, useEffect, event handlers, API calls)
- Routing (App.jsx routes must stay exactly as they are)
- The existing accent color palette (blue/purple/green/orange/red per card/feature)

**Only change:**
- Font families, font sizes, font weights, line-height, letter-spacing
- Spacing, shadows, border-radius, hover/active states
- Component micro-details (badges, dividers, icon treatment, empty states)

---

## 1. Typography — Google Fonts, proper scale, clear hierarchy

Add these Google Fonts via `index.html` `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
```

### Font roles
| Role | Font | Weight | Used for |
|---|---|---|---|
| Display / Headings | `Sora` | 600–800 | Page titles, section headers, card titles, hero text (login/register left panel) |
| Body / UI | `Inter` | 400–600 | Paragraphs, labels, buttons, nav links, form inputs, table content |
| Data / Numbers | `JetBrains Mono` | 500–600 | Stat numbers, ATS scores, interview scores, percentages, countdown timers, question counters |

Add to `frontend/src/index.css` under `@theme` (Tailwind v4):

```css
@theme {
  --font-display: "Sora", sans-serif;
  --font-body: "Inter", sans-serif;
  --font-mono: "JetBrains Mono", monospace;
}
```

Set `body { font-family: var(--font-body); }` as the project default, then
apply `font-display` to headings and `font-mono` to numeric displays as
listed above.

### Type scale (apply consistently everywhere — this is currently inconsistent across pages)
| Element | Size | Weight | Line-height | Letter-spacing |
|---|---|---|---|---|
| Hero heading (login/register left panel) | 34px | 700 (Sora) | 1.2 | -0.01em |
| Page title (h1 — "Admin Dashboard", "Create Account") | 28px | 700 (Sora) | 1.25 | -0.01em |
| Section header (h2 — "Interviews by Topic", "8-Week Timeline") | 19px | 600 (Sora) | 1.3 | normal |
| Card title (h3 — "Resume Analyzer", "Mock Interview") | 16px | 600 (Inter) | 1.4 | normal |
| Body / paragraph text | 14.5px | 400 (Inter) | 1.6 | normal |
| Label (form labels, small headers like "PROJECTS") | 13px | 600 (Inter), uppercase | 1.4 | 0.04em |
| Nav links | 14.5px | 500 (Inter) | 1.4 | normal |
| Stat number (dashboard cards, ATS score, placement %) | 34px | 600 (JetBrains Mono) | 1.1 | -0.01em |
| Small stat / badge text | 12.5px | 600 (Inter) | 1.3 | normal |
| Button text | 14.5px | 600 (Inter) | 1.4 | normal |

This is a meaningful size increase from the current app (many labels/body
text currently sit at 12–13px, which reads as cramped) — apply the table
above everywhere, replacing ad-hoc `text-sm`/`text-xs` usage with the
correct scale value.

---

## 2. Premium polish upgrades (keep colors, elevate everything else)

### Elevation & depth
- Replace flat `border` only cards with a subtle **two-layer depth**: `1px
  solid` border (current accent-per-feature color at low opacity, e.g.
  `border-blue-500/20` instead of solid `border-blue-500`) **plus** a soft
  shadow: `box-shadow: 0 1px 2px rgba(0,0,0,0.3), 0 8px 24px -12px rgba(0,0,0,0.4)`
  in dark mode.
- On hover, cards should lift: `transform: translateY(-3px)`, shadow
  intensifies slightly, transition `200ms ease`.
- Feature card left/top accent borders (current colored strips) — keep the
  color, but make it a **thin 3px accent bar only on one edge** with a soft
  glow (`box-shadow: inset 0 0 0 1px rgba(color, 0.15)`), not a full-card
  outline — this reads as more refined/less "boxed."

### Spacing consistency
Define a single spacing scale and apply everywhere instead of mixed ad-hoc
padding values currently in the app:
`4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px`
- Card padding: `24px` (up from the current ~16–20px, gives more breathing room)
- Section gaps: `32px` between major dashboard blocks
- Form field gaps: `20px` vertical rhythm

### Buttons
- Primary buttons: keep current color/gradient, but add:
  - `border-radius: 12px` (slightly larger, softer)
  - Subtle inner highlight: `box-shadow: inset 0 1px 0 rgba(255,255,255,0.15)`
  - Hover: brightness up 8%, `transform: translateY(-1px)`, shadow grows
  - Active/pressed: `transform: translateY(0)`, brightness down 5%
- Secondary/outline buttons: border color at full accent opacity, background
  transparent → on hover, background fills to accent color at `8%` opacity

### Icons
- Standardize all feature/stat icons to the same icon set and stroke-width
  (currently mixed emoji + SVG + inconsistent sizes — pick one, ideally
  `lucide-react` since it's already available, stroke-width `1.75`)
- Icon badges: keep current per-feature accent color, but use a soft
  gradient background instead of flat fill: `linear-gradient(135deg,
  color/20, color/5)`, with the icon in solid `color` on top

### Charts (Chart.js)
- Keep current color scheme, but add:
  - Rounded bar corners: `borderRadius: 6` on bar charts
  - Donut chart: add `cutout: '68%'` (slightly slimmer ring) and a subtle
    drop shadow filter
  - Line chart: smooth curve `tension: 0.4`, gradient area fill under the
    line (`color` → transparent), larger point markers on hover only
  - Add a centered total/summary number inside donut charts (currently
    empty center)
  - Tooltip styling: dark surface background, rounded corners, no default
    Chart.js white tooltip

### Score rings / gauges (ATS Score, Placement Probability)
- Keep current accent color for the arc
- Increase stroke width slightly for a bolder, more confident look
- Add a very subtle background track glow matching the arc color at low opacity
- Center number in `font-mono`, `34px`, bold

### Tables (Admin — All Students, etc.)
- Add zebra striping at very low opacity (`bg-white/[0.02]` alternating rows) for scan-ability
- Header row: sticky on scroll if the table is long
- Row hover: full-row highlight `bg-white/[0.04]`, smooth `150ms` transition
- Add subtle row-entry animation (fade + slide up 4px) when data loads

### Empty / loading states
- Current empty states are plain text ("No interviews yet") — upgrade to a
  small centered icon + text + optional CTA, consistent style across all
  empty states in the app
- Add skeleton loaders (pulsing gray blocks) for stat cards and charts while
  data is fetching, instead of a blank flash

### Micro-interactions
- Page transitions: fade-in content `200ms` on route change
- Form inputs: focus ring uses current accent color but softer —
  `box-shadow: 0 0 0 3px accent-color/15` instead of a hard border color swap
- Toggle (dark/light switch): smooth thumb slide, subtle shadow on the thumb
- Success feedback (e.g. after submitting an answer): brief scale-pulse
  animation on the confirmation element

---

## 3. Pages in scope (apply the above rules to each)

- `Login.jsx`
- `Register.jsx`
- `Dashboard.jsx`
- Resume analyzer results page
- `MockInterview.jsx`
- `LiveInterview.jsx` (all stages: setup, aptitude, coding, tech Q&A, HR live room, video call UI)
- `Prediction` page (form + result)
- Career Roadmap generator + result (weekly timeline cards)
- Skill Check / Fake Skill Detection page
- `AdminDashboard.jsx` (stat cards, charts, students table, aptitude question form)
- Footer (site-wide)
- Navbar (site-wide) — logo, nav links, theme toggle, user avatar

---

## 4. Implementation steps for Kiro

1. Add the Google Fonts `<link>` tags to `frontend/index.html`.
2. In `frontend/src/index.css`, add the `@theme` font-family tokens from
   Section 1, and set `body { font-family: var(--font-body); }`.
3. Go through every file in Section 3. For each:
   - Replace ad-hoc heading tags/classes with the correct `font-display` +
     size from the Section 1 type scale table.
   - Replace ad-hoc body text sizes with the correct `font-body` size.
   - Apply `font-mono` to every numeric stat/score/percentage/timer/counter.
   - Apply the spacing scale from Section 2 to card padding and section gaps.
   - Apply the elevation (shadow + hover lift) treatment to all cards.
   - Apply the refined button treatment (radius, inner highlight, hover lift).
   - Standardize icons to `lucide-react` with consistent stroke-width, keeping
     each feature's existing accent color.
   - Update Chart.js `options` objects per Section 2's chart rules — do NOT
     change the `data`/colors, only the visual options (borderRadius, cutout,
     tension, tooltip styling).
   - Add skeleton loading state and improved empty state where data-dependent
     content currently shows a blank or plain-text state.
4. After editing each file, briefly state which file was changed before
   moving to the next.
5. Test both dark and light mode after changes — confirm typography and
   spacing look correct and no color values were altered.
6. Do not modify any `.js` logic outside of JSX className/style attributes,
   Chart.js `options` (not `data`/colors), and CSS files.

---

## 5. Acceptance checklist

- [ ] All headings use Sora, all body text uses Inter, all numeric stats use JetBrains Mono
- [ ] Font sizes follow the Section 1 scale consistently across every page (no more ad-hoc 12px labels sitting next to 16px ones)
- [ ] Existing accent color palette (blue/purple/green/orange/red per feature) is fully preserved — zero color values changed
- [ ] Cards have visible depth (shadow + hover lift), not flat
- [ ] Spacing feels consistent and generous, not cramped
- [ ] Buttons feel tactile (hover/active states, soft inner highlight)
- [ ] Charts have rounded bars, smooth line curves, styled tooltips, and a center label on donuts
- [ ] Tables have hover highlighting and (if long) sticky headers
- [ ] Empty and loading states are polished, not blank or plain text
- [ ] Dark mode and light mode both work and remain fully readable
- [ ] All existing functionality (forms submit, interviews start, charts render, tables populate) works exactly as before — zero logic changes