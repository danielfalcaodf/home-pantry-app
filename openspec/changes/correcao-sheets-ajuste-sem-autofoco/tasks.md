## 1. Correção do bug

- [x] 1.1 Adicionar `autoFocus` ao primeiro `CampoTexto` de `sheet-ajuste-compra.tsx`.
- [x] 1.2 Adicionar `autoFocus` ao primeiro `CampoTexto` de `sheet-ajuste-estoque.tsx`.

## 2. Prova do cenário do bug

- [x] 2.1 Teste RNTL: renderizar `sheet-ajuste-compra` e confirmar que o primeiro campo está
      focado ao montar. Rodar antes do fix (falha) e depois (passa).
- [x] 2.2 Teste RNTL equivalente para `sheet-ajuste-estoque`.

## 3. Casos de borda do mesmo contexto (obrigatório para Correção de Bug)

- [x] 3.1 Confirmar que os 3 sheets já corrigidos anteriormente (`sheet-preco-produto`,
      `sheet-avulso`, `teclado-quantidade`) continuam com `autoFocus` — não regredir.
- [ ] 3.2 Confirmar visualmente (sem Maestro nesta rodada) que o teclado sobe junto com o foco
      nos dois sheets corrigidos, em telas Android e iOS se disponível — pendente para o teste
      manual do usuário fora desta rodada (Maestro fora de escopo por pedido explícito).

## 4. Regressão

- [x] 4.1 `npm test` (suíte de presentation) passando.
- [x] 4.2 `npm run verificar` sem violação.

## 5. QA — E2E (Maestro) — PENDENTE

Substitui a task 3.2 (marcada "sem Maestro nesta rodada"). Cenários escritos e ainda **não
executados**; ver `PLANO-TESTES-E2E-CHANGES-REABERTAS.md` na raiz.

**Como executar:** por subagent + Maestro MCP — `/qa:ux` (`mobile-ux-tester`) para rodar e
investigar, `/qa:test` (`test-automator`) para corrigir flow, sempre com `inspect_screen` antes
de confiar num seletor. Nunca `maestro test` na mão.

**Se um flow reprovar por bug do app** (e não por seletor errado): não corrija o código direto.
Rodar `/opsx:update` nesta change primeiro — cenário novo no `specs/<capability>/spec.md`
descrevendo o comportamento correto, e tasks novas aqui (correção + teste do cenário do bug +
casos de borda do mesmo contexto, o ciclo obrigatório de Correção de Bug). Se o achado não
pertencer a esta change, `/opsx:propose` uma change nova e registrar no `ORDER.md`. A task do
cenário só é marcada `- [x]` com o flow verde — bug documentado não fecha task.

Em TODOS os cenários desta seção o resultado esperado é o par completo: primeiro campo focado
**e teclado do sistema levantado**. Foco sem teclado não resolve o problema relatado — a pessoa
continuaria precisando de um toque extra. O teclado é afirmado pelo id da janela do IME
(`<pacote>:id/keyboard_view`, casado por regex porque o pacote varia entre Gboard e AOSP) e
registrado por screenshot; confirmar o id com `maestro hierarchy` na primeira execução.

**CORREÇÃO (2026-08-21, mesmo dia): o achado acima estava errado — é bug real, confirmado pelo
usuário em dispositivo físico.** No emulador, `focused: true` batia e a asserção de janela do
IME virou soft-check por parecer política do AVD (controle com os 3 sheets pré-existentes
também "falhava" lá). Rodando os mesmos cenários num celular real, o usuário confirmou: **o
campo fica com `autoFocus` mas o teclado não sobe sozinho**, na maioria dos sheets — exatamente
o sintoma original desta change, não resolvido. Existem lugares onde o autoFocus funciona
corretamente com teclado (campo "O que é" em "Novo produto", tela cheia; campo de busca da
Despensa) — a falha é específica de sheets em bottom sheet (`PainelInferior`/`@gorhom/bottom-
sheet`), sugerindo causa raiz compartilhada: chamar `.focus()` durante/antes da animação de
entrada do sheet provavelmente marca o estado de foco sem de fato invocar `showSoftInput` no
Android, porque a view ainda não está anexada à janela quando o foco é chamado.

As tasks 5.1-5.5 abaixo ficam **reabertas**: os flows passaram com a asserção de teclado como
soft-check, o que mascarou a falha real. Ver task 6 para a correção.

- [ ] 5.1 `.maestro/bug-autofoco-sheet-ajuste-estoque.yaml` — sheet de ajuste de estoque abre
      com o primeiro campo focado e o teclado aberto. Passou no emulador com a asserção de
      teclado em soft-check; **reprovado em dispositivo físico** (teclado não sobe) — reabrir
      task 6.1 primeiro, depois tornar a asserção de teclado obrigatória de novo e rodar até
      verde de verdade.
- [ ] 5.2 `.maestro/bug-autofoco-sheet-ajuste-compra.yaml` — mesmo para o sheet de ajuste do
      Modo Compra. Mesmo status de 5.1.
- [ ] 5.3 `.maestro/bug-autofoco-sheet-reabertura.yaml` — foco e teclado continuam valendo na
      segunda abertura do mesmo sheet. Mesmo status de 5.1.
- [ ] 5.4 `.maestro/bug-autofoco-sheet-so-primeiro-campo.yaml` — teclado aberto, foco na
      quantidade e NÃO no preço pago. Mesmo status de 5.1.
- [ ] 5.5 `.maestro/bug-autofoco-sheets-ja-corrigidos-regressao.yaml` — os 3 sheets já
      corrigidos antes (`teclado-quantidade`, `sheet-preco-produto`, `sheet-avulso`) — usuário
      confirmou que estes **também** têm o mesmo sintoma em dispositivo físico (não é regressão
      desta change, é pré-existente, mas mora no mesmo componente compartilhado). Ver task 6.2.
- [x] 5.6 Seletores revisados com `inspect_screen` durante a execução no emulador. Ajustes:
      busca por texto multi-palavra removida (instável no teclado do AVD) em favor de toque
      direto no item; a bolha flutuante "Tools" do Expo dev-client sobrepõe os ícones do topo
      da tela — arrastada para fora da área antes de cada grupo de interações.

## 6. Bug confirmado em dispositivo físico (2026-08-21) — não corrigido nesta rodada

- [ ] 6.1 **Bug (dentro do escopo desta change) — corrigido e confirmado no emulador, falta a
      prova em dispositivo físico (6.1.4):** `sheet-ajuste-compra` e `sheet-ajuste-estoque`
      tinham `autoFocus` (task 1.1/1.2) mas o teclado do sistema não subia sozinho — o campo
      ficava com foco lógico (cursor visível) sem IME, obrigando a pessoa a tocar o campo
      mesmo assim, exatamente o problema original que esta change deveria resolver. Causa raiz
      confirmada em duas camadas: não é `@gorhom/bottom-sheet` (o app usa `<Modal>` nativo, ver
      `painel-inferior.tsx`).
      - [x] 6.1.1 Investigado: `PainelInferior` usa `<Modal animationType="slide">` da própria
            react-native. O `Modal` expõe `onShow` — callback nativo chamado só depois que a
            janela terminou de aparecer (documentação oficial via Context7,
            `/react/react-native-website`). Primeira tentativa: `.focus()` disparado direto no
            `onShow`. **Reproduzido no emulador (Maestro `inspect_screen`/screenshot) que essa
            primeira tentativa ainda falha** — campo com `focused:true` na hierarquia, sem
            teclado na tela. Root cause real, camada 2: o `onShow` do `Modal` no Android reporta
            a janela como "aparecida" antes do SO terminar de conceder foco de input pra ela —
            `showSoftInput` chamado nesse instante é ignorado silenciosamente. Confirmado que a
            IME em si funciona normalmente (toque manual no mesmo campo abre o teclado sem
            problema) — o defeito é só no timing do foco programático.
      - [x] 6.1.2 Corrigido para os dois sheets desta change, com um atraso curto e centralizado
            (não duplicado por sheet): `PainelInferior` ganhou a prop `onAberto`, repassada ao
            `onShow` do `Modal` só depois de `ATRASO_FOCO_APOS_ABRIR_MS` (100ms, heurística
            documentada no comentário do componente — RN não expõe um evento "janela pronta pra
            IME" no Android); `CampoTexto` passou a encaminhar `ref` (`forwardRef`) pro
            `TextInput` interno; `sheet-ajuste-compra.tsx` e `sheet-ajuste-estoque.tsx`
            removeram `autoFocus` do primeiro campo e chamam `campoRef.current?.focus()` em
            `onAberto` (sem saber do atraso — fica só no componente compartilhado).
      - [x] 6.1.3 Confirmado por teste dedicado (probe descartável) que `.focus()` imperativo
            não dispara `onFocus` sob Jest (sem bridge nativa) — `toHaveFocus()`/`onFocus` não
            servem pra provar o bug real. Testes atualizados: `sheet-ajuste-compra.test.tsx`/
            `sheet-ajuste-estoque.test.tsx` travam que o campo **não** tem `autoFocus` (o
            gatilho de foco na montagem, causa raiz nº 1, foi removido); `painel-inferior.
            test.tsx` mocka o submódulo `react-native/Libraries/Modal/Modal` (não o pacote
            inteiro — evita reabrir a cadeia de módulos nativos do jest-expo) e usa
            `jest.useFakeTimers()` pra provar que `onAberto` só dispara depois do atraso, nunca
            na montagem nem no instante exato do `onShow`. **Verificação end-to-end real feita
            via Maestro MCP no emulador** (não só RNTL): app reiniciado do zero, os dois sheets
            abertos, screenshot confirma cursor **e** teclado numérico visíveis nos dois —
            reprodução limpa do bug com a versão anterior da correção, e confirmação visual da
            correção atual.
      - [ ] 6.1.4 Rerodar 5.1-5.4 em dispositivo físico até verde de verdade — emulador
            confirmado nesta sessão (13:54–13:55, 21/08); dispositivo físico ainda pendente
            (não disponível nesta sessão), requer `/qa:ux` com o dispositivo conectado.
- [x] 6.2 **Achado relacionado, inicialmente fora do escopo desta change (mesmo sintoma,
      componente pré-existente) — corrigido nesta mesma change a pedido explícito do usuário
      (2026-08-21, mesma sessão):** `teclado-quantidade`, `sheet-preco-produto` e `sheet-avulso`
      tinham o mesmo problema — confirmado pelo usuário em teste manual ("modal da lista
      'quanto costuma custar', 'adicionar item avulso', 'outra quantidade'"). Como a causa raiz
      já estava entendida e corrigida de forma centralizada em `PainelInferior` (task 6.1), o
      custo de estender a correção era mínimo: mesmo padrão (`ref` + `onAberto`, sem
      `autoFocus`) aplicado aos 3 arquivos. Verificado no emulador via Maestro MCP (screenshots
      dos 3 fluxos: "Quanto costuma custar" na Lista, "Adicionar item avulso", "Outra
      quantidade" na Despensa) — todos abrem com campo focado e teclado numérico/QWERTY
      visível. Testes RNTL atualizados (`sheet-preco-produto.test.tsx`,
      `sheet-avulso.test.tsx`, `teclado-quantidade.test.tsx`) trocando a asserção de
      `autoFocus: true` por `autoFocus: falsy`, mesmo racional de 6.1.3. `npm test` (979/979) e
      `npm run verificar` (fronteiras + lint OK; typecheck só com os erros pré-existentes de
      rotas do Expo Router, sem relação). Prova em dispositivo físico continua pendente,
      dependente de 6.1.4.
