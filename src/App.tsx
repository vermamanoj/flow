/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
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
    currentSessionActions, addActionToSession, clearSessionActions
  } = useAppStore();
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const captureIntervalRef = useRef<number | null>(null);
  const activeAudioNodesRef = useRef<AudioBufferSourceNode[]>([]);

  const stopAudioPlayback = () => {
    activeAudioNodesRef.current.forEach(node => {
      try { node.stop(); } catch (e) {}
    });
    activeAudioNodesRef.current = [];
  };

  const startSession = async () => {
    clearSessionActions();
    setState('LISTENING');
    addLog({ type: 'system', message: 'Starting voice session...' });

    // 1. Connect WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
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
        addLog({ type: 'action', message: `Desktop: ${data.name}`, details: data.args });
      } else if (data.type === 'debug') {
        console.log('DEBUG:', data.message);
      } else if (data.type === 'error') {
        addLog({ type: 'system', message: `Error: ${data.error}` });
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
      wsRef.current.send(JSON.stringify({ type: 'stop' }));
      wsRef.current.close();
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
    }
    if (captureIntervalRef.current) {
      window.clearInterval(captureIntervalRef.current);
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
      addLog({ type: 'system', message: 'Failed to access microphone.' });
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
      if (!audioContextRef.current) return;
      
      const audioCtx = audioContextRef.current;
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
      addLog({ type: 'action', message: `Executing tool: ${name}`, details: args });
      
      let result = { status: 'success' };
      
      if (name === 'navigate_view' || name === 'draft_content') {
        addActionToSession({ name, args });
      }

      if (name === 'navigate_view') {
        setCurrentView(args.view);
      } else if (name === 'draft_content') {
        addDraft({ target: args.target, content: args.content });
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
        setPlan(args.steps);
        addLog({ type: 'system', message: 'Updated plan.' });
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
    <div className="h-screen w-screen flex flex-col bg-gray-100 overflow-hidden font-sans">
      <Header onStart={startSession} onStop={stopSession} onInterrupt={interruptSession} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar onPlayWorkflow={executeWorkflow} />
        <Workspace />
        <LogPanel />
      </div>
    </div>
  );
}

