# atualizacao-de-preco-referencia Specification

## Purpose
TBD - created by archiving change modo-compra-e-fechamento. Update Purpose after archive.
## Requirements
### Requirement: Divergência de preço é detectada e revisada no fechamento

Quando o valor pago por unidade diferir do valor unitário cadastrado do produto, o app SHALL
incluir o produto em uma revisão agrupada imediatamente antes do fechamento da compra. A revisão
NÃO deve interromper a marcação de itens. Ela SHALL explicar que atualizar muda o preço de
referência usado em compras futuras, sem alterar o valor da compra atual, e SHALL permitir
atualizar todos os preços divergentes, manter todos os preços salvos ou escolher individualmente
quais atualizar.

#### Scenario: Sem revisão quando todos os preços são iguais

- **WHEN** o usuário fecha uma compra e nenhum item marcado tem preço pago diferente do preço
  cadastrado
- **THEN** a compra é fechada sem mostrar revisão de preços

#### Scenario: Revisão agrupada ao divergir

- **WHEN** três itens marcados têm preço pago diferente do cadastrado e o usuário aciona Fechar
  compra
- **THEN** o app apresenta uma única revisão informando que três preços podem atualizar as
  estimativas de compras futuras

#### Scenario: Atualizar todos os preços divergentes

- **WHEN** o usuário escolhe atualizar todos na revisão agrupada
- **THEN** todos os produtos divergentes marcados são selecionados para atualização no fechamento

#### Scenario: Manter todos os preços salvos

- **WHEN** o usuário escolhe manter os preços salvos na revisão agrupada
- **THEN** nenhum produto divergente é selecionado para atualização no fechamento

#### Scenario: Escolher exceções por produto

- **WHEN** o usuário abre a escolha individual de preços
- **THEN** cada item divergente mostra produto, preço salvo e preço pago, e pode ser selecionado ou
  desmarcado independentemente antes de confirmar

#### Scenario: Produto sem preço cadastrado

- **WHEN** um produto marcado tem preço cadastrado zero e preço pago maior que zero
- **THEN** a revisão o apresenta como primeiro registro de preço e permite selecioná-lo para
  atualização

#### Scenario: Item avulso não entra na revisão

- **WHEN** um item avulso marcado tem preço pago informado
- **THEN** ele não aparece na revisão de preço de referência

#### Scenario: Item desmarcado não atualiza referência

- **WHEN** um item com preço divergente é desmarcado antes da confirmação do fechamento
- **THEN** ele não aparece na revisão e seu preço de referência não é atualizado

### Requirement: Atualização apenas com confirmação explícita

O valor unitário do produto SHALL ser alterado **apenas** quando o usuário o selecionar
explicitamente na revisão de preços e confirmar o fechamento. A ausência de seleção ou a escolha
de manter os preços salvos SHALL preservar o valor cadastrado.

#### Scenario: Confirmação selecionada atualiza

- **WHEN** o usuário seleciona um produto na revisão e confirma o fechamento
- **THEN** o valor unitário daquele produto passa a ser o valor pago

#### Scenario: Produto não selecionado preserva

- **WHEN** o usuário confirma o fechamento sem selecionar um produto divergente
- **THEN** o valor unitário daquele produto permanece o anterior

#### Scenario: Atualização acontece no fechamento

- **WHEN** o usuário seleciona preços na revisão mas ainda não confirma o fechamento
- **THEN** nenhum valor unitário de produto foi alterado

#### Scenario: Atualização é parte da transação

- **WHEN** o fechamento falha
- **THEN** nenhum valor unitário de produto foi alterado

### Requirement: Item avulso não tem preço de referência

Itens avulsos SHALL ser tratados como sem preço de referência, e NÃO devem gerar pergunta de atualização de preço, pois não correspondem a nenhum produto cadastrado.

#### Scenario: Avulso sem pergunta

- **WHEN** um item avulso marcado tem preço pago informado
- **THEN** nenhuma pergunta de atualização de preço de referência é feita
