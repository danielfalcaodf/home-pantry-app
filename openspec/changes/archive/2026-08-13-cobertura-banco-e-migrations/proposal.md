## Why

**Type:** Bug Fix

O "bug" aqui é a lacuna de cobertura de teste apontada pela auditoria de QA sobre a camada de banco/migrations, não um comportamento incorreto em produção: `backup-pre-migration.ts`, os PRAGMAs de conexão (`client.ts`), o observador de mudanças (`observador.ts`), o fluxo de preparação do banco na abertura (`usePrepararBanco`/`app/_layout.tsx`), a aplicação de migrations a partir de versão intermediária e a garantia de que `reconciliar` não escreve no banco são todos comportamentos **já implementados e corretos**, mas sem nenhum teste automatizado que os prove — cada um pode regredir silenciosamente na próxima alteração sem que `npm test` acuse nada. A "correção" desta change é fechar essa lacuna: escrever os testes/guardas que faltam, provando o comportamento existente, e resolver a única divergência de interpretação de spec encontrada no caminho (`ACHADO-014`).

Adicionalmente, `ACHADO-005` remove um import morto (`Milesimos`, não usado) apontado pelo lint em `sqlite-produto.repository.ts:7` — trivial, sem risco, incluído aqui por tocar o mesmo arquivo da camada de repositórios.

**Dependencies between changes:** depende de `correcao-fuso-horario-testes` (Ordem 01, ver `openspec/changes/ORDER.md`) — essa change corrige os 2 testes que hoje falham por fuso horário e restaura o gate `npm test` totalmente verde. Como o fluxo de Bug Fix desta change (`/opsx:test`) exige rodar a suíte inteira sem falha pré-existente para provar que os testes novos não escondem regressão em meio a ruído, `cobertura-banco-e-migrations` só pode ser aplicada depois que 01 estiver arquivada.

## What Changes

- Cobrir `backup-pre-migration.ts` com teste de infraestrutura (SQLite em memória/fixture de arquivo): gera cópia antes de migration pendente, mantém só as 2 cópias mais recentes, e não faz nada quando não há migration pendente (ACHADO-004).
- Remover o import não utilizado `Milesimos` de `sqlite-produto.repository.ts:7` (ACHADO-005).
- Cobrir `client.ts` com teste que consulta de volta o PRAGMA `journal_mode` (espera `wal`), compara identidade de instância entre dois imports (singleton), e cobrir `observador.ts` com teste que mocka `addDatabaseChangeListener` e confirma que `assinar()` o invoca e que a função de cancelamento remove a inscrição (ACHADO-011).
- Cobrir `usePrepararBanco`/`app/_layout.tsx:33-56` com teste RTL do projeto Jest `app`: `useMigrations` mockado retornando sucesso (rota normal renderiza) e retornando erro (`TelaErro` renderiza) (ACHADO-012).
- Cobrir a aplicação de migrations a partir de versão intermediária: para cada migration N ≥ 1, aplicar `0..N-1`, inserir dados representativos, aplicar o restante, e comparar o schema final com o schema aplicado desde vazio (ACHADO-013).
- Registrar a decisão sobre `listarDespensa` usar `.select()` genérico vs. o cenário "Colunas explícitas" do spec de `repositorios` — o Drizzle sempre nomeia as colunas no SQL gerado mesmo com `.select()` vazio, então a divergência é de prática de código (padrão com `listarFaltantes`), não de SQL literal. A decisão é registrada no spec (clarificando o requisito) e, se confirmada, `listarDespensa` é alinhada ao padrão de `listarFaltantes` (ACHADO-014).
- Cobrir `reconciliar` (diagnóstico de integridade) com teste explícito de que a verificação não altera dados: contagem de `movimento_estoque` e `produto` antes e depois da chamada, permanecendo idêntica (ACHADO-044).

## Capabilities

### New Capabilities
(nenhuma)

### Modified Capabilities
- `banco-local`: adiciona os requisitos de conexão única com PRAGMAs verificáveis, backup automático pré-migration com retenção, e aplicação de migrations a partir de versão intermediária/preparação visível na abertura — comportamento já implementado, agora declarado como requisito testável.
- `repositorios`: esclarece o cenário "Colunas explícitas" do requisito de consulta da despensa, resolvendo a ambiguidade de interpretação apontada em ACHADO-014.
- `diagnostico-de-integridade`: esclarece o cenário "Verificação não altera dados" do requisito de verificação sob demanda, tornando explícito o método de prova (contagem antes/depois).

## Impact

- `src/infrastructure/db/backup-pre-migration.ts` — novo arquivo de teste, sem mudança de comportamento.
- `src/infrastructure/db/client.ts`, `src/infrastructure/db/observador.ts` — novos testes, sem mudança de comportamento.
- `src/infrastructure/db/migrations.test.ts` — novos casos de teste (aplicação a partir de versão intermediária).
- `app/_layout.tsx`, `src/composicao/banco.ts` — novo teste RTL (`usePrepararBanco`), sem mudança de comportamento no código de produção.
- `src/infrastructure/repositories/sqlite-produto.repository.ts` — remoção de import morto (linha 7); possível alinhamento de `listarDespensa` a `.select({...})` explícito, conforme decisão registrada.
- `src/infrastructure/repositories/sqlite-movimento.repository.ts` (`reconciliar`) — novo teste, sem mudança de comportamento.
- Nenhum impacto em `src/domain/`, `src/application/`, `src/presentation/` ou em schema/migrations novas.
