## MODIFIED Requirements

### Requirement: Vocabulário consistente do começo ao fim

A ação SHALL manter o mesmo nome em todos os pontos: o botão, a confirmação, o histórico **e o rótulo de acessibilidade falado pelo leitor de tela**. Termos de sistema NÃO devem aparecer na interface, nem no texto visível nem no que é falado.

#### Scenario: Nomes coerentes

- **WHEN** o usuário registra um consumo
- **THEN** o botão, a mensagem de confirmação e o histórico usam o mesmo vocabulário de usuário

#### Scenario: Ausência de jargão

- **WHEN** qualquer texto deste fluxo é exibido
- **THEN** ele NÃO contém "dar baixa", "movimento de estoque" nem "reposição"

#### Scenario: Rótulo de acessibilidade usa o mesmo verbo do botão

- **WHEN** o leitor de tela anuncia o botão de decremento do stepper de um item
- **THEN** o rótulo falado usa o verbo "Usei" (por exemplo, "Usei 1 kg de Carne moída"), e NÃO o verbo de sistema "Registrar consumo"
