## 1. Correção do bug relatado

- [x] 1.1 `chip-estado.tsx`: fallback de `fundoAtivo` trocado de `tema.bg.raised` (idêntico ao
      fundo de todo `<Modal>`/sheet) para `sobrepor(tema.action.azulejo, tema.bg.base,
      tema.fillOpacity)` — modo com `cor` explícita inalterado (`sobrepor` já rodava nesse caso).
- [ ] 1.2 Conferência visual no emulador fica para a sessão de teste dedicada (ver ORDER.md).

## 2. Prova do cenário do bug

- [ ] 2.1 Escrever teste RTL para `ChipEstado`: renderizar `<ChipEstado ativo />` (sem `cor`)
      dentro de um container com `backgroundColor: tema.bg.raised` e verificar que a cor de
      fundo computada do chip é diferente da cor do container.
- [ ] 2.2 Rodar o teste e confirmar que falha na versão sem a correção (reverter temporariamente
      1.1, rodar, restaurar) e passa com a correção aplicada.

## 3. Casos de borda do mesmo contexto

- [ ] 3.1 Teste: `<ChipEstado ativo />` (sem `cor`) dentro de container com `backgroundColor:
      tema.bg.base` (tela cheia) — continua distinguível, sem regressão no comportamento hoje
      correto de `formulario-produto.tsx`.
- [ ] 3.2 Teste de regressão cobrindo os 5 call sites existentes de `ChipEstado`
      (`sheet-avulso.tsx`, `sheet-ajuste-estoque.tsx`, `item-compra.tsx` "Sim"/"Não",
      `formulario-produto.tsx` × 2 usos) nos dois temas — nenhum perde contraste entre ativo e
      inativo.
- [ ] 3.3 Teste: chip inativo continua com fundo `transparent` (comportamento não deve mudar,
      só o fallback do estado ativo).
- [ ] 3.4 `npm run test:domain` e suíte de `presentation/` para `chip-estado` continuam verdes.

## 4. Verificação final

- [ ] 4.1 `npm run verificar` (fronteiras + lint + typecheck) sem erros.
- [ ] 4.2 Screenshot antes/depois anexado à change (emulador, MCP Maestro) dos dois sheets
      afetados, tema claro e escuro, confirmando o chip ativo visível.
