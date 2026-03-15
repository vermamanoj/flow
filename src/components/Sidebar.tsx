import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Play, Clock, Save, LogIn, Eye } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { WorkflowVisualizer } from './WorkflowVisualizer';

export const Sidebar: React.FC<{ onPlayWorkflow: (wf: any) => void }> = ({ onPlayWorkflow }) => {
  const { workflows, setWorkflows } = useAppStore();
  const [user, setUser] = useState(auth.currentUser);
  const [viewingWorkflow, setViewingWorkflow] = useState<any | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const q = query(collection(db, 'workflows'), where('authorUid', '==', currentUser.uid));
        const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          const fetchedWorkflows: any[] = [];
          snapshot.forEach((doc) => {
            fetchedWorkflows.push({ id: doc.id, ...doc.data() });
          });
          setWorkflows(fetchedWorkflows);
        }, (error) => {
          const errInfo = {
            error: error instanceof Error ? error.message : String(error),
            operationType: 'list',
            path: 'workflows',
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
        });
        return () => unsubscribeSnapshot();
      } else {
        setWorkflows([]);
      }
    });
    return () => unsubscribeAuth();
  }, [setWorkflows]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <aside className="w-64 bg-slate-950 flex flex-col h-full shrink-0 border-r border-slate-800">
      <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center">
        <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Save size={14} />
          Workflows
        </h2>
        {!user ? (
          <button onClick={handleLogin} className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
            <LogIn size={12} /> Login
          </button>
        ) : (
          <div className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <span className="text-[9px] text-indigo-400 font-bold">{user.displayName?.[0] || user.email?.[0] || '?'}</span>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {workflows.map(wf => (
          <div key={wf.id} className="bg-slate-900 border border-slate-800 rounded-lg p-3 hover:border-slate-700 transition-colors group">
            <h3 className="font-semibold text-slate-200 text-sm mb-1 truncate">{wf.name}</h3>
            <p className="text-[10px] text-slate-500 mb-2 line-clamp-2">{wf.description}</p>
            
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-600 flex items-center gap-1 tabular-nums">
                <Clock size={10} />
                {new Date(wf.lastRun).toLocaleDateString()}
              </span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setViewingWorkflow(wf)} className="text-slate-500 hover:text-slate-300 p-1 rounded transition-colors">
                  <Eye size={12} />
                </button>
                <button onClick={() => onPlayWorkflow(wf)} className="text-indigo-400 hover:text-indigo-300 p-1 rounded transition-colors">
                  <Play size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {workflows.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
              <Save size={16} className="text-slate-700" />
            </div>
            <p className="text-center text-[11px] leading-relaxed">
              {user ? "No workflows saved yet. Complete a task and ask the agent to save it." : "Sign in with Google to save and replay workflows."}
            </p>
          </div>
        )}
      </div>

      {viewingWorkflow && (
        <WorkflowVisualizer workflow={viewingWorkflow} onClose={() => setViewingWorkflow(null)} />
      )}
    </aside>
  );
};
