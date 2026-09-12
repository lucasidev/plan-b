# Interaction Design

**Motion Specification:**

For detailed motion specs, see ../MOTION-SPEC.md (easing curves, duration tables, state-specific animations, implementation patterns).

### Motion Requirements (Implementation Checklist)

These are specific, high-impact motion patterns to implement for memorable interfaces:

**Scroll-Triggered Animations:**
- Use Intersection Observer API for performant scroll detection
- Trigger animations when elements enter viewport (not on page load)
- Example: `data-animate="fade-up"` with `.is-visible` class toggle

**Staggered Reveal Animations:**
- Use `animation-delay` for sequential element reveals
- Apply to lists, grids, and grouped content

*Timing principles (not rules):*
- **Base delay**: 50-150ms between elements (faster = energetic, slower = elegant)
- **Total sequence**: Keep under 1s or users lose patience
- **Pattern choices**: Linear (predictable), eased (accelerating/decelerating), or random (chaotic)
- **Direction**: Left-to-right, top-to-bottom, diagonal, center-out, or edge-in

**Background Atmosphere:**
- Add grain/noise texture overlay via `body::before` pseudo-element
- Create floating/pulsing background orbs with `@keyframes`

*Ambient motion principles:*
- **Duration**: 8-20s for background elements (slow = calming, faster = energetic)
- **Transform types**: translateY (floating), scale (breathing), rotate (orbiting)
- **Easing**: Use `ease-in-out` for organic, breathing feel
- **Intensity**: Subtle (5-20px movement) for backgrounds, bolder for hero elements
- **Layering**: Multiple elements at different speeds create depth (parallax effect)

**Layout Animation:**
- Use asymmetric bento grid layouts with varied reveal timing
- Animate grid items individually, not the container
- Consider diagonal or wave-pattern reveal sequences

**Data Visualization Motion:**
- Include animated progress bars that fill on scroll-trigger
- Implement stat counters that count up when visible
- Use easing that slows at the end (ease-out) for natural feel

**Hover State Transformations:**
- `translateY(-4px)` for subtle lift effect
- `scale(1.02-1.05)` for emphasis
- Glow effects via `box-shadow` with accent color
- Combine transforms: `transform: translateY(-4px) scale(1.02);`
- Always include `transition` for smooth state changes

**Social Proof Motion:**
- Implement infinite marquee/ticker for testimonials, logos, or stats
- Use CSS-only approach with `@keyframes` for seamless loop
- Pause on hover for accessibility (`animation-play-state: paused`)

*Marquee principles:*
- **Speed**: 20-60s for full cycle (slower = premium, faster = urgency)
- **Direction**: Horizontal (traditional), vertical (unique), or diagonal (bold)
- **Content duplication**: Duplicate content 2x for seamless loop
- **Gap control**: Consistent spacing between items (use flexbox gap)
- **Pause behavior**: Always pause on hover/focus for accessibility

### Visual Effects (Implementation Checklist)

Consolidated checklist for atmospheric visual effects (complements Color & Typography sections):

**Gradient Mesh Backgrounds:**
- Use multiple radial gradients with offset positions
- Blend with `background-blend-mode: multiply` or `overlay`
- Animate gradient positions subtly for living backgrounds

*Gradient mesh principles:*
- **Layer count**: 2-4 radial gradients (more = richer, fewer = cleaner)
- **Position strategy**: Offset from corners/edges (20-30% from edge creates tension)
- **Opacity range**: 0.1-0.4 for overlays (subtle), 0.5-0.8 for dominant
- **Shape choices**: Ellipse (organic), circle (focused), conic (radial burst)
- **Animation**: Shift positions 10-30% over 15-30s for subtle movement

**Dramatic Shadows (Not Subtle):**
- Use layered shadows for depth: `box-shadow: 0 4px 6px rgba(), 0 10px 20px rgba();`
- Add color to shadows from accent palette
- Consider `drop-shadow` filter for non-rectangular elements
- Shadows should be visible and intentional, not barely perceptible

**Layered Transparencies:**
- Stack elements with `rgba()` or `hsla()` backgrounds
- Use `backdrop-filter: blur()` sparingly (performance cost)
- Create depth through overlapping translucent layers

**Grain/Noise Texture:**
- Apply via `::before` or `::after` pseudo-element
- Use SVG noise filter or tiny repeating PNG
- Set `opacity: 0.03-0.08` for subtle texture
- Use `pointer-events: none` to not interfere with interactions

**Custom Cursors:**
- Change cursor for interactive regions: `cursor: pointer`
- Consider custom cursor images for brand differentiation
- Use `cursor: grab` / `cursor: grabbing` for draggable elements
- Always provide fallback: `cursor: url(custom.cur), pointer;`

### User Experience Patterns

**Core UX Principles:**

1. **Direct Manipulation**
   - Users interact directly with content, not through abstract controls
   - Examples:
     - Drag & drop to reorder items (not up/down buttons)
     - Inline editing (click to edit, not separate form)
     - Sliders for ranges (not numeric input with +/-)
     - Pinch/zoom gestures on mobile (not +/- buttons)

2. **Immediate Feedback**
   - Every interaction provides instantaneous visual feedback (within 100ms)
   - Types of feedback:
     - **Visual**: Button pressed state, hover effects, color changes
     - **Haptic**: Vibration on mobile (submit, error, success)
     - **Audio**: Subtle sounds for critical actions (optional, user-controlled)
     - **Loading**: Skeleton screens, spinners for >300ms operations
     - **Success**: Checkmarks, green highlights, toast notifications
     - **Error**: Red highlights, inline error messages, shake animations

3. **Consistent Behavior**
   - Similar-looking elements behave similarly
   - Examples:
     - **Visual consistency**: All primary buttons have same colors, sizes, hover states
     - **Behavioral consistency**: All modals close via X button, ESC key, and outside click
     - **Interaction consistency**: All drag targets have same hover state and drop feedback
     - **Pattern consistency**: All forms validate on blur and submit

4. **Forgiveness**
   - Make errors difficult, but recovery easy
   - **Prevention strategies**:
     - Disable invalid actions (grey out unavailable buttons)
     - Validate inputs inline (before submission)
     - Confirm destructive actions (delete, overwrite)
     - Auto-save in background (drafts, progress)
   - **Recovery strategies**:
     - Undo/redo for all state changes
     - Soft deletes (trash/archive before permanent delete)
     - Clear error messages with actionable fixes
     - Preserve user input on errors (don't clear forms)

5. **Progressive Disclosure**
   - Reveal details as needed rather than overwhelming users
   - Levels of disclosure:
     - **Summary**: Show essential info by default (card title, price, rating)
     - **Details**: Expand to show more info (description, specs, reviews)
     - **Advanced**: Hide complex options behind "Advanced settings" toggle
   - Examples:
     - Accordion: Start collapsed, expand on click
     - Search filters: Show 3-5 common filters, hide rest behind "More filters"
     - Settings: Basic settings visible, advanced behind "Show advanced"

**Modern UX Patterns:**

1. **Conversational Interfaces**

   Prioritize natural language interaction where appropriate:

   **Four types:**
   - **Pure chat**: Full conversation (AI assistants, support bots)
   - **Command palette**: Text-based shortcuts (Cmd+K, search everywhere)
   - **Smart search**: Natural language queries (search "meetings next week" vs filtering)
   - **Form alternatives**: Conversational data collection ("What's your name?" vs form fields)

   **When to use:**
   - Complex searches with multiple variables
   - Task guidance (wizards, onboarding)
   - Contextual help
   - Quick actions (command palette)

   **When NOT to use:**
   - Simple forms (just use inputs)
   - Precise control interfaces (design tools, dashboards)
   - High-frequency repetitive tasks

2. **Adaptive Layouts**

   Respond to user context automatically:
   - **Time-based**: Dark mode at night, light during day
   - **Device-based**: Simplified UI on mobile, full features on desktop
   - **Connection-based**: Reduce images/video on slow connections
   - **Usage-based**: Prioritize frequent actions, hide rarely-used features

   Examples:
   - Auto dark/light mode based on time or system preference
   - Simplified mobile navigation (hamburger menu) vs full desktop nav
   - Collapsed sidebar on small screens, expanded on large

3. **Bold Visual Expression**

   Aesthetic flexibility based on chosen direction:
   - Shadows ALLOWED and encouraged when intentional (dramatic shadows, soft elevation)
   - Gradients ALLOWED for depth, accents, backgrounds, and atmosphere
   - NO glass morphism effects (this is the one banned technique)
   - NO Apple design mimicry (find your own voice)
   - Focus on typography, color, spacing, AND visual effects to create hierarchy
   - Create atmosphere: gradient meshes, noise textures, grain overlays, dramatic lighting

**Navigation:**
- Clear structure with intuitive navigation menus
- Implement breadcrumbs for deep hierarchies (more than 2 levels)
- Use standard UI patterns to reduce learning curve (hamburger menu, tab bars)
- Ensure predictable behavior (back button works, links look clickable)
- Maintain navigation context (highlight current page, preserve scroll position)
