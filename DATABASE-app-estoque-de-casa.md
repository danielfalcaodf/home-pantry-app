# Design de Banco de Dados — App de Estoque de Casa (SQLite)

| Campo | Valor |
|---|---|
| Versão | 0.1 |
| Data | 02/08/2026 |
| Documentos base | PRD v0.1 · Arquitetura v0.1 |
| SGBD | SQLite via `expo-sqlite` |
| Acesso | Drizzle ORM + drizzle-kit (migrations) |
| Escopo | MVP local-only, schema preparado para sync (Fase 2) |
| Validade/lotes | Fora do escopo por decisão — ver seção 10.2 |
| Categoria | Texto livre no produto — ver seção 3.2 |

```
Database Design Progress:
- [x] Step 1: Entidades e relacionamentos
- [x] Step 2: Normalizar (3NF)
- [x] Step 3: Avaliar desnormalização
- [x] Step 4: Índices para os padrões de query
- [x] Step 5: Escrever e otimizar queries críticas
- [x] Step 6: Estratégia de migração
- [x] Step 7: Pooling de conexão → N/A em SQLite; equivalente na seção 8
- [x] Step 8: Validar contra anti-patterns
```

---

## 1. Reality check de volume (define tudo que vem depois)

Antes de indexar qualquer coisa, o número que importa:

| Tabela | Volume esperado | Crescimento |
|---|---|---|
| `casa` | 1 linha | Nenhum |
| `usuario` | 1–2 linhas | Nenhum |
| `produto` | 80–300 linhas | Estável |
| `movimento_estoque` | ~7.000/ano (2 pessoas × ~10 baixas/dia) | **Único que cresce sem limite** |
| `compra` | ~50/ano | Lento |
| `compra_item` | ~1.500/ano | Lento |

**Consequência honesta:** com 300 produtos, um full scan em SQLite leva microssegundos. Nenhum índice em `produto` existe por performance no MVP. Os índices abaixo existem por dois motivos legítimos — garantir unicidade e servir a `movimento_estoque`, que é a única tabela que vai passar de dezenas de milhares de linhas.

Isso importa porque índice não é grátis: cada `INSERT` de baixa precisa atualizar todos os índices da tabela, e a baixa é justamente o caminho crítico de 10 segundos do PRD. **Índice demais aqui prejudica o KPI que mais importa.** Por isso o conjunto abaixo é deliberadamente enxuto.

---

## 2. Entidades e relacionamentos

```
                 casa (1)
                   │
        ┌──────────┼──────────┐
        │          │          │
   usuario (N)  produto (N)  compra (N)
        │          │          │
        │          │          └──── compra_item (N)
        │          │                     │
        │          └─────────────────────┘  (produto_id, nullable = item avulso)
        │          │
        └──────────┴──── movimento_estoque (N)
                          (produto_id + usuario_id)
```

| Relacionamento | Cardinalidade | Regra |
|---|---|---|
| casa → usuario | 1:N | MVP: 1 casa, 1 usuário local |
| casa → produto | 1:N | Toda query filtra por `casa_id` desde já |
| produto → movimento_estoque | 1:N | Append-only, nunca `UPDATE`/`DELETE` |
| compra → compra_item | 1:N | Cascade lógico na exclusão da compra |
| produto → compra_item | 0:N | `NULL` = item avulso (churrasco do fim de semana) |

**Não existe tabela `lista_compras`.** A lista é derivada por query (`quantidade_atual < quantidade_necessaria`) unida aos itens avulsos da compra aberta. Materializar a lista criaria o bug clássico de lista divergente do estoque — a mesma verdade em dois lugares.

---

## 3. Normalização

### 3.1 Conformidade com 3NF

| Forma | Situação |
|---|---|
| 1NF | ✅ Todos os valores atômicos, sem grupos repetidos |
| 2NF | ✅ Todas as PKs são simples (UUID); não há dependência parcial possível |
| 3NF | ⚠️ Uma exceção deliberada: `categoria` como texto no produto (3.2) |

Campos que **não** existem no schema porque seriam dependência transitiva ou derivada:

| Campo tentador | Por que não existe | Como obter |
|---|---|---|
| `produto.valor_total` | `= quantidade_atual × valor_unitario` | Função pura no domínio |
| `produto.em_falta` | `= quantidade_atual < quantidade_necessaria` | Função pura / `WHERE` |
| `produto.quantidade_a_comprar` | `= max(0, necessaria − atual)` | Função pura |
| `compra.quantidade_itens` | `COUNT` de `compra_item` | `COUNT(*)` — dezenas de linhas |

Persistir qualquer um deles cria divergência silenciosa: um `UPDATE` esquecido e o total do app passa a mentir sem erro nenhum aparecer.

### 3.2 Desvio consciente: `categoria` como texto livre

Decisão do usuário. Viola 3NF (a categoria é uma entidade própria repetida em N produtos), e o custo real aparece assim:

```
"Limpeza"  ≠  "limpeza"  ≠  "Produtos de limpeza"  ≠  "Limpeza "
```

Três categorias fantasma, filtro furado, "modo corredor de mercado" do PRD quebrado.

**Mitigações obrigatórias** (baratas, e evitam ter que migrar depois):

1. **Normalizar na escrita**, no domínio: `trim()`, colapsar espaços duplos, capitalizar a primeira letra. Nunca gravar o que o usuário digitou cru.
2. **Autocomplete a partir do que já existe** — o usuário escolhe de uma lista antes de poder digitar algo novo. É o que impede a divergência na prática.
3. **Índice `COLLATE NOCASE`** para o autocomplete agrupar variação de caixa.

Caminho de migração, se um dia isso incomodar (ordenação de corredor, cor por categoria, renomear em massa): criar `categoria(id, casa_id, nome, ordem)`, popular com `SELECT DISTINCT categoria`, adicionar `produto.categoria_id`, backfill por nome, dropar a coluna texto. É uma migration de ~20 linhas — o desvio é reversível, e é por isso que ele é aceitável agora.

### 3.3 Desnormalização deliberada: `produto.quantidade_atual`

Este é o ponto de design mais importante do schema.

Com `movimento_estoque` sendo append-only, a quantidade atual **poderia** ser sempre derivada:

```sql
SELECT SUM(quantidade_delta) FROM movimento_estoque WHERE produto_id = ?
```

| Critério | Derivar sempre (event sourcing puro) | Materializar em `produto` |
|---|---|---|
| Fonte única de verdade | ✅ Sim | ❌ Duas, precisam concordar |
| Custo da tela principal | `SUM` sobre milhares de linhas × 300 produtos | Leitura direta da coluna |
| Latência da baixa (KPI ≤ 10s) | Piora com o tempo | Constante |
| Risco de divergência | Zero | Existe se a transação quebrar |

**Decisão: materializar, com três salvaguardas.**

1. `INSERT` do movimento e `UPDATE` da quantidade acontecem **sempre na mesma transação**. Nunca em chamadas separadas.
2. `movimento_estoque.quantidade_resultante` grava o saldo após cada movimento — é a trilha de auditoria que permite achar exatamente onde divergiu.
3. Query de reconciliação (seção 6.6) roda no restore de backup e sob demanda, detectando drift.

Isto é desnormalização com prova de necessidade, não prematura: sem ela, o KPI de 10 segundos degrada linearmente com o histórico.

---

## 4. DDL completo

```sql
-- ═══════════════════════════════════════════════════════════
-- PRAGMAs — devem rodar na abertura, ANTES de qualquer query
-- ═══════════════════════════════════════════════════════════
PRAGMA journal_mode = WAL;      -- leitura concorrente com escrita
PRAGMA foreign_keys = ON;       -- ⚠️ SQLite vem com FK DESLIGADA
PRAGMA synchronous = NORMAL;    -- seguro com WAL, muito mais rápido
PRAGMA busy_timeout = 5000;

-- ═══════════════════════════════════════════════════════════
-- casa
-- ═══════════════════════════════════════════════════════════
CREATE TABLE casa (
  id             TEXT    PRIMARY KEY,
  nome           TEXT    NOT NULL,
  criada_em      INTEGER NOT NULL,
  atualizado_em  INTEGER NOT NULL
);

-- ═══════════════════════════════════════════════════════════
-- usuario
-- ═══════════════════════════════════════════════════════════
CREATE TABLE usuario (
  id             TEXT    PRIMARY KEY,
  casa_id        TEXT    NOT NULL REFERENCES casa(id) ON DELETE CASCADE,
  nome           TEXT    NOT NULL,
  perfil         TEXT    NOT NULL DEFAULT 'admin'
                         CHECK (perfil IN ('admin','membro')),
  criado_em      INTEGER NOT NULL,
  atualizado_em  INTEGER NOT NULL
);

-- ═══════════════════════════════════════════════════════════
-- produto
--   quantidade_* em MILÉSIMOS (1.5 kg = 1500)
--   valor_unitario em CENTAVOS (R$ 12,90 = 1290)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE produto (
  id                     TEXT    PRIMARY KEY,
  casa_id                TEXT    NOT NULL REFERENCES casa(id) ON DELETE CASCADE,
  nome                   TEXT    NOT NULL CHECK (length(trim(nome)) > 0),
  categoria              TEXT,
  unidade                TEXT    NOT NULL
                                 CHECK (unidade IN ('un','kg','g','L','ml','pacote','caixa')),
  quantidade_atual       INTEGER NOT NULL DEFAULT 0 CHECK (quantidade_atual >= 0),
  quantidade_necessaria  INTEGER NOT NULL           CHECK (quantidade_necessaria > 0),
  valor_unitario         INTEGER NOT NULL DEFAULT 0 CHECK (valor_unitario >= 0),
  marca_preferida        TEXT,
  observacao             TEXT,
  ativo                  INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0,1)),
  criado_em              INTEGER NOT NULL,
  atualizado_em          INTEGER NOT NULL,
  deletado_em            INTEGER,
  sync_status            TEXT    NOT NULL DEFAULT 'local'
                                 CHECK (sync_status IN ('local','pendente','sincronizado'))
);

-- ═══════════════════════════════════════════════════════════
-- movimento_estoque — APPEND-ONLY. Nunca UPDATE, nunca DELETE.
-- ═══════════════════════════════════════════════════════════
CREATE TABLE movimento_estoque (
  id                     TEXT    PRIMARY KEY,
  casa_id                TEXT    NOT NULL REFERENCES casa(id) ON DELETE CASCADE,
  produto_id             TEXT    NOT NULL REFERENCES produto(id) ON DELETE CASCADE,
  usuario_id             TEXT    NOT NULL REFERENCES usuario(id),
  compra_id              TEXT             REFERENCES compra(id),  -- preenchido na reposição
  tipo                   TEXT    NOT NULL
                                 CHECK (tipo IN ('baixa','reposicao','ajuste')),
  quantidade_delta       INTEGER NOT NULL CHECK (quantidade_delta <> 0),
  quantidade_resultante  INTEGER NOT NULL CHECK (quantidade_resultante >= 0),
  motivo                 TEXT,
  criado_em              INTEGER NOT NULL,
  sync_status            TEXT    NOT NULL DEFAULT 'local'
                                 CHECK (sync_status IN ('local','pendente','sincronizado')),

  -- coerência de sinal: baixa reduz, reposição aumenta
  CHECK (
    (tipo = 'baixa'      AND quantidade_delta < 0) OR
    (tipo = 'reposicao'  AND quantidade_delta > 0) OR
    (tipo = 'ajuste')
  )
);

-- ═══════════════════════════════════════════════════════════
-- compra
-- ═══════════════════════════════════════════════════════════
CREATE TABLE compra (
  id                TEXT    PRIMARY KEY,
  casa_id           TEXT    NOT NULL REFERENCES casa(id) ON DELETE CASCADE,
  usuario_id        TEXT    NOT NULL REFERENCES usuario(id),
  status            TEXT    NOT NULL DEFAULT 'aberta'
                            CHECK (status IN ('aberta','finalizada','cancelada')),
  valor_total_pago  INTEGER CHECK (valor_total_pago >= 0),
  criada_em         INTEGER NOT NULL,
  finalizada_em     INTEGER,
  atualizado_em     INTEGER NOT NULL,
  sync_status       TEXT    NOT NULL DEFAULT 'local',

  CHECK (status <> 'finalizada' OR finalizada_em IS NOT NULL)
);

-- ═══════════════════════════════════════════════════════════
-- compra_item
-- ═══════════════════════════════════════════════════════════
CREATE TABLE compra_item (
  id                    TEXT    PRIMARY KEY,
  compra_id             TEXT    NOT NULL REFERENCES compra(id) ON DELETE CASCADE,
  produto_id            TEXT             REFERENCES produto(id) ON DELETE SET NULL,
  nome_avulso           TEXT,
  unidade               TEXT    NOT NULL,
  quantidade_planejada  INTEGER NOT NULL CHECK (quantidade_planejada > 0),
  quantidade_comprada   INTEGER          CHECK (quantidade_comprada >= 0),
  valor_estimado_unit   INTEGER NOT NULL DEFAULT 0,
  valor_pago_unitario   INTEGER          CHECK (valor_pago_unitario >= 0),
  comprado              INTEGER NOT NULL DEFAULT 0 CHECK (comprado IN (0,1)),
  ordem                 INTEGER NOT NULL DEFAULT 0,

  -- ou é um produto do estoque, ou é um avulso com nome
  CHECK (produto_id IS NOT NULL OR (nome_avulso IS NOT NULL AND length(trim(nome_avulso)) > 0)),
  -- marcado como comprado exige quantidade
  CHECK (comprado = 0 OR quantidade_comprada IS NOT NULL)
);
```

### 4.1 Por que `CHECK` em vez de validar só no app

O domínio já valida. Os `CHECK` são a segunda linha: com código gerado por IA, um caso de uso novo pode gravar direto pelo repositório e furar a regra. O `CHECK` transforma um bug silencioso de dados (que só aparece 3 meses depois num total errado) em erro imediato de escrita. Custo em performance para este volume: irrelevante.

O `CHECK` de coerência de sinal em `movimento_estoque` é o mais valioso — ele torna impossível uma "baixa" que aumenta o estoque.

### 4.2 Chave primária: UUID v7, não v4

O documento de arquitetura dizia UUID v4. **Correção aqui:** use **UUID v7**.

| | v4 | v7 |
|---|---|---|
| Gerável offline sem coordenação | ✅ | ✅ |
| Ordenável por tempo de criação | ❌ | ✅ |
| Localidade no índice B-tree | ❌ aleatório, espalha inserções | ✅ sequencial |

Como `movimento_estoque` é append-only e cresce indefinidamente, a inserção aleatória do v4 fragmenta o índice da PK ao longo do tempo. O v7 insere sempre na ponta. Mesma propriedade de geração offline, mesmo formato TEXT — **é uma escolha sem desvantagem, e trocar depois exigiria reescrever todas as chaves.** Decida agora.

Armazenar como `TEXT` (36 chars) e não `BLOB` (16 bytes): 20 bytes a mais por linha em um banco de poucos MB, em troca de poder ler e depurar o dado. Troca certa nessa escala.

---

## 5. Índices

```sql
-- ── produto ─────────────────────────────────────────────
-- 1. Unicidade de nome por casa (case-insensitive), ignorando deletados
CREATE UNIQUE INDEX ux_produto_casa_nome
  ON produto (casa_id, nome COLLATE NOCASE)
  WHERE deletado_em IS NULL;

-- 2. Lista de compras: índice PARCIAL só sobre o que está em falta
CREATE INDEX idx_produto_em_falta
  ON produto (casa_id, categoria)
  WHERE ativo = 1 AND deletado_em IS NULL
    AND quantidade_atual < quantidade_necessaria;

-- 3. Autocomplete de categoria
CREATE INDEX idx_produto_categoria
  ON produto (casa_id, categoria COLLATE NOCASE)
  WHERE deletado_em IS NULL;

-- ── movimento_estoque (a tabela que realmente precisa) ──
-- 4. Histórico de um produto, mais recente primeiro
CREATE INDEX idx_movimento_produto_data
  ON movimento_estoque (produto_id, criado_em DESC);

-- 5. Histórico geral da casa / consumo por período
CREATE INDEX idx_movimento_casa_data
  ON movimento_estoque (casa_id, criado_em DESC);

-- ── compra ──────────────────────────────────────────────
-- 6. A compra aberta (deve haver no máximo uma por casa)
CREATE UNIQUE INDEX ux_compra_aberta
  ON compra (casa_id)
  WHERE status = 'aberta';

-- 7. Itens de uma compra
CREATE INDEX idx_compra_item_compra
  ON compra_item (compra_id, ordem);

-- ── Fase 2 (criar só quando o sync existir) ─────────────
-- CREATE INDEX idx_movimento_sync ON movimento_estoque (sync_status)
--   WHERE sync_status <> 'sincronizado';
-- CREATE INDEX idx_produto_sync   ON produto (sync_status)
--   WHERE sync_status <> 'sincronizado';
```

### 5.1 Notas sobre os índices

**Índice 1 (`ux_produto_casa_nome`)** resolve na raiz o problema de duplicata que o PRD tratava só com alerta na UI. `COLLATE NOCASE` faz "Arroz" e "arroz" colidirem. Limitação real: `NOCASE` no SQLite é ASCII-only — "Açúcar" e "açúcar" colidem (o `ç` e o `ú` são idênticos entre si), mas "Acucar" sem acento passa. A normalização no domínio continua necessária.

**Índice 2 (`idx_produto_em_falta`)** é um índice parcial com predicado comparando duas colunas da mesma linha — o SQLite aceita. Ele indexa só a fatia dos produtos que estão em falta, tipicamente 10–20% da tabela. Para valer, **a query precisa repetir literalmente o mesmo predicado** do índice (ver 6.2), senão o planejador ignora.

**O que deliberadamente NÃO foi indexado:**

| Índice não criado | Por quê |
|---|---|
| `produto(ativo)` | Booleano puro, 2 valores — anti-pattern clássico. Já entra como predicado parcial nos outros |
| `produto(sync_status)` no MVP | Não há sync ainda; índice sem uso só encarece escrita |
| `movimento(tipo)` | Baixa cardinalidade (3 valores) e nenhuma query filtra só por tipo |
| `movimento(usuario_id)` | 1 usuário no MVP; sem seletividade |
| `compra_item(produto_id)` | Tabela pequena; scan é mais rápido que o índice |

Cinco índices ativos no MVP. Cada `INSERT` em `movimento_estoque` (o caminho crítico da baixa) atualiza dois. É o mínimo defensável.

---

## 6. Queries críticas

### 6.1 Tela principal — estoque com estado

```sql
SELECT
  id, nome, categoria, unidade,
  quantidade_atual, quantidade_necessaria, valor_unitario,
  CASE
    WHEN quantidade_atual = 0                       THEN 'critico'
    WHEN quantidade_atual < quantidade_necessaria   THEN 'em_falta'
    ELSE 'ok'
  END AS estado
FROM produto
WHERE casa_id = ?1 AND ativo = 1 AND deletado_em IS NULL
ORDER BY
  CASE
    WHEN quantidade_atual = 0                     THEN 0
    WHEN quantidade_atual < quantidade_necessaria THEN 1
    ELSE 2
  END,
  nome COLLATE NOCASE;
```

Scan de ~300 linhas com sort em memória: sub-milissegundo. Sem índice dedicado de propósito — criar um para isso seria custo de escrita sem retorno mensurável.

### 6.2 Lista de compras (deve casar com o índice parcial)

```sql
SELECT
  p.id, p.nome, p.categoria, p.unidade, p.valor_unitario,
  (p.quantidade_necessaria - p.quantidade_atual)                    AS falta_bruta,
  (p.quantidade_necessaria - p.quantidade_atual) * p.valor_unitario AS custo_estimado_bruto
FROM produto p
WHERE p.casa_id = ?1
  AND p.ativo = 1
  AND p.deletado_em IS NULL
  AND p.quantidade_atual < p.quantidade_necessaria   -- ⚠️ repete o predicado do índice
ORDER BY p.categoria COLLATE NOCASE, p.nome COLLATE NOCASE;
```

⚠️ **`falta_bruta` não é a quantidade a comprar.** Está em milésimos e ainda não passou pelo arredondamento para cima em unidades indivisíveis (`un`, `pacote`, `caixa`). Esse arredondamento é regra de negócio e mora em `domain/shared/quantidade.ts`, não no SQL — replicá-lo em SQL criaria duas implementações da mesma regra, que é como o total do app começa a divergir do total da tela. O mesmo vale para o custo: o SQL entrega o bruto, o domínio arredonda e só então multiplica.

Verifique o uso do índice parcial com:

```sql
EXPLAIN QUERY PLAN <a query acima>;
-- esperado: SEARCH p USING INDEX idx_produto_em_falta (casa_id=?)
-- se aparecer SCAN produto, o predicado divergiu do índice
```

### 6.3 Dar baixa (caminho crítico — uma transação)

```sql
BEGIN IMMEDIATE;

  UPDATE produto
     SET quantidade_atual = MAX(0, quantidade_atual - ?2),
         atualizado_em    = ?3,
         sync_status      = 'pendente'
   WHERE id = ?1 AND deletado_em IS NULL;

  INSERT INTO movimento_estoque
    (id, casa_id, produto_id, usuario_id, tipo,
     quantidade_delta, quantidade_resultante, criado_em)
  SELECT ?4, casa_id, id, ?5, 'baixa',
         -(?2), quantidade_atual, ?3
    FROM produto WHERE id = ?1;

COMMIT;
```

Dois pontos que evitam bug:

- O `INSERT ... SELECT` lê `quantidade_atual` **depois** do `UPDATE`, garantindo que `quantidade_resultante` seja o saldo real e não uma cópia calculada no JavaScript que pode estar desatualizada.
- `MAX(0, ...)` no SQL é rede de segurança; a regra primária de não-negativo continua no domínio (é lá que ela é testada). Sem ele, o `CHECK (quantidade_atual >= 0)` faria a transação falhar e a baixa "sumiria" para o usuário.

### 6.4 Finalizar compra

```sql
BEGIN IMMEDIATE;
  -- por item marcado (loop no app, dentro da MESMA transação):
  UPDATE produto
     SET quantidade_atual = quantidade_atual + ?2,
         valor_unitario   = COALESCE(?3, valor_unitario),  -- só se o usuário confirmou
         atualizado_em    = ?4,
         sync_status      = 'pendente'
   WHERE id = ?1;

  INSERT INTO movimento_estoque (...) VALUES (..., 'reposicao', +?2, ..., ?5 /* compra_id */);

  -- ao final:
  UPDATE compra
     SET status = 'finalizada',
         finalizada_em = ?4,
         valor_total_pago = (
           SELECT COALESCE(SUM(quantidade_comprada * valor_pago_unitario), 0)
             FROM compra_item
            WHERE compra_id = ?5 AND comprado = 1
         )
   WHERE id = ?5;
COMMIT;
```

O loop de itens dentro de uma única transação é o oposto do anti-pattern de commit por item: ou a compra inteira repõe, ou nada repõe. Estoque metade reposto é o pior estado possível para a confiança no app.

### 6.5 Resumo de valores e gasto mensal

```sql
-- Valor do estoque em casa (em centavos·milésimos → dividir por 1000 no domínio)
SELECT COALESCE(SUM(quantidade_atual * valor_unitario), 0) AS valor_estoque_bruto
FROM produto
WHERE casa_id = ?1 AND ativo = 1 AND deletado_em IS NULL;

-- Gasto por mês (últimos 12 meses)
SELECT strftime('%Y-%m', finalizada_em / 1000, 'unixepoch', 'localtime') AS mes,
       SUM(valor_total_pago) AS total_centavos,
       COUNT(*)              AS qtd_compras
FROM compra
WHERE casa_id = ?1 AND status = 'finalizada'
  AND finalizada_em >= ?2
GROUP BY mes
ORDER BY mes DESC;
```

⚠️ Atenção à unidade em `quantidade_atual * valor_unitario`: milésimos × centavos = **centavos × 1000**. Isso precisa de uma única função de conversão no domínio, usada por toda a UI. É exatamente o tipo de detalhe que passa despercebido em código gerado e produz um valor 1000× errado na tela.

### 6.6 Reconciliação (detecta divergência da desnormalização)

```sql
SELECT p.id, p.nome,
       p.quantidade_atual                    AS materializado,
       COALESCE(SUM(m.quantidade_delta), 0)  AS calculado
FROM produto p
LEFT JOIN movimento_estoque m ON m.produto_id = p.id
WHERE p.casa_id = ?1 AND p.deletado_em IS NULL
GROUP BY p.id
HAVING materializado <> calculado;
```

Deve retornar **zero linhas sempre**. Rodar: após restaurar backup, e num botão escondido de diagnóstico. Se retornar algo, há transação quebrada em algum caminho de escrita — e o `movimento_estoque` permite recalcular o valor correto.

### 6.7 Prevenção de N+1

O caso natural de N+1 é a tela de compra: buscar os itens e, para cada um, buscar o produto.

```ts
// ERRADO — N+1
const itens = await db.select().from(compraItem).where(eq(compraItem.compraId, id));
for (const item of itens) {
  const produto = await db.select().from(produto).where(eq(produto.id, item.produtoId)); // N queries
}

// CERTO — um join só
const itens = await db
  .select({
    item: compraItem,
    produtoNome: produto.nome,
    produtoCategoria: produto.categoria,
  })
  .from(compraItem)
  .leftJoin(produto, eq(compraItem.produtoId, produto.id))   // leftJoin: avulso tem produto NULL
  .where(eq(compraItem.compraId, id))
  .orderBy(compraItem.ordem);
```

`leftJoin`, não `innerJoin` — item avulso tem `produto_id NULL` e sumiria da lista com inner join. Esse é um bug fácil de introduzir e difícil de notar.

---

## 7. Schema Drizzle

```ts
// src/infrastructure/db/schema.ts
import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, index, uniqueIndex, check } from 'drizzle-orm/sqlite-core';

export const casa = sqliteTable('casa', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  criadoEm: integer('criada_em').notNull(),
  atualizadoEm: integer('atualizado_em').notNull(),
});

export const usuario = sqliteTable('usuario', {
  id: text('id').primaryKey(),
  casaId: text('casa_id').notNull().references(() => casa.id, { onDelete: 'cascade' }),
  nome: text('nome').notNull(),
  perfil: text('perfil', { enum: ['admin', 'membro'] }).notNull().default('admin'),
  criadoEm: integer('criado_em').notNull(),
  atualizadoEm: integer('atualizado_em').notNull(),
});

export const produto = sqliteTable('produto', {
  id: text('id').primaryKey(),
  casaId: text('casa_id').notNull().references(() => casa.id, { onDelete: 'cascade' }),
  nome: text('nome').notNull(),
  categoria: text('categoria'),
  unidade: text('unidade', {
    enum: ['un', 'kg', 'g', 'L', 'ml', 'pacote', 'caixa'],
  }).notNull(),
  /** milésimos: 1.5 kg = 1500 */
  quantidadeAtual: integer('quantidade_atual').notNull().default(0),
  /** milésimos */
  quantidadeNecessaria: integer('quantidade_necessaria').notNull(),
  /** centavos: R$ 12,90 = 1290 */
  valorUnitario: integer('valor_unitario').notNull().default(0),
  marcaPreferida: text('marca_preferida'),
  observacao: text('observacao'),
  ativo: integer('ativo', { mode: 'boolean' }).notNull().default(true),
  criadoEm: integer('criado_em').notNull(),
  atualizadoEm: integer('atualizado_em').notNull(),
  deletadoEm: integer('deletado_em'),
  syncStatus: text('sync_status', { enum: ['local', 'pendente', 'sincronizado'] })
    .notNull().default('local'),
}, (t) => ({
  uxNome: uniqueIndex('ux_produto_casa_nome')
    .on(t.casaId, sql`${t.nome} COLLATE NOCASE`)
    .where(sql`${t.deletadoEm} IS NULL`),
  idxEmFalta: index('idx_produto_em_falta')
    .on(t.casaId, t.categoria)
    .where(sql`${t.ativo} = 1 AND ${t.deletadoEm} IS NULL
               AND ${t.quantidadeAtual} < ${t.quantidadeNecessaria}`),
  ckQtdAtual: check('ck_produto_qtd_atual', sql`${t.quantidadeAtual} >= 0`),
  ckQtdNec: check('ck_produto_qtd_nec', sql`${t.quantidadeNecessaria} > 0`),
  ckValor: check('ck_produto_valor', sql`${t.valorUnitario} >= 0`),
}));

export const movimentoEstoque = sqliteTable('movimento_estoque', {
  id: text('id').primaryKey(),
  casaId: text('casa_id').notNull().references(() => casa.id, { onDelete: 'cascade' }),
  produtoId: text('produto_id').notNull().references(() => produto.id, { onDelete: 'cascade' }),
  usuarioId: text('usuario_id').notNull().references(() => usuario.id),
  compraId: text('compra_id'),
  tipo: text('tipo', { enum: ['baixa', 'reposicao', 'ajuste'] }).notNull(),
  quantidadeDelta: integer('quantidade_delta').notNull(),
  quantidadeResultante: integer('quantidade_resultante').notNull(),
  motivo: text('motivo'),
  criadoEm: integer('criado_em').notNull(),
  syncStatus: text('sync_status', { enum: ['local', 'pendente', 'sincronizado'] })
    .notNull().default('local'),
}, (t) => ({
  idxProdutoData: index('idx_movimento_produto_data').on(t.produtoId, t.criadoEm),
  idxCasaData: index('idx_movimento_casa_data').on(t.casaId, t.criadoEm),
  ckDeltaSinal: check('ck_movimento_delta_sinal', sql`
    (${t.tipo} = 'baixa'     AND ${t.quantidadeDelta} < 0) OR
    (${t.tipo} = 'reposicao' AND ${t.quantidadeDelta} > 0) OR
    (${t.tipo} = 'ajuste')`),
}));
```

`compra` e `compra_item` seguem o mesmo padrão do DDL da seção 4.

**Nota:** o suporte a `check()` e a índices parciais varia entre versões do Drizzle. Se o `drizzle-kit generate` não emitir alguma dessas cláusulas, adicione-as manualmente no arquivo `.sql` da migration gerada — o drizzle-kit versiona o SQL, então edição manual é suportada e permanece rastreada.

---

## 8. Conexão (o equivalente a "pooling" aqui)

Pooling não se aplica: SQLite é embarcado, não há rede nem processo servidor. O erro equivalente é abrir várias conexões ou reabrir o banco a cada operação.

```ts
// src/infrastructure/db/client.ts
import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

// UMA instância para todo o app — módulo singleton
const sqlite = openDatabaseSync('estoque.db', { enableChangeListener: true });

sqlite.execSync(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA synchronous = NORMAL;
  PRAGMA busy_timeout = 5000;
`);

export const db = drizzle(sqlite, { schema });
```

| PRAGMA | Motivo |
|---|---|
| `foreign_keys = ON` | **SQLite desliga FK por padrão.** Sem isso, todos os `REFERENCES` do schema são decoração e órfãos entram no banco |
| `journal_mode = WAL` | Leitura não bloqueia escrita — a UI não trava durante uma baixa |
| `enableChangeListener` | Necessário para `useLiveQuery` do Drizzle re-renderizar após escrita |
| `synchronous = NORMAL` | Com WAL é seguro e reduz fsync; ganho direto na latência da baixa |

O `foreign_keys = ON` precisa rodar **por conexão**, na abertura. Se ele for esquecido, nada quebra visivelmente — o banco só vai acumulando inconsistência.

---

## 9. Estratégia de migração

### 9.1 O que muda em relação às regras clássicas

As regras de zero-downtime do playbook servidor não se aplicam direto: aqui não há tráfego concorrente nem deploy gradual. Mas há um problema pior — **você não controla o momento da atualização e não pode fazer rollback de dados no aparelho do usuário.**

| Regra clássica | Aqui |
|---|---|
| `CREATE INDEX CONCURRENTLY` | Não existe em SQLite; irrelevante nesse volume |
| Migração em lotes | Desnecessária (centenas de linhas) |
| Colunas novas nullable ou com default | ✅ Continua valendo integralmente |
| Nunca renomear em um passo | ✅ Vale mais ainda: usuário pode pular versões |
| Testar rollback | ✅ **Crítico** — sem rollback possível no dispositivo |

### 9.2 Regras para este projeto

1. **Toda migration é forward-only.** Não existe `down` executável no aparelho. O caminho de recuperação é backup + restore.
2. **Backup automático antes de aplicar migration.** Copiar o `.db` para um arquivo `estoque.pre-v{N}.db` antes de rodar `useMigrations`. Guardar as 2 últimas.
3. **Testar aplicando desde o schema vazio E desde cada versão anterior.** O usuário pode ficar 3 versões atrás.
4. **Nunca editar uma migration já publicada.** Corrigir com uma nova.
5. **Limitação de `ALTER TABLE` no SQLite:** `ADD COLUMN` e `RENAME` são suportados; **mudar tipo, adicionar CHECK ou alterar FK exigem o rebuild de 12 passos** (criar tabela nova, copiar, dropar, renomear). Por isso os `CHECK` estão todos na migration inicial — adicioná-los depois é caro.

### 9.3 Setup

```ts
// app/_layout.tsx
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from '@/infrastructure/db/migrations/migrations';

const { success, error } = useMigrations(db, migrations);
if (error) return <TelaErroMigration erro={error} />;   // nunca deixe falhar silencioso
if (!success) return <TelaCarregando />;
```

```jsonc
// drizzle.config.ts → dialect 'sqlite', driver 'expo'
// Fluxo: alterar schema.ts → npx drizzle-kit generate → revisar o .sql gerado → commit
```

**Sempre revise o `.sql` gerado antes do commit.** É onde se pega uma coluna que seria dropada por engano.

### 9.4 Backup e restore (obrigatório na Fase 1)

Sem backend, este é o único mecanismo contra perda total. Exportar como **JSON com versão de schema**, não copiar o `.db` binário — JSON sobrevive a mudanças de schema, arquivo binário não.

```json
{
  "schema_version": 3,
  "exportado_em": 1754150400000,
  "casa": { ... },
  "usuarios": [ ... ],
  "produtos": [ ... ],
  "movimentos": [ ... ],
  "compras": [ ... ]
}
```

O restore importa dentro de uma transação, aplica upsert por `id` (UUID torna isso seguro), e ao final roda a query de reconciliação da seção 6.6.

---

## 10. Riscos e pontos em aberto

### 10.1 Crescimento de `movimento_estoque`

Única tabela sem limite. ~7.000 linhas/ano ≈ 700 KB/ano — em 5 anos, ainda irrelevante para SQLite. **Não implemente purga agora.** Se um dia incomodar, o caminho é: gravar um movimento `ajuste` de consolidação com o saldo, e só então apagar os anteriores àquela data. Purgar sem consolidar quebra a reconciliação e, na Fase 2, a resolução de conflito por delta.

### 10.2 Validade e lotes (adiado por decisão)

Fica registrado o que a v1.1 vai custar: controle de validade **por lote** significa que a quantidade passa a ser por lote, e `produto.quantidade_atual` vira soma de `lote.quantidade`. Isso é uma migração estrutural, não uma coluna nova:

```
produto (1) ──< lote (N)   { id, produto_id, validade, quantidade, criado_em }
produto.quantidade_atual  →  derivada de SUM(lote.quantidade)
```

Se a v1.1 for só "uma data de validade por produto", é uma coluna e nada mais. **A diferença entre esses dois cenários vale ser decidida antes de escrever a v1.1**, não durante.

### 10.3 Demais riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| `foreign_keys` esquecido na abertura | Alto — órfãos silenciosos | PRAGMA no singleton + teste que verifica o pragma ligado |
| Divergência da quantidade materializada | Alto | Transação única + query 6.6 no restore e no diagnóstico |
| Escrita fora de transação em caso de uso novo | Alto | Todo caminho de escrita passa pelo repositório; nenhum acesso direto ao `db` fora de `infrastructure/` |
| Confusão de unidade (milésimos × centavos) | Alto | Conversão em função única no domínio, com teste; nenhuma tela faz aritmética de unidade |
| Categoria virando 3 variantes do mesmo nome | Médio | Normalização na escrita + autocomplete (3.2) |
| Migration corrompendo dados reais | Alto | Backup automático pré-migration + teste desde cada versão anterior |

---

## 11. Validação contra anti-patterns

| Anti-pattern | Situação |
|---|---|
| `SELECT *` | ✅ Colunas explícitas nas queries críticas |
| Paginação por `OFFSET` | ✅ Nenhuma lista pagina; histórico usa keyset por `criado_em` se necessário |
| N+1 | ✅ Tela de compra resolvida com `leftJoin` (6.7) |
| Indexar toda coluna | ✅ 5 índices ativos, com justificativa de exclusão documentada |
| UUID v4 como PK | ✅ **Corrigido para UUID v7** (4.2) |
| Dinheiro em FLOAT | ✅ Centavos em `INTEGER`; quantidade em milésimos |
| Sem foreign key "por performance" | ✅ FKs declaradas **e** `PRAGMA foreign_keys = ON` |
| Migrations gigantes | ✅ Forward-only, pequenas, revisadas antes do commit |
| Sem pooling | ✅ N/A — singleton de conexão + PRAGMAs (seção 8) |
| Desnormalização prematura | ✅ Uma só (`quantidade_atual`), justificada pelo KPI e com reconciliação |
| Regra de negócio duplicada em SQL | ✅ Arredondamento e conversão ficam só no domínio; SQL entrega valor bruto |

---

## 12. Ordem de implementação

| # | Entrega |
|---|---|
| 1 | `client.ts` com PRAGMAs + teste que valida `foreign_keys = ON` |
| 2 | `schema.ts` completo + migration `0000_init` + revisão do SQL gerado |
| 3 | Helpers de milésimos/centavos em `domain/shared/` com testes — **antes de qualquer query** |
| 4 | Seed das ~40 categorias/itens comuns |
| 5 | Repositório de produto (CRUD + queries 6.1 e 6.2) |
| 6 | Transação de baixa (6.3) + teste de rollback e de não-negativo |
| 7 | Transação de compra (6.4) + teste de falha no meio |
| 8 | Query de reconciliação (6.6) exposta em tela de diagnóstico |
| 9 | Export/import JSON com `schema_version` |
