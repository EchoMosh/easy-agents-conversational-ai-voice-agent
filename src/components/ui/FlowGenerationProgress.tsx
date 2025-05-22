import React, { useEffect, useState } from 'react';

interface FlowGenerationProgressProps {
  currentStep: number;
  totalSteps: number;
  message: string;
}

export const FlowGenerationProgress: React.FC<FlowGenerationProgressProps> = ({
  currentStep,
  totalSteps,
  message,
}) => {
  const progressPercentage = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;
  const [animate, setAnimate] = useState(false);
  
  // Add a subtle animation for smoother transitions
  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 10);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className={`fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ease-in-out ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="backdrop-blur-md bg-black/50 dark:bg-neutral-900/80 border border-neutral-800 dark:border-neutral-700 rounded-xl shadow-xl px-6 py-4 flex flex-col items-center">
        {/* Icon and message */}
        <div className="flex items-center space-x-3 mb-3">
          <div className="h-6 w-6 relative">
            <div className="absolute inset-0 bg-blue-500 rounded-full opacity-20 animate-ping" style={{ animationDuration: '2s' }}></div>
            <div className="relative h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-white">{message}</p>
        </div>
        
        {/* Progress bar */}
        <div className="w-full max-w-sm bg-neutral-700/50 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-1.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        
        {/* Steps counter */}
        <div className="text-xs text-neutral-400 mt-2">
          Step {currentStep} of {totalSteps}
        </div>
      </div>
    </div>
  );
};
