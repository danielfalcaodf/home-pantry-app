## 1. Correção do bug relatado

- [x] 1.1 `grafico-barras.tsx`: `alturaUtil = altura - espaco.sm` reserva 8px de clearance —
      a barra na fração máxima nunca ocupa os 96px inteiros do container.
- [x] 1.2 Conferência visual confirmada 2026-08-18 (ver "Pendências desta rodada de teste"
      abaixo).

## 2. Prova do cenário do bug

- [x] 2.1 Escrever teste RTL para `GraficoBarras` (ou `resumo.tsx`) reproduzindo o cenário
      exato do bug: um único `dado` com `valor > 0` (fração 1) e verificar que a altura
      renderizada da barra deixa clearance mínima garantida (não ocupa `altura` inteira).
- [x] 2.2 Confirmado 2026-08-19: revertido temporariamente `alturaUtil = altura - espaco.sm`
      para `altura` (sem clearance), 4/8 testes falham como esperado (diferença exata de
      `espaco.sm` nas alturas). Restaurado via `git checkout`, suíte volta a 8/8 verde.

## 3. Casos de borda do mesmo contexto

- [x] 3.1 Teste: mês mais recente com gasto muito maior que os demais (`fracao` próxima de 1,
      não exatamente 1) — clearance ainda garantida.
- [x] 3.2 Teste: vários meses com gastos parecidos (nenhuma fração próxima de 1) — leitura
      proporcional das barras permanece sem regressão visual.
- [x] 3.3 Teste: nenhum mês com gasto (`maior = 0`, todas as barras em fração 0) — layout não
      quebra, gráfico continua não sendo exibido (estado vazio já coberto por
      `openspec/specs/gasto-mensal/spec.md`, "Nenhuma compra ainda").
- [x] 3.4 Teste de regressão: `npm test` (suíte completa) e `grafico-barras.test.tsx` continuam
      verdes — nenhuma regressão introduzida pelos novos testes.

## 4. Verificação final

- [x] 4.1 `npm run verificar` (fronteiras + lint + typecheck) sem erros novos — erros de
      typecheck pré-existentes em rotas do Expo Router (`app/(tabs)/*.tsx` etc.) não relacionados
      a esta change, confirmados via `git stash` (mesmos erros sem as alterações de teste).
      Reconfirmado 2026-08-19 (`npm test`: 917/917 verdes; `npm run verificar`: só o mesmo
      débito pré-existente de typed routes).
- [x] 4.2 Screenshot anexado à change (emulador, MCP Maestro) — ver "Pendências desta rodada de
      teste" abaixo (`resumo-inicial.png`, `resumo-escuro.png`, `resumo-historico-aberto.png`).

## Pendências desta rodada de teste (2026-08-18)

- [x] 1.2/4.2 confirmado: compra fechada de R$ 100,00 (único mês, fração=1, barra máxima) —
  "Ver histórico" visível nos dois temas, com espaço claro acima da barra, tap navega
  corretamente para o histórico. Via `inspect_screen`: overlap de só 10px nos *bounds* de toque
  (não no texto/barra pintada), sem efeito perceptível ou funcional. Evidência:
  `resumo-inicial.png`, `resumo-escuro.png`, `resumo-historico-aberto.png`.
- Nota desatualizada: os testes automatizados da seção 2/3 (2.1, 2.2, 3.1–3.4) foram escritos e
  estão verdes — ver checkboxes acima. Change 12 está com o gate 100% completo em 2026-08-19.
