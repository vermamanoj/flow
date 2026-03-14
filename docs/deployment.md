# Proxi Flow - Deployment Plan

## Target Environment
Google Cloud Run (via AI Studio's built-in deployment or manual Dockerization).

## Prerequisites
1. **Environment Variables:**
   - `GEMINI_API_KEY`: Required for the `@google/genai` SDK.
   - `APP_URL`: The hosted URL of the application.
   - `FIREBASE_CONFIG` (or individual Firebase env vars): Required for Firestore integration.
2. **Build Process:**
   - The application uses a unified `npm run build` command which compiles the Vite frontend into the `dist/` directory.
   - The Express server (`server.ts`) is configured to serve these static files in production.

## Deployment Steps (AI Studio / Cloud Run)
1. Ensure `package.json` has the correct scripts:
   ```json
   "scripts": {
     "dev": "tsx server.ts",
     "build": "vite build",
     "start": "node server.ts"
   }
   ```
2. The Express server must bind to `0.0.0.0` and port `3000` (or `process.env.PORT`).
3. In production (`NODE_ENV === 'production'`), the Express server will bypass Vite middleware and serve the static `dist/index.html`.
4. WebSockets must be supported by the hosting environment (Cloud Run supports WebSockets natively).

## Security Considerations
- The Gemini API key is strictly kept on the backend.
- The frontend only communicates with the backend via a local WebSocket connection.
- A "Judge Mode" or simple authentication layer should be active to prevent unauthorized access to the Live API proxy.
