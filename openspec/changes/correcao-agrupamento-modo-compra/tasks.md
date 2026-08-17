# Tasks — correcao-agrupamento-modo-compra

**Type:** Correção de Bug. Corrigir primeiro, provar com o teste do cenário exato do defeito,
e então obrigatoriamente cobrir os casos de borda do mesmo contexto.

## 1. Correção — cabeçalhos de categoria no Modo Compra (A-08)

- [x] 1.1 `agrupar-lista.ts` não podia ser usado direto — `ItemDaCompra` (aplicação de Modo
  Compra) e `ItemDaLista` (Lista) têm formas diferentes (`item`+`produto` vs. `nome`/`categoria`
  direto). Extraído o núcleo genérico (`agruparPorCategoriaGenerico`/`listaContinuaGenerico`,
  algoritmo idêntico ao original) do qual `agruparListaPorCategoria`/`listaContinua` agora são
  wrappers finos — comportamento e testes existentes intactos — e `app/compra/[id].tsx` passa a
  chamar o mesmo núcleo com acessores para `nome`/`categoria`/`chave` de `ItemDaCompra`. Zero
  algoritmo de agrupamento duplicado.
- [x] 1.2 `usePreferenciaDeAgrupamento` (a mesma da Lista) lida em `compra/[id].tsx` — nenhuma
  preferência própria criada.
- [x] 1.3 Cabeçalho renderizado com o mesmo estilo/estrutura do cabeçalho de categoria da Lista
  (`paddingHorizontal/Top/Bottom` + `Texto papel="caption" tom="secondary"`).
- [x] 1.4 Cabeçalho é um `View` sem `onPress`/`Pressable` — não tocável, sem navegação,
  recolhimento ou contagem, mesmo padrão da Lista.

## 2. Prova do cenário exato do defeito relatado

- [ ] 2.1 Iniciar uma compra com itens de mais de uma categoria e assertar que "CARNES",
  "GRÃOS E MASSAS" e "HIGIENE" aparecem no Modo Compra — hoje a ordem é preservada
  (Carne moída → Frango → Arroz → Aveia → … → Condicionador) e nenhum cabeçalho é renderizado.
- [ ] 2.2 Comparar aba Lista e Modo Compra com a mesma massa: os cabeçalhos e a ordem dos
  grupos SHALL ser idênticos. O critério não é "existem cabeçalhos", é "são os mesmos".

## 3. Casos de borda do mesmo contexto (obrigatório)

- [ ] 3.1 Agrupamento desligado na Lista: o Modo Compra abre em lista contínua ordenada por
  nome, sem cabeçalhos.
- [ ] 3.2 Alternar a preferência na Lista e iniciar a compra: o Modo Compra reflete a escolha
  corrente.
- [ ] 3.3 Compra com itens avulsos e produtos sem categoria: caem em "Sem categoria", e esse
  grupo aparece depois de todos os outros.
- [ ] 3.4 Compra com uma única categoria: um cabeçalho só, sem layout quebrado.
- [ ] 3.5 Compra onde todos os itens são avulsos: só o grupo "Sem categoria".
- [ ] 3.6 Marcar um item como comprado: ele permanece no mesmo grupo e na mesma posição, e
  nenhum cabeçalho aparece ou some (o item marcado ganha tachado, não muda de lugar).
- [ ] 3.7 Tocar num cabeçalho: nada acontece.
- [ ] 3.8 Rodapé de acompanhamento e fechamento da compra continuam funcionando com a lista
  agrupada — os requisitos "Rodapé de acompanhamento" e "Marcação item a item" não regridem.

## 4. Regressão

- [ ] 4.1 `npm run verificar` verde (fronteiras + lint + typecheck).
- [ ] 4.2 `npm test` verde, com os testes existentes de `agrupar-lista.ts` intactos — a change
  consome a função, não a altera.
- [ ] 4.3 `.maestro/jornada-completa-caminho-feliz.yaml` verde (baseline: 62 comandos) — ele
  percorre o ciclo de compra completo.
- [ ] 4.4 `.maestro/auditoria-ui-ux-android.yaml` verde (baseline: 163 comandos), duas vezes
  seguidas. **Reconferir, não só executar**: o §5b rola pelo texto da linha no Modo Compra
  (`scrollUntilVisible` em `"Item Auditoria QA, 1 un, sem preço"`), e inserir cabeçalhos muda as
  posições.
- [ ] 4.5 Screenshots da aba Lista e do Modo Compra lado a lado, com a mesma massa, nos dois
  temas — a evidência de que as duas telas passaram a concordar.
