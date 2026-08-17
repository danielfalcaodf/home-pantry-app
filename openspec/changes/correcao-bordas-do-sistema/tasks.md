# Tasks — correcao-bordas-do-sistema

**Type:** Correção de Bug. A ordem segue o ciclo exigido para bug: corrigir primeiro, provar
com o teste do cenário exato do defeito, e então obrigatoriamente cobrir os casos de borda do
mesmo contexto.

## 1. Correção — insets do sistema (A-04)

- [x] 1.1 Nenhum wrapper compartilhado existia (cada tela montava a própria `View` raiz) — criado
  `src/presentation/components/tela-base.tsx` (`TelaBase`) como ponto único de consumo do
  `SafeAreaProvider` que o Expo Router já monta na raiz.
- [x] 1.2 **Não** foi montado `SafeAreaProvider` novo — confirmado que o Expo Router já monta um
  na raiz; `TelaBase` só consome via `SafeAreaView`.
- [x] 1.3 Inset de topo aplicado via `TelaBase` nas quatro abas e nas rotas empilhadas
  (`produto/[id]`, `produto/[id]/historico`, `produto/novo`, `compra/[id]`,
  `compra/historico`, `compra/historico/[id]`, `conferencia`, `diagnostico`, `TelaErro`).
- [x] 1.4 Inset inferior aplicado à tab bar em `app/(tabs)/_layout.tsx` via `useSafeAreaInsets()`
  (`paddingBottom`/`height` somados ao inset — fundo segue sangrando, só o conteúdo sobe).
- [x] 1.5 Inset inferior (`edges={['top','bottom']}`) aplicado em `compra/[id].tsx` e `TelaErro`,
  únicas telas fora do grupo de abas que ancoram ação na base do fluxo (fora de `ScrollView`).
- [x] 1.6 `grep -rnE "paddingTop: *(6[0-9]|[7-9][0-9])|paddingBottom: *(1[0-9]{2})" src app` sem
  ocorrências novas.

## 2. Correção — barra de status segue o tema efetivo (A-14)

- [x] 2.1 `useModoDeTema()` adicionado em `src/presentation/theme/provider.tsx`, publicando o
  `NomeDoTema` já calculado por `resolverTema`, sem duplicar o cálculo.
- [x] 2.2 `<StatusBar style={...}>` único montado em `app/_layout.tsx` (`EstiloDaBarraDeStatus`),
  derivado de `useModoDeTema()`, presente tanto no fluxo normal quanto no ramo de erro.
- [x] 2.3 Config plugin `expo-status-bar` (`style: "light"`) adicionado em `app.json`, casando
  com o fundo escuro da splash (`#208AEF`).
- [ ] 2.4 Rebuild do dev client — pendente de sessão de teste (fora do escopo desta sessão, que é
  só implementação).
- [ ] 2.5 `userInterfaceStyle: "automatic"` não foi alterado — o runtime (`EstiloDaBarraDeStatus`)
  já é a fonte de verdade em tempo de execução; decisão de ajustar essa chave fica para a sessão
  de teste, se a verificação em dispositivo mostrar conflito.

**Nota:** tasks das seções 3, 4 e 5 (prova do cenário, casos de borda, regressão) ficam para a
sessão de testes dedicada (`/opsx:test`), fora do escopo desta sessão de implementação.

## 3. Prova do cenário exato dos defeitos relatados

- [ ] 3.1 A-04 topo, tela Resumo: `inspect_screen` e assertar que o botão "Configurações" do
  header (hoje `[782,42][1038,168]`) passa a ter `top` maior que a altura da barra de status,
  e que o título "Resumo" (hoje `[42,68][270,142]`) não encosta no relógio.
- [ ] 3.2 A-04 base, tab bar: assertar que a borda inferior do alvo de toque de cada aba
  (hoje rótulos em `[75,2295][195,2332]`) termina acima do início da faixa de gestos.
- [ ] 3.3 A-04 base, formulário: com "Mais opções" expandido, assertar que "Adicionar à
  despensa" (hoje terminando em ≈ y2334) não invade a faixa de gestos.
- [ ] 3.4 A-14: no **emulador AOSP** (onde o defeito é determinístico), com o modo noturno do
  sistema **desligado** — a mesma condição de `qa/audit-07a` e `qa/audit-07b`, confirmada por
  `adb shell cmd uimode night` → `Night mode: no` —, escolher o tema Claro e tirar screenshot.
  Relógio e ícones precisam estar escuros sobre o fundo Porcelana. Antes da correção esse mesmo
  passo produz ícones brancos: é a reprodução exata do defeito.
- [ ] 3.5 A-14, prova de que a barra deixou de ser branca incondicional: repetir 3.4 no tema
  Escuro, na mesma aparência de sistema, e confirmar que agora as duas screenshots **diferem**
  entre si — hoje são idênticas na faixa da barra de status.

## 4. Casos de borda do mesmo contexto (obrigatório)

- [ ] 4.1 Matriz completa do A-14: as duas aparências do sistema (claro e escuro) × os três
  temas do app (Claro, Escuro, Automático). Em todas as seis combinações o conteúdo da barra
  precisa contrastar com o fundo do tema **do app**. Alternar a aparência do sistema com
  `adb shell cmd uimode night yes|no`.
- [ ] 4.2 Preferência "Automático": alternar a aparência do sistema com o app aberto e
  confirmar que a barra de status alterna junto com as cores, sem reinício.
- [ ] 4.3 Abertura sem quadro intermediário errado: com preferência divergente da do sistema,
  matar o processo e reabrir; nenhum quadro pode ter o fundo de um tema e a barra do outro.
  Estende o requisito "Abertura sem flash de tema errado" já existente em `tema-e-tokens`.
- [ ] 4.4 Rotação: girar para paisagem e voltar, confirmando que os insets são os da orientação
  corrente e que não sobra margem da anterior.
- [ ] 4.5 Navegação por três botões: repetir 3.2 e 3.3 com o Android em navegação por botões,
  onde o inset inferior tem outra altura — prova que o valor vem do sistema e não de constante.
- [ ] 4.6 `TelaErro`: forçar o ramo de erro de banco e confirmar que ela também respeita os
  insets e o estilo de barra de status.
- [ ] 4.7 Rotas empilhadas: `app/produto/[id]` e `app/compra/historico` — cabeçalho próprio com
  botão de voltar não pode invadir a barra de status.
- [ ] 4.8 Verificação complementar em aparelho de fabricante com auto-contraste de barra de
  status (o defeito não reproduz lá): confirmar que a declaração explícita do app não conflita
  com a heurística do OEM e que o resultado é o mesmo do emulador AOSP.

## 5. Regressão

- [ ] 5.1 `npm run verificar` verde (fronteiras + lint + typecheck). Esta change não pode
  introduzir import de `expo`/`react` em `src/domain/`.
- [ ] 5.2 `npm test` verde, com atenção aos testes existentes de `tema-e-tokens`
  ("Abertura sem flash de tema errado") e de `chrome-de-navegacao` (tab bar).
- [ ] 5.3 `.maestro/jornada-completa-caminho-feliz.yaml` verde ponta a ponta (baseline atual:
  62 comandos).
- [ ] 5.4 `.maestro/auditoria-ui-ux-android.yaml` verde ponta a ponta (baseline atual: 163
  comandos), e rodado duas vezes seguidas para provar idempotência da massa de dados.
- [ ] 5.5 Screenshots das quatro abas nos dois temas, antes e depois, comparados contra
  `FRONTEND-DESIGN-app-estoque-de-casa.md` — a régua é o design, não "ficou parecido com antes".
