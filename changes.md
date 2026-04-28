# IPL Fantasy App — Visual Redesign Brief

## Read this first (rules of engagement)

You are redesigning the **visual layer only** of an existing fantasy IPL app. Your job is to make it look premium and editorial, similar in feel to the official iplt20.com site but with a darker, more cinematic tone so it doesn't feel derivative.

**Hard constraints — DO NOT VIOLATE:**

1. **Do NOT change any feature behavior, routes, data shapes, API calls, or component logic.** This is a styling pass. If a component receives `team.points`, it still receives `team.points` after your changes.
2. **Do NOT remove any existing sections.** Every tab (Squad / Fixtures / Results / News), every widget (Today's Scorers, Top Gainers, Points Over Time chart, Next Match, Players to Watch), every breadcrumb, every navigation item must remain present and functional.
3. **Do NOT rename routes or change URL structures.**
4. **Do NOT add new dependencies** unless absolutely required for typography. If you need a font, use Google Fonts via `<link>` tag or `next/font`.
5. **Work incrementally.** Do one section at a time, show the diff, let me verify, then continue. Don't rewrite the entire app in one shot.
6. **Preserve all existing TypeScript types and prop interfaces.**

If you are about to change anything in the "do not" list above, **stop and ask first**.

---

## Aesthetic direction

**Reference feel:** Official IPL site (iplt20.com) crossed with Apple Sports app and The Athletic's editorial layouts. Premium sports broadcast meets editorial magazine. Dark, confident, restrained.

**Anti-patterns — explicitly avoid these:**
- Generic Material UI / Bootstrap card aesthetics
- Bright saturated red as a hero/surface color (red is an accent only, used sparingly)
- Flat circles with letters as team badges (looks like default avatars)
- Pure flat black backgrounds with no texture or depth
- Thin gray labels under numbers (boring stat display)
- Equal visual weight on every row of a table
- Loose digit spacing on numbers (currently a bug — see below)

---

## Design tokens (use these exactly)

### Color palette

```
/* Base surfaces */
--bg-primary: #0A0E1A;        /* page background — deeper than current */
--bg-secondary: #0F1524;      /* section backgrounds */
--bg-elevated: #161D2F;       /* card surfaces */
--bg-hover: #1C2438;          /* hover state */

/* Borders */
--border-subtle: rgba(255, 255, 255, 0.06);
--border-default: rgba(255, 255, 255, 0.10);
--border-strong: rgba(255, 255, 255, 0.16);

/* Text */
--text-primary: #F1F4F9;
--text-secondary: #A8B0C0;
--text-tertiary: #6B7489;
--text-disabled: #4A5165;

/* Accents */
--gold: #C9A961;              /* premium signal — trophies, leaders, key numbers */
--gold-muted: #8C7440;
--gold-bg: rgba(201, 169, 97, 0.08);

/* Semantic */
--success: #4ADE80;           /* positive deltas (today gains) */
--success-muted: #22C55E33;
--danger: #F87171;            /* use SPARINGLY — only for genuine negatives */
--danger-muted: #EF444433;

/* Team accent colors — desaturated ~10-15% from official IPL team colors
   so they read as rich, not loud. Use these as RADIAL GLOWS not flat fills. */
--team-csk: #E8B547;
--team-mi: #2E5BA8;
--team-rcb: #C8253E;
--team-kkr: #4A2D7A;
--team-dc: #1E5DB3;
--team-pbks: #C8253E;
--team-rr: #D4376E;
--team-srh: #E8722E;
--team-gt: #2A4A6B;
--team-lsg: #2E84C4;
```

### Typography

Load these fonts:
- **Display (headings, team names, big numbers):** `"Fraunces"` from Google Fonts — weights 600, 700, 900. This is the editorial magazine feel.
- **Sans (body, labels, UI):** `"Inter"` weights 400, 500, 600, 700. Already widely used.
- **Mono (numbers, deltas):** `"JetBrains Mono"` weights 500, 600. Critical for tabular numerals.

Apply `font-feature-settings: "tnum" 1, "ss01" 1` on all number displays so digits are tabular and aligned.

**Type scale:**
```
Display XL: Fraunces 700, 64px / 1.05 / -0.02em   (hero team name on desktop)
Display L:  Fraunces 700, 48px / 1.1  / -0.02em   (mobile hero team name, page titles)
Display M:  Fraunces 600, 32px / 1.15 / -0.01em   (player names, section heroes)
Heading:    Inter 600, 18px / 1.3 / -0.005em      (card titles, table headers reimagined)
Body:       Inter 400, 15px / 1.5                 (paragraph copy)
Label:      Inter 500, 11px / 1.2 / 0.08em / UPPERCASE  (small labels like TOTAL PTS)
Number XL:  JetBrains Mono 600, 56px / 1 / -0.02em   (hero stat numbers)
Number L:   JetBrains Mono 600, 32px / 1 / -0.01em   (table points, stat values)
Number M:   JetBrains Mono 500, 18px / 1            (deltas, secondary numbers)
```

**CRITICAL — fix the number spacing bug:** Numbers like "4,855.8" currently render with weird gaps between digits and commas. Apply `font-variant-numeric: tabular-nums; letter-spacing: 0;` to all number displays. Test against the points table — the commas should be tight to the digits.

### Spacing scale

Use a 4px base: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96`. Don't invent values.

### Border radius

```
--radius-sm: 6px;     /* small chips, badges */
--radius-md: 10px;    /* buttons, inputs */
--radius-lg: 16px;    /* cards */
--radius-xl: 24px;    /* hero sections, large surfaces */
--radius-full: 9999px;
```

---

## Component-level direction

### Team monogram badges (PA, AR, TR, etc.) — REDESIGN

**Current problem:** Flat circles with letters look like default avatars.

**New design:**
- Hexagonal shape (use SVG, not CSS clip-path for crispness on retina)
- Inner gradient: from team accent color (top) to a darker shade (bottom), at ~80% saturation
- A 1.5px gold border (`--gold` at 60% opacity) when the team is featured/selected
- Letters in Fraunces 700, white, with a subtle 1px dark drop shadow for depth
- A faint inner highlight at the top (white at 8% opacity, 30% height) for a "polished gem" feel
- On hover (desktop): scale 1.04, gold border opacity goes to 100%
- Sizes: 32px (nav strip), 56px (table rows), 96px (team page hero), 128px (home cards)

### Hero section — UNIFIED TEMPLATE

Every team page hero should use the same structure (currently inconsistent).

**Layout (desktop):**
- Full-width section, height ~360px
- Background: `--bg-primary` base
- **Behind the content:** a large radial gradient using the team's accent color, centered behind the monogram, ~600px diameter, opacity fading from 25% center to 0% at edges. This is the team's "energy" — subtle but present.
- **Watermark:** team initials (e.g., "PA") rendered HUGE in Fraunces 900 at 1200px wide, positioned absolute, white at 3% opacity, behind everything. Adds editorial texture.
- **Content (left side):** Team monogram (96px) → Team name (Display XL) → "TBD" subtitle → rank pill + total points pill in a row → 2025 Champion badge if applicable.
- **Content (right side, desktop only):** "Today's Scorers" card lives here, vertically centered. Same hero composition, no longer floating awkwardly.
- **Bottom edge of hero:** does NOT abruptly end. Add a 80px gradient fade from `--bg-primary` to `--bg-secondary` so the hero eases into the content section below.

**Layout (mobile):**
- Stacks vertically: monogram (centered, 80px) → name → pills → champion badge → "Today's Scorers" card full-width below.
- Reduce hero height to auto.
- Watermark scales down but stays present.

### Team selector strip (top of team page)

**Current problem:** 8 tiny circles in a row, hard to tap, visually noisy.

**Desktop:** Keep as a row but increase size to 48px monograms, add 16px gap, give the active team a gold outer ring (2px) plus a subtle gold glow underneath. Inactive teams at 60% opacity until hover.

**Mobile:** Convert to a horizontal scroll snap container with 56px monograms. Active team is centered on load. Add a subtle fade gradient on left/right edges to indicate scroll. Better than cramming 8 items into 380px.

### Pills / badges (rank #6, points 4,097.6)

- Rounded pill: `--radius-full`
- Background: `--bg-elevated`
- Border: 1px `--border-subtle`
- Text: 13px Inter 500
- Padding: 6px 12px
- Numbers inside use JetBrains Mono with tabular-nums

The "2025 Champion" badge: gold-tinted background (`--gold-bg`), gold border (1px `--gold` at 40%), gold trophy icon, gold text. NOT a yellow box — a refined gold pill.

### Points table — EDITORIAL UPGRADE

**Row treatment:**
- Default row: subtle bottom border `--border-subtle`, 72px height, no background
- **Leader row:** background gradient from `--gold-bg` to transparent (left to right), a 3px gold left-edge bar, "LEADER" pill in gold instead of plain text
- **Hovered row:** background `--bg-hover`, smooth transition
- Each row's left edge has a 3px vertical bar in the team's accent color (visible on hover, full opacity, 0px when not hovered → 3px on hover with smooth transition)

**Columns:**
- `#` rank: 13px Inter 500, `--text-tertiary`
- Team monogram + name: monogram 40px, name in Inter 600 16px
- Points: JetBrains Mono 600 20px, `--text-primary` — tabular nums, NO weird letter-spacing
- Today: JetBrains Mono 500 15px. Positive in `--success`, zero/negative subdued. Drop the green pill background — too noisy. Just colored text.
- Gap to P1: JetBrains Mono 500 15px in muted coral (`--danger` at 70%) — but only show the minus sign and number, no extra emphasis
- Gap to ↑: JetBrains Mono 500 15px in `--text-tertiary`

**Top Gainers sidebar:** Looks decent currently. Just apply the new monogram design and tighten the type. Use `--gold` for the "+126" deltas of the top gainer to signal premium leaderboard.

### Player cards (in Squad section)

**Current problem:** Plain white card with red number, generic.

**New design:**
- Card surface: `--bg-elevated`, border 1px `--border-subtle`, radius `--radius-lg`
- Padding: 16px
- Headshot: 56px circle, with a 1px ring in the team's accent color
- Name: Inter 600 16px, `--text-primary`
- Team code below: Inter 500 11px UPPERCASE letter-spacing 0.08em, `--text-tertiary`
- Points: JetBrains Mono 600 24px, right-aligned, `--text-primary`
- "PTS" label below points: Inter 500 10px UPPERCASE, `--text-tertiary`
- Hover: border becomes `--gold` at 30% opacity, card lifts 2px (transform translateY(-2px)), subtle shadow
- The top gainer in each section gets a tiny gold dot (4px) next to their name

### Player detail page

**Hero:**
- Same template as team hero — radial glow in the player's team accent color behind the headshot
- Player headshot in a soft-cornered rectangle (radius 16px) with a 1px team-color ring
- Wicket-keeper / batter / bowler / all-rounder pill in team accent color (muted)
- Name in Display L, team chip + team monogram below
- Three big stats: TOTAL PTS / MATCHES / AVG / MATCH — use Number XL for values, Label style for labels, separated by thin vertical gold rules

**Match by match section:**
- Each match row: `--bg-elevated` surface, radius `--radius-lg`, 64px height
- Left: small "GD35" pill in team accent color tint
- Center: match (e.g., "DC vs PBKS") in Inter 600 16px, date below in Inter 400 13px `--text-tertiary`
- Right: BAT +109, FLD +8 chips (small, monospace, success-tinted), then total points in JetBrains Mono 600 22px

### Home page (team grid)

The current home page is **the closest to right** — keep the gradient cards but:
- Replace the flat circle monograms with the new hexagonal design
- The rank badge (#1, #2 etc.) in the top-left should be a smaller gold pill for #1, silver for #2, bronze for #3, neutral for the rest. Currently they're all the same.
- "+259.2 today" delta should be JetBrains Mono and use `--success` instead of the bright green pill background

### Today's Scorers widget

Already a good idea. Refinements:
- Card surface, gold accent on the section title
- Each row: rank number in `--text-tertiary`, player headshot 32px, name + team in stacked text, delta on the right in JetBrains Mono `--success`
- Section header: "TODAY'S SCORERS" in Label style with a "2" count chip next to it

---

## Mobile-specific requirements

**This app must be excellent on mobile (380px width).** Test every page at 380px before shipping.

1. **All tap targets minimum 44x44px.** The current team selector circles fail this.
2. **No horizontal overflow except for designed scroll containers.** Test the points table — it should either fit or scroll horizontally with a clear edge fade.
3. **Hero sections collapse vertically and reduce padding.** No 360px-tall heroes on a 700px-tall mobile screen.
4. **Numbers don't shrink below 14px.** Don't downscale stats illegibly.
5. **The "Today's Scorers" floating card on desktop becomes a full-width card below the hero on mobile, NOT a tiny floating element.**
6. **Bottom safe area:** add 24px padding at the bottom of pages so content doesn't hit the navigation gesture area on iOS.
7. **Tabs (Squad / Fixtures / Results / News):** on mobile, make these scrollable horizontally if needed and 48px tall with clear active indicator.

---

## Order of operations

Do these in sequence. Show me the result after each step before continuing:

1. **Tokens & fonts.** Set up the CSS variables, load the fonts, fix the global number rendering (tabular-nums everywhere). This alone will improve the look 20%.
2. **Team monogram component.** Build the hexagonal SVG monogram as a reusable component. Replace all existing flat-circle usage. Show me one page using it before continuing.
3. **Hero template.** Unify all team page heroes using the new template. Test with at least 3 different teams (different accent colors).
4. **Points table.** Apply the new row treatments, leader emphasis, color bars on hover.
5. **Player cards.** Update the squad section cards.
6. **Player detail page.** Apply hero + match rows.
7. **Home page polish.** Update monograms in cards, fix rank badges, fix delta typography.
8. **Mobile pass.** Go through every page at 380px width. Fix anything cramped.
9. **Final review.** Walk every page and look for inconsistencies.

---

## What "done" looks like

- A user opening the app on their phone says "this looks like a real product, not a side project."
- Numbers render cleanly with no weird digit spacing.
- Team pages feel like editorial magazine spreads, not dashboards.
- The points table tells a story (leader stands out, hover reveals team identity).
- Every page shares a consistent visual language — no page feels like a different app.
- All existing features still work. No regressions.

---

## If you get stuck

- If a design choice conflicts with an existing feature, **preserve the feature and ask me how to resolve.**
- If you're about to make a change outside the styling layer (e.g., changing a hook, adding a route), **stop and ask.**
- If you can't load Fraunces or JetBrains Mono, fall back to `Georgia, serif` and `'SF Mono', Consolas, monospace` respectively, and tell me.