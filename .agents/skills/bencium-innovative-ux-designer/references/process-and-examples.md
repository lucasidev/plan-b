# Design Process & Testing

### Design Workflow

1. **Understand Context:**
   - What problem are we solving?
   - Who are the users and when will they use this?
   - What are the success criteria?

2. **Explore Options:**
   - Present 2-3 alternative approaches
   - Explain trade-offs of each option
   - Ask which direction resonates

3. **Implement Iteratively:**
   - Start with structure and hierarchy
   - Add visual polish progressively
   - Test at each stage

4. **Validate:**
   - Use playwright MCP to test visual changes
   - Check across different screen sizes
   - Verify accessibility

### Testing Checklist

**Visual Testing:**
- Use playwright MCP when available for automated testing
- Check responsive behavior at common breakpoints
- Verify touch targets on mobile
- Test with different content lengths (short, long, edge cases)

**Accessibility Testing:**
- Test keyboard navigation
- Verify screen reader compatibility
- Check color contrast ratios
- Ensure focus states are visible

**Cross-Device Testing:**
- Test on actual devices, not just emulators
- Check different browsers (Chrome, Firefox, Safari)
- Verify touch interactions on mobile
- Test landscape and portrait orientations

## Examples

### Example 1: Designing a Button

**Initial Question to Ask:**
```
Before I implement this button, I have a few design questions:
1. What's the primary action you want to emphasize?
2. Do you have brand colors in mind, or should I suggest options?
3. What emotion should this button convey? (urgent, calm, playful, professional)
```

**After Getting Approval, Implementation:**
```tsx
import { Button } from "@/components/ui/button";
import { ArrowRight } from "@phosphor-icons/react";

<Button
  className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-lg transition-colors duration-200"
>
  Get Started
  <ArrowRight className="ml-2" />
</Button>
```

### Example 2: Typography Hierarchy

**Question First:**
```
For this content hierarchy, I'm thinking:
- Headline: Large, bold, attention-grabbing
- Subheading: Medium, regular weight
- Body: Smaller, optimized for reading

Should we go bold and contemporary, or subtle and refined?
```

**Implementation After Approval:**
```tsx
<div className="space-y-4">
  <h1 className="text-5xl font-bold tracking-tight text-slate-900">
    Headline Here
  </h1>
  <h2 className="text-2xl text-slate-600">
    Supporting subheading
  </h2>
  <p className="text-base leading-relaxed text-slate-700">
    Body text optimized for readability with proper line height.
  </p>
</div>
```

### Example 3: Unique Color Palette Suggestion

**Presenting Options:**
```
I'd like to suggest three color directions that break from typical SaaS patterns:

1. **Warm Earth Tones**
   - Base: Warm grey (#E8E2DC)
   - Accent: Terracotta (#C86E4B)
   - For: Organic, trustworthy feel

2. **Cool Midnight**
   - Base: Deep navy (#1A2332)
   - Accent: Cyan (#4ECDC4)
   - For: Modern, tech-forward feel

3. **Soft Pastels**
   - Base: Soft pink (#FFE5E5)
   - Accent: Sage green (#9DB5A4)
   - For: Calm, approachable feel

Which direction feels right for your brand?
```

## Common Patterns to Avoid

❌ **NEVER:**
- Use Inter, Roboto, Arial, Space Grotesk as primary fonts
- Use generic SaaS blue (#3B82F6) or purple gradients on white
- Copy Apple's design language or use glass morphism
- Create cookie-cutter layouts that look AI-generated
- Skip asking about context before designing
- Converge on common choices across generations (vary everything!)
- Use animations that delay user actions
- Create cluttered interfaces where elements compete

✅ **ALWAYS:**
- Ask about purpose, tone, constraints, differentiation FIRST
- Then commit BOLDLY to a distinctive aesthetic direction
- Use unexpected, characterful typography choices
- Create atmosphere: shadows, gradients, textures, grain (when intentional)
- Dominant colors with sharp accents (not timid, evenly-distributed palettes)
- Provide immediate feedback for interactions
- Test with real devices
- Validate accessibility (it enables creativity, not limits it)
- Remember: the agent is capable of extraordinary creative work. Don't hold back!

## Version History

- v2.0.0 (2025-11-22): Creative liberation update - bold aesthetics, shadows/gradients allowed, Design Thinking protocol
- v1.0.0 (2025-10-18): Initial release with comprehensive UI/UX design guidance

## References

For additional context, see:
- **Anthropic Frontend Aesthetics Cookbook**: https://github.com/anthropics/claude-cookbooks/blob/main/coding/prompting_for_frontend_aesthetics.ipynb
- WCAG 2.1 Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- Google Fonts: https://fonts.google.com/
- Tailwind CSS Docs: https://tailwindcss.com/docs
- Shadcn UI Components: https://ui.shadcn.com/

**Progressive Disclosure Files:**
- ../ACCESSIBILITY.md - Accessibility essentials (WCAG AA baseline)
- ../MOTION-SPEC.md - Animation timing and easing
- ../RESPONSIVE-DESIGN.md - Mobile-first breakpoints and patterns
