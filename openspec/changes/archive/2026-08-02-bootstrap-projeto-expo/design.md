## Context

Repositório com quatro documentos de design fechados (PRD, Arquitetura, Database, Frontend) e **zero código**. A arquitetura já decidiu o padrão (Layered feature-based + Ports & Adapters na fronteira de persistência), a stack (React Native + Expo + Drizzle sobre `expo-sqlite`) e o modelo de estado (SQLite como fonte de verdade, `useLiveQuery`, sem Redux/TanStack Query).

Esta change não decide arquitetura — ela **materializa** as decisões já tomadas e instala os mecanismos que impedem que elas sejam violadas por código gerado depois. Dev solo com apoio de IA: o custo maior não é escrever, é impedir deriva silenciosa. Por isso o lint de fronteira entra agora, não depois.

## Goals / Non-Goals

**Goals:**

- App Expo abrindo em development build, em Android e iOS.
- Árvore de camadas criada e **executável como restrição**, não só como convenção escrita.
- Testes de `src/domain/` rodando em Node puro, em segundos — é o que torna a meta de 90% de cobertura barata.
- `Result<T,E>` e gerador de UUID v7 disponíveis antes de qualquer entidade existir.
- Comandos reais registrados no `CLAUDE.md`.

**Non-Goals:**

- Nenhum schema de banco, nenhuma migration, nenhuma regra de domínio (change `fundacao-dominio` e `persistencia-sqlite`).
- Nenhuma tela de produto, nenhum token de tema com valor real (change `design-system-tema`).
- Nenhum backend, autenticação ou sync (ADR-03 — Fase 2).
- CI em nuvem: a verificação roda local, por comando. Pipeline hospedado é decisão posterior.

## Decisions

### D1 — UUID v7, contradizendo ARQUITETURA §3

O documento de arquitetura escreve `shared/id.ts # geração de UUID v4`. O documento de banco (§4.2) corrige explicitamente para **v7**, e o `CLAUDE.md` confirma v7. Como `movimento_estoque` é append-only e cresce indefinidamente, o v4 fragmenta o índice da chave primária ao longo do tempo; o v7 insere sempre na ponta e mantém a mesma propriedade de geração offline.

**Decisão: v7.** Alternativa considerada: v4 com um índice adicional por `criado_em` — rejeitada, porque adiciona um índice ao caminho crítico da baixa para resolver um problema que a escolha da chave já resolve de graça.

**Ação de documentação:** ARQUITETURA §3 precisa ser corrigida para v7 nesta change, senão o documento continua contradizendo o código.

### D2 — Lint de fronteira no dia 1, não "quando doer"

`eslint-plugin-boundaries` declarando cinco tipos de camada, mais o `grep` de ARQUITETURA §2.1 como script independente. Os dois, não um dos dois: o plugin cobre a direção das dependências entre camadas; o `grep` é a rede de segurança grosseira que continua funcionando se a configuração do ESLint quebrar ou for contornada por `eslint-disable`.

Alternativa considerada: só convenção documentada. Rejeitada — é exatamente o risco "Abstração vazando" de ARQUITETURA §9, e o mitigante listado lá é justamente lint + grep.

### D3 — Dois projetos de teste, não um

`jest.config.js` com dois projetos: um `domain` com ambiente `node` e nenhum transform de React Native, outro `app` com preset `jest-expo`. Rodar o domínio sob `jest-expo` funcionaria, mas paga o custo de transformar toda a árvore de `node_modules` do RN para testar funções puras — e o valor da meta de 90% depende de o ciclo ser de segundos.

### D4 — Development build desde o commit 1 (ADR-06)

Configurar EAS agora custa uma tarde. Descobrir na v1.1 que notificações e widget não rodam no Expo Go custa uma reconfiguração com código já escrito em cima. O perfil de desenvolvimento usa distribuição interna e cliente de desenvolvimento habilitado.

### D5 — Regra de "nenhum hex fora dos tokens" como lint, não como revisão

FRONTEND §12.1 pede isso explicitamente. Implementado como `no-restricted-syntax` sobre literais de string que casem com padrão hexadecimal de cor, com `src/presentation/theme/` na lista de exceção. Entra agora mesmo sem os tokens existirem, para que a change de tema já nasça conforme.

### D6 — `Result<T,E>` como união discriminada, sem classe

União discriminada por campo literal (`ok: true` / `ok: false`) em vez de classe com métodos encadeáveis. O projeto tem limite explícito contra over-engineering (ARQUITETURA §9); uma biblioteca de `Result` com `map`/`flatMap`/`match` traria uma linguagem própria para um app doméstico. A união discriminada dá a garantia de compilação que interessa — não dá para ler o valor sem checar o caso — com zero superfície nova.

## Risks / Trade-offs

| Risco | Mitigação |
|---|---|
| Versões da stack incompatíveis entre si (Reanimated, Drizzle, expo-sqlite e o SDK do Expo) | Instalar tudo via o instalador do Expo, que fixa versões compatíveis com o SDK; consultar a documentação corrente antes de fixar versão manualmente |
| `eslint-plugin-boundaries` mal configurado bloqueando imports legítimos e sendo desligado por frustração | Configurar com as cinco camadas explícitas e validar contra imports reais já na change seguinte; o `grep` independente permanece como piso mínimo |
| Development build exige conta EAS e um primeiro build antes de qualquer desenvolvimento no aparelho | Executar o primeiro build de desenvolvimento como tarefa explícita desta change, não como pré-requisito implícito da próxima |
| Três famílias de fonte pesando no bundle (FRONTEND §13) | Fora do escopo aqui; a change de tema carrega só os pesos usados e mede |
| Documentos-fonte divergirem do código já no primeiro commit | Corrigir ARQUITETURA §3 (UUID v7) dentro desta change, conforme a regra do `CLAUDE.md` de atualizar o documento em vez de divergir em silêncio |

## Migration Plan

Não há dados nem usuários — não existe migração. A única ordenação que importa: o development build precisa estar instalado no aparelho antes de qualquer trabalho de UI, e o lint de fronteira precisa estar verde antes do primeiro merge, senão ele nasce sendo ignorado.

## Open Questions

- **Nome do app**: "Repor" é placeholder declarado no PRD (Apêndice, item 5). O identificador do pacote e o nome de exibição precisam de uma decisão antes do primeiro build de produção — para o development build, o placeholder serve.
- **Package identifier**: definir `com.<algo>.repor` no primeiro build; trocar depois exige recriar credenciais.
