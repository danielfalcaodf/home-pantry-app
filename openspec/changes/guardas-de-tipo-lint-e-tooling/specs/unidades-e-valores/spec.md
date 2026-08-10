## MODIFIED Requirements

### Requirement: Classificação de unidade divisível e indivisível

O domínio SHALL classificar `un`, `pacote` e `caixa` como indivisíveis, e `kg`, `g`, `L`, `ml` como divisíveis.

#### Scenario: Unidade indivisível

- **WHEN** a unidade consultada é pacote
- **THEN** ela é classificada como indivisível

#### Scenario: Unidade divisível

- **WHEN** a unidade consultada é quilograma
- **THEN** ela é classificada como divisível

#### Scenario: Conjunto fechado de unidades

- **WHEN** um valor fora das sete unidades suportadas é usado
- **THEN** o compilador de tipos rejeita o valor, comprovado por um teste de tipo (`@ts-expect-error` atribuindo uma string arbitrária, ex. `'tonelada'`, a uma variável tipada `Unidade`) validado via `tsc --noEmit`, e não apenas pela forma do tipo literal derivado de `UNIDADES as const`
