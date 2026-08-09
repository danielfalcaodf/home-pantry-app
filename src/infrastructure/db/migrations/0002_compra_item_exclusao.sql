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
	`comprado` integer DEFAULT false NOT NULL,
	`ordem` integer DEFAULT 0 NOT NULL,
	`excluido` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`compra_id`) REFERENCES `compra`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`produto_id`) REFERENCES `produto`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "ck_compra_item_qtd_planejada" CHECK("__new_compra_item"."quantidade_planejada" > 0),
	CONSTRAINT "ck_compra_item_qtd_comprada" CHECK("__new_compra_item"."quantidade_comprada" IS NULL OR "__new_compra_item"."quantidade_comprada" >= 0),
	CONSTRAINT "ck_compra_item_valor_pago" CHECK("__new_compra_item"."valor_pago_unitario" IS NULL OR "__new_compra_item"."valor_pago_unitario" >= 0),
	CONSTRAINT "ck_compra_item_comprado" CHECK("__new_compra_item"."comprado" IN (0,1)),
	CONSTRAINT "ck_compra_item_excluido" CHECK("__new_compra_item"."excluido" IN (0,1)),
	CONSTRAINT "ck_compra_item_origem" CHECK("__new_compra_item"."produto_id" IS NOT NULL OR ("__new_compra_item"."nome_avulso" IS NOT NULL AND length(trim("__new_compra_item"."nome_avulso")) > 0)),
	CONSTRAINT "ck_compra_item_comprado_qtd" CHECK("__new_compra_item"."comprado" = 0 OR "__new_compra_item"."quantidade_comprada" IS NOT NULL),
	CONSTRAINT "ck_compra_item_excluido_produto" CHECK("__new_compra_item"."excluido" = 0 OR "__new_compra_item"."produto_id" IS NOT NULL)
);
--> statement-breakpoint
INSERT INTO `__new_compra_item`("id", "compra_id", "produto_id", "nome_avulso", "unidade", "quantidade_planejada", "quantidade_comprada", "valor_estimado_unit", "valor_pago_unitario", "comprado", "ordem") SELECT "id", "compra_id", "produto_id", "nome_avulso", "unidade", "quantidade_planejada", "quantidade_comprada", "valor_estimado_unit", "valor_pago_unitario", "comprado", "ordem" FROM `compra_item`;--> statement-breakpoint
DROP TABLE `compra_item`;--> statement-breakpoint
ALTER TABLE `__new_compra_item` RENAME TO `compra_item`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_compra_item_compra` ON `compra_item` (`compra_id`,`ordem`);