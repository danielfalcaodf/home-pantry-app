# Correção do agrupamento no Modo Compra

**Type:** Correção de Bug

## Why

O Modo Compra preserva a ordenação por categoria vinda da Lista, mas **não renderiza os
cabeçalhos de categoria**. Sem os rótulos, a ordem parece aleatória justamente na tela que a
pessoa usa andando pelos corredores do mercado — que é onde o agrupamento por categoria serve
para alguma coisa.

É a inversão exata da prioridade: na aba Lista, onde a pessoa está sentada em casa, os
cabeçalhos aparecem; no supermercado, com o carrinho na mão, somem.

## What Changes

- **A-08 — Modo Compra mantém a ordem por categoria e descarta os cabeçalhos.** Verificado no
  aparelho: na aba Lista os itens vêm sob "CARNES", "GRÃOS E MASSAS", "PADARIA"; no Modo Compra
  a mesma ordenação é preservada (Carne moída → Frango → Arroz → Aveia → … → Condicionador),
  mas nenhum cabeçalho é renderizado.

- O Modo Compra passa a renderizar os cabeçalhos de categoria, respeitando a mesma preferência
  de agrupamento da Lista (`usePreferenciaDeAgrupamento`) e a mesma lógica já testada
  (`agruparListaPorCategoria` / `listaContinua`, em `src/presentation/format/agrupar-lista.ts`),
  incluindo a regra de "Sem categoria" sempre por último.

- Nenhuma mudança de fluxo, de marcação de item ou de fechamento de compra.

## Capabilities

### Modified Capabilities

- `modo-compra`: ganha requisito de agrupamento visual. Hoje a capability especifica a tela
  única, a marcação item a item, o ajuste e o rodapé — mas não diz nada sobre como os itens são
  organizados na tela, e foi por essa lacuna que a ordenação chegou sem os rótulos.

## Impact

- **Código**: a tela do Modo Compra e `src/presentation/components/item-compra.tsx` no que
  toca à composição da lista. Reaproveita `src/presentation/format/agrupar-lista.ts`, que já
  existe, já é testado e já é usado pela aba Lista — não é lógica nova.
- **Dependências**: nenhuma nova.
- **Camadas**: só `presentation/` e `app/`.

### Dependências entre changes

Depende de `correcao-lista-de-compras` (Ordem 2) no sentido de partir do código que ela
entregou para o Modo Compra (affordance do ajuste por toque longo em `item-compra.tsx`) — mas
aquela change está 100% concluída e mergeada em `develop`, então não há espera.

Sem sobreposição com as demais changes do lote de auditoria: a 3 toca layouts e provider de
tema, a 4 toca os painéis inferiores, a 5 e a 6 tocam a aba Lista e a busca. Esta é a única
que toca a composição da tela de Compra.
