# 📝 Project TODOs

## 🎨 Frontend
- [ ] **Architecture**: Refactor routing using Next.js Route Groups.
  - Create `(marketing)` group for Landing Page.
  - Create `(app)` group for Dashboard/Wizard.
  - Move `Navbar` to `(marketing)/layout.tsx`.
  - Create `AppHeader` for `(app)/layout.tsx`.
- [x] **Mobile Menu**: Implement state and UI for mobile navigation drawer in `Navbar`.
- [ ] **Wizard**: Implement multi-step creation flow.
  - [x] Step 1: Upload (Drag & Drop + Preview)
  - [ ] **Multi-upload**: Support selecting and uploading multiple images at once.
  - [x] Step 2: Settings (Prompt, Aspect Ratio)
  - [ ] **API Integration**: Replace mock generation in `CreatePage` with real backend API call.
  - [ ] Step 3: Generation Progress
  - [ ] Step 4: Result & Download
- [x] **Auth**: Integrate authentication (Google OAuth + JWT flow).
- [ ] **Auth Handling**: Implement global HTTP interceptor (or fetch wrapper) to handle 401 errors and auto-logout when token expires during usage.

## ⚙️ Backend
- [ ] **Database**: Generate and run migration for `User` entity changes (added `unique` constraint to `googleId`).
- [ ] **Uploads**: Implement `POST /projects/upload` endpoint (S3 integration).
  - [x] Basic upload functionality
  - [ ] Add JWT authentication guard
  - [ ] Implement storage quota per user
- [ ] **AI Engines**:
  - Integrate **Mubert** for background music generation.
  - Integrate **Yandex SpeechKit** for TTS (Text-to-Speech).
  - Implement LLM service for script generation.
- [ ] **Security**: Add Rate Limiting and JWT Guards to all endpoints.
- [ ] **OAuth Reliability**: Добавить автоматические retry на уровне HTTP клиента для OAuth (улучшит надёжность соединений с Google APIs при сетевых проблемах).
- [ ] **Auth Refactor**: Миграция с localStorage на httpOnly Cookies (см. `docs/auth-migration-strategy.md`).

## 📱 General / UX
- [ ] **Mobile**: Ensure all new views are mobile-responsive.
- [ ] **Legal**: Add Privacy Policy and Terms of Service pages.
