# MRC Authentication System - Design Principles

## I. Core Design Philosophy & Strategy

*   [ ] **Mobile-First Priority:** Prioritize technician mobile experience in every design decision - authentication must work perfectly on job sites.
*   [ ] **Meticulous Craft:** Aim for precision, polish, and high quality in every UI element and interaction.
*   [ ] **Speed & Performance:** Design for fast load times and snappy, responsive interactions on mobile networks.
*   [ ] **Simplicity & Clarity:** Strive for a clean, uncluttered interface. Authentication flows should be immediately intuitive.
*   [ ] **Focus & Efficiency:** Help technicians log in quickly with minimal friction. Single-tap actions where possible.
*   [ ] **Consistency:** Maintain uniform design language across login, dashboard, and settings screens.
*   [ ] **Accessibility (WCAG AA+):** Design for inclusivity. Ensure sufficient color contrast, keyboard navigability, and screen reader compatibility.
*   [ ] **Opinionated Design:** Establish clear, efficient authentication workflows, reducing decision fatigue for users.

## II. MRC Design System Foundation

### Color Palette (Enhanced for Professional Authentication)

*   [ ] **Primary Brand Colors:**
    *   [ ] **Deep Navy:** `#131A7F` - Primary brand color for buttons, links, active states
    *   [ ] **Professional Blue:** `#4C55A0` - Secondary actions, hover states, accents
    *   [ ] **Pure White:** `#FFFFFF` - Backgrounds, card surfaces, primary text contrast
*   [ ] **Neutrals:**
    *   [ ] **Off-White:** `#F8F8F8` - Subtle backgrounds, input field backgrounds
    *   [ ] **Warm Gray:** `#B2A09B` - Secondary text, borders, disabled states
    *   [ ] **Charcoal:** `#2A2A2A` - Primary text color
    *   [ ] **Light Gray:** `#E5E5E5` - Borders, dividers
    *   [ ] **Medium Gray:** `#8A8A8A` - Helper text, placeholders
*   [ ] **Semantic Colors:**
    *   [ ] **Success Green:** `#10B981` - Success states, confirmed actions
    *   [ ] **Error Red:** `#EF4444` - Error states, destructive actions, validation errors
    *   [ ] **Warning Amber:** `#F59E0B` - Warning states, attention needed
    *   [ ] **Info Blue:** `#3B82F6` - Informational messages, neutral notifications
*   [ ] **Accessibility Check:** All color combinations meet WCAG AA contrast ratios (4.5:1 minimum)

### Typography Scale (Optimized for Mobile Authentication)

*   [ ] **Primary Font Family:** Inter (clean, legible sans-serif optimized for screens)
*   [ ] **Modular Scale:**
    *   [ ] **H1 (Page Titles):** 28px / 1.25 line-height, SemiBold (mobile-optimized size)
    *   [ ] **H2 (Section Headers):** 24px / 1.3 line-height, SemiBold
    *   [ ] **H3 (Card Titles):** 18px / 1.4 line-height, Medium
    *   [ ] **Body Large:** 16px / 1.5 line-height, Regular (primary text)
    *   [ ] **Body Medium (Default):** 14px / 1.5 line-height, Regular
    *   [ ] **Body Small/Caption:** 12px / 1.4 line-height, Regular
*   [ ] **Font Weights:** Regular (400), Medium (500), SemiBold (600)
*   [ ] **Line Height:** Generous spacing for mobile readability (1.5-1.7 for body text)

### Spacing System (Touch-Optimized)

*   [ ] **Base Unit:** 8px (optimized for mobile touch targets)
*   [ ] **Spacing Scale:** 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px
*   [ ] **Touch Targets:** Minimum 44px for all interactive elements
*   [ ] **Form Spacing:** 16px between form elements, 24px between sections

### Border Radii (Modern & Friendly)

*   [ ] **Small (Inputs/Buttons):** 6px
*   [ ] **Medium (Cards/Modals):** 12px
*   [ ] **Large (Main Containers):** 16px

### Core UI Components (Authentication-Specific)

*   [ ] **Buttons:**
    *   [ ] Primary: Deep Navy background, white text, 12px padding vertical
    *   [ ] Secondary: White background, Deep Navy border and text
    *   [ ] Ghost: Transparent background, Deep Navy text
    *   [ ] Destructive: Error Red background, white text
    *   [ ] All buttons 44px minimum height for touch accessibility
*   [ ] **Input Fields:**
    *   [ ] Height: 48px minimum for mobile usability
    *   [ ] Padding: 12px horizontal, 16px vertical
    *   [ ] Border: 1px solid Light Gray, focus state Deep Navy
    *   [ ] Background: Off-White with clear labels and helper text
*   [ ] **Form Elements:**
    *   [ ] Password visibility toggle with clear eye icon
    *   [ ] Checkbox styling consistent with brand colors
    *   [ ] Toggle switches for "Remember Me" functionality
*   [ ] **Cards:**
    *   [ ] White background, subtle shadow, 12px border radius
    *   [ ] 16px internal padding, clear content hierarchy
*   [ ] **Navigation:**
    *   [ ] Tab navigation with active state indicators
    *   [ ] Breadcrumb navigation for settings flows
*   [ ] **Status Indicators:**
    *   [ ] Success badges: Success Green with white text
    *   [ ] Error states: Error Red with white text and clear icons
    *   [ ] Loading spinners: Deep Navy color, smooth animations
*   [ ] **Icons:**
    *   [ ] Lucide React icon set (clean, modern, consistent)
    *   [ ] 20px size for inline icons, 24px for standalone actions

## III. Mobile-First Layout & Structure

*   [ ] **Responsive Breakpoints:**
    *   [ ] Mobile: 375px - 767px (primary focus)
    *   [ ] Tablet: 768px - 1023px 
    *   [ ] Desktop: 1024px+ (enhancement)
*   [ ] **Strategic White Space:** Ample spacing to prevent accidental touches
*   [ ] **Clear Visual Hierarchy:** Large, clear headings and obvious action buttons
*   [ ] **Consistent Alignment:** Left-aligned text, centered actions
*   [ ] **Authentication Layout:**
    *   [ ] Single-column layout for mobile
    *   [ ] Centered authentication forms with maximum 400px width
    *   [ ] Clear progress indicators for multi-step flows
*   [ ] **Touch-Optimized Design:** All interactive elements easily tappable with thumb

## IV. Interaction Design & Micro-Interactions

*   [ ] **Purposeful Animations:**
    *   [ ] Button press feedback: 150ms scale down (0.95x) on touch
    *   [ ] Form validation: Smooth 200ms transitions for error states
    *   [ ] Loading states: Smooth spinner animations, skeleton screens
    *   [ ] Page transitions: Subtle slide animations (200ms ease-in-out)
*   [ ] **Immediate Feedback:**
    *   [ ] Form validation feedback appears within 300ms of input
    *   [ ] Button states change immediately on interaction
    *   [ ] Clear success/error notifications with appropriate colors
*   [ ] **Keyboard Navigation:** All authentication flows fully accessible via keyboard
*   [ ] **Focus Management:** Clear focus states with Deep Navy outline

## V. Authentication-Specific Design Requirements

### A. Login Screen Design
*   [ ] **Clear Branding:** MRC logo prominently displayed
*   [ ] **Minimal Cognitive Load:** Only essential fields visible
*   [ ] **Password Visibility:** Clear toggle for password field
*   [ ] **Remember Me:** Prominent checkbox with clear explanation
*   [ ] **Error Handling:** Friendly, specific error messages
*   [ ] **Forgot Password:** Clear, accessible link placement

### B. Settings/Profile Management
*   [ ] **Tab Navigation:** Clear visual distinction between active/inactive tabs
*   [ ] **Form Sections:** Logical grouping with clear visual separation
*   [ ] **Save State Indicators:** Clear feedback when changes are saved
*   [ ] **Password Strength:** Visual indicator with color-coded feedback
*   [ ] **Validation Feedback:** Real-time, inline validation messages

### C. Add Technician Flow
*   [ ] **Progressive Disclosure:** Show only necessary fields initially
*   [ ] **Form Validation:** Clear requirements and real-time feedback
*   [ ] **Success States:** Confirmation of successful account creation
*   [ ] **User Guidance:** Helper text for complex requirements

## VI. Responsive Design Requirements

*   [ ] **Mobile Portrait (375px):**
    *   [ ] Single column layout
    *   [ ] Large touch targets (44px minimum)
    *   [ ] Readable text (16px minimum)
    *   [ ] Thumb-friendly navigation placement
*   [ ] **Tablet (768px):**
    *   [ ] Optimized for both portrait and landscape
    *   [ ] Larger form layouts with better spacing
    *   [ ] Side-by-side content where appropriate
*   [ ] **Desktop (1024px+):**
    *   [ ] Centered layouts with maximum widths
    *   [ ] Enhanced hover states and interactions
    *   [ ] Keyboard shortcuts and accessibility features

## VII. Implementation Guidelines

*   [ ] **Tailwind CSS Integration:**
    *   [ ] Custom color palette in tailwind.config.js
    *   [ ] Consistent spacing utilities
    *   [ ] Custom component classes for authentication elements
*   [ ] **Shadcn/ui Components:**
    *   [ ] Button, Input, Card, Badge components
    *   [ ] Form validation components
    *   [ ] Toast notifications for feedback
*   [ ] **Performance Optimization:**
    *   [ ] Lazy loading for non-critical elements
    *   [ ] Optimized images and icons
    *   [ ] Minimal JavaScript bundle for authentication flows

## VIII. Accessibility & Quality Standards

*   [ ] **WCAG 2.1 AA Compliance:**
    *   [ ] Color contrast ratios of 4.5:1 minimum
    *   [ ] Keyboard navigation for all interactive elements
    *   [ ] Screen reader compatible labels and descriptions
    *   [ ] Focus indicators clearly visible
*   [ ] **Mobile Accessibility:**
    *   [ ] Voice control compatibility
    *   [ ] Support for large text preferences
    *   [ ] High contrast mode compatibility
*   [ ] **Testing Requirements:**
    *   [ ] Cross-browser compatibility (Chrome, Safari, Firefox, Edge)
    *   [ ] Mobile device testing (iOS Safari, Chrome mobile)
    *   [ ] Accessibility testing with screen readers
    *   [ ] Performance testing on slower networks

## IX. Brand Integration

*   [ ] **Professional Aesthetic:**
    *   [ ] Clean, modern design reflecting MRC's professional services
    *   [ ] Trust-building visual elements
    *   [ ] Consistent with eventual business application design
*   [ ] **Color Psychology:**
    *   [ ] Deep Navy conveys trust and professionalism
    *   [ ] White space creates clarity and focus
    *   [ ] Warm grays add approachability without compromising authority

This design system ensures the MRC authentication system feels polished, professional, and perfectly suited for mobile-first technician use while maintaining the flexibility to scale for future business features.