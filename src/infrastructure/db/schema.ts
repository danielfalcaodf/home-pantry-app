import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const casa = sqliteTable('casa', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  criadaEm: integer('criada_em').notNull(),
  atualizadoEm: integer('atualizado_em').notNull(),
});

export const usuario = sqliteTable(
  'usuario',
  {
    id: text('id').primaryKey(),
    casaId: text('casa_id')
      .notNull()
      .references(() => casa.id, { onDelete: 'cascade' }),
    nome: text('nome').notNull(),
    perfil: text('perfil', { enum: ['admin', 'membro'] })
      .notNull()
      .default('admin'),
    criadoEm: integer('criado_em').notNull(),
    atualizadoEm: integer('atualizado_em').notNull(),
  },
  (t) => [check('ck_usuario_perfil', sql`${t.perfil} IN ('admin','membro')`)],
);

export const produto = sqliteTable(
  'produto',
  {
    id: text('id').primaryKey(),
    casaId: text('casa_id')
      .notNull()
      .references(() => casa.id, { onDelete: 'cascade' }),
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
      .notNull()
      .default('local'),
  },
  (t) => [
    uniqueIndex('ux_produto_casa_nome')
      .on(t.casaId, sql`${t.nome} COLLATE NOCASE`)
      .where(sql`${t.deletadoEm} IS NULL`),
    index('idx_produto_em_falta')
      .on(t.casaId, t.categoria)
      .where(
        sql`${t.ativo} = 1 AND ${t.deletadoEm} IS NULL AND ${t.quantidadeAtual} < ${t.quantidadeNecessaria}`,
      ),
    index('idx_produto_categoria')
      .on(t.casaId, sql`${t.categoria} COLLATE NOCASE`)
      .where(sql`${t.deletadoEm} IS NULL`),
    check('ck_produto_nome', sql`length(trim(${t.nome})) > 0`),
    check(
      'ck_produto_unidade',
      sql`${t.unidade} IN ('un','kg','g','L','ml','pacote','caixa')`,
    ),
    check('ck_produto_qtd_atual', sql`${t.quantidadeAtual} >= 0`),
    check('ck_produto_qtd_nec', sql`${t.quantidadeNecessaria} > 0`),
    check('ck_produto_valor', sql`${t.valorUnitario} >= 0`),
    check('ck_produto_ativo', sql`${t.ativo} IN (0,1)`),
    check(
      'ck_produto_sync',
      sql`${t.syncStatus} IN ('local','pendente','sincronizado')`,
    ),
  ],
);

export const compra = sqliteTable(
  'compra',
  {
    id: text('id').primaryKey(),
    casaId: text('casa_id')
      .notNull()
      .references(() => casa.id, { onDelete: 'cascade' }),
    usuarioId: text('usuario_id')
      .notNull()
      .references(() => usuario.id),
    status: text('status', { enum: ['aberta', 'finalizada', 'cancelada'] })
      .notNull()
      .default('aberta'),
    valorTotalPago: integer('valor_total_pago'),
    criadaEm: integer('criada_em').notNull(),
    finalizadaEm: integer('finalizada_em'),
    atualizadoEm: integer('atualizado_em').notNull(),
    syncStatus: text('sync_status').notNull().default('local'),
  },
  (t) => [
    uniqueIndex('ux_compra_aberta').on(t.casaId).where(sql`${t.status} = 'aberta'`),
    check('ck_compra_status', sql`${t.status} IN ('aberta','finalizada','cancelada')`),
    check('ck_compra_total', sql`${t.valorTotalPago} IS NULL OR ${t.valorTotalPago} >= 0`),
    check(
      'ck_compra_finalizada_data',
      sql`${t.status} <> 'finalizada' OR ${t.finalizadaEm} IS NOT NULL`,
    ),
  ],
);

// APPEND-ONLY: nunca UPDATE, nunca DELETE. Desfazer = movimento inverso.
export const movimentoEstoque = sqliteTable(
  'movimento_estoque',
  {
    id: text('id').primaryKey(),
    casaId: text('casa_id')
      .notNull()
      .references(() => casa.id, { onDelete: 'cascade' }),
    produtoId: text('produto_id')
      .notNull()
      .references(() => produto.id, { onDelete: 'cascade' }),
    usuarioId: text('usuario_id')
      .notNull()
      .references(() => usuario.id),
    // preenchido na reposição vinda de compra (DDL §4 + correção D8: com FK)
    compraId: text('compra_id').references(() => compra.id),
    tipo: text('tipo', { enum: ['baixa', 'reposicao', 'ajuste'] }).notNull(),
    quantidadeDelta: integer('quantidade_delta').notNull(),
    quantidadeResultante: integer('quantidade_resultante').notNull(),
    motivo: text('motivo'),
    criadoEm: integer('criado_em').notNull(),
    syncStatus: text('sync_status', { enum: ['local', 'pendente', 'sincronizado'] })
      .notNull()
      .default('local'),
  },
  (t) => [
    // correção D8: DESC para o histórico mais-recente-primeiro usar o índice
    index('idx_movimento_produto_data').on(t.produtoId, sql`${t.criadoEm} DESC`),
    index('idx_movimento_casa_data').on(t.casaId, sql`${t.criadoEm} DESC`),
    check('ck_movimento_delta_nao_zero', sql`${t.quantidadeDelta} <> 0`),
    check('ck_movimento_resultante', sql`${t.quantidadeResultante} >= 0`),
    check(
      'ck_movimento_delta_sinal',
      sql`(${t.tipo} = 'baixa' AND ${t.quantidadeDelta} < 0) OR (${t.tipo} = 'reposicao' AND ${t.quantidadeDelta} > 0) OR (${t.tipo} = 'ajuste')`,
    ),
  ],
);

export const compraItem = sqliteTable(
  'compra_item',
  {
    id: text('id').primaryKey(),
    compraId: text('compra_id')
      .notNull()
      .references(() => compra.id, { onDelete: 'cascade' }),
    produtoId: text('produto_id').references(() => produto.id, {
      onDelete: 'set null',
    }),
    nomeAvulso: text('nome_avulso'),
    unidade: text('unidade').notNull(),
    quantidadePlanejada: integer('quantidade_planejada').notNull(),
    quantidadeComprada: integer('quantidade_comprada'),
    valorEstimadoUnit: integer('valor_estimado_unit').notNull().default(0),
    valorPagoUnitario: integer('valor_pago_unitario'),
    comprado: integer('comprado', { mode: 'boolean' }).notNull().default(false),
    ordem: integer('ordem').notNull().default(0),
  },
  (t) => [
    index('idx_compra_item_compra').on(t.compraId, t.ordem),
    check('ck_compra_item_qtd_planejada', sql`${t.quantidadePlanejada} > 0`),
    check(
      'ck_compra_item_qtd_comprada',
      sql`${t.quantidadeComprada} IS NULL OR ${t.quantidadeComprada} >= 0`,
    ),
    check(
      'ck_compra_item_valor_pago',
      sql`${t.valorPagoUnitario} IS NULL OR ${t.valorPagoUnitario} >= 0`,
    ),
    check('ck_compra_item_comprado', sql`${t.comprado} IN (0,1)`),
    // ou é um produto do estoque, ou é um avulso com nome
    check(
      'ck_compra_item_origem',
      sql`${t.produtoId} IS NOT NULL OR (${t.nomeAvulso} IS NOT NULL AND length(trim(${t.nomeAvulso})) > 0)`,
    ),
    // marcado como comprado exige quantidade
    check(
      'ck_compra_item_comprado_qtd',
      sql`${t.comprado} = 0 OR ${t.quantidadeComprada} IS NOT NULL`,
    ),
  ],
);
