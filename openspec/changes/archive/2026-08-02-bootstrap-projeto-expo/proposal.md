## Why

O repositório só tem documentos de design — não existe `package.json`, código, nem toolchain. Nenhuma regra de negócio pode ser escrita ou testada antes de haver um projeto Expo rodando com TypeScript, Expo Router e a estrutura de camadas da arquitetura. Esta é a change 0: ela não entrega nada ao usuário final, e é pré-requisito de todas as outras.

Fazer o scaffold com EAS development build **desde o dia 1** (ADR-06) evita a reconfiguração de projeto que apareceria na v1.1, quando notificações e widget entrarem — recursos que não funcionam no Expo Go.

## What Changes

- Inicializa projeto Expo (SDK atual) com TypeScript estrito e Expo Router.
- Cria a árvore de diretórios de `app/` e `src/` exatamente como ARQUITETURA §3, com `.gitkeep` nas pastas ainda vazias.
- Configura **EAS development build** (`eas.json`, `app.json`/`app.config.ts`) para Android e iOS — não Expo Go.
- Instala e configura as dependências-base da stack: `expo-sqlite`, `drizzle-orm`, `drizzle-kit`, `react-native-reanimated`, `expo-haptics`, `expo-keep-awake`, `@gorhom/bottom-sheet`, `@shopify/flash-list`, `expo-splash-screen`.
- Configura o runner de teste do domínio (Jest com preset `jest-expo`, mais um projeto de teste **node puro** para `src/domain/` — precisa rodar sem Metro e sem emulador).
- Configura ESLint + Prettier com **lint de fronteira de camada** (`eslint-plugin-boundaries`) e a regra que proíbe hex literal fora de `src/presentation/theme/`.
- Adiciona `scripts/verificar-fronteiras.sh` com o `grep` de conformidade de ARQUITETURA §2.1 e liga no CI local.
- Cria `src/shared/result.ts` (`Result<T, E>`) e `src/shared/id.ts` (**UUID v7**, não v4 — DATABASE §4.2 corrige a arquitetura).
- Atualiza a seção "Comandos" do `CLAUDE.md` com os comandos reais de `dev`, `test`, `lint` e `typecheck`.

## Capabilities

### New Capabilities

- `projeto-base`: existência do app Expo executável, com roteamento, build de desenvolvimento, scripts de qualidade e a árvore de diretórios das camadas.
- `fronteiras-de-camada`: verificação automatizada da regra de dependência entre `domain/`, `application/`, `ports/`, `infrastructure/` e `presentation/`, e da proibição de cor literal fora dos tokens.
- `primitivos-compartilhados`: `Result<T, E>` para falhas esperadas e geração de identificador UUID v7 ordenável por tempo.

### Modified Capabilities

_Nenhuma — este é o primeiro change do projeto._

## Impact

- **Cria**: `package.json`, `tsconfig.json`, `app.json`, `eas.json`, `.eslintrc`, `jest.config.js`, `app/_layout.tsx`, `src/**` (esqueleto), `src/shared/result.ts`, `src/shared/id.ts`, `scripts/verificar-fronteiras.sh`.
- **Modifica**: `CLAUDE.md` (seção Comandos), `.gitignore`.
- **Dependências novas**: toda a stack listada acima.
- **Bloqueia**: todas as demais changes. Nada pode ser implementado antes desta.
- **Risco de fora**: exige conta Expo/EAS para gerar o development build; o desenvolvimento local com `expo start --dev-client` só funciona após o primeiro build instalado no aparelho.
