## MODIFIED Requirements

### Requirement: Detalhe e edição do produto

A tela de detalhe SHALL exibir a quantidade atual em destaque, permitir corrigi-la pelo caminho de ajuste, permitir editar todos os campos de cadastro do produto, e exibir no rodapé um resumo do histórico recente de registros com acesso ao histórico completo. A abertura da tela NÃO SHALL atribuir foco automático a nenhum campo de texto nem invocar o teclado, e Voltar com o teclado aberto SHALL fechar o teclado sem sair da tela.

#### Scenario: Quantidade em destaque

- **WHEN** a tela de detalhe é aberta
- **THEN** a quantidade atual é exibida no papel tipográfico de display, no topo

#### Scenario: Edição persistida

- **WHEN** o usuário altera um campo de cadastro e salva
- **THEN** a alteração é gravada e a lista da despensa reflete a mudança

#### Scenario: Correção da quantidade atual pelo ajuste

- **WHEN** o usuário toca na quantidade atual
- **THEN** o caminho de ajuste é aberto, gravando um movimento ao confirmar uma quantidade diferente

#### Scenario: Quantidade atual não é campo de texto solto

- **WHEN** a tela de detalhe é inspecionada
- **THEN** a quantidade atual NÃO é editável como campo de formulário comum

#### Scenario: Resumo do histórico

- **WHEN** a tela de detalhe é aberta
- **THEN** o rodapé informa quantos registros de consumo foram feitos no período recente, em linguagem do usuário

#### Scenario: Acesso ao histórico completo

- **WHEN** o usuário toca no resumo do histórico
- **THEN** o histórico completo de movimentos daquele produto é aberto

#### Scenario: Alterar quantidade necessária muda o estado

- **WHEN** a quantidade necessária é aumentada acima da quantidade atual
- **THEN** o item passa a aparecer como faltando na despensa, sem gravar nenhum movimento

#### Scenario: Abertura sem foco automático nem teclado

- **WHEN** o usuário abre o detalhe de um produto a partir da Despensa
- **THEN** nenhum campo de texto recebe foco automático, o teclado não é invocado, e os botões "Usei" e "Repus" permanecem visíveis e tocáveis

#### Scenario: Voltar com teclado aberto fecha só o teclado

- **WHEN** o usuário focou um campo de texto no detalhe (teclado aberto) e pressiona Voltar
- **THEN** o teclado é fechado e a tela de detalhe permanece aberta; um novo Voltar aí sim navega de volta

#### Scenario: Cadastro de produto novo preserva o autofoco

- **WHEN** o usuário abre a tela de cadastro de produto novo
- **THEN** o campo de nome recebe foco automático normalmente (comportamento existente, sem regressão)
