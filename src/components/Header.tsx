import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Mic, Square, AlertCircle, Play } from 'lucide-react';

export const Header: React.FC<{ onStart: () => void, onStop: () => void, onInterrupt: () => void }> = ({ onStart, onStop, onInterrupt }) => {
  const { state } = useAppStore();

  const getStateColor = () => {
    switch (state) {
      case 'IDLE': return 'bg-gray-200 text-gray-700';
      case 'LISTENING': return 'bg-blue-500 text-white animate-pulse';
      case 'THINKING': return 'bg-purple-500 text-white';
      case 'SPEAKING': return 'bg-green-500 text-white';
      case 'ACTING': return 'bg-orange-500 text-white';
      case 'PAUSED_FOR_APPROVAL': return 'bg-red-500 text-white animate-pulse';
      case 'INTERRUPTED': return 'bg-yellow-500 text-white';
      case 'SAVING_WORKFLOW': return 'bg-teal-500 text-white';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
          Proxi Flow
        </h1>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase ${getStateColor()}`}>
          {state.replace(/_/g, ' ')}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {state === 'IDLE' ? (
          <button 
            onClick={onStart}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Mic size={18} />
            Start Voice Session
          </button>
        ) : (
          <>
            <button 
              onClick={onInterrupt}
              className="flex items-center gap-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <AlertCircle size={18} />
              Interrupt
            </button>
            <button 
              onClick={onStop}
              className="flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Square size={18} />
              Stop
            </button>
          </>
        )}
      </div>
    </header>
  );
};
