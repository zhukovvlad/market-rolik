# 📝 Project TODOs

## 🎨 Frontend
- [ ] **Architecture**: Refactor routing using Next.js Route Groups.
  - Create `(marketing)` group for Landing Page.
  - Create `(app)` group for Dashboard/Wizard.
  - Move `Navbar` to `(marketing)/layout.tsx`.
  - Create `AppHeader` for `(app)/layout.tsx`.
- [ ] **Wizard**: Implement multi-step form state management (Zustand or Context).
- [ ] **Auth**: Integrate authentication (NextAuth.js or custom JWT flow).

## ⚙️ Backend
- [ ] **Uploads**: Implement `POST /projects/upload` endpoint (S3 integration).
- [ ] **AI Engines**:
  - Integrate **Mubert** for background music generation.
  - Integrate **Yandex SpeechKit** for TTS (Text-to-Speech).
  - Implement LLM service for script generation.
- [ ] **Security**: Add Rate Limiting and JWT Guards to all endpoints.

## 📱 General / UX
- [ ] **Mobile**: Ensure all new views are mobile-responsive.
- [ ] **Legal**: Add Privacy Policy and Terms of Service pages.
