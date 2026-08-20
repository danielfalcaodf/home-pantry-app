## 1. Correção do bug

- [ ] 1.1 Adicionar `autoFocus` ao primeiro `CampoTexto` de `sheet-ajuste-compra.tsx`.
- [ ] 1.2 Adicionar `autoFocus` ao primeiro `CampoTexto` de `sheet-ajuste-estoque.tsx`.

## 2. Prova do cenário do bug

- [ ] 2.1 Teste RNTL: renderizar `sheet-ajuste-compra` e confirmar que o primeiro campo está
      focado ao montar. Rodar antes do fix (falha) e depois (passa).
- [ ] 2.2 Teste RNTL equivalente para `sheet-ajuste-estoque`.

## 3. Casos de borda do mesmo contexto (obrigatório para Correção de Bug)

- [ ] 3.1 Confirmar que os 3 sheets já corrigidos anteriormente (`sheet-preco-produto`,
      `sheet-avulso`, `teclado-quantidade`) continuam com `autoFocus` — não regredir.
- [ ] 3.2 Confirmar visualmente (sem Maestro nesta rodada) que o teclado sobe junto com o foco
      nos dois sheets corrigidos, em telas Android e iOS se disponível.

## 4. Regressão

- [ ] 4.1 `npm test` (suíte de presentation) passando.
- [ ] 4.2 `npm run verificar` sem violação.
