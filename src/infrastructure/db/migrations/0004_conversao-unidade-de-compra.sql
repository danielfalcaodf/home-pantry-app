PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_compra_item` (
	`id` text PRIMARY KEY NOT NULL,
	`compra_id` text NOT NULL,
	`produto_id` text,
	`nome_avulso` text,
	`unidade` text NOT NULL,
	`quantidade_planejada` integer NOT NULL,
	`quantidade_comprada` integer,
	`valor_estimado_unit` integer DEFAULT 0 NOT NULL,
	`valor_pago_unitario` integer,
	`quantidade_pacotes` integer,
	`fator_usado_na_compra` integer,
	`comprado` integer DEFAULT false NOT NULL,
	`ordem` integer DEFAULT 0 NOT NULL,
	`excluido` integer DEFAULT false NOT NULL,
	`atualizar_preco` integer,
	FOREIGN KEY (`compra_id`) REFERENCES `compra`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`produto_id`) REFERENCES `produto`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "ck_compra_item_qtd_planejada" CHECK("__new_compra_item"."quantidade_planejada" > 0),
	CONSTRAINT "ck_compra_item_qtd_comprada" CHECK("__new_compra_item"."quantidade_comprada" IS NULL OR "__new_compra_item"."quantidade_comprada" >= 0),
	CONSTRAINT "ck_compra_item_valor_pago" CHECK("__new_compra_item"."valor_pago_unitario" IS NULL OR "__new_compra_item"."valor_pago_unitario" >= 0),
	CONSTRAINT "ck_compra_item_comprado" CHECK("__new_compra_item"."comprado" IN (0,1)),
	CONSTRAINT "ck_compra_item_excluido" CHECK("__new_compra_item"."excluido" IN (0,1)),
	CONSTRAINT "ck_compra_item_atualizar_preco" CHECK("__new_compra_item"."atualizar_preco" IS NULL OR "__new_compra_item"."atualizar_preco" IN (0,1)),
	CONSTRAINT "ck_compra_item_qtd_pacotes" CHECK("__new_compra_item"."quantidade_pacotes" IS NULL OR "__new_compra_item"."quantidade_pacotes" > 0),
	CONSTRAINT "ck_compra_item_fator_usado" CHECK("__new_compra_item"."fator_usado_na_compra" IS NULL OR "__new_compra_item"."fator_usado_na_compra" > 0),
	CONSTRAINT "ck_compra_item_origem" CHECK("__new_compra_item"."produto_id" IS NOT NULL OR ("__new_compra_item"."nome_avulso" IS NOT NULL AND length(trim("__new_compra_item"."nome_avulso")) > 0)),
	CONSTRAINT "ck_compra_item_comprado_qtd" CHECK("__new_compra_item"."comprado" = 0 OR "__new_compra_item"."quantidade_comprada" IS NOT NULL),
	CONSTRAINT "ck_compra_item_excluido_produto" CHECK("__new_compra_item"."excluido" = 0 OR "__new_compra_item"."produto_id" IS NOT NULL)
);
--> statement-breakpoint
INSERT INTO `__new_compra_item`("id", "compra_id", "produto_id", "nome_avulso", "unidade", "quantidade_planejada", "quantidade_comprada", "valor_estimado_unit", "valor_pago_unitario", "quantidade_pacotes", "fator_usado_na_compra", "comprado", "ordem", "excluido", "atualizar_preco") SELECT "id", "compra_id", "produto_id", "nome_avulso", "unidade", "quantidade_planejada", "quantidade_comprada", "valor_estimado_unit", "valor_pago_unitario", NULL, NULL, "comprado", "ordem", "excluido", "atualizar_preco" FROM `compra_item`;--> statement-breakpoint
DROP TABLE `compra_item`;--> statement-breakpoint
ALTER TABLE `__new_compra_item` RENAME TO `compra_item`;--> statement-breakpoint
CREATE INDEX `idx_compra_item_compra` ON `compra_item` (`compra_id`,`ordem`);--> statement-breakpoint
CREATE TABLE `__new_produto` (
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
	`fator_conversao_embalagem` integer,
	`valor_referencia_embalagem` integer,
	`ativo` integer DEFAULT true NOT NULL,
	`criado_em` integer NOT NULL,
	`atualizado_em` integer NOT NULL,
	`deletado_em` integer,
	`sync_status` text DEFAULT 'local' NOT NULL,
	FOREIGN KEY (`casa_id`) REFERENCES `casa`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "ck_produto_nome" CHECK(length(trim("__new_produto"."nome")) > 0),
	CONSTRAINT "ck_produto_unidade" CHECK("__new_produto"."unidade" IN ('un','kg','g','L','ml','pacote','caixa')),
	CONSTRAINT "ck_produto_qtd_atual" CHECK("__new_produto"."quantidade_atual" >= 0),
	CONSTRAINT "ck_produto_qtd_nec" CHECK("__new_produto"."quantidade_necessaria" > 0),
	CONSTRAINT "ck_produto_valor" CHECK("__new_produto"."valor_unitario" >= 0),
	CONSTRAINT "ck_produto_fator_conversao" CHECK("__new_produto"."fator_conversao_embalagem" IS NULL OR "__new_produto"."fator_conversao_embalagem" > 0),
	CONSTRAINT "ck_produto_valor_referencia_embalagem" CHECK("__new_produto"."valor_referencia_embalagem" IS NULL OR "__new_produto"."valor_referencia_embalagem" >= 0),
	CONSTRAINT "ck_produto_ativo" CHECK("__new_produto"."ativo" IN (0,1)),
	CONSTRAINT "ck_produto_sync" CHECK("__new_produto"."sync_status" IN ('local','pendente','sincronizado'))
);
--> statement-breakpoint
INSERT INTO `__new_produto`("id", "casa_id", "nome", "categoria", "unidade", "quantidade_atual", "quantidade_necessaria", "valor_unitario", "marca_preferida", "observacao", "fator_conversao_embalagem", "valor_referencia_embalagem", "ativo", "criado_em", "atualizado_em", "deletado_em", "sync_status") SELECT "id", "casa_id", "nome", "categoria", "unidade", "quantidade_atual", "quantidade_necessaria", "valor_unitario", "marca_preferida", "observacao", NULL, NULL, "ativo", "criado_em", "atualizado_em", "deletado_em", "sync_status" FROM `produto`;--> statement-breakpoint
DROP TABLE `produto`;--> statement-breakpoint
ALTER TABLE `__new_produto` RENAME TO `produto`;--> statement-breakpoint
CREATE UNIQUE INDEX `ux_produto_casa_nome` ON `produto` (`casa_id`,"nome" COLLATE NOCASE) WHERE "produto"."deletado_em" IS NULL;--> statement-breakpoint
CREATE INDEX `idx_produto_em_falta` ON `produto` (`casa_id`,`categoria`) WHERE "produto"."ativo" = 1 AND "produto"."deletado_em" IS NULL AND "produto"."quantidade_atual" < "produto"."quantidade_necessaria";--> statement-breakpoint
CREATE INDEX `idx_produto_categoria` ON `produto` (`casa_id`,"categoria" COLLATE NOCASE) WHERE "produto"."deletado_em" IS NULL;--> statement-breakpoint
PRAGMA foreign_keys=ON;