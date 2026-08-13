## Context

Sete achados de dívida de teste (F3) cobrem telas cuja lógica (hooks de `application/`) já está bem testada, mas cuja **composição visual e de navegação** não está. O padrão de teste de tela do repositório usa React Native Testing Library (RTL) com os hooks de `application/` mockados (ver `CLAUDE.md §Testes`: "`application/`: React Native Testing Library com repositório fake" — para teste de **tela**, que compõe vários hooks, mockar o hook em vez de subir um repositório fake inteiro reduz acoplamento e é a prática já usada nos poucos testes de tela existentes do repositório, ex. `botao-voltar.test.tsx`). Duas peças de comportamento do Resumo/Modo compra (ACHADO-052) nunca viraram requisito de spec — só texto de `proposal.md`/`design.md` de uma change já arquivada — e por isso não tinham onde um teste pudesse apontar como fonte da verdade; esta change fecha essa lacuna formal antes de escrever o teste.

Esta change **depende** de quatro changes anteriores (`correcao-autofoco-detalhe-produto`, `botao-voltar-conferencia`, `alvos-de-toque-e-acessibilidade`, `configuracoes-e-backup`) porque os testes precisam fixar o comportamento **depois** dessas correções — testar antes cristalizaria bugs já identificados como comportamento esperado.

## Goals / Non-Goals

**Goals:**
- Cada tela listada nos sete achados ganha teste de composição RTL cobrindo o comportamento que só existe na tela (não replicável testando o hook isoladamente).
- O destino de navegação de cada uso do `BotaoVoltar` é verificado por mock de `router`, não só que `router.back()` foi chamado.
- A posição do `RodapeCompra` e o corte de 4 meses do mini gráfico do Resumo viram requisito de spec testável.

**Non-Goals:**
- Não reescrever ou expandir os testes já existentes de `application/`/`domain/` para essas features — a lacuna é de composição de tela, não de regra de negócio.
- Não migrar os testes de tela existentes (ex. `botao-voltar.test.tsx`) para um novo padrão — só estendê-los.
- Não adicionar novo fluxo Maestro/E2E nesta change — o gap identificado é de teste automatizado de unidade/integração (Jest + RTL), não de jornada ponta a ponta no emulador.
- Não alterar comportamento de produto, exceto a correção mínima que a formalização do ACHADO-052 eventualmente revele (ex.: se a ordem do gráfico não bater exatamente com o spec novo).

## Decisions

**1. Mock de `router` do Expo Router por teste, não um fake de navegação compartilhado.**
Cada teste de destino do `BotaoVoltar` (ACHADO-049) mocka `expo-router` localmente (`jest.mock('expo-router', ...)`) com um histórico mínimo suficiente para a asserção daquela tela, seguindo o padrão já usado em `botao-voltar.test.tsx`. Alternativa considerada: um `MemoryRouter`/harness de navegação compartilhado entre os sete testes — rejeitada por adicionar abstração para um cenário que se resolve bem com mock direto, e por acoplar os sete testes a uma peça nova de infraestrutura de teste sem necessidade comprovada.

**2. Teste de `_layout.tsx` como render raso de `screenOptions`, não render completo da árvore de navegação.**
Confirmar `headerShown: false` (ACHADO-048) não exige montar o `Stack`/`Tabs` inteiro — inspecionar as `options` passadas é suficiente e evita depender de comportamento interno do `@react-navigation/native` em teste unitário.

**3. Formalização do ACHADO-052 em spec antes do teste, não teste direto contra o código.**
Sem requisito de spec, um teste que apenas espelha o código atual (`slice(0, MESES_NO_GRAFICO).reverse()`) não protege contra a mesma regressão que motivou o achado — ele só re-descreveria a implementação. Escrever o requisito primeiro (`resumo-de-valores`, `modo-compra`) obriga a decidir explicitamente a ordem esperada (ascendente) e a posição esperada (`RodapeCompra` acima do botão), e o teste passa a verificar o requisito, não a implementação.

## Risks / Trade-offs

- **[Risco] Mockar hooks de `application/` em teste de tela pode mascarar uma quebra real de integração entre hook e tela (ex.: nome de prop trocado silenciosamente aceito por TypeScript `any`).** → Mitigação: os mocks usam os tipos reais exportados pelos hooks (não `any`), então uma mudança de assinatura quebra a compilação do teste antes de mascarar qualquer coisa; `npm run typecheck` roda no gate final.
- **[Risco] A formalização do ACHADO-052 pode revelar que a implementação atual diverge do que o spec novo descreve (ex.: ordem realmente distinta da assumida na leitura do código).** → Mitigação: task explícita de conferir a implementação linha a linha antes de escrever o teste (tasks 7.1-7.2), e task de corrigir no mesmo commit se divergir, em vez de ajustar o spec para bater com um bug.
