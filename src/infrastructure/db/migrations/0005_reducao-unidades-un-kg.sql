-- Redução de unidades a un/kg (change correcao-unidades-un-kg-preco).
--
-- Sem recriar `produto` (design D1): o DROP implícito da recriação apagaria
-- `movimento_estoque` em cascata se o PRAGMA foreign_keys=OFF fosse ignorado
-- dentro da transação do migrator. O CHECK antigo fica (superconjunto) e a
-- regra nova vira os dois triggers do fim do arquivo.
--
-- EXCEÇÃO DOCUMENTADA AO APPEND-ONLY: os UPDATEs em `movimento_estoque`
-- mudam só a escala de medida (g → kg), não o fato registrado. Sem eles o
-- histórico mostraria "Você anotou 200 kg" para 200 g.
--
-- A mesma aritmética existe em TS (domain/shared/quantidade.ts,
-- gramasParaKg/variacaoGramasParaKg) para o conversor de backup v5 → v6.
-- ROUND() do SQLite arredonda metade para longe do zero, igual ao TS.
--
-- Ordem: movimentos e itens antes de `produto`, porque o WHERE depende da
-- unidade antiga do produto.

-- 1. Histórico de produtos em g: ÷ 1000. Variação nunca vira 0
--    (ck_movimento_delta_nao_zero) — fração de grama vira 1 milésimo de kg.
UPDATE `movimento_estoque`
SET
  `quantidade_delta` = CASE
    WHEN CAST(ROUND(`quantidade_delta` / 1000.0) AS INTEGER) = 0
      THEN CASE WHEN `quantidade_delta` < 0 THEN -1 ELSE 1 END
    ELSE CAST(ROUND(`quantidade_delta` / 1000.0) AS INTEGER)
  END,
  `quantidade_resultante` = CAST(ROUND(`quantidade_resultante` / 1000.0) AS INTEGER)
WHERE `produto_id` IN (SELECT `id` FROM `produto` WHERE `unidade` = 'g');
--> statement-breakpoint

-- 2. Itens de compra em g → kg. Estimado zerado só em compra aberta (espelha
--    o produto que fica sem preço); valor pago de compra fechada é histórico.
UPDATE `compra_item`
SET
  `unidade` = 'kg',
  `quantidade_planejada` = CAST(ROUND(`quantidade_planejada` / 1000.0) AS INTEGER),
  `quantidade_comprada` = CAST(ROUND(`quantidade_comprada` / 1000.0) AS INTEGER),
  `valor_estimado_unit` = CASE
    WHEN `compra_id` IN (SELECT `id` FROM `compra` WHERE `status` = 'aberta') THEN 0
    ELSE `valor_estimado_unit`
  END
WHERE `unidade` = 'g';
--> statement-breakpoint

-- 3. Itens de compra em pacote/caixa → un sem mudar números; ml/L → un
--    arredondado para cima à unidade inteira.
UPDATE `compra_item` SET `unidade` = 'un' WHERE `unidade` IN ('pacote', 'caixa');
--> statement-breakpoint
UPDATE `compra_item`
SET
  `unidade` = 'un',
  `quantidade_planejada` = ((`quantidade_planejada` + 999) / 1000) * 1000,
  `quantidade_comprada` = ((`quantidade_comprada` + 999) / 1000) * 1000
WHERE `unidade` IN ('ml', 'L');
--> statement-breakpoint

-- 4. Produtos. Preço de g zerado: o número salvo é ambíguo entre R$/kg e
--    R$/100 g, e "sem preço" é estado seguro e visível.
UPDATE `produto`
SET
  `unidade` = 'kg',
  `quantidade_atual` = CAST(ROUND(`quantidade_atual` / 1000.0) AS INTEGER),
  `quantidade_necessaria` = CAST(ROUND(`quantidade_necessaria` / 1000.0) AS INTEGER),
  `valor_unitario` = 0
WHERE `unidade` = 'g';
--> statement-breakpoint
UPDATE `produto` SET `unidade` = 'un' WHERE `unidade` IN ('pacote', 'caixa');
--> statement-breakpoint
UPDATE `produto`
SET
  `unidade` = 'un',
  `quantidade_atual` = ((`quantidade_atual` + 999) / 1000) * 1000,
  `quantidade_necessaria` = ((`quantidade_necessaria` + 999) / 1000) * 1000,
  `valor_unitario` = 0
WHERE `unidade` IN ('ml', 'L');
--> statement-breakpoint

-- 5. Regra nova de unidade (invisível ao drizzle-kit, que não modela trigger).
CREATE TRIGGER `tg_produto_unidade_insert`
BEFORE INSERT ON `produto`
WHEN NEW.`unidade` NOT IN ('un', 'kg')
BEGIN
  SELECT RAISE(ABORT, 'CHECK constraint failed: ck_produto_unidade');
END;
--> statement-breakpoint
CREATE TRIGGER `tg_produto_unidade_update`
BEFORE UPDATE OF `unidade` ON `produto`
WHEN NEW.`unidade` NOT IN ('un', 'kg')
BEGIN
  SELECT RAISE(ABORT, 'CHECK constraint failed: ck_produto_unidade');
END;
