## Why

O padrão do app é abrir um sheet/modal com o primeiro campo já em foco e o teclado levantado
(igual ao fluxo de "Novo produto"). `sheet-ajuste-compra.tsx` (ajuste de quantidade comprada no
Modo Compra) e `sheet-ajuste-estoque.tsx` (ajuste de quantidade atual no detalhe do produto)
são os dois únicos sheets do padrão `PainelInferior` que ainda não têm `autoFocus` no primeiro
campo — os demais (`sheet-preco-produto`, `sheet-avulso`, `teclado-quantidade`) já foram
corrigidos numa change anterior já arquivada.

## What Changes

- `sheet-ajuste-compra.tsx`: primeiro `CampoTexto` recebe `autoFocus`.
- `sheet-ajuste-estoque.tsx`: primeiro `CampoTexto` recebe `autoFocus`.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `modo-compra`: sheet de ajuste de quantidade comprada abre com foco automático no campo.
- `ajuste-de-estoque`: sheet de ajuste de quantidade atual (aberto pelo detalhe do produto)
  abre com foco automático no campo.

## Impact

- `src/presentation/components/sheet-ajuste-compra.tsx`
- `src/presentation/components/sheet-ajuste-estoque.tsx`
- Testes: RNTL, mesmo padrão já usado para os 3 sheets que já têm `autoFocus`.
