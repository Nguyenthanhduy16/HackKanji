# NhaiKanji visual reference

Primary reference: https://kitsumi.app/vi and public `/vi/home`, `/vi/listening`, `/vi/vocabulary`, `/vi/grammar`, `/vi/games`, `/vi/shop`. DOM measurements saved in ignored `reference/` during development.

User-provided specification: `kitsumi-clone-prompt.md`. Product name, logo, original bear mascot, lesson artwork and learning content are NhaiKanji originals in accordance with its legal note.

## Measured reference values

- Fixed sidebar: 256px; collapsed 64px. Header 64px; marketing header 65px.
- Sidebar nav links: 48px total height, 12px horizontal padding, 12px gap, 2px active border, 4px row gaps. Reference label weight bold, muted gray inactive and coral active.
- Dashboard content starts at x272 on desktop (16px from sidebar); top heading y88 (24px below header).
- Reference dashboard heading: 28px / 36px, font weight 600. Reference card headings 16px / 24px or 18px / 26px.
- Marketing content max-width 1040px including padding, hero columns 472px wide at viewport1280. Hero H1 46px / 52px with 600 weight. Hero section about664px tall.
- Marketing timeline: four alternating rows with a 40px numbered central marker; feature cards 2 columns with24px gaps; benefits full-width stacked rows; FAQ sidebar plus accordions.
- Colors use exact RGB variables supplied in the prompt. Dark, status, JLPT N1–N5 variants are in globals.css.

## Intentional differences

- Name/logo/mascot, copyrighted illustrations, source lesson audio/transcripts, and real user information are not copied.
- Learning examples and rank/activity data are demo fixtures. Browser-local storage is explicitly labelled in the app.
- No invented testimonials or production account integration claims. The landing page uses a JLPT level section in place of copied testimonials.
- Typography follows the requested Inter for Latin/Vietnamese and Noto Sans JP for Japanese; live source currently applies Noto Sans JP more broadly.
- Exact visual equivalence is not claimed; matching is evaluated through measured structure and browser QA, with original assets as required by the supplied spec.

## Final measured dashboard alignment

At1440×1000, reference and clone have heading y88, streak y176/h190, and quick review y390/h124. Activity-card top: reference831.75px, clone832.12px. The internal heatmap card height, original artwork and content still differ. Measurements are in `qa/visual-comparison.json`.
