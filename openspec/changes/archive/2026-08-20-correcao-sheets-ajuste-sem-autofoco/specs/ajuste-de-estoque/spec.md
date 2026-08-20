# ajuste-de-estoque

## MODIFIED Requirements

### Requirement: Quantidade editável no detalhe do produto

A tela de detalhe do produto SHALL permitir corrigir a quantidade atual, e essa edição SHALL
passar pelo caminho de ajuste. Ao abrir o sheet de ajuste, o primeiro campo SHALL receber foco
automático e o teclado SHALL ser levantado.

#### Scenario: Edição abre o ajuste

- **WHEN** o usuário toca na quantidade atual na tela de detalhe
- **THEN** o caminho de ajuste é aberto, e não um campo de texto solto

#### Scenario: Efeito idêntico

- **WHEN** a quantidade é corrigida pelo detalhe
- **THEN** o resultado é idêntico ao de um ajuste feito por qualquer outro caminho

#### Scenario: Quantidade necessária continua sendo edição de cadastro

- **WHEN** o usuário altera a quantidade necessária
- **THEN** nenhum movimento é gravado, pois isso é alteração de cadastro

#### Scenario: Sheet de ajuste abre com foco automático

- **WHEN** o usuário toca na quantidade atual na tela de detalhe e o sheet de ajuste abre
- **THEN** o primeiro campo já está em foco e o teclado já está visível, sem toque adicional
