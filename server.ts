import express from 'express';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Modality, Type } from '@google/genai';
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
          if (!process.env.GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY is missing!');
            ws.send(JSON.stringify({ type: 'error', error: 'API Key missing on server' }));
            return;
          }
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          
          sessionPromise = ai.live.connect({
            model: "gemini-2.5-flash-native-audio-preview-09-2025",
            callbacks: {
              onopen: () => {
                console.log('Connected to Gemini Live API');
                ws.send(JSON.stringify({ type: 'connected' }));
              },
              onmessage: (msg: any) => {
                console.log('Received message from Gemini Live API:', JSON.stringify(msg).substring(0, 200));
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
                ws.send(JSON.stringify({ type: 'error', error: err.message || 'Unknown Gemini error' }));
              }
            },
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
              },
              systemInstruction: "You are Proxi Flow, a helpful assistant. You help users with their workspace.",
            }
          });
        } else if (data.type === 'audio' && sessionPromise) {
          sessionPromise.then((session) => {
            // console.log('Sending audio to Gemini Live API, size:', data.data.length);
            session.sendRealtimeInput({
              media: { data: data.data, mimeType: 'audio/pcm;rate=16000' }
            });
          }).catch(console.error);
        } else if (data.type === 'image' && sessionPromise) {
          sessionPromise.then((session) => {
            // console.log('Sending image to Gemini Live API, size:', data.data.length);
            session.sendRealtimeInput({
              media: { data: data.data, mimeType: 'image/jpeg' }
            });
          }).catch(console.error);
        } else if (data.type === 'toolResponse' && sessionPromise) {
          sessionPromise.then((session) => {
            session.sendToolResponse({
              functionResponses: data.functionResponses
            });
          }).catch(console.error);
        } else if (data.type === 'stop' && sessionPromise) {
          sessionPromise.then(session => {
            if (session && typeof session.close === 'function') {
              session.close();
            }
          }).catch(console.error);
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

  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
