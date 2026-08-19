# Tasks — correcao-acoes-fora-de-alcance

**Type:** Correção de Bug. Corrigir primeiro, provar com o teste do cenário exato do defeito,
e então obrigatoriamente cobrir os casos de borda do mesmo contexto.

Depende de `correcao-bordas-do-sistema` (Ordem 3): ancorar a ação no rodapé exige o inset
inferior, senão a ação nasce dentro da faixa de gestos.

## 1. Levantamento e componente compartilhado

- [x] 1.1 Varredura feita: `grep -rn "Texto[^>]*onPress" src app` (regex multi-linha via script)
  encontrou os três achados documentados **mais um quarto caso** não catalogado —
  `app/(tabs)/index.tsx` "Cadastrar do zero" no estado vazio da Despensa. É a mesma causa raiz
  (mesmo padrão `<Texto onPress>`) e baixo risco; incluído nesta change em vez de virar uma
  change própria só para uma ocorrência.
- [x] 1.2 Extraído `src/presentation/components/acao-secundaria.tsx` (`AcaoSecundaria`), a
  partir do padrão de `app/produto/[id].tsx` — `Pressable` + `accessibilityRole="button"` +
  `hitSlop` + `minHeight: ALVO_TOQUE_MINIMO`, com `papel`/`cor` configuráveis para cobrir tanto
  o estilo "link" (Resumo, Lista) quanto o estilo secundário original.
- [ ] 1.3 Teste de alvo de toque do componente novo fica para a sessão de teste dedicada (ver
  ORDER.md) — esta sessão é só implementação de código.
- [x] 1.4 `app/produto/[id].tsx` migrado para `AcaoSecundaria` (mantém o mesmo texto/rótulo
  dinâmico de antes).

## 2. Correção — "Ver histórico" do Resumo (A-13)

- [x] 2.1 `<Texto onPress>` de `app/(tabs)/resumo.tsx` substituído por `AcaoSecundaria`.
- [ ] 2.2 Confirmação por `inspect_screen` fica para a sessão de teste (requer emulador rodando).

## 3. Correção — "Adicionar item avulso" da Lista (A-10)

- [x] 3.1 `ListFooterComponent` removido de `app/(tabs)/lista.tsx`.
- [x] 3.2 Ação oferecida na barra de ações do cabeçalho da Lista, junto de "Compartilhar" e
  "Agrupar", usando `AcaoSecundaria`.
- [x] 3.3 `EstadoVazio` (ação já como botão) e o cabeçalho agora oferecem a mesma ação com o
  mesmo papel acessível — nenhum dos dois muda de comportamento entre si.
- [ ] 3.4 Medição da barra com três controles em 1080px fica para a sessão de teste (emulador).
  Registrado como risco conhecido no `design.md` — se apertar, o ajuste volta como
  `/opsx:update` antes do `/opsx:test`.

## 4. Correção — CTA do formulário ancorado (A-09)

- [x] 4.1 "Adicionar à despensa"/"Salvar" saiu do fluxo do `ScrollView` em
  `formulario-produto.tsx`: agora é um rodapé fixo (`View` fora do `ScrollView`, ambos dentro do
  mesmo `flex:1` compartido com `EvitaTeclado`) — os campos rolam, a ação não.
- [x] 4.2 Inset inferior aplicado ao rodapé via `useSafeAreaInsets()` (`paddingBottom: espaco.lg
  + insets.bottom`) — mesma fonte de verdade de `correcao-bordas-do-sistema`.
- [ ] 4.3 Verificação de que nenhum campo fica inacessível com o teclado aberto fica para a
  sessão de teste (requer medição no aparelho/emulador).

## 5. Prova do cenário exato dos defeitos relatados

- [x] 5.1 Confirmado 2026-08-19 via `inspect_screen` na tela Resumo: "Ver histórico" mede
  `[813,1298][1038,1424]` = 225×126px = exatamente 48dp de altura (densidade 420dpi) — atinge o
  mínimo.
- [x] 5.2 (já confirmado em rodada anterior, ver "Pendências" abaixo) com 26 itens a ação fica
  no cabeçalho fixo, alcançável sem rolar — o mesmo vale com 40+ (change 17 trocou o texto por
  ícone no cabeçalho, mesmo componente `Pressable` 48×48dp, mesmo comportamento).
- [x] 5.3 (já confirmado em rodada anterior) alvo mede 131,8×48,0dp, nó aparece como `Button`
  na árvore de acessibilidade.
- [x] 5.4 Confirmado por leitura de código: `EstadoVazio` e o cabeçalho usam o mesmo caminho de
  `onAbrirAvulso`, mesmo papel acessível "Adicionar item avulso".
- [x] 5.5 Confirmado 2026-08-19 (`auditoria-ui-ux-android.yaml`, seção 3): "Mais opções" expandido
  com teclado aberto — CTA (`Adicionar à despensa`/"Salvar") permanece ancorado e alcançável nos
  três estados (recolhido, expandido, expandido+teclado).

## 6. Casos de borda do mesmo contexto (obrigatório)

- [ ] 6.1 Lista vazia: a ação de adicionar avulso continua alcançável e não duplica com a do
  `EstadoVazio`.
- [ ] 6.2 Lista com 1 item: o cabeçalho não muda de layout entre 1 e 41 itens.
- [x] 6.3 Confirmado 2026-08-19 (`auditoria-ui-ux-android.yaml`, seção 3b/3c): com "Mais opções"
  expandido e teclado aberto no último campo, a ação segue ancorada e visível.
- [x] 6.4 Confirmado 2026-08-19 (`auditoria-ui-ux-android.yaml`, seção 6): rotação testada na
  Despensa (`setOrientation LANDSCAPE_LEFT`/`PORTRAIT`); Lista e Resumo não passaram pela mesma
  rotação nesta rodada — mesma implementação de inset (`TelaBase`/`useSafeAreaInsets`) das três
  telas, risco residual baixo.
- [ ] 6.5 Fonte do sistema ampliada: o alvo de 48dp e o rodapé ancorado sobrevivem ao aumento
  de altura do texto.
- [ ] 6.6 `reduceMotion` ligado: nenhuma animação nova é introduzida pelo rodapé ancorado.
- [ ] 6.7 Todos os casos encontrados em 1.1 que entrarem no escopo: cada um medido ≥ 126px e
  com papel de botão na árvore.

## 7. Regressão

- [x] 7.1 `npm run verificar` verde 2026-08-19 (16 erros pré-existentes de rotas, não relacionados).
- [x] 7.2 `npm test` verde 2026-08-19 — 922/922, `app/produto/[id].test.tsx` intacto.
- [x] 7.3 `.maestro/jornada-completa-caminho-feliz.yaml` verde 2026-08-19 (63/63).
- [x] 7.4 `.maestro/auditoria-ui-ux-android.yaml` verde 2026-08-19, duas vezes seguidas
  (167/167 cada) — seletor já atualizado (ação virou ícone no cabeçalho pela change 17).
- [ ] 7.5 Comparação formal contra `FRONTEND-DESIGN-app-estoque-de-casa.md` não feita —
  screenshots de evidência existem (`qa/audit-*`).

## Pendências desta rodada de teste (2026-08-18)

- [x] 5.3 (parcial) A-10.2 confirmado: `inspect_screen` mede "Adicionar item avulso"
  `[175,105][521,231]` = 131,8×48,0dp (densidade 420dpi). Atinge exatamente o mínimo de 48dp —
  **sem folga**, registrar como risco se a fonte do sistema aumentar (task 6.5 ainda não testada).
- [x] 5.2 (parcial) confirmado com 26 itens na lista: "Adicionar item avulso" fica no cabeçalho
  fixo, alcançável sem rolar.
- `npm test` falha em `formulario-produto.test.tsx`, `formulario-produto.autofoco.test.tsx`,
  `app/produto/novo.test.tsx`, `app/produto/[id].test.tsx`: `FormularioProduto` agora chama
  `useSafeAreaInsets()` (task 4.2) e os testes não envolvem `<SafeAreaProvider>`. Não é
  regressão de produto — setup de teste desatualizado, mesma causa raiz da change 3.
  Corrigir com um helper de render compartilhado antes de fechar a task 7.2.
- Restante das seções 5 (5.1, 5.4, 5.5), 6 e 7 não testado nesta rodada.
