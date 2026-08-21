# modo-compra Specification

## Purpose
TBD - created by archiving change modo-compra-e-fechamento. Update Purpose after archive.
## Requirements
### Requirement: Tela única sem navegação interna

O modo compra SHALL ser uma tela única. Navegação para subtelas durante a compra NÃO deve existir.

#### Scenario: Sem subtelas

- **WHEN** o usuário está no modo compra e marca itens
- **THEN** nenhuma navegação para outra tela ocorre

#### Scenario: Ajuste sem sair da tela

- **WHEN** o usuário ajusta a quantidade comprada ou o preço pago de um item
- **THEN** o ajuste acontece na própria tela ou em painel sobreposto, sem trocar de rota

#### Scenario: Sair exige intenção com itens marcados

- **WHEN** o usuário aciona o botão de voltar durante uma compra com pelo menos um item marcado
- **THEN** uma confirmação pergunta se ele quer sair, informando que a compra continua aberta e o progresso é preservado, e a navegação só ocorre se ele confirmar

#### Scenario: Voltar sem itens marcados não pede confirmação

- **WHEN** o usuário aciona o botão de voltar durante uma compra sem nenhum item marcado
- **THEN** o app volta para a tela anterior direto, sem exibir confirmação

#### Scenario: Cancelar a confirmação preserva o progresso

- **WHEN** o usuário aciona voltar com itens marcados e opta por não sair na confirmação
- **THEN** ele permanece no modo compra e nenhuma marcação é perdida

### Requirement: Tela mantida acordada

Enquanto o modo compra estiver ativo, o aparelho SHALL ser impedido de apagar a tela por inatividade.

#### Scenario: Tela permanece acesa

- **WHEN** o modo compra está aberto e o usuário fica sem tocar por vários minutos
- **THEN** a tela não apaga por inatividade

#### Scenario: Comportamento normal restaurado ao sair

- **WHEN** o usuário sai do modo compra
- **THEN** o comportamento padrão de apagar a tela volta a valer

### Requirement: Marcação item a item

Cada item SHALL ter um controle de marcação quadrado com alvo de toque adequado ao uso com uma mão. Ao ser marcado, o item SHALL indicar visualmente que já foi pego.

#### Scenario: Item marcado muda de aparência

- **WHEN** um item é marcado
- **THEN** seu nome passa à cor secundária com risco horizontal e a linha perde todo o preenchimento

#### Scenario: Desmarcar reverte

- **WHEN** um item marcado é desmarcado
- **THEN** ele volta à aparência anterior e sai do total corrente

#### Scenario: Alvo de toque adequado

- **WHEN** o controle de marcação é medido
- **THEN** sua área tocável tem no mínimo 48 por 48 pontos independentes

#### Scenario: Controle quadrado, não circular

- **WHEN** o controle de marcação é renderizado
- **THEN** ele é quadrado, indicando ação de riscar uma lista

### Requirement: Ajuste de quantidade comprada e preço pago

Ao marcar um item, o usuário SHALL poder ajustar a quantidade realmente comprada e o valor
pago por unidade. Sem ajuste, a quantidade planejada SHALL ser assumida como comprada, e o
preço estimado do produto (quando existir) SHALL ser assumido como preço pago. Ao abrir o
sheet de ajuste, o primeiro campo SHALL receber foco automático e o teclado SHALL ser
levantado. Ao reabrir uma compra aberta com item já materializado e não comprado, o preço
estimado desse item SHALL ser sincronizado com o preço atual do produto, caso tenha mudado
desde a materialização.

#### Scenario: Padrão assume o planejado

- **WHEN** um item é marcado sem ajuste
- **THEN** a quantidade comprada assumida é a planejada

#### Scenario: Quantidade ajustada

- **WHEN** o usuário informa uma quantidade comprada diferente da planejada
- **THEN** o valor informado é o considerado na reposição e no total

#### Scenario: Preço pago informado

- **WHEN** o usuário informa o valor pago por unidade
- **THEN** o total corrente é recalculado com esse valor, sobrescrevendo qualquer preço
  estimado assumido por padrão

#### Scenario: Preço pago ausente com preço estimado no produto

- **WHEN** o item é marcado sem informar preço pago e o produto tem preço estimado
  (`valorEstimadoUnit`)
- **THEN** o preço estimado é gravado como preço pago e contribui para o total corrente

#### Scenario: Preço pago ausente

- **WHEN** o item é marcado sem informar preço pago e o produto não tem preço estimado
- **THEN** ele contribui com zero para o total corrente e não impede o fechamento

#### Scenario: Preço editado depois da materialização é sincronizado ao reabrir a compra

- **WHEN** um item já foi materializado numa compra aberta com preço estimado zero, o preço do
  produto é editado (na Lista ou na Despensa), e a compra é reaberta antes de finalizar
- **THEN** o preço estimado desse item passa a refletir o preço atual do produto

#### Scenario: Item marcado exige quantidade

- **WHEN** um item está marcado como comprado
- **THEN** sua quantidade comprada está definida, e o banco rejeita o contrário

#### Scenario: Sheet de ajuste abre com foco automático

- **WHEN** o usuário abre o sheet de ajuste de quantidade comprada
- **THEN** o primeiro campo já está em foco e o teclado já está visível, sem toque adicional

### Requirement: Rodapé de acompanhamento

O modo compra SHALL exibir, em rodapé fixo, quantos itens foram marcados de quantos, e o total corrente do que já está no carrinho, em família monoespaçada. O rodapé SHALL aparecer imediatamente acima do botão "Fechar compra", na mesma região inferior da tela.

#### Scenario: Contador atualiza a cada marcação

- **WHEN** o oitavo item de quinze é marcado
- **THEN** o rodapé indica oito de quinze

#### Scenario: Total corrente atualiza

- **WHEN** um item com preço é marcado
- **THEN** o total corrente é acrescido do valor daquele item

#### Scenario: Total sem contagem progressiva

- **WHEN** o total corrente muda
- **THEN** ele troca diretamente para o novo valor, sem animação de contagem

#### Scenario: Números não deslocam o layout

- **WHEN** o total muda de largura de dígitos
- **THEN** nenhum elemento adjacente se desloca

#### Scenario: Posição do rodapé

- **WHEN** o modo compra é exibido com o rodapé visível
- **THEN** o rodapé de acompanhamento aparece imediatamente acima do botão "Fechar compra", nessa ordem visual (rodapé, depois botão)

### Requirement: Iniciar a compra a partir da lista

A lista de compras SHALL oferecer a ação de iniciar a compra, convertendo seus itens correntes em itens planejados da compra aberta.

#### Scenario: Conversão dos itens

- **WHEN** o usuário inicia a compra a partir de uma lista com quinze itens
- **THEN** a compra aberta passa a conter quinze itens planejados

#### Scenario: Quantidade planejada já arredondada

- **WHEN** um item em unidade indivisível é convertido
- **THEN** sua quantidade planejada é a já arredondada pela regra de domínio, sem novo arredondamento

#### Scenario: Avulsos incluídos

- **WHEN** a lista contém itens avulsos
- **THEN** eles fazem parte da compra como itens sem produto associado

#### Scenario: Retomar compra em andamento

- **WHEN** existe uma compra aberta com itens já marcados e o usuário volta ao modo compra
- **THEN** as marcações anteriores estão preservadas

