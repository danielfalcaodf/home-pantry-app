## 1. Correção do bug

- [x] 1.1 Domínio: `UNIDADES = ['un', 'kg']` em `src/domain/shared/unidade.ts`; `ehIndivisivel`
      vira `unidade === 'un'`; `ROTULOS` só com `un`/`kg`. Corrigir os erros de tipo que o
      `npm run typecheck` apontar (`quantidade-compra.rules.ts`,
      `presentation/format/quantidade-a-comprar.ts`, `estoque.rules.ts`, repositório falso de
      teste etc.) (design D5).
- [x] 1.2 Domínio: função pura de conversão de escala `g` → `kg` (÷ 1000 com arredondamento e
      proteção contra variação zero) e de volume → `un` (arredondar para cima ao milhar) em
      `domain/shared/`, usada pelo conversor de backup (design D2/D3).
- [x] 1.3 Domínio: `precoPorKg(valor, base: 'kg' | '100g')` em `dinheiro.ts` e
      `formatarPrecoDaUnidade(centavos, unidade)` (sufixo `/kg` só para `kg`) (design D4).
- [x] 1.4 Infra: migration custom `npx drizzle-kit generate --custom --name
      reducao-unidades-un-kg` com os `UPDATE`s na ordem do design D2 e os triggers
      `BEFORE INSERT`/`BEFORE UPDATE OF unidade` de D1 — **sem** recriar `produto`. Cabeçalho
      do `.sql` documenta a exceção ao append-only. Revisar o `.sql` manualmente. Em
      `schema.ts`, manter o `CHECK` antigo com comentário apontando para os triggers.
- [x] 1.5 Backup: `VERSAO_SCHEMA_BACKUP_ATUAL = 6` e `converterV5ParaV6` (produtos,
      movimentos, itensCompra) em `domain/backup/backup.schema.ts`, registrado em
      `CONVERSORES`; atualizar o comentário da contagem de migrations (design D3).
- [x] 1.6 Lista-base: `src/infrastructure/db/lista-base.json` com `pacote`/`caixa`/`L` → `un`
      e queijo `g` 300000 → `kg` 300 (design D6).
- [x] 1.7 Apresentação — embalagem: em `formulario-produto.tsx`, remover o ramo
      `pacote`/`caixa`; rótulo "É vendido em pacote fechado?" + exemplo "ex.: papel higiênico
      em pacote de 12 rolos" em texto secundário.
- [x] 1.8 Apresentação — preço em kg: chip "por kg · por 100 g" (`ChipEstado`, padrão
      "por kg", só para produto `kg`) nos campos de preço de `formulario-produto.tsx`,
      `sheet-preco-produto.tsx` e `sheet-ajuste-compra.tsx`, convertendo via `precoPorKg`;
      exibir preço de referência com `formatarPrecoDaUnidade` em `app/produto/[id].tsx` e
      onde mais o preço unitário aparece.
- [x] 1.10 Apresentação — máscaras (pedido do usuário, 2026-09-27): campos de quantidade em
      `kg` digitados "de caixa registradora" com 3 casas (5 → 0,005; 500 → 0,500) e campos de
      dinheiro com a mesma lógica e prefixo `R$`, via `react-native-mask-input` (já no projeto)
      em `CampoTexto` (`tipo="peso"`) e no `TecladoQuantidade`. Sem o piscar do TextInput controlado
      ("5" → "0,005"): `EntradaNumerica` guarda só os dígitos no TextInput (texto
      transparente) e desenha o valor formatado num `<Text>` sobreposto.
- [x] 1.9 Docs: atualizar `DATABASE-app-estoque-de-casa.md` (unidades, triggers, exceção de
      escala no append-only) e `CLAUDE.md` (lista de unidades indivisíveis `un`/`pacote`/`caixa`
      na regra de `quantidade_a_comprar`).

## 2. Prova do cenário do bug

- [x] 2.1 Teste de domínio: queijo `kg` com 500 milésimos a comprar e preço 5190 → custo 2595
      (R$ 25,95), e não R$ 2.595,00 (`estoque.rules.test.ts`).
- [x] 2.2 Teste de domínio: `precoPorKg(519, '100g') === 5190` e `precoPorKg(5190, 'kg') ===
      5190`; `formatarPrecoDaUnidade(5190, 'kg') === 'R$ 51,90/kg'`.
- [x] 2.3 Teste de infra (SQLite em memória): aplicar migrations 0000-0004, inserir produto `g`
      (500000 / 1000000 / preço 519) com movimento -200000, aplicar 0005 → produto `kg`
      500/1000/0, movimento -200/500, soma das variações = quantidade atual.

## 3. Casos de borda do mesmo contexto (obrigatório para Correção de Bug)

- [x] 3.1 Migration: produto `pacote` com fator 12 e produto `caixa` → `un` com números,
      preço e fator intactos.
- [x] 3.2 Migration: produto `L` 1500 preço 899 → `un` 2000 preço 0; produto `ml` idem.
- [x] 3.3 Migration: `compra_item` `g` em compra aberta (estimado zerado) e em compra fechada
      (`valor_pago_unitario` mantido, quantidades ÷ 1000, `unidade = 'kg'`).
- [x] 3.4 Migration: movimento de fração de grama (ex.: -400) não vira 0 nem aborta a
      migration (proteção de `ck_movimento_delta_nao_zero`).
- [x] 3.5 Migration: nenhum `movimento_estoque` é apagado e nenhum `compra_item.produto_id`
      vira `NULL` (contagem antes/depois) — prova de que não houve `DROP` de `produto`.
- [x] 3.6 Migration: `INSERT` e `UPDATE` de `produto` com unidade `g` depois da 0005 falham
      pelo trigger; `un`/`kg` passam.
- [x] 3.7 Migration desde cada versão intermediária (`migrations.test.ts`) continua verde com
      a 0005 e dados nas 7 unidades antigas.
- [x] 3.8 Backup: restaurar arquivo v5 com produto `g`, `caixa` (fator 6) e `L` → mesmo
      resultado da migration, reconciliação sem divergência; backup v4 passa pela cadeia até v6.
- [x] 3.9 Domínio: arredondamento de `un` (500 → 1000, 1200 → 2000, 2000 → 2000); `kg`
      preserva fração; teste de tipo `@ts-expect-error` rejeita `'g'` e `'pacote'` como
      `Unidade`; `validarFatorConversao` rejeita `kg`.
- [x] 3.10 RNTL: formulário oferece só `un`/`kg`; chip "É vendido em pacote fechado?" com
      exemplo aparece só em `un`; chip "por kg · por 100 g" aparece só em `kg` e "5,19" por
      100 g salva 5190 (atualizar `formulario-produto.embalagem.test.tsx`).
- [x] 3.11 RNTL: `sheet-preco-produto` e `sheet-ajuste-compra` com produto `kg` convertem por
      100 g; com produto `un` não mostram o chip.

## 4. Regressão

- [x] 4.1 Atualizar testes existentes que usam `pacote`/`caixa`/`g`/`ml`/`L` como unidade
      (domínio, application, infra, presentation) para `un`/`kg`, sem perder o que cada um
      prova.
- [x] 4.2 `npm test` completo verde.
- [x] 4.3 `npm run verificar` (fronteiras + lint + typecheck) sem violação.

## 5. QA — E2E (Maestro)

- [x] 5.1 Atualizar flows em `.maestro/` que selecionam `pacote`/`caixa` ou citam
      "Vem em pacote fechado?" para `un` e o texto novo.
- [x] 5.2 Flow novo: cadastrar queijo em `kg`, necessária 0,5, preço "5,19" por 100 g → Lista
      mostra custo R$ 25,95 e detalhe mostra "R$ 51,90/kg".
- [x] 5.3 Flow de upgrade: instalar build anterior, cadastrar produto `g` e produto `pacote`,
      instalar build novo → produto `g` aparece em `kg` sem preço, `pacote` aparece em `un`,
      histórico do produto com quantidades em kg.

## 6. Ajustes do /opsx:test (2026-09-27)

- [x] 6.1 `EntradaNumerica` não declara `accessibilityValue` vazio: o nome acessível virava
      "Quanto quero ter em casa, " — o Maestro tocava no rótulo e o valor ia para o campo com
      foco anterior, e o TalkBack lia uma vírgula solta. Corrigido em `campo-texto.tsx`;
      provado pelo flow `bug-unidade-kg-preco-por-100g.yaml` verde no emulador.
- [x] 6.2 Regenerar os tipos de rota e deixar `npm run verificar` sem erro de typecheck —
      fecha a 4.3. Causa-raiz: os 16 testes de tela ficavam dentro de `app/`, e o Expo Router
      tratava `app/_layout.test.tsx` como layout raiz (rota `"_layout.test"`), o que fazia o
      gerador de tipos descartar todas as rotas (`router.d.ts` vazio → 18 erros). Testes
      movidos com `git mv` para `__tests__/app/` (mesma estrutura; `jest.config.js` atualizado),
      como a doc do Expo Router exige ("não coloque testes dentro de app/").
- [x] 6.3 Preparar o emulador para a regressão E2E (apagar dados + lista-base semeada) e rodar
      os 16 flows atualizados na 5.1; `conversao-unidade-de-compra-*` usam nome fixo e só
      rodam num banco sem esses itens ativos.
      Resultado (2026-09-27, cada flow isolado: emulador resetado + lista básica): **15/16
      verdes** depois de atualizar 10 flows desatualizados antes desta change — nenhuma
      falha era de unidade/máscara: `bug-preco-*` passam a esperar o custo total no rótulo do
      item da compra (desde `26f6efc`), o "Continuar compra" da compra aberta e "Ver
      histórico" no Resumo; `bug-preco-total-multiplos-itens` ganha o preço do Açúcar (kg) e
      scroll; `dar-baixa-caminho-critico` repõe 1 un antes e usa o rótulo "Usei 1 un de";
      `screenshots-temas` rola compras de 40+ itens; `auditoria` tira o balão "Tools" do
      caminho e rola até "Menos opções". Falta só `bug-preco-item-reativado-fora-da-lista`
      (ver 6.5).
- [x] 6.4 Executar o par de upgrade da 5.3. Feito com o mesmo dev build (migrations são JS):
      código do `develop` (Metro :8082) → parte 1 → código novo (:8081) → parte 2, ambos verdes.
      Banco conferido: 5 → 6 migrations, `estoque.pre-v5.db` criado, queijo `g` 200000/500000
      R$ 5,19 → `kg` 200/500 sem preço, movimentos +300000/−100000 → +300/−100, `pacote` → `un`.
      Parte 1 corrigida: banco vazio mostra "Cadastrar do zero", não "Adicionar produto".
- [x] 6.5 Bug achado pelo E2E, **anterior a esta change** (sem relação com unidade/máscara),
      corrigido aqui por decisão do usuário: produto removido da Lista e devolvido ("Voltar ...
      pra lista") reaproveitava a linha-marcador da exclusão, criada com quantidade de espaço
      reservado (`QUANTIDADE_PLACEHOLDER`) — entrava na compra com 1 un no lugar dos 2 que
      faltam. Causa-raiz em `use-iniciar-compra.ts`: ao reabrir a compra, só o preço dos itens
      já materializados era ressincronizado. Agora a quantidade planejada também é (itens não
      comprados; o ajuste manual do Modo Compra fica em `quantidadeComprada`, intacto).
      Prova: teste do cenário (remover → reativar → iniciar = 2000) falha sem a correção;
      bordas: falta mudou em compra residual, ajuste manual preservado, item comprado intacto,
      item em dia sem escrita. E2E `bug-preco-item-reativado-fora-da-lista.yaml` verde →
      regressão E2E 16/16.
