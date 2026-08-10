## MODIFIED Requirements

### Requirement: Exportar a lista como texto compartilhável

O usuário SHALL poder exportar a lista corrente como texto simples, para compartilhar por qualquer aplicativo de mensagens do aparelho. O controle que aciona o compartilhamento SHALL ter alvo de toque mínimo de 48×48dp.

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

#### Scenario: Alvo de toque do controle de compartilhamento

- **WHEN** o botão "Compartilhar lista" do cabeçalho da Lista é medido
- **THEN** sua área tocável mede no mínimo 48 por 48 pontos independentes, sem alterar seu tamanho visual
