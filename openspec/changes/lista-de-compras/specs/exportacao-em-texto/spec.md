## ADDED Requirements

### Requirement: Exportar a lista como texto compartilhável

O usuário SHALL poder exportar a lista corrente como texto simples, para compartilhar por qualquer aplicativo de mensagens do aparelho.

#### Scenario: Compartilhamento acionado

- **WHEN** o usuário aciona a exportação
- **THEN** a folha de compartilhamento do sistema abre com o texto da lista pronto

#### Scenario: Texto contém item e quantidade

- **WHEN** a lista é exportada
- **THEN** cada linha do texto contém o nome do item e a quantidade a comprar com sua unidade

#### Scenario: Total incluído

- **WHEN** a lista é exportada
- **THEN** o texto termina com o total estimado da compra

#### Scenario: Itens sem preço sinalizados no texto

- **WHEN** a lista contém itens sem preço
- **THEN** o texto os identifica como sem preço, e o total reflete apenas os itens com preço

#### Scenario: Agrupamento refletido no texto

- **WHEN** o agrupamento por categoria está ativo
- **THEN** o texto exportado separa os itens por categoria

#### Scenario: Exportação de lista vazia

- **WHEN** a lista não tem itens e o usuário aciona a exportação
- **THEN** a ação está indisponível ou informa que não há nada a compartilhar

### Requirement: Texto legível sem o app

O texto exportado SHALL ser compreensível para quem não usa o app, sem jargão de sistema e sem identificadores internos.

#### Scenario: Sem identificadores internos

- **WHEN** o texto é gerado
- **THEN** ele não contém identificadores de registro nem nomes de campo do banco

#### Scenario: Vocabulário do usuário

- **WHEN** o texto é gerado
- **THEN** ele usa o mesmo vocabulário da interface, sem termos de sistema

#### Scenario: Valores formatados para leitura

- **WHEN** quantidades e preços aparecem no texto
- **THEN** eles estão formatados como exibidos na interface, e não em unidades internas
