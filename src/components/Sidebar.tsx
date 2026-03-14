import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Play, Clock, Save, LogIn } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';

export const Sidebar: React.FC = () => {
  const { workflows, setWorkflows } = useAppStore();
  const [user, setUser] = useState(auth.currentUser);

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
    <aside className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
          <Save size={16} />
          Saved Workflows
        </h2>
        {!user && (
          <button onClick={handleLogin} className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            <LogIn size={14} /> Login
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {workflows.map(wf => (
          <div key={wf.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group">
            <h3 className="font-semibold text-gray-900 mb-1">{wf.name}</h3>
            <p className="text-xs text-gray-500 mb-3 line-clamp-2">{wf.description}</p>
            
            <div className="flex items-center justify-between mt-auto">
              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                <Clock size={12} />
                {new Date(wf.lastRun).toLocaleDateString()}
              </span>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-50 text-indigo-600 hover:bg-indigo-100 p-1.5 rounded-full">
                <Play size={14} />
              </button>
            </div>
          </div>
        ))}
        
        {workflows.length === 0 && (
          <div className="text-center text-sm text-gray-400 py-8">
            {user ? "No workflows saved yet." : "Login to save workflows."}
          </div>
        )}
      </div>
    </aside>
  );
};
