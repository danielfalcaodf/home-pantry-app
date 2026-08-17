**Type:** Correção de Bug

## Why

Usuário relatou: "alguns modais que botão de mult escolhas não selecionada nenhum" — dentro de
alguns bottom sheets, nenhum chip de múltipla escolha aparenta estar selecionado, mesmo depois
de tocar numa opção. Confirmado ao vivo no emulador em dois pontos: o sheet "Adicionar item
avulso" (chips de "Medida": un/kg/g/L/ml/pacote/caixa) e o sheet "Corrigir estoque" (chips de
"Motivo": Perda/Vencimento/Correção) — em ambos, nenhum chip muda de aparência ao ser tocado.

Causa raiz: `ChipEstado` (`src/presentation/components/chip-estado.tsx`) usa `tema.bg.raised`
como fundo do estado ativo quando nenhuma prop `cor` é passada — e é exatamente essa mesma cor
que todo `<Modal>`/bottom sheet do app usa como seu próprio fundo. O "fundo do chip ativo" fica
literalmente idêntico ao fundo do modal atrás dele, em qualquer tema. Isso já viola o requirement
existente "Chip ativo é distinguível" (`openspec/specs/componentes-base/spec.md`), que hoje só
cobre o caso em que uma `cor` de estado é passada.

## What Changes

- `ChipEstado` deixa de depender de `tema.bg.raised` como fallback de fundo ativo quando não há
  `cor`. Passa a usar um fundo que nunca coincide com o fundo do container ao redor (seja ele a
  tela cheia, seja um bottom sheet), garantindo contraste visível em qualquer contexto.
- Correção só no componente compartilhado — nenhum dos 5 pontos de uso (`sheet-avulso.tsx`,
  `sheet-ajuste-estoque.tsx`, `item-compra.tsx`, `formulario-produto.tsx`) muda sua chamada.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `componentes-base`: o requirement "Chip de estado com contagem" ganha cobertura explícita do
  caso sem `cor` associada (uso como controle de múltipla escolha genérico, não filtro por
  estado do domínio) — o chip ativo precisa ser distinguível do fundo do container mesmo nesse
  caso, inclusive dentro de um bottom sheet.

## Impact

- `src/presentation/components/chip-estado.tsx` — fallback de `fundoAtivo`.
- Efeito colateral positivo em todo consumidor de `ChipEstado` sem `cor` dentro de um sheet,
  presente ou futuro — corrigido na origem, não em cada chamador.
- Sem mudança de schema, repositório ou caso de uso; puramente `presentation/`.
