export interface Step {
  title: string;
  subtasks: string[];
  duration: number; // average duration in ms
}

export const STEPS: Step[] = [
  {
    title: "Inicializando Módulos",
    subtasks: ["Estabelecendo conexão com servidores...", "Validando integridade do cache...", "Carregando configurações de ambiente..."],
    duration: 6825,
  },
  {
    title: "Sincronizando Dados",
    subtasks: ["Sincronizando perfil de usuário...", "Populando cache de dados local...", "Validando token de sessão..."],
    duration: 8775,
  },
  {
    title: "Construindo Interface",
    subtasks: ["Renderizando componentes da UI...", "Aplicando folha de estilos...", "Pré-carregando assets visuais..."],
    duration: 11700,
  },
  {
    title: "Verificação de Segurança",
    subtasks: ["Estabelecendo handshake TLS...", "Criptografando dados em trânsito...", "Verificando credenciais de acesso..."],
    duration: 7800,
  },
  {
    title: "Finalizando",
    subtasks: ["Limpando processos em segundo plano...", "Compondo o painel principal...", "Executando scripts de inicialização..."],
    duration: 9750,
  },
  {
    title: "Últimos Ajustes",
    subtasks: [
      "Monitorando a saúde do sistema...",
      "Mantendo a conexão ativa...",
      "Sincronização de dados em tempo real...",
    ],
    duration: 99999999, // Effectively infinite
  }
];