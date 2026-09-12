---
name: bencium-innovative-ux-designer
description: Alternativa estilizada y experimental (sombras, gradientes, tipografía expresiva) para campañas y piezas de vitrina. NO se dispara sola en planb: el default de UX/UI es bencium-controlled-ux-designer. Usar solo cuando Lucas lo pida por nombre o para la landing pública, nunca para pantallas de producto (fichas, formularios, backoffice).
metadata:
  version: 2.0.0
---

# Innovative UX Designer

Create distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices, emphasizing **bold creative commitment** while remaining functional and accessible.

## When Not to Use

Only for landing/campaign/showcase pieces, and only when asked by name (see the frontmatter `description`). Never for product screens (fichas, forms, backoffice): those use `bencium-controlled-ux-designer`.

## Core Philosophy

**CRITICAL: Design Thinking Protocol.** Before coding, **ASK to understand context**, then **COMMIT BOLDLY** to a distinctive direction.

### Questions to Ask First
1. **Purpose**: What problem does this interface solve? Who uses it?
2. **Tone**: What aesthetic extreme fits? (see Tone Options below)
3. **Constraints**: Technical requirements (framework, performance, accessibility)?
4. **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

### Tone Options (Pick an Extreme)
Brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian. Choose one and execute with precision.

### After Getting Context
- **Commit fully** to the chosen direction, no half measures
- Present 2-3 alternative approaches with trade-offs
- Then implement with precision: production-grade, visually striking, memorable

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

- `references/design-philosophy.md`: open when deciding overall direction (banned AI-generated aesthetics, how to create atmosphere, the 6 core design principles, color/typography/animation/spacing summary rules).
- `references/visual-design.md`: open when picking colors, type scale, or layout/spacing (color system architecture, typography excellence, layout and spatial design, banned fonts list).
- `references/interaction-design.md`: open when specifying motion or interaction behavior (direct manipulation, feedback, forgiveness, progressive disclosure, conversational/adaptive UI, bold visual expression rules).
- `references/implementation.md`: open when writing the actual component code (shadcn/Tailwind/icons/toasts conventions, responsive implementation, accessibility attributes).
- `references/process-and-examples.md`: open when structuring the design workflow or you want worked examples (workflow steps, testing checklist, button/typography/palette examples, patterns to avoid, version history, external references).
- `DESIGN-SYSTEM-TEMPLATE.md`: open for the meta-framework distinguishing fixed, project-specific, and adaptable design system rules.
- `MOTION-SPEC.md`: open for the full motion spec (easing curves, duration tables, state-specific animations, implementation patterns).
- `ACCESSIBILITY.md`: open for the full accessibility spec beyond the summary in `references/implementation.md`.
- `RESPONSIVE-DESIGN.md`: open for the full responsive design spec beyond the summary in `references/implementation.md`.
