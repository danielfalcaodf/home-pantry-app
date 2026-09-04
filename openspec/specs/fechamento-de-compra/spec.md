# fechamento-de-compra Specification

## Purpose
TBD - created by archiving change modo-compra-e-fechamento. Update Purpose after archive.
## Requirements
### Requirement: Fechamento atômico

O fechamento da compra SHALL aplicar, em uma **única transação**, todas as reposições dos itens marcados, seus movimentos, as atualizações de preço confirmadas, e a mudança de situação da compra com o total pago e a data de finalização.

#### Scenario: Compra inteira aplicada

- **WHEN** uma compra com oito itens marcados é fechada com sucesso
- **THEN** os oito produtos tiveram a quantidade somada, oito movimentos foram gravados, e a compra está finalizada com total pago e data

#### Scenario: Falha no meio não repõe nada

- **WHEN** o fechamento falha durante o processamento de um dos itens
- **THEN** nenhuma quantidade de produto foi alterada, nenhum movimento foi gravado, e a compra permanece aberta

#### Scenario: Estado parcial é impossível

- **WHEN** o banco é inspecionado após uma falha de fechamento
- **THEN** não existe nenhum produto reposto sem seu movimento correspondente

#### Scenario: Erro informa e permite repetir

- **WHEN** o fechamento falha
- **THEN** a mensagem informa o que houve e oferece tentar novamente, e as marcações do usuário são preservadas

### Requirement: Reposição soma ao estoque

Ao fechar, cada item marcado com produto associado SHALL somar sua quantidade comprada à quantidade atual do produto, gerando um movimento de reposição vinculado àquela compra.

#### Scenario: Quantidade somada

- **WHEN** um produto tem 0,5 unidade e o item comprado é de 2 unidades
- **THEN** sua quantidade passa a 2,5 unidades

#### Scenario: Movimento vinculado à compra

- **WHEN** uma reposição é gravada pelo fechamento
- **THEN** o movimento registra a compra de origem

#### Scenario: Movimento registra autor e resultado

- **WHEN** uma reposição é gravada
- **THEN** o movimento registra o usuário, a data e hora, a variação e a quantidade resultante

#### Scenario: Item avulso não repõe estoque

- **WHEN** um item avulso marcado é processado no fechamento
- **THEN** nenhuma quantidade de produto é alterada e nenhum movimento de estoque é gravado por ele

### Requirement: Itens não marcados permanecem pendentes

Itens não marcados NÃO devem gerar reposição nem movimento, e SHALL continuar aparecendo como pendentes após o fechamento.

#### Scenario: Não marcados ignorados na reposição

- **WHEN** uma compra com quinze itens é fechada com oito marcados
- **THEN** apenas os oito geram reposição e movimento

#### Scenario: Pendentes voltam à lista

- **WHEN** a compra é fechada e um item não marcado continua abaixo do mínimo
- **THEN** ele volta a aparecer na próxima lista de compras

### Requirement: Total pago registrado na compra

O total pago da compra SHALL ser a soma, sobre os itens marcados, da quantidade comprada multiplicada pelo valor pago por unidade, e SHALL ser gravado na compra ao finalizar.

#### Scenario: Total calculado no fechamento

- **WHEN** a compra é fechada
- **THEN** seu total pago corresponde à soma dos itens marcados

#### Scenario: Itens sem preço pago não invalidam

- **WHEN** parte dos itens marcados está sem preço pago
- **THEN** o total considera os demais e a compra é finalizada normalmente

#### Scenario: Situação finalizada exige data

- **WHEN** a compra passa a finalizada
- **THEN** sua data de finalização está preenchida

### Requirement: Confirmação do fechamento

Após fechar, o app SHALL confirmar em linguagem do usuário quantos itens foram repostos.

#### Scenario: Confirmação exibida

- **WHEN** uma compra com oito itens marcados é fechada
- **THEN** a confirmação informa que a compra foi fechada e quantos itens foram repostos

#### Scenario: Vocabulário do usuário

- **WHEN** a confirmação é exibida
- **THEN** ela NÃO usa termos de sistema como "reposição" ou "movimento de estoque"

#### Scenario: Retorno à despensa com estado atualizado

- **WHEN** o fechamento conclui
- **THEN** a despensa reflete as novas quantidades e os itens repostos deixam de estar em falta

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

### Requirement: Fechamento funciona offline

O fechamento da compra SHALL funcionar integralmente sem conexão de rede.

#### Scenario: Fechar sem rede

- **WHEN** o aparelho está sem conexão e o usuário fecha a compra
- **THEN** a operação conclui normalmente

