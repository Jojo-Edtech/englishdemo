# Grid-inspired workspace refresh

Date: 2026-10-02

## Design target

The supplied Grid reference shows white surfaces, compact top navigation, violet actions, yellow highlights, and an asymmetric image grid. This implementation translates that direction into an operational English assessment workspace, preserving teacher and student workflows. It is a style adaptation, not a clone of the reference's marketing content.

- White page and navigation; no dark sidebar.
- Neutral text brand with no institution name, crest, graduation cap, or institutional favicon.
- Violet `#6951d5`, pale yellow `#fff0b8`, mint `#dbefea`, and muted coral `#f8e8e3` provide distinct functional accents.
- Fixed type scale, compact headings, generous line height, unframed analytical sections.
- A six-item grid connects current results, writing, priority questions, student follow-up, import, and the student view.
- A generated notebook photograph contains no school branding; the optimized local asset is `public/images/reading-workspace.jpg`. It is illustrative, not student evidence.
- The mobile bottom bar has four primary actions and a modal menu exposing every remaining page. Escape, focus restoration, scroll locking, and native dialog focus containment are supported.
- Hash-based page navigation supports browser back/forward and direct links, including GitHub Pages subpaths.
- Review-task completion remains available while navigating and is tracked separately for each selected class during the session. Practice actions select the matching question type.

## Website research

1. [Formative Insights](https://help.formative.com/en/articles/8062470-formative-insights-summary): performance, participation, weak questions, and follow-up instruction are grouped around a single assessment. Adopted clear assessment context and direct question-to-action links.
2. [Formative Tracker](https://help.formative.com/en/articles/6267112-navigating-the-tracker): student and assessment progress is filterable. Retained the existing mastery matrix and class selector.
3. [Wayground Overview](https://help.wayground.com/support/solutions/articles/158000453033-the-overview-dashboard): concise summaries link to detailed reports. Adopted a compact overview with deeper analysis on separate pages.

No third-party interface code or product screenshots are bundled into the application.

## GitHub skill reviewed and downloaded

- Repository: [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines)
- Skill: `web-design-guidelines`
- Pinned revision: `063bee94c3f4df8453406c830b0a7df0f2860278`
- Installed with the Codex skill-installer into the local Codex skills directory. No application runtime dependency was added.
- Reviewed [the source rules](https://github.com/vercel-labs/web-interface-guidelines/blob/main/command.md) and applied focus visibility, input labels, keyboard navigation, responsive content containment, image dimensions, reduced motion, and touch target checks.
- [Impeccable](https://github.com/pbakaus/impeccable) was also examined as a design-workflow reference. It was not installed or executed.

## Scope

Existing imports, rubric logic, AI requests, reports, matrix drill-downs, and student workflows remain available. This visual update does not add real authentication, PDF OCR, a database, or a server-side AI proxy. Demo analytics remain labeled; imported data continues to be handled by the existing import workspace.

See `design-qa.md` for the verified viewport and interaction results.
