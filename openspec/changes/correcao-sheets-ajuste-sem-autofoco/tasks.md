## 1. Correção do bug

- [x] 1.1 Adicionar `autoFocus` ao primeiro `CampoTexto` de `sheet-ajuste-compra.tsx`.
- [x] 1.2 Adicionar `autoFocus` ao primeiro `CampoTexto` de `sheet-ajuste-estoque.tsx`.

## 2. Prova do cenário do bug

- [x] 2.1 Teste RNTL: renderizar `sheet-ajuste-compra` e confirmar que o primeiro campo está
      focado ao montar. Rodar antes do fix (falha) e depois (passa).
- [x] 2.2 Teste RNTL equivalente para `sheet-ajuste-estoque`.

## 3. Casos de borda do mesmo contexto (obrigatório para Correção de Bug)

- [x] 3.1 Confirmar que os 3 sheets já corrigidos anteriormente (`sheet-preco-produto`,
      `sheet-avulso`, `teclado-quantidade`) continuam com `autoFocus` — não regredir.
- [ ] 3.2 Confirmar visualmente (sem Maestro nesta rodada) que o teclado sobe junto com o foco
      nos dois sheets corrigidos, em telas Android e iOS se disponível — pendente para o teste
      manual do usuário fora desta rodada (Maestro fora de escopo por pedido explícito).

## 4. Regressão

- [x] 4.1 `npm test` (suíte de presentation) passando.
- [x] 4.2 `npm run verificar` sem violação.
