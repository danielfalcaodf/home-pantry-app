## 1. Correção do bug

- [ ] 1.1 Em `src/application/compra/use-modo-compra.ts`, alterar `marcar()` para gravar
      `valorPagoUnitario: item.valorPagoUnitario ?? item.valorEstimadoUnit` (mesmo padrão já
      usado para `quantidadeComprada`).

## 2. Prova do cenário do bug

- [ ] 2.1 Teste (application, fake repository): item com `valorEstimadoUnit` preenchido e
      `valorPagoUnitario` null → `marcar(item)` → `editarItem` chamado com `valorPagoUnitario`
      igual ao estimado. Rodar antes do fix (falha) e depois (passa).

## 3. Casos de borda do mesmo contexto (obrigatório para Correção de Bug)

- [ ] 3.1 Teste: item sem `valorEstimadoUnit` nem `valorPagoUnitario` → `marcar(item)` →
      `valorPagoUnitario` gravado como `null` (comportamento atual preservado).
- [ ] 3.2 Teste: item já com `valorPagoUnitario` ajustado manualmente antes de marcar → `marcar`
      não sobrescreve o valor ajustado.
- [ ] 3.3 Teste de regressão em `compra.rules.test.ts`: `totalPago()` soma corretamente quando
      `valorPagoUnitario` já veio preenchido do fluxo de `marcar()` (sem mudar a função).
- [ ] 3.4 Teste: `ajustarPreco` chamado depois de `marcar` continua sobrescrevendo o preço
      herdado assumido por padrão.

## 4. Regressão

- [ ] 4.1 `npm run test:domain` e suíte de application completa passando.
- [ ] 4.2 `npm run verificar` sem violação.
