# Proxi Flow — Devpost Submission

## Inspiration

We've been frustrated by AI assistants that can only talk but never act. Current voice assistants answer questions but can't navigate your CRM, draft emails, run shell commands, or manage files on your behalf. We wanted to build an agent that **speaks, sees, and acts** — one you can trust with real work because it always asks before doing anything risky.

## What it does

Proxi Flow is a **voice-first AI workspace agent** powered by the Gemini Live API. Users speak naturally to the agent, which can:

- **Navigate a workspace**: Switch between inbox, notes, and drafts in a mock CRM
- **Draft emails**: Compose and stage email drafts for review
- **Control the real desktop**: Take screenshots, run shell commands, open URLs, list/read files
- **Plan and execute multi-step tasks**: Shows a live plan strip with step-by-step progress
- **Ask for approval**: Pauses before sensitive actions and waits for explicit user permission
- **Save workflows**: Completed task sequences are saved to Firestore and can be replayed with one click

The agent sees the workspace screen at 1fps (vision input), listens to voice in real-time, and responds with natural speech — all while executing 11 different tools.

## How we built it

- **Frontend**: React 19 + Vite + Tailwind CSS 4 + Zustand state machine (8 states)
- **Backend**: Node.js + Express + WebSocket proxy to Gemini Live API
- **AI**: Gemini 2.5 Flash with native audio, vision, and function calling via `@google/genai` SDK
- **Desktop Tools**: Native Node.js implementations — `screenshot-desktop` for screen capture, `child_process` for shell commands, `open` for URL launching, `fs` for file operations
- **Persistence**: Firebase Firestore for workflow storage, Firebase Auth for Google Sign-In
- **Deployment**: Docker container on Google Cloud Run with automated deploy script
- **Safety**: Server-side Command Guard that blocks destructive commands (rm -rf, format, shutdown, etc.)

The architecture uses a **hybrid tool routing** pattern: workspace tools (navigate, draft, approve) execute on the frontend React state, while desktop tools (screenshot, command, files) execute server-side on the host machine. This gives Gemini access to real computer capabilities while keeping the UI responsive.

## Challenges we ran into

- **tsx/Vite ESM resolver conflict**: The tsx TypeScript runner's ESM hooks conflicted with Vite's config loading in middleware mode on Windows. Solved by switching to esbuild for server compilation.
- **Tool declaration format**: The Gemini Live API's tool declaration format differs subtly from the REST API. Required careful schema definition using the `Type` enum from `@google/genai`.
- **Balancing safety and capability**: Desktop tools are powerful but dangerous. We implemented a multi-layer safety approach: system instruction guidelines, server-side command blocking patterns, and the approval gate for runtime consent.

## Accomplishments that we're proud of

- **Real desktop interaction** — not mocks. The agent actually takes screenshots, runs commands, and opens URLs.
- **Hybrid tool routing** — a clean architectural pattern where Gemini's tool calls are intelligently routed to either frontend state or server-side execution.
- **Trust-first design** — the approval gate and Command Guard ensure the agent never acts without permission on sensitive operations.
- **Complete voice loop** — speak → see → reason → act → respond, all in real-time with interruption support.

## What we learned

- The Gemini Live API's native audio + function calling combination is remarkably capable for building agentic voice interfaces.
- Streaming multimodal inputs (audio + vision simultaneously) to an LLM creates a much richer interaction model than text-only.
- Safety in agentic systems requires defense-in-depth: prompt-level guardrails, server-side blocking, and user-facing approval gates.

## What's next for Proxi Flow

- **Keyboard/mouse simulation** via `@nut-tree/nut-js` for full UI automation
- **Multi-workspace support** — connect to real apps (Salesforce, Gmail, Slack) via APIs
- **Workflow marketplace** — share and discover reusable workflows
- **Team mode** — collaborative workflow creation with role-based approval chains
- **On-premise deployment** — for enterprise customers who need data to stay local

## Built With

- gemini-live-api
- google-cloud-run
- firebase
- react
- nodejs
- typescript
- websockets
- tailwindcss
- docker
- esbuild

## Try it out

- [GitHub Repository](https://github.com/vermamanoj/proxi-flow)
- [Architecture Diagram](https://github.com/vermamanoj/proxi-flow/blob/main/ARCHITECTURE.md)
