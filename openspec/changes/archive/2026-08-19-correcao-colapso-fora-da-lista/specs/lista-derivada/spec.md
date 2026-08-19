## ADDED Requirements

### Requirement: Seção "Fora da lista por agora" é colapsável e não esconde a lista principal

A seção "Fora da lista por agora" SHALL iniciar colapsada por padrão, mostrando um cabeçalho
tocável com a contagem de itens. A lista de compras ativa SHALL permanecer a área rolável
dominante da tela, independente de quantos itens existirem na seção desativados.

#### Scenario: Muitos itens fora da lista não escondem a lista ativa

- **WHEN** a seção "Fora da lista por agora" tem 10 ou mais itens
- **THEN** a lista de compras ativa continua ocupando a maior parte da tela, com múltiplos itens
  visíveis sem exigir rolagem excessiva

#### Scenario: Seção desativados inicia recolhida

- **WHEN** o usuário abre a aba Lista com itens presentes na seção "Fora da lista por agora"
- **THEN** a seção aparece recolhida por padrão, mostrando a contagem de itens, e expande ao
  toque no cabeçalho
