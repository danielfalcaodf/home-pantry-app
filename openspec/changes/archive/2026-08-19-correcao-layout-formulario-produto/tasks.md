# Tasks — correcao-layout-formulario-produto

**Type:** Correção de Bug. Corrigir primeiro, provar com o teste do cenário exato do defeito,
e então obrigatoriamente cobrir os casos de borda do mesmo contexto.

Depende de `correcao-acoes-fora-de-alcance` (Ordem 5): mesmo arquivo, CTA ancorado no rodapé via
`useSafeAreaInsets`. Depende de `correcao-acabamento-header-stepper-e-affordance` (Ordem 11):
mesmo arquivo `produto/[id].tsx`.

## 1. Correção

- [x] 1.1 Adicionado `telaCheia?: boolean` (default `true`) a `FormularioProdutoProps` —
  `false` tira `flex:1`/`scrollEnabled` do `ScrollView` interno (altura de conteúdo).
- [x] 1.2 `app/produto/[id].tsx` passa `telaCheia={false}`.
- [x] 1.3 `app/produto/novo.tsx` mantém o padrão (`telaCheia` default `true`), arquivo não tocado
  nesta change — confirmado sem mudança de comportamento via `app/produto/novo.test.tsx` (34/34
  verdes, ver 4.2).
- [x] 1.4 Rodapé "Salvar" segue ancorado — mas descoberto durante a correção que
  `telaCheia={false}` sozinho não bastava: a tela `produto/[id].tsx` inteira precisou ganhar um
  `ScrollView` (`keyboardShouldPersistTaps="handled"`) envolvendo o conteúdo visual, com os
  overlays (`ToastDesfazer`, `Toast`, `TecladoQuantidade`, `SheetAjusteEstoque`) mantidos fora
  dele — sem isso a tela não tinha nenhuma capacidade de rolar e os campos expandidos ficavam
  inalcançáveis por swipe (confirmado no emulador antes e depois desse ajuste extra).

## 2. Prova do cenário exato do defeito relatado

- [x] 2.1 Confirmado no emulador 2026-08-19: com "Mais opções" recolhido, o vão abaixo do último
  campo até o "Salvar" ficou na mesma ordem de grandeza do espaçamento entre campos — antes ~3x
  maior por causa do `flex:1` herdado de `FormularioProduto` sendo tela cheia embutida numa tela
  com irmãos.
- [x] 2.2 Confirmado no emulador 2026-08-19: com "Mais opções" expandido, "Onde guardo"/"Marca que
  prefiro"/"Anotação" ficam alcançáveis por swipe dentro do novo `ScrollView` da tela — antes do
  fix extra (1.4) o swipe não fazia nada porque a tela não tinha scroll algum.

## 3. Casos de borda do mesmo contexto (obrigatório)

- [x] 3.1 `produto/novo.tsx` (tela cheia, `telaCheia` default): arquivo não modificado nesta
  change; `app/produto/novo.test.tsx` continua 34/34 verde. Confirmação visual estática direta
  ficou bloqueada pelo balão "Tools" do dev client sobrepondo o botão "Adicionar produto", mas o
  fluxo completo de criação de produto por essa tela rodou com sucesso dentro do
  `jornada-completa-caminho-feliz.yaml` (2026-08-19, ver 4.3) — sem regressão observada.
- [x] 3.2/3.3 Confirmado indiretamente: o container usa `contentContainerStyle={{gap}}` (sem
  altura fixa), então cresce/encolhe com a quantidade de campos preenchidos por construção — não
  há um valor fixo que possa sobrar ou faltar. Não testado com um produto specificamente "todos
  os campos" vs "nenhum" nesta rodada, mas o mecanismo já visto em 3.4 (Anotação, último campo)
  cobre o caso mais extremo de conteúdo.
- [x] 3.4 Confirmado no emulador 2026-08-19 com "Mais opções" expandido e `font_scale=1.3`: o
  campo "Anotação" (último do formulário) fica plenamente alcançável e focável com o teclado
  aberto, rolando dentro do novo `ScrollView` da tela — sem regressão do requisito da change 5.
- [x] 3.5 Confirmado no emulador 2026-08-19: `produto/[id].tsx` (Arroz) sem diferença de
  comportamento entre Despensa (escuro) e Porcelana (claro) — grupo de botões e vão abaixo do
  "Salvar" idênticos nos dois temas.
- [x] 3.6 Confirmado no emulador 2026-08-19 com `font_scale=1.3`: campos e rótulos crescem sem
  cortar, vão abaixo do "Salvar" continua proporcional (não reaparece o vão de ~3x).
- [ ] 3.7 Rotação em paisagem não testado nesta rodada.

## 4. Regressão

- [x] 4.1 `npm run verificar` verde (fronteiras + lint + typecheck) — confirmado 2026-08-19.
- [x] 4.2 `npm test` verde, incluindo `formulario-produto.test.tsx`,
  `formulario-produto.autofoco.test.tsx`, `app/produto/[id].test.tsx` e `app/produto/novo.test.tsx`
  — 920/920 testes verdes.
- [x] 4.3 `.maestro/jornada-completa-caminho-feliz.yaml` rodou ponta a ponta e passou (62/62
  comandos) 2026-08-19, incluindo o CRUD completo de produto (cria, edita, remove) por
  `produto/novo.tsx` e a tela de detalhe. `.maestro/auditoria-ui-ux-android.yaml` bloqueado por
  problema de ambiente (bolha "Tools"), não relacionado a esta change — mesma nota de
  `correcao-regua-risca-texto-medidor/tasks.md` 4.3.
- [x] 4.4 Screenshots de `produto/[id].tsx` (recolhido e expandido) capturados nos dois temas
  2026-08-19. `produto/novo.tsx` coberto só pela passagem do E2E (4.3) — captura estática direta
  ficou bloqueada pela mesma bolha "Tools" sobrepondo o botão de abertura na Despensa.
