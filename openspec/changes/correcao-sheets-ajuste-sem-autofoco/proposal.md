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

**Atualização (2026-08-21, mesma rodada):** `autoFocus` na montagem se mostrou insuficiente —
bug real confirmado em dispositivo físico e reproduzido no emulador (ver `tasks.md` §6). Causa
raiz corrigida na base compartilhada `PainelInferior` (nova prop `onAberto`, disparada pelo
`onShow` nativo do `Modal` com um atraso curto — ver comentário em `painel-inferior.tsx`), e o
mesmo padrão (`ref` + `onAberto`, sem `autoFocus`) foi estendido, a pedido do usuário na mesma
sessão, aos 3 sheets que compartilhavam o defeito pré-existente (`sheet-preco-produto`,
`sheet-avulso`, `teclado-quantidade` — antes fora de escopo, task 6.2), já que a correção é a
mesma e o custo de aplicá-la é mínimo por já estar centralizada.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `modo-compra`: sheet de ajuste de quantidade comprada abre com foco automático no campo e
  teclado levantado (não só foco lógico).
- `ajuste-de-estoque`: sheet de ajuste de quantidade atual (aberto pelo detalhe do produto)
  abre com foco automático no campo e teclado levantado.
- `lista-de-compras`: sheet de preço ("Quanto costuma custar") e sheet de item avulso
  ("Adicionar item avulso") abrem com foco automático e teclado levantado.
- `modo-compra`: `TecladoQuantidade` ("Outra quantidade") abre com foco automático e teclado
  levantado.

## Impact

- `src/presentation/components/painel-inferior.tsx` (prop `onAberto` + atraso de foco)
- `src/presentation/components/campo-texto.tsx` (`forwardRef`)
- `src/presentation/components/sheet-ajuste-compra.tsx`
- `src/presentation/components/sheet-ajuste-estoque.tsx`
- `src/presentation/components/sheet-preco-produto.tsx`
- `src/presentation/components/sheet-avulso.tsx`
- `src/presentation/components/teclado-quantidade.tsx`
- Testes: RNTL, mesmo padrão já usado para os 3 sheets que já tinham `autoFocus`; novo teste em
  `painel-inferior.test.tsx` prova o mecanismo de `onAberto` com `jest.useFakeTimers()`.
