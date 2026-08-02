## 1. Scaffold do projeto Expo

- [x] 1.1 Inicializar projeto Expo com template TypeScript + Expo Router na raiz do repositório, preservando os `.md` de design, o `LICENSE`, o `README.md` e a pasta `openspec/`
- [x] 1.2 Ativar `strict: true` no `tsconfig.json` e configurar o alias de path `@/*` apontando para `src/*`
- [x] 1.3 Ajustar `.gitignore` para o projeto Expo (`node_modules`, `.expo`, `ios/`, `android/`, `*.db`), mantendo as entradas já existentes
- [x] 1.4 Criar `app/_layout.tsx` mínimo com a raiz do Expo Router e verificar que o app abre

## 2. Estrutura de camadas

- [ ] 2.1 Criar a árvore `src/domain/{produto,compra,movimento,shared}/`, `src/ports/`, `src/infrastructure/{db,repositories}/`, `src/application/{estoque,lista,compra}/`, `src/presentation/{components,theme,format}/` e `src/shared/`, com `.gitkeep` nas pastas ainda vazias
- [ ] 2.2 Criar os diretórios de rota `app/(tabs)/`, `app/produto/` e `app/compra/` com placeholders que renderizam um texto, só para validar o roteamento

## 3. Dependências da stack

- [ ] 3.1 Instalar as dependências de persistência (`expo-sqlite`, `drizzle-orm`) e a de desenvolvimento `drizzle-kit`, usando o instalador do Expo para fixar versões compatíveis com o SDK
- [ ] 3.2 Instalar `react-native-reanimated` e aplicar a configuração de Babel/plugin exigida pela versão instalada
- [ ] 3.3 Instalar `expo-haptics`, `expo-keep-awake`, `expo-splash-screen`, `@gorhom/bottom-sheet` e `@shopify/flash-list` com suas dependências de gesto/animação
- [ ] 3.4 Rodar o verificador de dependências do Expo e resolver qualquer incompatibilidade de versão apontada

## 4. Development build (EAS)

- [ ] 4.1 Configurar `app.json`/`app.config.ts` com nome, slug, identificador de pacote Android e bundle identifier iOS
- [ ] 4.2 Criar `eas.json` com os perfis `development` (cliente de desenvolvimento + distribuição interna), `preview` e `production`
- [ ] 4.3 Gerar o primeiro development build e instalá-lo no aparelho de desenvolvimento
- [ ] 4.4 Confirmar que o app abre pelo development build conectado ao Metro local

## 5. Primitivos compartilhados

- [ ] 5.1 Implementar `src/shared/result.ts` com `Result<T, E>` como união discriminada, mais os construtores de sucesso e de falha
- [ ] 5.2 Implementar `src/shared/id.ts` gerando **UUID v7**, com fonte de tempo injetável para teste determinístico
- [ ] 5.3 Escrever testes de `id.ts` cobrindo formato de 36 caracteres, campo de versão 7 e ordenação lexicográfica crescente entre dois identificadores gerados em instantes distintos
- [ ] 5.4 Escrever testes de `result.ts` cobrindo discriminação de sucesso e de falha

## 6. Testes

- [ ] 6.1 Configurar `jest.config.js` com dois projetos: `domain` (ambiente node puro, escopo `src/domain/` e `src/shared/`) e `app` (preset `jest-expo`)
- [ ] 6.2 Adicionar scripts de teste separados: rodar só o domínio, e rodar tudo
- [ ] 6.3 Configurar o relatório de cobertura restrito a `src/domain/` com limite mínimo de 90%
- [ ] 6.4 Verificar que o comando de teste do domínio conclui sem exigir emulador, simulador ou Metro

## 7. Lint e fronteiras

- [ ] 7.1 Configurar ESLint + Prettier com o preset do Expo e formatação consistente
- [ ] 7.2 Configurar `eslint-plugin-boundaries` declarando as camadas `domain`, `ports`, `application`, `infrastructure`, `presentation` e as regras de import permitidas entre elas
- [ ] 7.3 Adicionar a regra que proíbe literal hexadecimal de cor fora de `src/presentation/theme/`
- [ ] 7.4 Criar `scripts/verificar-fronteiras.sh` executando o `grep` de conformidade sobre `src/domain/` e saindo com código diferente de 0 se houver qualquer casamento
- [ ] 7.5 Adicionar o script agregado de verificação que roda fronteiras + lint + typecheck em sequência
- [ ] 7.6 Validar cada regra com um arquivo temporário que a viola deliberadamente, confirmar que o lint acusa, e remover o arquivo

## 8. Documentação

- [ ] 8.1 Atualizar a seção "Comandos" do `CLAUDE.md` com os comandos reais de `dev`, `test`, `lint`, `typecheck` e verificação de fronteiras, removendo o aviso de "a confirmar após o scaffold"
- [ ] 8.2 Corrigir `ARQUITETURA-app-estoque-de-casa.md` §3 de "geração de UUID v4" para UUID v7, com nota apontando para DATABASE §4.2
- [ ] 8.3 Atualizar o `README.md` com como rodar o projeto pelo development build, deixando explícito que Expo Go não é suportado
