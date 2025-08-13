
import React, { useState, useEffect } from 'react';
import { STEPS } from './constants';

const LoadingPreview: React.FC<{
  appName?: string;
  progress: number;
}> = ({ appName = 'Super Apps', progress }) => {
  // Configuração da animação da lista - mais espaço entre os itens
  const itemHeight = 64; // Aumentado de 42 para 64
  const loopedSteps = [...STEPS, ...STEPS];

  return (
    <div className="w-full max-w-md md:max-w-lg lg:max-w-2xl">
      {/* Título + Progresso */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-lg md:text-xl lg:text-2xl font-medium">Dando vida ao seu aplicativo</p>
        <span className="text-sm md:text-base text-white/70">{Math.round(progress)}%</span>
      </div>

      {/* Barra de Progresso com borda */}
      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mb-8 border border-white/10" aria-hidden="true">
        <div
          className="h-full bg-white/70"
          style={{ width: `${progress}%`, transition: 'width 100ms linear' }}
        />
      </div>

      {/* Lista de rolagem com efeito de fade */}
      <div
        className="overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]"
        style={{ height: `${itemHeight * 3}px` }} // Mostra 3 itens na viewport
        aria-live="polite"
      >
        <div
          className="w-full animate-scroll-vertical"
        >
          {loopedSteps.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-4 py-2 text-white/85" // Aumentado o gap
              style={{ height: `${itemHeight}px` }}
            >
              <span className="text-white/60" aria-hidden="true">{item.icon}</span>
              <span className="text-sm md:text-base leading-tight"> {/* Tamanho do texto aumentado */}
                {item.text.replace('{appName}', appName)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


// Componente principal do App gerencia estado e layout
const TYPING_SPEED = 150; // Velocidade de digitação em ms - Deixando mais lento
const PAUSE_AFTER_TYPING = 3000; // Pausa após digitar em ms - Deixando mais lento

export default function App() {
    const appName = 'Super Apps';
    const [index, setIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [typedText, setTypedText] = useState('');

    // Efeito principal para animação de digitação e avanço para o próximo passo
    useEffect(() => {
        const fullText = STEPS[index].text.replace('{appName}', appName);
        let nextStepTimeout: number | undefined;

        // Reseta o texto quando o passo muda
        setTypedText('');

        const typingInterval = setInterval(() => {
            setTypedText(currentTypedText => {
                // Se o texto já estiver completo, limpa o intervalo e agenda o próximo passo
                if (currentTypedText.length === fullText.length) {
                    clearInterval(typingInterval);
                    nextStepTimeout = window.setTimeout(() => {
                        setIndex(i => (i + 1) % STEPS.length);
                    }, PAUSE_AFTER_TYPING);
                    return currentTypedText;
                }
                // Adiciona o próximo caractere
                return fullText.substring(0, currentTypedText.length + 1);
            });
        }, TYPING_SPEED);

        // Função de limpeza para limpar os timers quando o componente desmontar ou o efeito rodar novamente
        return () => {
            clearInterval(typingInterval);
            if (nextStepTimeout) {
                clearTimeout(nextStepTimeout);
            }
        };
    }, [index, appName]);

    // Efeito para a barra de progresso com pausas estratégicas
    useEffect(() => {
        const BASE_DURATION = 30000; // Duração base mais lenta: 30 segundos
        const intervalTime = 50; // ms
        const increment = (100 / BASE_DURATION) * intervalTime;

        // Pausas estratégicas com mais pontos e maior duração (30% mais longas)
        const pausePoints = [
            { at: 15, for: 26, triggered: false }, // Pausa por ~1300ms
            { at: 35, for: 21, triggered: false }, // Pausa por ~1050ms
            { at: 60, for: 39, triggered: false }, // Pausa por ~1950ms
            { at: 85, for: 31, triggered: false }, // Pausa por ~1550ms -> agora ~4650ms
            { at: 95, for: 21, triggered: false }, // Pausa por ~1050ms -> agora ~3150ms
        ];
        let pauseCounter = 0;

        const progressInterval = setInterval(() => {
            // Se estivermos em uma pausa, decremente o contador e não atualize o progresso
            if (pauseCounter > 0) {
                pauseCounter--;
                return;
            }

            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    return 100;
                }
                
                const newProgress = prev + increment;

                // Verifica se é hora de uma pausa estratégica
                for (const pause of pausePoints) {
                    if (!pause.triggered && newProgress >= pause.at) {
                        pause.triggered = true; // Marca como acionada para não repetir
                        
                        // Triplica a duração da pausa se o progresso for maior que 60%
                        if (pause.at > 60) {
                            pauseCounter = pause.for * 3;
                        } else {
                            pauseCounter = pause.for;
                        }

                        break; // Aciona apenas uma pausa por vez
                    }
                }

                return newProgress > 100 ? 100 : newProgress;
            });
        }, intervalTime);

        return () => clearInterval(progressInterval);
    }, []); // Executa apenas uma vez ao montar

  return (
    // Contêiner de layout principal: coluna flexível, espaço entre o conteúdo e o rodapé
    <main className="min-h-screen w-full bg-gray-950 text-gray-100 flex flex-col items-center justify-between p-6 sm:p-8 lg:p-12 font-sans">
      
      {/* Contêiner de conteúdo superior */}
      <div className="w-full flex flex-col items-center gap-8 pt-10 sm:pt-16">
        {/* Branding */}
        <div className="flex flex-col items-center gap-3">
            <p className="text-lg md:text-xl lg:text-2xl text-white/70 font-medium">Construindo com</p>
            <img src="https://mepresenteia.com/wp-content/uploads/2025/08/logo-2.png" alt="Logo Super Apps" className="h-8 md:h-10 lg:h-12" />
        </div>
        
        <LoadingPreview progress={progress} appName={appName} />
      </div>

      {/* Rodapé com o próximo passo - altura fixa para evitar pulos de layout */}
      <div className="h-16 md:h-20 flex items-center justify-center text-center text-lg md:text-xl lg:text-2xl pb-4 bg-gradient-to-r from-[#FF7C3F] via-[#FF4C7D] to-[#A24CFF] bg-clip-text text-transparent animate-gradient-scroll hover:brightness-110 font-medium">
        <p>
          Próximo passo: "{typedText}
          <span className="animate-blink relative -left-1">|</span>"
        </p>
      </div>
    </main>
  );
}
