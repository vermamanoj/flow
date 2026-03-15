/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Workspace } from './components/Workspace';
import { LogPanel } from './components/LogPanel';
import { useAppStore } from './store/useAppStore';
import { domToJpeg } from 'modern-screenshot';

export default function App() {
  const { 
    state, setState, addLog, setPlan, updatePlanStep, 
    setCurrentView, addDraft, setPendingApproval, addWorkflow,
    currentSessionActions, addActionToSession, clearSessionActions,
    addActivity, clearActivities
  } = useAppStore();
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const captureIntervalRef = useRef<number | null>(null);
  const activeAudioNodesRef = useRef<AudioBufferSourceNode[]>([]);
  const [logCollapsed, setLogCollapsed] = useState(false);
  const [accessCode, setAccessCode] = useState(() => sessionStorage.getItem('proxi_access_code') || '');
  const [showCodePrompt, setShowCodePrompt] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');

  const stopAudioPlayback = () => {
    activeAudioNodesRef.current.forEach(node => {
      try { node.stop(); } catch (e) {}
    });
    activeAudioNodesRef.current = [];
  };

  const verifyAndSaveCode = async (code: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      if (res.ok) {
        setAccessCode(code);
        sessionStorage.setItem('proxi_access_code', code);
        return true;
      }
      return false;
    } catch { return false; }
  };

  const handleCodeSubmit = async () => {
    setCodeError('');
    const ok = await verifyAndSaveCode(codeInput);
    if (ok) {
      setShowCodePrompt(false);
      setCodeInput('');
      // Now start the session with the verified code
      startSessionWithCode(codeInput);
    } else {
      setCodeError('Invalid access code. Contact the project owner for access.');
    }
  };

  const startSession = async () => {
    // If no saved code, prompt for one
    if (!accessCode) {
      setShowCodePrompt(true);
      return;
    }
    startSessionWithCode(accessCode);
  };

  const startSessionWithCode = async (code: string) => {
    clearSessionActions();
    clearActivities();
    setState('LISTENING');
    addLog({ type: 'system', message: 'Starting session...' });

    // 1. Connect WebSocket with access code
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?code=${encodeURIComponent(code)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      addLog({ type: 'system', message: 'Connected to backend proxy.' });
      ws.send(JSON.stringify({ type: 'start' }));
      startAudioCapture();
      startScreenCapture();
    };

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'connected') {
        setState('THINKING');
        addLog({ type: 'system', message: 'Gemini Live session established.' });
      } else if (data.type === 'closed') {
        addLog({ type: 'system', message: 'Gemini session closed by server.' });
        stopSession();
      } else if (data.type === 'audio') {
        setState('SPEAKING');
        playAudio(data.data);
      } else if (data.type === 'interrupted') {
        setState('INTERRUPTED');
        addLog({ type: 'system', message: 'Agent interrupted by user.' });
      } else if (data.type === 'toolCall') {
        handleToolCall(data.toolCall);
      } else if (data.type === 'serverToolExec') {
        const desktopNames: Record<string, string> = {
          take_screenshot: 'Capturing screenshot',
          run_command: 'Running command',
          open_url: 'Opening URL',
          list_files: 'Listing files',
          read_file: 'Reading file',
        };
        addLog({ type: 'action', message: desktopNames[data.name] || `Desktop: ${data.name}`, details: data.args });
      } else if (data.type === 'serverToolResult') {
        // Push tool results into the activity feed for workspace display
        const { name, args, result } = data;
        if (name === 'take_screenshot') {
          addActivity({ type: 'screenshot', title: 'Screenshot captured', data: result });
        } else if (name === 'list_files') {
          addActivity({ type: 'file_list', title: `Files in ${args?.directory || '.'}`, data: result });
        } else if (name === 'read_file') {
          addActivity({ type: 'file_read', title: `File: ${args?.file_path || 'unknown'}`, data: result });
        } else if (name === 'run_command') {
          addActivity({ type: 'command', title: `$ ${args?.command || ''}`, data: result });
        } else if (name === 'open_url') {
          addActivity({ type: 'url', title: `Opened ${args?.url || ''}`, data: result });
        } else {
          addActivity({ type: 'info', title: `${name} completed`, data: result });
        }
      } else if (data.type === 'debug') {
        console.log('DEBUG:', data.message);
      } else if (data.type === 'error') {
        addLog({ type: 'system', message: `Error: ${data.error}` });
        // If access code was rejected, clear it
        if (data.error?.includes('access code')) {
          setAccessCode('');
          sessionStorage.removeItem('proxi_access_code');
        }
        stopSession();
      }
    };

    ws.onclose = () => {
      addLog({ type: 'system', message: 'Connection closed.' });
      stopSession();
    };
  };

  const stopSession = () => {
    stopAudioPlayback();
    setState('IDLE');
    if (wsRef.current) {
      try {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'stop' }));
        }
        wsRef.current.close();
      } catch (e) {}
      wsRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (playbackContextRef.current) {
      playbackContextRef.current.close();
      playbackContextRef.current = null;
    }
    if (captureIntervalRef.current) {
      window.clearInterval(captureIntervalRef.current);
    }
  };

  const sendText = (text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      addLog({ type: 'user', message: text });
      wsRef.current.send(JSON.stringify({ type: 'text', text }));
      setState('THINKING');
    }
  };

  const interruptSession = () => {
    stopAudioPlayback();
    setState('INTERRUPTED');
    addLog({ type: 'user', message: 'User interrupted the session.' });
    if (wsRef.current) {
      // We can send a custom interrupt message or just let Gemini handle the voice overlap
      // For now, we just log it. Gemini Live handles voice interruption natively if we keep streaming audio.
    }
  };

  const startAudioCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      
      processor.onaudioprocess = (e) => {
        const currentState = useAppStore.getState().state;
        if (wsRef.current?.readyState === WebSocket.OPEN && currentState !== 'IDLE') {
          const inputData = e.inputBuffer.getChannelData(0);
          // Convert Float32Array to Int16Array (PCM 16-bit)
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }
          // Convert to base64
          const buffer = new Uint8Array(pcmData.buffer);
          let binary = '';
          for (let i = 0; i < buffer.byteLength; i++) {
            binary += String.fromCharCode(buffer[i]);
          }
          const base64 = btoa(binary);
          wsRef.current.send(JSON.stringify({ type: 'audio', data: base64 }));
        }
      };
      
      source.connect(processor);
      processor.connect(audioContext.destination);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      addLog({ type: 'system', message: 'Microphone unavailable — text-only mode. Use the input bar above to chat.' });
    }
  };

  const startScreenCapture = () => {
    captureIntervalRef.current = window.setInterval(async () => {
      const workspaceEl = (window as any).workspaceRef;
      if (workspaceEl && wsRef.current?.readyState === WebSocket.OPEN && useAppStore.getState().state !== 'IDLE') {
        try {
          const dataUrl = await domToJpeg(workspaceEl, {
            quality: 0.5,
            scale: 0.5,
          });
          const base64 = dataUrl.split(',')[1];
          wsRef.current.send(JSON.stringify({ type: 'image', data: base64 }));
        } catch (err) {
          console.error('Screen capture error:', err);
        }
      }
    }, 2000); // Capture every 2 seconds to save bandwidth
  };

  const playAudio = async (base64Data: string) => {
    try {
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // The data is raw PCM 16-bit 24kHz (Gemini default output rate)
      // We need to decode it. A simple way is to create an AudioBuffer.
      if (!playbackContextRef.current) {
        playbackContextRef.current = new AudioContext({ sampleRate: 24000 });
      }
      
      const audioCtx = playbackContextRef.current;
      const int16Array = new Int16Array(bytes.buffer);
      const audioBuffer = audioCtx.createBuffer(1, int16Array.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      
      for (let i = 0; i < int16Array.length; i++) {
        channelData[i] = int16Array[i] / 32768.0;
      }
      
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      
      activeAudioNodesRef.current.push(source);
      source.onended = () => {
        activeAudioNodesRef.current = activeAudioNodesRef.current.filter(n => n !== source);
      };
      
      source.start();
    } catch (err) {
      console.error('Error playing audio:', err);
    }
  };

  const handleToolCall = async (toolCall: any) => {
    setState('ACTING');
    const responses: any[] = [];
    
    for (const call of toolCall.functionCalls) {
      const { name, args, id } = call;
      const friendlyNames: Record<string, string> = {
        navigate_view: 'Navigating workspace',
        draft_content: 'Drafting content',
        request_approval: 'Requesting approval',
        update_plan: 'Updating plan',
        save_workflow: 'Saving workflow',
      };
      addLog({ type: 'action', message: friendlyNames[name] || `Running: ${name}`, details: args });
      
      let result = { status: 'success' };
      
      if (name === 'navigate_view' || name === 'draft_content') {
        addActionToSession({ name, args });
      }

      if (name === 'navigate_view') {
        setCurrentView(args.view);
        addActivity({ type: 'navigate', title: `Opened ${args.view}`, data: { view: args.view } });
      } else if (name === 'draft_content') {
        addDraft({ target: args.target, content: args.content });
        addActivity({ type: 'draft', title: `Draft to ${args.target}`, data: { target: args.target, content: args.content } });
      } else if (name === 'request_approval') {
        setState('PAUSED_FOR_APPROVAL');
        setPendingApproval(args);
        
        // Wait for user response
        const approved = await new Promise<boolean>((resolve) => {
          (window as any).handleApprovalResponse = (res: boolean) => {
            setPendingApproval(null);
            resolve(res);
          };
        });
        
        result = { status: approved ? 'approved' : 'denied' };
        addLog({ type: 'approval', message: `Approval ${approved ? 'granted' : 'denied'}` });
        setState('ACTING');
      } else if (name === 'update_plan') {
        // Normalize Gemini's step data — it may send various shapes
        const rawSteps = args.steps || args.plan || [];
        const normalized = rawSteps.map((s: any, i: number) => ({
          id: s.id || String(i + 1),
          label: s.label || s.description || s.text || s.name || s.step || `Step ${i + 1}`,
          status: s.status || 'pending'
        }));
        setPlan(normalized);
        addLog({ type: 'system', message: `Plan updated (${normalized.length} steps)` });
      } else if (name === 'save_workflow') {
        const newWorkflow = {
          id: Math.random().toString(36).substring(7),
          name: args.workflow_name,
          description: 'Saved from live session',
          lastRun: new Date().toISOString(),
          steps: currentSessionActions
        };
        addWorkflow(newWorkflow);
        addLog({ type: 'workflow', message: `Workflow saved: ${args.workflow_name}` });
        
        // Save to Firestore
        try {
          const { db, auth } = await import('./firebase');
          const { doc, setDoc } = await import('firebase/firestore');
          if (auth.currentUser) {
            await setDoc(doc(db, 'workflows', newWorkflow.id), {
              name: newWorkflow.name,
              description: newWorkflow.description,
              lastRun: newWorkflow.lastRun,
              authorUid: auth.currentUser.uid,
              steps: newWorkflow.steps
            });
          }
        } catch (error) {
          const { auth } = await import('./firebase');
          const errInfo = {
            error: error instanceof Error ? error.message : String(error),
            operationType: 'write',
            path: `workflows/${newWorkflow.id}`,
            authInfo: {
              userId: auth.currentUser?.uid,
              email: auth.currentUser?.email,
              emailVerified: auth.currentUser?.emailVerified,
              isAnonymous: auth.currentUser?.isAnonymous,
              tenantId: auth.currentUser?.tenantId,
              providerInfo: auth.currentUser?.providerData.map(provider => ({
                providerId: provider.providerId,
                displayName: provider.displayName,
                email: provider.email,
                photoUrl: provider.photoURL
              })) || []
            }
          };
          console.error('Firestore Error: ', JSON.stringify(errInfo));
          throw new Error(JSON.stringify(errInfo));
        }
      }
      
      responses.push({
        id,
        name,
        response: result
      });
    }
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'toolResponse', functionResponses: responses }));
    }
    setState('LISTENING');
  };

  const executeWorkflow = async (workflow: any) => {
    setState('ACTING');
    addLog({ type: 'system', message: `Starting workflow: ${workflow.name}` });

    for (const step of workflow.steps || []) {
      addLog({ type: 'action', message: `Replaying: ${step.name}`, details: step.args });
      if (step.name === 'navigate_view') {
        setCurrentView(step.args.view);
      } else if (step.name === 'draft_content') {
        addDraft({ target: step.args.target, content: step.args.content });
      }
      // Wait a bit for visual effect
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    setState('IDLE');
    addLog({ type: 'system', message: `Workflow completed.` });
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 overflow-hidden font-sans">
      <Header onStart={startSession} onStop={stopSession} onInterrupt={interruptSession} onSendText={sendText} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar onPlayWorkflow={executeWorkflow} />
        <Workspace />
        <LogPanel collapsed={logCollapsed} onToggle={() => setLogCollapsed(!logCollapsed)} />
      </div>

      {/* Access Code Prompt Modal */}
      {showCodePrompt && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-white mb-1">Enter Access Code</h3>
            <p className="text-sm text-slate-400 mb-5">This demo requires an access code. Judges: check your submission notes.</p>
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCodeSubmit()}
              placeholder="Enter code..."
              autoFocus
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 mb-3"
            />
            {codeError && <p className="text-red-400 text-xs mb-3">{codeError}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => { setShowCodePrompt(false); setCodeError(''); setCodeInput(''); }}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCodeSubmit}
                disabled={!codeInput.trim()}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 transition-colors"
              >
                Verify & Start
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

