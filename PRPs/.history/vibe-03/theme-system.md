# PRP: Theme System

## Role

You are a **Frontend Developer** with expertise in CSS theming, Tailwind CSS, and design systems. Your responsibility is to implement NIC Insight's color scheme across the entire application, supporting both light and dark themes with smooth transitions and consistent visual hierarchy.

**Required Expertise:**

- Tailwind CSS configuration
- CSS custom properties (variables)
- Color theory and accessibility
- Dark mode implementation
- Theme switching mechanisms

**Context Awareness:**

- Understanding of LibreChat's Tailwind setup
- Knowledge of VSCode theme format
- Familiarity with design tokens
- Cross-browser color rendering

## Objective

**Primary Goal:** Implement NIC Insight's color scheme consistently across all UI components for both light and dark themes

**Success Criteria:**

- [ ] Complete color palette implementation
- [ ] Smooth theme transitions
- [ ] WCAG AA color contrast compliance
- [ ] Consistent color application across components
- [ ] Theme persistence across sessions

**Scope Boundaries:**

- **In Scope:** Color variables, Tailwind config, theme switching, component styling
- **Out of Scope:** Layout changes, typography changes, component restructuring
- **Future Considerations:** Additional theme variants, color customization UI

## Motivation

**Business Value:**

- Professional enterprise appearance
- Improved visual consistency
- Enhanced user experience with proper dark mode
- Brand alignment with Processa Sistemas

**Problem Statement:**

- Current LibreChat colors don't match NIC Insight brand
- Inconsistent dark mode implementation
- Poor color contrast in some areas
- Generic appearance lacking personality

**Strategic Importance:**

- Foundation for visual brand identity
- Improved accessibility compliance
- Better user retention through UI quality
- Enterprise-ready appearance

**Success Metrics:**

- 100% component color coverage
- WCAG AA compliance on all text
- Consistent theme across all pages
- Zero color-related bug reports

## Context

### Technical Environment

**Architecture:**

- Tailwind CSS for utility-first styling
- CSS custom properties for dynamic themes
- PostCSS for CSS processing
- Vite build system

**Current Codebase:**

- Tailwind config at `client/tailwind.config.cjs`
- Global styles in `client/src/style.css`
- Component-specific styles throughout
- Theme context for state management

### Dependencies and Constraints

**Technical Dependencies:**

- Tailwind CSS 3.x
- PostCSS plugins
- Modern browser CSS support
- React context for theme state

**Business Constraints:**

- Maintain readability and usability
- Support user theme preferences
- Quick implementation timeline
- Backward compatibility

### Documentation and References

**Technical Documentation:**

- NIC theme examples: `PRPs/Examples/nic-*-theme.json`
- Tailwind theming documentation
- CSS custom properties guide
- Color accessibility standards

**External References:**

- VSCode theme JSON schema
- Material Design color guidelines
- WCAG contrast requirements
- Dark mode best practices

### Known Gotchas and Edge Cases

**Critical Considerations:**

- Semi-transparent colors in overlays
- Shadow colors in dark mode
- Border visibility across themes
- Form input styling consistency

**Edge Cases to Handle:**

- Forced colors mode (Windows high contrast)
- Print stylesheet colors
- Email template theming
- Third-party component styling

## Implementation Blueprint

### Phase 1: Color Token Extraction
**Objective:** Convert VSCode theme to Tailwind tokens

**Tasks:**

1. Parse theme JSON files
   - **Input:** `nic-dark-theme.json`, `nic-light-theme.json`
   - **Output:** Mapped color tokens
   - **Validation:** Color accuracy verification

2. Create color palette structure
   - **Input:** Extracted color values
   - **Output:** Organized color system
   - **Validation:** Design token consistency

### Phase 2: Tailwind Configuration
**Objective:** Implement color system in Tailwind

**Tasks:**

1. Update Tailwind config
   - **Input:** Color palette tokens
   - **Output:** Extended Tailwind theme
   - **Validation:** Build success

2. Create CSS custom properties
   - **Input:** Theme color values
   - **Output:** Dynamic CSS variables
   - **Validation:** Runtime theme switching

### Phase 3: Component Migration
**Objective:** Apply new colors throughout UI

**Tasks:**

1. Update base styles
   - **Input:** Global style files
   - **Output:** Themed base styles
   - **Validation:** Visual consistency

2. Migrate component colors
   - **Input:** Component style classes
   - **Output:** Theme-aware styling
   - **Validation:** Component testing

3. Implement theme switcher
   - **Input:** User preference
   - **Output:** Dynamic theme application
   - **Validation:** Persistence testing

### Code Structure

**File Organization:**

```
client/
├── tailwind.config.cjs (updated theme)
├── src/
│   ├── style.css (CSS variables)
│   ├── themes/
│   │   ├── colors.js (color tokens)
│   │   ├── light.css (light theme)
│   │   └── dark.css (dark theme)
│   ├── hooks/
│   │   └── useTheme.js (theme hook)
│   └── components/
│       └── ThemeProvider.jsx
```

**Key Components:**

- **ThemeProvider**: Context provider for theme state
- **ThemeToggle**: User theme switcher component
- **ColorSystem**: Centralized color token management

### Integration Points

**Tailwind Extension:**

```javascript
// tailwind.config.cjs
theme: {
  extend: {
    colors: {
      // Primary brand colors
      'nic-primary': 'var(--nic-primary)',
      'nic-secondary': 'var(--nic-secondary)',
      // Semantic colors
      'surface': 'var(--surface)',
      'surface-hover': 'var(--surface-hover)',
      // Text colors
      'text-primary': 'var(--text-primary)',
      'text-secondary': 'var(--text-secondary)',
    }
  }
}
```

**CSS Variables:**

```css
:root {
  /* Light theme colors */
  --nic-primary: #007acc;
  --nic-secondary: #16825d;
  --surface: #ffffff;
  --text-primary: #000000;
}

[data-theme="dark"] {
  /* Dark theme colors */
  --nic-primary: #3794ff;
  --nic-secondary: #16825d;
  --surface: #1e1e1e;
  --text-primary: #d4d4d4;
}
```

## Validation Loop

### Level 1: Color Accuracy
**Tools and Commands:**

```bash
# Extract colors from implementation
npm run extract:colors

# Compare with source theme
npm run validate:theme

# Check color contrast
npm run test:contrast
```

**Acceptance Criteria:**

- [ ] Colors match theme JSON values
- [ ] All tokens properly mapped
- [ ] No hardcoded colors remain
- [ ] Contrast ratios pass WCAG AA

### Level 2: Component Testing
**Test Coverage Requirements:**

- All components render with theme
- Theme switching works globally
- No style conflicts
- Consistent hover/focus states

**Test Commands:**

```bash
# Component visual tests
npm run test:visual

# Theme switching tests
npm run test:theme
```

### Level 3: Accessibility Testing
**Accessibility Requirements:**

- WCAG AA contrast ratios
- Readable text in all states
- Visible focus indicators
- High contrast mode support

**Validation Tools:**

- axe DevTools
- WAVE browser extension
- Lighthouse accessibility audit
- Manual screen reader testing

### Level 4: Cross-Browser Testing
**Browser Test Matrix:**

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

**Test Scenarios:**

- Theme persistence
- Transition smoothness
- Color rendering accuracy
- Performance impact

## Additional Notes

### Security Considerations
**Theme Security:**

- Sanitize theme values
- Prevent CSS injection
- Validate color formats
- Secure theme storage

### Performance Considerations
**Optimization Strategies:**

- Minimize CSS variable usage
- Efficient theme switching
- Reduced repaints/reflows
- Optimized color calculations

### Maintenance and Extensibility
**Future Enhancements:**

- Custom theme creator
- Additional theme presets
- Per-component theming
- Theme marketplace

**Documentation Requirements:**

- [ ] Color token reference
- [ ] Theme implementation guide
- [ ] Component styling patterns
- [ ] Migration guide

### Rollback and Recovery
**Rollback Strategy:**

- Previous theme backup
- Feature flag for new theme
- Gradual rollout capability
- User preference override