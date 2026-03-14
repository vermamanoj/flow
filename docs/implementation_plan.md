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
- [x] 5. Implement frontend screen capture (HTML5 Canvas/html2canvas) and stream base64 JPEGs to the backend.

## Phase 3: The Demo Workspace & Semantic Tools
- [x] 1. Build the "Demo Workspace" React components (Mock Inbox, Notes, Drafts).
- [x] 2. Define custom semantic tools in the Gemini Live API config (e.g., `navigate_view`, `draft_email`, `request_approval`, `update_plan`).
- [x] 3. Wire up the frontend to listen for `toolCall` events from the backend, execute the state changes in the Demo Workspace, and send `toolResponse` back.

## Phase 4: State Machine, Interruption & Approvals
- [x] 1. Implement the global state machine (`IDLE`, `LISTENING`, `PAUSED_FOR_APPROVAL`, etc.).
- [x] 2. Build the "Current Plan" and "Execution Log" UI components.
- [x] 3. Implement the Interruption flow: When the user clicks "Interrupt" or speaks over the agent, send a client-side interrupt signal, clear audio queues, and force a replan.
- [x] 4. Implement the Approval Gate: When the `request_approval` tool is called, show the modal and pause execution until the user responds.

## Phase 5: Workflow Reusability & Google Cloud Integration
- [x] 1. Set up Firebase/Firestore.
- [x] 2. Implement the `save_workflow` tool to persist the sequence of semantic actions to Firestore.
- [x] 3. Populate the Left Sidebar with saved workflows.
- [x] 4. Implement the "Run" button to replay a saved workflow's tool calls directly against the Demo Workspace.
