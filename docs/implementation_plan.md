# Proxi Flow - Implementation Plan

## Phase 1: Foundation & Security (Backend + Frontend Shell)
- [x] 1. Convert Vite SPA to Full-Stack Express + Vite setup.
- [x] 2. Set up `server.ts` with Express and Vite middleware.
- [x] 3. Implement a local WebSocket server (`ws`) on the Express backend to communicate with the React frontend.
- [x] 4. Set up the basic 3-column UI layout in React.

## Phase 2: Gemini Live API Integration
- [x] 1. Integrate `@google/genai` on the backend.
- [x] 2. Establish the `ai.live.connect` WebSocket connection to Gemini.
- [x] 3. Implement frontend audio capture (Web Audio API, 16kHz PCM) and streaming to the backend.
- [x] 4. Implement frontend audio playback (PCM decoding/playback) for Gemini's voice responses.
- [x] 5. Implement frontend screen capture (`modern-screenshot`) and stream base64 JPEGs to the backend.

## Phase 3: The Demo Workspace & Semantic Tools
- [x] 1. Build the "Demo Workspace" React components (Mock Inbox, Notes, Drafts).
- [x] 2. Define 11 custom tools in the Gemini Live API config with full `Type` enum schemas.
- [x] 3. Write rich system instruction with persona, workspace context, desktop context, and safety rules.
- [x] 4. Wire up the frontend to listen for `toolCall` events from the backend, execute the state changes, and send `toolResponse` back.

## Phase 4: State Machine, Interruption & Approvals
- [x] 1. Implement the global state machine (8 states via Zustand).
- [x] 2. Build the "Current Plan", "Live Transcript", and "Execution Log" UI components.
- [x] 3. Implement the Interruption flow with audio stop and state update.
- [x] 4. Implement the Approval Gate with modal and pause/resume execution.

## Phase 5: Workflow Reusability & Google Cloud Integration
- [x] 1. Set up Firebase/Firestore with security rules.
- [x] 2. Implement the `save_workflow` tool to persist action sequences to Firestore.
- [x] 3. Populate the Left Sidebar with saved workflows and Google Auth.
- [x] 4. Implement the "Run" button to replay saved workflows.

## Phase 6: Native Desktop Tools
- [x] 1. Implement `take_screenshot` using `screenshot-desktop` npm package.
- [x] 2. Implement `run_command` using `child_process.exec` with PowerShell/Bash.
- [x] 3. Implement `open_url` using `open` npm package.
- [x] 4. Implement `list_files` and `read_file` using Node.js `fs` module.
- [x] 5. Implement Command Guard with regex-based blocking of dangerous patterns.
- [x] 6. Implement hybrid tool routing: workspace tools → frontend, desktop tools → server-side execution.

## Phase 7: Deployment & Submission
- [x] 1. Create multi-stage Dockerfile for Google Cloud Run.
- [x] 2. Create automated deploy script (`deploy.ps1`).
- [x] 3. Switch from tsx to esbuild compilation for server reliability.
- [x] 4. Write comprehensive README with architecture, features, and spin-up instructions.
- [x] 5. Create ASCII architecture diagram (ARCHITECTURE.md).
- [x] 6. Draft Devpost submission text.
- [x] 7. UI polish: dark theme header/sidebar/log panel, transcript strip, state indicators.
