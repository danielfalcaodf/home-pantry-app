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
