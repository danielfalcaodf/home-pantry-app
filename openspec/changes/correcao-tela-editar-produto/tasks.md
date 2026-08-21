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
- [ ] 5.2 `.maestro/bug-editar-produto-mais-opcoes-scroll.yaml` — "Mais opções" rola até o
      campo revelado sem dar foco a ele; recolher/reexpandir não bagunça a rolagem. Executado
      em 2026-08-21: **bug real encontrado** (ver seção 6.1) — task fica aberta até corrigir.
- [ ] 5.3 `.maestro/bug-editar-produto-teclado-nao-cobre-campo.yaml` — o último campo
      ("Anotação") fica visível acima do teclado e a edição persiste. Executado em 2026-08-21:
      a parte "campo visível acima do teclado" passou; **bug real encontrado** na parte
      "a edição persiste" (ver seção 6.2) — task fica aberta até corrigir.
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

- [ ] 6.1 **Bug:** com o teclado do sistema aberto (qualquer campo do formulário focado), o
      controle "Mais opções"/"Menos opções" desaparece inteiramente da árvore de UI — não é só
      uma questão de rolagem, o elemento simplesmente não é encontrado nem coberto por outro
      view, o rodapé fixo ("Salvar"/"Tirar da despensa") aparece imediatamente após o campo
      "Quanto quero ter em casa", sem o toggle entre eles. Reproduzido tanto na abertura de
      "Corrigir quantidade atual" quanto em "Outra quantidade". Viola o novo cenário "Controle
      'Mais opções' continua tocável com o teclado aberto" em
      `specs/cadastro-de-produto/spec.md`. Investigar o cálculo de scroll/posição do
      `evita-teclado-formulario`/`ScrollView` interno quando o teclado sobe — suspeita: o
      container do toggle está sendo posicionado atrás da área ocupada pelo teclado, ou seu
      `flex`/altura zera quando o `KeyboardAvoidingView` recalcula.
      - [ ] 6.1.1 Corrigir o layout para o toggle continuar tocável com o teclado aberto.
      - [ ] 6.1.2 Teste RNTL do cenário do bug: formulário com um campo focado (teclado aberto)
            → "Mais opções" continua no snapshot de acessibilidade e é tocável.
      - [ ] 6.1.3 Caso de borda: mesmo teste com "Menos opções" (seção já expandida) — o toggle
            para recolher também não pode sumir.
      - [ ] 6.1.4 Rerodar `.maestro/bug-editar-produto-mais-opcoes-scroll.yaml` até verde.
- [ ] 6.2 **Bug (mais grave — perda de dado silenciosa):** editar qualquer campo da seção "Mais
      opções" (`Quanto costuma custar`, `Onde guardo`, `Marca que prefiro`, `Anotação`) na tela
      de detalhe/edição e tocar "Salvar" **não persiste a alteração** — reabrir o produto mostra
      o campo de volta vazio. Confirmado com três campos diferentes (`Anotação`, `Marca que
      prefiro`), com digitação real (`inputText`, não só paste) e com um `waitForAnimationToEnd`
      antes de salvar (descarta timing). Por contraste, o campo principal (`Quanto quero ter em
      casa`, fora de "Mais opções") persiste normalmente no mesmo fluxo. Viola "Scenario: Edição
      persistida" em `specs/cadastro-de-produto/spec.md` para o subconjunto de campos
      opcionais — suspeita: o `onPress` de "Salvar" está lendo um snapshot do formulário que não
      inclui os campos da seção recolhida/expandida, ou o estado desses campos vive num
      sub-componente que não repassa `onChange` para o formulário pai.
      - [ ] 6.2.1 Corrigir a gravação para incluir todos os campos de "Mais opções" no payload
            de salvar.
      - [ ] 6.2.2 Teste RNTL/infra do cenário do bug: editar `Anotação` (e os outros 3 campos
            opcionais) → salvar → reler o produto → valor persistido.
      - [ ] 6.2.3 Caso de borda: editar um campo de "Mais opções" **e** o campo principal na
            mesma sessão de edição → ambos persistem juntos (não é regressão parcial).
      - [ ] 6.2.4 Caso de borda: reabrir o produto, expandir "Mais opções" sem editar nada,
            salvar → os valores já existentes desses campos não são apagados (mesma classe de
            bug, sentido inverso).
      - [ ] 6.2.5 Rerodar `.maestro/bug-editar-produto-teclado-nao-cobre-campo.yaml` até verde.
