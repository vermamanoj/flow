import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Mail, FileText, Send, CheckCircle2, Circle, AlertCircle, PlayCircle, StopCircle } from 'lucide-react';

export const Workspace: React.FC = () => {
  const { state, plan, currentView, setCurrentView, drafts, pendingApproval } = useAppStore();
  const workspaceRef = useRef<HTMLDivElement>(null);

  // Expose workspace ref for canvas capture later
  useEffect(() => {
    (window as any).workspaceRef = workspaceRef.current;
  }, []);

  return (
    <main className="flex-1 flex flex-col h-full bg-gray-100 overflow-hidden">
      {/* Current Plan Strip */}
      {state !== 'IDLE' && (
        <div className="bg-white border-b border-gray-200 p-4 shrink-0 shadow-sm z-10">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Current Plan</h3>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {plan.map((step, idx) => (
              <div key={step.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border whitespace-nowrap
                ${step.status === 'active' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium' : 
                  step.status === 'complete' ? 'bg-green-50 border-green-200 text-green-700' : 
                  step.status === 'approval-needed' ? 'bg-red-50 border-red-200 text-red-700 animate-pulse' :
                  'bg-gray-50 border-gray-200 text-gray-500'}`}>
                {step.status === 'complete' ? <CheckCircle2 size={16} /> : 
                 step.status === 'active' ? <PlayCircle size={16} /> :
                 step.status === 'approval-needed' ? <AlertCircle size={16} /> :
                 <Circle size={16} />}
                {idx + 1}. {step.label}
              </div>
            ))}
            {plan.length === 0 && (
              <div className="text-sm text-gray-400 italic">Waiting for plan...</div>
            )}
          </div>
        </div>
      )}

      {/* Demo Workspace Area */}
      <div className="flex-1 p-6 overflow-y-auto" ref={workspaceRef}>
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px] flex flex-col">
          
          {/* Mock App Header */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center gap-6">
            <div className="flex items-center gap-2 text-indigo-600 font-bold">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">M</div>
              MockCRM
            </div>
            <nav className="flex gap-4 ml-8">
              <button 
                onClick={() => setCurrentView('inbox')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${currentView === 'inbox' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <Mail size={16} className="inline mr-2" /> Inbox
              </button>
              <button 
                onClick={() => setCurrentView('notes')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${currentView === 'notes' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <FileText size={16} className="inline mr-2" /> Client Notes
              </button>
              <button 
                onClick={() => setCurrentView('drafts')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${currentView === 'drafts' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <Send size={16} className="inline mr-2" /> Drafts ({drafts.length})
              </button>
            </nav>
          </div>

          {/* Mock App Content */}
          <div className="flex-1 p-6 bg-gray-50/50">
            {currentView === 'inbox' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Client Messages</h2>
                {[
                  { id: 1, sender: 'Alice (Q1 Client)', subject: 'Follow up on March deliverables', date: 'Today, 10:00 AM', unread: true },
                  { id: 2, sender: 'Bob (Q1 Client)', subject: 'Checking in on Q1 progress', date: 'Yesterday, 2:30 PM', unread: true },
                  { id: 3, sender: 'Charlie (Q2 Client)', subject: 'Introductory call notes', date: 'Mar 10', unread: false },
                ].map(msg => (
                  <div key={msg.id} className={`p-4 rounded-xl border ${msg.unread ? 'bg-white border-indigo-100 shadow-sm' : 'bg-gray-50 border-gray-200'} flex gap-4 items-start`}>
                    <div className={`w-2 h-2 mt-2 rounded-full ${msg.unread ? 'bg-indigo-500' : 'bg-transparent'}`} />
                    <div>
                      <h4 className={`font-medium ${msg.unread ? 'text-gray-900' : 'text-gray-600'}`}>{msg.sender}</h4>
                      <p className="text-sm text-gray-800 mt-1">{msg.subject}</p>
                      <span className="text-xs text-gray-400 mt-2 block">{msg.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {currentView === 'drafts' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Pending Drafts</h2>
                {drafts.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">No pending drafts.</div>
                ) : (
                  drafts.map((draft, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                      <div className="text-sm text-gray-500 mb-2">To: <span className="font-medium text-gray-900">{draft.target}</span></div>
                      <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap border border-gray-100">
                        {draft.content}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {currentView === 'notes' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Client Notes</h2>
                <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-200">
                  <h4 className="font-medium text-yellow-800 mb-2">March Action Items</h4>
                  <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                    <li>Send Q1 progress report to Alice</li>
                    <li>Schedule review meeting with Bob</li>
                    <li>Prepare onboarding docs for Charlie</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approval Modal Overlay */}
      {state === 'PAUSED_FOR_APPROVAL' && pendingApproval && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-red-50 p-6 border-b border-red-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-900">Approval Required</h3>
                <p className="text-sm text-red-700 mt-1">Proxi Flow wants to perform a sensitive action.</p>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700 font-medium mb-4">{pendingApproval.action_summary}</p>
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => (window as any).handleApprovalResponse(false)}
                  className="flex-1 py-2.5 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Deny & Edit
                </button>
                <button 
                  onClick={() => (window as any).handleApprovalResponse(true)}
                  className="flex-1 py-2.5 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
                >
                  Approve Action
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
