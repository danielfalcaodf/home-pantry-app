**Type:** Bug Fix

## Why

O chip "Faltando" da tela Resumo mostra um número diferente e menor do que o chip "Faltando" da Despensa para os mesmos dados, no mesmo instante — reproduzido ao vivo com "Faltando, 0" no Resumo enquanto a Despensa mostrava "Faltando, 37" (ACHADO-053): a Despensa soma `critico + emFalta` (`agrupar-despensa.ts:65`, testado), o Resumo lê só `contagensPorEstado['emFalta']`. Mesmo rótulo, duas semânticas — violação direta do vocabulário do usuário. No mesmo componente de chip, o estado ativo usa `tema.bg.raised` (cor neutra) em vez de "fundo na cor do estado com opacidade reduzida" exigido pelo spec `componentes-base`, e a prop `ativo` não tem nenhum teste (ACHADO-017). Dois cenários já especificados de `tela-despensa` (contagem reativa sem reload; chip com contagem zero continua acionável) também estão sem teste (ACHADO-050).

## What Changes

- Unificar a contagem "Faltando" do Resumo com a da Despensa: reusar `agrupar-despensa.ts` (ou somar explicitamente `critico + emFalta`) em `app/(tabs)/resumo.tsx`.
- Corrigir o fundo do `ChipEstado` ativo para `cor` do estado + `tema.fillOpacity`, conforme o spec `componentes-base` (o spec é a referência; a implementação diverge).
- Cobrir com testes: prop `ativo` do chip, reatividade da contagem sem reload e chip com contagem zero acionável.

## Capabilities

### New Capabilities
(nenhuma)

### Modified Capabilities
- `resumo-de-valores`: o requisito "Contagens de apoio" passa a fixar que o rótulo "Faltando" tem a mesma semântica da Despensa (`critico + emFalta`), nunca a leitura bruta de um único estado.

Nota: o fundo do chip ativo (ACHADO-017) e os cenários de reatividade/acionabilidade (ACHADO-050) já estão especificados em `componentes-base` e `tela-despensa` — são lacunas de implementação/teste, sem delta de spec.

## Impact

- `app/(tabs)/resumo.tsx` — fonte da contagem do chip "Faltando".
- `src/presentation/components/chip-estado.tsx` — fundo do estado ativo.
- `src/presentation/components/chip-estado.test.tsx`, `componentes-base.test.tsx` — testes novos.
- Nenhum impacto em domínio, banco ou schema.

### Dependencies between changes

Depende de `correcao-fuso-horario-testes` (ORDER.md 01) apenas pelo gate de testes verde. Toca `chip-estado.tsx` e `resumo.tsx`, também alvo de testes na change `cobertura-componentes-apresentacao` (ORDER.md 09), que vem depois e assume o comportamento já corrigido.
