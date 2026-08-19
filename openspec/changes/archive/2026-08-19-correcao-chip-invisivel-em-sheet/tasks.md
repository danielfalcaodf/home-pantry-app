## 1. Correção do bug relatado

- [x] 1.1 `chip-estado.tsx`: fallback de `fundoAtivo` trocado de `tema.bg.raised` (idêntico ao
      fundo de todo `<Modal>`/sheet) para `sobrepor(tema.action.azulejo, tema.bg.base,
      tema.fillOpacity)` — modo com `cor` explícita inalterado (`sobrepor` já rodava nesse caso).
- [x] 1.2 Confirmado no emulador 2026-08-19 (tema Porcelana/claro, agora que
      `correcao-painel-inferior-invisivel` corrigiu a renderização do `PainelInferior`): chip "un"
      ativo em `sheet-avulso` e chips "Perda"/"Correção" ativos em `sheet-ajuste-estoque"
      claramente distinguíveis do fundo do sheet. Tema Despensa (escuro) não conferido nesta
      rodada.

## 2. Prova do cenário do bug

- [x] 2.1 Escrever teste RTL para `ChipEstado`: renderizar `<ChipEstado ativo />` (sem `cor`)
      dentro de um container com `backgroundColor: tema.bg.raised` e verificar que a cor de
      fundo computada do chip é diferente da cor do container.
- [x] 2.2 Confirmado 2026-08-19: revertido temporariamente `fundoAtivo` para `tema.bg.raised`
      (fallback antigo), 12/16 testes falham como esperado. Restaurado via `git checkout`, suíte
      volta a 16/16 verde.

## 3. Casos de borda do mesmo contexto

- [x] 3.1 Teste: `<ChipEstado ativo />` (sem `cor`) dentro de container com `backgroundColor:
      tema.bg.base` (tela cheia) — continua distinguível, sem regressão no comportamento hoje
      correto de `formulario-produto.tsx`.
- [x] 3.2 Teste de regressão cobrindo os 5 call sites existentes de `ChipEstado`
      (`sheet-avulso.tsx`, `sheet-ajuste-estoque.tsx`, `item-compra.tsx` "Sim"/"Não",
      `formulario-produto.tsx` × 2 usos) nos dois temas — nenhum perde contraste entre ativo e
      inativo.
- [x] 3.3 Teste: chip inativo continua com fundo `transparent` (comportamento não deve mudar,
      só o fallback do estado ativo).
- [x] 3.4 `npm test` (suíte completa) e `chip-estado.test.tsx` continuam verdes.

## 4. Verificação final

- [x] 4.1 `npm run verificar` (fronteiras + lint + typecheck) sem erros novos — erros de
      typecheck pré-existentes em rotas do Expo Router não relacionados a esta change,
      confirmados via `git stash` (mesmos erros sem as alterações de teste).
- [ ] 4.2 Screenshot antes/depois anexado à change (emulador, MCP Maestro) dos dois sheets
      afetados, tema claro e escuro, confirmando o chip ativo visível.

## Pendências desta rodada de teste (2026-08-18 → atualizado 2026-08-19)

**DESBLOQUEADA.** `correcao-painel-inferior-invisivel` (Ordem 14) corrigiu o `PainelInferior`
(`<Modal>` + `KeyboardAvoidingView` nativo) — os dois sheets desta change abrem e permanecem
visíveis de forma estável. 1.2 reexecutado com sucesso (ver acima). Falta ainda: 4.2 (screenshot
formal anexado à change, tema claro já capturado nesta sessão, escuro pendente).
