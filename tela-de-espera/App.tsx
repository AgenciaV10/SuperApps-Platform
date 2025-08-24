import React, { useState, useEffect } from 'react';
import { STEPS } from './constants';

// --- ICONS ---

const CheckIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2.5}
    stroke="currentColor"
    className={`${className} text-emerald-400`}
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const CurrentStepIcon = () => (
    <div className="w-5 h-5 flex items-center justify-center" aria-hidden="true">
      <div className="w-2.5 h-2.5 rounded-full bg-sky-400 ring-4 ring-sky-400/20"></div>
    </div>
);

const PendingStepIcon = () => (
    <div className="w-5 h-5 flex items-center justify-center" aria-hidden="true">
      <div className="w-2.5 h-2.5 rounded-full border-2 border-slate-700"></div>
    </div>
);

const ActivitySpinner = () => (
  <svg className="w-24 h-24 text-slate-500/20 animate-spin" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="40" stroke="url(#spinner-gradient)" strokeWidth="10" strokeLinecap="round"/>
    <defs>
      <linearGradient id="spinner-gradient" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
      </linearGradient>
    </defs>
  </svg>
);

const SuccessSpinner = () => (
    <svg className="w-24 h-24 text-slate-500/20 animate-spin" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="40" stroke="url(#spinner-gradient-success)" strokeWidth="10" strokeLinecap="round"/>
      <defs>
        <linearGradient id="spinner-gradient-success" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
);


// --- COMPONENTS ---

function Logo() {
  return (
    <div className="absolute top-8 left-1/2 -translate-x-1/2">
      <h1 className="text-xl font-bold text-slate-200 tracking-wider">
        Super Apps
      </h1>
    </div>
  );
}

function StepsList({ currentStepIndex }: { currentStepIndex: number }) {
  return (
    <div className="w-full max-w-sm mt-12 text-center">
      <ul className="space-y-4 inline-block text-left">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          
          let textStyles = "text-slate-500";
          if(isCurrent) textStyles = "text-slate-200 font-semibold";
          if(isCompleted) textStyles = "text-slate-400 line-through opacity-60";

          return (
            <li key={step.title} className="flex items-center gap-4 text-sm transition-all duration-500" aria-current={isCurrent ? 'step' : 'false'}>
              <div>
                {isCompleted ? <CheckIcon /> : isCurrent ? <CurrentStepIcon /> : <PendingStepIcon />}
              </div>
              <span className={textStyles}>
                {step.title}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function App() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [subtaskIndex, setSubtaskIndex] = useState(0);
  
  const isMonitoring = currentStepIndex === STEPS.length - 1;

  // Step progression simulation
  useEffect(() => {
    if (currentStepIndex >= STEPS.length - 1) return; // Stop progressing at the last step

    const currentStep = STEPS[currentStepIndex];
    const timeout = setTimeout(() => {
      setCurrentStepIndex(prev => prev + 1);
      setSubtaskIndex(0); // Reset subtask for the new step
    }, currentStep.duration);

    return () => clearTimeout(timeout);
  }, [currentStepIndex]);

  // Sub-task cycling simulation
  useEffect(() => {
    const currentStep = STEPS[currentStepIndex];
    if (!currentStep || currentStep.subtasks.length <= 1) return;

    const interval = setInterval(() => {
      setSubtaskIndex(prev => (prev + 1) % currentStep.subtasks.length);
    }, isMonitoring ? 3750 : 2250); // Slower cycle for monitoring state

    return () => clearInterval(interval);
  }, [currentStepIndex, isMonitoring]);
  
  const currentStep = STEPS[currentStepIndex];
  const currentSubtask = (currentStep && currentStep.subtasks[subtaskIndex]) || "";

  return (
    <main className="min-h-screen text-slate-100 font-['Inter'] relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 animated-bg" style={{
        backgroundImage: 'radial-gradient(at 27% 37%, hsla(215, 98%, 61%, 0.1) 0px, transparent 50%), radial-gradient(at 76% 2%, hsla(289, 98%, 61%, 0.1) 0px, transparent 50%), radial-gradient(at 97% 96%, hsla(355, 98%, 61%, 0.1) 0px, transparent 50%)'
      }} />
      
      <Logo />

      <div className="mx-auto flex min-h-screen flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-24 h-24 flex items-center justify-center">
              {isMonitoring ? <SuccessSpinner /> : <ActivitySpinner />}
            </div>
             <div className="h-20 mt-4 flex flex-col justify-center" aria-live="polite">
                <h2 className="text-2xl font-bold text-slate-100 transition-opacity duration-300" key={`step-${currentStepIndex}`}>
                  {currentStep.title}
                </h2>
                {isMonitoring && (
                    <p className="text-emerald-400 text-sm mt-2 animate-pulse">
                        Sistema online e operacional.
                    </p>
                )}
            </div>
             <div className="h-6 w-full max-w-sm">
                <p className="text-slate-400 text-sm transition-opacity duration-300" key={`subtask-${currentStepIndex}-${subtaskIndex}`}>
                    {currentSubtask}
                </p>
             </div>
        </div>
        
        <StepsList currentStepIndex={currentStepIndex} />
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 text-sm">
        <button
            type="button"
            className="text-slate-500 hover:text-slate-300 transition-colors"
        >
            Cancelar
        </button>
        <button
            type="button"
            className="text-slate-500 hover:text-slate-300 transition-colors"
        >
            Precisa de ajuda?
        </button>
      </div>
    </main>
  );
}