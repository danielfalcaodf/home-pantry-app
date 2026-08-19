**Type:** Correção de Bug

## Why

Usuário relatou em teste manual (screenshot anexado à sessão): na Despensa, a régua de 2px do
`MedidorNivel` (a linha que marca a superfície de preenchimento da "linha d'água") risca/atravessa
o texto do rótulo de quantidade acima dela (ex.: "1 de 3 pacotes" com um traço amarelo cruzando o
meio do texto, "Falta 2" logo ao lado).

Reproduzido na sessão de teste de 2026-08-18 em 3 frações de preenchimento diferentes: ~33%
("Arroz, 1 de 3 pacotes"), ~50% ("Detergente", 1 de 2 un) e ~70% (produto de teste). Nas três, a
régua (posicionada em `bottom: fracao*100%` dentro da altura fixa de 68dp da linha) cruza
exatamente o texto do rótulo de quantidade (fração baixa) ou o título do produto (fração média/
alta) — o texto é centralizado verticalmente (`justifyContent: 'center'`) na mesma altura em que
a régua pode aparecer para qualquer fração entre ~15% e ~75%. É um problema geométrico — nenhuma
faixa de exclusão é reservada entre a régua e o texto — não é ordem de composição/z-index.

O CLAUDE.md exige que a régua marque "a superfície" do preenchimento sem competir com a leitura
do texto (três canais redundantes: altura + cor da régua + rótulo textual — o rótulo precisa
continuar legível).

## What Changes

- `MedidorNivel`/`ItemDespensa` passam a reservar uma faixa de exclusão vertical entre a área em
  que a régua pode desenhar e a área ocupada pelo texto (rótulo de quantidade e título do
  produto) — a régua nunca deve desenhar sobre o texto, independente da fração.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `medidor-linha-dagua`: novo requirement garantindo que a régua de superfície nunca sobrepõe
  visualmente o texto do rótulo/título, em qualquer fração de preenchimento.

## Impact

- `src/presentation/components/medidor-nivel.tsx`
- `src/presentation/components/item-despensa.tsx`
- Puramente `presentation/`, sem mudança de schema ou regra de domínio (a fração calculada em
  `domain/produto/estoque.rules.ts` não muda).
