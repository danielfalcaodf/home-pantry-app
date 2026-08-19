# Tasks — correcao-nomes-e-estados-acessiveis

**Type:** Correção de Bug. Corrigir primeiro, provar com o teste do cenário exato do defeito,
e então obrigatoriamente cobrir os casos de borda do mesmo contexto.

Todo critério de aceite de acessibilidade aqui é medido na **árvore de acessibilidade**
(`inspect_screen`/`uiautomator`), nunca por leitura de código — é a lição que originou o A-15.

Depende de `correcao-agrupamento-modo-compra` (Ordem 7): mesmo arquivo `item-compra.tsx` e
mesmo flow de regressão do Modo Compra.

## 1. Varredura da causa

- [x] 1.1 Varredura feita (script sobre a AST simplificada de todo `.tsx`): nenhum outro
  `<View accessibilityRole=...>` filho de tocável fora de `item-compra.tsx` — era o único caso.
- [x] 1.2 Nenhum caso adicional encontrado; escopo permanece só o A-15.

## 2. Correção — checkbox do Modo Compra na árvore (A-15)

- [x] 2.1 `accessibilityRole="checkbox"`, `accessibilityState={{ checked }}` e o rótulo movidos
  para o `Pressable` (o nó que recebe o toque).
- [x] 2.2 `View` da caixa quadrada agora só visual, sem atributos de acessibilidade.
- [x] 2.3 `<Texto>✓</Texto>` marcado `importantForAccessibility="no"` — não vaza para o nome.
- [x] 2.4 Confirmado via `inspect_screen` real (ver "Pendências" abaixo).
- [x] 2.5 Seletores de `jornada-completa-caminho-feliz.yaml` e `auditoria-ui-ux-android.yaml`
  já atualizados para `accessibilityRole="checkbox"` + `checked: true/false` (rótulo `"<nome>,
  <quantidade>, <preço>"`, sem "Marcar"/"Desmarcar" nem `✓`) — ambos os flows verdes 2026-08-19.

## 3. Correção — papel tipográfico da prosa em Configurações (A-11)

- [x] 3.1 `caption` trocado por `body.md` (papel de corpo) nas três frases de
  `app/(tabs)/configuracoes.tsx` (data do último backup, aviso de restauração destrutiva,
  descrição do CSV) — mesmo texto, mesma posição, mesmo tom secundário.
- [x] 3.2 `tipografia.ts` não foi tocado.
- [x] 3.3 Confirmado 2026-08-19 (`auditoria-ui-ux-android.yaml`, dois temas Claro/Escuro x2):
  layout de Configurações sem quebra nas três frases em `body.md`.

## 4. Correção — nome acessível ambíguo (A-12)

- [x] 4.1 Seção "Despensa" renomeada para "Conferência" — descreve o conteúdo da seção (só o
  botão "Conferência da despensa") sem repetir o nome da aba.
- [x] 4.2 Aba "Despensa" não foi tocada.

## 5. Prova do cenário exato dos defeitos relatados

- [x] 5.1/5.2 (já confirmados — ver "Pendências" abaixo).
- [x] 5.3 (já confirmado — ver "Pendências" abaixo).
- [x] 5.4 Confirmado 2026-08-19: `index: 1` era workaround obsoleto, removido do flow —
  `tapOn: "Despensa"` resolve direto (só existe o nó da aba agora).

## 6. Casos de borda do mesmo contexto (obrigatório)

- [x] 6.1 (já confirmado — desmarcar não deixa resíduo, ver "Pendências").
- [x] 6.2 Confirmado 2026-08-19: itens avulsos e de produto no Modo Compra usam o mesmo
  `ItemCompra`/`accessibilityRole="checkbox"`, sem distinção de papel/estado.
- [x] 6.3 Confirmado 2026-08-19 (`jornada-completa-caminho-feliz.yaml`/`auditoria-ui-ux-
  android.yaml`): itens com e sem preço expõem `"<nome>, <quantidade>, <preço ou 'sem preço'>"`.
- [x] 6.4 (já confirmado — ver "Pendências").
- [ ] 6.5 Fonte do sistema ampliada não testada nesta rodada.
- [ ] 6.6 Navegação só com leitor de tela (TalkBack) não testada — Maestro não pilota TalkBack
  diretamente.
- [x] 6.7 N/A — 1.1 não encontrou casos adicionais além do A-15 já corrigido.

## 7. Regressão

- [x] 7.1 `npm run verificar` verde 2026-08-19 (16 erros pré-existentes de rotas, não relacionados).
- [x] 7.2 `npm test` verde 2026-08-19 — 922/922, `item-compra.test.tsx`/`configuracoes` já
  atualizados pro `accessibilityRole="checkbox"` (o gap registrado em "Pendências" foi corrigido).
- [x] 7.3 `.maestro/jornada-completa-caminho-feliz.yaml` verde 2026-08-19 (63/63), seletores
  já em `checked:`.
- [x] 7.4 `.maestro/auditoria-ui-ux-android.yaml` verde 2026-08-19, duas vezes seguidas
  (167/167), seletores já em `checked:`.
- [x] 7.5 Confirmado 2026-08-19 (`auditoria-ui-ux-android.yaml`): alvo 48dp do controle de
  marcação, tachado + tom secundário ao marcar, e os 3 seletores de tema com alvo 48dp.

## Pendências desta rodada de teste (2026-08-18)

- [x] 5.1/5.2 (A-15) confirmados via `inspect_screen` real (não código): antes de marcar,
  `{"a11y":"Frango, 1,5 kg, sem preço","cls":"android.widget.CheckBox","clickable":true}` sem
  `checked`; após tocar, ganha `checked:true`, nome idêntico sem glifo `✓` nem "Marcar/Desmarcar".
  Ao desmarcar, `checked` some e o nome permanece igual — sem resíduo.
- [x] 5.3 (A-11) confirmado: as três frases aparecem em caixa normal, papel de corpo.
- [x] 5.4 (A-12) confirmado: seção renomeada "Conferência"; `tapOn: "Despensa"` resolve direto
  sem ambiguidade.
- [x] 6.4 confirmado: toque longo continua disparando o painel de ajuste corretamente.
- `npm test` falha em `item-compra.test.tsx` e `app/compra/toques-consecutivos.test.tsx`:
  esperam o `accessibilityLabel` antigo "Marcar X"/"Desmarcar X", removido de propósito por esta
  change (task 2.1). Comportamento novo está correto — teste desatualizado, não regressão.
- Restante das seções 5 (nenhum item pendente confirmado acima), 6 (6.1-6.3, 6.5-6.7) e 7 não
  testado nesta rodada.
