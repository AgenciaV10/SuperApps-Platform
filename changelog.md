# CHANGELOG - SuperApps Bolt.diy

## [Unreleased] - 2025-01-XX

### 🎯 **FEATURE: Tela de Espera Personalizada para Construção de Projetos**

#### **Descrição da Funcionalidade**
Implementação de uma tela de espera moderna e amigável para usuários leigos, substituindo a interface técnica de código/terminal durante a geração de projetos. A tela oculta a complexidade técnica enquanto mantém o usuário informado sobre o progresso da construção.

#### **Motivação**
- **Problema**: Usuários leigos se assustavam com a interface técnica mostrando código sendo escrito e comandos de terminal
- **Solução**: Interface visual amigável com barra de progresso, lista animada de etapas e mensagens motivacionais
- **Benefício**: Melhora a experiência do usuário sem comprometer a funcionalidade técnica

---

### 📁 **Arquivos Criados**

#### **1. `app/components/workbench/BuildWaitingScreen.tsx`**
- **Tipo**: Novo componente React
- **Responsabilidade**: Renderiza a tela de espera durante a construção
- **Características**:
  - Barra de progresso animada com pausas estratégicas
  - Lista de etapas de construção com rolagem infinita
  - Mensagem "próximo passo" com efeito de digitação
  - Logo da SuperApps integrada
  - Design responsivo e tema escuro

#### **2. `app/styles/animations.scss`**
- **Tipo**: Estilos CSS globais
- **Responsabilidade**: Animações específicas para a tela de espera
- **Animações adicionadas**:
  - `animate-scroll-vertical`: Rolagem infinita da lista de etapas
  - `animate-gradient-scroll`: Gradiente animado no texto do rodapé
  - `animate-blink`: Cursor piscante para efeito de digitação

---

### 🔧 **Arquivos Modificados**

#### **1. `app/components/workbench/Workbench.client.tsx`**
- **Alteração Principal**: Lógica condicional para exibir tela de espera vs. interface técnica
- **Mudanças Específicas**:

```tsx
// ANTES: EditorPanel sempre visível
<EditorPanel ... />

// DEPOIS: Lógica condicional baseada em hasPreview
{hasPreview ? (
  <EditorPanel ... />
) : (
  <div className="absolute inset-0 flex">
    {/* Terminal invisível para inicialização */}
    <div className="invisible absolute inset-0 pointer-events-none">
      <EditorPanel ... />
    </div>
    {/* Tela de espera visível */}
    <BuildWaitingScreen />
  </div>
)}
```

- **View "Code"**: 
  - Com preview: EditorPanel normal
  - Sem preview: EditorPanel invisível + BuildWaitingScreen
- **View "Diff"**: 
  - Com preview: DiffView normal
  - Sem preview: BuildWaitingScreen
- **View "Preview"**: Sempre Preview (inalterada)

#### **2. `app/styles/animations.scss`**
- **Adições**: 3 novas animações CSS para a tela de espera
- **Compatibilidade**: Não afeta animações existentes

---

### ⚠️ **Problemas Identificados e Corrigidos**

#### **1. Travamento em "Run command npm install"**
- **Causa**: EditorPanel oculto impedia inicialização do terminal
- **Impacto**: ActionRunner falhava com "Shell terminal not found"
- **Solução**: EditorPanel sempre montado (invisível quando necessário)
- **Status**: ✅ Resolvido

#### **2. Terminal não sendo anexado**
- **Causa**: `opacity-0 pointer-events-none` impedia montagem do componente Terminal
- **Impacto**: `attachBoltTerminal` nunca era chamado
- **Solução**: Uso de `invisible` para manter funcionalidade
- **Status**: ✅ Resolvido

#### **3. Logo não carregando**
- **Causa**: URL externa para logo
- **Solução**: Alterado para arquivo local `/logo-dark-styled.png`
- **Status**: ✅ Resolvido

---

### 🔄 **Fluxo de Funcionamento**

#### **Sequência de Execução**
1. **Usuário envia prompt** → Chat processa
2. **Parser detecta artifacts** → `workbenchStore.showWorkbench.set(true)`
3. **Workbench abre** → View "Code" ativa
4. **Terminal é montado** → `attachBoltTerminal` executado
5. **BuildWaitingScreen exibida** → Usuário vê progresso
6. **Actions executam** → Arquivos criados, comandos rodam
7. **Preview detectado** → `hasPreview` torna-se `true`
8. **UI alterna** → EditorPanel/Preview visível
9. **Tela de espera desaparece** → Interface técnica normal

#### **Condições Críticas**
- `hasPreview` deve ser `false` para exibir tela de espera
- `EditorPanel` deve estar sempre montado (mesmo invisível)
- Terminal deve ser inicializado antes de executar actions

---

### 🚨 **Pontos de Atenção**

#### **1. Dependências Críticas**
- **TerminalTabs**: Deve estar sempre funcional para executar comandos
- **ActionRunner**: Depende do terminal anexado para shell actions
- **PreviewsStore**: Responsável por detectar quando preview está pronto

#### **2. Estados de Transição**
- **hasPreview: false → true**: Momento crítico para alternar UI
- **View switching**: Deve preservar estado do terminal
- **Terminal visibility**: Invisível mas funcional

#### **3. Performance**
- **BuildWaitingScreen**: Renderização contínua com animações
- **EditorPanel invisível**: Consome recursos mas necessário
- **Animações CSS**: Podem impactar performance em dispositivos lentos

---

### ⚡ **Possíveis Conflitos**

#### **1. Conflitos de CSS**
- **Animações**: Novas classes podem conflitar com estilos existentes
- **Z-index**: BuildWaitingScreen pode sobrepor outros elementos
- **Responsividade**: Pode quebrar em telas muito pequenas

#### **2. Conflitos de Estado**
- **Terminal state**: Mudanças no estado do terminal podem afetar a tela
- **Preview detection**: Lógica de detecção pode ser sobrescrita
- **Workbench state**: Alterações no workbenchStore podem quebrar a lógica

#### **3. Conflitos de Dependências**
- **React components**: Novos componentes podem conflitar com versões
- **Framer Motion**: Animações podem conflitar com transições existentes
- **CSS modules**: Estilos podem ser sobrescritos por outros módulos

---

### 🧪 **Testes Recomendados**

#### **1. Fluxo Completo**
- [ ] Enviar prompt para gerar projeto
- [ ] Verificar se BuildWaitingScreen aparece
- [ ] Confirmar que terminal é inicializado
- [ ] Verificar execução de comandos npm
- [ ] Confirmar transição para preview
- [ ] Verificar se tela de espera desaparece

#### **2. Estados de Erro**
- [ ] Testar com prompt que falha
- [ ] Verificar comportamento com terminal que falha
- [ ] Testar com preview que não carrega
- [ ] Verificar fallbacks de erro

#### **3. Responsividade**
- [ ] Testar em diferentes tamanhos de tela
- [ ] Verificar em dispositivos móveis
- [ ] Testar com diferentes resoluções

---

### 📋 **Checklist de Deploy**

#### **Pré-deploy**
- [ ] Verificar se `/logo-dark-styled.png` existe em `public/`
- [ ] Confirmar que todas as animações CSS estão funcionando
- [ ] Testar fluxo completo de geração de projeto
- [ ] Verificar logs do terminal para erros

#### **Pós-deploy**
- [ ] Monitorar logs de erro no console
- [ ] Verificar se usuários conseguem gerar projetos
- [ ] Monitorar performance da tela de espera
- [ ] Coletar feedback sobre experiência do usuário

---

### 🔮 **Próximas Melhorias Sugeridas**

#### **1. Personalização**
- **Temas**: Suporte a tema claro/escuro
- **Cores**: Personalização das cores da tela de espera
- **Logos**: Suporte a diferentes logos por projeto

#### **2. Funcionalidades**
- **Estimativa de tempo**: Mostrar tempo estimado para conclusão
- **Etapas personalizadas**: Permitir personalização das mensagens
- **Progresso real**: Conectar com progresso real do build

#### **3. Acessibilidade**
- **Screen readers**: Melhorar suporte para leitores de tela
- **Teclado**: Navegação por teclado
- **Contraste**: Verificar contraste de cores

---

### 📚 **Referências Técnicas**

#### **Arquivos Relacionados**
- `app/lib/runtime/action-runner.ts`: Execução de ações
- `app/lib/stores/workbench.ts`: Estado do workbench
- `app/lib/stores/terminal.ts`: Gerenciamento de terminais
- `app/components/workbench/terminal/TerminalTabs.tsx`: Componente de terminais

#### **Dependências Externas**
- `framer-motion`: Animações de transição
- `nanostores`: Gerenciamento de estado
- `@webcontainer/api`: Container de desenvolvimento

---

### 📝 **Notas de Desenvolvimento**

#### **Decisões Técnicas**
1. **Terminal invisível**: Escolhido para manter funcionalidade sem impacto visual
2. **Animações CSS**: Preferidas sobre JavaScript para performance
3. **Lógica condicional**: Implementada no nível do componente para simplicidade

#### **Alternativas Consideradas**
1. **Iframe para tela de espera**: Rejeitado por complexidade
2. **Estado global para tela**: Rejeitado por acoplamento
3. **Componente wrapper**: Rejeitado por overhead

#### **Lições Aprendidas**
1. **Visibilidade vs. Funcionalidade**: Componentes podem precisar estar montados mesmo invisíveis
2. **Terminal dependency**: Crítico para execução de comandos
3. **Preview detection**: Lógica existente deve ser preservada

---

### 🏷️ **Tags e Versões**

- **Tipo**: Feature
- **Prioridade**: Alta
- **Complexidade**: Média
- **Impacto**: UX/UI
- **Risco**: Baixo (após correções)
- **Testado**: Parcialmente
- **Documentado**: ✅ Sim

---

*Este changelog deve ser atualizado sempre que alterações significativas forem feitas no sistema de tela de espera ou workbench.*
