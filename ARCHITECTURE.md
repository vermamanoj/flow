# Proxi Flow — Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            👤 USER (Browser)                                    │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ 🎤 Microphone │  │ 🖥️ Demo Workspace │  │ 📋 Plan View  │  │ 📜 Exec Log   │  │
│  │  (16kHz PCM)  │  │   (MockCRM UI)   │  │  (Live Steps) │  │  (Timeline)   │  │
│  └──────┬───────┘  └───────┬──────────┘  └──────────────┘  └───────────────┘  │
│         │ audio             │ 1fps JPEG                                         │
│         │                   │ (dom-to-jpeg)                                     │
│  ┌──────▼───────────────────▼──────────────────────────────────────────────┐    │
│  │                    React Frontend (Vite + Tailwind)                      │    │
│  │  • Zustand State Machine (8 states)                                     │    │
│  │  • Audio Capture → base64 PCM                                           │    │
│  │  • Screen Capture → base64 JPEG                                         │    │
│  │  • Audio Playback (24kHz PCM)                                           │    │
│  │  • Workspace Tool Execution (navigate_view, draft_content, etc.)        │    │
│  │  • Approval Gate Modal                                                  │    │
│  │  • Workflow Save/Replay                                                 │    │
│  └──────────────────────────┬──────────────────────────────────────────────┘    │
└─────────────────────────────┼───────────────────────────────────────────────────┘
                              │ WebSocket (ws://)
                              │ ↕ audio, images, toolCalls, toolResponses
┌─────────────────────────────┼───────────────────────────────────────────────────┐
│                    ☁️  Express Backend (Node.js)                                │
│  ┌──────────────────────────▼──────────────────────────────────────────────┐    │
│  │                      WebSocket Proxy Server                             │    │
│  │  • Receives audio/video from frontend                                   │    │
│  │  • Routes to Gemini Live API                                            │    │
│  │  • Routes tool calls:                                                   │    │
│  │    - Workspace tools → forwarded to frontend                            │    │
│  │    - Desktop tools → executed server-side                               │    │
│  └──────────┬────────────────────────────┬─────────────────────────────────┘    │
│             │                            │                                      │
│  ┌──────────▼──────────┐    ┌────────────▼────────────────────────────────┐    │
│  │  🛡️ Command Guard   │    │  🔧 Desktop Tool Engine                    │    │
│  │  • Blocked patterns │    │  • take_screenshot (screenshot-desktop)     │    │
│  │  • Safety validation│    │  • run_command (child_process, PowerShell)  │    │
│  │                     │    │  • open_url (open)                          │    │
│  └─────────────────────┘    │  • list_files (fs.readdirSync)             │    │
│                             │  • read_file (fs.readFileSync)             │    │
│                             └─────────────────────────────────────────────┘    │
│                                                                                 │
│  Hosted on Google Cloud Run                                                     │
└─────────────────────────────┬───────────────────────────────────────────────────┘
                              │ WebSocket (wss://)
                              │ Gemini Live API Protocol
┌─────────────────────────────▼───────────────────────────────────────────────────┐
│                        🧠 Gemini Live API (Google Cloud)                        │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  Model: gemini-2.5-flash-native-audio-preview                           │   │
│  │  • Real-time voice generation (Zephyr voice)                            │   │
│  │  • Multimodal reasoning (audio + vision)                                │   │
│  │  • Native function calling (11 tools)                                   │   │
│  │  • Interruption-aware streaming                                         │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘

                              │
                              │ Firestore SDK
                              ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        🔥 Firebase / Firestore (Google Cloud)                   │
│  • Workflow persistence (save/load reusable workflows)                          │
│  • Google Auth (user authentication)                                            │
│  • Security rules (owner-only access)                                           │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

1. **Voice Input**: User speaks → Mic captures 16kHz PCM → base64 → WebSocket → Backend → Gemini
2. **Vision Input**: Workspace DOM → dom-to-jpeg at 1fps → base64 JPEG → WebSocket → Backend → Gemini
3. **Voice Output**: Gemini generates audio → Backend → WebSocket → Frontend → PCM playback
4. **Tool Calls**: Gemini decides to act → Backend routes:
   - **Workspace tools** (`navigate_view`, `draft_content`, `request_approval`, `update_plan`, `save_workflow`) → forwarded to frontend React state
   - **Desktop tools** (`take_screenshot`, `run_command`, `open_url`, `list_files`, `read_file`) → executed server-side, result sent back to Gemini
5. **Workflows**: Completed action sequences → saved to Firestore → replayable from sidebar

## Key Design Decisions

- **Backend WebSocket Proxy**: API key never reaches the browser. All Gemini communication is server-mediated.
- **Hybrid Tool Routing**: Workspace tools update React UI state. Desktop tools execute on the host machine via Node.js.
- **Command Guard**: Dangerous shell commands are blocked at the server level before execution.
- **State Machine**: 8 explicit states ensure the UI always reflects what the agent is doing.
