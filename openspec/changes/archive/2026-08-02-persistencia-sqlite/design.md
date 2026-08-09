## Context

O domínio existe e está testado, mas não persiste. Esta change estabelece a única fronteira de abstração que o projeto paga de propósito (ADR-01): repositórios atrás de interfaces, porque é o ponto exato onde a Fase 2 vai trocar `SQLiteProdutoRepository` por `SyncedProdutoRepository` sem tocar em tela nem em caso de uso.

Duas restrições dominam o desenho:

1. **A baixa é o caminho crítico** (KPI K4: ≤ 10s, ≤ 3 toques). `produto.quantidade_atual` é desnormalizado de propósito para que a leitura da tela principal seja uma coluna, não um somatório sobre milhares de movimentos (DATABASE §3.3). O preço disso é que a coerência passa a depender da transação.
2. **A partir daqui existem dados reais no aparelho.** Migrations viram forward-only de verdade. Uma migration publicada nunca mais pode ser editada, e não há reversão executável no dispositivo (DATABASE §9.2).

## Goals / Non-Goals

**Goals:**

- Conexão única com os quatro PRAGMAs, verificada por teste.
- Schema Drizzle fiel a DATABASE §4, incluindo os `CHECK` — que só podem existir na migration inicial, porque adicioná-los depois exige o rebuild de 12 passos do SQLite (§9.2).
- Transação de baixa e transação de finalização, ambas com teste de rollback.
- Interfaces pequenas por agregado, e um único ponto de composição.

**Non-Goals:**

- Hooks de caso de uso e telas — as changes seguintes.
- Índices de sincronização e tabela de fila de saída (Fase 2).
- Purga de histórico de movimento (DATABASE §10.1 é explícito: não implementar agora).
- Export/import JSON — change `backup-restore-json`, deliberadamente separada porque tem risco próprio.

## Decisions

### D1 — Os `CHECK` entram na migration `0000_init`, sem exceção

SQLite não permite adicionar `CHECK` por `ALTER TABLE`; exige criar tabela nova, copiar, dropar e renomear. Com dados reais no aparelho de um usuário que pode estar três versões atrás, esse rebuild é a operação mais arriscada do projeto.

**Decisão:** todo `CHECK` de DATABASE §4 nasce na migration inicial. Se o `drizzle-kit` não emitir algum, ele é adicionado **manualmente** no `.sql` gerado — o `drizzle-kit` versiona o SQL, então a edição manual é suportada e permanece rastreada (DATABASE §7, nota).

O `CHECK` de coerência de sinal do movimento é o mais valioso: ele torna impossível uma "baixa" que aumenta o estoque, que é a classe de bug que só aparece três meses depois em um total errado.

### D2 — `quantidade_resultante` lida do banco após o `UPDATE`, não calculada em JavaScript

A inserção do movimento usa `INSERT ... SELECT` lendo `quantidade_atual` depois do `UPDATE` (DATABASE §6.3). Calcular o saldo no JavaScript e passar como parâmetro parece equivalente e não é: se houver qualquer divergência entre o valor que o app acha que existe e o que está gravado, o `INSERT ... SELECT` grava a verdade e a reconciliação continua funcionando.

O `MAX(0, ...)` no SQL é rede de segurança, não a regra. A regra de não-negativo está no domínio, onde é testada — sem o `MAX` no SQL, o `CHECK` faria a transação inteira falhar e a baixa "sumiria" para o usuário, que é pior que fixar em zero.

### D3 — Interfaces por agregado, sem repositório genérico

`ProdutoRepository`, `MovimentoRepository`, `CompraRepository` — pequenas, por agregado (ISP explícito no `CLAUDE.md`). Nada de `Repository<T>` genérico com `findAll`/`save`/`delete`: um genérico obrigaria expor `delete` no movimento, que é justamente a operação que não pode existir.

O contrato do movimento **não declara** atualização nem remoção. Isso é design de tipo fazendo trabalho de política: desfazer não tem como ser implementado errado se o método errado não existe.

### D4 — Transação orquestrada no repositório, não no caso de uso

`darBaixa` é um método do `ProdutoRepository` que recebe os efeitos já calculados pelo domínio e os aplica atomicamente. A alternativa — o caso de uso chamando `produtoRepo.atualizarQuantidade()` e depois `movimentoRepo.inserir()` — não tem como ser transacional sem vazar o objeto de transação para `application/`, o que quebraria a regra de dependência.

Consequência: o `ProdutoRepository` conhece a tabela de movimento. Isso é aceito conscientemente — a transação é a unidade de consistência, e ela cruza as duas tabelas por natureza. Fatiar o repositório por tabela em vez de por unidade de consistência seria fatiar no lugar errado.

### D5 — Ponto de composição único, sem container de injeção

Um módulo que instancia os três repositórios SQLite e os exporta com o tipo da interface. Os hooks importam desse módulo. Na Fase 2 é literalmente a troca de uma linha (ARQUITETURA §8, passo 6).

Alternativa considerada: container de injeção de dependência ou React Context com provider de repositórios. Rejeitada — ARQUITETURA §9 lista "nada de DI container" como limite explícito contra over-engineering. Para teste, o caso de uso recebe o repositório como parâmetro com valor padrão vindo da composição.

### D6 — Seed é oferecido, não aplicado automaticamente

ARQUITETURA §4.2 diz "inserido na primeira execução". FRONTEND §11 especifica o estado vazio da despensa como *"Nada cadastrado ainda. Comece pelos 40 itens que quase toda casa tem — depois é só ajustar."* com o botão **Começar pela lista básica**.

**Decisão: o texto do frontend vence.** Inserir 40 itens automaticamente entrega um app que abre com uma despensa que não é a do usuário, e o primeiro trabalho dele vira apagar coisa. O JSON é embarcado no pacote; a inserção é disparada pelo estado vazio. Isso também resolve a adoção parcial (marcar/desmarcar) que o PRD pede como mitigação do risco de cadastro inicial pesado.

A tela de adoção em si é da change `despensa-e-cadastro-produto`; esta change entrega o JSON e o método de repositório que insere em lote numa transação.

### D7 — Testes de infraestrutura com SQLite em memória

`better-sqlite3` em memória sob Node, não emulador. O schema testado é o mesmo `.sql` das migrations, aplicado em sequência — é o que valida o requisito de aplicar desde o schema vazio e desde cada versão anterior.

Limitação honesta: `better-sqlite3` e `expo-sqlite` são builds diferentes do SQLite. O comportamento de `CHECK`, de índice parcial e de transação é do motor e é idêntico; o que não é coberto é o comportamento específico do binding do Expo. Um teste de fumaça no aparelho, verificando o PRAGMA de chaves estrangeiras ligado, cobre essa lacuna.

### D8 — Correções ao schema Drizzle publicado em DATABASE §7

Duas divergências entre o DDL (§4/§5) e o schema Drizzle (§7) do documento, corrigidas aqui:

- `idx_movimento_produto_data` está declarado sem `DESC` no Drizzle, e o DDL pede `criado_em DESC`. Sem isso, a consulta de histórico mais-recente-primeiro não usa a ordenação do índice.
- `compraId` em `movimento_estoque` está sem `.references()` no Drizzle, e o DDL declara a chave estrangeira para `compra`.

Ambas são corrigidas no `schema.ts` e no `.sql` gerado. O documento de banco é atualizado nesta change.

## Risks / Trade-offs

| Risco | Mitigação |
|---|---|
| `PRAGMA foreign_keys` esquecido em alguma abertura, deixando órfãos entrarem em silêncio | PRAGMA no módulo singleton, mais um teste que consulta o valor do PRAGMA e um teste que tenta inserir órfão e espera falha |
| Divergência entre quantidade materializada e soma dos movimentos | Transação única, quantidade resultante lida do banco, e a consulta de reconciliação implementada aqui — mesmo que a tela de diagnóstico só chegue numa change posterior |
| `drizzle-kit` não emitir `CHECK`, índice parcial ou `COLLATE NOCASE` | Tarefa explícita de revisar e completar o `.sql` gerado, com teste que verifica cada restrição em runtime tentando violá-la |
| Migration editada depois de publicada corrompendo dados reais | Backup do arquivo de banco antes de aplicar, mantendo as duas cópias mais recentes; regra registrada no guia do repositório |
| Consulta de faltantes divergindo do predicado do índice parcial e caindo em varredura completa | Teste que inspeciona o plano de execução e falha se não usar o índice |
| Regra de arredondamento sendo replicada no SQL por conveniência | Revisão explícita como tarefa; a consulta entrega diferença bruta, nomeada como bruta |
| Fixar a versão do Drizzle com suporte parcial a restrições e índices parciais | Consultar a documentação corrente do Drizzle antes de fixar a versão; a edição manual do `.sql` é o caminho de escape suportado |

## Migration Plan

Esta é a migration inicial — não há dados anteriores. O que importa é o que ela estabelece para o futuro:

1. `0000_init` cria as seis tabelas, todos os `CHECK` e os sete índices do MVP.
2. A partir do primeiro build instalado no aparelho, existem dados reais. Toda alteração de schema daqui em diante é uma migration nova, forward-only, nunca uma edição da anterior.
3. O caminho de recuperação de uma migration ruim é backup e restauração, não reversão — o que torna a change `backup-restore-json` uma dependência de segurança real, e não uma feature.

## Open Questions

- **Nome da casa padrão**: a casa criada na primeira execução precisa de um nome. Usar "Minha casa" como padrão editável, ou perguntar no primeiro uso? Perguntar adiciona uma tela ao caminho de abertura; o padrão editável não custa nada. Decisão desta change: padrão editável.
- **Perfil do usuário local**: o schema tem admin e membro (US-08), mas o MVP tem um usuário só. O usuário local é criado como admin; a distinção só passa a significar algo na Fase 2.
