# MRC Authentication System - Style Guide

## Brand Identity

### Logo & Visual Identity
- **Company Name**: Mould & Restoration Co. (MRC)
- **Industry**: Professional mould restoration services
- **Location**: Melbourne, Australia
- **Brand Personality**: Professional, trustworthy, efficient, mobile-first

### Brand Values
- **Reliability**: Systems that work flawlessly for technicians in the field
- **Professionalism**: Clean, polished interfaces that reflect service quality
- **Efficiency**: Streamlined workflows that save time and reduce friction
- **Accessibility**: Inclusive design for all team members

## Color System

### Primary Brand Colors
```css
/* Primary Navy - Main brand color */
--mrc-navy: #131A7F;
--mrc-navy-hover: #0F1568;
--mrc-navy-active: #0C1150;

/* Professional Blue - Secondary brand */
--mrc-blue: #4C55A0;
--mrc-blue-hover: #3F4785;
--mrc-blue-active: #323A6A;
```

### Neutral Colors
```css
/* Base whites and grays */
--mrc-white: #FFFFFF;
--mrc-off-white: #F8F8F8;
--mrc-light-gray: #E5E5E5;
--mrc-medium-gray: #8A8A8A;
--mrc-warm-gray: #B2A09B;
--mrc-charcoal: #2A2A2A;
```

### Semantic Colors
```css
/* Status colors */
--mrc-success: #10B981;
--mrc-success-light: #D1FAE5;
--mrc-error: #EF4444;
--mrc-error-light: #FEE2E2;
--mrc-warning: #F59E0B;
--mrc-warning-light: #FEF3C7;
--mrc-info: #3B82F6;
--mrc-info-light: #DBEAFE;
```

### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    colors: {
      'mrc-navy': {
        DEFAULT: '#131A7F',
        hover: '#0F1568',
        active: '#0C1150',
      },
      'mrc-blue': {
        DEFAULT: '#4C55A0',
        hover: '#3F4785',
        active: '#323A6A',
      },
      'mrc-gray': {
        50: '#F8F8F8',
        100: '#E5E5E5',
        400: '#8A8A8A',
        500: '#B2A09B',
        900: '#2A2A2A',
      },
    }
  }
}
```

## Typography

### Font Stack
```css
/* Primary font family */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Type Scale & Usage

#### Headings
```css
/* H1 - Page titles (Login, Settings, etc.) */
.mrc-h1 {
  font-size: 28px;
  font-weight: 600;
  line-height: 1.25;
  color: var(--mrc-charcoal);
  letter-spacing: -0.02em;
}

/* H2 - Section headers (Profile, Add Technician) */
.mrc-h2 {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--mrc-charcoal);
}

/* H3 - Card titles, form sections */
.mrc-h3 {
  font-size: 18px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--mrc-charcoal);
}
```

#### Body Text
```css
/* Body Large - Important text, primary content */
.mrc-body-large {
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
  color: var(--mrc-charcoal);
}

/* Body Medium - Default text size */
.mrc-body-medium {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: var(--mrc-charcoal);
}

/* Body Small - Helper text, captions */
.mrc-body-small {
  font-size: 12px;
  font-weight: 400;
  line-height: 1.4;
  color: var(--mrc-medium-gray);
}
```

#### Specialized Text
```css
/* Labels - Form labels, UI labels */
.mrc-label {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--mrc-charcoal);
}

/* Error text */
.mrc-error-text {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.4;
  color: var(--mrc-error);
}

/* Success text */
.mrc-success-text {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.4;
  color: var(--mrc-success);
}
```

## Component Styles

### Buttons

#### Primary Button
```css
.mrc-btn-primary {
  background: var(--mrc-navy);
  color: var(--mrc-white);
  border: none;
  border-radius: 6px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 500;
  min-height: 44px;
  transition: all 150ms ease-in-out;
}

.mrc-btn-primary:hover {
  background: var(--mrc-navy-hover);
  transform: translateY(-1px);
}

.mrc-btn-primary:active {
  background: var(--mrc-navy-active);
  transform: scale(0.98);
}
```

#### Secondary Button
```css
.mrc-btn-secondary {
  background: var(--mrc-white);
  color: var(--mrc-navy);
  border: 1px solid var(--mrc-navy);
  border-radius: 6px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 500;
  min-height: 44px;
  transition: all 150ms ease-in-out;
}

.mrc-btn-secondary:hover {
  background: var(--mrc-off-white);
  border-color: var(--mrc-navy-hover);
}
```

#### Destructive Button
```css
.mrc-btn-destructive {
  background: var(--mrc-error);
  color: var(--mrc-white);
  border: none;
  border-radius: 6px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 500;
  min-height: 44px;
}
```

### Form Elements

#### Input Fields
```css
.mrc-input {
  width: 100%;
  min-height: 48px;
  padding: 12px 16px;
  border: 1px solid var(--mrc-light-gray);
  border-radius: 6px;
  background: var(--mrc-off-white);
  font-size: 16px;
  line-height: 1.5;
  color: var(--mrc-charcoal);
  transition: all 200ms ease-in-out;
}

.mrc-input:focus {
  outline: none;
  border-color: var(--mrc-navy);
  box-shadow: 0 0 0 3px rgba(19, 26, 127, 0.1);
}

.mrc-input.error {
  border-color: var(--mrc-error);
  background: var(--mrc-error-light);
}

.mrc-input::placeholder {
  color: var(--mrc-medium-gray);
  font-size: 14px;
}
```

#### Checkbox & Toggle
```css
.mrc-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--mrc-light-gray);
  border-radius: 4px;
  background: var(--mrc-white);
}

.mrc-checkbox:checked {
  background: var(--mrc-navy);
  border-color: var(--mrc-navy);
}

.mrc-toggle {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: var(--mrc-light-gray);
  transition: all 200ms ease-in-out;
}

.mrc-toggle.active {
  background: var(--mrc-navy);
}
```

### Cards & Containers

#### Main Card
```css
.mrc-card {
  background: var(--mrc-white);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--mrc-light-gray);
}

.mrc-card-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--mrc-light-gray);
}
```

#### Settings Card
```css
.mrc-settings-card {
  background: var(--mrc-white);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid var(--mrc-light-gray);
}
```

### Navigation & Tabs

#### Tab Navigation
```css
.mrc-tabs {
  display: flex;
  border-bottom: 1px solid var(--mrc-light-gray);
  margin-bottom: 24px;
}

.mrc-tab {
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 500;
  color: var(--mrc-medium-gray);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 200ms ease-in-out;
}

.mrc-tab.active {
  color: var(--mrc-navy);
  border-bottom-color: var(--mrc-navy);
}

.mrc-tab:hover:not(.active) {
  color: var(--mrc-charcoal);
}
```

### Status Indicators

#### Badges
```css
.mrc-badge-success {
  background: var(--mrc-success);
  color: var(--mrc-white);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.mrc-badge-error {
  background: var(--mrc-error);
  color: var(--mrc-white);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.mrc-badge-warning {
  background: var(--mrc-warning);
  color: var(--mrc-white);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
```

#### Loading States
```css
.mrc-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--mrc-light-gray);
  border-top-color: var(--mrc-navy);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

## Layout & Spacing

### Spacing Scale
```css
/* Base spacing units */
--space-1: 4px;   /* xs */
--space-2: 8px;   /* sm */
--space-3: 12px;  /* base */
--space-4: 16px;  /* md */
--space-6: 24px;  /* lg */
--space-8: 32px;  /* xl */
--space-12: 48px; /* 2xl */
--space-16: 64px; /* 3xl */
```

### Container Widths
```css
.mrc-container {
  max-width: 400px; /* Mobile-optimized auth forms */
  margin: 0 auto;
  padding: 0 16px;
}

.mrc-container-wide {
  max-width: 600px; /* Settings pages */
  margin: 0 auto;
  padding: 0 16px;
}
```

### Responsive Breakpoints
```css
/* Mobile first approach */
@media (min-width: 375px) { /* Mobile */ }
@media (min-width: 768px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
```

## Icons

### Icon System
- **Library**: Lucide React
- **Default Size**: 20px for inline, 24px for standalone
- **Color**: Inherits from parent or uses `--mrc-medium-gray`

#### Common Authentication Icons
```jsx
// Password visibility
<EyeIcon className="h-5 w-5" />
<EyeSlashIcon className="h-5 w-5" />

// Form actions
<CheckIcon className="h-5 w-5 text-mrc-success" />
<XIcon className="h-5 w-5 text-mrc-error" />
<AlertTriangleIcon className="h-5 w-5 text-mrc-warning" />

// Navigation
<SettingsIcon className="h-5 w-5" />
<UserIcon className="h-5 w-5" />
<LogOutIcon className="h-5 w-5" />
```

## Animation & Transitions

### Timing Functions
```css
--easing-standard: cubic-bezier(0.4, 0.0, 0.2, 1);
--easing-decelerate: cubic-bezier(0.0, 0.0, 0.2, 1);
--easing-accelerate: cubic-bezier(0.4, 0.0, 1, 1);
```

### Duration Scale
```css
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;
```

### Common Animations
```css
/* Button hover lift */
.hover-lift:hover {
  transform: translateY(-1px);
  transition: transform var(--duration-fast) var(--easing-standard);
}

/* Focus ring */
.focus-ring:focus {
  box-shadow: 0 0 0 3px rgba(19, 26, 127, 0.1);
  transition: box-shadow var(--duration-fast) var(--easing-standard);
}

/* Slide in animation */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## Accessibility Standards

### Focus States
- All interactive elements must have visible focus indicators
- Focus ring: 3px solid rgba(19, 26, 127, 0.1)
- Focus should be clearly visible against all backgrounds

### Color Contrast
- Primary text: 7:1 ratio (AAA)
- Secondary text: 4.5:1 ratio (AA)
- Interactive elements: 4.5:1 ratio minimum

### Touch Targets
- Minimum 44px x 44px for all interactive elements
- 8px minimum spacing between touch targets
- Consider thumb reach zones on mobile devices

## Implementation Notes

### Shadcn/ui Integration
```jsx
// Example button implementation
import { Button } from "@/components/ui/button"

<Button className="mrc-btn-primary">
  Sign In
</Button>
```

### CSS Custom Properties Usage
```css
/* Use CSS variables for consistency */
.custom-component {
  background: var(--mrc-white);
  color: var(--mrc-charcoal);
  padding: var(--space-4);
  border-radius: 6px;
}
```

This style guide ensures consistent implementation of the MRC brand identity across all authentication interfaces while maintaining the mobile-first, professional aesthetic required for technician use.