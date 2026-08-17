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

- [ ] 5.1 A-13: `inspect_screen` na tela Resumo — o alvo de "Ver histórico" (hoje
  `[813,1235][1038,1293]`, 58px) passa a medir ≥ 126px de altura.
- [ ] 5.2 A-10.1: com 41 itens na lista, a ação de adicionar avulso está alcançável sem rolar
  até o fim.
- [ ] 5.3 A-10.2: o alvo da ação de adicionar avulso mede ≥ 126px e o nó aparece como `Button`.
- [ ] 5.4 A-10.3: a ação oferecida no estado vazio e no estado cheio é o mesmo componente, com
  o mesmo papel acessível.
- [ ] 5.5 A-09: reproduzir os três estados da tabela do `proposal.md` e assertar que
  "Adicionar à despensa" está visível e tocável nos três — recolhido sem teclado, expandido sem
  teclado, e expandido **com** teclado.

## 6. Casos de borda do mesmo contexto (obrigatório)

- [ ] 6.1 Lista vazia: a ação de adicionar avulso continua alcançável e não duplica com a do
  `EstadoVazio`.
- [ ] 6.2 Lista com 1 item: o cabeçalho não muda de layout entre 1 e 41 itens.
- [ ] 6.3 Formulário com todos os campos opcionais preenchidos e o teclado aberto no último
  campo: a ação segue ancorada e visível.
- [ ] 6.4 Rotação em paisagem nas três telas: as ações continuam alcançáveis, com o inset da
  orientação corrente.
- [ ] 6.5 Fonte do sistema ampliada: o alvo de 48dp e o rodapé ancorado sobrevivem ao aumento
  de altura do texto.
- [ ] 6.6 `reduceMotion` ligado: nenhuma animação nova é introduzida pelo rodapé ancorado.
- [ ] 6.7 Todos os casos encontrados em 1.1 que entrarem no escopo: cada um medido ≥ 126px e
  com papel de botão na árvore.

## 7. Regressão

- [ ] 7.1 `npm run verificar` verde (fronteiras + lint + typecheck).
- [ ] 7.2 `npm test` verde, com `app/produto/[id].test.tsx` (alvo de 48dp) intacto.
- [ ] 7.3 `.maestro/jornada-completa-caminho-feliz.yaml` verde (baseline: 62 comandos) — ele
  cobre cadastro de produto e o ciclo de compra, os dois fluxos tocados aqui.
- [ ] 7.4 `.maestro/auditoria-ui-ux-android.yaml` verde (baseline: 163 comandos), duas vezes
  seguidas. Atenção: o roteiro assume "Adicionar item avulso" no rodapé — atualizar o seletor
  junto com a correção.
- [ ] 7.5 Screenshots das três telas nos dois temas, comparados contra
  `FRONTEND-DESIGN-app-estoque-de-casa.md`.
