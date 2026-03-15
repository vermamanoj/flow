import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Mic, Square, Hand, Zap, Ear, Brain, MessageSquare, ShieldAlert, Pause, Save } from 'lucide-react';

export const Header: React.FC<{ onStart: () => void, onStop: () => void, onInterrupt: () => void }> = ({ onStart, onStop, onInterrupt }) => {
  const { state } = useAppStore();

  const getStateMeta = () => {
    switch (state) {
      case 'IDLE': return { color: 'bg-gray-400', ring: '', label: 'Idle', icon: <Pause size={12} /> };
      case 'LISTENING': return { color: 'bg-blue-500', ring: 'ring-2 ring-blue-300 ring-offset-1 animate-pulse', label: 'Listening', icon: <Ear size={12} /> };
      case 'THINKING': return { color: 'bg-violet-500', ring: 'animate-spin-slow', label: 'Thinking', icon: <Brain size={12} /> };
      case 'SPEAKING': return { color: 'bg-emerald-500', ring: 'ring-2 ring-emerald-300 ring-offset-1', label: 'Speaking', icon: <MessageSquare size={12} /> };
      case 'ACTING': return { color: 'bg-amber-500', ring: 'ring-2 ring-amber-300 ring-offset-1 animate-pulse', label: 'Acting', icon: <Zap size={12} /> };
      case 'PAUSED_FOR_APPROVAL': return { color: 'bg-red-500', ring: 'ring-2 ring-red-300 ring-offset-1 animate-pulse', label: 'Awaiting Approval', icon: <ShieldAlert size={12} /> };
      case 'INTERRUPTED': return { color: 'bg-yellow-500', ring: '', label: 'Interrupted', icon: <Hand size={12} /> };
      case 'SAVING_WORKFLOW': return { color: 'bg-teal-500', ring: '', label: 'Saving', icon: <Save size={12} /> };
      default: return { color: 'bg-gray-400', ring: '', label: state, icon: <Pause size={12} /> };
    }
  };

  const meta = getStateMeta();

  return (
    <header className="h-14 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-between px-5 shrink-0 shadow-lg border-b border-white/5">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/30">
            <Zap size={14} className="text-white" />
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">
            Proxi <span className="text-indigo-400">Flow</span>
          </h1>
        </div>
        <div className="h-5 w-px bg-white/10" />
        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
          <div className={`w-2 h-2 rounded-full ${meta.color} ${meta.ring}`} />
          <div className="flex items-center gap-1 text-white/70">
            {meta.icon}
            <span className="text-xs font-medium tracking-wide">{meta.label}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {state === 'IDLE' ? (
          <button 
            onClick={onStart}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white px-5 py-2 rounded-full font-medium transition-all text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-95"
          >
            <Mic size={16} />
            Start Voice Session
          </button>
        ) : (
          <>
            <button 
              onClick={onInterrupt}
              className="flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 px-3.5 py-1.5 rounded-full font-medium transition-all text-xs border border-amber-500/20"
            >
              <Hand size={14} />
              Interrupt
            </button>
            <button 
              onClick={onStop}
              className="flex items-center gap-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-300 px-3.5 py-1.5 rounded-full font-medium transition-all text-xs border border-red-500/20"
            >
              <Square size={14} />
              Stop
            </button>
          </>
        )}
      </div>
    </header>
  );
};
