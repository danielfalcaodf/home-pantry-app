# Tasks — correcao-nomes-e-estados-acessiveis

**Type:** Correção de Bug. Corrigir primeiro, provar com o teste do cenário exato do defeito,
e então obrigatoriamente cobrir os casos de borda do mesmo contexto.

Todo critério de aceite de acessibilidade aqui é medido na **árvore de acessibilidade**
(`inspect_screen`/`uiautomator`), nunca por leitura de código — é a lição que originou o A-15.

Depende de `correcao-agrupamento-modo-compra` (Ordem 7): mesmo arquivo `item-compra.tsx` e
mesmo flow de regressão do Modo Compra.

## 1. Varredura da causa

- [x] 1.1 Varredura feita (script sobre a AST simplificada de todo `.tsx`): nenhum outro
  `<View accessibilityRole=...>` filho de tocável fora de `item-compra.tsx` — era o único caso.
- [x] 1.2 Nenhum caso adicional encontrado; escopo permanece só o A-15.

## 2. Correção — checkbox do Modo Compra na árvore (A-15)

- [x] 2.1 `accessibilityRole="checkbox"`, `accessibilityState={{ checked }}` e o rótulo movidos
  para o `Pressable` (o nó que recebe o toque).
- [x] 2.2 `View` da caixa quadrada agora só visual, sem atributos de acessibilidade.
- [x] 2.3 `<Texto>✓</Texto>` marcado `importantForAccessibility="no"` — não vaza para o nome.
- [ ] 2.4 Confirmação na árvore real (`inspect_screen`) fica para a sessão de teste.
- [ ] 2.5 Atualização dos seletores dos flows `.maestro/*.yaml` fica para a sessão de teste —
  o rótulo acessível novo é `"<nome>, <quantidade>, <preço ou 'sem preço'>"`, sem o
  "Marcar"/"Desmarcar" nem o glifo `✓`.

## 3. Correção — papel tipográfico da prosa em Configurações (A-11)

- [x] 3.1 `caption` trocado por `body.md` (papel de corpo) nas três frases de
  `app/(tabs)/configuracoes.tsx` (data do último backup, aviso de restauração destrutiva,
  descrição do CSV) — mesmo texto, mesma posição, mesmo tom secundário.
- [x] 3.2 `tipografia.ts` não foi tocado.
- [ ] 3.3 Reconferência visual do layout nos dois temas fica para a sessão de teste.

## 4. Correção — nome acessível ambíguo (A-12)

- [x] 4.1 Seção "Despensa" renomeada para "Conferência" — descreve o conteúdo da seção (só o
  botão "Conferência da despensa") sem repetir o nome da aba.
- [x] 4.2 Aba "Despensa" não foi tocada.

## 5. Prova do cenário exato dos defeitos relatados

- [ ] 5.1 A-15: inspecionar a árvore do Modo Compra e assertar que cada linha aparece com papel
  de caixa de seleção e com estado de marcação — hoje aparece só como
  `"Item Roteiro Feliz QA, 1 un, sem preço"`, sem papel e sem estado.
- [ ] 5.2 A-15: marcar um item e assertar que o **estado** muda na árvore, sem depender do
  caractere `✓` no nome.
- [ ] 5.3 A-11: screenshot de Configurações confirmando que as três frases aparecem em caixa
  normal — em especial `:116`, o aviso de que restaurar não pode ser desfeito.
- [ ] 5.4 A-12: assertar que `tapOn: "Despensa"` na tela de Configurações resolve sem
  ambiguidade, sem precisar de `index: 1` para desempatar.

## 6. Casos de borda do mesmo contexto (obrigatório)

- [ ] 6.1 Desmarcar um item: o estado volta na árvore, e o nome não retém resíduo do estado
  anterior.
- [ ] 6.2 Item avulso e item de produto no Modo Compra: os dois expõem papel e estado
  igualmente.
- [ ] 6.3 Item sem preço e item com preço: o nome acessível continua descrevendo a linha sem o
  glifo de estado.
- [ ] 6.4 Toque longo para ajustar (affordance entregue pela change 2): continua funcionando
  com os atributos movidos para o `Pressable`, que agora também é o nó acessível.
- [ ] 6.5 Configurações nos dois temas com fonte do sistema ampliada: as três frases em papel de
  corpo não estouram o layout.
- [ ] 6.6 Navegar por Configurações só com leitor de tela, do topo à última ação: nenhum nome
  repetido, nenhuma ação sem papel.
- [ ] 6.7 Todos os casos encontrados em 1.1 que entrarem no escopo: cada um confirmado na
  árvore.

## 7. Regressão

- [ ] 7.1 `npm run verificar` verde (fronteiras + lint + typecheck).
- [ ] 7.2 `npm test` verde, incluindo os testes de componente de `item-compra` e de
  `configuracoes`.
- [ ] 7.3 `.maestro/jornada-completa-caminho-feliz.yaml` verde (baseline: 62 comandos) com os
  seletores atualizados em 2.5.
- [ ] 7.4 `.maestro/auditoria-ui-ux-android.yaml` verde (baseline: 163 comandos) com os
  seletores atualizados, duas vezes seguidas.
- [ ] 7.5 Os requisitos que já existiam e não podem regredir: alvo de 48dp do controle de
  marcação, controle quadrado, tachado e tom secundário ao marcar, e alvo de 48dp dos três
  seletores de tema em Configurações.
