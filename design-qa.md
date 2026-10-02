# Reference-inspired workspace design QA

Date: 2026-10-02

final result: passed

## Scope and visual truth

- Source: `/Users/zhouxinxin/.codex/attachments/fd5f6961-326d-48d7-8b06-a08e07382921/image-1.png` (450 x 306 pixels).
- This source is a low-resolution composite of a desktop marketing page and a phone view. The user requested its design style for an existing teaching application, not its English marketing copy or product photographs.
- The comparison therefore assesses white surfaces, compact top navigation, a centered title, violet actions, yellow accents, and an asymmetric image/content grid. It is not a pixel-perfect clone claim.
- Implementation: `http://127.0.0.1:5182/#overview`, after incorporating upstream `2b70a12` and retaining its privacy protections.
- Screenshots and structured checks are local QA artifacts in the ignored `output/design-refresh/` directory. They contain only sample data.

## Rendered evidence

| State | CSS viewport | Screenshot | Raster size |
| --- | --- | --- | --- |
| Teacher overview, desktop | 1440 x 960 | `merged-1440-总览.png` | 1425 x 950 |
| Teacher overview, mobile | 390 x 844 | `merged-390-总览.png` | 375 x 812 |
| Student view, mobile | 390 x 844 | `merged-390-学生.png` | Browser capture |
| Essay workspace, narrow mobile | 320 x 740 | `merged-320-批改.png` | 305 x 705 |

The browser tool's raster output differs from the requested CSS viewport. Layout assertions use the browser-reported viewport and client width; visual comparison uses the complete returned image without artificial upscaling. The source's composite framing and density cannot support exact text-size or pixel-difference comparisons.

The source and final desktop/mobile screenshots were opened together in the same comparison input. The narrow-screen writing view was also opened. Text and control details are readable in the full-size implementation captures; focused source crops would not recover missing detail from the 450-pixel source, so no fabricated crop-level precision is claimed.

## Findings and corrections

No unresolved P0/P1/P2 findings remain in the visual-refresh scope.

1. Earlier mobile filters and role-switch styling inherited full-width rules. Scoped flex sizing now keeps them within the viewport. Verified again in `merged-390-总览.png`.
2. Earlier narrow layouts inherited a 320px body minimum plus a two-column essay Key row. Removed the body minimum and stacked the Key row on small screens. Verified in `merged-320-批改.png` and all nine 320px panel checks.
3. Earlier chart mounts reported negative initial dimensions. Explicit Recharts initial dimensions preserve responsive resizing without these warnings. The post-merge browser console contains no warning/error entries during the 36-state sweep.
4. Earlier navigation crowded or omitted mobile destinations. The bottom bar now has four primary destinations plus a complete modal menu. All nine pages are reachable at 768px, 390px, and 320px.
5. Removed the institutional-looking brand icon and graduation-cap favicon. Source scan and DOM checks found no school/graduation-cap icons. The generated notebook photograph contains no school branding.
6. The first desktop recapture occurred before the image had painted. Rechecked image completion and natural width (1000px), then replaced the screenshot with the rendered photograph. No missing-image workaround was used.

## Required fidelity surfaces

- **Typography:** Chinese system sans-serif with deliberate compact hierarchy; overview title 32px desktop/26px mobile, ordinary mobile page titles 21px. No negative tracking or viewport-scaled font sizes. Inputs use 16px on mobile. Numeric metrics use tabular figures.
- **Layout:** White top navigation replaces the dark sidebar; content uses a bounded workspace and unframed analysis sections. The asymmetric six-item grid becomes a compact two-column mobile arrangement. Card radii remain at or below 8px.
- **Color:** Violet actions, pale yellow priority question, mint follow-up and coral student tile retain the reference's multi-color balance without adding gradients or ornamental background shapes.
- **Images:** A locally served generated notebook photograph replaces unrelated marketing imagery. The focal notebook/pen crop remains recognizable on desktop and mobile. No school crest, people, student data, or third-party screenshots are bundled.
- **Content:** The first screen performs teacher tasks rather than presenting a marketing pitch. Mock assessment context stays visible, and the existing import, grading, diagnosis, reporting, and student tools remain reachable.

## Browser regression

`merged-layout-checks.json` contains nine panels at each of 1440 x 960, 768 x 1024, 390 x 844, and 320 x 740 (36 states). No document horizontal overflow or offscreen text/control bounds outside intentional horizontal-scroll containers were reported. No school icons were found.

Verified interactions after the upstream merge:

- Teacher/student switching and all primary/More-menu destinations.
- Class selector updates the overview; completion tasks are isolated by class and retained while navigating.
- The vocabulary lesson's practice action opens the Q27 vocabulary exercise.
- Browser Back restores the overview and its task state.
- Mobile dialog opens with focus inside, locks background scrolling, closes with Escape, and restores focus to More.
- A synthetic CSV with a missing score, duplicate ID, and missing class reports 5/6 recognized cells, one missing score, one duplicate, and one missing base field. Sample data was restored afterward.

## Build and non-UI checks

- `npm run build`: passed after merge.
- `npm run test:security`: passed; existing external-AI boundary code retained.
- `npm run test:essay-rubric`: passed; 240 synthetic records, three standards, no reported issues. This is an implementation check, not validation of AI scoring quality.
- Existing visual/persona scripts updated for the More menu and current title scale. Both pass `node --check`; their full stress suites were not run in this pass. Runtime UI evidence above was collected through the Codex browser.

## Residual limits

- This is a responsive demo, not a production student-data system. Authentication, database persistence, OCR, server-side AI credentials, and actual scoring validity are outside this visual update.
- No paid API request or real student submission was used for QA.
- No claim of full WCAG certification or exact reference-font matching is made.
- Local screenshots support the visual result; GitHub Actions and the actual deployed page must be checked separately before reporting publication.
