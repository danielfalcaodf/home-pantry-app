## ADDED Requirements

### Requirement: Ajuste grava movimento, nunca alteração solta

Corrigir a quantidade de um produto SHALL gravar um movimento do tipo ajuste, com a variação necessária para chegar ao valor informado, na mesma transação da atualização da quantidade. A quantidade NÃO deve ser alterada sem movimento correspondente.

#### Scenario: Ajuste para cima

- **WHEN** um produto com 2 unidades é ajustado para 5
- **THEN** a quantidade passa a 5 e um movimento de ajuste de mais 3 é gravado

#### Scenario: Ajuste para baixo

- **WHEN** um produto com 5 unidades é ajustado para 2
- **THEN** a quantidade passa a 2 e um movimento de ajuste de menos 3 é gravado

#### Scenario: Ajuste para zero

- **WHEN** um produto com 3 unidades é ajustado para 0
- **THEN** a quantidade passa a 0 e um movimento de ajuste de menos 3 é gravado

#### Scenario: Ajuste sem mudança não grava

- **WHEN** o usuário confirma um ajuste com o mesmo valor que já estava
- **THEN** nenhum movimento é gravado

#### Scenario: Atomicidade

- **WHEN** a gravação do movimento de ajuste falha
- **THEN** a quantidade permanece com o valor anterior

#### Scenario: Quantidade negativa é rejeitada

- **WHEN** o usuário tenta ajustar para um valor negativo
- **THEN** o ajuste é rejeitado com erro em texto

### Requirement: Motivo opcional do ajuste

O ajuste SHALL permitir informar um motivo, com opções sugeridas de perda, vencimento e correção, e SHALL aceitar a ausência de motivo.

#### Scenario: Motivo registrado

- **WHEN** o usuário ajusta informando vencimento como motivo
- **THEN** o movimento de ajuste registra esse motivo

#### Scenario: Ajuste sem motivo é permitido

- **WHEN** o usuário ajusta sem escolher motivo
- **THEN** o ajuste é gravado normalmente, sem motivo

#### Scenario: Motivo visível no histórico

- **WHEN** o histórico do produto é consultado
- **THEN** o motivo do ajuste aparece junto do movimento

### Requirement: Ajuste é distinto de consumo e de reposição

O tipo ajuste SHALL ser preservado como categoria própria de movimento. Ajustes NÃO devem ser registrados como consumo nem como reposição.

#### Scenario: Tipo preservado

- **WHEN** um ajuste é gravado
- **THEN** seu tipo é ajuste, independentemente do sinal da variação

#### Scenario: Distinção no histórico

- **WHEN** o histórico exibe movimentos de tipos diferentes
- **THEN** ajustes são distinguíveis de consumos e de reposições

#### Scenario: Vocabulário de interface

- **WHEN** a ação de ajuste é apresentada ao usuário
- **THEN** ela usa linguagem de correção, sem os termos de sistema

### Requirement: Quantidade editável no detalhe do produto

A tela de detalhe do produto SHALL permitir corrigir a quantidade atual, e essa edição SHALL passar pelo caminho de ajuste.

#### Scenario: Edição abre o ajuste

- **WHEN** o usuário toca na quantidade atual na tela de detalhe
- **THEN** o caminho de ajuste é aberto, e não um campo de texto solto

#### Scenario: Efeito idêntico

- **WHEN** a quantidade é corrigida pelo detalhe
- **THEN** o resultado é idêntico ao de um ajuste feito por qualquer outro caminho

#### Scenario: Quantidade necessária continua sendo edição de cadastro

- **WHEN** o usuário altera a quantidade necessária
- **THEN** nenhum movimento é gravado, pois isso é alteração de cadastro
