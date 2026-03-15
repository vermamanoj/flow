import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Mail, FileText, Send, CheckCircle2, Circle, AlertCircle, PlayCircle, MessageCircle, Terminal, Zap, Mic, Monitor, ShieldCheck, FolderCog, Eye, Sparkles, ArrowRight, CheckCheck } from 'lucide-react';

export const Workspace: React.FC = () => {
  const { state, plan, logs, currentView, setCurrentView, drafts, pendingApproval, activities } = useAppStore();
  const transcriptRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [waitlistName, setWaitlistName] = useState('');
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [waitlistMsg, setWaitlistMsg] = useState('');

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail.includes('@')) return;
    setWaitlistStatus('submitting');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: waitlistName, email: waitlistEmail })
      });
      const data = await res.json();
      if (data.status === 'success' || data.status === 'already_registered') {
        setWaitlistStatus('success');
        setWaitlistMsg(data.message);
      } else {
        setWaitlistStatus('error');
        setWaitlistMsg(data.error || 'Something went wrong');
      }
    } catch {
      setWaitlistStatus('error');
      setWaitlistMsg('Network error. Please try again.');
    }
  };

  // Expose workspace ref for canvas capture later
  useEffect(() => {
    (window as any).workspaceRef = workspaceRef.current;
  }, []);

  const feedRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript to the end
  // Only show user and agent messages in transcript (not action logs which are noisy)
  const conversationLogs = logs.filter(l => ['user', 'agent'].includes(l.type));
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollLeft = transcriptRef.current.scrollWidth;
    }
  }, [conversationLogs.length]);

  // Auto-scroll activity feed
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [activities.length]);

  return (
    <main className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Conversation Transcript Strip */}
      {conversationLogs.length > 0 && (
        <div className="bg-slate-900 text-slate-100 px-4 py-2.5 shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-1.5">
            <MessageCircle size={12} className="text-slate-500" />
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Live Transcript</span>
          </div>
          <div ref={transcriptRef} className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {conversationLogs.slice(-12).map((log) => (
              <div key={log.id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs whitespace-nowrap shrink-0
                ${log.type === 'user' ? 'bg-blue-900/50 text-blue-200 border border-blue-800' :
                  log.type === 'agent' ? 'bg-emerald-900/50 text-emerald-200 border border-emerald-800' :
                  'bg-amber-900/50 text-amber-200 border border-amber-800'}`}>
                {log.type === 'action' ? <Terminal size={10} /> : 
                 log.type === 'user' ? <span className="font-bold text-[10px]">YOU</span> :
                 <span className="font-bold text-[10px]">AI</span>}
                <span className="max-w-[200px] truncate">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Plan Strip — only show when there are actual plan steps */}
      {plan.length > 0 && (
        <div className="bg-slate-900/80 border-b border-slate-800 px-4 py-3 shrink-0 z-10">
          <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Current Plan</h3>
          <div className="flex flex-col gap-1.5">
            {plan.map((step, idx) => (
              <div key={step.id} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm
                ${step.status === 'active' ? 'bg-indigo-500/15 text-indigo-200 border border-indigo-500/20' : 
                  step.status === 'complete' ? 'bg-emerald-500/10 text-emerald-300' : 
                  step.status === 'approval-needed' ? 'bg-red-500/15 text-red-300 animate-pulse border border-red-500/20' :
                  'text-slate-400'}`}>
                <span className="shrink-0">
                  {step.status === 'complete' ? <CheckCircle2 size={16} className="text-emerald-400" /> : 
                   step.status === 'active' ? <PlayCircle size={16} className="text-indigo-400" /> :
                   step.status === 'approval-needed' ? <AlertCircle size={16} className="text-red-400" /> :
                   <Circle size={16} className="text-slate-600" />}
                </span>
                <span>{idx + 1}. {step.label || 'Processing...'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Landing Hero — shown when IDLE */}
      {state === 'IDLE' && conversationLogs.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
          <div className="max-w-2xl text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Zap size={32} className="text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">
              Welcome to Proxi <span className="text-indigo-400">Flow</span>
            </h2>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              A voice-first AI workspace agent powered by Gemini Live API.<br/>
              Speak naturally or type commands. The agent sees, reasons, and acts.
            </p>

            <div className="grid grid-cols-2 gap-4 text-left mb-8">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Mail size={16} className="text-indigo-400" />
                  <h3 className="text-sm font-semibold text-slate-200">Navigate & Draft</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">Browse inbox, notes, and drafts. Draft emails and manage your workspace with voice or text.</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Monitor size={16} className="text-emerald-400" />
                  <h3 className="text-sm font-semibold text-slate-200">Desktop Control</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">Take screenshots, run shell commands, open URLs, and read files on your real machine.</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck size={16} className="text-amber-400" />
                  <h3 className="text-sm font-semibold text-slate-200">Safe by Design</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">Approval gates for risky actions. Command Guard blocks destructive commands server-side.</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FolderCog size={16} className="text-teal-400" />
                  <h3 className="text-sm font-semibold text-slate-200">Reusable Workflows</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">Save completed task sequences as workflows. Replay them with one click from the sidebar.</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-8">
              <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Try saying or typing</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  'Show me my inbox',
                  'Take a screenshot',
                  'Draft an email to Alice about Q1',
                  'List files in C:\\Users',
                  'Open google.com',
                  'Save this as a workflow',
                ].map((cmd) => (
                  <span key={cmd} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-full text-xs border border-slate-700">
                    "{cmd}"
                  </span>
                ))}
              </div>
            </div>

            {/* Waitlist Section */}
            <div className="bg-gradient-to-br from-indigo-950/50 to-violet-950/50 border border-indigo-500/20 rounded-2xl p-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles size={18} className="text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Interested in Proxi Flow?</h3>
              </div>
              <p className="text-slate-400 text-sm mb-5">Join the waitlist to get early access and updates when we launch.</p>
              
              {waitlistStatus === 'success' ? (
                <div className="flex items-center justify-center gap-2 py-4 text-emerald-400">
                  <CheckCheck size={20} />
                  <span className="font-medium">{waitlistMsg}</span>
                </div>
              ) : (
                <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-2 max-w-lg mx-auto">
                  <input
                    type="text"
                    value={waitlistName}
                    onChange={(e) => setWaitlistName(e.target.value)}
                    placeholder="Your name"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                  <input
                    type="email"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={waitlistStatus === 'submitting' || !waitlistEmail.includes('@')}
                    className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors shrink-0"
                  >
                    {waitlistStatus === 'submitting' ? 'Joining...' : (<>Join Waitlist <ArrowRight size={14} /></>)}
                  </button>
                </form>
              )}
              {waitlistStatus === 'error' && (
                <p className="text-red-400 text-xs mt-2 text-center">{waitlistMsg}</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Live Activity Feed */
        <div className="flex-1 p-6 overflow-y-auto" ref={(el) => { (workspaceRef as any).current = el; (feedRef as any).current = el; }}>
          <div className="max-w-3xl mx-auto space-y-4">
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Eye size={40} className="mb-4 text-slate-600" />
                <p className="text-lg font-medium text-slate-400">Agent is listening...</p>
                <p className="text-sm mt-1">Actions and results will appear here as the agent works.</p>
              </div>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
                  {/* Activity Header */}
                  <div className="px-4 py-2.5 border-b border-slate-800 flex items-center gap-2.5">
                    <span className="shrink-0">
                      {activity.type === 'navigate' ? <Mail size={14} className="text-indigo-400" /> :
                       activity.type === 'screenshot' ? <Monitor size={14} className="text-emerald-400" /> :
                       activity.type === 'file_read' ? <FileText size={14} className="text-amber-400" /> :
                       activity.type === 'file_list' ? <FolderCog size={14} className="text-teal-400" /> :
                       activity.type === 'command' ? <Terminal size={14} className="text-orange-400" /> :
                       activity.type === 'url' ? <ArrowRight size={14} className="text-blue-400" /> :
                       activity.type === 'draft' ? <Send size={14} className="text-violet-400" /> :
                       <Zap size={14} className="text-slate-400" />}
                    </span>
                    <span className="text-sm font-medium text-slate-200">{activity.title}</span>
                    <span className="ml-auto text-[10px] text-slate-600">{new Date(activity.timestamp).toLocaleTimeString()}</span>
                  </div>

                  {/* Activity Content */}
                  <div className="p-4">
                    {/* Navigate View — show MockCRM inline */}
                    {activity.type === 'navigate' && activity.data?.view === 'inbox' && (
                      <div className="space-y-2">
                        {[
                          { sender: 'Alice (Q1 Client)', subject: 'Follow up on March deliverables', date: 'Today, 10:00 AM', unread: true },
                          { sender: 'Bob (Q1 Client)', subject: 'Checking in on Q1 progress', date: 'Yesterday, 2:30 PM', unread: true },
                          { sender: 'Charlie (Q2 Client)', subject: 'Introductory call notes', date: 'Mar 10', unread: false },
                        ].map((msg, i) => (
                          <div key={i} className={`p-3 rounded-lg border ${msg.unread ? 'bg-slate-800 border-indigo-500/20' : 'bg-slate-800/50 border-slate-700'} flex gap-3 items-start`}>
                            <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${msg.unread ? 'bg-indigo-400' : 'bg-transparent'}`} />
                            <div>
                              <h4 className={`text-sm font-medium ${msg.unread ? 'text-slate-100' : 'text-slate-400'}`}>{msg.sender}</h4>
                              <p className="text-xs text-slate-400 mt-0.5">{msg.subject}</p>
                              <span className="text-[10px] text-slate-600 mt-1 block">{msg.date}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {activity.type === 'navigate' && activity.data?.view === 'notes' && (
                      <div className="bg-amber-900/20 p-4 rounded-lg border border-amber-500/20">
                        <h4 className="font-medium text-amber-300 text-sm mb-2">March Action Items</h4>
                        <ul className="list-disc list-inside text-xs text-amber-200/70 space-y-1">
                          <li>Send Q1 progress report to Alice</li>
                          <li>Schedule review meeting with Bob</li>
                          <li>Prepare onboarding docs for Charlie</li>
                        </ul>
                      </div>
                    )}

                    {activity.type === 'navigate' && activity.data?.view === 'drafts' && (
                      <div>
                        {drafts.length === 0 ? (
                          <p className="text-sm text-slate-500 italic">No pending drafts.</p>
                        ) : (
                          <div className="space-y-2">
                            {drafts.map((draft, idx) => (
                              <div key={idx} className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                                <div className="text-xs text-slate-400 mb-1">To: <span className="font-medium text-slate-200">{draft.target}</span></div>
                                <div className="text-xs text-slate-300 whitespace-pre-wrap">{draft.content}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Screenshot */}
                    {activity.type === 'screenshot' && (
                      <div className="flex items-center gap-3">
                        <Monitor size={24} className="text-emerald-500 shrink-0" />
                        <div>
                          <p className="text-sm text-emerald-300">Desktop screenshot captured successfully</p>
                          <p className="text-xs text-slate-500 mt-1">Image sent to Gemini for analysis</p>
                        </div>
                      </div>
                    )}

                    {/* File Read */}
                    {activity.type === 'file_read' && activity.data && (
                      <div>
                        {activity.data.status === 'success' ? (
                          <pre className="bg-slate-950 rounded-lg p-3 text-xs text-slate-300 overflow-x-auto max-h-48 overflow-y-auto border border-slate-800 font-mono">
                            {activity.data.content}
                          </pre>
                        ) : (
                          <p className="text-sm text-red-400">{activity.data.message}</p>
                        )}
                      </div>
                    )}

                    {/* File List */}
                    {activity.type === 'file_list' && activity.data && (
                      <div>
                        {activity.data.status === 'success' ? (
                          <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
                            {(activity.data.entries || []).slice(0, 30).map((f: any, i: number) => (
                              <div key={i} className="flex items-center gap-2 px-2 py-1 text-xs rounded hover:bg-slate-800">
                                {f.type === 'directory' ? <FolderCog size={12} className="text-teal-400 shrink-0" /> : <FileText size={12} className="text-slate-500 shrink-0" />}
                                <span className={`truncate ${f.type === 'directory' ? 'text-teal-300' : 'text-slate-400'}`}>{f.name}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-red-400">{activity.data.message}</p>
                        )}
                        {activity.data.total > 30 && <p className="text-[10px] text-slate-600 mt-2">Showing 30 of {activity.data.total} entries</p>}
                      </div>
                    )}

                    {/* Command Output */}
                    {activity.type === 'command' && activity.data && (
                      <div>
                        {activity.data.status === 'blocked' ? (
                          <div className="flex items-center gap-2 text-red-400 text-sm">
                            <ShieldCheck size={16} />
                            <span>Command blocked by safety guard</span>
                          </div>
                        ) : activity.data.status === 'success' ? (
                          <pre className="bg-slate-950 rounded-lg p-3 text-xs text-green-300/80 overflow-x-auto max-h-48 overflow-y-auto border border-slate-800 font-mono">
                            {activity.data.stdout || '(no output)'}
                          </pre>
                        ) : (
                          <pre className="bg-slate-950 rounded-lg p-3 text-xs text-red-400 overflow-x-auto max-h-32 overflow-y-auto border border-red-900/30 font-mono">
                            {activity.data.message || activity.data.stderr}
                          </pre>
                        )}
                      </div>
                    )}

                    {/* URL Opened */}
                    {activity.type === 'url' && (
                      <p className="text-sm text-blue-300">Browser tab opened</p>
                    )}

                    {/* Draft Content */}
                    {activity.type === 'draft' && activity.data && (
                      <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                        <div className="text-xs text-slate-400 mb-1">To: <span className="font-medium text-slate-200">{activity.data.target}</span></div>
                        <div className="text-xs text-slate-300 whitespace-pre-wrap">{activity.data.content}</div>
                      </div>
                    )}

                    {/* Generic Info */}
                    {activity.type === 'info' && (
                      <p className="text-sm text-slate-400">{activity.data?.message || 'Completed'}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Approval Modal Overlay */}
      {state === 'PAUSED_FOR_APPROVAL' && pendingApproval && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-700">
            <div className="bg-red-500/10 p-6 border-b border-red-500/20 flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center shrink-0">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-300">Approval Required</h3>
                <p className="text-sm text-red-400/70 mt-1">Proxi Flow wants to perform a sensitive action.</p>
              </div>
            </div>
            <div className="p-6">
              <p className="text-slate-200 font-medium mb-4">{pendingApproval.action_summary}</p>
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => (window as any).handleApprovalResponse(false)}
                  className="flex-1 py-2.5 rounded-lg font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
                >
                  Deny & Edit
                </button>
                <button 
                  onClick={() => (window as any).handleApprovalResponse(true)}
                  className="flex-1 py-2.5 rounded-lg font-medium text-white bg-red-600 hover:bg-red-500 transition-colors shadow-sm"
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
