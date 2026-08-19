## MODIFIED Requirements

### Requirement: Chip de estado com contagem

O sistema SHALL fornecer um componente de chip usado para filtrar, exibindo rótulo e contagem, com estado ativo distinguível. O chip ativo SHALL permanecer distinguível do fundo do container ao redor mesmo quando usado sem uma cor de estado do domínio associada (ex.: como controle de múltipla escolha genérico dentro de um bottom sheet).

#### Scenario: Chip ativo é distinguível

- **WHEN** um chip está ativo
- **THEN** ele recebe fundo na cor do estado com opacidade reduzida e texto na cor cheia

#### Scenario: Contagem faz parte do rótulo acessível

- **WHEN** o leitor de tela anuncia o chip
- **THEN** ele inclui o rótulo e a contagem

#### Scenario: Chip ativo sem cor de estado, dentro de um bottom sheet

- **WHEN** um chip está ativo, nenhuma cor de estado do domínio foi passada, e o chip está dentro
  de um bottom sheet (fundo do container igual ao fundo elevado do tema)
- **THEN** o fundo do chip ativo continua visualmente distinto do fundo do container ao redor

#### Scenario: Chip ativo sem cor de estado, em tela cheia

- **WHEN** um chip está ativo, nenhuma cor de estado do domínio foi passada, e o chip está numa
  tela cheia (fundo do container igual ao fundo base do tema)
- **THEN** o fundo do chip ativo continua visualmente distinto do fundo do container ao redor
