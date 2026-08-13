## 1. Correção

- [x] 1.1 Adicionar `BotaoVoltar` ao topo do conteúdo de `app/conferencia.tsx`, no mesmo padrão das demais telas empilhadas.
- [x] 1.2 Diferenciar visualmente o placeholder do campo "Corrigir para" de valor digitado (cor/estilo de placeholder do tema) e tornar perceptível o estado desabilitado do botão "Corrigir".

## 2. Prova do cenário do bug

- [x] 2.1 Teste RTL de `app/conferencia.tsx`: o elemento com `accessibilityLabel="Voltar"` existe e o toque chama `router.back()` — cenário exato do ACHADO-062.
- [x] 2.2 Teste RTL do campo: sem valor digitado, botão "Corrigir" desabilitado com sinal perceptível; com valor digitado, habilita e grava — cenário do ACHADO-055.

## 3. Casos de borda do mesmo contexto

- [x] 3.1 Teste de preservação: sair pelo Voltar no meio do percurso e remontar a tela → progresso retomado (integração com `use-conferencia`, sem regravar itens já conferidos).
- [x] 3.2 Teste de que sair pelo Voltar não grava nenhum movimento extra (contagem de movimentos antes/depois).
- [x] 3.3 Estender o flow Maestro `conferencia-estoque.yaml`: entrar na conferência, verificar o "←" presente, sair e retomar.

## 4. Gate de qualidade

- [ ] 4.1 Rodar `npm test` e `npm run verificar` — tudo verde.
