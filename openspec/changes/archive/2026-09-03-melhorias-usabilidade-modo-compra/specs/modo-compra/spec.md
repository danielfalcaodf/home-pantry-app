## MODIFIED Requirements

### Requirement: Ajuste de quantidade comprada e preço pago

Ao marcar um item, o usuário SHALL poder ajustar a quantidade realmente comprada e o valor pago
por unidade. Sem ajuste, a quantidade planejada SHALL ser assumida como comprada, e o preço
estimado do produto (quando existir) SHALL ser assumido como preço pago. A linha SHALL oferecer
controles visíveis de diminuir e aumentar quantidade, cada um com alvo de toque mínimo de 48 por
48 pontos e rótulo acessível completo. Os controles SHALL funcionar antes e depois da marcação sem
marcar ou desmarcar o item. O ajuste detalhado SHALL continuar disponível sem trocar de rota para
informar quantidade exata e preço pago; ao abri-lo, o primeiro campo SHALL receber foco automático
e o teclado SHALL ser levantado. Ao reabrir uma compra aberta com item já materializado e não
comprado, o preço estimado desse item SHALL ser sincronizado com o preço atual do produto, caso
tenha mudado desde a materialização.

#### Scenario: Padrão assume o planejado

- **WHEN** um item é marcado sem ajuste
- **THEN** a quantidade comprada assumida é a planejada

#### Scenario: Aumentar rapidamente a quantidade planejada

- **WHEN** um item planejado para duas unidades recebe um toque no controle de aumentar antes de
  ser marcado
- **THEN** sua quantidade comprada passa a três unidades, sem marcar o item nem abrir o teclado

#### Scenario: Aumentar quantidade já marcada

- **WHEN** um item marcado com duas unidades recebe um toque no controle de aumentar
- **THEN** sua quantidade comprada passa a três unidades e o total corrente é recalculado

#### Scenario: Diminuir sem ultrapassar o mínimo indivisível

- **WHEN** um item em unidade indivisível está com uma unidade comprada e o usuário toca no
  controle de diminuir
- **THEN** a quantidade não fica menor que uma unidade

#### Scenario: Ajuste detalhado permanece disponível

- **WHEN** o usuário precisa informar quantidade fracionada ou preço pago
- **THEN** ele abre o painel de ajuste na própria tela, sem navegar para outra rota

#### Scenario: Quantidade ajustada

- **WHEN** o usuário informa uma quantidade comprada diferente da planejada
- **THEN** o valor informado é o considerado na reposição e no total

#### Scenario: Preço pago informado

- **WHEN** o usuário informa o valor pago por unidade
- **THEN** o total corrente é recalculado com esse valor, sobrescrevendo qualquer preço estimado
  assumido por padrão

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

### Requirement: Iniciar a compra a partir da lista

A Lista SHALL oferecer a ação de iniciar a compra, convertendo seus itens correntes em itens
planejados da compra aberta. Quando houver uma compra aberta, a Lista SHALL indicá-la de forma
persistente com seu progresso e a ação de compra SHALL oferecer escolha explícita entre continuar o
rascunho existente e começar uma nova lista atualizada. Continuar SHALL preservar integralmente o
rascunho. Começar nova lista SHALL cancelar a compra aberta e materializar uma nova compra com a
Lista corrente, sem deixar duas compras abertas. Quando a compra aberta tiver itens marcados ou
ajustes, começar uma nova lista SHALL exigir confirmação que explique o descarte do rascunho sem
repor estoque.

#### Scenario: Conversão dos itens

- **WHEN** o usuário inicia a compra a partir de uma lista com quinze itens e não existe compra
  aberta
- **THEN** a compra aberta passa a conter quinze itens planejados

#### Scenario: Quantidade planejada já arredondada

- **WHEN** um item em unidade indivisível é convertido
- **THEN** sua quantidade planejada é a já arredondada pela regra de domínio, sem novo
  arredondamento

#### Scenario: Avulsos incluídos

- **WHEN** a lista contém itens avulsos
- **THEN** eles fazem parte da compra como itens sem produto associado

#### Scenario: Compra aberta fica visível na Lista

- **WHEN** existe uma compra aberta com três de oito itens marcados
- **THEN** a Lista informa que há uma compra em andamento e apresenta o progresso de três de oito

#### Scenario: Continuar compra em andamento

- **WHEN** existe uma compra aberta e o usuário escolhe continuar compra
- **THEN** o app abre a compra existente com suas marcações, quantidades, preços e decisões
  pendentes preservados

#### Scenario: Começar nova lista atualizada

- **WHEN** existe uma compra aberta sem progresso e o usuário escolhe começar nova lista
- **THEN** a compra anterior é cancelada sem reposição e uma nova compra é materializada a partir
  dos itens correntes da Lista

#### Scenario: Nova lista exige confirmação ao descartar progresso

- **WHEN** existe uma compra aberta com item marcado ou quantidade/preço ajustado e o usuário
  escolhe começar nova lista
- **THEN** o app pede confirmação, informa que o rascunho não será aplicado ao estoque e só cria a
  nova compra após confirmação

#### Scenario: Cancelar recomeço preserva rascunho

- **WHEN** o usuário recusa a confirmação para começar nova lista
- **THEN** a compra aberta continua intacta e nenhuma nova compra é criada
