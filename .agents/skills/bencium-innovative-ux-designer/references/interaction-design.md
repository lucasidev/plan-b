# Interaction Design

**Motion Specification:**

For detailed motion specs, see ../MOTION-SPEC.md (easing curves, duration tables, state-specific animations, implementation patterns).

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
