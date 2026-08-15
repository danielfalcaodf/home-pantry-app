## 1. Scroll na Lista de compras (bug confirmado)

- [x] 1.1 Trocar o `View` + `.map()` de `app/(tabs)/lista.tsx` por `FlashList` (`@shopify/flash-list`), com `data={linhas}` e `renderItem` decidindo entre cabeçalho de categoria e `ItemLista` pelo `linha.tipo` — mesmo padrão já usado em `app/(tabs)/index.tsx`. "Adicionar item avulso" virou `ListFooterComponent`, pra continuar rolando junto da lista.
- [x] 1.2 Escrito teste (RNTL) confirmando o `FlashList` (`testID="lista-de-compras"`) no lugar do `View` solto, em `app/(tabs)/lista.test.tsx`.
- [x] 1.3 Testes de 1.2 rodados e passando.
- [x] 1.4 Casos de borda: lista com 1 item (testado, dentro do `FlashList`); lista vazia continua no branch `EstadoVazio` anterior ao `FlashList` (nenhuma mudança estrutural ali, sem regressão possível); agrupamento por categoria (`agruparListaPorCategoria`/`listaContinua`) já tem cobertura unitária própria e não muda com a troca de container — o único ponto novo é o `FlashList` em si, coberto pelos testes de 1.2.

## 2. Item faltante não aparece na Lista de compras (investigação + correção)

- [ ] 2.1 Reproduzir no emulador via `mobile-ux-tester`: cadastrar um produto com quantidade atual 1kg e necessária 1,5kg como único item faltante da casa (todos os outros produtos com estoque completo); verificar se aparece na Lista de compras, trocar de aba e voltar, reiniciar o app — registrar em qual desses passos o item aparece ou não.
- [ ] 2.2 Repetir a reprodução com 2+ produtos faltantes simultaneamente, comparando com o resultado de 2.1 — confirmar ou descartar a suspeita do usuário de que a contagem de itens faltantes influencia.
- [ ] 2.3 Repetir a reprodução 4-5 vezes (como na investigação do `SheetAjusteEstoque` na change anterior), já que o usuário reportou comportamento intermitente — registrar taxa de falha observada.
- [ ] 2.4 A partir do que 2.1-2.3 revelarem, implementar a correção (candidatos a investigar primeiro: forçar releitura ao montar `useListaDeCompras`/`useProdutos` além de confiar só no listener nativo; verificar se há corrida de timing na primeira montagem da assinatura do `observadorDoBanco`).
- [ ] 2.5 Escrever teste automatizado do cenário exato reproduzido em 2.1 (infra ou application, conforme onde a causa raiz for encontrada), provando que o item aparece de forma confiável.
- [ ] 2.6 Rodar o teste criado em 2.5 e confirmar que passa.
- [ ] 2.7 Cobrir casos de borda do mesmo contexto: item que estava faltante e é reposto (deve sair da lista, comportamento já esperado — confirmar que a correção não regride isso), transição de 0 para 1 item faltante, transição de 1 para 0.

## 3. Affordance do ajuste no Modo Compra

- [x] 3.1 Adicionado ícone `ajustar` (novo path em `icones.ts`, estilo consistente) em `item-compra.tsx`, ao lado do preço, dentro de `testID="icone-ajustar"`.
- [x] 3.2 Testes escritos em `item-compra.test.tsx`: ícone presente, e toque longo continua chamando `onAjustar` sem regressão.
- [x] 3.3 Testes rodados e passando (10/10 no arquivo).

## 4. Editar preço de produto direto na Lista de compras (funcionalidade nova, mesmo fluxo de teste de Bug Fix por reaproveitar componentes já entregues)

- [x] 4.1 Criado `src/presentation/components/sheet-preco-produto.tsx` — sheet pequeno e focado, reaproveitando `CampoTexto` (`tipo="dinheiro"`) e `EvitaTeclado`, um único campo de preço.
- [x] 4.2 `lista.tsx` habilitado pra abrir o sheet de preço ao tocar um item `tipo: 'produto'` (antes só avulso era tocável); item avulso continua abrindo `SheetAvulso` como antes.
- [x] 4.3 Salvamento via `useEditarProduto().editar(produtoId, { valorUnitario: centavos(...) })` — hook e porta já existentes, sem novo caso de uso.
- [x] 4.4 Testes escritos em `app/(tabs)/lista.test.tsx`: cenário principal (tocar produto, editar preço, `useEditarProduto` chamado com o valor correto).
- [x] 4.5 Testes rodados e passando.
- [x] 4.6 Casos de borda testados: produto sem preço nenhum recebendo preço pela primeira vez; item avulso continua abrindo `SheetAvulso`, não o novo sheet; fechar sem salvar não chama `useEditarProduto`.

## 5. Regressão

- [ ] 5.1 Rodar `npm run verificar` (fronteiras + lint + typecheck) e `npm test` completos, confirmando que nada além do escopo desta change foi afetado.
- [ ] 5.2 Rodar a suíte de testes já existente de `lista.tsx`, `item-lista.tsx`, `item-compra.tsx`, `use-lista-compras.ts`, `use-modo-compra.ts` (arquivos `*.test.tsx`/`*.test.ts` já existentes) confirmando que todos continuam verdes.
- [ ] 5.3 QA visual final no emulador (`mobile-ux-tester`) cobrindo os 4 pontos corrigidos/adicionados (scroll, item faltante único após reprodução, ícone de ajuste no Modo Compra, edição de preço na Lista), nos dois temas.
