# Proxi Flow — Voice-First AI Workspace Agent

> **Speak naturally. See it act. Stay in control.**
>
> A real-time, voice-driven AI agent that navigates workspaces and controls your desktop — with approval gates, reusable workflows, and live visual feedback.

[![Gemini Live API](https://img.shields.io/badge/Gemini%20Live%20API-2.5%20Flash-4285F4?logo=google)](https://ai.google.dev/)
[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-Run-4285F4?logo=googlecloud)](https://cloud.google.com/run)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://typescriptlang.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)

---

## The Problem

AI assistants today are stuck in a text box. They can reason and respond, but they can't **act** on your behalf — navigate apps, execute commands, or manipulate real workspace data. And when they do automate, it's brittle, opaque, and impossible to trust.

## The Solution

**Proxi Flow** combines the Gemini Live API's real-time voice and vision capabilities with **semantic tool execution** and **human-in-the-loop safety gates** to create an agent you can actually trust to do work.

- **Voice-first**: Talk naturally, interrupt anytime. The agent listens, sees your screen, and responds in real-time.
- **Hybrid execution**: Navigates a demo CRM workspace AND controls the real desktop (screenshots, shell commands, file operations, browser).
- **Approval gates**: Before any sensitive action, the agent pauses and asks for explicit permission.
- **Reusable workflows**: Successful task sequences are saved to Firestore and can be replayed with one click.

---

## Category

**UI Navigator** with **Live Agent** capabilities.

---

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full diagram.

```
User (Browser)  ←—WebSocket—→  Express Backend  ←—WebSocket—→  Gemini Live API
     │                              │                              │
  React UI                    Tool Router                    Multimodal AI
  Audio Capture              Desktop Engine                  Voice + Vision
  Screen Capture             Command Guard                   Function Calling
  State Machine              Firestore SDK                   Streaming Audio
```

**Key design**: The backend acts as a secure proxy — the Gemini API key never reaches the browser. Tool calls from Gemini are routed: workspace tools update the React UI, desktop tools execute server-side via Node.js.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **AI** | Gemini 2.5 Flash (Live API, Native Audio) via `@google/genai` SDK |
| **Backend** | Node.js, Express, WebSocket (`ws`), TypeScript |
| **Frontend** | React 19, Vite, Tailwind CSS 4, Zustand, Lucide Icons |
| **Desktop** | `screenshot-desktop`, `child_process`, `open`, `fs` |
| **Persistence** | Firebase Firestore, Firebase Auth (Google Sign-In) |
| **Deployment** | Docker, Google Cloud Run |

---

## Features

| Feature | Description |
|---------|-------------|
| **Real-time Voice** | Bi-directional audio via Gemini Live API. Speak naturally, interrupt anytime. |
| **Screen Understanding** | Workspace DOM captured at 1fps as JPEG, streamed to Gemini for visual grounding. |
| **11 Semantic Tools** | Workspace navigation, email drafting, desktop screenshots, shell commands, file ops, URL opening. |
| **Approval Gate** | Agent pauses before sensitive actions. User approves or denies via modal. |
| **Dynamic Plan View** | Agent shows its step-by-step plan, updating live as it executes. |
| **Execution Log** | Full timeline of every action, tool call, and decision. |
| **Workflow Save & Replay** | Save successful sequences to Firestore. Replay with one click. |
| **Command Guard** | Dangerous commands (rm -rf, format, shutdown) are blocked server-side. |
| **State Machine** | 8 explicit UI states (Idle, Listening, Thinking, Speaking, Acting, Paused, Interrupted, Saving). |

---

## Google Cloud Services Used

1. **Gemini Live API** (`@google/genai` SDK) — Real-time multimodal AI with native audio and function calling
2. **Google Cloud Run** — Backend hosting with WebSocket support
3. **Firebase Firestore** — Workflow persistence and user data
4. **Firebase Auth** — Google Sign-In for user authentication

---

## Quick Start (Local Development)

### Prerequisites
- **Node.js** 20+
- **Gemini API Key** — Get one from [Google AI Studio](https://aistudio.google.com/)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/vermamanoj/flow.git
cd flow

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# 4. Start development server
npm run dev

# 5. Open browser
# Navigate to http://localhost:3000
# Click "Start Voice Session" and allow microphone access
```

### Demo Workflow

1. Click **"Start Voice Session"** in the header
2. Say: *"Show me my inbox"* → Agent navigates to inbox view
3. Say: *"Draft an email to Alice about the Q1 deliverables"* → Agent creates draft
4. Say: *"Take a screenshot of my desktop"* → Agent captures real screen
5. Say: *"What files are in my Documents folder?"* → Agent lists real files
6. Say: *"Save this as a workflow called Q1 follow-up"* → Saved to Firestore
7. Click **"Run"** on the saved workflow to replay it

---

## Deploy to Google Cloud Run

### Automated (PowerShell)

```powershell
# Set environment variables
$env:GCP_PROJECT_ID = "your-project-id"
$env:GEMINI_API_KEY = "your-api-key"

# Run deploy script
.\deploy.ps1
```

### Manual

```bash
# Build and push container
gcloud builds submit --tag gcr.io/YOUR_PROJECT/proxi-flow

# Deploy to Cloud Run
gcloud run deploy proxi-flow \
  --image gcr.io/YOUR_PROJECT/proxi-flow \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "GEMINI_API_KEY=YOUR_KEY,NODE_ENV=production"
```

---

## Project Structure

```
proxi-flow/
├── server.ts              # Express backend + Gemini Live API proxy + Desktop tools
├── src/
│   ├── App.tsx            # Main app: session management, audio, tool handling
│   ├── components/
│   │   ├── Header.tsx     # State indicator + session controls
│   │   ├── Sidebar.tsx    # Saved workflows + Firebase integration
│   │   ├── Workspace.tsx  # MockCRM demo + Plan view + Approval modal
│   │   ├── LogPanel.tsx   # Execution log timeline
│   │   └── WorkflowVisualizer.tsx  # Workflow step viewer
│   ├── store/
│   │   └── useAppStore.ts # Zustand state machine (8 states)
│   └── firebase.ts        # Firebase initialization
├── Dockerfile             # Cloud Run container
├── deploy.ps1             # Automated GCP deployment script
├── firestore.rules        # Firestore security rules
├── ARCHITECTURE.md        # Full architecture diagram
└── docs/                  # Design documents
```

---

## Judging Criteria Alignment

| Criteria | How Proxi Flow Addresses It |
|----------|---------------------------|
| **Innovation & Multimodal UX (40%)** | Voice-first with live screen capture. Breaks the text box — users speak and see the agent act in real-time. Approval gates add trust. |
| **Technical Implementation (30%)** | Uses `@google/genai` SDK with Gemini Live API. Hosted on Cloud Run. 11 tools with hybrid routing. Command Guard for safety. Firestore for persistence. |
| **Demo & Presentation (30%)** | Architecture diagram included. Real desktop execution (not just mocks). Live voice interaction with visible state machine. |

---

## License

MIT
