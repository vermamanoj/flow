# Proxi Flow — Demo Video Script (~3.5 minutes)

## Setup Before Recording
- Open `http://localhost:3000` (or your Cloud Run URL) in Chrome
- Clear browser cache / sessionStorage so landing page shows fresh
- Have the access code ready: `proxiflow2025`
- Close unnecessary browser tabs for clean look
- Resolution: 1920x1080, browser full screen

---

## SCENE 1: Landing Page (0:00 – 0:25)

**Show:** The landing page hero with Proxi Flow branding, 4 feature cards, example commands, and waitlist form.

**Narrate:**
> "Meet Proxi Flow — a voice-first AI workspace agent powered by the Gemini Live API. Unlike typical chatbots that can only talk, Proxi Flow can actually see your screen, navigate applications, control your desktop, and execute real tasks — all through natural conversation. And it always asks before doing anything risky."

**Action:** Scroll down briefly to show the feature cards and waitlist section, then scroll back up.

---

## SCENE 2: Start Session + Access Code (0:25 – 0:40)

**Action:** Click "Start Session". The access code modal appears.

**Narrate:**
> "Sessions are protected by an access code to prevent abuse. Judges — your code is in the submission notes."

**Action:** Type `proxiflow2025`, click "Verify & Start". Session connects, state changes to "Listening/Thinking".

---

## SCENE 3: Workspace Navigation via Text (0:40 – 1:15)

**Action:** Type in the text bar: `Show me my inbox`

**Narrate:**
> "I can navigate the workspace using natural language. Watch — the agent calls the navigate_view tool, and the MockCRM instantly switches to the inbox."

**Action:** Wait for the agent to respond. The workspace shows the inbox. Then type: `Show me client notes`

**Narrate:**
> "Notice the execution log on the right tracking every action in real-time, and the plan strip at the top showing the agent's approach."

---

## SCENE 4: Draft an Email (1:15 – 1:50)

**Action:** Type: `Draft an email to Alice about the Q1 progress report`

**Narrate:**
> "Now let's create something. The agent drafts an email using the draft_content tool. This stages the draft for review — it doesn't send it yet. That's the trust-first design."

**Action:** Wait for the draft to appear. Click "Drafts" tab to show the staged email.

---

## SCENE 5: Real Desktop Tools (1:50 – 2:30) ⭐ KEY DIFFERENTIATOR

**Action:** Type: `Take a screenshot of my desktop`

**Narrate:**
> "Here's what makes Proxi Flow special — it has real desktop tools. This isn't a mock. The agent just captured an actual screenshot of my machine using the screenshot-desktop library on the server."

**Action:** Type: `List the files in my user folder` (or `List files in C:\Users`)

**Narrate:**
> "It can also list files, read files, run shell commands, and open URLs. All executed server-side with a Command Guard that blocks dangerous commands like rm -rf or format."

**Action:** Type: `Open google.com`

**Narrate:**
> "And it just opened a real browser tab. This is hybrid tool routing — workspace tools update the React UI, desktop tools execute on the actual machine."

---

## SCENE 6: Approval Gate (2:30 – 2:55)

**Action:** Type: `Send that email draft to Alice` (this should trigger the approval gate)

**Narrate:**
> "Watch what happens when I ask it to send the email. The agent pauses and asks for explicit approval before any sensitive action. This is the approval gate — the user is always in control."

**Action:** Show the approval modal. Click "Deny & Edit" to demonstrate the safety mechanism.

**Narrate:**
> "I denied it. The agent respects my decision and doesn't proceed. This is defense-in-depth: prompt guardrails, server-side command blocking, and user-facing approval gates."

---

## SCENE 7: Save Workflow (2:55 – 3:15)

**Action:** Type: `Save this as a workflow called Q1 Client Review`

**Narrate:**
> "Finally, I can save this entire task sequence as a reusable workflow to Firebase. Next time, I can replay it with one click from the sidebar — no re-prompting needed."

**Action:** Show the workflow appearing in the left sidebar.

---

## SCENE 8: Closing + Architecture (3:15 – 3:30)

**Show:** Briefly flash the ARCHITECTURE.md diagram (or a screenshot of it).

**Narrate:**
> "Under the hood: React 19 frontend with Zustand state machine, Node.js backend proxying to Gemini 2.5 Flash with native audio, 11 custom tools with hybrid routing, Firebase for persistence, and Docker deployment on Google Cloud Run. Built for the Gemini Live Agent Challenge."

---

## SCENE 9: Waitlist + Call to Action (3:30 – 3:40)

**Action:** Stop the session. Scroll to waitlist form.

**Narrate:**
> "Proxi Flow — an agent you can actually trust to do real work. Join the waitlist to get early access."

**END**

---

## Tips for Recording
- Use OBS Studio or Windows Game Bar (Win+G) for screen recording
- Record at 1080p, 30fps
- Add light background music (optional)
- Keep mouse movements smooth and deliberate
- Pause briefly after each action so viewers can see the result
- If using voice narration, record it as a separate audio track and overlay
- Total target: 3 min 30 sec (under the 4 min limit with buffer)
