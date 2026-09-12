---
name: bencium-controlled-ux-designer
description: Expert UI/UX design guidance for unique, accessible interfaces. Use for visual decisions, colors, typography, layouts. Always ask before making design decisions. Use this skill when the user asks to build web components, pages, or applications.
metadata:
  version: 1.0.0
---

# UX Designer

Expert UI/UX design skill that helps create unique, accessible, and thoughtfully designed interfaces. Use for visual decisions (colors, fonts, sizes, layouts) and when building web components, pages, or applications. Emphasizes design decision collaboration, breaking away from generic patterns, and building interfaces that stand out while remaining functional and accessible.

## When Not to Use

Skip this skill for changes with no visual surface (pure backend/data logic), or when the interface direction is already approved and the task is just wiring it up.

## Core Philosophy

**CRITICAL: Design Decision Protocol**
- **ALWAYS ASK** before making any design decisions (colors, fonts, sizes, layouts)
- Never implement design changes until explicitly instructed
- The referenced guidance below is for when design decisions are approved
- Present alternatives and trade-offs, not single "correct" solutions

## Design Decision Checklist

Before presenting any design, verify:

1. **Purpose**: Does every element serve a clear function?
2. **Hierarchy**: Is visual importance aligned with content importance?
3. **Consistency**: Do similar elements look and behave similarly?
4. **Accessibility**: Does it meet WCAG AA standards? (contrast, touch targets, keyboard nav)
5. **Responsiveness**: Does it work on mobile, tablet, desktop?
6. **Uniqueness**: Does this break from generic SaaS patterns?
7. **Approval**: Have I asked before implementing colors, fonts, sizes, layouts?

## References

- `references/design-philosophy.md`: open when deciding overall direction (standing out from generic patterns, the 6 core design principles, color/typography/animation/spacing summary rules, pointer to the design system meta-framework).
- `references/visual-design.md`: open when picking colors, type scale, or layout/spacing (color system architecture, typography excellence, layout and spatial design).
- `references/interaction-design.md`: open when specifying motion or interaction behavior (animation timing and easing, direct manipulation, feedback, forgiveness, progressive disclosure, conversational and adaptive UI patterns).
- `references/implementation.md`: open when writing the actual component code (shadcn/Tailwind/icons/toasts conventions, responsive implementation, accessibility attributes).
- `references/process-and-examples.md`: open when structuring the design workflow or you want worked examples (workflow steps, testing checklist, button/typography/palette examples, patterns to avoid, version history, external references).
- `DESIGN-SYSTEM-TEMPLATE.md`: open for the meta-framework distinguishing fixed, project-specific, and adaptable design system rules.
- `MOTION-SPEC.md`: open for the full motion spec (easing curves, duration tables, state-specific animations, implementation patterns).
- `ACCESSIBILITY.md`: open for the full accessibility spec beyond the summary in `references/implementation.md`.
- `RESPONSIVE-DESIGN.md`: open for the full responsive design spec beyond the summary in `references/implementation.md`.
