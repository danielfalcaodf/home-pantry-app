# tela-de-configuracoes

## MODIFIED Requirements

### Requirement: Ações destrutivas sinalizadas

Ações que sobrescrevem ou apagam dados SHALL ser visualmente distinguidas das demais e SHALL exigir confirmação. A ação de apagar todos os dados, por ser irreversível, SHALL exigir uma confirmação em duas camadas (confirmação inline seguida de alerta nativo com estilo destrutivo).

#### Scenario: Restauração sinalizada

- **WHEN** a ação de restaurar é exibida
- **THEN** ela é distinguida das ações não destrutivas e descreve seu efeito

#### Scenario: Exportação não pede confirmação

- **WHEN** a ação de exportar é acionada
- **THEN** ela executa diretamente, por não alterar dados

#### Scenario: Apagar todos os dados exige dupla confirmação

- **WHEN** o usuário aciona "Apagar todos os dados" em Configurações
- **THEN** uma confirmação inline é exibida e, ao confirmar, um alerta nativo com estilo
  destrutivo pede confirmação final antes de executar o reset
