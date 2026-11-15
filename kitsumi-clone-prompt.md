# Build Prompt — "Japanese Learning Platform" (Kitsumi-style clone)

> **How to use:** paste this whole file into Claude Code / Cursor / v0 / Lovable as the build spec.
> Build it page by page, in the order given.
>
> **Legal note before you start:** this spec describes *layout, interaction and a design system*. Do **not** copy the original brand name, wordmark, fox-mascot artwork, illustrations, lesson audio/video, or transcript content. Use your own product name, your own mascot/illustrations, and your own (or properly licensed) learning content. Everything below is written so you can swap the brand in one place.

---

## 1. Product in one paragraph

A gamified Japanese-learning web app for Vietnamese speakers. The core study loop is **dictation (chép chính tả)** and **shadowing (luyện phát âm)** on top of real Japanese audio/YouTube clips, graded by JLPT level N5→N1. Around that loop sits a full gamification layer: daily streak, XP + levels, daily missions, a soft currency ("dango"), a shop with avatar frames/wallpapers, streak-freeze items, 90-day activity heatmap, streak/level milestone rewards, and a weekly leaderboard. Supporting surfaces: vocabulary SRS flashcards, a grammar library, a global review queue, JLPT mock exams, mini-games, a community forum, personal notes and a personal vocabulary list.

---

## 2. Tech stack (match this exactly)

- **Next.js 15 (App Router, Turbopack)** + React 19, TypeScript strict.
- **Tailwind CSS v3** with CSS-variable-driven theming (`hsl`-free; the vars hold **space-separated RGB triplets**, consumed as `rgb(var(--x) / <alpha-value>)`).
- **shadcn/ui** (Radix primitives) for Button, Card, Dialog, Popover, DropdownMenu, Tabs, Tooltip, Sheet, Progress, Avatar, Badge, Skeleton, ScrollArea, Switch, Select.
- `tailwindcss-animate`, `lucide-react` icons, `next-themes` for light/dark.
- **next-intl** for i18n with a locale path prefix: every route is `/[locale]/...` (`vi` default, `en`, `ja` as scaffolding). All UI copy comes from message catalogs — never hardcode Vietnamese in JSX.
- TanStack Query for client data, Zustand for ephemeral player state (audio position, dictation input, reveal state).
- Server: Next route handlers + Prisma + PostgreSQL. Auth via Auth.js (Google + email). Deployment target: Vercel.
- Audio: native `<audio>` with a custom transport; YouTube lessons use the YouTube IFrame API with a clip-range loop.

---

## 3. Design system (copy these tokens verbatim)

### 3.1 Tokens — light theme (`:root`)

```css
:root {
  /* surfaces */
  --background: 255 255 255;
  --foreground: 13 13 13;
  --canvas: 247 247 247;          /* app background behind cards */
  --card: 255 255 255;
  --card-foreground: 13 13 13;
  --popover: 255 255 255;
  --popover-foreground: 13 13 13;
  --popover-glass: #ffffffe5;
  --surface-glass: #ffffff8e;

  /* brand */
  --primary: 238 95 89;           /* #ee5f59 coral-red */
  --primary-dark: 201 62 56;      /* hover */
  --primary-pressed: 124 33 31;
  --primary-foreground: 255 255 255;
  --ring: 169 49 45;

  --secondary: 13 13 13;
  --secondary-dark: 92 92 92;
  --secondary-pressed: 126 126 126;
  --secondary-foreground: 245 245 245;

  /* neutrals */
  --muted: 239 239 239;
  --muted-dark: 219 219 219;
  --muted-foreground: 92 92 92;
  --accent: 239 239 239;
  --accent-dark: 219 219 219;
  --accent-foreground: 13 13 13;
  --border: 226 226 226;
  --border-dark: 208 208 208;
  --border-pale: #01010110;
  --border-subtle: #0101011d;
  --input: 226 226 226;

  /* tinted brand washes (used on nav active, chips, hovers) */
  --accent-subtle: #ee5f5914;
  --accent-subtle-hover: #ee5f5929;
  --accent-subtle-pressed: #ee5f593d;

  --neutral-flat-hover: #05050508;
  --neutral-flat-pressed: #01010110;
  --neutral-subtle: #01010110;
  --neutral-subtle-hover: #02020215;
  --neutral-subtle-pressed: #0101011d;

  /* text-on-surface opacities */
  --content-base: #000000a3;
  --content-light: #00000081;
  --content-on-brights: #000000db;
  --content-placeholder: #0004;

  /* status */
  --success: 63 171 83;  --success-dark: 37 152 66;  --success-foreground: 255 255 255;
  --positive-subtle: #01b40922; --positive-border: #01940956; --positive-content: #006425;
  --destructive: 229 83 46; --destructive-dark: 208 62 25; --destructive-foreground: 255 255 255;
  --negative-subtle: #ff350214; --negative-border: #ff36003d; --negative-content: #941b00;
  --info: 10 133 255; --info-dark: 0 116 224; --info-foreground: 255 255 255;
  --info-subtle: #0267ff19; --info-border: #006dff50; --info-content: #004e98;

  /* JLPT level colors — used for every level badge, app-wide */
  --jlpt-n1-solid: #e5532e; --jlpt-n1-subtle: #e5532e1f; --jlpt-n1-border: #e5532e4d; --jlpt-n1-content: #8f2a12;
  --jlpt-n2-solid: #7755e7; --jlpt-n2-subtle: #7755e71f; --jlpt-n2-border: #7755e74d; --jlpt-n2-content: #3f2a8f;
  --jlpt-n3-solid: #0a85ff; --jlpt-n3-subtle: #0a85ff1f; --jlpt-n3-border: #0a85ff4d; --jlpt-n3-content: #0a4f99;
  --jlpt-n4-solid: #02b19c; --jlpt-n4-subtle: #02b19c21; --jlpt-n4-border: #02b19c52; --jlpt-n4-content: #04695d;
  --jlpt-n5-solid: #3fab53; --jlpt-n5-subtle: #3fab5321; --jlpt-n5-border: #3fab5352; --jlpt-n5-content: #1d6b2c;

  /* misc */
  --overlay: #00000040;
  --shadow-light: #0000000a;
  --shadow-strong: #0000001f;
  --gradient-light: linear-gradient(90deg, #fff5f4, #ee5f59, #0d0d0d);
  --radius: 0.75rem;
  --sidebar-width: 256px;
  --sidebar-width-collapsed: 64px;
}
```

### 3.2 Tokens — dark theme (`.dark`)

```css
.dark {
  --background: 25 25 25;  --foreground: 245 245 245;
  --canvas: 25 25 25;      --card: 33 33 33;  --card-foreground: 245 245 245;
  --popover: 36 36 36;     --popover-foreground: 245 245 245;
  --primary: 238 95 89;    --primary-dark: 245 125 120;  --primary-pressed: 255 154 150;
  --secondary: 245 245 245; --secondary-foreground: 13 13 13;
  --secondary-dark: 206 206 206; --secondary-pressed: 149 149 149;
  --muted: 33 33 33;       --muted-foreground: 149 149 149;  --muted-dark: 56 56 56;
  --border: 70 70 70;      --border-dark: 96 96 96;  --input: 70 70 70;  --ring: 238 95 89;
  --accent-subtle: #ee5f5920; --accent-subtle-hover: #ee5f593d; --accent-subtle-pressed: #ee5f5952;
  --positive-subtle: #4dfd6515; --positive-border: #2fff5330; --positive-content: #d1ffd8;
  --jlpt-n1-solid: #f4704e; --jlpt-n1-subtle: #ff7a541f; --jlpt-n1-border: #ff7a543d; --jlpt-n1-content: #ffdcd2;
  --jlpt-n2-solid: #967af5; --jlpt-n2-subtle: #a38dff1f; --jlpt-n2-border: #a38dff3d; --jlpt-n2-content: #e2dbff;
  --jlpt-n3-solid: #4da5ff; --jlpt-n3-subtle: #5cb2ff1f; --jlpt-n3-border: #5cb2ff3d; --jlpt-n3-content: #d6ebff;
  --jlpt-n4-solid: #20cab4; --jlpt-n4-subtle: #40ffe71a; --jlpt-n4-border: #40ffe738; --jlpt-n4-content: #cdfff8;
  --jlpt-n5-solid: #4dc864; --jlpt-n5-subtle: #4dfd651a; --jlpt-n5-border: #4dfd6538; --jlpt-n5-content: #d1ffd8;
}
```

Wire these into `tailwind.config.ts` as `colors: { primary: 'rgb(var(--primary) / <alpha-value>)', ... }` and `borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius) - 2px)', sm: 'calc(var(--radius) - 4px)' }`.

### 3.3 Typography

- `--font-inter: "Inter"` → all Latin/Vietnamese UI text (`next/font/google`, variable, `display: swap`).
- `--font-noto-sans-jp: "Noto Sans JP"` → every Japanese string (apply via a `.jp` utility class / `lang="ja"` selector).
- `--font-jetbrains-mono: "JetBrains Mono"` → timers, counters, romaji input.
- Scale: page title `text-3xl font-bold tracking-tight` (30px); section header `text-xl font-semibold` with a **4px coral left bar** (`border-l-4 border-primary pl-3 rounded-sm`) or a leading lucide icon in primary; card title `text-base font-semibold`; body `text-sm`; meta `text-xs text-muted-foreground`.

### 3.4 Shape, depth, motion

- Cards: `rounded-2xl border border-border bg-card` + a very soft shadow (`0 1px 2px var(--shadow-light)`). **No heavy shadows anywhere.**
- Interactive cards lift on hover: `hover:-translate-y-0.5 hover:shadow-[0_8px_24px_var(--shadow-light)] transition-all duration-200`.
- Pills/chips: `rounded-full px-3 py-1 text-xs font-medium`, tinted with the `*-subtle` tokens.
- Primary button: solid `--primary`, white text, `rounded-xl`, `h-10 px-4`, hover `--primary-dark`, active `--primary-pressed`, `focus-visible:ring-2 ring-ring ring-offset-2`.
- Everything animates in 150–250 ms, `ease-out`. Respect `prefers-reduced-motion`.
- Empty states always pair a friendly **mascot illustration** with a one-line title + one-line hint (e.g. "Nothing to review yet — come back later").

---

## 4. App shell

### 4.1 Sidebar (desktop, fixed left, `--sidebar-width` 256px)

Top → bottom:

1. **Brand row**: square app icon (rounded-lg, dark background) + wordmark in **coral, bold, 20px**.
2. **Primary nav** (lucide icons, 20px, label `text-sm font-medium`, 44px rows, `rounded-xl`, 8px horizontal padding):
   - Home `/[locale]/home` — `House`
   - Practice `/[locale]/practice` — `BookOpen`
   - Listening `/[locale]/listening` — `Headphones`
   - Speaking / pronunciation `/[locale]/speaking` — `Mic`
   - Vocabulary `/[locale]/vocabulary` — `Library`
   - Grammar `/[locale]/grammar` — `GraduationCap`
   - Review `/[locale]/review` — `Brain`
   - JLPT exams `/[locale]/exams` — `ClipboardCheck`
   - Games `/[locale]/games` — `Gamepad2`
3. **Section label** `COMMUNITY` (`text-[11px] font-semibold uppercase tracking-wider text-muted-foreground`), then:
   - Community `/[locale]/community`, Leaderboard `/[locale]/leaderboard`, Feedback `/[locale]/feedbacks`, Shop `/[locale]/shop`, My notes `/[locale]/my-notes`, My vocabulary `/[locale]/my-vocabulary`
4. **Log out** row in coral text.
5. **User card** pinned at the bottom: avatar with a **level ring + `Lv.N` badge** overlapping the bottom-left, display name, "Profile" subtitle → links to `/[locale]/profile`.
6. **Collapse control** at the very bottom: `«  Collapse` — collapses to `--sidebar-width-collapsed` (64px, icons only, labels become tooltips). Persist the state in `localStorage`.

**Active item style:** `bg-[--accent-subtle] text-primary font-semibold border border-[--accent-subtle-pressed] rounded-xl`, icon in coral.

### 4.2 Header (sticky, `h-16`, `bg-background/80 backdrop-blur`, bottom border)

Left→right: **search field** (`max-w-lg`, `rounded-xl bg-muted/60`, magnifier icon, placeholder "Dictionary" — opens a Japanese dictionary command palette on `⌘K`/`Ctrl+K`) · spacer · **theme toggle** (sun/moon) · **locale select** (flag + language name + chevron, Radix dropdown) · **notification bell** (dot when unread) · **three gamification pills**, each `rounded-full border h-9 px-3` with an icon + number and a popover on click:

| Pill | Icon | Value | Popover |
|---|---|---|---|
| Currency ("dango") | green dango/leaf glyph | `50` | balance, how to earn, link to shop |
| Daily missions | coral progress ring | `0/4` | list of today's 4 missions + rewards, link `/missions` |
| Streak | flame (orange) | `1` | current/longest streak, freeze cards owned, buy CTA |

### 4.3 Responsive

- `<1024px`: sidebar becomes a `Sheet` opened by a hamburger; a **bottom tab bar** appears with Home / Practice / Review / Games / Profile.
- `<768px`: all multi-column grids collapse to one column; the horizontal lesson carousels keep swipe-scrolling with snap points; study players stack (player → input → transcript, transcript collapsible).
- Touch targets ≥ 44px; the header pills collapse to icon+number only.

---

## 5. Page-by-page spec

### 5.1 `/[locale]` — marketing landing (logged-out)

Separate shell: top nav bar (brand · Listening · Speaking · Vocabulary · JLPT · "More" dropdown · theme toggle · locale · streak · avatar).
Hero: two columns on desktop — left: `text-5xl/tight font-bold` headline ("Learn Japanese with dictation and shadowing"), one-paragraph subhead in `text-muted-foreground`, one solid coral CTA "Start free →"; right: a collage of 3 overlapping rounded phone/video cards, rotated ±4°, floating sticker elements (headphones, pencil, speech bubble, sparkles) and a dashed circle outline, over a warm `#fff5f4` radial wash. Below: feature strip, how-it-works 3 steps, level grid N5→N1, testimonials, pricing/free CTA, footer.

### 5.2 `/[locale]/home` — dashboard (the flagship page; build this first)

Title block: `Welcome back` (30px bold) + subtitle "Keep your streak going and earn rewards".

**A. Streak / progress card** (full width, `rounded-2xl`, generous padding, 2 rows):
- Row 1, left: a big rounded-square tile with a flame glyph on a peach gradient; next to it "Current streak" label, **`1 day`** in `text-3xl font-bold`, and "Longest streak: 1 day" with a trophy icon in `text-xs`.
- Row 1, right: a square **level tile** (lavender background, number `1`), then "Level up to 2" with a sparkle icon, a **gradient progress bar** (`linear-gradient(90deg,#c13bb5,#ee5f59)` on a `bg-muted` track, `h-2 rounded-full`), `50 XP` right-aligned, and "88 XP to the next level" underneath.
- Row 2 — three inline status chips:
  1. green-tinted pill with check icon: "You've checked in today" (if not: a solid coral "Check in" button),
  2. amber-tinted pill with target icon: "Missions · 0/4" → opens missions,
  3. blue-tinted pill: snowflake icon + "Streak freeze card" + count `0` + a small outline **"Buy"** button with a cart icon.

**B. Quick review** card: header "Quick review" with a compass icon. Three equal-width **gradient action tiles** (`rounded-xl`, white text, icon chip on the left): orange→amber "STUDY VOCABULARY", coral→pink "LISTEN / SPEAK", violet→purple "STUDY GRAMMAR". Each shows a sub-line with the pending count, or "All caught up" when zero. Clicking routes into the matching review queue.

**C. "Today's featured lessons"** — horizontal snap-scroll carousel of **lesson cards** (see §6.1), ~6 items, arrows on hover at the edges, no visible scrollbar.

**D. 90-day activity heatmap** card:
- Header "Last 90 days" + calendar icon; hint "Click a day for details. Darker = more study."
- GitHub-style grid: columns = weeks, rows = Mon…Sun (labels T2,T3…CN), month labels above the first column of each month; cells `w-3.5 h-3.5 rounded-[3px]`, 5 intensity steps from `bg-muted` to deep green (`#216e39`-ish), today ringed in coral, selected day ringed in coral + filled.
- Legend row: "Less ▢▢▢▢▢ More", plus two key items: "Checked in" (outlined square) and "Streak freeze used" (snowflake square).
- To the right, two side panels: **selected-day panel** (full date, "Today" badge, a clock + minutes studied, or "No activity on this day") and **90-DAY SUMMARY** panel with three icon+label+value rows: Days studied `0 / 90`, Study time `0m`, Longest streak `0 days`.

**E. Bottom two-column grid** (`lg:grid-cols-2 gap-6`):

- **Milestone rewards** card — header + "Reach streak and level milestones to earn dango, badges and avatar frames", then a 2-chip segmented toggle: **By streak** / **By level** (active chip = solid coral). Below, a vertical list of milestone rows: left a lock/unlock icon tile, center the title ("3-day milestone"), a row of reward chips (dango amount with the dango glyph; `❄ ×1` freeze cards; circular badge/frame art), and a `text-xs text-muted-foreground` line "2 days to go"; right side a state button: **"Locked"** (outline, disabled) / **"Claim"** (solid coral, animated pulse) / **"Claimed"** (ghost + check). Milestone ladder: 3/7/14/30/60/90/120/180/270/365 days → 20/50/100/200/350/500/700/1,000/1,800/3,000 dango, with freeze cards ×1 from day 30, ×2 from day 120, ×3 at 365.
- **Leaderboard** card — header "Leaderboard" with a trophy icon, subtitle "See how you rank against other learners", a date range line "9 Nov → 15 Nov", then two filter rows: period chips **This week / This month**, and metric chips **XP earned / Study time**. Below: a **pinned "you" row** highlighted with `bg-[--accent-subtle] border-primary/40` showing your rank (or "Unranked"), avatar, name + a coral "You" badge, level, and value. Then rows `#1…#20`: rank chip (gold/silver/bronze tint for the top 3), avatar with level ring and `Lv.N` badge, name (underlined on hover), level, and the metric value with a clock icon, right-aligned (`14h 20m`). Rows divide with a hairline, hover `bg-muted/50`.

### 5.3 `/[locale]/practice`, `/[locale]/listening`, `/[locale]/speaking` — lesson catalogues

Same template, different intent copy and different target player.

- **Intro block** (listening/speaking only): centered question headline ("Why practise Japanese listening with dictation?") + one-line subhead; then a wrapped row of **topic hashtag chips** in `--accent-subtle` (`#日常会話 (Daily Conversation)`, `#Kids`, `#Music`, `#news`, `#anime`, `#podcast`, `#history`, `#jlpt`, `#ビジネス日本語`, `#旅行 (Travel)`, `#昔話 (Folktales)`, `#cooking`, `#vtuber`); then a 2-chip segmented control **"For beginners" / "For experienced learners"** (active = solid coral) and a small helper line under it.
- **Category sections**, repeated: a section header with the coral left bar — Japanese title + `(52 lessons)` in muted — and a **"See all →"** ghost button on the right; under it a horizontal snap carousel of lesson cards. Categories observed: 日常会話 (Daily Conversation), Kids, JLPT, ビジネス日本語 (Business Japanese), Music, News, Anime, Podcast, Travel, Folktales.
- Infinite-scroll more sections; skeleton cards while loading.

### 5.4 `/[locale]/listening/[lessonId]` — **dictation player** (core screen #1)

Breadcrumb row: `Practice › 日常会話 (Daily Conversation) › Lesson title` + right-side toggles **"Hide video"** and **"Hide transcript"** (outline buttons with eye icons).

Three columns on `xl` (`grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_320px]`), stacking on smaller screens:

1. **Left — media & controls**: elapsed-time chip `⏱ 0:00` top-left; the video player (or an audio-only card); a native-style transport (play, current/total `0:00 / 0:56`, scrub bar, volume, kebab menu); a small italic copyright notice; a **CONTROLS** label and two buttons: solid coral **"Start"** (play icon) and outline **"Replay"** (rotate icon). Under it a collapsible **COMMENTS** card with a count badge.
2. **Middle — the dictation workspace**: a difficulty segmented control **Easy / Normal / Hard** top-right (Hard = solid coral); a toolbar row (previous sentence, replay, play, next, **speed `1x`** menu, settings gear, keyboard-shortcuts icon); a bordered input area with the prompt "TYPE WHAT YOU HEAR:" and a large textarea placeholder "Type your answer here…"; below it, the **masked-word grid** — one tile per word in the sentence, each word rendered as **dots standing for kana** (`•• ••• •`), with an eye icon above each tile to reveal that word individually; a caption "Word reveals are factored into your score · Hover a word to count its kana"; then a full-width coral **"Reveal all words"** button and, under it, a second action button (check / next sentence).
3. **Right — transcript panel** (sticky, own scroll): header "TRANSCRIPT" + a right-aligned completion `0%` with a thin progress bar; then one card per sentence `#1`, `#2`, … each listing the sentence's words as masked dot-chips in a soft grid, with per-sentence edit and warning/report icons. The active sentence is ringed in coral; solved words turn into real kanji/kana in black.

Keyboard: `Space` play/pause, `←/→` ±2s, `Tab` next word, `Enter` submit, `Esc` blur. Grading is per-sentence, kana-normalised, ignoring punctuation and ASCII/full-width differences; correct words animate in green, wrong ones shake in red.

### 5.5 `/[locale]/speaking/[lessonId]` — **shadowing player** (core screen #2)

Breadcrumb + the lesson's JLPT badge; right-side "Hide transcript"; a small mascot avatar + elapsed timer in the breadcrumb row.

- **Left column**: transport (play, `0:00 / 0:56`, scrub, volume, kebab) + copyright note; a control row with an **"Auto-pause"** switch (on = coral), a solid coral **"Start"** button, a speed menu `1x`, a settings gear and a subtitle/image toggle; then two toggle chips **Furigana** and **Translation**.
- **Center stage**: the current sentence in very large Japanese type (`text-2xl md:text-3xl`), each word as its own block with **furigana ruby above the kanji** (small, muted), word gaps generous; underneath, the Vietnamese translation in italic muted text.
- **Record row**: a ghost **"Play my recording"** button (disabled until a take exists) + a solid coral **"Record"** button with a mic icon; while recording show a live waveform and a timer; after recording show an A/B compare (original ⇄ you) and a pronunciation score.
- **Right column — transcript**: same panel as the dictation player, but each sentence is rendered as **word chips with furigana** (tappable to hear just that word), plus the translation in muted italic under each sentence; current sentence card ringed in coral.
- Below: collapsible **COMMENTS**.

### 5.6 `/[locale]/vocabulary` — flashcards / SRS

- Page header: mascot avatar + title "Learn Japanese vocabulary" + subtitle; right-side actions: coral **"My vocabulary"**, green **"Games"**, outline **"What is spaced repetition?"**.
- **Stats card** split in two: left "STUDY STATS" with 2×2 icon tiles (Total cards `0`, Due `0`, Total reviews `0`, Accuracy `0%`); right "CARD STATUS" with four small stacked bar/count tiles in blue/indigo/green/red: Learning, Reviewing, Mastered, Total.
- Two-column grid below: left a compact **leaderboard card** ("Top vocabulary learners", "Updated 15/11/2026 10:11", rows with medal chips, avatar, level, card count, "See all ›"); right **"MY DECKS" `0/3 decks`** with a `+ Create deck` coral button, and an **empty state** (dashed-border card, folder-plus icon, "No decks yet", hint line, solid coral `+ Create your first deck`).
- Deck detail: card browser, study mode (flip animation, Again/Hard/Good/Easy buttons in red/amber/green/blue), SM-2 scheduling.

### 5.7 `/[locale]/grammar` — grammar library

- Header: graduation-cap icon + "Japanese grammar" + subtitle.
- **Progress banner** in a coral-tinted card: label "YOUR PROGRESS", "Start your first lesson", helper line, three inline counters (Learning `0`, Reviewing `0`, Mastered `0`) each with its own pastel icon tile, and a right-side solid coral **"Open my study list →"**.
- **Level tabs**: `JLPT N5 | N4 | N3 | N2 | N1` (active = solid coral pill). A small italic copyright line under the tabs.
- **Status filter chips**: All / Not started / Learning / Reviewing / Mastered.
- **Search input**: "Search grammar by name or reading…".
- **Two-column card grid**: each card = grammar pattern in bold Japanese with furigana, a JLPT badge top-right, the romaji/reading line, a 1–2 line Vietnamese explanation, and a footer row with `📖 1 example` + a grey tag chip (e.g. `#断定`). Hover lifts the card; click opens the detail page with examples, audio, notes and an "Add to review" button.

### 5.8 `/[locale]/review` — global review queue

Single centered card; when empty: mascot illustration (fox reading) + "No items to review." + "Come back later for new cards!". When non-empty: a queue summary by source (vocabulary / grammar / dictation sentences) and a big coral "Start reviewing" button leading to a full-screen review session.

### 5.9 `/[locale]/exams` — JLPT mock tests

- Header "JLPT mock exams" + subtitle; right-side: dark **"History"** button (clock icon) and green **"Statistics"** button.
- **Level grid** (`md:grid-cols-3`): five big cards N5…N1. Each: small "JLPT" label, the level in `text-5xl font-bold`, a soft diagonal colour wash in that level's hue (green→N5, teal→N4, blue→N3, violet→N2, coral→N1) bleeding from the right edge, meta rows "5 exams" and "298 attempts", and a circular arrow button bottom-right in the level colour.
- **Statistics** card: "Exams taken `1`", "Passed `0/1`", "Average `80%`", "Best `80%`", "Most recent `80%`" as pastel tiles; plus a "Weakest areas" list of tag chips.
- **History** card: rows with a green check circle, exam title, source chips, date + duration, score `4/5 · 8:16`, and a "See results →" button.
- Exam runner: one question per screen or a paper-style list, a sticky countdown timer, a question navigator grid, auto-submit, then a results screen with per-section breakdown.

### 5.10 `/[locale]/games` — mini-games hub

- **Banner card** (coral-tinted, rounded-2xl): gamepad icon tile + "Games" + "Play 5 minutes, remember words for a week", plus a row of 10 pastel circular icon chips (one per game type).
- Section "Vocabulary games `10`", then a `lg:grid-cols-4` grid of **game cards**: a 16:9 illustrated cover with two corner badges (`✦ NEW`, `PLAY ALONE` / `MULTIPLAYER`), the title with a small coloured icon, a 2-line description, and a full-width coloured **"Play now →"** button whose colour matches the game (coral, blue, amber, green, violet…). Games seen: shoot-the-word, word-rain, spelling bee, fruit-throw, cloud-runner, bridge-builder, word-chain, meteor.

### 5.11 `/[locale]/shop`

- Header "Shop" + a subtitle about earning dango, right side a **balance pill** (`🍡 50`).
- Tabs: **Shop** / **Inventory**.
- **Featured banner** (blue-tinted): snowflake tile + "Buy a streak freeze card" + description + "0 / 7 · 5,000 / day" meta + a coral **"Buy"** button with a cart icon.
- Category chips: **All** (solid coral) / **Avatar frames** / **Wallpapers**.
- **Product grid** (`lg:grid-cols-4`): each card = square artwork on a pastel background, a **rarity badge** top-right (`EPIC` violet, `RARE` blue, `COMMON` grey), the item name, price row (`🍡 15,000`), and a full-width coral **"Buy"** button (disabled/greyed when unaffordable; "Owned"/"Equip" when owned). Purchase opens a confirm dialog.

### 5.12 `/[locale]/leaderboard`

Full-page version of the dashboard leaderboard: period tabs (This week / This month / All time), metric tabs (XP / Study time / Lessons), a **top-3 podium** with large avatars, level rings and crowns, then the ranked table (rank, user, level, streak, value) with your own row pinned at the bottom as a sticky bar.

### 5.13 `/[locale]/community`

Two columns. **Left rail** — "Topics" card: "All" row with a people icon, then hashtag rows (Learning Japanese, Study abroad, Travel, Translation, Find a study partner, Find a tutor, Japanese jobs, Other, Sharing corner); active row = `--accent-subtle` + coral text; a mascot illustration pinned at the bottom of the rail.
**Right column** — a **composer** card (avatar + "What's on your mind?" input that expands into title + body + topic select + Post button); a filter tab row (All / Liked / Editor's picks); then **post cards**: avatar, `@handle`, topic · relative time, a kebab menu, the post title in `text-lg font-semibold`, a 2-line excerpt, and a footer with like (heart + count) and comment (bubble + count) buttons.

### 5.14 `/[locale]/profile`

Left column (sticky card): **Edit** and **Share** buttons; avatar with level ring + `Lv.1` badge and the equipped frame beside it; display name + level chip + a badge icon; a privacy row ("Profile privacy" + a coral **"Public"** chip, click to toggle); a **Premium status** card (crown icon, status line, "Upgrade" chip, "Total premium months `0`"); a stat chip row (`🍡 50`, `🔥 1`, "Longest streak: 1"); two stat tiles ("Total study time `19 minutes`", "Last activity `Just now`"); tabs **Dictation / Shadowing** with "Total lessons `0`", "Total sentences `0`", "Current level" + "Ranking info" tooltip, and an "Unranked" chip.
Right column: a segmented **Dictation / Shadowing** control over a "No ranking history yet" empty state; below, a **Lesson progress** card with tabs **Completed / In progress** and an empty state "No lessons found".

### 5.15 Other routes to scaffold

`/[locale]/missions` (today's 4 missions with progress bars + claim buttons), `/[locale]/my-notes`, `/[locale]/my-vocabulary`, `/[locale]/feedbacks`, auth pages, `/[locale]/settings`.

---

## 6. Shared components

### 6.1 `LessonCard` (used everywhere)

- `w-[260px] shrink-0 rounded-2xl border bg-card overflow-hidden` with hover lift.
- **Cover** 16:9 with the lesson thumbnail; overlays:
  - top-left: a dark translucent pill `🎧 15,018` (play/listen count),
  - top-right: the **JLPT badge** (`N1`…`N5`) using that level's `--jlpt-n*-subtle/-border/-content`, `rounded-md px-1.5 text-[11px] font-bold`,
  - bottom-left: a **source chip** — `▸ Youtube` (red) or `🔊 Audio` (coral) — translucent dark pill,
  - bottom-right: duration `02:29`,
  - optional difficulty number badge.
- **Body**: title clamped to 2 lines (`line-clamp-2 text-sm font-medium`, Japanese font), then a footer icon row (headphones = dictation, mic = shadowing) linking to the two players.

### 6.2 `JlptBadge`, `StatTile`, `SectionHeader`, `SegmentedTabs`, `CurrencyPill`, `StreakFlame`, `LevelAvatar` (avatar + conic-gradient XP ring + `Lv.N` chip), `Heatmap`, `MilestoneRow`, `LeaderboardRow`, `EmptyState`, `CarouselRow` (snap scroll + edge-fade + hover arrows).

---

## 7. Data model (Prisma sketch)

```prisma
User            id, email, name, avatarUrl, locale, level, xp, dango, isPremium,
                currentStreak, longestStreak, lastCheckInAt, freezeCards, equippedFrameId, isPublic
Lesson          id(cuid16), title, titleJa, slug, jlptLevel(N1..N5), source(AUDIO|YOUTUBE),
                mediaUrl, youtubeId, startSec, endSec, durationSec, thumbnailUrl, playCount, categoryId
Category        id, nameJa, nameVi, slug, order, audience(BEGINNER|EXPERIENCED)
Sentence        id, lessonId, index, textJa, furigana, translationVi, startMs, endMs
Word            id, sentenceId, index, surface, reading, kanaLen, meaningVi
Attempt         id, userId, lessonId, mode(DICTATION|SHADOWING), accuracy, revealedWords,
                durationSec, completedAt
Progress        id, userId, lessonId, mode, status, lastSentenceIndex
StudyDay        id, userId, date, minutes, xp, checkedIn, usedFreeze     // powers the heatmap
Mission         id, key, title, target, rewardXp, rewardDango
UserMission     id, userId, missionId, date, progress, claimedAt
Milestone       id, type(STREAK|LEVEL), threshold, rewardDango, rewardFreeze, rewardItemIds
UserMilestone   id, userId, milestoneId, claimedAt
ShopItem        id, name, type(FRAME|WALLPAPER|FREEZE), rarity(COMMON|RARE|EPIC), price, imageUrl
Inventory       id, userId, itemId, quantity, acquiredAt
Deck/Card/Review  (SM-2: ease, interval, dueAt, repetitions)
GrammarPoint    id, jlptLevel, pattern, reading, explanationVi, examples[], tags[]
Exam/Question/ExamAttempt
Post/Comment/Reaction/Topic
```

---

## 8. Gamification rules

- **XP**: finishing a dictation sentence +2, a lesson +20, a shadowing take +3, a review card +1, a mission +10…50. Level N requires `50 + 88·(N−1)` cumulative-ish XP — expose the curve in one config file (the UI must show "X XP to the next level").
- **Streak**: increments once per calendar day (user timezone) on any completed study action; a missed day consumes a freeze card if one is owned (mark that day with a snowflake in the heatmap), otherwise resets to 0.
- **Missions**: 4 per day, regenerated at local midnight.
- **Dango**: earned from missions and milestones, spent in the shop.
- All of the above lives in `lib/gamification/config.ts` so numbers can be tuned without touching UI.

---

## 9. Quality bar / acceptance checklist

1. Light **and** dark themes both ship; no hardcoded hex outside the token file.
2. Every surface uses the token names above — a grep for `#ee5f59` outside `globals.css` must return nothing.
3. Japanese text always renders in Noto Sans JP; furigana uses real `<ruby>`.
4. All five JLPT badge variants render correctly in both themes.
5. Keyboard-complete dictation player; all icon-only buttons have `aria-label`; focus rings visible everywhere.
6. Loading = skeletons matching the final layout, never spinners-on-blank.
7. Empty states exist for: review queue, decks, lesson progress, ranking history, notifications, search.
8. Mobile at 390px: no horizontal overflow, bottom tab bar, players stacked.
9. Lighthouse ≥ 90 performance/accessibility on `/home`.
10. Seed script generates: 1 user, 5 categories, 30 lessons with sentences/words across N5–N1, 10 shop items, the 10 streak milestones, 4 missions and 20 leaderboard users — so every screen is demo-able offline.

---

## 10. Build order

1. Tokens + Tailwind config + fonts + theme switcher.
2. App shell (sidebar, header, pills, responsive nav) with mocked data.
3. `LessonCard` + carousel + catalogue pages.
4. `/home` dashboard (all six blocks).
5. Dictation player → shadowing player.
6. Vocabulary/SRS, grammar, review.
7. Exams, games hub, shop, leaderboard, community, profile.
8. Auth + Prisma + real data + seed.
