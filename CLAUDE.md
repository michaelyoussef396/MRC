# CLAUDE.md - MRC Lead Management System Development Guide

## 🚨 MANDATORY WORKFLOW - READ EVERY TIME
1. **ALWAYS** read `PLANNING.md` at the start of every conversation
2. **ALWAYS** check `TASKS.md` before starting any work
3. **IMMEDIATELY** mark completed tasks in `TASKS.md` 
4. **ADD** any newly discovered tasks to `TASKS.md`
5. **UPDATE** progress status in relevant files

---

## 📋 Current Phase: Phase 1 - Authentication System

### Project Context
**Client**: Mould & Restoration Co. (Melbourne)  
**Objective**: Replace Airtable + Zapier with custom PWA  
**Current Focus**: Step 1 - Secure Authentication Foundation  
**Single User**: Michael (michaelyoussef396@gmail.com)  

### Phase 1 Scope ONLY
- Authentication system with JWT
- Profile management 
- Add technician functionality
- Password reset via email
- Mobile-first responsive design

**DO NOT** build features beyond Phase 1 scope until explicitly instructed.

---

## 🛠 Technical Stack

### Backend
- **Framework**: Flask (Python)
- **Database**: SQLite (development ready)
- **Authentication**: JWT tokens (8hr access, 30day refresh)
- **Security**: bcrypt password hashing, CORS protection
- **Email**: SendGrid/Mailgun integration for password reset

### Frontend
- **Framework**: Next.js 14+ (React)
- **Styling**: Tailwind CSS (mobile-first approach)
- **Components**: Shadcn/ui component library
- **State Management**: React Context API
- **HTTP Client**: Axios with interceptors
- **Notifications**: React Toastify

### Development Tools
- **Primary Tool**: Claude Code CLI
- **Testing**: Playwright for E2E testing
- **Version Control**: Git with GitHub integration

---

## 🔐 Authentication Specifications

### Hardcoded Initial User
```
Username: michael
Email: michaelyoussef396@gmail.com  
Password: AdminMike123!
Full Name: Michael Rodriguez
Phone: +61 400 123 458
```

### Password Requirements
- Minimum 8 characters
- Must contain: uppercase + lowercase + number + special character
- Real-time strength indicator in UI
- bcrypt hashing on backend

### Session Management
- JWT access tokens: 8-hour expiration
- JWT refresh tokens: 30-day expiration ("remember me")
- Automatic token refresh without user interruption
- Secure HttpOnly cookies for token storage

---

## 📱 Mobile-First Requirements

### Responsive Breakpoints
- **Mobile**: 375px - 767px (PRIMARY FOCUS)
- **Tablet**: 768px - 1023px 
- **Desktop**: 1024px+ (enhancement)

### Touch Optimization
- Minimum 44px touch targets
- Single-hand navigation patterns
- Touch-friendly form controls
- Optimized for iOS Safari and Chrome mobile

### Performance Targets
- First Contentful Paint < 1.5s on 3G
- Time to Interactive < 3s
- Lighthouse Mobile Performance Score > 90

---

## 🤖 Connected Agent Portfolio (11 Agents)

### Quality Assurance Team
- **Design Review Agent** - Comprehensive UI/UX review with live testing
- **Security Auditor** - JWT implementation and API security
- **Test Engineer** - Automated authentication flow testing
- **Code Reviewer** - Code quality and security standards

### Development Team
- **Context Manager** - Multi-agent workflow coordination
- **Fullstack Developer** - Flask + Next.js integration
- **Frontend Developer** - React/Next.js implementation
- **Mobile Developer** - Mobile-first responsive design

### Specialists
- **Database Architect** - SQLite schema optimization
- **Database Optimization** - Query performance tuning
- **React Performance Optimization** - Mobile performance optimization

---

## 🎨 Visual Development

### Design Principles
- Comprehensive design checklist in `/context/design-principles.md`
- Brand style guide in `/context/style-guide.md`
- When making visual (front-end, UI/UX) changes, always refer to these files for guidance

### Quick Visual Check
IMMEDIATELY after implementing any front-end change:
1. **Identify what changed** - Review the modified components/pages
2. **Navigate to affected pages** - Use `mcp__playwright__browser_navigate` to visit each changed view
3. **Verify design compliance** - Compare against `/context/design-principles.md` and `/context/style-guide.md`
4. **Validate feature implementation** - Ensure the change fulfills the user's specific request
5. **Check acceptance criteria** - Review any provided context files or requirements
6. **Capture evidence** - Take full page screenshot at desktop viewport (1440px) of each changed view
7. **Check for errors** - Run `mcp__playwright__browser_console_messages`

This verification ensures changes meet design standards and user requirements.

### Comprehensive Design Review
Invoke the `@agent-design-review` subagent for thorough design validation when:
- Completing significant UI/UX features
- Before finalizing PRs with visual changes
- Needing comprehensive accessibility and responsiveness testing

---

## 📁 Project Structure

```
mrc-lead-management/
├── backend/
│   ├── app.py              # Flask application
│   ├── models.py           # SQLAlchemy models
│   ├── auth.py             # Authentication routes
│   ├── config.py           # Configuration
│   └── requirements.txt
├── frontend/
│   ├── app/                # Next.js app directory
│   ├── components/         # Reusable UI components
│   ├── contexts/           # React contexts
│   ├── lib/                # Utility functions
│   └── styles/            # Global styles
├── context/
│   ├── PRD.md             # Project requirements
│   ├── design-principles.md
│   └── style-guide.md
├── docs/
├── CLAUDE.md              # This file
├── PLANNING.md            # Project planning
└── TASKS.md              # Task tracking
```

---

## 🔄 Development Workflow

### Agent Coordination Process
1. **Context Manager** reads project requirements and coordinates agents
2. **Security Auditor** validates all authentication-related implementations
3. **Frontend/Mobile Developers** implement UI following design guidelines
4. **Design Review Agent** conducts comprehensive testing:
   - Multi-viewport screenshots (375px, 768px, 1440px)
   - Accessibility compliance (WCAG 2.1 AA)
   - User flow validation
   - Performance testing
5. **Test Engineer** creates automated test coverage
6. **Database specialists** optimize data layer

### Quality Gates
- All authentication routes must pass Security Auditor review
- All UI changes require Design Review Agent validation
- Mobile responsiveness tested across all breakpoints
- Zero console errors in browser developer tools
- WCAG 2.1 AA accessibility compliance verified

---

## 🧪 Testing Standards

### Playwright E2E Testing
- Authentication flow testing (login, logout, password reset)
- Form validation testing
- Mobile responsiveness across viewports
- Accessibility testing (keyboard navigation, screen readers)
- Visual regression testing with screenshots

### Test Coverage Requirements
- Authentication endpoints: 100%
- Form validation logic: 100%
- User flow scenarios: All critical paths
- Error handling: All error states
- Mobile interactions: Touch events and gestures

---

## 🔒 Security Standards

### Authentication Security
- JWT tokens with proper expiration
- Secure password hashing (bcrypt with salt)
- CORS configuration for frontend-backend communication
- Input validation and sanitization
- Rate limiting for login attempts

### Data Protection
- No sensitive data in local storage
- Secure token management
- HTTPS enforcement in production
- SQL injection prevention
- XSS protection

---

## 🚀 Development Commands

### Backend (Flask)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # Code linting
```

### Testing
```bash
npm run test         # Run all tests
npx playwright test  # Run Playwright tests
```

---

## 📋 Phase 1 Success Criteria

### Must Work Perfectly
- Michael can log in with michaelyoussef396@gmail.com reliably
- Profile updates save correctly without data loss
- New team member accounts created and immediately functional
- Password reset emails deliver and reset process completes
- Mobile interface feels native and responsive across all breakpoints
- All form validation provides helpful, immediate feedback
- Sessions persist appropriately and logout works cleanly
- Zero security vulnerabilities or authentication bugs

### Agent Validation Requirements
- **Security Auditor**: Approves JWT implementation and API security
- **Design Review Agent**: Validates responsive design and accessibility
- **Mobile Developer**: Confirms mobile-first implementation
- **Test Engineer**: Comprehensive test coverage achieved

### Definition of Complete
Authentication system works seamlessly - users never think about it. Login is fast, profile management is intuitive, adding team members is effortless. Every edge case handled with helpful, friendly guidance.

**Ready for Phase 2 when**: Authentication feels like a polished, commercial-grade system with full agent validation.