## 1. Toast que não bloqueia e não empilha (ACHADO-016)

- [x] 1.1 Criar `src/presentation/components/toast.test.tsx`: disparar um segundo toast com o primeiro visível e confirmar que só um está na árvore.
- [x] 1.2 Confirmar que elementos da tela por trás continuam respondendo a `fireEvent.press` com o toast visível.
- [x] 1.3 Confirmar que a barra de tempo restante renderiza com a duração declarada.
- [x] 1.4 Rodar `npm run test:cov -- toast.test.tsx` (ou o comando de app equivalente) e confirmar os três cenários passando.

## 2. Preferência de tema persistida (ACHADO-018)

- [x] 2.1 Criar `src/application/tema/use-preferencia-de-tema.test.ts` com repositório `ConfiguracaoRepository` fake em memória.
- [x] 2.2 Testar `escolher('claro')` gravando no fake.
- [x] 2.3 Testar que uma segunda montagem do hook (`renderHook`) lê o valor gravado, simulando "sobrevive ao fechamento".
- [x] 2.4 Caso de borda: preferência automática acompanha mudança do listener do sistema, sem gravação redundante.

## 3. Redução de movimento em `theme/movimento.ts` (ACHADO-019)

- [x] 3.1 Criar teste que mocka a preferência de redução de movimento (via o mock de `react-native-reanimated` já usado no projeto) e renderiza um componente que usa `molar()`/`esmaecer()`.
- [x] 3.2 Confirmar que, com a preferência ligada, a transição usa `withTiming` com a duração de `DURACAO_FADE`, não `withSpring`.
- [x] 3.3 Confirmar que o retorno tátil (`expo-haptics`) continua sendo chamado nesse cenário.

## 4. Formulário de produto (ACHADO-022)

- [x] 4.1 Criar `src/presentation/components/formulario-produto.test.tsx`: confirmar que a seção "mais opções" está recolhida na renderização inicial.
- [x] 4.2 Testar o filtro de sugestões de categoria pelo texto digitado.
- [x] 4.3 Testar que escolher uma sugestão preenche o campo com o valor exato oferecido (sem variação de caixa/espaço).
- [x] 4.4 Caso de borda: nenhuma sugestão corresponde ao texto digitado — lista de sugestões vazia, sem erro.

## 5. Normalização de busca (ACHADO-023)

- [x] 5.1 Criar `src/presentation/format/normalizar-busca.test.ts`: `casaComBusca('Açúcar', 'acucar')` deve ser `true`.
- [x] 5.2 Caso de borda: termo de busca vazio casa com tudo.
- [x] 5.3 Caso de borda: texto já normalizado (sem acento, minúsculo) continua casando.

## 6. Navegação "ver item existente" na duplicidade (ACHADO-024)

- [x] 6.1 Criar teste RTL de `app/produto/novo.tsx` preenchendo um nome duplicado e confirmando que a ação "ver item existente" aparece.
- [x] 6.2 Confirmar que tocar a ação navega para `/produto/[id]` com o id do produto duplicado (não um id arbitrário).

## 7. Conformidade sem contêiner visual (ACHADO-025)

- [x] 7.1 Estender o `it.each` de conformidade em `src/presentation/components/medidor-e-item.test.tsx` com checagem de ausência de `shadowColor`, `shadowOpacity` e `elevation` em `item-despensa.tsx`.
- [x] 7.2 Adicionar checagem de que nenhum `borderRadius` diferente de `raio.linha` (0) aparece no arquivo.

## 8. Coreografia do gesto (ACHADO-026)

- [x] 8.1 Em `registro-e-desfazer.test.tsx`, mockar `expo-haptics` (se ainda não mockado no escopo do teste) e confirmar `Haptics.impactAsync` chamado ao tocar o botão de consumo.
- [x] 8.2 Confirmar que a chamada de retorno tátil ocorre antes da resolução do callback `onRegistrar`.

## 9. Caminho positivo de "Repus" (ACHADO-027)

- [x] 9.1 Espelhar em `registro-e-desfazer.test.tsx` o teste "registra consumo com o valor digitado e fecha" para o botão "Repus".
- [x] 9.2 Confirmar `onRepus` chamado com o valor correto e o painel fechado.

## 10. Prop `animar` do medidor de nível (ACHADO-028)

- [x] 10.1 Em `medidor-e-item.test.tsx`, testar `MedidorNivel` com `animar={false}`: valor final aplicado diretamente, sem chamada a `molar()`.
- [x] 10.2 Testar `MedidorNivel` com `animar={true}`: confirmar chamada a `molar()`.
- [x] 10.3 Testar lista com dois itens onde só um tem a quantidade alterada: confirmar que só esse item recebe `animar={true}`.

## 11. Cores distintas de `corDoMovimento` (ACHADO-043)

- [x] 11.1 Criar `src/presentation/theme/cor-do-estado.test.ts` comparando o retorno de `corDoMovimento` para consumo, reposição e ajuste.
- [x] 11.2 Confirmar que não há dois tipos com a mesma cor.

## 12. Gate de testes

- [x] 12.1 Rodar `npm run verificar` (fronteiras + lint + typecheck) — sem regressões.
- [x] 12.2 Rodar `npm test` completo (`domain` e `app`) e confirmar 100% verde, incluindo os onze testes novos/estendidos desta change.
