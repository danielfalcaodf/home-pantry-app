# Tasks — correcao-colapso-fora-da-lista

**Type:** Correção de Bug. Corrigir primeiro, provar com o teste do cenário exato do defeito,
e então obrigatoriamente cobrir os casos de borda do mesmo contexto.

Depende de `correcao-acoes-fora-de-alcance` (Ordem 5) e `correcao-affordance-busca-e-lista`
(Ordem 6): mesmo arquivo `lista.tsx`. Também relacionada a `correcao-agrupamento-modo-compra`
(Ordem 7), cuja verificação completa ficou limitada por este mesmo bug.

## 1. Correção — colapso da seção "Fora da lista por agora"

- [x] 1.1 Extrair/reaproveitar o padrão de colapso de `formulario-produto.tsx` ("Mais opções"):
  `useState<boolean>`, cabeçalho tocável com `accessibilityState={{expanded}}`, ícone de chevron
  rotacionado.
- [x] 1.2 Aplicado à seção "Fora da lista por agora" em `app/(tabs)/lista.tsx`, iniciando
  recolhida (`false`), com rótulo "Fora da lista por agora (N)" onde N é a contagem.
- [x] 1.3 Vocabulário do rótulo mantém "Fora da lista por agora" — só adiciona a contagem e o
  estado de expandido/recolhido, texto de cada item ("Voltar pra lista") inalterado.

## 2. Correção — altura da lista ativa

- [x] 2.1 `FlashList` (`rid="lista-de-compras"`) ganhou `style={{ flex: 1 }}` — cresce com o
  espaço disponível em vez de herdar altura mínima medida pelo conteúdo.
- [x] 2.2 Seção "Fora da lista por agora" expandida também não compete pela altura: fica dentro
  de um `ScrollView` com `maxHeight: 240`, rolando no próprio espaço.

## 3. Prova do cenário exato do defeito relatado

- [x] 3.1 Confirmado no emulador 2026-08-19: massa de 40 itens, com itens removidos formando a
  seção "Fora da lista por agora" — recolhida por padrão, mostrando "FORA DA LISTA POR AGORA (9)"
  com chevron, e a lista ativa ocupando a tela inteira com scroll completo (screenshot:
  `tela-lista.png`) — antes ficava reduzida a uma faixa de ~155px.
- [x] 3.2 Confirmado: expandir a seção com o `ScrollView` de `maxHeight: 240` não esconde a lista
  ativa (`FlashList` com `flex: 1` continua ocupando o espaço restante).

## 4. Casos de borda do mesmo contexto (obrigatório)

- [ ] 4.1 Lista ativa vazia, seção desativados com muitos itens: o estado vazio da lista ativa
  continua visível e não é empurrado para fora da tela.
- [x] 4.2 Seção desativados vazia: nenhum cabeçalho de colapso aparece (nada a colapsar) —
  coberto por `lista.test.tsx` ("sem itens desativados, a seção não aparece").
- [x] 4.3 Confirmado no emulador 2026-08-19: 4 toques seguidos no cabeçalho "Fora da lista por
  agora (3)" (expande/recolhe/expande/recolhe) sem salto de scroll nem perda da posição da lista
  ativa (seção "MERCEARIA" continua no topo visível o tempo todo).
- [x] 4.4 Confirmado no emulador 2026-08-19: com "Agrupado" ativo (default), removidos 3 itens
  ("Molho de tomate", "Café", "Azeite") — a seção "Fora da lista por agora (3)" aparece recolhida
  por padrão abaixo das categorias, e expande normalmente mostrando os 3 itens com "Voltar pra
  lista" cada.
- [x] 4.5 Alvo de toque do cabeçalho de colapso ≥48×48dp (`minHeight: ALVO_TOQUE_MINIMO`), com
  `accessibilityRole="button"`/`accessibilityState={{expanded}}` corretos — coberto por
  `lista.test.tsx`.
- [x] 4.6 Reaproveita a mesma interação de "Voltar pra lista" por item dentro da seção expandida
  — não regride, confirmado por `lista.test.tsx` e manualmente no emulador (item reativado volta
  à lista ativa e some do Modo Compra corretamente).

## 5. Regressão

- [x] 5.1 `npm run verificar` verde (fronteiras + lint + typecheck) — confirmado 2026-08-19.
- [x] 5.2 `npm test` verde, incluindo `app/(tabs)/lista.test.tsx` (seletores atualizados pro
  cabeçalho de colapso) — 920/920 testes verdes.
- [x] 5.3 `.maestro/jornada-completa-caminho-feliz.yaml` rodou ponta a ponta e passou (62/62
  comandos) 2026-08-19 — esse flow não passa pela seção "Fora da lista por agora" diretamente,
  mas confirma que `lista.tsx` não quebrou em nenhum outro ponto. Também corrigidos, nesta
  rodada, 3 seletores desatualizados em `.maestro/*.yaml` (`ciclo-de-compra.yaml`,
  `jornada-completa-caminho-feliz.yaml`, `auditoria-ui-ux-android.yaml`) que ainda esperavam o
  prefixo "✓, " sintetizado no rótulo do item de compra — desatualizado desde a change 8
  (`item-compra.tsx` passou a expor `accessibilityRole="checkbox"` +
  `accessibilityState.checked` explícitos). `.maestro/auditoria-ui-ux-android.yaml` completo
  ficou bloqueado por um problema de ambiente (bolha "Tools" do dev client), não relacionado a
  esta change — ver nota em `correcao-regua-risca-texto-medidor/tasks.md` 4.3.
- [ ] 5.4 Screenshots antes/depois com massa de dados de muitos itens fora da lista, nos dois
  temas.
- [ ] 5.5 Retomar, depois desta change, a verificação completa (2.2 categoria-a-categoria) de
  `correcao-agrupamento-modo-compra` (Ordem 7), que ficou limitada por este bug.
