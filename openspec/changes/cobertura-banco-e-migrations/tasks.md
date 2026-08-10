## 1. Backup automático pré-migration (ACHADO-004)

- [ ] 1.1 Escrever `src/infrastructure/db/backup-pre-migration.test.ts`: gera cópia do arquivo de banco quando há migration pendente.
- [ ] 1.2 Cobrir a retenção: com duas ou mais cópias existentes, uma nova geração mantém só as duas mais recentes.
- [ ] 1.3 Cobrir o caso sem migration pendente: nenhuma cópia nova é criada.
- [ ] 1.4 Rodar os testes e confirmar que provam o comportamento atual sem exigir mudança de código em `backup-pre-migration.ts`.

## 2. Import não utilizado (ACHADO-005)

- [ ] 2.1 Remover o import de `Milesimos` em `src/infrastructure/repositories/sqlite-produto.repository.ts:7`.
- [ ] 2.2 Rodar `npm run lint` e confirmar 0 warnings no arquivo.

## 3. Garantias de conexão e observador (ACHADO-011)

- [ ] 3.1 Em `src/infrastructure/db/client.test.ts`, adicionar teste que consulta `PRAGMA journal_mode` e espera `'wal'`.
- [ ] 3.2 Adicionar teste que importa o cliente de banco por dois caminhos de módulo e confirma identidade de instância (singleton).
- [ ] 3.3 Criar `src/infrastructure/db/observador.test.ts`: mocka `addDatabaseChangeListener`, chama `assinar()`, confirma que o listener é registrado.
- [ ] 3.4 No mesmo arquivo, confirmar que a função de cancelamento retornada por `assinar()` remove a inscrição (desregistra o listener mockado).

## 4. Preparação do banco na abertura (ACHADO-012)

- [ ] 4.1 Localizar `usePrepararBanco` (`src/composicao/banco.ts`) e o consumo em `app/_layout.tsx:33-56`.
- [ ] 4.2 Escrever teste RTL (projeto Jest `app`) mockando `useMigrations` com `{ success: true, error: undefined }`: confirma que a rota normal renderiza, não `TelaErro`.
- [ ] 4.3 Escrever teste RTL mockando `useMigrations` com `{ success: false, error: new Error(...) }`: confirma que `TelaErro` renderiza e a interface normal não é alcançada.

## 5. Migrations a partir de versão intermediária (ACHADO-013)

- [ ] 5.1 Em `src/infrastructure/db/migrations.test.ts`, adicionar um `describe`/loop parametrizado: para cada migration N de 1 até o total menos 1, aplicar `0..N-1`, inserir dados representativos de cada tabela afetada.
- [ ] 5.2 Aplicar o restante das migrations e comparar o schema resultante (via introspecção do SQLite, ex. `PRAGMA table_info`/`sqlite_master`) com o schema produzido pela aplicação de todas as migrations desde um banco vazio.
- [ ] 5.3 Confirmar que os dados inseridos antes da aplicação do restante permanecem íntegros após a conclusão.

## 6. Colunas explícitas em `listarDespensa` (ACHADO-014)

- [ ] 6.1 Decisão registrada em `design.md`: alinhar `listarDespensa` ao padrão de `listarFaltantes`, nomeando colunas explicitamente.
- [ ] 6.2 Levantar todos os campos hoje consumidos do retorno de `listarDespensa` pelos chamadores (`application/`), para não omitir nenhuma coluna necessária ao restringir o `.select()`.
- [ ] 6.3 Alterar `listarDespensa` em `sqlite-produto.repository.ts` para `.select({...})` explícito, nomeando cada coluna, espelhando o padrão de `listarFaltantes` (linha 181-189).
- [ ] 6.4 Ajustar/estender o teste de infraestrutura de `listarDespensa` para confirmar que o retorno contém exatamente os campos esperados.

## 7. `reconciliar` não escreve no banco (ACHADO-044)

- [ ] 7.1 Em `src/infrastructure/repositories/sqlite-movimento.repository.test.ts`, adicionar teste que conta linhas de `movimento_estoque` e `produto` antes de chamar `reconciliar`.
- [ ] 7.2 Chamar `reconciliar` (com e sem divergência preexistente no banco de teste) e confirmar que as contagens depois são idênticas às de antes.

## 8. Gate de testes obrigatório

- [ ] 8.1 Rodar `npm run verificar` (fronteiras + lint + typecheck) e confirmar código de saída 0.
- [ ] 8.2 Rodar `npm test` completo e confirmar 100% verde, sem falhas pré-existentes remanescentes (depende de `correcao-fuso-horario-testes` já arquivada).
- [ ] 8.3 Rodar `npm run test:cov` e confirmar que a cobertura de domínio permanece ≥ 90% (nenhum teste desta change deveria reduzi-la, já que não toca `src/domain/`).
