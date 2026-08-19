## MODIFIED Requirements

### Requirement: Tela de configurações acessível

O app SHALL oferecer uma tela de configurações contendo a escolha de tema, as ações de backup e restauração, a exportação de dados e o acesso ao diagnóstico. As três opções de tema SHALL ter alvo de toque mínimo de 48×48dp cada.

Dois elementos com significados diferentes na mesma tela NÃO SHALL ter o mesmo nome acessível. Hoje a tela exibe um rótulo de seção "Despensa" enquanto a aba "Despensa" da tab bar está visível — dois nós com o mesmo nome e destinos distintos, o que torna a navegação por voz e por leitor de tela ambígua.

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

#### Scenario: Nome acessível não colide com a tab bar

- **WHEN** a tela de configurações é exibida com a tab bar visível
- **THEN** nenhum elemento da tela tem o mesmo nome acessível de uma aba, e cada nome identifica um único destino

### Requirement: Ações destrutivas sinalizadas

Ações que sobrescrevem dados SHALL ser visualmente distinguidas das demais e SHALL exigir confirmação.

O texto que descreve o efeito de uma ação destrutiva SHALL ser legível: SHALL usar papel tipográfico de corpo, e NÃO o papel de micro-rótulo em caixa alta. O aviso de que uma ação não pode ser desfeita é a informação mais importante da tela e não pode ser a mais difícil de ler.

#### Scenario: Restauração sinalizada

- **WHEN** a ação de restaurar é exibida
- **THEN** ela é distinguida das ações não destrutivas e descreve seu efeito

#### Scenario: Exportação não pede confirmação

- **WHEN** a ação de exportar é acionada
- **THEN** ela executa diretamente, por não alterar dados

#### Scenario: Aviso da ação destrutiva é legível

- **WHEN** o texto que explica que restaurar substitui os dados e não pode ser desfeito é exibido
- **THEN** ele aparece em caixa normal, com papel de corpo, e não em caixa alta a tamanho de micro-rótulo
