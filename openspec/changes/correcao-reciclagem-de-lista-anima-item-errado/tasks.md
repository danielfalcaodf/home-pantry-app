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

- [ ] 2.1 Teste de componente: renderizar `MedidorNivel` com um `idDoItem`, mudar `fracao` e
  `idDoItem` ao mesmo tempo (simulando reciclagem), e assertar que o valor final aparece sem
  passar por `molar()` — replicar a técnica já usada em `medidor-e-item.test.tsx:72-77`
  (verificar ausência de chamada a `molar`).
- [ ] 2.2 Teste de componente: mudar só `fracao`, mantendo `idDoItem`, e assertar que `molar()`
  é chamado — não pode regredir o comportamento existente de "Mudança de quantidade anima".
- [ ] 2.3 Reprodução manual/Maestro: numa despensa com itens suficientes para reciclar (>15
  linhas visíveis de uma vez), rolar rápido e tirar screenshot durante o gesto, confirmando
  ausência do artefato visual relatado ("duas barras", texto cortado).

## 3. Casos de borda do mesmo contexto (obrigatório)

- [ ] 3.1 Reordenação por mudança de estado (item vai de "Falta" para "Cheio" e muda de
  posição): continua sem animar por causa da reordenação — não pode regredir o cenário
  "Reordenação após mudança de estado não anima o nível" já existente.
- [ ] 3.2 Entrada em cascata na abertura da tela: continua sem animação escalonada — cenário
  "Sem entrada em cascata" já existente, orthogonal a este bug.
- [ ] 3.3 Consumir um item visível enquanto células vizinhas são recicladas pela rolagem ao
  mesmo tempo: só o item alterado anima.
- [ ] 3.4 Item sem id (uso de `MedidorNivel` fora do contexto de lista reciclada, se existir):
  comportamento idêntico ao anterior à mudança.
- [ ] 3.5 Adicionar itens acima do item em edição/foco (cenário relatado como "duas barras
  verdes"): a lista se reordena/redimensiona sem sobreposição visual de linhas d'água.

## 4. Regressão

- [ ] 4.1 `npm run verificar` verde (fronteiras + lint + typecheck).
- [ ] 4.2 `npm test` verde, incluindo `medidor-e-item.test.tsx` na íntegra — nenhum teste
  existente pode regredir.
- [ ] 4.3 `.maestro/jornada-completa-caminho-feliz.yaml` e `.maestro/auditoria-ui-ux-android.yaml`
  verdes ponta a ponta.
