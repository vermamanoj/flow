import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { User, Bot, Activity, CheckCircle, AlertTriangle, Save, Terminal, Mic, PanelRightOpen, PanelRightClose } from 'lucide-react';

interface LogPanelProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const LogPanel: React.FC<LogPanelProps> = ({ collapsed, onToggle }) => {
  const { logs } = useAppStore();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'user': return <User size={14} className="text-blue-400" />;
      case 'agent': return <Bot size={14} className="text-violet-400" />;
      case 'system': return <Activity size={14} className="text-slate-500" />;
      case 'action': return <Terminal size={14} className="text-emerald-400" />;
      case 'approval': return <AlertTriangle size={14} className="text-red-400" />;
      case 'workflow': return <Save size={14} className="text-teal-400" />;
      default: return <Activity size={14} className="text-slate-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'user': return 'text-blue-400';
      case 'agent': return 'text-violet-400';
      case 'system': return 'text-slate-500';
      case 'action': return 'text-emerald-400';
      case 'approval': return 'text-red-400';
      case 'workflow': return 'text-teal-400';
      default: return 'text-slate-500';
    }
  };

  // Collapsed: just a thin vertical bar with toggle
  if (collapsed) {
    return (
      <aside className="w-10 bg-slate-900 flex flex-col items-center h-full shrink-0 border-l border-slate-800">
        <button onClick={onToggle} className="mt-3 p-1.5 text-slate-500 hover:text-slate-300 transition-colors" title="Open Execution Log">
          <PanelRightOpen size={16} />
        </button>
        <div className="mt-2 -rotate-90 whitespace-nowrap text-[9px] uppercase tracking-widest text-slate-600 font-semibold origin-center translate-y-12">
          Log ({logs.length})
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 bg-slate-900 flex flex-col h-full shrink-0 border-l border-slate-800">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Activity size={14} />
          Execution Log
        </h2>
        <button onClick={onToggle} className="p-1 text-slate-500 hover:text-slate-300 transition-colors" title="Collapse">
          <PanelRightClose size={14} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-xs">
        {logs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <Mic size={20} className="text-slate-600" />
            </div>
            <p className="text-center text-[11px] leading-relaxed">
              Start a session to see the execution log here. Every tool call, response, and action will be tracked.
            </p>
          </div>
        )}
        {logs.map(log => (
          <div key={log.id} className="flex gap-2.5 items-start py-1.5 px-2 rounded-lg hover:bg-slate-800/50 transition-colors">
            <div className="mt-0.5 shrink-0">
              {getIcon(log.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className={`font-semibold capitalize text-[10px] ${getTypeColor(log.type)}`}>{log.type}</span>
                <span className="text-[9px] text-slate-600 tabular-nums">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-slate-400 break-words text-[11px] leading-relaxed">{log.message}</p>
              {log.details && (
                <pre className="mt-1.5 text-[9px] bg-slate-950 p-2 rounded border border-slate-800 overflow-x-auto text-slate-500">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </aside>
  );
};
