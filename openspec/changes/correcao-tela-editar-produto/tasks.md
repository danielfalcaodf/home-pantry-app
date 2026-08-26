## 1. Correção do bug

- [x] 1.1 Em `app/produto/[id].tsx`, trocar `telaCheia={false}` por `telaCheia={true}` na
      chamada de `FormularioProduto`, ajustando o layout da tela ao redor (remover o
      `ScrollView` externo duplicado, se for o caso, deixando `FormularioProduto` dono do
      próprio scroll/rodapé).
- [x] 1.2 Em `formulario-produto.tsx`, adicionar `ref` ao `ScrollView` e, no toggle "Mais
      opções" (abrir), medir a posição do primeiro campo do bloco revelado e rolar até ele —
      sem `autoFocus`.
- [x] 1.3 Reabilitar/ajustar `scrollEnabled` no `ScrollView` interno se necessário para não
      quebrar o "scroll to focused input" nativo do RN.
- [x] 1.4 Estender `Botao` (`botao.tsx`) com prop opcional de ícone + cor customizada, aditiva
      (variantes `primario`/`secundario` inalteradas).
- [x] 1.5 Adicionar ícone de lixeira em `icones.ts`.
- [x] 1.6 Trocar o botão "Tirar da despensa" em `app/produto/[id].tsx` para usar o ícone de
      lixeira + cor `state.critico` do tema + `accessibilityLabel` explícito.

## 2. Prova do cenário do bug

- [x] 2.1 Teste RNTL: renderizar `app/produto/[id].tsx`, rolar o conteúdo, confirmar que o
      botão "Salvar" permanece fora do fluxo de scroll (mesma estrutura de `produto/novo.tsx`).
- [x] 2.2 Teste RNTL: abrir "Mais opções" com o formulário montado, confirmar que o scroll é
      disparado e que nenhum campo revelado recebe foco.

## 3. Casos de borda do mesmo contexto (obrigatório para Correção de Bug)

- [x] 3.1 Teste de `Botao`: variantes `primario`/`secundario` existentes renderizam idênticas
      (snapshot/props) antes e depois da mudança — não regredir os outros usos no app.
- [x] 3.2 Teste de `Botao`: nova prop de ícone/cor renderiza corretamente quando fornecida.
- [x] 3.3 Teste: botão "Tirar da despensa" expõe `accessibilityLabel` correto (não depende só
      do ícone visual).
- [x] 3.4 Teste: em `produto/novo.tsx` (não tocado por esta change), o comportamento de rodapé
      fixo e "Mais opções" continua idêntico — não regredir.
- [x] 3.5 Teste: abrir "Mais opções" já expandido (recolher) não dispara scroll indesejado.

## 4. Regressão

- [x] 4.1 `npm test` (presentation) passando.
- [x] 4.2 `npm run verificar` sem violação, com atenção ao `typecheck` (assinatura aditiva de
      `Botao` não pode quebrar nenhum uso existente).

## 5. QA — E2E (Maestro) — PENDENTE

Fecha o risco registrado em Risks/Trade-offs do `design.md` ("regressão visual não detectável
sem Maestro nesta rodada"). Cenários escritos e ainda **não executados**; ver
`PLANO-TESTES-E2E-CHANGES-REABERTAS.md` na raiz.

**Como executar:** por subagent + Maestro MCP — `/qa:ux` (`mobile-ux-tester`) para rodar e
investigar, `/qa:test` (`test-automator`) para corrigir flow, sempre com `inspect_screen` antes
de confiar num seletor. Nunca `maestro test` na mão.

**Se um flow reprovar por bug do app** (e não por seletor errado): não corrija o código direto.
Rodar `/opsx:update` nesta change primeiro — cenário novo no `specs/<capability>/spec.md`
descrevendo o comportamento correto, e tasks novas aqui (correção + teste do cenário do bug +
casos de borda do mesmo contexto, o ciclo obrigatório de Correção de Bug). Se o achado não
pertencer a esta change, `/opsx:propose` uma change nova e registrar no `ORDER.md`. A task do
cenário só é marcada `- [x]` com o flow verde — bug documentado não fecha task.

- [x] 5.1 `.maestro/bug-editar-produto-salvar-fixo.yaml` — "Salvar" e "Tirar da despensa"
      continuam visíveis com o formulário expandido e rolado até o fim. Executado em
      2026-08-21, passou.
- [x] 5.2 `.maestro/bug-editar-produto-mais-opcoes-scroll.yaml` — com campo já focado, a
      expansão rola e transfere o foco ao primeiro campo revelado após 200 ms, tempo necessário
      para o Android preparar o IME. Reteste em 2026-08-25: bloqueado no emulador porque o
      controle deixa a árvore de UI com teclado aberto; o usuário confirmou que no aparelho
      físico o controle permanece acessível e autorizou encerrar a change após esta correção.
- [x] 5.3 `.maestro/bug-editar-produto-teclado-nao-cobre-campo.yaml` — o último campo
      ("Anotação") fica visível acima do teclado e a edição persiste. Retestado em
      2026-08-25: passou, 31/31 comandos.
- [x] 5.4 `.maestro/bug-editar-produto-botao-destrutivo.yaml` — rótulo acessível, confirmação
      nativa e caminho de cancelamento do "Tirar da despensa". Executado em 2026-08-21, passou.
- [x] 5.5 `.maestro/bug-editar-produto-novo-produto-regressao.yaml` — a tela de "Novo produto"
      (mesmo componente) não regride: rodapé fixo e autofoco do nome. Executado em 2026-08-21,
      passou.
- [x] 5.6 Seletores revisados com `inspect_screen` durante a execução. Ajustes: `hideKeyboard`
      removido (arriscava sair do app inteiro via "voltar" sem pilha de navegação, mesmo achado
      do grupo 3); busca por texto trocada por toque direto no item (nomes multi-palavra são
      instáveis no teclado do AVD); o rótulo "Anotação" (e "Marca que prefiro") é compartilhado
      entre o `TextView` do rótulo e o `EditText` — toque por coordenada fixa (confirmada com
      `inspect_screen`) em vez de `tapOn` por texto, que pegava o elemento errado.

## 6. Bugs encontrados na execução E2E (2026-08-21) — não corrigidos nesta rodada

Ambos reproduzidos de forma determinística (repetidos 2-3x cada, com `inspect_screen` e
screenshot como evidência) no emulador `emulator-5554`. Não corrigidos ainda — aguardando
decisão de prioridade antes de implementar. As tasks 5.2 e 5.3 só fecham quando estes dois itens
estiverem corrigidos e os flows passarem verdes de ponta a ponta.

- [x] 6.1 **Bug:** no aparelho físico, ao tocar "Mais opções" enquanto "O que é" está focado,
      ocorria somente o auto-scroll; o primeiro campo revelado não recebia foco nem abria o
      teclado. Corrigido em 2026-08-25: após o scroll, o foco é transferido ao primeiro campo
      revelado depois de 200 ms para o Android preparar o IME. O controle permanece acessível no
      aparelho físico; o bloqueio da árvore de UI no emulador foi explicitamente aceito pelo usuário.
      - [x] 6.1.1 Transferir foco para o primeiro campo revelado depois do auto-scroll, apenas
            quando a expansão partir de um campo já focado.
      - [x] 6.1.2 Teste RNTL: campo "O que é" focado → expandir "Mais opções" → primeiro campo
            revelado recebe foco após 200 ms.
      - [x] 6.1.3 Caso de borda: expandir sem campo prévio focado continua apenas com auto-scroll,
            sem abrir o teclado.
      - [x] 6.1.4 Caso de borda: recolher não dispara scroll nem foco adicional.
      - [x] 6.1.5 Reteste Maestro documentado em 5.2; o bloqueio específico do emulador foi aceito
            pelo usuário porque o aparelho físico mantém o controle acessível.
- [x] 6.2 **Bug (mais grave — perda de dado silenciosa):** editar os campos da seção "Mais
      opções" não persistia `Marca que prefiro` e `Anotação`, pois eles eram omitidos pelo tipo
      validado, payload da tela e `UPDATE` do repositório. Corrigido em 2026-08-25.
      - [x] 6.2.1 Incluir todos os campos de "Mais opções" no tipo, payload de salvar e escrita
            do repositório, preservando `null` intencional.
      - [x] 6.2.2 Teste de infraestrutura: edita os quatro campos opcionais e relê o produto.
      - [x] 6.2.3 Caso de borda: campo principal e opcional persistem juntos.
      - [x] 6.2.4 Caso de borda: edição posterior sem os opcionais preserva os valores existentes.
      - [x] 6.2.5 `.maestro/bug-editar-produto-teclado-nao-cobre-campo.yaml` passou em
            2026-08-25 (31/31 comandos).
