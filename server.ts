import express from 'express';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  // API routes FIRST
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // WebSocket setup for Gemini Live API Proxy
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to WebSocket');
    
    let sessionPromise: Promise<any> | null = null;
    
    ws.on('message', async (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'start') {
          console.log('Starting Gemini Live session...');
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          
          sessionPromise = ai.live.connect({
            model: "gemini-2.5-flash-native-audio-preview-09-2025",
            callbacks: {
              onopen: () => {
                console.log('Connected to Gemini Live API');
                ws.send(JSON.stringify({ type: 'connected' }));
              },
              onmessage: (msg: any) => {
                // Forward audio and tool calls to the client
                if (msg.serverContent?.modelTurn?.parts) {
                  for (const part of msg.serverContent.modelTurn.parts) {
                    if (part.inlineData && part.inlineData.data) {
                      ws.send(JSON.stringify({
                        type: 'audio',
                        data: part.inlineData.data,
                        mimeType: part.inlineData.mimeType
                      }));
                    }
                  }
                }
                if (msg.serverContent?.interrupted) {
                  ws.send(JSON.stringify({ type: 'interrupted' }));
                }
                if (msg.toolCall) {
                  ws.send(JSON.stringify({
                    type: 'toolCall',
                    toolCall: msg.toolCall
                  }));
                }
              },
              onclose: () => {
                console.log('Gemini Live API connection closed');
                ws.send(JSON.stringify({ type: 'closed' }));
              },
              onerror: (err: any) => {
                console.error('Gemini Live API error:', err);
                ws.send(JSON.stringify({ type: 'error', error: err.message }));
              }
            },
            config: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
              },
              systemInstruction: "You are Proxi Flow, a trusted voice-first visual workflow assistant. You help users plan tasks, act in the workspace, handle interruptions, and save reusable workflows. You are currently looking at a mock CRM/Inbox workspace. Always explain what you are doing. If the user asks to do something risky like sending an email, use the request_approval tool first.",
              tools: [
                {
                  functionDeclarations: [
                    {
                      name: "navigate_view",
                      description: "Navigate to a different view in the workspace (e.g., 'inbox', 'drafts', 'notes').",
                      parameters: {
                        type: "OBJECT",
                        properties: {
                          view: { type: "STRING", description: "The view to navigate to." }
                        },
                        required: ["view"]
                      }
                    },
                    {
                      name: "draft_content",
                      description: "Draft content for an email or note.",
                      parameters: {
                        type: "OBJECT",
                        properties: {
                          target: { type: "STRING", description: "The target recipient or note title." },
                          content: { type: "STRING", description: "The drafted content." }
                        },
                        required: ["target", "content"]
                      }
                    },
                    {
                      name: "request_approval",
                      description: "Request user approval before performing a risky action like sending an email or deleting data.",
                      parameters: {
                        type: "OBJECT",
                        properties: {
                          action_summary: { type: "STRING", description: "A summary of the action that needs approval." }
                        },
                        required: ["action_summary"]
                      }
                    },
                    {
                      name: "save_workflow",
                      description: "Save the current sequence of actions as a reusable workflow.",
                      parameters: {
                        type: "OBJECT",
                        properties: {
                          workflow_name: { type: "STRING", description: "A short, descriptive name for the workflow." }
                        },
                        required: ["workflow_name"]
                      }
                    },
                    {
                      name: "update_plan",
                      description: "Update the current plan of action displayed to the user. Use this to show what steps you are taking.",
                      parameters: {
                        type: "OBJECT",
                        properties: {
                          steps: {
                            type: "ARRAY",
                            description: "The list of steps in the plan.",
                            items: {
                              type: "OBJECT",
                              properties: {
                                id: { type: "STRING", description: "A unique ID for the step." },
                                label: { type: "STRING", description: "A short label describing the step." },
                                status: { type: "STRING", description: "The status of the step: 'pending', 'active', 'complete', 'interrupted', or 'approval-needed'." }
                              },
                              required: ["id", "label", "status"]
                            }
                          }
                        },
                        required: ["steps"]
                      }
                    }
                  ]
                }
              ]
            }
          });
        } else if (data.type === 'audio' && sessionPromise) {
          sessionPromise.then((session) => {
            session.sendRealtimeInput([
              { media: { data: data.data, mimeType: 'audio/pcm;rate=16000' } }
            ]);
          }).catch(console.error);
        } else if (data.type === 'image' && sessionPromise) {
          sessionPromise.then((session) => {
            session.sendRealtimeInput([
              { media: { data: data.data, mimeType: 'image/jpeg' } }
            ]);
          }).catch(console.error);
        } else if (data.type === 'toolResponse' && sessionPromise) {
          sessionPromise.then((session) => {
            session.sendToolResponse({
              functionResponses: data.functionResponses
            });
          }).catch(console.error);
        } else if (data.type === 'stop' && sessionPromise) {
          sessionPromise = null;
        }
      } catch (err) {
        console.error('Error handling message:', err);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
      sessionPromise = null;
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
