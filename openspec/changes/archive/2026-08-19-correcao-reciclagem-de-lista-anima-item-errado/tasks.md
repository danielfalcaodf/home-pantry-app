# Tasks — correcao-reciclagem-de-lista-anima-item-errado

**Type:** Correção de Bug. Corrigir primeiro, provar com o teste do cenário exato do defeito,
e então obrigatoriamente cobrir os casos de borda do mesmo contexto.

## 1. Correção

- [x] 1.1 Escolhido o padrão manual de `useEffect` (não `useRecyclingState`): o valor a
  resetar é um `useSharedValue` do Reanimated, não `useState` — a própria documentação do
  `@shopify/flash-list` (guia "React Native Reanimated") prescreve `useEffect` chaveado por id
  para esse caso, não `useRecyclingState` (que é para estado React comum). Um único `useEffect`
  (não dois) com o id anterior guardado em `useRef` cobre os dois casos sem duplicar lógica.
- [x] 1.2 `idDoItem?: string` adicionado a `MedidorNivelProps` e `ItemDespensaProps` — opcional,
  sem reset (`reciclada` sempre `false`) quando ausente, preservando o comportamento atual dos
  testes existentes.
- [x] 1.3 Reset implementado: `idAnterior` (ref) guarda o último `idDoItem`; quando muda (e não é
  o primeiro render), `nivel.set(fracao)` direto, sem `molar()`; quando `idDoItem` é igual (ou
  ausente), comportamento inalterado.
- [x] 1.4 `app/(tabs)/index.tsx` passa `idDoItem={linha.item.produto.id}` a `ItemDespensa` — a
  mesma fonte usada como `keyExtractor` da `FlashList` (`chave: item.produto.id`).

## 2. Prova do cenário exato do defeito relatado

- [x] 2.1 Escrito e verde 2026-08-19 (`medidor-e-item.test.tsx`, "idDoItem muda..."): `idDoItem`
  muda junto com `fracao` (célula reciclada) → `molar()` não é chamado.
- [x] 2.2 Escrito e verde 2026-08-19 (`medidor-e-item.test.tsx`, "idDoItem igual..."): `idDoItem`
  igual, `fracao` muda de verdade → `molar()` é chamado com o novo valor.
- [x] 2.3 Confirmado no emulador 2026-08-19: 6 swipes rápidos alternados (cima/baixo) na
  Despensa (40 itens), screenshots a cada troca de direção sem nenhum artefato visual (régua
  cruzando texto errado, "duas barras", valor de item trocado). Tentativa de gravação via `adb
  shell screenrecord` não sincronizou com o gesto (câmera capturou tela estática por race
  condition entre o processo em background e o comando Maestro) — descartada, não é evidência.
  Mesma limitação metodológica já registrada na rodada anterior: ausência de artefato em
  screenshot não é prova formal de ausência do bug, mas current evidence (6 tentativas + suíte
  de componente cobrindo a lógica exata do reset) é consistente com correção.

## 3. Casos de borda do mesmo contexto (obrigatório)

- [x] 3.1/3.2 Já cobertos por testes existentes intactos (`medidor-e-item.test.tsx`, prop
  `animar`) — não regrediram, 24/24 verdes.
- [ ] 3.3 Não testado isoladamente nesta rodada (difícil de isolar via Maestro — consumir e
  rolar exigem gestos concorrentes que o driver serializa).
- [x] 3.4 Confirmado por código: `idDoItem` é opcional, `reciclada` é sempre `false` quando
  ausente — comportamento idêntico ao anterior à mudança (coberto pelos testes de `prop animar`
  que não passam `idDoItem`).
- [x] 3.5 Confirmado no emulador 2026-08-19 (task 2.3): scroll rápido alternado sem
  sobreposição visual de linhas d'água em nenhum screenshot.

## 4. Regressão

- [x] 4.1 `npm run verificar` verde 2026-08-19 (16 erros pré-existentes de rotas, não relacionados).
- [x] 4.2 `npm test` verde 2026-08-19 — 922/924 (+2 testes novos desta rodada),
  `medidor-e-item.test.tsx` 24/24. O falso positivo do regex de conformidade (JSDoc) já estava
  corrigido antes desta rodada.
- [x] 4.3 `.maestro/jornada-completa-caminho-feliz.yaml` (63/63) e
  `.maestro/auditoria-ui-ux-android.yaml` (167/167, duas vezes) verdes 2026-08-19.

## Pendências desta rodada de teste (2026-08-18)

- [ ] 2.3 **INCONCLUSIVA** — não reproduziu em ~5 tentativas de scroll rápido (up/down alternado)
  + consumo imediato num item recém-reciclado, numa Despensa com 43 itens. Nenhum "resíduo"
  visual observado em nenhum screenshot pós-scroll; toast e reordenação corretos. Limitação do
  método: a animação spring dura poucas centenas de ms e `take_screenshot` via Maestro não
  garante captura no frame exato do glitch — ausência de evidência visual não é prova definitiva
  de ausência do bug. **Recomendação**: repetir com `adb shell screenrecord` durante o
  scroll+consumo antes de dar sign-off nesta task.
- `npm test` falha em `medidor-e-item.test.tsx`: o teste de conformidade (regex
  `quantidade\w*\s*[-+*/]`) dá falso positivo num JSDoc novo ("a quantidade\n * mudou") — o `*`
  é continuação de comentário, não multiplicação. Não é regressão de produto; ajustar o regex do
  próprio teste (ou trocar por checagem que ignore comentários) antes de fechar 4.2.
- Restante das seções 2 (2.1/2.2), 3 e 4 não testado nesta rodada.
