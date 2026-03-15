# Proxi Flow - Deployment Plan

## Target Environment
Google Cloud Run via Docker container.

## Prerequisites
1. **Environment Variables:**
   - `GEMINI_API_KEY`: Required for the `@google/genai` SDK.
   - `GCP_PROJECT_ID`: Your Google Cloud project ID (for deploy script).
2. **Tools:**
   - `gcloud` CLI installed and authenticated.
   - Docker (for local testing, optional — Cloud Build handles remote builds).
3. **Build Process:**
   - Frontend: `npm run build` → compiles React app into `dist/`.
   - Server: `npm run build:server` → compiles `server.ts` → `server.mjs` via esbuild.
   - Production: `npm start` → `node server.mjs` (serves static files from `dist/`).

## Package Scripts
```json
"scripts": {
  "dev": "npx esbuild server.ts --bundle --platform=node --format=esm --outfile=server.mjs --packages=external && node server.mjs",
  "build": "vite build",
  "build:server": "npx esbuild server.ts --bundle --platform=node --format=esm --outfile=server.mjs --packages=external",
  "start": "node server.mjs"
}
```

## Docker Deployment
The project includes a multi-stage `Dockerfile`:
1. **Builder stage:** Installs all deps, builds frontend (`vite build`) and server (`esbuild`).
2. **Production stage:** Copies built artifacts, installs production deps only, runs `node server.mjs`.

## Automated Deploy (PowerShell)
```powershell
$env:GCP_PROJECT_ID = "your-project-id"
$env:GEMINI_API_KEY = "your-api-key"
.\deploy.ps1
```

This script:
1. Builds the container via `gcloud builds submit`.
2. Deploys to Cloud Run with env vars, 512Mi memory, 1 CPU.
3. Outputs the service URL.

## Cloud Run Configuration
- The Express server binds to `0.0.0.0:3000` (or `process.env.PORT`).
- In production (`NODE_ENV=production`), it serves static files from `dist/` and skips Vite middleware.
- WebSockets are supported natively by Cloud Run.

## Security Considerations
- The Gemini API key is strictly kept on the backend — never exposed to the browser.
- The frontend communicates with the backend only via WebSocket on the same origin.
- Command Guard blocks dangerous shell commands server-side.
- Firestore security rules enforce owner-only access to workflows.
