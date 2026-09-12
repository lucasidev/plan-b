---
name: bencium-impact-designer
description: Alternativa anti-slop (adaptación del frontend-design de Anthropic) para cuando una pantalla salió genérica y hay que darle carácter. NO se dispara sola en planb: el default de UX/UI es bencium-controlled-ux-designer. Usar solo cuando Lucas lo pida por nombre.
version: 1.2.0
---

# Innovative Designer for impact

Create distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices, emphasizing **bold creative commitment** and building interfaces that are visually striking and memorable while remaining functional.

## When Not to Use

Only when Lucas asks by name (see the frontmatter `description`): a screen that already came out generic and needs character. Not the default UX/UI skill; that is `bencium-controlled-ux-designer`.

## Core Philosophy

**CRITICAL: Design Thinking Protocol.** Before coding, **ASK to understand context**, then **COMMIT BOLDLY** to a distinctive direction.

### Questions to Ask First
1. **Purpose**: What problem does this interface solve? Who uses it?
2. **Tone**: What aesthetic extreme fits? (see the tone list below) Use it for inspiration but design one that is true to the aesthetic direction.
3. **Constraints**: Technical requirements (framework, performance, accessibility)?
4. **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work: the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, TypeScript, etc.) that is production-grade and functional, visually striking and memorable, cohesive with a clear aesthetic point of view, and meticulously refined in every detail.

### Tone Options (Pick an Extreme)
Brutally minimal, retro-futuristic, organic/natural, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, plus dozens of niche moods (Neo-Swiss Grid, Glitch/Digital Noise, Vaporwave Nostalgia, Cyberpunk, and more) in `references/tone-exploration.md`.

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

- `references/tone-exploration.md`: open when picking or generating the aesthetic direction (the full tone list, designer/context/era reframing prompts, the anti-sameness dice protocol).
- `references/design-philosophy.md`: open for the underlying design principles (foundational typography/color/motion/spatial/background rules, banned AI-generated aesthetics, the 6 core design principles, color/typography/animation/spacing summary rules).
- `references/visual-design.md`: open when picking colors, type scale, or layout/spacing (color system architecture, typography excellence, layout and spatial design, banned fonts list).
- `references/interaction-design.md`: open when specifying motion or interaction behavior (scroll-triggered and staggered animations, background atmosphere, hover transformations, marquees, gradient meshes, shadows, grain textures, custom cursors, UX patterns, navigation).
- `references/implementation.md`: open when writing the actual component code (shadcn/Tailwind/icons/toasts conventions, responsive implementation, accessibility attributes).
- `references/process-and-examples.md`: open when structuring the design workflow or you want worked examples (workflow steps, testing checklist, button/typography/palette examples, patterns to avoid, when to break the rules, external references).
- `MOTION-SPEC.md`: open for the full motion spec (easing curves, duration tables, state-specific animations, implementation patterns).
- `ACCESSIBILITY.md`: open for the full accessibility spec beyond the summary in `references/implementation.md`.
- `RESPONSIVE-DESIGN.md`: open for the full responsive design spec beyond the summary in `references/implementation.md`.
