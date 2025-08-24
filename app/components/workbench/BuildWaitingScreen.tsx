import React, { useState, useEffect } from 'react';

// --- TYPES ---
export interface Step {
  title: string;
  subtasks: string[];
  duration: number; // average duration in ms
}

// --- CONSTANTS ---
export const STEPS: Step[] = [
  {
    title: "Inicializando Módulos",
    subtasks: ["Carregando componentes principais...", "Configurando dependências...", "Preparando ambiente..."],
    duration: 6825,
  },
  {
    title: "Sincronizando Dados",
    subtasks: ["Conectando com servidor...", "Validando informações...", "Atualizando cache..."],
    duration: 8775,
  },
  {
    title: "Construindo Interface",
    subtasks: ["Renderizando componentes...", "Aplicando estilos...", "Otimizando layout..."],
    duration: 11700,
  },
  {
    title: "Verificação de Segurança",
    subtasks: ["Validando permissões...", "Verificando integridade...", "Aplicando proteções..."],
    duration: 7800,
  },
  {
    title: "Finalizando",
    subtasks: ["Aplicando configurações finais...", "Verificando funcionalidades...", "Preparando sistema..."],
    duration: 9750,
  },
  {
    title: "Últimos Ajustes",
    subtasks: [
      "Otimizando performance...",
      "Verificando qualidade final...",
      "Sistema pronto para uso...",
    ],
    duration: 99999999, // Effectively infinite
  }
];

// --- ICONS ---

const CheckIcon = ({ className = "w-4 h-4 sm:w-5 sm:h-5" }: { className?: string }) => (
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
    <div className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center" aria-hidden="true">
      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-sky-400 ring-2 sm:ring-4 ring-sky-400/20"></div>
    </div>
);

const PendingStepIcon = () => (
    <div className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center" aria-hidden="true">
      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border border-slate-700 sm:border-2"></div>
    </div>
);

const ActivitySpinner = () => (
  <svg className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-slate-500/20 animate-spin" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
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
    <svg className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-slate-500/20 animate-spin" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
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



function StepsList({ currentStepIndex }: { currentStepIndex: number }) {
  return (
    <div className="w-full max-w-xs sm:max-w-sm md:max-w-md mt-8 sm:mt-10 md:mt-12 text-center">
      <ul className="space-y-3 sm:space-y-4 inline-block text-left">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          
          let textStyles = "text-slate-500";
          if(isCurrent) textStyles = "text-slate-200 font-semibold";
          if(isCompleted) textStyles = "text-slate-400 line-through opacity-60";

          return (
            <li key={step.title} className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm md:text-base transition-all duration-500" aria-current={isCurrent ? 'step' : 'false'}>
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

export default function BuildWaitingScreen() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [subtaskIndex, setSubtaskIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  
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

  // Progress bar simulation
  useEffect(() => {
    const BASE_DURATION = 30000;
    const intervalTime = 50;
    const increment = (100 / BASE_DURATION) * intervalTime;
    const pausePoints = [
      { at: 15, for: 26, triggered: false },
      { at: 35, for: 21, triggered: false },
      { at: 60, for: 39, triggered: false },
      { at: 85, for: 31, triggered: false },
      { at: 95, for: 21, triggered: false },
    ];
    let pauseCounter = 0;
    const progressInterval = setInterval(() => {
      if (pauseCounter > 0) {
        pauseCounter--;
        return;
      }
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        const newProgress = prev + increment;
        for (const pause of pausePoints) {
          if (!pause.triggered && newProgress >= pause.at) {
            pause.triggered = true;
            pauseCounter = pause.at > 60 ? pause.for * 3 : pause.for;
            break;
          }
        }
        return newProgress > 100 ? 100 : newProgress;
      });
    }, intervalTime);
    return () => clearInterval(progressInterval);
  }, []);
  
  const currentStep = STEPS[currentStepIndex];
  const currentSubtask = (currentStep && currentStep.subtasks[subtaskIndex]) || "";

  return (
    <main className="min-h-full h-full w-full bg-gray-950 text-gray-100 flex flex-col items-center justify-center font-sans p-4 sm:p-6 md:p-8 lg:p-12">
      <div className="pointer-events-none fixed inset-0 -z-10 animated-bg" style={{
        backgroundImage: 'radial-gradient(at 27% 37%, hsla(215, 98%, 61%, 0.1) 0px, transparent 50%), radial-gradient(at 76% 2%, hsla(289, 98%, 61%, 0.1) 0px, transparent 50%), radial-gradient(at 97% 96%, hsla(355, 98%, 61%, 0.1) 0px, transparent 50%)'
      }} />
      
      <div className="mx-auto flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-3 sm:gap-4 md:gap-6 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex items-center justify-center">
              {isMonitoring ? <SuccessSpinner /> : <ActivitySpinner />}
            </div>
             <div className="min-h-[4rem] sm:min-h-[5rem] md:min-h-[6rem] mt-2 sm:mt-3 md:mt-4 flex flex-col justify-center" aria-live="polite">
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-100 transition-opacity duration-300" key={`step-${currentStepIndex}`}>
                  {currentStep.title}
                </h2>
                {isMonitoring && (
                    <p className="text-emerald-400 text-xs sm:text-sm md:text-base mt-1 sm:mt-2 animate-pulse">
                        Sistema online e operacional.
                    </p>
                )}
            </div>
             <div className="min-h-[1.5rem] sm:min-h-[2rem] w-full max-w-xs sm:max-w-sm md:max-w-md">
                <p className="text-slate-400 text-xs sm:text-sm md:text-base transition-opacity duration-300" key={`subtask-${currentStepIndex}-${subtaskIndex}`}>
                    {currentSubtask}
                </p>
             </div>
        </div>
        
        <StepsList currentStepIndex={currentStepIndex} />
      </div>
    </main>
  );
}