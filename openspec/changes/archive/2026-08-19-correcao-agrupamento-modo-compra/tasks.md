# Tasks — correcao-agrupamento-modo-compra

**Type:** Correção de Bug. Corrigir primeiro, provar com o teste do cenário exato do defeito,
e então obrigatoriamente cobrir os casos de borda do mesmo contexto.

## 1. Correção — cabeçalhos de categoria no Modo Compra (A-08)

- [x] 1.1 `agrupar-lista.ts` não podia ser usado direto — `ItemDaCompra` (aplicação de Modo
  Compra) e `ItemDaLista` (Lista) têm formas diferentes (`item`+`produto` vs. `nome`/`categoria`
  direto). Extraído o núcleo genérico (`agruparPorCategoriaGenerico`/`listaContinuaGenerico`,
  algoritmo idêntico ao original) do qual `agruparListaPorCategoria`/`listaContinua` agora são
  wrappers finos — comportamento e testes existentes intactos — e `app/compra/[id].tsx` passa a
  chamar o mesmo núcleo com acessores para `nome`/`categoria`/`chave` de `ItemDaCompra`. Zero
  algoritmo de agrupamento duplicado.
- [x] 1.2 `usePreferenciaDeAgrupamento` (a mesma da Lista) lida em `compra/[id].tsx` — nenhuma
  preferência própria criada.
- [x] 1.3 Cabeçalho renderizado com o mesmo estilo/estrutura do cabeçalho de categoria da Lista
  (`paddingHorizontal/Top/Bottom` + `Texto papel="caption" tom="secondary"`).
- [x] 1.4 Cabeçalho é um `View` sem `onPress`/`Pressable` — não tocável, sem navegação,
  recolhimento ou contagem, mesmo padrão da Lista.

## 2. Prova do cenário exato do defeito relatado

- [x] 2.1 (já confirmado em rodada anterior — ver "Pendências") cabeçalhos CARNES/GRÃOS E
  MASSAS/HIGIENE/etc aparecem no Modo Compra.
- [x] 2.2 Confirmado 2026-08-19 (agora desbloqueado pela change 16, que corrigiu a altura
  colapsada da Lista): com a mesma massa de 30 itens, Lista e Modo Compra mostram exatamente a
  mesma ordem de grupos e itens (CARNES → Carne moída; GRÃOS E MASSAS → Arroz, Farinha de trigo,
  Feijão, Macarrão; HIGIENE → Condicionador...) — comparação lado a lado, não só "existem
  cabeçalhos".

## 3. Casos de borda do mesmo contexto (obrigatório)

- [x] 3.1 Confirmado 2026-08-19: agrupamento desligado na Lista → Modo Compra abre em lista
  contínua ordenada por nome (Açúcar, Alho, Amaciante, Arroz, Azeite...), sem cabeçalhos.
- [x] 3.2 Confirmado 2026-08-19: a preferência lida em tempo real (desligada → contínua, ligada
  → agrupada), mesmo hook `usePreferenciaDeAgrupamento` da Lista.
- [ ] 3.3 Não testado nesta rodada (precisa de item avulso sem categoria na massa atual).
- [x] 3.4/3.6/3.7 (já confirmados em rodada anterior — ver "Pendências").
- [ ] 3.5 Não testado nesta rodada (precisa de compra só com avulsos).
- [x] 3.8 Confirmado: rodapé "0 de 30 · R$ 0,00" atualiza ao marcar item, "Fechar
  compra"/"Cancelar compra" funcionam normalmente com lista agrupada.

## 4. Regressão

- [x] 4.1 `npm run verificar` verde 2026-08-19 (16 erros pré-existentes de rotas, não relacionados).
- [x] 4.2 `npm test` verde 2026-08-19 — 922/922, `agrupar-lista.ts` intacto.
- [x] 4.3 `.maestro/jornada-completa-caminho-feliz.yaml` verde 2026-08-19 (63/63).
- [x] 4.4 `.maestro/auditoria-ui-ux-android.yaml` verde 2026-08-19, duas vezes seguidas
  (167/167) — o `scrollUntilVisible` do §5b continua funcionando com os cabeçalhos presentes.
- [ ] 4.5 Screenshots lado a lado formais (Lista + Modo Compra, mesma massa, dois temas) não
  produzidos — a comparação foi feita ao vivo (task 2.2), não capturada em par.

## Pendências desta rodada de teste (2026-08-18)

- [x] 2.1 confirmado: iniciando compra com 33 itens variados, cabeçalhos de categoria aparecem
  (CARNES, GRÃOS E MASSAS, HIGIENE, HORTIFRUTI, LATICÍNIOS E OVOS), mesma ordem da Lista.
- [x] 3.4/3.6/3.7 confirmados: grupo de um único item sem quebra de layout; marcar/desmarcar
  mantém item no grupo/posição; cabeçalhos não reagem a toque.
- [ ] 2.2 (comparação exaustiva categoria-a-categoria) e 3.1/3.2/3.3/3.5/3.8 **não confirmados
  de forma completa** — a verificação foi limitada pelo achado incidental abaixo, que tornou a
  aba Lista quase impossível de navegar além do primeiro item/categoria.
- `npm test` falha em `app/compra/[id].test.tsx`: o hook novo `usePreferenciaDeAgrupamento` não
  está mockado no teste (mesmo padrão de mock que já existe em `lista.test.tsx` precisa ser
  replicado). Não é regressão de produto.
- Achado incidental (fora do escopo desta change, registrar para não perder): a `ScrollView`
  `lista-de-compras` (itens ativos) na aba Lista renderiza com altura colapsada (~155px, bounds
  ex. `[0,597][1080,752]`), mostrando só 1 item por vez, enquanto "Fora da lista por agora"
  consome o resto da tela — mesmo sintoma do bug 5 relatado pelo usuário (ver `/opsx:propose`
  desta sessão, não duplicar change).
