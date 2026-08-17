## 1. Correção do bug relatado

- [x] 1.1 `grafico-barras.tsx`: `alturaUtil = altura - espaco.sm` reserva 8px de clearance —
      a barra na fração máxima nunca ocupa os 96px inteiros do container.
- [ ] 1.2 Conferência visual no emulador fica para a sessão de teste dedicada (ver ORDER.md).

## 2. Prova do cenário do bug

- [ ] 2.1 Escrever teste RTL para `GraficoBarras` (ou `resumo.tsx`) reproduzindo o cenário
      exato do bug: um único `dado` com `valor > 0` (fração 1) e verificar que a altura
      renderizada da barra deixa clearance mínima garantida (não ocupa `altura` inteira).
- [ ] 2.2 Rodar o teste e confirmar que falha na versão sem a correção (reverter temporariamente
      1.1, rodar, restaurar) e passa com a correção aplicada.

## 3. Casos de borda do mesmo contexto

- [ ] 3.1 Teste: mês mais recente com gasto muito maior que os demais (`fracao` próxima de 1,
      não exatamente 1) — clearance ainda garantida.
- [ ] 3.2 Teste: vários meses com gastos parecidos (nenhuma fração próxima de 1) — leitura
      proporcional das barras permanece sem regressão visual.
- [ ] 3.3 Teste: nenhum mês com gasto (`maior = 0`, todas as barras em fração 0) — layout não
      quebra, gráfico continua não sendo exibido (estado vazio já coberto por
      `openspec/specs/gasto-mensal/spec.md`, "Nenhuma compra ainda").
- [ ] 3.4 Teste de regressão: `npm run test:domain` e suíte de `presentation/` para
      `resumo.tsx`/`grafico-barras` continuam verdes.

## 4. Verificação final

- [ ] 4.1 `npm run verificar` (fronteiras + lint + typecheck) sem erros.
- [ ] 4.2 Screenshot antes/depois anexado à change (emulador, MCP Maestro), confirmando "Ver
      histórico" visível e tocável com dado de gasto real.
