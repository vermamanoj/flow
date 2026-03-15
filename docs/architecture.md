# Proxi Flow - Architecture

## High-Level Architecture
Proxi Flow uses a Full-Stack architecture (React Frontend + Express Backend) to ensure security and proper orchestration of the Gemini Live API. See [ARCHITECTURE.md](../ARCHITECTURE.md) in the project root for the full visual diagram.

```
[ User / Browser ] <--(WebSocket)--> [ Express Backend ] <--(WebSocket)--> [ Gemini Live API ]
       |                                      |                                      |
  (React UI)                           (Node.js Server)                       (Google Cloud)
  - Audio Capture                      - Gemini Live Proxy                    - Multimodal Reasoning
  - Screen Capture (dom-to-jpeg)       - Hybrid Tool Router                   - Voice Generation
  - Audio Playback                     - Desktop Tool Engine                  - Function Calling (11 tools)
  - Workspace Tool Exec                - Command Guard                        - Interruption Handling
  - State Machine (8 states)           - Firestore Integration
```

## 1. Frontend (React 19 + Tailwind CSS 4 + Zustand)
- **3-Column Layout:**
  - **Left (dark):** Saved Workflows panel with Google Auth + Firestore integration.
  - **Center:** Live Transcript strip + Current Plan strip + Demo Workspace (MockCRM) + Approval Modal.
  - **Right (dark):** Execution Log timeline showing all tool calls, responses, and actions.
- **Media Streamer:** Captures 16kHz PCM audio from microphone and ~0.5fps JPEG frames from the workspace DOM via `modern-screenshot`. Streams both via WebSocket.
- **State Machine (Zustand):** 8 explicit states: `IDLE`, `LISTENING`, `THINKING`, `SPEAKING`, `ACTING`, `PAUSED_FOR_APPROVAL`, `INTERRUPTED`, `SAVING_WORKFLOW`.

## 2. Backend (Express + Node.js, compiled via esbuild)
- **Live API Proxy:** Uses `@google/genai` SDK to connect to `gemini-2.5-flash-native-audio-preview-09-2025`.
- **Rich System Instruction:** Detailed persona, workspace context, desktop context, tool usage guidelines, safety rules.
- **11 Tool Declarations:** Workspace tools (navigate_view, draft_content, request_approval, update_plan, save_workflow) + Desktop tools (take_screenshot, run_command, open_url, list_files, read_file).
- **Hybrid Tool Router:**
  - **Workspace tools** → forwarded to frontend via WebSocket for React state updates.
  - **Desktop tools** → executed server-side in Node.js, results sent back to Gemini directly.
- **Command Guard:** Regex-based blocking of dangerous shell patterns (rm -rf, format, shutdown, etc.).
- **Server compiled** with esbuild (`server.ts` → `server.mjs`) to avoid tsx ESM resolver issues.

## 3. Persistence (Firebase / Firestore on Google Cloud)
- Stores saved workflows with owner-based security rules.
- Firebase Auth for Google Sign-In.
- Fulfills hackathon requirement for Google Cloud service usage.

## 4. Deployment (Google Cloud Run)
- Multi-stage Dockerfile: build frontend + compile server → slim production image.
- Automated deploy script (`deploy.ps1`) for Cloud Run with environment variable injection.
- WebSocket support via Cloud Run's native WebSocket capabilities.
