# diagnostico-de-integridade

## Requirements

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
- **THEN** nenhuma escrita ocorre no banco

#### Scenario: Acessível pelas configurações

- **WHEN** o usuário procura a verificação de integridade
- **THEN** ela está acessível pela tela de configurações

### Requirement: Correção de divergência registra ajuste

Corrigir uma divergência SHALL gravar um movimento de ajuste levando a quantidade ao valor calculado pelos movimentos. A quantidade NÃO deve ser alterada em silêncio.

#### Scenario: Correção individual

- **WHEN** o usuário corrige uma divergência de um produto
- **THEN** um movimento de ajuste é gravado e a quantidade passa a corresponder à soma dos movimentos

#### Scenario: Correção em bloco

- **WHEN** o usuário corrige todas as divergências de uma vez
- **THEN** cada produto recebe seu movimento de ajuste, em uma única transação

#### Scenario: Verificação limpa após corrigir

- **WHEN** a verificação é executada novamente após a correção
- **THEN** nenhuma divergência é encontrada

#### Scenario: Correção é opcional

- **WHEN** divergências são listadas
- **THEN** o usuário pode sair sem corrigir, e nada é alterado

### Requirement: Diagnóstico informa sem alarmar

A apresentação da verificação SHALL descrever o que foi encontrado e o que fazer, sem linguagem alarmante e sem pedido de desculpas.

#### Scenario: Resultado sem divergência é afirmativo

- **WHEN** nenhuma divergência é encontrada
- **THEN** a mensagem confirma que os números estão coerentes

#### Scenario: Resultado com divergência é acionável

- **WHEN** divergências são encontradas
- **THEN** a mensagem explica o que significa e oferece a ação de corrigir
