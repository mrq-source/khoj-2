# Derma-AI

A React + Vite frontend with a local FastAPI inference service for the Kaggle skin-image model. Authentication, patient data, and doctor workflows still use mock data.

## Requirements

- Node.js 20.19+ or 22.12+
- Python 3.12 (recommended for the PyTorch backend)
- npm

## Run locally

```powershell
cd Khoj
npm install
Copy-Item .env.example .env.local
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

In a second terminal:

```powershell
cd Khoj
npm run dev
```

The backend expects `fus_clean_fold0.pt` and `meta_info.json` in the repository root, one directory above `Khoj`. It loads the checkpoint on the first inference request. `GET http://localhost:8000/api/health` checks that the model loads. The frontend calls `POST /api/ai/analyze` with one photo and optional model metadata. Images are limited to 5 MB and are processed in memory; the API does not save them. The written symptom description is not sent to the model API. This is a local-development backend with no authentication; do not expose it publicly without adding appropriate access controls, transport security, and privacy protections.

Open the local URL printed by Vite. Build with `npm run build`, check with `npm run lint`, and serve the production bundle from `dist` with `npm run preview`. Run the backend preprocessing checks from `Khoj` with `python -m unittest backend.test_preprocessing`.

The `.env.local` file can override `VITE_API_BASE_URL` and `VITE_AI_ENDPOINT`; defaults target the local backend on port 8000.

## Demo sign-in

Select Patient or Doctor on the auth page. Use any non-empty email and password to sign in; the demo mock accepts any credentials. Sign-up presents role-specific fields. The selected role is saved locally so protected routes direct patients and doctors to their respective dashboards.

## Main flows

- Patient: dashboard → new consultation → photo and optional lesion details → model category and next steps → nearby/search doctors → severity-based appointment → confirmation and calendar export.
- Doctor: incoming requests → severity/date filtering → request details, patient photo lightbox, notes, accept/reschedule/decline → profile and availability settings.

The model uses an EfficientNet-B0 image backbone and a 28-feature metadata input, matching the Kaggle notebook. Missing metadata uses the provided training medians/defaults. Mock patient photos in the doctor lightbox are illustrative placeholders. The map is a non-interactive visual placeholder.

## Project structure

```text
src/
  api/mockApi.js
  backend/
    main.py
    preprocessing.py
  components/
  context/AuthContext.jsx
  hooks/useDebounce.js
  App.jsx
  App.css
  index.css
```

The six-class image model is a research classifier, not a medical device or diagnosis. Its softmax score is not a calibrated probability and must not be used to guide treatment or delay care. In an emergency, call your local emergency number.
