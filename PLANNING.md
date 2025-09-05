# PLANNING.md - MRC Lead Management System

## Vision Statement

Transform Mould & Restoration Co. from manual Airtable + Zapier workflows into a streamlined, mobile-first digital platform that empowers technicians in the field and scales business operations efficiently. The system will handle the complete restoration workflow from lead inquiry through job completion and customer review collection.

## Business Context

**Company**: Mould & Restoration Co. (Melbourne, Australia)  
**Industry**: Professional mould restoration services  
**Team Size**: 2 technicians (Glen, Clayton) + 1 owner/developer (Michael)  
**Service Area**: Melbourne metropolitan area  
**Operating Hours**: 7am-7pm daily  

**Current Pain Point**: Fragmented workflow using Airtable for data management and Zapier for automation, resulting in inefficient mobile experience for field technicians.

## Project Architecture

### System Design Philosophy
- **Mobile-First**: Technicians are the primary users working on job sites
- **Progressive Web App**: Offline capability for poor signal environments
- **API-Driven**: Clean separation between frontend and backend
- **Scalable**: Designed to grow from 3 users to larger teams

### High-Level Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Mobile PWA    │◄──►│   Flask API      │◄──►│   SQLite DB     │
│   (Next.js)     │    │   (Python)       │    │   (Development) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Service       │    │   Email Service  │    │   File Storage  │
│   Worker        │    │   (SendGrid)     │    │   (Local/Cloud) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Technology Stack

### Frontend Technologies
- **Next.js 14+** - React framework with app router
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Component library for consistent UI
- **React Context API** - State management for authentication
- **Axios** - HTTP client with request/response interceptors
- **React Toastify** - User notifications and feedback

### Backend Technologies
- **Flask** - Python web framework
- **SQLAlchemy** - Object-relational mapping
- **Flask-JWT-Extended** - JWT token authentication
- **Flask-CORS** - Cross-origin resource sharing
- **bcrypt** - Password hashing
- **SQLite** - Database (development)
- **PostgreSQL** - Database (production ready)

### Development Tools
- **Claude Code CLI** - Primary development environment
- **Playwright** - End-to-end testing and visual verification
- **Git** - Version control
- **GitHub** - Repository hosting and CI/CD

### External Services
- **SendGrid/Mailgun** - Email delivery for password resets
- **Vercel** - Frontend hosting (future)
- **Railway/Heroku** - Backend hosting (future)

## Development Phases

### Phase 1: Authentication Foundation (CURRENT)
**Scope**: Secure user authentication and profile management  
**Duration**: Foundation phase  
**Success Criteria**: Bulletproof login system ready for business features  

### Phase 2: Dashboard & Navigation (PLANNED)
**Scope**: Main application interface and navigation structure  
**Dependencies**: Phase 1 complete  

### Phase 3: Lead Management (PLANNED)
**Scope**: Customer inquiry capture and initial processing  
**Dependencies**: Phases 1-2 complete  

### Phase 4: Mobile Inspection Forms (PLANNED)
**Scope**: 15-section inspection forms with conditional logic  
**Dependencies**: Phases 1-3 complete  

### Phase 5: Cost Calculation Engine (PLANNED)
**Scope**: Real-time pricing with discount structures  
**Dependencies**: Phases 1-4 complete  

### Phase 6: Scheduling & Calendar (PLANNED)
**Scope**: Job scheduling with Melbourne travel time optimization  
**Dependencies**: Phases 1-5 complete  

### Phase 7: Report Generation (PLANNED)
**Scope**: AI-powered professional reports with PDF export  
**Dependencies**: Phases 1-6 complete  

### Phase 8: PWA Features (PLANNED)
**Scope**: Offline capability and mobile app installation  
**Dependencies**: Core features complete  

## Connected Agent Portfolio

### Quality Assurance Team
- **Design Review Agent** - Comprehensive UI/UX validation
- **Security Auditor** - Authentication and API security
- **Test Engineer** - Automated testing coverage
- **Code Reviewer** - Code quality standards

### Development Team
- **Context Manager** - Multi-agent workflow coordination
- **Fullstack Developer** - Complete feature implementation
- **Frontend Developer** - React/Next.js specialization
- **Mobile Developer** - Mobile-first optimization

### Technical Specialists
- **Database Architect** - Schema design and optimization
- **Database Optimization** - Performance tuning
- **React Performance Optimization** - Mobile performance

## MCP Server Infrastructure

### Core Servers
- **Context7** - Project documentation management
- **Playwright** - Browser automation and visual testing
- **GitHub Integration** - Version control and deployment

### Development Workflow
1. Context7 manages project requirements and documentation
2. Agents coordinate development tasks through Context Manager
3. Playwright provides automated testing and visual verification
4. GitHub manages code versioning and deployment pipeline

## Quality Standards

### Performance Requirements
- **Mobile Performance**: < 3s Time to Interactive on 3G
- **Lighthouse Score**: > 90 for mobile performance
- **Accessibility**: WCAG 2.1 AA compliance
- **Browser Support**: Chrome, Safari, Firefox, Edge (latest 2 versions)

### Testing Strategy
- **Unit Tests**: Backend API endpoints and utility functions
- **Integration Tests**: Frontend-backend authentication flow
- **E2E Tests**: Complete user workflows via Playwright
- **Visual Regression**: Screenshot comparison across breakpoints
- **Accessibility Tests**: Keyboard navigation and screen reader support

### Security Standards
- **Authentication**: JWT with secure token management
- **Authorization**: Role-based access control ready for expansion
- **Data Protection**: Input validation, SQL injection prevention
- **Communication**: HTTPS enforcement, CORS configuration

## Risk Assessment

### Technical Risks
- **Mobile Network Connectivity**: Mitigated by offline-first design
- **SQLite Scalability**: Migration path to PostgreSQL documented
- **Email Delivery**: Multiple provider options configured

### Business Risks
- **User Adoption**: Mitigated by involving Glen and Clayton in UX testing
- **Feature Scope Creep**: Controlled by phase-based development
- **Performance on Older Devices**: Addressed by mobile-first optimization

## Success Metrics

### Phase 1 Metrics
- Authentication success rate: > 99.9%
- Mobile responsiveness: Perfect across 375px, 768px, 1440px
- Load time on mobile: < 2s on 3G connection
- Security audit: Zero vulnerabilities
- Accessibility score: WCAG AA compliance

### Long-term Metrics (Future Phases)
- Lead processing time reduction: > 50%
- Technician mobile app usage: > 90% of field work
- Customer satisfaction: > 4.5/5 stars
- System uptime: > 99.5%

## Resource Requirements

### Development Environment
- Node.js 18+ for frontend development
- Python 3.8+ for backend development
- Git for version control
- Modern browser for testing
- Mobile devices for real-world testing

### External Dependencies
- Email service account (SendGrid/Mailgun)
- Domain name for production deployment
- SSL certificates for secure communication
- Cloud hosting for production environment

## Future Considerations

### Scalability Planning
- Database migration from SQLite to PostgreSQL
- Horizontal scaling with load balancers
- CDN integration for static assets
- Background job processing with Redis

### Feature Expansion
- Multi-tenant architecture for other restoration companies
- Advanced analytics and reporting
- Mobile app deployment to App Store/Play Store
- Integration with accounting software
- Customer portal for job tracking

This planning document provides the foundation for all development decisions and will be updated as the project evolves through each phase.