# Proxi Flow - Architecture

## High-Level Architecture
Proxi Flow uses a Full-Stack architecture (React Frontend + Express Backend) to ensure security and proper orchestration of the Gemini Live API.

```
[ User / Browser ] <--(WebSocket)--> [ Express Backend ] <--(WebSocket)--> [ Gemini Live API ]
       |                                      |                                      |
  (React UI)                           (Node.js Server)                       (Google Cloud)
  - Audio Capture                      - Auth / Judge Mode                    - Multimodal Reasoning
  - Screen Capture (Canvas)            - Live API Proxy                       - Voice Generation
  - Audio Playback                     - Tool Routing                         - Tool Calling
  - Demo Workspace State               - Firestore Integration
```

## 1. Frontend (React + Tailwind + Framer Motion)
- **3-Column Layout:**
  - **Left:** Saved Workflows (Fetched from backend/Firestore).
  - **Center:** Demo Workspace (Mock CRM/Inbox) + Current Plan + Conversation Strip.
  - **Right:** Execution Log.
- **Media Streamer:** Captures 16kHz PCM audio from the microphone and 1fps JPEG frames from a hidden canvas rendering the Demo Workspace. Sends these via a local WebSocket to the backend.
- **State Machine:** Manages 11 explicit states (`IDLE`, `LISTENING`, `THINKING`, `SPEAKING`, `ACTING`, `PAUSED_FOR_APPROVAL`, `INTERRUPTED`, `SAVING_WORKFLOW`, etc.).

## 2. Backend (Express + Node.js)
- **Live API Proxy:** Uses `@google/genai` to connect to `gemini-2.5-flash-native-audio-preview-09-2025`.
- **Bi-directional Router:** 
  - Receives audio/video from the frontend and pipes it to Gemini.
  - Receives audio/tool calls from Gemini and pipes them to the frontend.
- **Tool Definitions:** Defines the custom semantic tools (`navigate_view`, `draft_content`, `request_approval`, `save_workflow`) in the Live API configuration.

## 3. Persistence (Google Cloud / Firestore)
- Stores saved workflows and execution logs.
- Fulfills the hackathon requirement for explicit Google Cloud service usage.
