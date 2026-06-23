# GymBuddy AI Coach — Design System

Adapted from the Claude (Anthropic) design system. Warm, editorial, and energetic — positioned against the cold, clinical look of typical fitness apps.

---

## Core Identity

**Brand voice:** Knowledgeable coach meets supportive friend. Clear, motivating, never intimidating.

**Positioning:** Warm energy over clinical blue. Cream canvases + vibrant accent + dark dashboard surfaces.

---

## Color Tokens

```
--color-canvas:       #faf9f5   /* warm cream — primary page background */
--color-card:         #f3f1eb   /* light cream — card surfaces */
--color-surface-dark: #181715   /* near-black navy — dashboard / data panels */

--color-accent:       #22c55e   /* energetic green — primary CTA, progress, PRs */
--color-accent-warm:  #f97316   /* orange — intensity indicators, warnings */
--color-coral:        #cc785c   /* muted coral — secondary accent, badges */

--color-text-primary: #1a1a1a
--color-text-muted:   #6b7280
--color-text-inverse: #faf9f5   /* on dark surfaces */

--color-border:       rgba(0,0,0,0.08)   /* hairline borders */
--color-border-dark:  rgba(255,255,255,0.1)
```

---

## Typography

### Font Stack
| Role | Primary | Fallback |
|------|---------|----------|
| Display / Hero | Cormorant Garamond | EB Garamond, Georgia, serif |
| Body / UI | Inter | system-ui, sans-serif |
| Data / Code | JetBrains Mono | monospace |

### Scale
```
--text-hero:    64px / 400 weight / -1.5px tracking   /* hero headlines */
--text-display: 40px / 400 weight / -1.0px tracking   /* section titles */
--text-heading: 28px / 500 weight / -0.3px tracking   /* card headings */
--text-body:    16px / 400 weight / 0px tracking       /* body copy */
--text-label:   14px / 500 weight / 0.1px tracking    /* labels, badges */
--text-caption: 12px / 400 weight / 0.2px tracking    /* timestamps, meta */
```

---

## Spacing

```
--spacing-section: 96px    /* between page sections */
--spacing-card:    32px    /* internal card padding */
--spacing-gap:     24px    /* between grid items */
--spacing-inline:  16px    /* inline element gaps */
--spacing-tight:   8px     /* compact contexts */
```

---

## Border Radius

```
--radius-sm:   8px    /* buttons, inputs, tags */
--radius-md:   12px   /* cards */
--radius-lg:   16px   /* hero containers, modals */
--radius-pill: 9999px /* badges, chips */
```

---

## Elevation

Depth comes from **surface color contrast**, not shadows. Avoid heavy box-shadows.

```
--shadow-card: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
--shadow-modal: 0 8px 32px rgba(0,0,0,0.12);
```

---

## Components

### Button
```
Primary:   bg(--color-accent)  text(white)         radius(--radius-sm)  px-6 py-3
Secondary: bg(transparent)     border(--color-border) text(--color-text-primary)
Ghost:     bg(transparent)     text(--color-accent)
Danger:    bg(#ef4444)         text(white)
```

### Card — Light
```
bg(--color-card)  border(--color-border)  radius(--radius-md)  p(--spacing-card)
```

### Card — Dark (Dashboard / Metrics)
```
bg(--color-surface-dark)  border(--color-border-dark)  radius(--radius-md)  p(--spacing-card)
text(--color-text-inverse)
Use for: workout stats, PRs, progress charts, form-check video panels
```

### Badge / Tag
```
radius(--radius-pill)  px-3 py-1  text(--text-label)
Green variant:  bg(#dcfce7)  text(#16a34a)   — completed, active
Orange variant: bg(#ffedd5)  text(#ea580c)   — in progress, moderate intensity
Red variant:    bg(#fee2e2)  text(#dc2626)   — high intensity, missed
```

### Input
```
bg(white)  border(--color-border)  radius(--radius-sm)  px-4 py-3
focus: border(--color-accent) outline(none) ring(2px --color-accent/20)
```

---

## Page Section Rhythm

Alternate these surface types top-to-bottom for visual pacing:

1. **Cream hero band** — headline, subtext, primary CTA
2. **Light card grid** — feature cards (3-up: Strength / Cardio / Recovery)
3. **Dark dashboard mockup** — screenshot of workout tracker / AI coaching chat
4. **Cream feature band** — social proof / how-it-works steps
5. **Accent CTA band** — membership plans (Basic / Coach / Elite)

---

## Layout Grid

```
Max-width: 1200px  centered  px-6
Columns:   12-col grid  gap(--spacing-gap)

Desktop:  feature cards → 3-up, pricing → 3-up, exercise cards → 4-up
Tablet:   feature cards → 2-up, pricing → 2-up
Mobile:   all → 1-up, hero → single column, nav → hamburger
```

---

## Data / Metrics Panels (Dark Surface)

Use `--color-surface-dark` for any panel showing:
- Strength progress charts (line/bar)
- Personal records (PRs)
- Weekly volume metrics
- AI coaching conversation thread
- Form-check video player

Typography on dark: `--color-text-inverse` for primary, `rgba(255,255,255,0.5)` for muted.
Accent lines/bars: `--color-accent` (green) for positive trends, `--color-accent-warm` (orange) for fatigue alerts.

---

## Iconography

- Style: outline, 1.5px stroke, rounded caps
- Size: 20px inline, 24px standalone, 16px in labels
- Library: Lucide Icons (preferred) or Heroicons

---

## Motion

```
--duration-fast:   150ms  ease-out   /* hover states */
--duration-base:   250ms  ease-out   /* panel transitions */
--duration-slow:   400ms  ease-in-out /* page transitions, modals */
```

Avoid gratuitous animation. Motion should confirm action or reveal information.

---

## Fitness-Specific Patterns

| Pattern | Treatment |
|---------|-----------|
| Exercise difficulty | Badge: green(Beginner) / orange(Intermediate) / red(Advanced) |
| Workout completion | Progress ring using `--color-accent` on dark card |
| AI coach message | Cream bubble, serif quote style, coral left-border |
| User message | Dark bubble, right-aligned, sans-serif |
| Rest timer | Large monospace countdown on dark surface |
| PR achievement | Full-bleed coral card with display serif headline |
| Muscle group tags | Pill badges, muted color, small label text |

---

## Membership Tiers

| Tier | Color Treatment |
|------|----------------|
| Basic | Border card, muted |
| Coach | Accent green highlight, "Most Popular" badge |
| Elite | Dark surface card, coral accent border |
