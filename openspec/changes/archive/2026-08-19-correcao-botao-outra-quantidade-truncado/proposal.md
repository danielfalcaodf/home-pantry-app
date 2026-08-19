**Type:** Correção de Bug

## Why

Achado durante a verificação da change `correcao-acabamento-header-stepper-e-affordance` (Ordem
11) na sessão de teste de 2026-08-18: o botão "Outra quantidade" (terceiro de três botões em
linha, junto de "Usei"/"Repus", em `app/produto/[id].tsx`) já renderiza truncado
("Outra qua...") mesmo em fonte padrão do sistema (`font_scale=1.0`), nunca mostra o texto
completo em nenhuma condição — piora para "Outra q..." com `font_scale=1.3`.

A change 11 adicionou `numberOfLines={1}` ao `Botao` justamente para resolver a quebra de linha
feia relatada em fonte ampliada (achado 3 original), e isso funcionou — mas revelou que o
container do terceiro botão já é estreito demais mesmo na condição normal: o `numberOfLines={1}`
trocou "quebra feia" por "sempre ilegível", sem resolver a causa raiz (largura do container).

## What Changes

- Dar mais espaço ao terceiro botão do grupo (ex.: ajustar `flex`/proporção dos três botões) ou
  abreviar o rótulo padrão para algo que caiba sem cortar em fonte normal (ex.: "Outra qtd.") —
  decisão final cabe à implementação, com preferência por dar mais espaço se não prejudicar os
  outros dois botões, já que abreviar muda o texto visível ao usuário.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

(nenhuma — ajuste de layout dentro do comportamento já especificado para o grupo de botões de
ação rápida, sem mudança de requirement de spec)

## Impact

- `app/produto/[id].tsx` — layout do grupo de três botões de ação rápida.
- Possivelmente `src/presentation/components/botao.tsx` se a solução escolhida for mudar o
  `flex` padrão do componente em vez de só o layout do grupo específico.
