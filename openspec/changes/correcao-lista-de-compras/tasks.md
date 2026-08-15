## 1. Scroll na Lista de compras (bug confirmado)

- [x] 1.1 Trocar o `View` + `.map()` de `app/(tabs)/lista.tsx` por `FlashList` (`@shopify/flash-list`), com `data={linhas}` e `renderItem` decidindo entre cabeçalho de categoria e `ItemLista` pelo `linha.tipo` — mesmo padrão já usado em `app/(tabs)/index.tsx`. "Adicionar item avulso" virou `ListFooterComponent`, pra continuar rolando junto da lista.
- [x] 1.2 Escrito teste (RNTL) confirmando o `FlashList` (`testID="lista-de-compras"`) no lugar do `View` solto, em `app/(tabs)/lista.test.tsx`.
- [x] 1.3 Testes de 1.2 rodados e passando.
- [x] 1.4 Casos de borda: lista com 1 item (testado, dentro do `FlashList`); lista vazia continua no branch `EstadoVazio` anterior ao `FlashList` (nenhuma mudança estrutural ali, sem regressão possível); agrupamento por categoria (`agruparListaPorCategoria`/`listaContinua`) já tem cobertura unitária própria e não muda com a troca de container — o único ponto novo é o `FlashList` em si, coberto pelos testes de 1.2.

## 2. Item faltante não aparece na Lista de compras (investigação + correção)

- [x] 2.1-2.3 Reproduzido no emulador via `mobile-ux-tester` (fallback por `adb`, Maestro indisponível na sessão). **A causa raiz é diferente da suspeita original do usuário e da hipótese de design.md** — não é timing/reatividade, é um bug de dado determinístico: um produto específico ("Queijo mussarela") nunca aparecia, 100% reprodutível (5/5), independente de contagem de outros itens faltantes, troca de aba ou restart frio. Outros produtos que ficaram faltantes na mesma sessão apareciam corretamente e imediatamente.
- [x] 2.4 Causa raiz confirmada inspecionando o `.db` puxado do emulador (`adb exec-out run-as ... cat files/SQLite/estoque.db`): existiam **duas linhas `compra_item`** pro mesmo `produtoId` na mesma compra aberta — uma materializada por `iniciarCompra` (sem exclusão) e outra criada por `remover()` (`excluido=true`). `compuserLista`/`use-lista-compras.ts` exclui pelo `produtoId` de **qualquer** linha marcada como excluída, então a segunda linha escondia o produto pra sempre, mesmo com a primeira ainda válida — nada a ver com o listener nativo do SQLite. Corrigido em `use-remover-item-lista.ts`: `remover()` agora busca uma linha existente (não excluída) pro mesmo produto antes de inserir — se achar, reaproveita com `editarItem(id, { excluido: true })`; só insere uma linha nova se não havia nenhuma. `desfazer()` espelha a distinção (`criouNovaLinha`): apaga a linha se foi criada agora, só reverte `excluido` se reaproveitou uma já materializada (preserva dado real). `excluido` adicionado a `EdicaoItemCompra` (`ports/compra.repository.ts`) e ao `editarItem` do SQLite (`infrastructure/repositories/sqlite-compra.repository.ts`), que antes não aceitava esse campo.
- [x] 2.5 Testes escritos: `use-remover-item-lista.test.ts` (reprodução exata do bug — produto já materializado por `iniciarCompra`, `remover()` reaproveita a linha em vez de duplicar; `desfazer()` reverte sem apagar dado real) e `sqlite-compra.repository.test.ts` (prova que `editarItem` grava `excluido` no SQLite real, nos dois sentidos).
- [x] 2.6 Testes rodados e passando (5/5 em `use-remover-item-lista.test.ts`, incluindo os 3 já existentes sem regressão; 35/35 em `sqlite-compra.repository.test.ts`).
- [x] 2.7 Casos de borda: remover um item nunca materializado continua funcionando como antes (insere linha nova, testado); `desfazer` de uma linha recém-criada continua apagando a linha (testado, comportamento original preservado); reutilização ao remover um segundo produto diferente continua funcionando (teste já existente, sem regressão).

**Nota para o usuário:** o produto real "Queijo mussarela" no dispositivo de QA continua com a linha duplicada de antes da correção (o fix impede *novas* duplicatas, não reescreve dado já corrompido). Cancelar ou fechar a compra aberta que contém essas duas linhas (`Modo Compra` → "Cancelar compra") libera o produto imediatamente — depois disso ele volta a aparecer normalmente na Lista, sem precisar de nenhuma migração.

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

- [x] 5.1 `npm run verificar` limpo (fronteiras + lint; typecheck só com o achado de infraestrutura pré-existente do `router.d.ts`, não relacionado a este código — confirmado sem nenhum outro erro). `npm test` completo: 878 testes, 103 suites, todos passando.
- [x] 5.2 Suíte específica (`lista.test.tsx`, `item-compra.test.tsx`, `use-lista-compras`, `use-modo-compra`, `use-remover-item-lista`, `sqlite-compra.repository`) — 42 testes, 6 suites, todos passando.
- [x] 5.3 QA visual final no emulador — os 4 pontos confirmados funcionando nos dois temas: scroll (`FlashList` rola até "Adicionar item avulso"), causa raiz do item sumido (cancelar a compra com a duplicata libera o produto; fluxo completo materializar → remover → uma única linha no Modo Compra → desfazer restaura, tudo validado), ícone de ajuste no Modo Compra, edição de preço na Lista (com e sem preço prévio).

**Achados incidentais do QA (pré-existentes, não introduzidos por esta change — tocam o mesmo `use-remover-item-lista.ts`/`lista.tsx` mexidos aqui, registrados pra decisão do usuário antes de arquivar):**
- Toast "Desfazer" não aparece ao remover o último item da lista (o branch de `EstadoVazio` em `lista.tsx` não renderiza `<Toast>`, só o branch de baixo).
- Item avulso removido nunca oferece "Desfazer" (`removerAvulso`/`useEditarAvulso` é desconectado do estado `ultimaRemocao` que alimenta o toast).
- Preço "por unidade" ambíguo pra produtos em g/ml (achado de UX, cálculo do domínio está correto — falta indicar a unidade de referência no rótulo do campo de preço).
