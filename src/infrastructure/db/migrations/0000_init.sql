CREATE TABLE `casa` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`criada_em` integer NOT NULL,
	`atualizado_em` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `compra` (
	`id` text PRIMARY KEY NOT NULL,
	`casa_id` text NOT NULL,
	`usuario_id` text NOT NULL,
	`status` text DEFAULT 'aberta' NOT NULL,
	`valor_total_pago` integer,
	`criada_em` integer NOT NULL,
	`finalizada_em` integer,
	`atualizado_em` integer NOT NULL,
	`sync_status` text DEFAULT 'local' NOT NULL,
	FOREIGN KEY (`casa_id`) REFERENCES `casa`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "ck_compra_status" CHECK("compra"."status" IN ('aberta','finalizada','cancelada')),
	CONSTRAINT "ck_compra_total" CHECK("compra"."valor_total_pago" IS NULL OR "compra"."valor_total_pago" >= 0),
	CONSTRAINT "ck_compra_finalizada_data" CHECK("compra"."status" <> 'finalizada' OR "compra"."finalizada_em" IS NOT NULL)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_compra_aberta` ON `compra` (`casa_id`) WHERE "compra"."status" = 'aberta';--> statement-breakpoint
CREATE TABLE `compra_item` (
	`id` text PRIMARY KEY NOT NULL,
	`compra_id` text NOT NULL,
	`produto_id` text,
	`nome_avulso` text,
	`unidade` text NOT NULL,
	`quantidade_planejada` integer NOT NULL,
	`quantidade_comprada` integer,
	`valor_estimado_unit` integer DEFAULT 0 NOT NULL,
	`valor_pago_unitario` integer,
	`comprado` integer DEFAULT false NOT NULL,
	`ordem` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`compra_id`) REFERENCES `compra`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`produto_id`) REFERENCES `produto`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "ck_compra_item_qtd_planejada" CHECK("compra_item"."quantidade_planejada" > 0),
	CONSTRAINT "ck_compra_item_qtd_comprada" CHECK("compra_item"."quantidade_comprada" IS NULL OR "compra_item"."quantidade_comprada" >= 0),
	CONSTRAINT "ck_compra_item_valor_pago" CHECK("compra_item"."valor_pago_unitario" IS NULL OR "compra_item"."valor_pago_unitario" >= 0),
	CONSTRAINT "ck_compra_item_comprado" CHECK("compra_item"."comprado" IN (0,1)),
	CONSTRAINT "ck_compra_item_origem" CHECK("compra_item"."produto_id" IS NOT NULL OR ("compra_item"."nome_avulso" IS NOT NULL AND length(trim("compra_item"."nome_avulso")) > 0)),
	CONSTRAINT "ck_compra_item_comprado_qtd" CHECK("compra_item"."comprado" = 0 OR "compra_item"."quantidade_comprada" IS NOT NULL)
);
--> statement-breakpoint
CREATE INDEX `idx_compra_item_compra` ON `compra_item` (`compra_id`,`ordem`);--> statement-breakpoint
CREATE TABLE `movimento_estoque` (
	`id` text PRIMARY KEY NOT NULL,
	`casa_id` text NOT NULL,
	`produto_id` text NOT NULL,
	`usuario_id` text NOT NULL,
	`compra_id` text,
	`tipo` text NOT NULL,
	`quantidade_delta` integer NOT NULL,
	`quantidade_resultante` integer NOT NULL,
	`motivo` text,
	`criado_em` integer NOT NULL,
	`sync_status` text DEFAULT 'local' NOT NULL,
	FOREIGN KEY (`casa_id`) REFERENCES `casa`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`produto_id`) REFERENCES `produto`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`compra_id`) REFERENCES `compra`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "ck_movimento_delta_nao_zero" CHECK("movimento_estoque"."quantidade_delta" <> 0),
	CONSTRAINT "ck_movimento_resultante" CHECK("movimento_estoque"."quantidade_resultante" >= 0),
	CONSTRAINT "ck_movimento_delta_sinal" CHECK(("movimento_estoque"."tipo" = 'baixa' AND "movimento_estoque"."quantidade_delta" < 0) OR ("movimento_estoque"."tipo" = 'reposicao' AND "movimento_estoque"."quantidade_delta" > 0) OR ("movimento_estoque"."tipo" = 'ajuste'))
);
--> statement-breakpoint
CREATE INDEX `idx_movimento_produto_data` ON `movimento_estoque` (`produto_id`,"criado_em" DESC);--> statement-breakpoint
CREATE INDEX `idx_movimento_casa_data` ON `movimento_estoque` (`casa_id`,"criado_em" DESC);--> statement-breakpoint
CREATE TABLE `produto` (
	`id` text PRIMARY KEY NOT NULL,
	`casa_id` text NOT NULL,
	`nome` text NOT NULL,
	`categoria` text,
	`unidade` text NOT NULL,
	`quantidade_atual` integer DEFAULT 0 NOT NULL,
	`quantidade_necessaria` integer NOT NULL,
	`valor_unitario` integer DEFAULT 0 NOT NULL,
	`marca_preferida` text,
	`observacao` text,
	`ativo` integer DEFAULT true NOT NULL,
	`criado_em` integer NOT NULL,
	`atualizado_em` integer NOT NULL,
	`deletado_em` integer,
	`sync_status` text DEFAULT 'local' NOT NULL,
	FOREIGN KEY (`casa_id`) REFERENCES `casa`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "ck_produto_nome" CHECK(length(trim("produto"."nome")) > 0),
	CONSTRAINT "ck_produto_unidade" CHECK("produto"."unidade" IN ('un','kg','g','L','ml','pacote','caixa')),
	CONSTRAINT "ck_produto_qtd_atual" CHECK("produto"."quantidade_atual" >= 0),
	CONSTRAINT "ck_produto_qtd_nec" CHECK("produto"."quantidade_necessaria" > 0),
	CONSTRAINT "ck_produto_valor" CHECK("produto"."valor_unitario" >= 0),
	CONSTRAINT "ck_produto_ativo" CHECK("produto"."ativo" IN (0,1)),
	CONSTRAINT "ck_produto_sync" CHECK("produto"."sync_status" IN ('local','pendente','sincronizado'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_produto_casa_nome` ON `produto` (`casa_id`,"nome" COLLATE NOCASE) WHERE "produto"."deletado_em" IS NULL;--> statement-breakpoint
CREATE INDEX `idx_produto_em_falta` ON `produto` (`casa_id`,`categoria`) WHERE "produto"."ativo" = 1 AND "produto"."deletado_em" IS NULL AND "produto"."quantidade_atual" < "produto"."quantidade_necessaria";--> statement-breakpoint
CREATE INDEX `idx_produto_categoria` ON `produto` (`casa_id`,"categoria" COLLATE NOCASE) WHERE "produto"."deletado_em" IS NULL;--> statement-breakpoint
CREATE TABLE `usuario` (
	`id` text PRIMARY KEY NOT NULL,
	`casa_id` text NOT NULL,
	`nome` text NOT NULL,
	`perfil` text DEFAULT 'admin' NOT NULL,
	`criado_em` integer NOT NULL,
	`atualizado_em` integer NOT NULL,
	FOREIGN KEY (`casa_id`) REFERENCES `casa`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "ck_usuario_perfil" CHECK("usuario"."perfil" IN ('admin','membro'))
);
