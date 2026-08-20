## Context

`valorEstimadoUnit` é capturado no momento de iniciar a compra (`use-iniciar-compra.ts`), a
partir do `valorUnitario` do produto — é o preço de referência. `valorPagoUnitario` é o preço
efetivamente pago, digitado manualmente via `ajustarPreco`. `totalPago()` (domínio) soma
apenas `valorPagoUnitario`, tratando `null` como zero. A tela já exibe
`valorPagoUnitario ?? valorEstimadoUnit` (`item-compra.tsx:44`), então o usuário vê um preço
"errado" ficar de fato zerado no total sem perceber.

## Goals / Non-Goals

**Goals:**
- Marcar um item sem preço pago explícito usa o preço estimado do produto como padrão,
  gravado em `valorPagoUnitario` — o total reflete o que o usuário viu na tela.

**Non-Goals:**
- Não alterar `totalPago()` no domínio — ela continua simples (soma `valorPagoUnitario`), a
  correção fica só na gravação em `marcar()`.
- Não mudar o comportamento de `ajustarPreco` (preço digitado explicitamente continua tendo
  prioridade e sobrescrevendo qualquer valor default).

## Decisions

- **Persistir o preço herdado em `valorPagoUnitario` no momento de marcar, em vez de fallback
  só no cálculo do total**: decisão do usuário/produto — o histórico da compra deve refletir o
  preço numérico usado, não distinguir "confirmado" vs "herdado" via null. Alternativa
  descartada: manter `valorPagoUnitario` null e fazer `totalPago()` cair para
  `valorEstimadoUnit` — rejeitada porque duplicaria a regra de fallback em dois lugares
  (domínio e apresentação) e o histórico perderia o valor numérico realmente considerado.
- Mesmo padrão já usado em `marcar()` para `quantidadeComprada: item.quantidadeComprada ??
  item.quantidadePlanejada` — `valorPagoUnitario: item.valorPagoUnitario ??
  item.valorEstimadoUnit`.

## Risks / Trade-offs

- [Risco] Histórico de compra passa a não distinguir preço "confirmado pelo usuário" de preço
  "herdado sem confirmação" → Mitigação: aceito conscientemente pelo usuário/produto nesta
  change; documentado aqui para não ser reaberto sem intenção.
- [Risco] Produto sem preço nenhum (`valorEstimadoUnit` também null) continua contribuindo
  zero — mantém o comportamento atual para esse caso, sem regressão.

## Reabertura (2026-08-20) — causa raiz nova: `valorEstimadoUnit` obsoleto

O fix acima (`marcar()` cair para `valorEstimadoUnit`) resolve o caso em que esse campo já
está correto no momento de marcar. O bug que o usuário ainda reproduziu manualmente é
**anterior**: `valorEstimadoUnit` fica **congelado** no preço de quando a linha de
`compra_item` foi criada, e nada no código sincroniza esse campo depois.

### Cadeia de causa raiz

1. **`src/application/lista/compra-aberta.ts`** (`obterOuAbrirCompra`) — só uma compra aberta
   por casa (`ux_compra_aberta`); se já existe uma residual (ex.: "Iniciar compra" chamado
   antes sem finalizar), ela é **reaproveitada**, nunca recriada do zero.
2. **`src/application/compra/use-iniciar-compra.ts`** (`iniciar`, antes do fix 5.1) — fazia
   dedup por `produtoId`: se o produto já tem uma linha `compra_item` não excluída na compra
   aberta, ele é filtrado fora de `doEstoque`, e `compras.adicionarItem` (o único lugar que
   gravava `valorEstimadoUnit` com o preço atual) nunca roda pra esse item. A linha antiga,
   com o preço de quando foi criada, fica intocada.
3. **Como a linha nasce com preço 0 mesmo sem "iniciar" consciente**:
   `src/application/lista/use-remover-item-lista.ts` (`remover`, antes do fix 5.2) — ao
   remover um item "sem preço" da lista, se ainda não existe linha, cria uma nova via
   `adicionarItem` sem passar `valorEstimadoUnit`, caindo no default do schema
   (`src/infrastructure/db/schema.ts`, coluna `valorEstimadoUnit` `.notNull().default(0)`).
   `reativar()` só faz `editarItem(itemId, { excluido: false })` — nunca recalcula o preço.
4. **Nenhum caminho de código sincronizava `compra_item.valorEstimadoUnit` quando
   `produto.valorUnitario` era editado depois** — `SheetPrecoProduto` grava certo em
   `produto.valorUnitario` via `useEditarProduto` (correto: "aqui ainda não existe compra"),
   mas nunca em `compra_item`, que é exatamente o ponto cego quando a compra já existe.
5. **`marcar()`** só usava `item.valorPagoUnitario ?? item.valorEstimadoUnit` — o
   `valorEstimadoUnit` obsoleto. O preço vivo do produto já vinha disponível na mesma consulta
   (`ItemComProduto.produto.valorUnitario`), mas era descartado antes de chegar em `marcar`
   (`app/compra/[id].tsx` chamava `marcar(linha.item.item)`, só o `CompraItem`).

### Decisões da reabertura

- **Sincronizar no momento de reabrir a compra (`use-iniciar-compra.ts`), não em tempo real**:
  reabrir é o único momento em que a tela já materializa/atualiza o que está exibindo (mesmo
  princípio de design D1 do fix original) — evita um observer/trigger novo rodando toda vez
  que o preço do produto muda, o que tocaria fora do fluxo de compra.
- **Três camadas de correção, não uma só**: sincronizar na origem (5.1, 5.2) resolve a causa
  raiz; o fallback em `marcar()` (5.3) é rede de segurança pra qualquer caminho que a
  investigação não tenha coberto (ex.: dado legado de antes destes fixes existirem). Cortar
  qualquer uma das três deixa uma classe de caso sem cobertura.
- **`marcar()` passa a receber `ItemComProduto` em vez de `CompraItem`**: o preço vivo do
  produto só está disponível nessa forma — mudança de assinatura necessária, não cosmética.

### Risco novo

- [Risco] Sincronizar `valorEstimadoUnit` ao reabrir pode mascarar uma divergência de preço
  que o usuário QUERIA ver sinalizada (`divergePreco`, `item-compra.tsx`) → Mitigação:
  `divergePreco` compara `valorPagoUnitario` (preço já pago/ajustado) contra o produto, nunca
  `valorEstimadoUnit` — sincronizar o estimado não interfere nesse sinal.
