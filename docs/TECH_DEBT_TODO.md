# Tech Debt & Refactoring Tasks

> Extracted from CODE_REVIEW_REPORT.md and CODE_REVIEW_SUMMARY.md  
> Last updated: 2025-12-10

---

## Как использовать этот файл

1. Беру задачу из P0 или P1.
2. В VS Code выделяю строку с задачей и прошу Copilot:
   - "Copilot, implement this checklist item. Show me the changes before applying."
3. После коммита ставлю галочку `[x]` и добавляю краткий комментарий в конец файла с датой.
4. Периодически прошу Copilot пересканировать репозиторий и обновить этот список.


## P0 — Critical (Fix Immediately)

**Estimated Total Effort: ~5 days**  
**Risk if not fixed: Production data loss, security breaches**

### Security & Data Integrity

- [ ] **Set `synchronize: false` in production** (15 min)
  - Location: `backend/src/app.module.ts:62`
  - Remove `synchronize: true`, use migrations only
  - Risk: Data loss, schema corruption

- [ ] **Add environment validation at startup** (1 hour)
  - Location: `backend/src/app.module.ts`
  - Validate all required env vars (DATABASE_HOST, JWT_SECRET, etc.)
  - Use `@nestjs/config` with Joi validation schema
  - Fail fast if missing vars

- [ ] **Generate and validate strong JWT secret** (2 hours)
  - Location: `backend/.env.example`, `backend/src/auth/auth.module.ts`
  - Add validation: min 32 characters
  - Generate new secret for production
  - Reject placeholders like "your-secret-key"

- [ ] **Add JWT expiration** (30 min)
  - Location: `backend/src/auth/auth.module.ts`
  - Set `expiresIn: '1h'` for access tokens
  - Add `audience` and `issuer` claims
  - Risk: Session hijacking without expiration

- [ ] **Implement refresh token flow** (4 hours)
  - Create refresh token endpoint
  - Store refresh tokens in database with expiry (7 days)
  - Add rotation on use
  - Handle token revocation

- [ ] **Migrate JWT from localStorage to httpOnly cookies** (3 days)
  - Location: `frontend/app/create/page.tsx:80`, `frontend/app/dashboard/page.tsx:24`
  - Create cookie middleware in backend
  - Update frontend to use credentials mode
  - Remove all `localStorage.getItem("token")` calls
  - Test auth flow end-to-end
  - Risk: XSS vulnerability, account takeover

---

## P1 — High Priority (Fix in Sprint)

**Estimated Total Effort: ~3 weeks**  
**Risk if not fixed: Poor UX, security issues, scalability problems**

### Input Validation & Security

- [ ] **Add comprehensive DTO validation** (2 days)
  - Location: `backend/src/projects/dto/create-project.dto.ts`
  - Add `@MinLength`, `@MaxLength`, `@IsOptional` decorators
  - Create `ProjectSettingsDto` with full validation
  - Validate all nested objects with `@ValidateNested`
  - Remove `settings?: any` type

- [ ] **Add rate limiting to upload endpoint** (1 day)
  - Location: `backend/src/projects/projects.controller.ts:38`
  - Add `@Throttle()` decorator
  - Implement per-IP rate limiting (not just per-user)
  - Add global throttler config in `main.ts`

- [ ] **Complete SSRF protection** (1 day)
  - Location: `backend/src/common/ai-text.service.ts:160-168`
  - Block internal IPs: localhost, 127.0.0.1, 169.254.x.x
  - Block private networks: 10.x.x.x, 192.168.x.x
  - Add IP validation using `net` module
  - Whitelist only S3 bucket domain

- [ ] **Add file content validation** (1 day)
  - Location: `backend/src/projects/projects.controller.ts`
  - Validate magic bytes (not just extensions)
  - Add image dimension limits (max 4096x4096)
  - Strip EXIF data with sharp
  - Re-encode images to remove malicious payloads

- [ ] **Sanitize error messages** (1 day)
  - Location: `frontend/app/create/page.tsx:64`
  - Don't expose internal errors to users
  - Create safe error messages for production
  - Log full errors server-side only

- [ ] **Add API key sanitization in logs** (1 day)
  - Location: `backend/src/queues/processors/background.processor.ts:234`
  - Strip query params with API keys before logging
  - Sanitize URLs in all log statements

### Database & Performance

- [ ] **Add database indexes** (1 hour)
  - Location: `backend/src/projects/project.entity.ts`, `backend/src/projects/asset.entity.ts`
  - Add `@Index(['userId', 'status'])` to Project
  - Add `@Index(['createdAt'])` to Project
  - Add `@Index(['project', 'type'])` to Asset
  - Create migration for indexes

- [ ] **Add transaction boundaries to multi-step operations** (1 day)
  - Location: `backend/src/projects/projects.service.ts:21-34`
  - Use `@Transaction()` decorator
  - Wrap project creation + queue job in transaction
  - Handle rollback on queue job failure

- [ ] **Add pagination to project list API** (1 day)
  - Location: `backend/src/projects/projects.service.ts:58-63`
  - Add `page` and `limit` parameters
  - Use `findAndCount()` with `skip`/`take`
  - Return pagination metadata
  - Don't eager load assets (use lazy loading)

### Testing Infrastructure

- [ ] **Set up test infrastructure** (3 days)
  - Install Jest, Supertest, Testing Library
  - Configure testcontainers for integration tests
  - Set up CI pipeline with tests
  - Add test coverage reporting (>60% goal)

- [ ] **Write unit tests for critical services** (1 week)
  - `auth.service.spec.ts` - 80% coverage target
  - `projects.service.spec.ts` - 70% coverage
  - `ai-text.service.spec.ts` - 70% coverage
  - Test error cases and edge conditions

- [ ] **Write API integration tests** (3 days)
  - `projects.e2e-spec.ts` - all endpoints
  - Test auth flows, file uploads
  - Test error responses (401, 403, 404, 413)
  - Test rate limiting

- [ ] **Write queue processor tests** (2 days)
  - `background.processor.spec.ts`
  - `animation.processor.spec.ts`
  - Mock external APIs
  - Test retry logic and failure scenarios

- [ ] **Write frontend component tests** (3 days)
  - Test wizard steps with Testing Library
  - Test form validation
  - Test error states
  - Target 60% coverage

---

## P2 — Medium Priority (Fix in Month)

**Estimated Total Effort: ~3 weeks**  
**Risk if not fixed: Technical debt accumulation, harder maintenance**

### Code Quality & Refactoring

- [ ] **Extract duplicate `getDimensions()` function** (1 hour)
  - Location: `backend/src/queues/processors/background.processor.ts:37`, `animation.processor.ts:35`
  - Move to `backend/src/common/utils/image.utils.ts`
  - Import in both processors

- [ ] **Create BaseQueueProcessor class** (3 hours)
  - Location: `backend/src/common/base.processor.ts`
  - Extract shared error handling
  - Extract shared project update logic
  - Have BackgroundProcessor and AnimationProcessor extend it

- [ ] **Implement AssetRepository pattern** (1 day)
  - Location: `backend/src/projects/repositories/asset.repository.ts`
  - Centralize asset query logic
  - Move `findActiveScene()` logic here
  - Add transaction-safe methods

- [ ] **Separate AI services into dedicated modules** (2 days)
  - Location: `backend/src/infrastructure/ai/`
  - Create `photoroom.service.ts`, `stability.service.ts`, `kling.service.ts`, `gemini.service.ts`
  - Extract HTTP client with retry logic to `ai-client.service.ts`
  - Separate concerns: client vs. business logic

- [ ] **Replace TypeScript `any` with proper types** (1 week)
  - 52 instances found
  - Create `AssetMetadata` interface
  - Create proper error types
  - Use `unknown` for truly dynamic data with type guards

- [ ] **Standardize error handling** (2 days)
  - Use NestJS HTTP exceptions consistently
  - Replace all `throw new Error()` with `BadRequestException`, etc.
  - Create custom exceptions for domain errors

- [ ] **Extract magic numbers to constants** (1 hour)
  - Location: `backend/src/projects/projects.controller.ts`
  - Create `backend/src/common/constants/file-limits.ts`
  - Define `FILE_SIZE_LIMITS`, `IMAGE_DIMENSIONS`, etc.
  - Import in validators

- [ ] **Remove unused legacy statuses** (30 min)
  - Location: `backend/src/projects/project.entity.ts:28-31`
  - Remove QUEUED, PROCESSING, RENDERING
  - Verify no data uses these in production
  - Create migration to clean up any legacy data

### Observability & Monitoring

- [ ] **Add health check endpoint** (2 hours)
  - Location: `backend/src/app.controller.ts`
  - Check database connection
  - Check Redis connection
  - Check S3 connectivity
  - Return service status

- [ ] **Improve structured logging** (2 days)
  - Add request ID to all logs
  - Add userId, projectId context
  - Use Winston with JSON format
  - Configure log levels per environment
  - Set up log aggregation

- [ ] **Add API versioning** (1 day)
  - Add `api/v1/` prefix to all routes
  - Set in `backend/src/main.ts`
  - Prepare for future breaking changes

### Performance & Caching

- [ ] **Implement Redis caching service** (3 days)
  - Cache user profiles (5 min TTL)
  - Cache project lists per user
  - Invalidate on mutations
  - Add cache-aside pattern

- [ ] **Optimize S3 uploads** (2 days)
  - Use streaming upload (PassThrough)
  - Implement multipart upload for large files
  - Compress images before upload (sharp)
  - Resize to max 2048x2048

- [ ] **Optimize background job configuration** (1 day)
  - Add job prioritization (paying users first)
  - Configure dead letter queue
  - Keep last 100 completed jobs for metrics
  - Add exponential backoff

### CORS & Security Hardening

- [ ] **Improve CORS configuration** (1 hour)
  - Location: `backend/src/main.ts:15-18`
  - Support multiple origins (staging + production)
  - Add origin validation callback
  - Set maxAge for preflight caching

- [ ] **Add Helmet.js security headers** (30 min)
  - Install and configure helmet
  - Add CSP headers
  - Add HSTS headers

- [ ] **Validate secrets at startup** (1 hour)
  - Check for placeholder values ("your-", "mock")
  - Ensure production secrets are set
  - Fail startup if invalid

---

## P3 — Low Priority / Cleanup

**Estimated Total Effort: ~1 week**  
**Risk if not fixed: Slower development, minor UX degradation**

### Code Quality

- [ ] **Add JSDoc comments to public APIs** (Ongoing)
  - Document all exported functions
  - Document complex business logic
  - Add parameter descriptions
  - Add return type descriptions

- [ ] **Replace console.log with logger** (30 min)
  - Location: `frontend/app/create/page.tsx:33,49`
  - Use structured logger consistently
  - Remove all `console.log` statements
  - Keep only in development

- [ ] **Implement frontend code splitting** (2 days)
  - Use dynamic imports for heavy components
  - Split ImagePreviewStep, WizardSteps
  - Add loading states
  - Analyze bundle with webpack-bundle-analyzer

- [ ] **Optimize frontend bundle size** (1 day)
  - Tree-shake unused TailwindCSS
  - Optimize React 19 + Remotion imports
  - Use Next.js Image component
  - Target <500KB initial bundle

---

## Completed

- [x] Initial code review completed (2025-12-09)
- [x] Documentation created (CODE_REVIEW_REPORT.md, CODE_REVIEW_SUMMARY.md)

---

## Notes

- **Priority Guide:**
  - **P0:** Must fix before production deployment (security/data risks)
  - **P1:** Should fix in current sprint (stability/quality issues)
  - **P2:** Plan for next month (technical debt, performance)
  - **P3:** Nice to have (code quality improvements)

- **Effort estimates** are approximations; adjust based on team velocity
- **Test each fix** before marking complete
- **Update this file** as tasks are completed
