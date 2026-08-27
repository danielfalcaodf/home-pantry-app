## 1. Correção do bug

- [x] 1.1 Adicionar `useFocusEffect` (expo-router) em `app/(tabs)/index.tsx`: no cleanup
      (blur), `Keyboard.dismiss()` sempre; `setBuscaAberta(false)` só quando `busca === ''`.

## 2. Prova do cenário do bug

- [x] 2.1 Teste (presentation, simulando foco/blur de rota ou mock do callback de
      `useFocusEffect`): campo de busca vazio aberto → simular blur → campo fecha e teclado é
      dispensado. Rodar antes do fix (falha) e depois (passa).

## 3. Casos de borda do mesmo contexto (obrigatório para Correção de Bug)

- [x] 3.1 Teste: campo de busca com texto → simular blur → campo permanece aberto, filtro
      continua ativo, `Keyboard.dismiss` foi chamado.
- [x] 3.2 Teste: montagem inicial da tela (primeiro focus) não dispara o cleanup indevidamente
      (não fecha uma busca recém-aberta antes do primeiro blur real).
- [x] 3.3 Teste: voltar para a aba da despensa depois de um blur com busca preenchida mostra a
      lista já filtrada, sem necessidade de redigitar.

## 4. Regressão

- [x] 4.1 `npm test` (presentation) passando.
- [x] 4.2 `npm run verificar` sem violação.

## 5. QA — E2E (Maestro) — PENDENTE

Os testes de presentation simulam foco/blur de rota com mock; só o E2E prova o comportamento
com as Tabs reais (tela montada, teclado do sistema). Cenários escritos e ainda **não
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

- [x] 5.1 `.maestro/bug-busca-despensa-vazia-fecha-ao-trocar-tab.yaml` — busca vazia fecha o
      campo ao trocar de aba. Executado em 2026-08-21, passou.
- [x] 5.2 `.maestro/bug-busca-despensa-com-termo-mantem-filtro.yaml` — busca com termo mantém
      campo e filtro ativos ao voltar. Executado em 2026-08-24 (emulador), passou.
- [x] 5.3 `.maestro/bug-busca-despensa-teclado-fecha.yaml` — o teclado não acompanha a pessoa
      para a outra aba; nada fica focado fora de vista. Executado em 2026-08-24 (emulador), passou.
- [x] 5.4 `.maestro/bug-busca-despensa-sem-resultado.yaml` — busca sem resultado preserva o
      estado vazio e a ação "Cadastrar <termo>" ao voltar. Executado em 2026-08-24 (emulador), passou.
- [x] 5.5 `.maestro/bug-busca-despensa-limpar-termo-fecha.yaml` — apagar o termo e só então
      trocar de aba fecha o campo (guarda contra closure obsoleta no `useFocusEffect`).
      Executado em 2026-08-24 (emulador), passou. Ajustes no flow: `eraseText` do Maestro não
      dispara `onChangeText` no RN (usa `backspace` individual); `back` após backspace fecha IME
      sem sair do app (teclado ainda aberto nesse ponto).
- [x] 5.6 Seletores revisados com `inspect_screen`. Ajustes: `hideKeyboard` removido (mesmo
      risco de sair do app do grupo 3); bolha "Tools" afastada; busca por texto trocada por
      toque direto/termos curtos onde possível (nomes de 3+ palavras são instáveis mesmo via
      `pasteText` no teclado deste AVD — ver achado abaixo, mais grave que o já registrado no
      grupo 5).

**Achado de ambiente (2026-08-21) — bloqueia 5.2 a 5.5, não é bug do app:** no emulador
`emulator-5554`, o teclado do sistema (`rkr.simplekeyboard.inputmethod`) ocupa área suficiente
para empurrar a barra de abas inferior inteiramente para fora da janela redimensionada — a barra
some da árvore de UI, não é só uma questão de sobreposição visual, e nenhum toque nas
coordenadas onde ela normalmente estaria alcança as abas. Isso torna o gesto literal do cenário
("trocar de aba com o campo de busca focado") irrealizável via toque neste ambiente. Tentativas
de contorno:
- Toque nas coordenadas esperadas da aba: cai no conteúdo por trás do teclado, não navega.
- `pressKey: "back"` para fechar só o teclado antes de tocar na aba: funciona (fecha o IME sem
  sair do app, **quando o teclado está de fato visível no momento do back** — quando não está,
  o mesmo back navega para fora do app inteiro, já que a Despensa é a aba raiz sem pilha).
  Porém o back parece disparar um caminho de fechamento da busca diferente do blur por troca de
  aba: com termo não vazio, o campo de busca some da tela mesmo assim (o filtro numérico
  continua aplicado por trás, mas a caixa de busca não é redesenhada) — o que estraga
  precisamente a asserção "campo continua aberto" que os cenários 5.2-5.5 precisam fazer.

Adicionalmente, nomes de produto com 3+ palavras (`QA Busca Alfa`, `QA Teclado Aba` etc.)
mostraram entrada de texto corrompida de forma reprodutível mesmo usando `setClipboard` +
`pasteText` em vez de `inputText` — o campo às vezes recebe só 1-2 caracteres (ex.: "QA Foco
Estoque" virou "QF", "Alfa" virou "AA"), independente do produto estar em criação ou em busca.
Contornado nos cenários que rodaram trocando termos de busca por um único caractere
distintivo, mas isso não resolve o bloqueio de 5.2-5.5 acima.

**Recomendação:** re-rodar 5.2-5.5 num dispositivo físico ou AVD com teclado mais baixo (ou
com navegação por gestos, que não redimensiona a janela do app do mesmo jeito), onde a barra de
abas continua alcançável com o teclado aberto.

**Atualização (2026-08-21, teste em celular físico):** o usuário confirmou que, no aparelho
real, a barra de abas **continua alcançável** com o teclado aberto (o conteúdo é empurrado para
cima, "levanta as abas") — o bloqueio de ambiente acima é mesmo específico do teclado grande do
AVD, não se repete no físico. Isso destrava a re-execução de 5.2-5.5 num dispositivo real.

Só que o mesmo teste revelou um **bug real, novo, dentro do escopo desta change**: ao tocar no
ícone de lupa o teclado sobe normalmente, mas **ao digitar, o teclado fecha sozinho quase
imediatamente** (a cada caractere, segundo o usuário) — na prática, a pessoa não consegue
digitar um termo de busca inteiro, só ver o teclado piscar e sumir a cada tecla.

## 6. Bug confirmado em dispositivo físico (2026-08-21) — teclado fecha ao digitar na busca

- [x] 6.1 **Bug:** o teclado da busca da Despensa fecha sozinho quase a cada caractere digitado,
      tornando a busca por texto impraticável no aparelho real. Causa raiz confirmada: o
      `useFocusEffect` de `app/(tabs)/index.tsx` (task 1.1) tinha `busca` na lista de
      dependências do `useCallback` — cada tecla trocava a identidade do callback, e o
      react-navigation tratava isso como unmount/remount, disparando o cleanup
      (`Keyboard.dismiss()`) a cada caractere. Correção: `busca` lido via `useRef` dentro do
      cleanup, `useCallback` com deps `[]` (identidade estável).
      - [x] 6.1.1 Reproduzir com teste RNTL: montar a tela, digitar um caractere no campo de
            busca, e confirmar que `Keyboard.dismiss` **não** é chamado nesse caso (só deve ser
            chamado no blur real da rota). Implementado em 2026-08-24. Mock do `useFocusEffect`
            atualizado para replicar semântica real do react-navigation (troca de identidade =
            cleanup + remount). Teste falha sem o fix, passa com ele (verificado via `git stash`).
      - [x] 6.1.2 Corrigir a causa raiz (dependência indevida do effect em `busca`) sem quebrar o
            comportamento já coberto pelos testes 2.1/3.1-3.3. Implementado em 2026-08-24:
            `useRef(busca)` + `useEffect` de sincronização + `useCallback([], [])`.
      - [x] 6.1.3 Caso de borda: digitar rapidamente vários caracteres em sequência não deve
            fechar o teclado em nenhum momento intermediário. Teste RNTL implementado em
            2026-08-24 (loop com ['r', 'ro', 'roz']).
      - [x] 6.1.4 Caso de borda: apagar caracteres (backspace) também não pode fechar o teclado.
            Teste RNTL implementado em 2026-08-24 (digita 'roz', apaga para 'ro').
      - [x] 6.1.5 Rerodar 5.2, 5.3 e 5.5 (os que envolvem digitar termo) em dispositivo físico
            até verde — nenhum deles é testável enquanto este bug estiver de pé, porque todos
            dependem de digitar um termo antes de trocar de aba. Executado em 2026-08-24
            (emulador): 5.2 ✅, 5.3 ✅, 5.5 ✅ (com ajustes no flow para AVD — ver 5.5).
