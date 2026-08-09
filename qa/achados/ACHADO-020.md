---
id: ACHADO-020
pr: 4
change: design-system-tema
capability: tema-e-tokens
severidade: baixa
fase: F3
estado: aberto
---
## O que quebra

O requisito "Escala de espaço, raio e tipografia" exige que valores arbitrários de espaçamento não sejam usados diretamente em componentes — só a escala fechada de `espaco.ts` (4, 8, 12, 16, 24, 32, 48). Ao contrário de cor (que tem a regra `no-restricted-syntax` dedicada em `eslint.config.js`, auditada na PR-01), não existe nenhuma regra de lint nem teste que impeça um componente de escrever `padding: 13` ou qualquer número fora da escala. O enforcement hoje depende só de disciplina de code review.

## Como reproduzir

```
grep -n "no-restricted-syntax\|espacamento\|spacing" eslint.config.js
```
Só retorna a regra de hex; nenhuma para números de espaçamento.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-02-design-system-tema/specs/tema-e-tokens/spec.md`, requisito "Escala de espaço, raio e tipografia", cenário "Espaçamento restrito à escala".

## Observado (saída real, caminho:linha)

`eslint.config.js` tem `regraSemHexDeCor` mas nenhuma regra equivalente para espaçamento numérico literal em `src/presentation/components/`.

## Change sugerida (slug proposto, escopo de uma frase)

`lint-espacamento-fechado`: avaliar se vale a pena uma regra de lint customizada (mais complexa que a de hex, pois nem todo número é espaçamento — `fontSize`, `flex: 1` etc. são legítimos) ou se um teste de conformidade estilo `componentes-base.test.tsx:120` (grep sobre os arquivos de `presentation/components/`) é mais barato de manter.
