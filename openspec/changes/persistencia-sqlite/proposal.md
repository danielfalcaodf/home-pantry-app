## Why

O domínio já calcula certo, mas não persiste nada. Esta change instala a fronteira de dados: o banco local, o schema versionado, e os repositórios atrás de interfaces — o único ponto do projeto onde a abstração é paga de propósito, porque é exatamente ali que a Fase 2 (sync) vai mexer (ADR-01, ADR-03).

Dois detalhes aqui não são detalhe. `PRAGMA foreign_keys = ON` precisa rodar a cada abertura de conexão, senão todos os `REFERENCES` do schema viram decoração e órfãos entram no banco em silêncio (DATABASE §8, risco de impacto **Alto**). E o `INSERT` em `movimento_estoque` com o `UPDATE` de `produto.quantidade_atual` precisam estar na **mesma transação** — a desnormalização de `quantidade_atual` é o que mantém o KPI de 10 segundos constante conforme o histórico cresce, e a transação única é o que impede que ela divirja (DATABASE §3.3).

## What Changes

- Cria `src/infrastructure/db/client.ts`: instância singleton de `expo-sqlite` com os quatro PRAGMAs (`journal_mode = WAL`, `foreign_keys = ON`, `synchronous = NORMAL`, `busy_timeout = 5000`) e `enableChangeListener` para o `useLiveQuery` funcionar.
- Cria `src/infrastructure/db/schema.ts`: schema Drizzle completo das seis tabelas de DATABASE §4, com os `CHECK` e os cinco índices ativos.
- Configura `drizzle.config.ts` e gera a migration `0000_init`, com revisão manual do `.sql` para adicionar o que o `drizzle-kit` não emitir (`CHECK`, índices parciais, `COLLATE NOCASE`, `DESC`).
- Liga `useMigrations` no layout raiz, com tela de erro explícita — migration nunca falha em silêncio (DATABASE §9.3).
- Cria as interfaces em `src/ports/`: `ProdutoRepository`, `MovimentoRepository`, `CompraRepository`, pequenas e por agregado (ISP).
- Implementa os três repositórios SQLite em `src/infrastructure/repositories/`, incluindo a **transação de baixa** e a **transação de finalização de compra**.
- Cria `src/infrastructure/db/seed.ts` com a lista base de ~40 itens comuns de mercado, inserida na primeira execução (ARQUITETURA §4.2).
- Cria o ponto de composição único onde as implementações concretas são ligadas às interfaces — a "troca de 1 linha" da Fase 2.
- Testes de infraestrutura com SQLite em memória: repositórios, transações, rollback, migrations em sequência, e um teste que verifica que `foreign_keys` está ligado.

## Capabilities

### New Capabilities

- `banco-local`: conexão SQLite única, PRAGMAs obrigatórios, schema versionado e migrations forward-only aplicadas na abertura do app.
- `repositorios`: contratos de persistência por agregado e suas implementações SQLite, com as transações que preservam a coerência entre estoque materializado e trilha de movimentos.
- `dados-iniciais`: carga da lista base de itens comuns na primeira execução, para que o app não abra vazio.

### Modified Capabilities

_Nenhuma._

## Impact

- **Cria**: `src/infrastructure/db/{client,schema,seed}.ts`, `src/infrastructure/db/migrations/`, `src/infrastructure/repositories/*`, `src/ports/*`, `drizzle.config.ts`, composição de repositórios.
- **Modifica**: `app/_layout.tsx` (aplicação de migrations e seed na abertura).
- **Depende de**: `bootstrap-projeto-expo` (stack instalada, UUID v7) e `fundacao-dominio` (tipos e regras que os repositórios consomem).
- **Bloqueia**: todas as changes de funcionalidade — nenhuma tela pode ler ou escrever antes disto.
- **Cria dado real no aparelho**: a partir desta change existe um `.db` com dados; migrations passam a ser forward-only de verdade e nunca podem ser editadas depois de publicadas.
