// server.ts
import express from "express";
import { WebSocketServer } from "ws";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Modality, Type } from "@google/genai";
import dotenv from "dotenv";
import { exec } from "child_process";
import fs from "fs";
import os from "os";
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var PORT = process.env.PORT || 3e3;
var SYSTEM_INSTRUCTION = `You are Proxi Flow, an intelligent voice-first workspace assistant with real desktop control capabilities.

PERSONA & VOICE RULES:
- You speak naturally, briefly, and conversationally. This is VOICE \u2014 not text.
- Never output markdown, asterisks, bullet points, or formatting symbols in speech.
- You have a confident, helpful personality. You are a trusted productivity partner.
- When executing actions, narrate what you're doing concisely: "Opening your inbox now" or "Taking a screenshot of your desktop."

WORKSPACE CONTEXT:
You are connected to a Demo Workspace \u2014 a mock CRM application called "MockCRM" with three views:
- "inbox": Shows recent client messages (Alice, Bob, Charlie)
- "notes": Shows client action items for March
- "drafts": Shows pending email drafts
You can navigate between these views and create draft emails using your workspace tools.

DESKTOP CONTEXT:
You also have access to REAL desktop tools that let you interact with the user's actual computer:
- Take screenshots of the real desktop screen
- Run terminal/shell commands
- Open URLs in the browser
- List and read files on the filesystem
These are powerful \u2014 use them when the user asks you to do something on their actual machine.

TOOL USAGE GUIDELINES:
1. For workspace tasks (navigating CRM, drafting emails, viewing notes): use navigate_view, draft_content
2. For real computer tasks (check system info, open websites, find files): use take_screenshot, run_command, open_url, list_files, read_file
3. Before ANY destructive or sensitive action (sending emails, deleting files, running risky commands): ALWAYS call request_approval first
4. When starting a multi-step task, call update_plan to show the user your planned steps
5. After completing a useful task sequence, offer to save it as a reusable workflow with save_workflow

INTERRUPTION HANDLING:
- If the user interrupts, stop immediately, acknowledge the interruption, and ask what they'd like instead.
- Always replan when interrupted \u2014 never continue a stale plan.

SAFETY:
- Never run destructive commands (rm -rf, format, del /s, etc.) even if asked
- Always request_approval before commands that modify system state
- If unsure about a command's safety, ask the user first`;
var TOOL_DECLARATIONS = [
  {
    functionDeclarations: [
      // --- Workspace Tools (executed on frontend) ---
      {
        name: "navigate_view",
        description: "Navigate the MockCRM workspace to a specific view. Use this to switch between inbox, notes, and drafts.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            view: {
              type: Type.STRING,
              description: "The view to navigate to. Must be one of: inbox, notes, drafts",
              enum: ["inbox", "notes", "drafts"]
            }
          },
          required: ["view"]
        }
      },
      {
        name: "draft_content",
        description: "Create a new email draft in the workspace. This drafts the email but does NOT send it \u2014 it goes to the Drafts view for review.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            target: {
              type: Type.STRING,
              description: "The recipient of the email (e.g., 'Alice', 'Bob', 'Charlie')"
            },
            content: {
              type: Type.STRING,
              description: "The full body text of the email draft"
            }
          },
          required: ["target", "content"]
        }
      },
      {
        name: "request_approval",
        description: "Pause execution and ask the user for explicit approval before performing a sensitive action. Use this before sending emails, deleting data, running risky commands, or any action with side effects.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            action_summary: {
              type: Type.STRING,
              description: "A clear, human-readable summary of the action you want to perform"
            }
          },
          required: ["action_summary"]
        }
      },
      {
        name: "update_plan",
        description: "Display or update the current execution plan shown to the user. Call this at the start of multi-step tasks to show your planned approach.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            steps: {
              type: Type.ARRAY,
              description: "Array of plan step objects",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "Unique step ID" },
                  label: { type: Type.STRING, description: "Short description of this step" },
                  status: { type: Type.STRING, description: "One of: pending, active, complete", enum: ["pending", "active", "complete"] }
                },
                required: ["id", "label", "status"]
              }
            }
          },
          required: ["steps"]
        }
      },
      {
        name: "save_workflow",
        description: "Save the current sequence of actions as a reusable workflow that can be replayed later. Call this after successfully completing a useful task.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            workflow_name: {
              type: Type.STRING,
              description: "A short, descriptive name for this workflow (e.g., 'Draft Q1 follow-up emails')"
            }
          },
          required: ["workflow_name"]
        }
      },
      // --- Desktop Tools (executed on server) ---
      {
        name: "take_screenshot",
        description: "Capture a screenshot of the user's real desktop screen. Returns the screenshot as a base64 JPEG. Use this to see what's actually on the user's screen outside the workspace.",
        parameters: {
          type: Type.OBJECT,
          properties: {}
        }
      },
      {
        name: "run_command",
        description: "Execute a shell command on the user's machine and return the output. Use this for system tasks like checking processes, disk usage, network info, git operations, etc. NEVER run destructive commands.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            command: {
              type: Type.STRING,
              description: "The shell command to execute"
            }
          },
          required: ["command"]
        }
      },
      {
        name: "open_url",
        description: "Open a URL in the user's default web browser.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            url: {
              type: Type.STRING,
              description: "The URL to open (must start with http:// or https://)"
            }
          },
          required: ["url"]
        }
      },
      {
        name: "list_files",
        description: "List files and directories at a given path on the user's filesystem.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            directory: {
              type: Type.STRING,
              description: "The directory path to list (e.g., 'C:\\\\Users' or '~/Documents')"
            }
          },
          required: ["directory"]
        }
      },
      {
        name: "read_file",
        description: "Read the text contents of a file on the user's filesystem. Use for small text files only.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            file_path: {
              type: Type.STRING,
              description: "The full path to the file to read"
            }
          },
          required: ["file_path"]
        }
      }
    ]
  }
];
var BLOCKED_PATTERNS = [
  /rm\s+-rf/i,
  /del\s+\/s/i,
  /format\s+/i,
  /shutdown/i,
  /mkfs/i,
  /dd\s+if=/i,
  />\s*\/dev\/sd/i,
  /reg\s+delete/i
];
function isCommandSafe(command) {
  return !BLOCKED_PATTERNS.some((pattern) => pattern.test(command));
}
async function executeDesktopTool(name, args) {
  switch (name) {
    case "take_screenshot": {
      try {
        const screenshot = await import("screenshot-desktop");
        const imgBuffer = await screenshot.default({ format: "jpg" });
        const base64 = imgBuffer.toString("base64");
        return { status: "success", message: "Screenshot captured", image_base64: base64.substring(0, 100) + "...[truncated for voice response]" };
      } catch (err) {
        return { status: "error", message: `Screenshot failed: ${err.message}` };
      }
    }
    case "run_command": {
      const command = args.command || "";
      if (!isCommandSafe(command)) {
        return { status: "blocked", message: "This command is blocked for safety reasons." };
      }
      return new Promise((resolve) => {
        const shell = os.platform() === "win32" ? "powershell.exe" : "/bin/bash";
        exec(command, { shell, timeout: 3e4, maxBuffer: 1024 * 512 }, (error, stdout, stderr) => {
          if (error) {
            resolve({ status: "error", message: error.message, stderr: stderr?.substring(0, 500) });
          } else {
            resolve({ status: "success", stdout: stdout?.substring(0, 2e3), stderr: stderr?.substring(0, 500) });
          }
        });
      });
    }
    case "open_url": {
      const url = args.url || "";
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return { status: "error", message: "URL must start with http:// or https://" };
      }
      try {
        const openModule = await import("open");
        await openModule.default(url);
        return { status: "success", message: `Opened ${url} in browser` };
      } catch (err) {
        return { status: "error", message: `Failed to open URL: ${err.message}` };
      }
    }
    case "list_files": {
      const directory = args.directory || ".";
      try {
        const resolved = path.resolve(directory);
        const entries = fs.readdirSync(resolved, { withFileTypes: true });
        const files = entries.slice(0, 50).map((e) => ({
          name: e.name,
          type: e.isDirectory() ? "directory" : "file",
          size: e.isFile() ? fs.statSync(path.join(resolved, e.name)).size : void 0
        }));
        return { status: "success", path: resolved, entries: files, total: entries.length };
      } catch (err) {
        return { status: "error", message: `Failed to list directory: ${err.message}` };
      }
    }
    case "read_file": {
      const filePath = args.file_path || "";
      try {
        const resolved = path.resolve(filePath);
        const stat = fs.statSync(resolved);
        if (stat.size > 100 * 1024) {
          return { status: "error", message: "File too large (>100KB). Use run_command to read specific parts." };
        }
        const content = fs.readFileSync(resolved, "utf-8");
        return { status: "success", path: resolved, content: content.substring(0, 5e3), size: stat.size };
      } catch (err) {
        return { status: "error", message: `Failed to read file: ${err.message}` };
      }
    }
    default:
      return { status: "error", message: `Unknown desktop tool: ${name}` };
  }
}
var SERVER_TOOLS = /* @__PURE__ */ new Set(["take_screenshot", "run_command", "open_url", "list_files", "read_file"]);
async function startServer() {
  const app = express();
  const server = http.createServer(app);
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  const wss = new WebSocketServer({ server, path: "/ws" });
  wss.on("connection", (ws) => {
    console.log("Client connected to WebSocket");
    let sessionPromise = null;
    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === "start") {
          console.log("Starting Gemini Live session...");
          if (!process.env.GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY is missing!");
            ws.send(JSON.stringify({ type: "error", error: "API Key missing on server" }));
            return;
          }
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          sessionPromise = ai.live.connect({
            model: "gemini-2.5-flash-native-audio-preview-09-2025",
            callbacks: {
              onopen: () => {
                console.log("Connected to Gemini Live API");
                ws.send(JSON.stringify({ type: "connected" }));
              },
              onmessage: (msg) => {
                console.log("Received message from Gemini Live API:", JSON.stringify(msg).substring(0, 200));
                if (msg.serverContent?.modelTurn?.parts) {
                  for (const part of msg.serverContent.modelTurn.parts) {
                    if (part.inlineData && part.inlineData.data) {
                      ws.send(JSON.stringify({
                        type: "audio",
                        data: part.inlineData.data,
                        mimeType: part.inlineData.mimeType
                      }));
                    }
                  }
                }
                if (msg.serverContent?.interrupted) {
                  ws.send(JSON.stringify({ type: "interrupted" }));
                }
                if (msg.toolCall) {
                  const functionCalls = msg.toolCall.functionCalls || [];
                  const serverCalls = functionCalls.filter((c) => SERVER_TOOLS.has(c.name));
                  const clientCalls = functionCalls.filter((c) => !SERVER_TOOLS.has(c.name));
                  if (clientCalls.length > 0) {
                    ws.send(JSON.stringify({
                      type: "toolCall",
                      toolCall: { ...msg.toolCall, functionCalls: clientCalls }
                    }));
                  }
                  if (serverCalls.length > 0 && sessionPromise) {
                    (async () => {
                      try {
                        const session = await sessionPromise;
                        const responses = [];
                        for (const call of serverCalls) {
                          console.log(`Executing server tool: ${call.name}`, call.args);
                          ws.send(JSON.stringify({
                            type: "serverToolExec",
                            name: call.name,
                            args: call.args
                          }));
                          const result = await executeDesktopTool(call.name, call.args || {});
                          console.log(`Tool result for ${call.name}:`, JSON.stringify(result).substring(0, 200));
                          responses.push({
                            id: call.id,
                            name: call.name,
                            response: result
                          });
                        }
                        session.sendToolResponse({ functionResponses: responses });
                      } catch (err) {
                        console.error("Error executing server tools:", err);
                      }
                    })();
                  }
                }
              },
              onclose: () => {
                console.log("Gemini Live API connection closed");
                ws.send(JSON.stringify({ type: "closed" }));
              },
              onerror: (err) => {
                console.error("Gemini Live API error:", err);
                ws.send(JSON.stringify({ type: "error", error: err.message || "Unknown Gemini error" }));
              }
            },
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } }
              },
              systemInstruction: SYSTEM_INSTRUCTION,
              tools: TOOL_DECLARATIONS
            }
          });
        } else if (data.type === "audio" && sessionPromise) {
          sessionPromise.then((session) => {
            session.sendRealtimeInput({
              media: { data: data.data, mimeType: "audio/pcm;rate=16000" }
            });
          }).catch(console.error);
        } else if (data.type === "image" && sessionPromise) {
          sessionPromise.then((session) => {
            session.sendRealtimeInput({
              media: { data: data.data, mimeType: "image/jpeg" }
            });
          }).catch(console.error);
        } else if (data.type === "toolResponse" && sessionPromise) {
          sessionPromise.then((session) => {
            session.sendToolResponse({
              functionResponses: data.functionResponses
            });
          }).catch(console.error);
        } else if (data.type === "stop" && sessionPromise) {
          sessionPromise.then((session) => {
            if (session && typeof session.close === "function") {
              session.close();
            }
          }).catch(console.error);
          sessionPromise = null;
        }
      } catch (err) {
        console.error("Error handling message:", err);
      }
    });
    ws.on("close", () => {
      console.log("Client disconnected");
      sessionPromise = null;
    });
  });
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const tailwindcss = (await import("@tailwindcss/vite")).default;
    const react = (await import("@vitejs/plugin-react")).default;
    const vite = await createViteServer({
      configFile: false,
      plugins: [react(), tailwindcss()],
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  server.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
