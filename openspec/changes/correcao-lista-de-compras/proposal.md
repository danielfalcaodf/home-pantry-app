**Type:** Correção de Bug

## Why

A exploração de UX (`/opsx:explore`) na tela Lista de compras (`app/(tabs)/lista.tsx`) e no fluxo de compra relacionado encontrou cinco problemas: um bug de scroll confirmado (a lista renderiza sem `ScrollView`/`FlashList`, itens do fim ficam inacessíveis), um bug de reatividade relatado pelo usuário e ainda não totalmente diagnosticado (item genuinamente faltante às vezes não aparece na lista, mesmo trocando de aba ou reiniciando o app), uma lacuna de affordance no Modo Compra (o ajuste de preço só é alcançável por toque longo, sem nenhuma pista visual — mesma classe de bug já corrigida em `correcao-usabilidade-campos-e-botoes` para outros pontos do app), e uma funcionalidade pedida pelo usuário: editar o preço de referência de um produto direto na Lista de compras, sem precisar entrar no Modo Compra.

## What Changes

- `app/(tabs)/lista.tsx` passa a renderizar os itens dentro de `FlashList` (mesmo componente já usado em `app/(tabs)/index.tsx`), resolvendo o scroll ausente.
- Investigação guiada no emulador (cenário controlado: um único produto faltante) para diagnosticar por que um item genuinamente faltante às vezes não aparece na Lista de compras, mesmo após trocar de aba ou reiniciar o app — e correção do que for encontrado.
- `item-compra.tsx` (Modo Compra) ganha um indicador visual (ex. ícone) sinalizando a ação de ajustar quantidade/preço — hoje só alcançável por toque longo, sem nenhuma pista de que existe. A mesma correção cobre a affordance da pergunta inline "Atualizar o preço de X para R$ Y?" (já existe, decisão de manter como pergunta — só falta ficar visível).
- Novo caminho para editar o preço de referência de um produto normal (não avulso) direto na Lista de compras, antes de iniciar a compra — hoje só itens avulsos são tocáveis na lista; produtos normais faltantes não têm nenhuma ação.

## Capabilities

### New Capabilities

(nenhuma — esta change corrige/estende comportamento de capacidades já existentes)

### Modified Capabilities

- `lista-derivada`: ganha requisito de rolagem (a lista SHALL ser navegável com `FlashList`/scroll, não um `View` fixo) e requisito de reatividade confiável (item faltante SHALL aparecer de forma consistente, incluindo após reinício do app — cobrindo o bug relatado). Ganha também um novo requisito: produto normal (não avulso) faltante SHALL ter um caminho de edição do preço de referência diretamente na lista.
- `modo-compra`: o requisito "Ajuste de quantidade comprada e preço pago" ganha affordance visível (indicador de que o item é ajustável por toque longo), tanto para o ajuste em si quanto para a pergunta inline de atualização de preço.

## Impact

- **Telas**: `app/(tabs)/lista.tsx` (scroll, novo caminho de edição de preço).
- **Componentes de apresentação**: `src/presentation/components/item-lista.tsx` (nova ação de editar preço), `src/presentation/components/item-compra.tsx` (affordance do ajuste/pergunta). Reaproveita componentes já existentes da change `correcao-usabilidade-campos-e-botoes` (já mergeada em `develop`): `CampoTexto` (`tipo="dinheiro"`), `Botao`, `IconeSvg`, `EvitaTeclado` — nenhum componente novo de base a criar.
- **Aplicação**: possível novo hook ou extensão de `use-editar-produto`/análogo para editar só o preço de um produto a partir da Lista, sem abrir o formulário completo (decisão de design em `design.md`).
- **Domínio**: nenhuma regra nova esperada — preço de referência já é `produto.valorUnitario`, já validado e convertido em `domain/shared/dinheiro.ts`. A investigação do item de reatividade pode revelar necessidade de ajuste na camada de infraestrutura (`sqlite-produto.repository.ts`) ou no hook `use-lista-compras.ts`, a confirmar após reprodução.
- **Sem mudança de schema, sem mudança de rota, sem BREAKING.**

## Dependencies between changes

Depende dos componentes de base entregues por `correcao-usabilidade-campos-e-botoes` (já completa, mergeada em `develop` via PR #34) — `CampoTexto` com `tipo="dinheiro"`, `EvitaTeclado`, ícones de affordance. Nenhuma sobreposição de arquivos com essa change (ela tocou `campo-texto.tsx`, `formulario-produto.tsx`, os 4 sheets e `evita-teclado.tsx`; esta change toca `lista.tsx`, `item-lista.tsx`, `item-compra.tsx` e a investigação de `use-lista-compras.ts`/`sqlite-produto.repository.ts`) — só reaproveitamento, sem risco de conflito.
