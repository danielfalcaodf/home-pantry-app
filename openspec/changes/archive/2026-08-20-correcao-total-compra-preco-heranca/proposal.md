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

## Reabertura (2026-08-20)

O usuário reproduziu o mesmo sintoma (Modo Compra mostra 0,00 num item com preço) mesmo
depois do fix acima, num fluxo específico: editar o preço direto na Lista de Compras (ou pelo
Detalhe do Produto na Despensa) e só depois iniciar/marcar a compra. Causa raiz diferente
(não coberta pelo fix original) — ver `design.md`, seção "Reabertura": `compra_item.valorEstimadoUnit`
fica obsoleto quando a linha já existia (compra aberta residual, ou linha de exclusão) antes
do preço ter sido editado.

### What Changes (reabertura)

- `use-iniciar-compra.ts` sincroniza `valorEstimadoUnit` de itens já materializados ao reabrir
  a compra.
- `use-remover-item-lista.ts` grava `valorEstimadoUnit` correto na linha de exclusão criada
  (em vez do default 0 do schema).
- `use-modo-compra.ts` (`marcar`) ganha uma terceira camada de rede de segurança: usa o preço
  vivo do produto quando `valorEstimadoUnit` está zerado — mudou de assinatura, recebe
  `ItemComProduto` em vez de `CompraItem`.
- 8 cenários de teste E2E (Maestro) escritos em `.maestro/bug-preco-*.yaml`, cobrindo o bug por
  ângulos diferentes — **não executados nesta rodada**, tasks pendentes na seção 6 de
  `tasks.md`. A change permanece **aberta** (não arquivada) até a execução real confirmar os 8.

## Impact (reabertura)

- `src/application/compra/use-iniciar-compra.ts`, `src/application/compra/use-iniciar-compra.test.ts`
- `src/application/lista/use-remover-item-lista.ts`, `.../use-remover-item-lista.test.ts`
- `src/application/compra/use-modo-compra.ts`, `.../use-modo-compra.test.ts` (assinatura de
  `marcar` mudou de `CompraItem` para `ItemComProduto`)
- `app/compra/[id].tsx`, `app/compra/[id].test.tsx`, `app/compra/toques-consecutivos.test.tsx`
  (site de uso e mocks ajustados pra nova assinatura)
- `.maestro/bug-preco-editado-lista-modo-compra.yaml`
- `.maestro/bug-preco-editado-despensa-modo-compra.yaml`
- `.maestro/bug-preco-compra-residual-reabrir.yaml`
- `.maestro/bug-preco-item-reativado-fora-da-lista.yaml`
- `.maestro/bug-preco-editar-existente-antes-compra.yaml`
- `.maestro/bug-preco-total-multiplos-itens.yaml`
- `.maestro/bug-preco-persistencia-apos-fechar-compra.yaml`
- `.maestro/bug-preco-apos-reiniciar-app.yaml`
