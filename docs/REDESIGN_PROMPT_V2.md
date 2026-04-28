# IPL Fantasy App — Visual Refinement Pass

## Context

You are working on a React + Tailwind v4 fantasy IPL app. The codebase already has solid structure — `TeamCard` with an SVG wave separator, `TeamDetailsPage` with layered hero + Today's Scorers card, `PlayerPage` with hero + match breakdown, `LeaderboardPage` with table + sidebar + chart. **Components work and look reasonable. The problems are at the design-token layer:** missing fonts, scattered arbitrary sizes, inconsistent surface colors, and a few specific component fit-and-finish issues.

This is **not** a redesign. It is a **token + finish pass** that elevates everything by 2-3 notches without restructuring components.

---

## HARD RULES — DO NOT VIOLATE

1. **Do NOT change component logic, hooks, props, types, API calls, or routes.** Pure styling pass.
2. **Do NOT remove sections, tabs, widgets, or features.** Every existing feature must keep working: Today's Scorers card, Top Gainers sidebar, Points Over Time chart, Next Match panel, Players to Watch, RoleSection grids, MatchRow expand/collapse, season switcher, past seasons toggle.
3. **Do NOT restructure `TeamCard`'s SVG wave architecture.** It works. Only retoken its colors and typography.
4. **Do NOT restructure the `TeamDetailsPage` hero layout.** Compact identity left + Today's Scorers right is correct. Only retoken.
5. **Do NOT restructure the `LeaderboardPage` table.** Only retoken cells and replace emoji medals.
6. **Work in numbered steps. Show the diff after each step. Wait for approval before continuing.**

If you're about to violate any of the above, **stop and ask.**

---

## STEP 1 — Foundation: fonts, tokens, type scale

### 1a. Update `index.html` to load Inter and JetBrains Mono

Replace the existing Google Fonts `<link>` with this:

```html
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&display=swap" rel="stylesheet">
```

Bricolage stays — it's the display/branding font. Inter is the new body/UI font. JetBrains Mono is for all numeric values.

### 1b. Update `globals.css` (or wherever `@import "tailwindcss"` lives)

Replace the entire `@theme` block with:

```css
@import "tailwindcss";

@theme {
  /* Fonts */
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Bricolage Grotesque", "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;

  /* Surfaces — dark */
  --color-bg-deep: #060B17;          /* page background, lowest layer */
  --color-bg-base: #0A1020;          /* default dark surface */
  --color-bg-raised: #0F1626;        /* cards on dark */
  --color-bg-overlay: #161E32;       /* hover/elevated state */

  /* Surfaces — light */
  --color-surface: #F4F6FB;          /* canonical light page bg — replaces #F2F4F8 / #F3F5FA / #F8F9FA */
  --color-surface-raised: #FFFFFF;   /* cards on light */
  --color-surface-subtle: #FAFBFD;   /* table header, subtle banded rows */

  /* Borders */
  --color-border-hairline: rgba(255, 255, 255, 0.06);
  --color-border-soft: rgba(255, 255, 255, 0.10);
  --color-border-strong: rgba(255, 255, 255, 0.16);
  --color-border-light: #EDF0F5;     /* light-mode card borders */

  /* Text — dark surfaces */
  --color-text-primary: #F1F4F9;
  --color-text-secondary: #A8B0C0;
  --color-text-tertiary: #6B7489;
  --color-text-disabled: #4A5165;

  /* Text — light surfaces */
  --color-ink-primary: #0E1424;
  --color-ink-secondary: #4A5468;
  --color-ink-tertiary: #8B95A8;

  /* Accents */
  --color-gold: #C9A961;
  --color-gold-bright: #E5C07A;
  --color-gold-deep: #8C7440;
  --color-silver: #B5BCC9;
  --color-bronze: #C28A57;

  /* Semantic */
  --color-pos: #34D399;              /* positive deltas — slightly muted from current green-400 */
  --color-pos-bg: rgba(52, 211, 153, 0.12);
  --color-neg: #F87171;
  --color-neg-bg: rgba(248, 113, 113, 0.10);

  /* Type scale */
  --text-display-xl: 3.5rem;         /* 56px — hero team names desktop */
  --text-display-lg: 2.5rem;         /* 40px — player names, page titles */
  --text-display-md: 1.75rem;        /* 28px — section heroes mobile */
  --text-heading: 1.125rem;          /* 18px — card titles */
  --text-body-lg: 1rem;              /* 16px — primary body */
  --text-body: 0.9375rem;            /* 15px — default body */
  --text-body-sm: 0.8125rem;         /* 13px — secondary text */
  --text-label: 0.6875rem;           /* 11px — uppercase labels */
  --text-micro: 0.625rem;            /* 10px — micro labels */

  /* Numeric scale (use with font-mono) */
  --text-num-xl: 3rem;               /* 48px — hero stat values */
  --text-num-lg: 1.5rem;             /* 24px — table points, player card points */
  --text-num-md: 1.125rem;           /* 18px — secondary numbers */
  --text-num-sm: 0.875rem;           /* 14px — small deltas */
}

/* Body defaults: tabular numerals everywhere */
html {
  font-family: var(--font-sans);
  font-feature-settings: "tnum" 1, "ss01" 1;
}

/* Helper class — apply to any element rendering numeric values */
.num {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0;
}

/* Display utility — for hero/branding moments only */
.font-display {
  font-family: var(--font-display);
}
```

**After this step, run the dev server and verify:**
- Body text is now Inter (look at table headers, navigation, breadcrumbs — they should look slightly different/cleaner)
- Numbers using `font-mono` are now JetBrains Mono (the points table values, player card points)
- Bricolage is no longer the default — it's only on elements that explicitly use `font-display` (none yet)

**Show me the diff and a description of what changed before continuing.**

---

## STEP 2 — Apply `.num` class to every numeric display

Search the codebase for every place numbers render. For each, the existing `font-mono` class can stay, but **add `num` class** so it picks up our token + tabular-nums + zero letter-spacing.

Specific locations to update (do not miss any):

**`TeamsPage.tsx` (`TeamCard`):**
- The "X,XXX pts" line: `<p className="text-white/30 text-[10px] font-mono mt-1.5 tracking-wider">` → change `font-mono` to `num`
- The "+X today" pill: `<span className="... text-green-400 text-[9px] sm:text-[10px] font-bold ...">` → wrap the number portion in a `<span className="num">+{team.pointsChange}</span>` (keep "today" text in the surrounding span)
- The rank badge "#1", "#2", "#3" — these stay as-is (they're part of badge styling)

**`TeamDetailsPage.tsx`:**
- Hero `#{team.rank}` rank pill — wrap the digits in `.num`
- Hero `{team.points}.toLocaleString() pts` pill — wrap the number portion in `.num`
- Hero `+{team.pointsChange} today` pill — wrap the number in `.num`
- `TodayScorerRow`: the `+{player.pointsToday}` value — replace `font-mono font-black text-xs` with `num font-bold text-xs`
- `PlayingPlayerRow`: the `{player.lastGamePoints}` value — replace `font-mono` with `num`
- `PlayerRow` (in role grid): the points value — replace `font-mono` (if present, else add) with `num`. Same for the `+{player.pointsToday}` delta and `{player.pointsToday}` negative delta.

**`PlayerPage.tsx`:**
- Hero stats trio (`totalPoints`, `gamesCount`, `avgPts`): each currently uses `font-mono` — change to `num`
- `MatchRow` total points: `font-mono text-base text-gray-900` → `num text-base text-gray-900`
- `StatChip` value: `font-black` (no mono) — add `num`
- `StatGroup` row values: `font-mono tabular-nums` → `num` (drops redundancy)
- `TimelineList` `+{row.pointsGained}`: `font-mono tabular-nums` → `num`
- `TimelineList` cumulative pts: replace inline number with `<span className="num">{...}</span>`

**`LeaderboardPage.tsx`:**
- All `font-mono` instances on points, gains, gaps → replace with `num`
- Champion/Runner-up banner pts text → `num`
- Top performers `+{p.points}` delta → `num`

**Verify after this step:**
- Numbers are visibly tighter (no more loose digit/comma spacing)
- All numeric values render in JetBrains Mono (subtle but consistent style)
- "4,855.8" looks tight, with comma snug to digits

---

## STEP 3 — Surface color consolidation

Three different off-white page backgrounds currently exist:
- `bg-[#F2F4F8]` (PlayerPage)
- `bg-[#F3F5FA]` (LeaderboardPage)
- `bg-[#F8F9FA]` (table headers)

Replace ALL of them:
- `bg-[#F2F4F8]` and `bg-[#F3F5FA]` → `bg-surface`
- `bg-[#F8F9FA]` → `bg-surface-subtle`
- `#F8F9FA` in inline styles → use `var(--color-surface-subtle)` or move to className

Also:
- `bg-[#0B1422]` (PlayerPage hero) → `bg-bg-deep` (or use the closest token; `--color-bg-deep` is `#060B17`, slightly deeper — pick whichever looks better)
- `bg-[#080D1A]` (TeamDetailsPage team switcher) → `bg-bg-deep`
- `bg-[#060C1A]` (TeamDetailsPage loading state) → `bg-bg-deep`
- `bg-[#071026]` (TeamsPage) → `bg-bg-deep`
- The hardcoded `DARK = '#07101F'` constant in `TeamsPage.tsx` → keep the constant but set it to `'#060B17'` (matching `--color-bg-deep`) for consistency. Or read it from CSS via a wrapper if Tailwind v4 allows.

Light-mode card surfaces:
- All `bg-white` on cards stays (it maps to `--color-surface-raised` = `#FFFFFF`)

Borders:
- `border-gray-100` → `border-border-light`
- `border-gray-200` → `border-border-light`
- `divide-gray-50` and `divide-gray-100` → leave for now (Tailwind defaults are fine for divides)

---

## STEP 4 — Replace emoji medals with proper badges

In `LeaderboardPage.tsx`, the `StandingsRow` rank cell uses `🏆` and `🥈` emojis for past-season champion/runner-up. Cross-platform emoji rendering is inconsistent and looks amateur.

Replace with inline SVG components. Add to the top of `LeaderboardPage.tsx`:

```tsx
function TrophyIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 4h12v3a6 6 0 11-12 0V4z" fill="url(#tg)" />
      <path d="M9 14h6v3H9z" fill="url(#tg)" />
      <path d="M8 17h8v2H8z" fill="url(#tg)" />
      <path d="M3 5h3v2a3 3 0 003 3v1a4 4 0 01-4-4V5zM18 5h3v2a4 4 0 01-4 4v-1a3 3 0 003-3V5z" fill="url(#tg)" />
      <defs>
        <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E5C07A" />
          <stop offset="1" stopColor="#8C7440" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function MedalIcon({ className = "", tone = "silver" }: { className?: string; tone?: "silver" | "bronze" }) {
  const colors = tone === "silver"
    ? { from: "#D8DDE6", to: "#7A8190" }
    : { from: "#D9A877", to: "#7B4A26" };
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="14" r="6" fill={`url(#m-${tone})`} />
      <path d="M9 3l3 8 3-8h-2l-1 3-1-3H9z" fill={`url(#m-${tone})`} />
      <defs>
        <linearGradient id={`m-${tone}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={colors.from} />
          <stop offset="1" stopColor={colors.to} />
        </linearGradient>
      </defs>
    </svg>
  );
}
```

Then in `StandingsRow`:
- `<span className="text-xl">🏆</span>` → `<TrophyIcon className="w-6 h-6" />`
- `<span className="text-xl">🥈</span>` → `<MedalIcon className="w-6 h-6" tone="silver" />`

Also in the **Champion/Runner-up banner** at the top of past-season views:
- `🏆 Champion` → put the trophy SVG inline (smaller, ~14px) before the text
- `🥈 Runner-up` → silver medal SVG inline before the text

In `TeamDetailsPage.tsx`:
- The `🏆` next to team name in hero → `<TrophyIcon className="w-4 h-4" />` (move the SVG component to a shared file, e.g., `components/Icons.tsx`, since it's used in multiple places now)

---

## STEP 5 — Type scale & weight refinement

Replace scattered arbitrary text sizes with semantic ones. This is search-and-replace across files:

**Common replacements:**
- `text-[10px]` (label/uppercase contexts) → `text-[var(--text-micro)]` or just `text-[10px]` if rare
- `text-[11px]` (small labels) → `text-[var(--text-label)]`
- `font-black` on hero team names → `font-display font-bold` (Bricolage 700 is more elegant than 900). Apply to:
  - `TeamCard` h3 team name
  - `TeamDetailsPage` h1 team name
  - `PlayerPage` h1 player name
  - `TeamsPage` "Fantasy League · 2026" subtitle stays as-is

**Specifically remove `font-black` (= 900) from hero typography and use `font-display font-bold` (= 700) instead.** The visual difference is "yelling" vs "confident." We want confident.

For body labels (uppercase), keep `font-black` — it works well at small sizes.

For numeric displays, the `.num` class brings JetBrains Mono 600 by default (set in `@theme`). Don't add `font-bold` or `font-black` on top of `.num`.

---

## STEP 6 — TeamCard polish

The `TeamCard` SVG wave architecture stays. Small refinements:

1. The `DARK` constant now reads from `--color-bg-deep` for consistency.
2. The avatar "AR/AB/KP" text currently uses `font-black` → change to `font-display font-bold`. This reduces visual aggression on the monogram.
3. The team name in the footer: change `font-black` → `font-display font-bold`. Keep size and tracking.
4. The "+X today" pill: tighten by using `var(--color-pos)` text on `var(--color-pos-bg)` background:
   ```tsx
   className="mt-1.5 inline-flex items-center text-[9px] sm:text-[10px] font-bold rounded-full px-2 py-0.5"
   style={{ color: 'var(--color-pos)', background: 'var(--color-pos-bg)', border: '1px solid rgba(52, 211, 153, 0.18)' }}
   ```
   Then wrap `+{team.pointsChange}` in `<span className="num">`.

---

## STEP 7 — TeamDetailsPage polish

1. Hero h1 team name: `font-black` → `font-display font-bold`, bump size on desktop:
   ```tsx
   <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-white leading-tight">
   ```
2. The Today's Scorers card header label "TODAY'S SCORERS" stays in `font-black` (it's a small uppercase label — appropriate context).
3. Player role section h2 ("WICKET-KEEPERS", "BATTERS"): keep `font-black` — these are micro labels.
4. `PlayerRow` (squad grid): the player name uses `font-bold`. Leave it — Inter 700 will look much better than Bricolage 700 at this size, and it's now the default sans.
5. The points value in `PlayerRow` uses inline color via `style={{ color: teamColor }}`. Add `num` class so it gets JetBrains Mono.

---

## STEP 8 — PlayerPage hero polish

1. h1 player name: `font-black` → `font-display font-bold`. Keep `tracking-tight`.
2. Stats trio numbers: `font-mono` → `num`. Drop `font-black`.
3. The role badge: keep current styling — it's good.
4. The colored left strip on the hero is fine. Subtle and effective.

---

## STEP 9 — LeaderboardPage polish

1. Header h1 "Points Table": `font-black` stays — it's small caps so weight is appropriate.
2. Table header cells: keep `font-black uppercase tracking-widest` — works at this size.
3. Champion/Runner-up banner team names: `font-black` → `font-display font-bold`.
4. Banner pts: `font-mono font-bold` → `num`.
5. Standings row team names: `font-bold` stays (now Inter 700 — will look much cleaner).
6. Standings row points: `font-black font-mono` → add `num`.
7. The "LEADER" / "CHAMPION" pill in P1 row: change to gold tones using new tokens:
   ```tsx
   <span className="font-bold text-xs px-2 py-0.5 rounded-md"
         style={{ color: 'var(--color-gold)', background: 'rgba(201, 169, 97, 0.10)', border: '1px solid rgba(201, 169, 97, 0.25)' }}>
     {isActiveSeason ? 'LEADER' : 'CHAMPION'}
   </span>
   ```
8. Negative gaps (`−326.6`): change from `text-red-500` to a softer tone:
   ```tsx
   <span className="num text-sm" style={{ color: 'var(--color-neg)' }}>−{gapToFirst.toLocaleString()}</span>
   ```
9. Top Performers sidebar item names: `font-bold` stays.
10. Top Performers `+{p.points}`: `font-mono font-bold` → `num font-semibold`.
11. **Add subtle leader emphasis**: the row where `rank === 1 && isActiveSeason` should get a faint gold left border:
    ```tsx
    style={{
      ...(isFirst && isActiveSeason ? { boxShadow: 'inset 3px 0 0 var(--color-gold)' } : {})
    }}
    ```
    Apply to the `<tr>` element. This signals "this is the leader" without overwhelming the row.

---

## STEP 10 — Mobile QA pass

After all the above, walk through these pages at 380px width:
- `/` (TeamsPage)
- `/team/ar` (TeamDetailsPage with Today's Scorers)
- `/team/tr` (different team color)
- `/player/<any>` (PlayerPage)
- `/points-table` (LeaderboardPage)

Specifically verify:
1. No horizontal overflow (except intentional scrollers like the team switcher strip)
2. All tap targets ≥ 40px
3. Numbers don't shrink below 14px
4. Today's Scorers card stacks below hero on mobile (already handled — verify)
5. Table on LeaderboardPage either fits at 380px or scrolls horizontally with visible affordance

---

## What "done" looks like

- Numbers everywhere render in JetBrains Mono with no loose digit spacing
- Bricolage is reserved for hero moments only (team names, player names, big monograms) — body/UI is Inter
- One canonical light surface color, one canonical dark surface color
- No emoji medals — proper SVG icons throughout
- Hero typography feels confident (700 weight) instead of shouty (900 weight)
- Leader row in points table has subtle gold emphasis
- All existing features still functional; no regressions

---

## Order of operations checklist

After completing each step, paste a brief summary of files changed and wait for approval:

- [ ] Step 1: Foundation (fonts loaded, tokens defined, `.num` class created)
- [ ] Step 2: `.num` class applied to all number displays
- [ ] Step 3: Surface colors consolidated
- [ ] Step 4: Emoji medals replaced with SVG
- [ ] Step 5: Type scale & weight refinement
- [ ] Step 6: TeamCard polish
- [ ] Step 7: TeamDetailsPage polish
- [ ] Step 8: PlayerPage hero polish
- [ ] Step 9: LeaderboardPage polish
- [ ] Step 10: Mobile QA pass

If at any point a Tailwind v4 class doesn't work as expected (e.g., `bg-bg-deep` not recognized), check that the token is properly defined in `@theme` and that Tailwind v4's class-from-token syntax matches. If `bg-bg-deep` reads weirdly, alias the token: define `--color-deep: #060B17` and use `bg-deep`.