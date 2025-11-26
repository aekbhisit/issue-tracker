# Development Process Questions - Clarification Status

This document focuses on **development process questions only** from the complete clarification question list. Questions are categorized by their impact on development.

## ✅ Already Answered in Phase Plans

### Product & Business Logic
- ✅ **Q1**: Internal + external customers (staff-only admin dashboard, customers via frontend)
- ✅ **Q3**: Single-tenant (one organization)
- ✅ **Q4**: Anonymous reporting supported (testers can submit without login)
- ✅ **Q5**: Issue lifecycle workflow - 4-step (`open` → `in-progress` → `resolved` → `closed`)
- ✅ **Q6**: Required statuses - Fixed set: `open`, `in-progress`, `resolved`, `closed`
- ✅ **Q7**: Severity levels - `low`, `medium`, `high`, `critical`

### Collector SDK
- ✅ **Q8**: Floating button - Basic floating button (IC-2)
- ✅ **Q11**: SDK authentication - Project key validation only
- ✅ **Q12**: Rate limiting - Not implemented in IC-5
- ✅ **Q13**: Screenshot type - Element-only in IC-3, full-page deferred to IC-8
- ✅ **Q15**: Max screenshot size - 10MB per screenshot
- ✅ **Q16**: Metadata fields - URL, userAgent, viewport, screen, language, timezone, timestamp
- ✅ **Q17**: User identity - Optional (via `window.issueCollectorUser`)
- ✅ **Q19**: Sensitive data masking - Basic redaction (passwords, tokens), no PII masking in screenshots
- ✅ **Q20**: Console log levels - `log`, `warn`, `error`
- ✅ **Q21**: Network failure capture - Only failures (status >= 400)

### Issue API
- ✅ **Q22**: API authentication - Project key validation only
- ✅ **Q23**: Dashboard authentication - Email/Password + JWT
- ✅ **Q24**: Required issue fields - title, description, severity, metadata
- ✅ **Q26**: Issue ID format - Auto-increment integer
- ✅ **Q27**: Screenshot storage - Local (dev) / S3/MinIO (production), signed URLs
- ✅ **Q30**: Max payload size - 10MB per screenshot
- ✅ **Q31**: Worker tasks - Screenshot optimization, log normalization

### Issue Dashboard
- ✅ **Q34**: Filters - project, status, severity, date range, assignee, reporter
- ✅ **Q35**: UI type - Table view (no Kanban in IC-6)
- ✅ **Q36**: Screenshot viewer - Basic viewer with download (no annotations)

### Project & Environment
- ✅ **Q40**: Environments - dev, staging, prod (standard names)

### Browser Extension
- ✅ **Q43**: Browser extension - Deferred to IC-8 (not required for MVP)

### Security
- ✅ **Q50**: Sensitive field masking - Basic redaction (passwords, tokens, Authorization headers)

---

## ✅ Now Answered in Phase Plans

### Collector SDK (IC-2, IC-3, IC-4)

**Q9: Dark mode needed?**
- ✅ **Answer**: **No dark mode in IC-2** - light theme only (IC-2 updated)
- **Rationale**: Simpler implementation, can add dark mode support later if needed

**Q10: Custom branding per project?**
- ✅ **Answer**: **No custom branding in IC-2** - standard widget appearance (IC-2 updated)
- **Rationale**: Keep MVP simple, can add per-project branding later

**Q14: Scrolling screenshot support?**
- ✅ **Answer**: **No scrolling screenshots in IC-3** - element capture only (IC-3 updated)
- **Rationale**: Element-level capture sufficient for MVP, scrolling deferred to IC-8

**Q18: Depth of DOM capture?**
- ✅ **Answer**: **outerHTML only** - not full DOM tree (IC-3 updated)
- **Rationale**: Sufficient for element identification and debugging

**Q54: Target SDK bundle size?**
- ✅ **Answer**: **< 50KB gzipped** (IC-2 updated)
- **Rationale**: Reasonable size for modern web, optimize build accordingly

**Q55: Low-end device support?**
- ✅ **Answer**: **Modern browsers only** - latest 2 versions (IC-2 updated)
- **Rationale**: Shadow DOM requires modern browsers, aligns with SDK requirements

## ❓ Unclear / Need Clarification for Development

### Issue API (IC-5)

**Q25: Auto-generate issue title?**
- ✅ **Answer**: **Title required from SDK** - no auto-generation in IC-5 (IC-5 updated)
- **Rationale**: User-provided title is clearer, auto-generation can be added later

**Q28: Retention policy?**
- ✅ **Answer**: **No retention policy in IC-5** - no automatic archiving or deletion (IC-5 updated)
- **Rationale**: Keep MVP simple, can add retention policy later if needed

**Q29: Reject unregistered domains?**
- ✅ **Answer**: **Reject with 403 Forbidden** - return error if origin not in allowed domains (IC-5 updated)
- **Rationale**: Security best practice, prevents unauthorized submissions

**Q52: HTTPS enforcement?**
- ✅ **Answer**: **Enforce HTTPS in production** - reject non-HTTPS requests (IC-5 updated)
- **Rationale**: Security requirement for production environments

**Q53: Virus scanning?**
- ✅ **Answer**: **No virus scanning in IC-5** - screenshots are images only (IC-5 updated)
- **Rationale**: Images are safe, can add virus scanning later if needed

### Issue Dashboard (IC-6)

**Q32: User roles?**
- ✅ **Answer**: **Use existing roles** - no new roles needed for IC-6 (IC-6 updated)
- **Rationale**: Existing permission system is sufficient, no need for new roles

**Q33: Visibility rules for testers?**
- ✅ **Answer**: **All staff can see all issues** - no project-level restrictions (IC-6 updated)
- **Rationale**: Simpler access control for MVP, can add project-level restrictions later

**Q57: Dashboard concurrency level?**
- ✅ **Answer**: **10-50 concurrent users** - optimize for internal tool usage (IC-6 updated)
- **Rationale**: Reasonable for internal staff usage, can optimize later if needed

### Notifications & Integrations (IC-7)

**Q37: Slack integration rules?**
- **Status**: IC-7 not yet documented
- **Impact**: Deferred to IC-7
- **Recommendation**: Defer to IC-7 planning

**Q38: Email provider?**
- **Status**: IC-7 not yet documented
- **Impact**: Deferred to IC-7
- **Recommendation**: Defer to IC-7 planning

**Q39: Webhook format?**
- **Status**: IC-7 not yet documented
- **Impact**: Deferred to IC-7
- **Recommendation**: Defer to IC-7 planning

### Project & Environment Management (IC-1)

**Q41: Environment-specific settings?**
- **Status**: Partially answered - apiUrl is optional
- **Impact**: Affects environment configuration
- **Current**: apiUrl optional, allowedOrigins can override project-level
- **Recommendation**: **Basic settings only** - apiUrl and allowedOrigins per environment
- **Decision needed**: Confirm if additional settings needed (notification rules, severity thresholds)

**Q42: Environment-level alerting rules?**
- **Status**: IC-7 not yet documented
- **Impact**: Deferred to IC-7
- **Recommendation**: Defer to IC-7 planning

### AI Triage (IC-9)

**Q46-Q49: AI-related questions**
- **Status**: IC-9 not yet documented
- **Impact**: Deferred to IC-9
- **Recommendation**: Defer to IC-9 planning

### Security Requirements

**Q51: GDPR/PDPA compliance?**
- **Status**: Not specified
- **Impact**: Affects data handling and user consent
- **Recommendation**: **Basic compliance** - sanitize sensitive data, signed URLs for screenshots
- **Decision needed**: Confirm if explicit GDPR/PDPA features needed (consent banner, data export, right to deletion)

**Q52: HTTPS enforcement?**
- **Status**: Not specified
- **Impact**: Affects API security
- **Recommendation**: **Enforce HTTPS in production** - standard practice
- **Decision needed**: Confirm HTTPS enforcement strategy

**Q53: Virus scanning?**
- **Status**: Not specified
- **Impact**: Affects screenshot upload handling
- **Recommendation**: **No virus scanning in IC-5** - screenshots are images only (can add later if needed)
- **Decision needed**: Confirm if virus scanning required

### Performance Requirements

**Q54: Target SDK bundle size?**
- **Status**: Not specified in IC-2
- **Impact**: Affects SDK build optimization
- **Recommendation**: **Target < 50KB gzipped** - reasonable for modern web
- **Decision needed**: Confirm bundle size target

**Q55: Low-end device support?**
- **Status**: Not specified
- **Impact**: Affects SDK performance optimization
- **Current**: Shadow DOM (modern browsers only)
- **Recommendation**: **Modern browsers only** - Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Decision needed**: Confirm browser support requirements

**Q56: Expected API load?**
- **Status**: Answered - small-to-medium scale
- **Impact**: Already addressed
- **Current**: Optimize for small-to-medium scale initially

**Q57: Dashboard concurrency level?**
- **Status**: Not specified
- **Impact**: Affects dashboard performance optimization
- **Recommendation**: **Optimize for 10-50 concurrent users** - reasonable for internal tool
- **Decision needed**: Confirm expected concurrency

### DevOps & Deployment

**Q58: Deployment environments?**
- **Status**: Partially answered - dev, staging, prod
- **Impact**: Affects CI/CD configuration
- **Current**: Standard environments
- **Recommendation**: **Standard environments** - dev, staging, prod
- **Decision needed**: Confirm if additional environments needed

**Q59: Target deployment platform?**
- **Status**: Not specified
- **Impact**: Affects deployment configuration
- **Recommendation**: **Docker-based deployment** - already configured
- **Decision needed**: Confirm target platform (AWS, DigitalOcean, on-premise, etc.)

**Q60: Require full CI/CD?**
- **Status**: Partially answered - Jenkinsfile exists
- **Impact**: Affects CI/CD setup
- **Current**: Jenkinsfile exists, GitHub Actions mentioned
- **Recommendation**: **Basic CI/CD** - automated tests and deployment
- **Decision needed**: Confirm CI/CD requirements

**Q61: Logging provider?**
- **Status**: Not specified
- **Impact**: Affects logging setup
- **Recommendation**: **Basic logging** - console/file logging for IC-0-IC-6, can add external provider later
- **Decision needed**: Confirm if external logging provider needed (e.g., Datadog, CloudWatch)

**Q62: Monitoring requirements?**
- **Status**: Not specified
- **Impact**: Affects monitoring setup
- **Recommendation**: **Basic monitoring** - health checks, error tracking (can add Sentry later)
- **Decision needed**: Confirm monitoring requirements

### Future Features (IC-8, IC-10)

**Q63-Q65: Future features**
- **Status**: IC-8, IC-10 not yet documented
- **Impact**: Deferred to future phases
- **Recommendation**: Defer to IC-8, IC-10 planning

### Legal & Privacy

**Q66: User monitoring notifications?**
- **Status**: Not specified
- **Impact**: Affects SDK implementation
- **Recommendation**: **No notification banner in IC-2** - can add later if required
- **Decision needed**: Confirm if user notification required

**Q67: Consent banner?**
- **Status**: Not specified
- **Impact**: Affects SDK implementation
- **Recommendation**: **No consent banner in IC-2** - can add later if required
- **Decision needed**: Confirm if consent banner required

**Q68: Sensitive element ignore-list?**
- **Status**: Not specified
- **Impact**: Affects screenshot capture
- **Recommendation**: **No ignore-list in IC-3** - can add later if needed
- **Decision needed**: Confirm if ignore-list needed (e.g., skip `.sensitive` elements)

---

## 🎯 Summary: Critical Questions Status

### ✅ All Critical Questions Answered

**IC-2 (SDK Basic)** - All answered:
1. ✅ **Q9**: Dark mode support → **No dark mode in IC-2** (light theme only)
2. ✅ **Q10**: Custom branding → **No custom branding in IC-2** (standard appearance)
3. ✅ **Q54**: SDK bundle size target → **< 50KB gzipped**
4. ✅ **Q55**: Browser support → **Modern browsers only** (latest 2 versions)

**IC-3 (Screenshot Capture)** - All answered:
5. ✅ **Q14**: Scrolling screenshots → **No scrolling in IC-3** (element capture only)
6. ✅ **Q18**: DOM capture depth → **outerHTML only** (not full DOM tree)
7. ✅ **Q68**: Sensitive element ignore-list → **No ignore-list in IC-3** (capture all selected elements)

**IC-5 (API)** - All answered:
8. ✅ **Q25**: Auto-generate issue title → **Title required from SDK** (no auto-generation)
9. ✅ **Q29**: Reject unregistered domains → **Reject with 403 Forbidden**
10. ✅ **Q52**: HTTPS enforcement → **Enforce in production**
11. ✅ **Q53**: Virus scanning → **No virus scanning in IC-5** (images only)
12. ✅ **Q28**: Retention policy → **No retention policy in IC-5**

**IC-6 (Dashboard)** - All answered:
13. ✅ **Q32**: User roles → **Use existing roles** (no new roles needed)
14. ✅ **Q33**: Visibility rules → **All staff see all issues** (no project-level restrictions)
15. ✅ **Q57**: Dashboard concurrency → **10-50 concurrent users**

### Can Defer (Not Critical for MVP)
- Q37-Q39: Notifications (IC-7)
- Q41-Q42: Environment settings (can add incrementally)
- Q46-Q49: AI Triage (IC-9)
- Q51: GDPR/PDPA (can add compliance features later)
- Q58-Q62: DevOps (can configure incrementally)
- Q63-Q65: Future features (IC-8, IC-10)
- Q66-Q67: Legal/Privacy (can add later if required)

---

## 📝 Recommendations

1. **Answer critical questions** (Q9, Q10, Q14, Q18, Q25, Q29, Q32, Q33) before starting respective phases
2. **Use recommendations** provided above as defaults if no specific requirements
3. **Defer non-critical questions** to future phases or enhancements
4. **Update phase plans** with answers once decisions are made

