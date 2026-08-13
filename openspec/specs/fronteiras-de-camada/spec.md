# fronteiras-de-camada

## Requirements

### Requirement: Domínio livre de dependências externas

`src/domain/` SHALL ser TypeScript puro. Ele NÃO deve importar React, React Native, Expo, Drizzle, SQLite ou qualquer biblioteca de UI ou de I/O.

#### Scenario: Verificação de conformidade passa

- **WHEN** o script de verificação de fronteiras é executado sobre `src/domain/`
- **THEN** ele não retorna nenhuma linha e termina com código de saída 0

#### Scenario: Import proibido é rejeitado

- **WHEN** um arquivo em `src/domain/` importa qualquer módulo de `expo`, `react`, `drizzle` ou `@react-native`
- **THEN** o linter acusa erro e o script de verificação termina com código de saída diferente de 0

### Requirement: Direção das dependências entre camadas

As dependências entre camadas SHALL apontar sempre para dentro: `presentation/` → `application/`; `application/` → `domain/` e as interfaces de `ports/`; `infrastructure/` → `ports/` e `domain/`. `application/` NÃO deve importar nenhuma implementação concreta de `infrastructure/`.

#### Scenario: Caso de uso depende da interface, não da implementação

- **WHEN** um arquivo em `src/application/` importa de `src/infrastructure/`
- **THEN** o linter de fronteira acusa erro

#### Scenario: Apresentação não acessa o banco

- **WHEN** um arquivo em `src/presentation/` ou em `app/` importa o cliente de banco ou o schema de persistência
- **THEN** o linter de fronteira acusa erro

#### Scenario: Apresentação usa do domínio apenas tipos e formatadores

- **WHEN** um componente importa do domínio
- **THEN** o import é de tipo ou de função de formatação, nunca de lógica de escrita

### Requirement: Nenhuma cor literal fora dos tokens de tema

Valores de cor SHALL existir apenas em `src/presentation/theme/`. Qualquer literal hexadecimal de cor em componentes ou estilos NÃO é permitido.

#### Scenario: Hex em componente é erro

- **WHEN** um arquivo em `src/presentation/components/` contém um literal hexadecimal de cor
- **THEN** o linter acusa erro

#### Scenario: Hex nos tokens é permitido

- **WHEN** `src/presentation/theme/tokens.ts` contém literais hexadecimais de cor
- **THEN** o linter não acusa erro nesse arquivo

### Requirement: Verificação executável antes do merge

O projeto SHALL fornecer um comando único que executa a verificação de fronteiras, o linter e o typecheck, adequado para rodar antes de qualquer merge.

#### Scenario: Verificação agregada

- **WHEN** o comando de verificação é executado em um repositório conforme
- **THEN** ele termina com código de saída 0 e reporta cada checagem executada

#### Scenario: Violação bloqueia

- **WHEN** qualquer uma das checagens falha
- **THEN** o comando agregado termina com código de saída diferente de 0

### Requirement: Regras de fronteira comprovadas por teste executável

As regras de ESLint que implementam a fronteira de camadas — dependência entre camadas, import proibido em `src/domain/`, e hex literal fora dos tokens de tema — SHALL ser comprovadas por um teste automatizado que exercita cada violação e confirma a rejeição, e não apenas existir configuradas em `eslint.config.js`.

#### Scenario: Import proibido em domínio é rejeitado no teste

- **WHEN** um teste roda o ESLint programaticamente sobre uma fixture inline de arquivo em `src/domain/` que importa `expo`, `react`, `drizzle` ou `@react-native`
- **THEN** o teste confirma que o ESLint reporta erro para essa fixture

#### Scenario: Import de infraestrutura em caso de uso é rejeitado no teste

- **WHEN** um teste roda o ESLint sobre uma fixture inline de arquivo em `src/application/` que importa de `src/infrastructure/`
- **THEN** o teste confirma que o ESLint reporta erro para essa fixture

#### Scenario: Acesso ao banco pela apresentação é rejeitado no teste

- **WHEN** um teste roda o ESLint sobre uma fixture inline de arquivo em `src/presentation/` ou `app/` que importa o cliente de banco ou o schema de persistência
- **THEN** o teste confirma que o ESLint reporta erro para essa fixture

#### Scenario: Hex literal em componente é rejeitado no teste

- **WHEN** um teste roda o ESLint sobre uma fixture inline de componente em `src/presentation/components/` contendo um literal hexadecimal de cor
- **THEN** o teste confirma que o ESLint reporta erro para essa fixture
