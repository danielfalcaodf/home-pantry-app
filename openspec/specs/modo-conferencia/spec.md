# modo-conferencia

## Requirements

### Requirement: Percurso guiado por categoria

O modo conferência SHALL permitir escolher uma categoria e percorrer seus itens em sequência, apresentando um item por vez para confirmação ou correção da quantidade.

#### Scenario: Escolha da categoria

- **WHEN** o modo conferência é iniciado
- **THEN** o usuário escolhe qual categoria conferir, ou opta por conferir tudo

#### Scenario: Um item por vez

- **WHEN** a conferência está em andamento
- **THEN** um único item é apresentado, com sua quantidade registrada em destaque

#### Scenario: Progresso visível

- **WHEN** a conferência está em andamento
- **THEN** o app indica quantos itens já foram conferidos de quantos

#### Scenario: Avanço rápido ao confirmar

- **WHEN** o usuário confirma que a quantidade está correta
- **THEN** o app avança imediatamente para o próximo item, sem gravar nenhum movimento

#### Scenario: Correção grava ajuste

- **WHEN** o usuário informa uma quantidade diferente da registrada
- **THEN** um movimento de ajuste é gravado e o app avança para o próximo item

### Requirement: Conferência interrompível e retomável

O usuário SHALL poder interromper a conferência a qualquer momento sem perder o que já foi conferido.

#### Scenario: Interrupção preserva o feito

- **WHEN** o usuário sai da conferência após conferir dez de trinta itens
- **THEN** os ajustes já gravados permanecem, e os demais itens ficam inalterados

#### Scenario: Retomada

- **WHEN** o usuário volta ao modo conferência de uma categoria parcialmente conferida
- **THEN** ele pode retomar a partir de onde parou

#### Scenario: Conclusão informa o resultado

- **WHEN** a conferência de uma categoria termina
- **THEN** o app informa quantos itens foram corrigidos e quantos estavam corretos

### Requirement: Conferência é caminho de recalibração, não de cadastro

O modo conferência SHALL apenas corrigir quantidades de produtos existentes. Ele NÃO deve criar nem remover produtos.

#### Scenario: Sem criação de produto

- **WHEN** a conferência está em andamento
- **THEN** nenhuma ação de cadastrar novo produto é oferecida no percurso

#### Scenario: Sem remoção

- **WHEN** a conferência está em andamento
- **THEN** nenhuma ação de remover produto é oferecida no percurso

#### Scenario: Item zerado também é conferido

- **WHEN** um item com quantidade zero entra no percurso
- **THEN** ele é apresentado normalmente, permitindo corrigir para um valor maior

### Requirement: Conferência otimizada para velocidade

O percurso SHALL priorizar confirmação rápida, com alvos de toque generosos e sem etapas de confirmação adicionais.

#### Scenario: Confirmar exige um toque

- **WHEN** a quantidade registrada está correta
- **THEN** confirmar e avançar exige um único toque

#### Scenario: Sem diálogo de confirmação

- **WHEN** uma correção é informada
- **THEN** ela é gravada sem diálogo adicional de confirmação

#### Scenario: Funciona offline

- **WHEN** o aparelho está sem conexão
- **THEN** a conferência funciona integralmente
