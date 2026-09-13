---
name: design-taste-frontend
description: Anti-slop para landing pages y piezas de vitrina. En planb aplica solo a la landing pública, nunca a dashboards, tablas ni pantallas de producto. Usar cuando Lucas lo pida por nombre o al trabajar la landing.
---

# tasteskill: Anti-Slop Frontend Skill

> Landing pages, portfolios, and redesigns. Not dashboards, not data tables, not multi-step product UI.
> Every rule below is **contextual**. None of it fires automatically. First read the brief, then pull only what fits.

## When Not to Use

Dashboards, dense product UI, admin panels, data tables, multi-step forms/wizards, code editors, native mobile, realtime collab UIs. Say so explicitly and point to the right tool instead (see `references/block-library-and-scope.md`, Section 13).

## Core Procedure

1. **Read the brief first** (Section 0). Gather signals: page kind, vibe words, reference URLs/screenshots, audience, existing brand assets, quiet constraints (accessibility-first, public-sector, regulated). State a one-line "Design Read" before generating any code. Ask at most one clarifying question, only when genuinely ambiguous. Do not default to AI-purple gradients, centered hero over dark mesh, three equal feature cards, generic glassmorphism, or Inter + slate-900.
2. **Set the three dials** (Section 1): `DESIGN_VARIANCE`, `MOTION_INTENSITY`, `VISUAL_DENSITY`. Baseline `8 / 6 / 4`, adjusted from the design read. Full inference table and use-case presets in `references/brief-and-dials.md`.
3. **Pick the right foundation** before writing CSS by hand: an official design system when the brief calls for one, or native CSS + Tailwind when it is an aesthetic, not a system (`references/design-system-map.md`).
4. **Build within the default architecture and conventions** (stack, state, icons, emoji policy, responsiveness, dependency verification) unless a real design system overrides them (`references/architecture-conventions.md`).
5. **Apply the design-engineering bias corrections** (typography, color, layout, materiality, interactive states, forms, image strategy, content density, quotes, theme lock) before calling anything done (`references/design-engineering.md`).
6. **Before shipping, run the Final Pre-Flight Check** in `references/preflight-check.md`. It is not optional. The single most-violated rule inside it: the em-dash character is completely banned anywhere on the page, no exceptions (Section 9.G).

## References

- `references/brief-and-dials.md`: read first, always. Full brief-inference signals, the "Design Read" format, and the dial inference/use-case tables.
- `references/design-system-map.md`: open when choosing the foundation (official design systems vs. aesthetic-only directions like glassmorphism, bento, brutalism).
- `references/architecture-conventions.md`: open when scaffolding the project (stack, state, icons, emoji policy, responsiveness, dependency checks).
- `references/design-engineering.md`: open while designing sections (typography, color calibration, layout diversification, materiality, interactive states, forms, hard layout rules, image strategy, content density, quotes, theme lock).
- `references/motion-and-animation.md`: open when adding motion (context-aware proactivity rules, the canonical sticky-stack/horizontal-pan/scroll-reveal code skeletons, forbidden animation patterns).
- `references/performance-accessibility.md`: open for hardware acceleration, reduced motion, dark mode, Core Web Vitals targets, DOM cost, z-index restraint, and the technical dial definitions.
- `references/ai-tells.md`: open before final polish. The full list of forbidden AI-generated signatures, including the complete em-dash ban (Section 9.G).
- `references/vocabulary-and-redesign.md`: open to name a pattern (hero paradigms, nav, grids, cards, scroll animations, galleries, typography, micro-interactions) or when the task is a redesign, not a greenfield build.
- `references/block-library-and-scope.md`: open for the block-library contract (file location, frontmatter, required sections) and the full out-of-scope list.
- `references/preflight-check.md`: open before declaring any page done. The full, mandatory checklist.
- `references/appendix-design-systems.md`: open for real install commands and canonical doc links per design system named in `references/design-system-map.md`.
- `references/appendix-liquid-glass.md`: open only when building an Apple Liquid Glass web approximation, for the honest scope of what is official vs. approximated, plus a working CSS skeleton.
