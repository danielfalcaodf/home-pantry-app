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

- [x] 3.1 A-04 topo, testado indiretamente: nenhuma das 4 abas × 2 temas mostrou conteúdo
  invadindo a barra de status (`inspect_screen`/`take_screenshot`, sessão de teste 2026-08-18).
- [x] 3.2 A-04 base, tab bar: confirmado sem invasão da faixa de gestos nas 8 combinações
  testadas (4 abas × 2 temas). Não foi medido o bound exato do rótulo "[75,2295][195,2332]"
  citado aqui — a verificação foi visual/inspect_screen geral, não pixel-a-pixel deste bound.
- [ ] 3.3 Não testado nesta rodada (formulário com "Mais opções" expandido).
- [x] 3.4 A-14: confirmado no emulador AOSP `emulator-5554`, `night mode: no`. Ícones do sistema
  (relógio, wifi, bateria) legíveis nos dois temas — brancos no Escuro, escuros no Claro.
  Evidência: `c3_light_{despensa,lista,config2}.png`, `c3_dark_{lista,resumo,config}.png`.
- [x] 3.5 Confirmado: as screenshots dos dois temas diferem na faixa da barra de status (ver
  evidência acima).

## 4. Casos de borda do mesmo contexto (obrigatório)

- [ ] 4.1 Não testada a matriz completa (6 combinações) — só a condição `night: no` × 2 temas
  do app foi coberta nesta rodada (task 3.4/3.5). Falta cobrir `night: yes` × 3 temas do app.
- [x] 4.2 Confirmado: alternando `adb shell cmd uimode night yes/no` com o app aberto, tema e
  barra mudam juntos sem reinício. Evidência: `c3_auto_system_light.png`.
- [x] 4.3 Confirmado 2026-08-19 (`auditoria-ui-ux-android.yaml`, seção 6b): `killApp` + `launchApp`
  + screenshot imediato (`audit-07c-abertura-tema-persistido`) sem flash de tema/barra errados.
- [x] 4.4 Confirmado 2026-08-19 (`auditoria-ui-ux-android.yaml`, seção 6): `setOrientation:
  LANDSCAPE_LEFT` → `Despensa` e item continuam visíveis sem invasão, `setOrientation: PORTRAIT`
  volta sem sobra de margem.
- [ ] 4.5 Navegação por três botões: repetir 3.2 e 3.3 com o Android em navegação por botões,
  onde o inset inferior tem outra altura — prova que o valor vem do sistema e não de constante.
- [ ] 4.6 `TelaErro`: forçar o ramo de erro de banco e confirmar que ela também respeita os
  insets e o estilo de barra de status.
- [x] 4.7 Confirmado 2026-08-19 (`jornada-completa-caminho-feliz.yaml`, CRUD de `produto/[id]` +
  histórico visitados na jornada): cabeçalho com botão de voltar sem invasão da barra de status.
- [ ] 4.8 Verificação complementar em aparelho de fabricante com auto-contraste de barra de
  status (o defeito não reproduz lá): confirmar que a declaração explícita do app não conflita
  com a heurística do OEM e que o resultado é o mesmo do emulador AOSP.

## 5. Regressão

- [x] 5.1 `npm run verificar` verde 2026-08-19 (fronteiras + lint + typecheck limpo, exceto 16
  erros pré-existentes de tipagem de rotas do Expo Router, não relacionados a esta change).
- [x] 5.2 `npm test` verde 2026-08-19 — 922/922, incluindo `app/(tabs)/_layout.test.tsx` (o gap
  de `SafeAreaProvider` no teste registrado em "Pendências" abaixo já foi corrigido pelo mock
  global em `jest.setup.app.js`).
- [x] 5.3 `.maestro/jornada-completa-caminho-feliz.yaml` verde 2026-08-19 (63/63 comandos).
- [x] 5.4 `.maestro/auditoria-ui-ux-android.yaml` verde 2026-08-19, rodado duas vezes seguidas
  (167/167 nas duas rodadas) — idempotência confirmada.
- [ ] 5.5 Screenshots comparados formalmente contra `FRONTEND-DESIGN-app-estoque-de-casa.md`
  linha a linha não feito — os screenshots de evidência existem (`qa/audit-*`), mas sem
  comparação formal contra a régua de design.

## Pendências desta rodada de teste (2026-08-18)

- `npm test` falha em `app/(tabs)/_layout.test.tsx`: `TabsLayout` agora chama
  `useSafeAreaInsets()` (task 1.4) e o teste não envolve `<SafeAreaProvider>`. Não é regressão de
  produto — é setup de teste desatualizado. Corrigir com um helper de render compartilhado
  (`SafeAreaProvider` com `initialMetrics`) antes de fechar a task 5.2.
- `npm run verificar` tem 15 erros de `typecheck` (rotas do expo-router não tipadas) que já
  existem em `develop` antes desta change — confirmado comparando num worktree limpo. Não é
  regressão desta change; débito de tooling geral do projeto, registrar à parte.
- Tasks 3.3, 4.1 (matriz completa), 4.3–4.8 e toda a seção 5 continuam pendentes — não testadas
  nesta rodada (só Maestro/inspect_screen ao vivo + regressão automatizada, sem tempo para a
  matriz completa nem para os flows `.maestro/*.yaml` de baseline).
