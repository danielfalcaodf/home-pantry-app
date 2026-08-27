# tela-de-configuracoes

## Purpose

Definir a tela de Configurações: preferência de tema, ações sobre os dados locais (backup,
restauração, exportação, reset) e sinalização de ações destrutivas.
## Requirements
### Requirement: Tela de configurações acessível

O app SHALL oferecer uma tela de configurações contendo a escolha de tema, as ações de backup e restauração, a exportação de dados e o acesso ao diagnóstico. As três opções de tema SHALL ter alvo de toque mínimo de 48×48dp cada.

#### Scenario: Acesso a partir do app

- **WHEN** o usuário procura as configurações
- **THEN** ela é alcançável a partir de uma tela principal, sem navegação profunda

#### Scenario: Escolha de tema presente

- **WHEN** a tela de configurações é aberta
- **THEN** as três opções de tema estão disponíveis e a escolha é persistida

#### Scenario: Ações de dados agrupadas

- **WHEN** a tela de configurações é aberta
- **THEN** exportar backup, restaurar backup e exportar dados aparecem agrupados

#### Scenario: Alvo de toque dos seletores de tema

- **WHEN** qualquer uma das três opções de tema ("Tema Automático", "Tema Claro", "Tema Escuro") é medida
- **THEN** sua área tocável mede no mínimo 48 por 48 pontos independentes, sem alterar seu tamanho visual

### Requirement: Vocabulário sem jargão de sistema

Os rótulos da tela de configurações SHALL usar o vocabulário de usuário já consolidado no restante do app, evitando termos de sistema como "estoque" quando um equivalente de produto já existe ("despensa").

#### Scenario: Atalho de conferência usa vocabulário de despensa

- **WHEN** a seção "Despensa" da tela de configurações é exibida
- **THEN** o botão de atalho para a auditoria de itens exibe o texto "Conferência da despensa", não "Conferência de estoque"

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

### Requirement: Recomendação de backup periódico

A tela SHALL informar quando o último backup foi feito, para que o usuário perceba se está desprotegido.

#### Scenario: Data do último backup

- **WHEN** um backup já foi gerado
- **THEN** a tela informa quando ele foi feito

#### Scenario: Nunca feito

- **WHEN** nenhum backup foi gerado
- **THEN** a tela informa que ainda não há backup e convida a fazer um

