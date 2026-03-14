import React from 'react';
import { X, MousePointerClick, Edit3 } from 'lucide-react';

export const WorkflowVisualizer: React.FC<{ workflow: any, onClose: () => void }> = ({ workflow, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-900">{workflow.name}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          <p className="text-sm text-gray-500 mb-6">{workflow.description}</p>

          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
            {workflow.steps?.map((step: any, idx: number) => (
              <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-indigo-100 text-indigo-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  {step.name === 'navigate_view' ? <MousePointerClick size={16} /> : <Edit3 size={16} />}
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-gray-900 text-sm capitalize">{step.name.replace('_', ' ')}</h4>
                  </div>
                  <div className="text-xs text-gray-500">
                    {step.name === 'navigate_view' && `Navigate to ${step.args.view}`}
                    {step.name === 'draft_content' && `Draft email to ${step.args.target}`}
                  </div>
                </div>
              </div>
            ))}
            {(!workflow.steps || workflow.steps.length === 0) && (
              <div className="text-center text-sm text-gray-400 py-4">No steps recorded for this workflow.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
