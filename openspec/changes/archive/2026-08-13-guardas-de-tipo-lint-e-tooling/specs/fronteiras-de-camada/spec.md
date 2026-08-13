## ADDED Requirements

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
