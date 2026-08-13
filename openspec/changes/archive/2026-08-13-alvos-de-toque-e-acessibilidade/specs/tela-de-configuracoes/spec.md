## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Vocabulário sem jargão de sistema

Os rótulos da tela de configurações SHALL usar o vocabulário de usuário já consolidado no restante do app, evitando termos de sistema como "estoque" quando um equivalente de produto já existe ("despensa").

#### Scenario: Atalho de conferência usa vocabulário de despensa

- **WHEN** a seção "Despensa" da tela de configurações é exibida
- **THEN** o botão de atalho para a auditoria de itens exibe o texto "Conferência da despensa", não "Conferência de estoque"
