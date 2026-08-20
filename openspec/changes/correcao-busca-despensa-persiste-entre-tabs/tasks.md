## 1. Correção do bug

- [ ] 1.1 Adicionar `useFocusEffect` (expo-router) em `app/(tabs)/index.tsx`: no cleanup
      (blur), `Keyboard.dismiss()` sempre; `setBuscaAberta(false)` só quando `busca === ''`.

## 2. Prova do cenário do bug

- [ ] 2.1 Teste (presentation, simulando foco/blur de rota ou mock do callback de
      `useFocusEffect`): campo de busca vazio aberto → simular blur → campo fecha e teclado é
      dispensado. Rodar antes do fix (falha) e depois (passa).

## 3. Casos de borda do mesmo contexto (obrigatório para Correção de Bug)

- [ ] 3.1 Teste: campo de busca com texto → simular blur → campo permanece aberto, filtro
      continua ativo, `Keyboard.dismiss` foi chamado.
- [ ] 3.2 Teste: montagem inicial da tela (primeiro focus) não dispara o cleanup indevidamente
      (não fecha uma busca recém-aberta antes do primeiro blur real).
- [ ] 3.3 Teste: voltar para a aba da despensa depois de um blur com busca preenchida mostra a
      lista já filtrada, sem necessidade de redigitar.

## 4. Regressão

- [ ] 4.1 `npm test` (presentation) passando.
- [ ] 4.2 `npm run verificar` sem violação.
