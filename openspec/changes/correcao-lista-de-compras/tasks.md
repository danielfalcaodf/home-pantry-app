## 1. Scroll na Lista de compras (bug confirmado)

- [ ] 1.1 Trocar o `View` + `.map()` de `app/(tabs)/lista.tsx` por `FlashList` (`@shopify/flash-list`), com `data={linhas}` e `renderItem` decidindo entre cabeçalho de categoria e `ItemLista` pelo `linha.tipo` — mesmo padrão já usado em `app/(tabs)/index.tsx`.
- [ ] 1.2 Escrever teste (RNTL) reproduzindo o cenário do bug: renderizar a Lista com itens suficientes pra exceder a altura da tela e confirmar que o container é rolável (estrutural, via `FlashList`/`testID`, seguindo o padrão de teste já usado pra `EvitaTeclado` na change anterior).
- [ ] 1.3 Rodar o teste criado em 1.2 e confirmar que passa antes de seguir.
- [ ] 1.4 Cobrir casos de borda do mesmo contexto: lista vazia (já tem `EstadoVazio`, confirmar que continua funcionando sem regressão), lista com 1 item, lista agrupada por categoria com `FlashList` (cabeçalhos + itens intercalados).

## 2. Item faltante não aparece na Lista de compras (investigação + correção)

- [ ] 2.1 Reproduzir no emulador via `mobile-ux-tester`: cadastrar um produto com quantidade atual 1kg e necessária 1,5kg como único item faltante da casa (todos os outros produtos com estoque completo); verificar se aparece na Lista de compras, trocar de aba e voltar, reiniciar o app — registrar em qual desses passos o item aparece ou não.
- [ ] 2.2 Repetir a reprodução com 2+ produtos faltantes simultaneamente, comparando com o resultado de 2.1 — confirmar ou descartar a suspeita do usuário de que a contagem de itens faltantes influencia.
- [ ] 2.3 Repetir a reprodução 4-5 vezes (como na investigação do `SheetAjusteEstoque` na change anterior), já que o usuário reportou comportamento intermitente — registrar taxa de falha observada.
- [ ] 2.4 A partir do que 2.1-2.3 revelarem, implementar a correção (candidatos a investigar primeiro: forçar releitura ao montar `useListaDeCompras`/`useProdutos` além de confiar só no listener nativo; verificar se há corrida de timing na primeira montagem da assinatura do `observadorDoBanco`).
- [ ] 2.5 Escrever teste automatizado do cenário exato reproduzido em 2.1 (infra ou application, conforme onde a causa raiz for encontrada), provando que o item aparece de forma confiável.
- [ ] 2.6 Rodar o teste criado em 2.5 e confirmar que passa.
- [ ] 2.7 Cobrir casos de borda do mesmo contexto: item que estava faltante e é reposto (deve sair da lista, comportamento já esperado — confirmar que a correção não regride isso), transição de 0 para 1 item faltante, transição de 1 para 0.

## 3. Affordance do ajuste no Modo Compra

- [ ] 3.1 Adicionar um ícone indicador (via `IconeSvg`/`icones.ts`, mesmo estilo já usado no resto do app) em `item-compra.tsx`, posicionado perto do preço, sinalizando que a linha aceita ajuste por toque longo — sem adicionar um segundo alvo de toque separado.
- [ ] 3.2 Escrever teste (RNTL) confirmando que o ícone indicador está presente em toda linha do Modo Compra, e que o toque longo continua abrindo `SheetAjusteCompra` como antes (sem regressão).
- [ ] 3.3 Rodar os testes de 3.2 e confirmar que passam.

## 4. Editar preço de produto direto na Lista de compras (funcionalidade nova, mesmo fluxo de teste de Bug Fix por reaproveitar componentes já entregues)

- [ ] 4.1 Criar um sheet pequeno e focado (novo componente de apresentação, reaproveitando `CampoTexto` com `tipo="dinheiro"` e `EvitaTeclado`, ambos já entregues pela change `correcao-usabilidade-campos-e-botoes`) com um único campo de preço.
- [ ] 4.2 Habilitar o toque em `item-lista.tsx`/`lista.tsx` para itens `tipo: 'produto'` (hoje só `avulso` é tocável), abrindo o sheet de 4.1 com o preço atual do produto (ou vazio, se `semPreco`).
- [ ] 4.3 Salvar via `useEditarProduto().editar(produtoId, { valorUnitario })` — reaproveitar hook e porta já existentes, sem novo caso de uso.
- [ ] 4.4 Escrever teste do cenário principal: tocar um produto faltante na Lista, editar o preço, confirmar que `useEditarProduto` foi chamado com o `valorUnitario` correto e que a lista reflete o novo preço.
- [ ] 4.5 Rodar o teste de 4.4 e confirmar que passa.
- [ ] 4.6 Cobrir casos de borda do mesmo contexto: produto sem preço nenhum (`semPreco`) recebendo um preço pela primeira vez; item avulso continua abrindo `SheetAvulso` (não o novo sheet de preço) e sem regressão no fluxo existente; cancelar o sheet de preço sem salvar não altera o produto.

## 5. Regressão

- [ ] 5.1 Rodar `npm run verificar` (fronteiras + lint + typecheck) e `npm test` completos, confirmando que nada além do escopo desta change foi afetado.
- [ ] 5.2 Rodar a suíte de testes já existente de `lista.tsx`, `item-lista.tsx`, `item-compra.tsx`, `use-lista-compras.ts`, `use-modo-compra.ts` (arquivos `*.test.tsx`/`*.test.ts` já existentes) confirmando que todos continuam verdes.
- [ ] 5.3 QA visual final no emulador (`mobile-ux-tester`) cobrindo os 4 pontos corrigidos/adicionados (scroll, item faltante único após reprodução, ícone de ajuste no Modo Compra, edição de preço na Lista), nos dois temas.
