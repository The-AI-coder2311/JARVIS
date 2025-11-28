import React from 'react';
import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';

export default function TaskProgress({ task }) {
  if (!task || !task.steps || task.steps.length === 0) return null;

  const getStepIcon = (step, index) => {
    if (step.status === 'completed') {
      return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    } else if (step.status === 'in_progress') {
      return <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />;
    } else if (step.status === 'failed') {
      return <XCircle className="w-4 h-4 text-red-400" />;
    }
    return <Circle className="w-4 h-4 text-gray-500" />;
  };

  const completedSteps = task.steps.filter(s => s.status === 'completed').length;
  const progress = (completedSteps / task.steps.length) * 100;

  return (
    <div className="bg-gray-900/80 rounded-lg border border-cyan-500/30 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-mono uppercase text-cyan-400">Task Execution</h4>
        <span className="text-xs font-mono text-gray-400">
          {completedSteps}/{task.steps.length} Steps
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-700 rounded-full mb-4 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-cyan-500 to-green-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {task.steps.map((step, index) => (
          <div 
            key={step.id || index}
            className={`flex items-start gap-3 p-2 rounded-lg transition-all ${
              step.status === 'in_progress' 
                ? 'bg-cyan-500/10 border border-cyan-500/30' 
                : step.status === 'completed'
                  ? 'bg-green-500/5'
                  : 'bg-transparent'
            }`}
          >
            <div className="mt-0.5">
              {getStepIcon(step, index)}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-mono ${
                step.status === 'completed' ? 'text-gray-400' :
                step.status === 'in_progress' ? 'text-cyan-100' :
                'text-gray-500'
              }`}>
                {step.description}
              </p>
              {step.result && step.status === 'completed' && (
                <p className="text-xs text-green-400/80 mt-1 truncate">
                  ✓ {step.result}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {task.status === 'completed' && task.final_result && (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-xs font-mono text-green-400 uppercase mb-1">Task Complete</p>
          <p className="text-sm text-gray-200">{task.final_result}</p>
        </div>
      )}
    </div>
  );
}
