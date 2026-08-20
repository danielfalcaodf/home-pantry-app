## Why

Quando um item da Lista de Compras já tem preço (herdado do produto, `valorEstimadoUnit`) e o
usuário o marca como comprado no Modo Compra sem digitar um "preço pago" explícito, o total da
compra soma zero para esse item — mesmo a UI mostrando visualmente o preço herdado na linha
(`item-compra.tsx`). O spec atual (`modo-compra`, "Preço pago ausente") documenta esse zero
como comportamento pretendido, mas na prática ele conflita com a expectativa do usuário: se o
produto já tem preço cadastrado, marcar como comprado deveria usar esse preço por padrão, do
mesmo jeito que a quantidade planejada já é assumida por padrão quando não há ajuste.

## What Changes

- Ao marcar um item como comprado sem "preço pago" digitado, o preço estimado do produto
  (`valorEstimadoUnit`) passa a ser gravado como `valorPagoUnitario` — e por consequência entra
  no total da compra. Só quando o produto não tem nenhum preço (nem estimado) o item continua
  contribuindo zero.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `modo-compra`: o requisito "Ajuste de quantidade comprada e preço pago" muda — marcar sem
  preço pago explícito assume o preço estimado do produto (quando existir), em vez de sempre
  contribuir zero.

## Impact

- `src/application/compra/use-modo-compra.ts` (`marcar`)
- Testes: `use-modo-compra` (application, RNTL/fake repository) e regressão de
  `src/domain/compra/compra.rules.test.ts` (`totalPago`, sem mudar a função em si)
