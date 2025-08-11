## Customizações da Plataforma (SuperApps)

Data: 2025-08-11

### Interface de Chat (ChatBox)
- Atualização visual completa para design moderno/minimalista em `app/components/chat/ChatBox.tsx`.
- Remoção de componentes antigos (`ModelSelector`, `APIKeyManager`) e inclusão de `AgentMenu` e `ModelSettingsMenu`.
- Ajustes de gradientes, wrapper de input e reorganização da action bar; `SendButton` integrado sem regressões.
- Scrollbar personalizada aplicada e refinada em `BaseChat.module.scss`.

### Seletor de Provedor/Modelo (AgentMenu)
- Reescrita com Radix UI nativo, correção de abertura/fechamento de dropdowns e z-index.
- Navegação multi-nível baseada em estado (dentro de um único `DropdownMenu.Content`) para versões de modelos.
- `onSelect` do provedor mantém o dropdown aberto (`preventDefault`) e imediatamente revela as versões.
- Integração com a lista real de modelos do `LLMManager` por provedor; remoção de qualquer truncamento (exibe todos os modelos, sem “+29 modelos”).
- Remoção de duplicidades de funções (`handleModelSelect`/`handleVersionSelect`).

### Menu de Configurações de Modelo (ModelSettingsMenu)
- Reescrita com Radix UI, seções organizadas (ferramentas, cores, etc.).
- Correção de erro de sintaxe em arrow functions que bloqueava o build.

### Autenticação e fluxo do prompt
- Correção do `textarea` que ficava não editável após primeiro login em `AuthenticatedChatBox.tsx` (propagação correta de `preservedPrompt`).
- Botão “Login/Cadastro” agora abre o modal `AuthScreen` diretamente a partir do menu do usuário (sem navegação extra).

### Header (layout, navegação e responsividade)
- Migração do menu lateral para header horizontal fixo em `app/components/header/Header.tsx`.
- Navegação central (“Comunidade”, “Preços”, “Parceria”, “Aprender”) com estados de foco/hover.
- Novo botão “Meus Projetos” via `HeaderMenu.client.tsx`; hover corrigido (contraste no modo claro).
- Ajuste mobile: “Meus Projetos” vira “Projetos”; tamanho da logo proporcional ao restante.
- Menu do usuário com gradiente (`--bolt-elements-gradient-primary`) e contraste corrigido para claro/escuro.
- Aumento da altura do header via `app/styles/variables.scss` (`--header-height: 68px`).
- Seletor de tema modernizado (`ModernThemeSwitch`):
  - Tamanhos reduzidos em mobile.
  - Remoção de textos “Dark/Light”; ícones (lua/sol) dentro do knob, sempre visíveis.

### Perfil do Usuário (dados e edição)
- Novo hook `useUserProfile` agregando dados do `profileStore` + Supabase Auth.
- Novo hook `useHydrateProfile` para hidratar `profileStore` com `user_metadata` (nome/avatar) quando logado.
- `ControlPanel` e `AvatarDropdown` passaram a renderizar dados reais do usuário (evitando “Guest User”).
- `ProfileTab` passou a incluir “Alterar senha” (via `supabase.auth.updateUser({ password })`).

### Plano do Usuário e Billing (menu do usuário)
- Exibição do plano atual no dropdown do usuário (“Free”, “Pro”, “Empresas”), com leitura de `users.plan_id` no Supabase.
- Ações rápidas: links “Gerenciar plano” e “Histórico de pagamentos”.

### Outras correções e melhorias
- Remoção de import duplicado de `ClientOnly` no header.
- Build validado após cada conjunto de alterações.
- Documentado formato `.env` para AWS Bedrock (`AWS_BEDROCK_CONFIG` com `region`, `accessKeyId`, `secretAccessKey`).

### Próximos passos (planejados)
- Página/rota real para “Histórico de pagamentos” e “Gerenciar plano”.
- Menu hambúrguer (opcional) para navegar pelos links centrais no mobile.
- Acessibilidade: estados de foco e navegação por teclado mais consistentes nos dropdowns.
- Otimizações de bundle para reduzir o chunk do header (code-splitting quando oportuno).

### Correções Críticas de Layout (2025-01-27)
- **🔧 Correção do fluxo Chat → Workbench**: Resolvido problema crítico onde as respostas do chat eram exibidas no próprio campo de input ao invés de mostrar a interface de criação do app (Workbench).
- **📱 Estrutura de Container Restaurada**: Adicionado de volta o container wrapper necessário (`relative w-full max-w-chat mx-auto z-prompt`) no ChatBox que havia sido removido durante a reestruturação para o design da Lovable.
- **🔄 Navegação Funcional**: O fluxo normal de criação de projetos foi restaurado:
  1. Usuário envia mensagem → `handleSendMessage`
  2. IA processa e gera artefatos → `useMessageParser`
  3. Parser detecta artefato → `onArtifactOpen`
  4. Define `showWorkbench = true` → `workbenchStore.showWorkbench.set(true)`
  5. BaseChat renderiza Workbench → Interface de criação aparece corretamente
- **✅ Build Validado**: Todas as correções foram testadas e validadas com build bem-sucedido.
- **🎯 Impacto**: Solução restaura completamente a funcionalidade de criação de apps sem afetar o novo design moderno da Lovable implementado.

# 🚀 Release v1.0.0

## What's Changed 🌟

### 🔄 Changes since v0.0.7

### ✨ Features

* restoring project from snapshot on reload ([#444](https://github.com/stackblitz-labs/bolt.diy/pull/444)) by @thecodacus
* add Claude 3.7 Sonnet model as static list and update API key reference ([#1449](https://github.com/stackblitz-labs/bolt.diy/pull/1449)) by @BurhanCantCode
* electron desktop app without express server ([#1136](https://github.com/stackblitz-labs/bolt.diy/pull/1136)) by @Derek-X-Wang
* supabase integration #1542 from xKevIsDev/supabase (1364d4a) by @leex279
* bugfix for : Problem Temporarily Solved, Not Fix: Error building my application #1414 ([#1567](https://github.com/stackblitz-labs/bolt.diy/pull/1567)) by @Stijnus
* bolt dyi datatab ([#1570](https://github.com/stackblitz-labs/bolt.diy/pull/1570)) by @Stijnus
* bolt dyi preview final ([#1569](https://github.com/stackblitz-labs/bolt.diy/pull/1569)) by @Stijnus
* new improvement for the GitHub API Authentication Fix  ([#1537](https://github.com/stackblitz-labs/bolt.diy/pull/1537)) by @Stijnus
* rework Task Manager Real Data ([#1483](https://github.com/stackblitz-labs/bolt.diy/pull/1483)) by @Stijnus
* add Vercel integration for project deployment ([#1559](https://github.com/stackblitz-labs/bolt.diy/pull/1559)) by @xKevIsDev
* bulk delete chats from sidebar ([#1586](https://github.com/stackblitz-labs/bolt.diy/pull/1586)) by @Stijnus
* consolidate sync & export items into an overflow menu ([#1602](https://github.com/stackblitz-labs/bolt.diy/pull/1602)) by @kochrt
* update connectiontab and datatab security fix ([#1614](https://github.com/stackblitz-labs/bolt.diy/pull/1614)) by @Stijnus
* fix for push private repo ([#1618](https://github.com/stackblitz-labs/bolt.diy/pull/1618)) by @Stijnus
* add expo app creation, enhance ui, and refactor code ([#1651](https://github.com/stackblitz-labs/bolt.diy/pull/1651)) by @xKevIsDev
* implement a search functionality to search codebase ([#1676](https://github.com/stackblitz-labs/bolt.diy/pull/1676)) by @xKevIsDev
* lock files ([#1681](https://github.com/stackblitz-labs/bolt.diy/pull/1681)) by @Stijnus
* github fix and ui improvements ([#1685](https://github.com/stackblitz-labs/bolt.diy/pull/1685)) by @Stijnus


### 🐛 Bug Fixes

* handle empty content correctly in FilesStore saveFile() ([#1381](https://github.com/stackblitz-labs/bolt.diy/pull/1381)) by @bizrockman
* OpenAILike api key not showing up ([#1403](https://github.com/stackblitz-labs/bolt.diy/pull/1403)) by @thecodacus
* git connection fix for starter template ([#1411](https://github.com/stackblitz-labs/bolt.diy/pull/1411)) by @thecodacus
* support php language in diff view (b018742) by @xKevIsDev
* added a bunch more common languages to diff view (964e197) by @xKevIsDev
* git clone modal to work with non main as default branch ([#1428](https://github.com/stackblitz-labs/bolt.diy/pull/1428)) by @thecodacus
* git cookies are auto set anytime connects changed or loaded ([#1461](https://github.com/stackblitz-labs/bolt.diy/pull/1461)) by @thecodacus
* fix git proxy to work with other git provider ([#1466](https://github.com/stackblitz-labs/bolt.diy/pull/1466)) by @thecodacus
* attachment not getting sent on first message if starter template is turned on ([#1472](https://github.com/stackblitz-labs/bolt.diy/pull/1472)) by @thecodacus
* settings bugfix error building my application  issue #1414 ([#1436](https://github.com/stackblitz-labs/bolt.diy/pull/1436)) by @Stijnus
* update stream-text.ts ([#1582](https://github.com/stackblitz-labs/bolt.diy/pull/1582)) by @Stijnus
* whitelist vue and svelte files ([#1598](https://github.com/stackblitz-labs/bolt.diy/pull/1598)) by @kochrt
* simplify the SHA-1 hash function in netlify deploy by using the crypto module directly ([#1590](https://github.com/stackblitz-labs/bolt.diy/pull/1590)) by @xKevIsDev
* fix load server build problem by fix dep version ([#1625](https://github.com/stackblitz-labs/bolt.diy/pull/1625)) by @Derek-X-Wang
* optimize file watch paths for preview updates and fix npm crashes ([#1644](https://github.com/stackblitz-labs/bolt.diy/pull/1644)) by @xKevIsDev
* make diff button consistent with other toolbar buttons ([#1601](https://github.com/stackblitz-labs/bolt.diy/pull/1601)) by @kochrt
* invalid line number error in search functionality ([#1682](https://github.com/stackblitz-labs/bolt.diy/pull/1682)) by @Stijnus
* fix icon classes for consistency and clarity #release:major (870828d) by @xKevIsDev
* fix icon classes for consistency and clarity #release:major (6e9a1b6) by @xKevIsDev
* icon classes to existing icons #release:major (e9df523) by @xKevIsDev
* revert back to previous commit (553fa5d) by @xKevIsDev


### 📚 Documentation

* docs README.md changes (Webcontainer liicensing for commercial, other small things) (88901f3) by @leex279


### ♻️ Code Refactoring

* remove success toast and prioritize public domain URL ([#1613](https://github.com/stackblitz-labs/bolt.diy/pull/1613)) by @xKevIsDev
* optimize error handling and npm install performance ([#1688](https://github.com/stackblitz-labs/bolt.diy/pull/1688)) by @xKevIsDev


### ⚙️ CI

* updated target for docker build ([#1451](https://github.com/stackblitz-labs/bolt.diy/pull/1451)) by @thecodacus
* give electron action permission ([#1549](https://github.com/stackblitz-labs/bolt.diy/pull/1549)) by @Derek-X-Wang
* only draft release for branch build ([#1577](https://github.com/stackblitz-labs/bolt.diy/pull/1577)) by @Derek-X-Wang
* remove macOS code signing credentials from workflow ([#1677](https://github.com/stackblitz-labs/bolt.diy/pull/1677)) by @xKevIsDev
* add Electron build process to release workflow (73442dd) by @xKevIsDev
* reorder steps and add env vars for Electron build #release:major (a76013f) by @xKevIsDev


### 🔍 Other Changes

* Delete wrangler.toml (60b6f47) by @leex279
* Delete .tool-versions (2780b2e) by @leex279
* Revert "Delete wrangler.toml" (8d1f138) by @thecodacus
* Merge branch 'docker-fix' (5528306) by @thecodacus
* fix icon classes for consistency and clarity #release:major" (4354ad4) by @xKevIsDev
* fix icon classes for consistency and clarity #release:major" (5630be7) by @xKevIsDev


## ✨ First-time Contributors

A huge thank you to our amazing new contributors! Your first contribution marks the start of an exciting journey! 🌟

* 🌟 [@BurhanCantCode](https://github.com/BurhanCantCode)
* 🌟 [@Derek-X-Wang](https://github.com/Derek-X-Wang)
* 🌟 [@bizrockman](https://github.com/bizrockman)

## 📈 Stats

**Full Changelog**: [`v0.0.7..v1.0.0`](https://github.com/stackblitz-labs/bolt.diy/compare/v0.0.7...v1.0.0)
