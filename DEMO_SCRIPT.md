# Proxi Flow — Demo Video Script (~3.5 minutes)

> **Core pitch:** Proxi Flow isn't a chatbot. It's an agent that orchestrates
> multi-step tasks *across* your workspace and real desktop — things a single
> button click can't do. The value is compound automation, not single actions.

## Setup Before Recording
- Open `http://localhost:3000` (or your Cloud Run URL) in Chrome
- Clear browser cache / sessionStorage so landing page shows fresh
- Have the access code ready: `proxiflow2025`
- Have a real file at `C:\Users\<you>\notes.txt` with a few lines of text
- Close unnecessary browser tabs for clean look
- Resolution: 1920x1080, browser full screen

---

## SCENE 1: The Problem (0:00 – 0:20)

**Show:** The landing page hero.

**Narrate:**
> "Every day we juggle emails, CRM updates, file lookups, and desktop tasks across
> multiple apps. Each one takes a click, a tab switch, a copy-paste. What if you
> could just describe the *outcome* you want and an agent handles all the steps?
> That's Proxi Flow — a voice-first agent powered by Gemini Live that can see,
> reason, and *act* across your workspace and your real desktop."

---

## SCENE 2: Start Session (0:20 – 0:35)

**Action:** Click "Start Session" → enter access code → connected.

**Narrate:**
> "Sessions are access-code protected. Judges, your code is in the submission notes.
> Once connected, I can talk or type — let's use text since this is a recording."

---

## SCENE 3: Multi-Step Task — "Prepare for my Q1 review" (0:35 – 1:30) ⭐ KEY SCENE

**Action:** Type: `Prepare for my Q1 client review. Check my inbox for client messages, pull up the March action items, then draft a progress email to Alice summarizing everything.`

**Narrate:**
> "Watch this — one sentence, and the agent builds a multi-step plan. It navigates
> to the inbox to check messages, switches to client notes for March action items,
> then synthesizes everything into a draft email. Three tools, three context switches,
> all orchestrated from a single request. That's the difference — not 'open inbox',
> but 'prepare my entire review'."

**Action:** Let the agent execute. Point out:
- The **plan strip** showing steps 1-2-3
- The **workspace switching** between views automatically
- The **draft appearing** in the Drafts tab
- The **execution log** tracking every tool call in real-time

---

## SCENE 4: Desktop Intelligence — "What am I working on?" (1:30 – 2:15) ⭐ KEY DIFFERENTIATOR

**Action:** Type: `Take a screenshot of my desktop, read the file C:\Users\manoj\notes.txt, and tell me what I should focus on today.`

**Narrate:**
> "Here's what makes Proxi Flow different from every other demo. It has real
> desktop tools. It just took an actual screenshot of my machine, read a real file
> from my filesystem, and combined both to give me a personalized recommendation.
> This isn't mocked — those are real system calls running server-side with a
> Command Guard that blocks anything dangerous."

**Action:** Let the agent execute. Show the execution log showing screenshot + file read.

**Narrate:**
> "The hybrid routing is key: workspace tools update the React UI instantly,
> desktop tools execute on the real machine via the Node backend. Same agent,
> same conversation, two different execution contexts."

---

## SCENE 5: Safety — Approval Gate (2:15 – 2:45)

**Action:** Type: `Now send that email to Alice and delete the notes file.`

**Narrate:**
> "Now I'm asking it to do something risky — send an email and delete a file.
> Watch — the agent doesn't just do it. It hits the approval gate and asks for
> my explicit permission first."

**Action:** Show the approval modal. Click **"Deny & Edit"**.

**Narrate:**
> "I denied it. The agent respects that and stops. This is defense-in-depth:
> prompt-level guardrails tell the agent to ask, the server-side Command Guard
> blocks destructive shell commands, and the frontend approval gate puts the human
> in the loop. Three layers of safety."

---

## SCENE 6: Save & Replay Workflow (2:45 – 3:10)

**Action:** Type: `Save everything we just did as a workflow called "Q1 Client Review"`

**Narrate:**
> "Now I save this entire sequence as a reusable workflow. Next week when I need
> to do the same review for Bob, I just click Play in the sidebar — no
> re-prompting, no re-explaining. This is where voice agents become real
> productivity tools — learned routines, not just one-shot commands."

**Action:** Show the workflow card appearing in the left sidebar.

---

## SCENE 7: Architecture Flash + Close (3:10 – 3:30)

**Show:** Flash a clean architecture diagram or bullet points:

**Narrate:**
> "Under the hood: Gemini 2.5 Flash with Live API for real-time voice and tool
> calling, React 19 frontend with Zustand state machine, Node.js proxy with
> 11 custom tools and hybrid routing, Firebase for workflow persistence, approval
> gates and Command Guard for safety, all containerized with Docker on Cloud Run.
> Built for the Gemini API Developer Competition."

---

## SCENE 8: Waitlist (3:30 – 3:40)

**Action:** Stop session, show the waitlist form on the landing page.

**Narrate:**
> "Proxi Flow. An agent you can trust to do real work. Join the waitlist."

**END**

---

## Key Demo Principles
1. **Never demo a single action** — always show multi-step compound tasks
2. **The "why" is orchestration** — humans can click buttons; agents chain actions
3. **Desktop tools are the differentiator** — most competitors can't touch the real OS
4. **Safety sells trust** — the approval gate is a feature, not a limitation
5. **Workflows = replayability** — transforms one-shot commands into lasting value

## Tips for Recording
- Use OBS Studio or Windows Game Bar (Win+G) for screen recording
- Record at 1080p, 30fps
- Add light background music (optional)
- Keep mouse movements smooth and deliberate
- Pause briefly after each action so viewers can see the result
- If using voice narration, record it as a separate audio track and overlay
- Total target: 3 min 30 sec (under the 4 min limit with buffer)
