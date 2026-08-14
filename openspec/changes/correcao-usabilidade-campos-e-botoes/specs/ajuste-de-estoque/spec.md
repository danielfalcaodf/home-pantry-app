## MODIFIED Requirements

### Requirement: Quantidade editável no detalhe do produto

A tela de detalhe do produto SHALL permitir corrigir a quantidade atual, e essa edição SHALL passar pelo caminho de ajuste. O painel de ajuste (`SheetAjusteEstoque`) SHALL manter o campo em foco e o botão de ação visíveis quando o teclado do sistema está aberto, e SHALL expor um controle de fechar visível, além do fechamento por toque fora do painel.

#### Scenario: Edição abre o ajuste

- **WHEN** o usuário toca na quantidade atual na tela de detalhe
- **THEN** o caminho de ajuste é aberto, e não um campo de texto solto

#### Scenario: Efeito idêntico

- **WHEN** a quantidade é corrigida pelo detalhe
- **THEN** o resultado é idêntico ao de um ajuste feito por qualquer outro caminho

#### Scenario: Quantidade necessária continua sendo edição de cadastro

- **WHEN** o usuário altera a quantidade necessária
- **THEN** nenhum movimento é gravado, pois isso é alteração de cadastro

#### Scenario: Campo de ajuste não fica coberto pelo teclado

- **WHEN** o teclado do sistema abre com `SheetAjusteEstoque` visível
- **THEN** o campo "Quanto você tem agora" e o botão "Corrigir" continuam visíveis e alcançáveis

#### Scenario: Painel de ajuste tem controle de fechar visível

- **WHEN** `SheetAjusteEstoque` está aberto
- **THEN** um controle de fechar está visível dentro do painel, além do fechamento por toque fora
