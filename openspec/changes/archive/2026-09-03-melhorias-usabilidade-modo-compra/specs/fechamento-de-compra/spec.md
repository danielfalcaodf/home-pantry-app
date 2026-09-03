## ADDED Requirements

### Requirement: Revisão de preços precede o fechamento quando necessária

Antes de executar o fechamento, o app SHALL identificar itens marcados com produto associado cujo
preço pago diverge do preço de referência. Quando existir ao menos um, SHALL concluir a revisão de
preços escolhida pelo usuário antes de iniciar a transação de fechamento. Quando não existir
nenhuma divergência, SHALL fechar diretamente. A transação SHALL receber somente o conjunto de
produtos explicitamente selecionados na revisão.

#### Scenario: Fechar diretamente sem divergência

- **WHEN** o usuário aciona Fechar compra e não há preço divergente em item marcado
- **THEN** o app inicia o fechamento sem apresentar etapa adicional

#### Scenario: Fechar após revisar divergências

- **WHEN** o usuário confirma sua escolha na revisão de preços divergentes
- **THEN** o app executa o fechamento com apenas os produtos selecionados para atualização

#### Scenario: Cancelar revisão não fecha compra

- **WHEN** o usuário fecha ou cancela a revisão de preços
- **THEN** a compra permanece aberta, suas marcações e preços pagos são preservados e nenhuma
  reposição ou preço de referência é aplicado

#### Scenario: Falha após revisão preserva atomicidade

- **WHEN** a revisão foi confirmada e a transação de fechamento falha
- **THEN** nenhuma reposição, movimento, finalização de compra ou atualização de preço de
  referência é persistida
