---
id: ACHADO-008
pr: 1
change: bootstrap-projeto-expo
capability: fronteiras-de-camada
severidade: baixa
fase: F3
estado: virou-change
change-correcao: guardas-de-tipo-lint-e-tooling
---
## O que quebra

As regras de ESLint que implementam a fronteira de camadas (`boundaries/dependencies` para a direção de dependência, `no-restricted-imports` para import proibido em `src/domain/`, e `no-restricted-syntax` para hex literal fora dos tokens) existem em `eslint.config.js`, mas nenhuma delas tem um teste automatizado que force a violação e confirme que o linter a rejeita. A cobertura hoje é só "a regra está configurada", nunca "a regra dispara quando deveria".

## Como reproduzir

```
grep -rln "RuleTester\|boundaries" --include="*.test.*" src/
```
Não retorna nenhum arquivo.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-02-bootstrap-projeto-expo/specs/fronteiras-de-camada/spec.md`, cenários "Import proibido é rejeitado", "Caso de uso depende da interface, não da implementação", "Apresentação não acessa o banco" e "Hex em componente é erro" — todos descrevem um `WHEN` de violação e um `THEN` de rejeição pelo linter, o que pressupõe uma verificação executável, não apenas a existência da regra.

## Observado (saída real, caminho:linha)

`eslint.config.js:1-140` contém as regras; nenhum arquivo de teste em `src/**/*.test.*` ou `scripts/**` exercita um caso positivo (violação real) contra o ESLint programático (`ESLint.lintText` ou `RuleTester`).

## Change sugerida (slug proposto, escopo de uma frase)

`teste-fronteira-eslint-regras`: adicionar um teste Jest que roda o ESLint programaticamente sobre fixtures inline (um arquivo de domínio importando `react`, um componente com hex literal, um `application/` importando `infrastructure/`) e afirma que cada um produz erro.
