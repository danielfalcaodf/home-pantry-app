## MODIFIED Requirements

### Requirement: Verificação de integridade sob demanda

O app SHALL oferecer uma verificação que compara, para cada produto, a quantidade materializada com a soma das variações de seus movimentos.

#### Scenario: Banco coerente

- **WHEN** a verificação roda em um banco íntegro
- **THEN** ela informa que nenhuma divergência foi encontrada

#### Scenario: Divergência listada

- **WHEN** existe um produto cuja quantidade não corresponde à soma de seus movimentos
- **THEN** ele é listado com o valor registrado e o valor calculado pelos movimentos

#### Scenario: Verificação não altera dados

- **WHEN** a verificação é executada
- **THEN** nenhuma escrita ocorre no banco, comprovado por teste automatizado que registra a contagem de linhas de `movimento_estoque` e de `produto` imediatamente antes e imediatamente depois da chamada e confirma que as duas contagens são idênticas

#### Scenario: Acessível pelas configurações

- **WHEN** o usuário procura a verificação de integridade
- **THEN** ela está acessível pela tela de configurações
