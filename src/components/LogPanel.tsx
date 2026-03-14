import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { User, Bot, Activity, CheckCircle, AlertTriangle, Save } from 'lucide-react';

export const LogPanel: React.FC = () => {
  const { logs } = useAppStore();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'user': return <User size={16} className="text-blue-500" />;
      case 'agent': return <Bot size={16} className="text-purple-500" />;
      case 'system': return <Activity size={16} className="text-gray-500" />;
      case 'action': return <CheckCircle size={16} className="text-green-500" />;
      case 'approval': return <AlertTriangle size={16} className="text-red-500" />;
      case 'workflow': return <Save size={16} className="text-teal-500" />;
      default: return <Activity size={16} className="text-gray-500" />;
    }
  };

  return (
    <aside className="w-80 border-l border-gray-200 bg-white flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
          <Activity size={16} />
          Execution Log
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
        {logs.map(log => (
          <div key={log.id} className="flex gap-3 items-start">
            <div className="mt-0.5 shrink-0 bg-gray-50 p-1.5 rounded-full border border-gray-100">
              {getIcon(log.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-700 capitalize">{log.type}</span>
                <span className="text-[10px] text-gray-400">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-gray-600 break-words">{log.message}</p>
              {log.details && (
                <pre className="mt-2 text-[10px] bg-gray-50 p-2 rounded border border-gray-100 overflow-x-auto text-gray-500">
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
