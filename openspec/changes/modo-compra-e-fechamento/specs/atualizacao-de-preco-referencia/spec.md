## ADDED Requirements

### Requirement: Divergência de preço é detectada e perguntada

Quando o valor pago por unidade diferir do valor unitário cadastrado do produto, o app SHALL perguntar ao usuário se deseja atualizar o preço de referência.

#### Scenario: Pergunta ao divergir

- **WHEN** o valor unitário cadastrado é R$ 8,90 e o usuário informa R$ 9,50 como pago
- **THEN** o app pergunta se o preço de referência deve ser atualizado

#### Scenario: Sem pergunta quando igual

- **WHEN** o valor pago é igual ao cadastrado
- **THEN** nenhuma pergunta é feita

#### Scenario: Produto sem preço cadastrado

- **WHEN** o produto tem valor unitário zero e um preço pago maior que zero é informado
- **THEN** o app oferece registrar aquele preço como referência

#### Scenario: Pergunta não interrompe a compra

- **WHEN** a pergunta é apresentada durante o modo compra
- **THEN** ela pode ser respondida sem sair da tela e sem bloquear a marcação de outros itens

### Requirement: Atualização apenas com confirmação explícita

O valor unitário do produto SHALL ser alterado **apenas** quando o usuário confirmar. A ausência de resposta ou a recusa SHALL preservar o valor cadastrado.

#### Scenario: Confirmação atualiza

- **WHEN** o usuário confirma a atualização e a compra é fechada
- **THEN** o valor unitário do produto passa a ser o valor pago

#### Scenario: Recusa preserva

- **WHEN** o usuário recusa a atualização e a compra é fechada
- **THEN** o valor unitário do produto permanece o anterior

#### Scenario: Sem resposta preserva

- **WHEN** o usuário fecha a compra sem responder à pergunta de um item
- **THEN** o valor unitário daquele produto permanece o anterior

#### Scenario: Atualização acontece no fechamento

- **WHEN** o usuário confirma a atualização mas ainda não fechou a compra
- **THEN** o valor unitário do produto ainda não foi alterado

#### Scenario: Atualização é parte da transação

- **WHEN** o fechamento falha
- **THEN** nenhum valor unitário de produto foi alterado

### Requirement: Item avulso não tem preço de referência

Itens avulsos SHALL ser tratados como sem preço de referência, e NÃO devem gerar pergunta de atualização de preço, pois não correspondem a nenhum produto cadastrado.

#### Scenario: Avulso sem pergunta

- **WHEN** um item avulso marcado tem preço pago informado
- **THEN** nenhuma pergunta de atualização de preço de referência é feita
