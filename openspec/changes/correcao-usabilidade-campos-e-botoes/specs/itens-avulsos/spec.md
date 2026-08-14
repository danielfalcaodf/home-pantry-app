## MODIFIED Requirements

### Requirement: Adicionar item avulso sem cadastrar no estoque

O usuário SHALL poder adicionar à lista um item que não existe na despensa e que NÃO deve ser cadastrado como produto permanente. A validação de nome obrigatório e a normalização de preço opcional SHALL ser verificáveis diretamente na interface de `SheetAvulso` (`src/presentation/components/sheet-avulso.tsx`), não apenas nos casos de uso de aplicação exercitados com dados já válidos. Quantidade e preço digitados SHALL ser validados antes de salvar — entrada que não pode ser interpretada como número SHALL ser rejeitada com erro em texto, nunca substituída em silêncio por um valor padrão.

#### Scenario: Avulso criado

- **WHEN** o usuário adiciona um item avulso com nome, unidade e quantidade
- **THEN** ele aparece na lista, identificado como avulso

#### Scenario: Avulso não vira produto

- **WHEN** um item avulso é adicionado
- **THEN** nenhum produto novo aparece na despensa

#### Scenario: Preço opcional no avulso

- **WHEN** o usuário adiciona um avulso sem informar preço
- **THEN** ele entra na lista com custo zero e marcado como sem preço

#### Scenario: Nome obrigatório no avulso

- **WHEN** o usuário tenta adicionar um avulso sem nome
- **THEN** a adição é rejeitada com erro em texto

#### Scenario: Validação de nome vazio na interface de `SheetAvulso`

- **WHEN** o usuário toca salvar em `SheetAvulso` com o campo de nome vazio ou só espaços
- **THEN** o erro "Dê um nome ao item" é exibido e `onSalvar` não é chamado

#### Scenario: Modo de edição preenche os campos a partir do item existente

- **WHEN** `SheetAvulso` é aberto com um item avulso existente (`inicial` preenchido)
- **THEN** os campos de nome, quantidade, unidade e preço já vêm preenchidos com os valores desse item

#### Scenario: Quantidade inválida é rejeitada, não substituída

- **WHEN** o usuário digita um valor de quantidade que não pode ser interpretado como número maior que zero e toca salvar em `SheetAvulso`
- **THEN** o campo de quantidade exibe erro em texto, `onSalvar` não é chamado, e nenhum valor padrão é gravado no lugar do que foi digitado

#### Scenario: Preço inválido é rejeitado, não substituído

- **WHEN** o usuário digita um valor de preço que não pode ser interpretado como número e toca salvar em `SheetAvulso`
- **THEN** o campo de preço exibe erro em texto, e `onSalvar` não é chamado com um valor diferente do digitado
