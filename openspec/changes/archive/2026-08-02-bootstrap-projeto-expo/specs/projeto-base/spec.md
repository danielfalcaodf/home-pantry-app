## ADDED Requirements

### Requirement: Aplicativo Expo executável com Expo Router

O projeto SHALL ser um app React Native + Expo com TypeScript em modo estrito, usando Expo Router como única camada de roteamento, e SHALL iniciar sem erros em Android e iOS a partir de um development build.

#### Scenario: App inicia no development build

- **WHEN** o desenvolvedor executa o comando de desenvolvimento com um development build instalado no aparelho
- **THEN** o Metro inicia, o app abre e renderiza a rota raiz sem erro de runtime

#### Scenario: Rotas em arquivos, nunca em navegador manual

- **WHEN** uma nova tela precisa existir
- **THEN** ela é criada como arquivo dentro de `app/` e fica acessível pela rota correspondente, sem registro manual em nenhum navegador

#### Scenario: TypeScript estrito

- **WHEN** o comando de typecheck é executado
- **THEN** ele roda com `strict: true` e termina com código de saída 0

### Requirement: Build de desenvolvimento EAS, não Expo Go

O projeto SHALL ser configurado para EAS development build desde o primeiro commit, com perfis de build declarados para desenvolvimento, preview e produção.

#### Scenario: Perfil de desenvolvimento existe

- **WHEN** o arquivo de configuração de build é inspecionado
- **THEN** existe um perfil de desenvolvimento com cliente de desenvolvimento habilitado e distribuição interna

#### Scenario: Expo Go não é caminho suportado

- **WHEN** a documentação do projeto descreve como rodar o app
- **THEN** ela instrui o uso do development build e NÃO instrui o uso do Expo Go

### Requirement: Estrutura de diretórios das camadas

O projeto SHALL conter a árvore de diretórios de `app/` e `src/` definida na arquitetura, organizada por feature dentro de cada camada (`produto`, `compra`, `movimento`), e NÃO por tipo de arquivo.

#### Scenario: Camadas existem no repositório

- **WHEN** o repositório é inspecionado após o scaffold
- **THEN** existem os diretórios `src/domain/`, `src/ports/`, `src/infrastructure/db/`, `src/infrastructure/repositories/`, `src/application/`, `src/presentation/` e `src/shared/`

#### Scenario: Ausência de pastas por tipo

- **WHEN** o repositório é inspecionado
- **THEN** NÃO existem diretórios genéricos de topo chamados `components/`, `services/` ou `models/` fora de `src/presentation/`

### Requirement: Runner de teste do domínio sem emulador

O projeto SHALL executar os testes de `src/domain/` em ambiente Node puro, sem Metro, sem emulador e sem transformar código nativo.

#### Scenario: Teste de domínio roda isolado

- **WHEN** o comando de teste do domínio é executado
- **THEN** ele conclui em segundos e não requer nenhum simulador, emulador ou bundler ativo

#### Scenario: Teste de integração usa preset do Expo

- **WHEN** um teste que depende de módulos do Expo é executado
- **THEN** ele roda sob o preset de teste do Expo, separado do projeto de teste do domínio

### Requirement: Comandos de qualidade documentados

O projeto SHALL expor comandos de `dev`, `test`, `lint` e `typecheck`, e a documentação de trabalho do repositório SHALL registrar os comandos reais assim que existirem.

#### Scenario: Comandos declarados

- **WHEN** o manifesto de pacotes é inspecionado
- **THEN** existem scripts para iniciar o app, rodar testes, rodar o linter e verificar tipos

#### Scenario: Documentação atualizada

- **WHEN** o scaffold é concluído
- **THEN** a seção de comandos do guia do repositório contém os comandos reais e não mais o aviso de "a confirmar"
