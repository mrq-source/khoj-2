# Derma-AI

A responsive React + Vite frontend prototype for patient skin consultations and doctor appointment workflows. The app uses a local mock API with simulated delays; no medical diagnosis or real backend integration is provided.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Setup

```powershell
cd Khoj
npm install
Copy-Item .env.example .env
npm run dev
```

Open the local URL printed by Vite. Build with `npm run build`, check with `npm run lint`, and serve the production bundle from `dist` with `npm run preview`.

The `.env` file contains `VITE_API_BASE_URL` and `VITE_AI_ENDPOINT` placeholders. The mock layer in `src/api/mockApi.js` is the integration point for an API and AI service. Replace the simulated functions there when a backend is available.

## Demo sign-in

Select Patient or Doctor on the auth page. Use any non-empty email and password to sign in; the demo mock accepts any credentials. Sign-up presents role-specific fields. The selected role is saved locally so protected routes direct patients and doctors to their respective dashboards.

## Main flows

- Patient: dashboard → new consultation → image upload and symptom details → AI-style summary → nearby/search doctors → severity-based appointment → confirmation and calendar export.
- Doctor: incoming requests → severity/date filtering → request details, patient photo lightbox, notes, accept/reschedule/decline → profile and availability settings.

Images are validated in the browser (up to five, 5 MB each). Mock patient photos in the doctor lightbox are illustrative placeholders. The map is a non-interactive visual placeholder. No uploaded image is sent to a server.

## Project structure

```text
src/
  api/mockApi.js
  components/
  context/AuthContext.jsx
  hooks/useDebounce.js
  App.jsx
  App.css
  index.css
```

All analysis and doctor listings in this prototype are sample data. The AI response is informational only and is not a medical diagnosis. In an emergency, call your local emergency number.
