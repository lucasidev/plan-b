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

❌ **Don't:**
- Use generic SaaS blue (#3B82F6) without considering alternatives
- Default to shadows and gradients for depth
- Copy Apple's design language
- Use glass morphism effects
- Make design decisions without asking
- Implement typography without considering the font version
- Use animations that delay user actions
- Create cluttered interfaces with competing elements

✅ **Do:**
- Ask before making design decisions
- Suggest unique, contextually appropriate color pairs
- Use flat, minimal design
- Consider unconventional typography choices
- Provide immediate feedback for interactions
- Create generous white space
- Test with real devices
- Validate accessibility

## Version History

- v1.0.0 (2025-10-18): Initial release with comprehensive UI/UX design guidance

## References

For additional context, see:
- WCAG 2.1 Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- Google Fonts: https://fonts.google.com/
- Tailwind CSS Docs: https://tailwindcss.com/docs
- Shadcn UI Components: https://ui.shadcn.com/
