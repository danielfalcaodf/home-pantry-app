## ADDED Requirements

### Requirement: Régua de superfície não sobrepõe texto

A régua de 2px que marca a superfície do preenchimento SHALL nunca desenhar sobre o texto do
rótulo de quantidade nem sobre o título do produto, em nenhuma fração de preenchimento.

#### Scenario: Fração baixa não risca o rótulo de quantidade

- **WHEN** um item tem fração de preenchimento baixa (ex.: ~33%, régua próxima da faixa vertical
  onde o rótulo de quantidade é renderizado)
- **THEN** a régua não cruza visualmente o texto do rótulo de quantidade

#### Scenario: Fração média/alta não risca o título do produto

- **WHEN** um item tem fração de preenchimento média ou alta (ex.: 50%-70%, régua próxima da
  faixa vertical onde o título do produto é renderizado)
- **THEN** a régua não cruza visualmente o texto do título do produto
