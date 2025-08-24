import React, { useEffect, useState } from 'react';

// Icons (SVG inline to avoid external deps)
const MessageChatbotIcon = () => (
	<svg className="w-5 h-5 md:w-6 lg:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><circle cx="9" cy="10" r="1"/><circle cx="15" cy="10" r="1"/></svg>
);
const TargetIcon = () => (
	<svg className="w-5 h-5 md:w-6 lg:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
);
const PhotoIcon = () => (
	<svg className="w-5 h-5 md:w-6 lg:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
);
const DatabaseIcon = () => (
	<svg className="w-5 h-5 md:w-6 lg:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 3 4 3 9 3s9 0 9-3V5"/><path d="M3 12c0 3 4 3 9 3s9 0 9-3"/></svg>
);
const GithubIcon = () => (
	<svg className="w-5 h-5 md:w-6 lg:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
);
const PaletteIcon = () => (
	<svg className="w-5 h-5 md:w-6 lg:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125s.148-.836.438-1.125c.29-.289.438-.652.438-1.125s-.148-.836-.438-1.125c-.29-.289-.438-.652-.438-1.125s.148-.836.438-1.125c.29-.289.438-.652.438-1.125s-.148-.836-.438-1.125C13.648 3.746 12.926 3 12 3c-.926 0-1.648.746-1.648 1.688 0 .437.18.835.437 1.125.29.289.438.652.438 1.125s-.148.836-.438 1.125c-.29-.289-.438-.652-.438 1.125s.148.836.438 1.125c.29.289.438.652.438 1.125s-.148.836-.438 1.125c-.29-.289-.438-.652-.438 1.125s.148.836.438 1.125c.29.289.438.652.438 1.125s-.148.836-.438-1.125c-.29-.289-.438-.652-.438-1.125a1.69 1.69 0 0 1 1.648-1.688z"/></svg>
);
const TypeIcon = () => (
	<svg className="w-5 h-5 md:w-6 lg:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
);
const ZapIcon = () => (
	<svg className="w-5 h-5 md:w-6 lg:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
);
const SearchIcon = () => (
	<svg className="w-5 h-5 md:w-6 lg:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
);
const LightbulbIcon = () => (
	<svg className="w-5 h-5 md:w-6 lg:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 14c2-2 2-6 0-8-2-2-6-2-8 0 0 2 .5 3.5 1.5 4.5L7 14h5z"/><path d="M12 14l.5 4.5.5-4.5h-1z"/></svg>
);
const UsersIcon = () => (
	<svg className="w-5 h-5 md:w-6 lg:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const AwardIcon = () => (
	<svg className="w-5 h-5 md:w-6 lg:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 22 12 17 17 22 15.79 13.88"/></svg>
);
const LayoutIcon = () => (
	<svg className="w-5 h-5 md:w-6 lg:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
);
const MailIcon = () => (
	<svg className="w-5 h-5 md:w-6 lg:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
);
const HelpCircleIcon = () => (
	<svg className="w-5 h-5 md:w-6 lg:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
);
const SpeedometerIcon = () => (
	<svg className="w-5 h-5 md:w-6 lg:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Z"/><path d="m14 14-2.5-4.5"/><path d="M12 6V2"/></svg>
);
const UserCheckIcon = () => (
	<svg className="w-5 h-5 md:w-6 lg:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>
);
const TrendingUpIcon = () => (
	<svg className="w-5 h-5 md:w-6 lg:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
);
const CheckSquareIcon = () => (
	<svg className="w-5 h-5 md:w-6 lg:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
);
const FilmIcon = () => (
	<svg className="w-5 h-5 md:w-6 lg:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>
);
const CheckCircleIcon = () => (
	<svg className="w-5 h-5 md:w-6 lg:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);

const STEPS: { icon: JSX.Element; text: string }[] = [
	{ icon: <TargetIcon />, text: 'Entendendo seu objetivo e o que você quer alcançar.' },
	{ icon: <PaletteIcon />, text: 'Otimizando agora a paleta de cores do seu aplicativo (harmonia e contraste).' },
	{ icon: <TypeIcon />, text: 'Ajustando tipografia para leitura confortável em qualquer tela.' },
	{ icon: <PhotoIcon />, text: 'Criando imagens e ícones exclusivos para a sua identidade.' },
	{ icon: <MessageChatbotIcon />, text: 'Escrevendo mensagens claras e persuasivas para seus botões e chamadas.' },
	{ icon: <ZapIcon />, text: 'Resolvendo problemas de UX: deixando caminhos mais curtos e intuitivos.' },
	{ icon: <SearchIcon />, text: 'Fazendo uma varredura no funcionamento para identificar possíveis travas.' },
	{ icon: <LightbulbIcon />, text: 'Aplicando gatilhos psicológicos (urgência, prova social) de forma elegante.' },
	{ icon: <UsersIcon />, text: 'Estudando seus 5 concorrentes e entendendo as estratégias deles.' },
	{ icon: <AwardIcon />, text: 'Montando uma estratégia melhor para o seu {appName} se destacar.' },
	{ icon: <LayoutIcon />, text: 'Criando a página inicial: herói forte, benefícios e chamada para ação.' },
	{ icon: <MailIcon />, text: 'Criando a página de contato/convite para conversa.' },
	{ icon: <HelpCircleIcon />, text: 'Criando a seção de dúvidas (FAQ) para reduzir objeções.' },
	{ icon: <DatabaseIcon />, text: 'Organizando informações do seu produto/serviço de forma simples.' },
	{ icon: <SpeedometerIcon />, text: 'Deixando tudo mais rápido (carregamento inteligente e imagens otimizadas).' },
	{ icon: <UserCheckIcon />, text: 'Garantindo acessibilidade: app usável por todo mundo.' },
	{ icon: <TrendingUpIcon />, text: 'Revendo textos para aumentar cliques e conversões.' },
	{ icon: <CheckSquareIcon />, text: 'Testando botões, links e formulários para evitar erros.' },
	{ icon: <FilmIcon />, text: 'Polindo microanimações: transições suaves que passam qualidade.' },
	{ icon: <GithubIcon />, text: 'Preparando para publicar com segurança e estabilidade.' },
	{ icon: <CheckCircleIcon />, text: 'Últimos ajustes: visual, velocidade e textos no ponto certo.' },
];

const LoadingPreview: React.FC<{ appName?: string; progress: number }> = ({ appName = 'Super Apps', progress }) => {
	const itemHeight = 64;
	const loopedSteps = [...STEPS, ...STEPS];

	return (
		<div className="w-full max-w-md md:max-w-lg lg:max-w-2xl">
			<div className="flex items-center justify-between mb-3">
				<p className="text-lg md:text-xl lg:text-2xl font-medium">Dando vida ao seu aplicativo</p>
				<span className="text-sm md:text-base text-white/70">{Math.round(progress)}%</span>
			</div>
			<div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mb-8 border border-white/10" aria-hidden="true">
				<div className="h-full bg-white/70" style={{ width: `${progress}%`, transition: 'width 100ms linear' }} />
			</div>
			<div className="overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]" style={{ height: `${itemHeight * 3}px` }} aria-live="polite">
				<div className="w-full animate-scroll-vertical">
					{loopedSteps.map((item, i) => (
						<div key={i} className="flex items-center gap-4 py-2 text-white/85" style={{ height: `${itemHeight}px` }}>
							<span className="text-white/60" aria-hidden="true">{item.icon}</span>
							<span className="text-sm md:text-base leading-tight">{item.text.replace('{appName}', appName)}</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

const TYPING_SPEED = 150;
const PAUSE_AFTER_TYPING = 3000;

export default function BuildWaitingScreen() {
	const appName = 'Super Apps';
	const [index, setIndex] = useState(0);
	const [progress, setProgress] = useState(0);
	const [typedText, setTypedText] = useState('');

	useEffect(() => {
		const fullText = STEPS[index].text.replace('{appName}', appName);
		let nextStepTimeout: number | undefined;
		setTypedText('');
		const typingInterval = setInterval(() => {
			setTypedText((current) => {
				if (current.length === fullText.length) {
					clearInterval(typingInterval);
					nextStepTimeout = window.setTimeout(() => setIndex((i) => (i + 1) % STEPS.length), PAUSE_AFTER_TYPING);
					return current;
				}
				return fullText.substring(0, current.length + 1);
			});
		}, TYPING_SPEED);
		return () => {
			clearInterval(typingInterval);
			if (nextStepTimeout) clearTimeout(nextStepTimeout);
		};
	}, [index, appName]);

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

	return (
		<main className="min-h-full h-full w-full bg-gray-950 text-gray-100 flex flex-col items-center justify-between font-sans
			p-3 sm:p-6 lg:p-12">
			<div className="w-full flex flex-col items-center gap-4 sm:gap-8 pt-4 sm:pt-10 lg:pt-16">
				<div className="flex flex-col items-center gap-2 sm:gap-3">
					<p className="text-sm sm:text-lg lg:text-xl xl:text-2xl text-white/70 font-medium">Construindo com</p>
					<img src="/logo-dark-styled.png" alt="Logo Super Apps" className="h-6 sm:h-8 lg:h-10 xl:h-12" />
				</div>
				<LoadingPreview progress={progress} appName={appName} />
			</div>
			<div className="h-12 sm:h-16 lg:h-20 flex items-center justify-center text-center
				text-sm sm:text-lg lg:text-xl xl:text-2xl pb-2 sm:pb-4
				bg-gradient-to-r from-[#FF7C3F] via-[#FF4C7D] to-[#A24CFF] bg-clip-text text-transparent
				animate-gradient-scroll hover:brightness-110 font-medium">
				<p>
					Próximo passo: "{typedText}
					<span className="animate-blink relative -left-1">|</span>"
				</p>
			</div>
		</main>
	);
}