## ADDED Requirements

### Requirement: Rótulo de botão em grupo permanece legível em fonte padrão

Um botão pertencente a um grupo de botões em linha SHALL exibir seu rótulo completo, sem
truncamento, quando a fonte do sistema está na escala padrão (1.0x).

#### Scenario: Rótulo completo em fonte padrão

- **WHEN** um botão de um grupo em linha (ex.: "Outra quantidade" no detalhe de produto) é
  renderizado com a fonte do sistema em 1.0x
- **THEN** o texto do rótulo aparece por completo, sem reticências de truncamento
