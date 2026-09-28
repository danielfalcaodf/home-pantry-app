## Context

`produto.valor_unitario` é centavos **por 1 unidade da `unidade` do produto**. Em `g`/`ml`, isso
é centavos por grama/mililitro — o usuário digita o preço pensando em R$/kg ou R$/100 g, e o
custo sai 1000× (ou 100×) maior; mesmo o valor "correto" por grama não cabe em centavos
inteiros. A exploração com o usuário (2026-09-27) decidiu não remendar o preço dessas unidades,
e sim reduzir o conjunto de unidades a `un` e `kg` — a casa compra por item ou a granel por
peso. O usuário confirmou: não há produtos em `ml`/`L` no aparelho; o preço dos produtos em `g`
pode ser zerado; `pacote`/`caixa` também saem (o fator de embalagem da change
`conversao-unidade-de-compra` já cobre "vem em pacote de N").

Estado relevante do código:

- `UNIDADES` em `src/domain/shared/unidade.ts` alimenta o tipo `Unidade`, os seletores de todas
  as telas e `ehIndivisivel`.
- `CHECK ck_produto_unidade IN ('un','kg','g','L','ml','pacote','caixa')` em `produto`.
  `compra_item.unidade` é texto sem `CHECK`. `movimento_estoque` não guarda unidade — a
  variação é lida na unidade do produto.
- `movimento_estoque.produto_id` tem `ON DELETE cascade`; `compra_item.produto_id` tem
  `ON DELETE set null`.
- Backup JSON versionado (`VERSAO_SCHEMA_BACKUP_ATUAL = 5`) com cadeia de `CONVERSORES`.

## Goals / Non-Goals

**Goals:**

- Eliminar o bug de preço por grama removendo as unidades que o produzem.
- Converter dados existentes no aparelho e em backups antigos sem perder linha nem histórico.
- Preço em `kg` digitável por kg ou por 100 g, sempre gravado em R$/kg.

**Non-Goals:**

- Embalagem com conteúdo para produto divisível ("garrafa de 900 ml", "café 500 g") — fica
  para feature futura, se fizer falta.
- Exibir quantidades em `kg` abaixo de 1 como gramas (`500 g` em vez de `0,5 kg`) — só
  formatação, decidir depois.
- Recalcular `compra.valor_total_pago` de compras fechadas afetadas pelo bug.

## Decisions

### D1. Não recriar a tabela `produto`; manter o `CHECK` antigo e adicionar triggers

Alternativa gerada por padrão pelo `drizzle-kit`: recriar `produto` (`__new_produto` + `DROP` +
`RENAME`) com o `CHECK` novo, precedida de `PRAGMA foreign_keys=OFF`. As migrations 0002 e 0004
fizeram isso, mas só em `compra_item`, que ninguém referencia. `produto` é pai de
`movimento_estoque` (`ON DELETE cascade`): se o migrator do `expo-sqlite`/Drizzle aplicar a
migration dentro de uma transação, o `PRAGMA foreign_keys=OFF` é ignorado pelo SQLite, e o
`DROP TABLE produto` faz `DELETE` implícito — **apagando todo o histórico de movimentos** e
anulando `compra_item.produto_id`. Risco de perda total de dados sem ganho de comportamento.

Decisão: a migration **não** mexe na estrutura de `produto`. O `CHECK` antigo (superconjunto das
unidades válidas) fica como está em `schema.ts` (com comentário explicando por quê), e a
restrição nova vira dois triggers `BEFORE INSERT`/`BEFORE UPDATE OF unidade ON produto` com
`RAISE(ABORT)` quando `NEW.unidade NOT IN ('un','kg')`. Migration criada com
`npx drizzle-kit generate --custom --name reducao-unidades-un-kg` (o drizzle-kit não modela
triggers), contendo só `UPDATE`s + `CREATE TRIGGER`. Resultado: nenhum `DROP`, nenhuma
dependência do estado do `PRAGMA`.

### D2. Conversão de dados na própria migration, por `UPDATE` em SQL

Ordem dentro da migration (o `WHERE` depende da unidade antiga do produto, então produto é
convertido por último):

1. `movimento_estoque` de produtos `g`: `quantidade_delta` e `quantidade_resultante` ÷ 1000.
2. `compra_item` com `unidade = 'g'`: quantidades ÷ 1000, `unidade = 'kg'`; `valor_estimado_unit`
   zerado em compras `aberta` (espelha o produto "sem preço"); `valor_pago_unitario` de itens
   já comprados mantém o número (histórico, reinterpretado como R$/kg).
3. `compra_item` com `pacote`/`caixa`/`ml`/`L` → `un` (quantidades de `ml`/`L` arredondadas
   para cima ao milhar).
4. `produto` `g` → `kg`, quantidades ÷ 1000, `valor_unitario = 0`; `pacote`/`caixa` → `un`
   sem mudar números; `ml`/`L` → `un` arredondado para cima, `valor_unitario = 0`.
5. Triggers de D1.

Divisão por 1000: `g` é gravado em milésimos de grama, então 1 g = 1000 → 1 milésimo de kg,
exato. Fração abaixo de 1 g só existe se o usuário digitou decimal de grama; nesse caso
arredonda (`ROUND`). Se a variação de um movimento arredondar para 0, violaria
`ck_movimento_delta_nao_zero` e abortaria a migration — por isso a variação usa
`CASE WHEN ROUND(x/1000.0)=0 THEN SIGN(x) ELSE ROUND(x/1000.0) END`. Divergência residual (só
com gramas fracionárias) é detectável e corrigível pelo `diagnostico-de-integridade` existente.

**Exceção ao append-only**: reescrever `movimento_estoque` aqui é mudança de escala de medida,
não de fato registrado — sem ela o histórico mostraria "Você anotou 200 kg". Alternativa
(inserir movimentos de ajuste compensando) polui o histórico e não corrige os antigos. A
exceção fica documentada no cabeçalho do `.sql` e no `DATABASE-app-estoque-de-casa.md`.

**Preço de `g` zerado** (decisão do usuário): o número salvo é ambíguo entre R$/kg e R$/100 g;
manter o número deixaria erro silencioso de 10× para quem digitou por 100 g. "Sem preço" já é
estado seguro e visível (não corrompe o total).

### D3. Backup v6 com conversor espelhando a migration em TypeScript puro

`converterV5ParaV6` em `domain/backup/backup.schema.ts` aplica as mesmas regras de D2 sobre
`produtos`, `movimentos` e `itensCompra` do arquivo (e, pela cadeia de conversores, também
sobre backups v1-v4). A aritmética de conversão (÷ 1000 com proteção contra zero, arredondar
para cima ao milhar) vira função pura em `domain/shared/` usada pelo conversor e testada uma
vez; o SQL da migration replica a regra (inevitável: SQL não chama TS) e os testes de infra
provam que ambos produzem o mesmo resultado para o mesmo dado.

### D4. Preço por 100 g é só base de digitação

Função pura `precoPorKg(valorDigitado: Centavos, base: 'kg' | '100g'): Centavos` em
`domain/shared/dinheiro.ts` (×10 para `'100g'`). A base não é persistida — o chip volta a
"por kg" a cada abertura. Alternativa (coluna `preco_base` por produto) rejeitada na exploração:
coluna nova para uma preferência de digitação. O chip é o mesmo `ChipEstado` já usado no
formulário (sem componente novo). Exibição com sufixo `/kg` via formatador de domínio
(`formatarPrecoDaUnidade(c, unidade)`), usado onde hoje aparece "costuma custar R$ X".

### D5. `ehIndivisivel` e embalagem

`ehIndivisivel(u) = u === 'un'`. `validarFatorConversao` não muda de código (continua chamando
`ehIndivisivel`). No formulário, o ramo "unidade `pacote`/`caixa` vai direto aos campos de
embalagem" é removido; o chip passa a "É vendido em pacote fechado?" + exemplo "ex.: papel
higiênico em pacote de 12 rolos" em texto secundário.

### D6. Lista-base sugerida atualizada à mão

`src/infrastructure/db/lista-base.json` tem 9 itens em `pacote`, 2 em `caixa`, 1 em `g` e 1 em
`L`. Todos passam a `un` com a mesma quantidade (1 pacote de arroz → 1 un; leite 4 L → 4 un,
caixa de 1 L), exceto "Queijo mussarela" `g` 300000 → `kg` 300. Arquivo estático: edição direta,
sem conversor.

## Risks / Trade-offs

- [Migrator roda a migration em transação e algum `UPDATE` falha no meio] → rollback total da
  migration (comportamento desejado); backup automático do `.db` já existe antes de migration
  pendente. Teste de infra aplica a migration desde cada versão com dados em todas as 7
  unidades antigas.
- [`CHECK` antigo em `schema.ts` diverge da regra real] → comentário no schema apontando para os
  triggers; teste de infra prova que `INSERT`/`UPDATE` com `g` falha.
- [Triggers invisíveis ao Drizzle; um `drizzle-kit generate` futuro não os conhece] → triggers
  não são tocados por migrations geradas (drizzle só recria o que modela); documentar no
  DATABASE doc.
- [`compra.valor_total_pago` de compras fechadas com item em `g` pode estar inflado pelo bug] →
  fora de escopo; histórico financeiro não é reescrito. Se aparecer no gasto mensal, tratar
  numa change própria.
- [Produto `ml`/`L` convertido para `un` fica com quantidade sem sentido] → usuário confirmou
  que não há dados nessas unidades; é só saída de segurança para a migration não falhar.
- [Flows Maestro e testes que citam `pacote`/`caixa`/"Vem em pacote fechado?"] → atualizados
  nesta change.

## Migration Plan

1. Usuário gera **backup JSON** em Configurações antes de instalar a versão (lembrete no PR e
   nas notas da versão).
2. App abre → backup automático do `.db` → migration `0005_reducao-unidades-un-kg` aplica.
3. Rollback: não há rollback executável no aparelho (forward-only). Recuperação = restaurar o
   backup JSON, que passa pelo `converterV5ParaV6`.

## Open Questions

- Confirmar na implementação se o migrator do `drizzle-orm/expo-sqlite` envolve cada migration
  em transação (afeta só o comportamento em falha — D1 já elimina o risco de perda).
