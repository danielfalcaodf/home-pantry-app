## ADDED Requirements

### Requirement: Layout do formulário se adapta ao contexto de uso

O formulário de produto SHALL adaptar a altura do seu container ao contexto em que é usado —
tela cheia (cadastro) ou embutido entre outros blocos (detalhe do produto) — sem deixar vão
vazio desproporcional nem cortar visualmente conteúdo expandido.

#### Scenario: Formulário embutido sem vão vazio grande

- **WHEN** o formulário aparece embutido no detalhe do produto, com "Mais opções" recolhido
- **THEN** o espaço entre o fim dos campos visíveis e o botão de ação não é desproporcionalmente
  maior que o espaçamento entre os demais campos do formulário

#### Scenario: Formulário embutido não corta conteúdo expandido

- **WHEN** "Mais opções" é expandido no formulário embutido
- **THEN** os campos adicionais ficam visíveis sem aparência de corte sob o botão de ação fixo
