# cadastro-de-produto

## Requirements

### Requirement: Cadastro com campos essenciais em primeiro plano

A tela de cadastro SHALL exigir nome, unidade e quantidade necessária, e SHALL apresentar no máximo quatro campos em primeiro plano. Os campos opcionais — quantidade atual, valor unitário, categoria, marca preferida e observação — SHALL ficar em uma seção recolhida.

#### Scenario: Cadastro mínimo

- **WHEN** o usuário preenche nome, unidade e quantidade necessária e salva
- **THEN** o produto é criado com quantidade atual zero e valor unitário zero

#### Scenario: Campos opcionais recolhidos

- **WHEN** a tela de cadastro é aberta
- **THEN** os campos opcionais não estão visíveis até que a seção de mais opções seja expandida

#### Scenario: Quantidade necessária decimal

- **WHEN** o usuário informa 1,5 na unidade quilograma
- **THEN** o produto é salvo com a quantidade necessária correspondente

#### Scenario: Quantidade necessária zero é rejeitada

- **WHEN** o usuário informa quantidade necessária zero e tenta salvar
- **THEN** o campo exibe erro em texto e o produto não é criado

#### Scenario: Nome vazio é rejeitado

- **WHEN** o usuário deixa o nome em branco e tenta salvar
- **THEN** o campo exibe erro em texto e o produto não é criado

#### Scenario: Vocabulário da interface

- **WHEN** o campo de quantidade necessária é rotulado
- **THEN** o rótulo usa linguagem do usuário, como quanto se quer ter em casa, e não o termo de sistema

### Requirement: Autocomplete de categoria a partir do existente

O campo de categoria SHALL oferecer as categorias já existentes antes de permitir digitar uma nova, e o valor SHALL ser normalizado pelo domínio antes de gravar.

#### Scenario: Sugestões vêm dos dados

- **WHEN** o campo de categoria recebe foco
- **THEN** as categorias já usadas na casa são oferecidas

#### Scenario: Escolher existente evita variante

- **WHEN** o usuário digita "limp" e escolhe a sugestão "Limpeza"
- **THEN** a categoria gravada é exatamente "Limpeza"

#### Scenario: Categoria nova é normalizada

- **WHEN** o usuário digita " bebidas " como categoria nova
- **THEN** a categoria gravada é "Bebidas"

#### Scenario: Texto cru nunca é gravado

- **WHEN** qualquer categoria é gravada
- **THEN** ela passou pela normalização do domínio

### Requirement: Nome duplicado é impedido com caminho de saída

O sistema SHALL impedir dois produtos ativos com o mesmo nome na mesma casa, ignorando diferença de caixa. Ao detectar duplicidade, SHALL informar em linguagem clara e oferecer ver o item existente ou alterar o nome.

#### Scenario: Duplicidade detectada antes de salvar

- **WHEN** o usuário digita um nome que já existe na despensa
- **THEN** é exibida a mensagem informando que já existe um item com aquele nome, com a ação de ver o item existente

#### Scenario: Salvar exige nome diferenciado

- **WHEN** o usuário insiste em criar um item com nome já existente
- **THEN** ele é orientado a diferenciar o nome, e a criação com o nome idêntico não é concluída

#### Scenario: Diferença apenas de caixa também é duplicidade

- **WHEN** existe "Arroz" e o usuário tenta criar "arroz"
- **THEN** a duplicidade é detectada

#### Scenario: Nome de item removido pode ser reutilizado

- **WHEN** um item foi removido e o usuário cria outro com o mesmo nome
- **THEN** a criação é concluída normalmente

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

### Requirement: Remoção lógica de produto

A remoção de um produto SHALL ser lógica. O registro e seu histórico de movimentos NÃO devem ser apagados do banco.

#### Scenario: Item removido some da despensa

- **WHEN** um produto é removido
- **THEN** ele deixa de aparecer na despensa e na lista de compras

#### Scenario: Histórico preservado

- **WHEN** um produto é removido
- **THEN** seus movimentos permanecem no banco

#### Scenario: Remoção pede confirmação

- **WHEN** o usuário aciona a remoção
- **THEN** uma confirmação explícita é exigida antes de concluir
