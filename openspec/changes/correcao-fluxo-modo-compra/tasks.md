## 1. Correção do aviso de saída (ACHADO-034)

- [ ] 1.1 Em `src/presentation/components/botao-voltar.tsx`, adicionar prop opcional de confirmação (ex.: `confirmar?: { titulo: string; mensagem: string }`) que, quando presente, abre `Alert.alert` com opções "Manter"/"Sair" antes de chamar `router.back()`, só navegando se o usuário confirmar; sem a prop, mantém o comportamento atual (`router.back()` direto).
- [ ] 1.2 Em `app/compra/[id].tsx`, passar a prop de confirmação para `BotaoVoltar` só quando `marcados > 0`, com mensagem informando que a compra continua aberta e o progresso é preservado.
- [ ] 1.3 Conferir que Detalhe do produto e Cadastrar produto (outros usos de `BotaoVoltar`) continuam sem confirmação, por não passarem a prop.

## 2. Prova do cenário do bug (ACHADO-034)

- [ ] 2.1 Teste RNTL: com `marcados > 0` no modo compra, tocar em `BotaoVoltar` abre a confirmação e `router.back()` só é chamado após confirmar.
- [ ] 2.2 Teste RNTL: com `marcados === 0` no modo compra, tocar em `BotaoVoltar` chama `router.back()` direto, sem confirmação.

## 3. Casos de borda do mesmo contexto (ACHADO-034)

- [ ] 3.1 Teste RNTL: cancelar a confirmação mantém o usuário na tela e preserva as marcações já feitas (nenhuma chamada a `router.back()`, nenhum item desmarcado).
- [ ] 3.2 Teste RNTL: desmarcar todos os itens marcados volta a condição para "sem confirmação" na próxima vez que o botão for acionado.

## 4. Investigação do ACHADO-054 (toques rápidos)

- [ ] 4.1 Escrever teste RNTL que renderiza a lista do modo compra com um repositório fake de compra contendo pelo menos 3 itens e dispara dois `fireEvent.press` consecutivos em itens diferentes, sem aguardar re-render entre eles.
- [ ] 4.2 Inspecionar no repositório fake quais itens foram efetivamente marcados como `comprado: true` e comparar com os itens tocados.
- [ ] 4.3 Se o item persistido divergir do item tocado (bug confirmado): corrigir a causa raiz em `use-modo-compra.ts` e/ou `item-compra.tsx` (ex.: garantir que cada `editarItem` referencia o id capturado no momento do toque, não um estado potencialmente desatualizado) e repetir 4.1 até passar.
- [ ] 4.4 Se não reproduzir: documentar no próprio teste (comentário) e nesta task que a suspeita não foi confirmada sob RNTL, sem alterar `use-modo-compra.ts` nem `item-compra.tsx` além do teste.

## 5. Teste de composição da tela (ACHADO-035)

- [ ] 5.1 Criar teste de tela para `app/compra/[id].tsx` (RNTL, hooks e router mockados) cobrindo: nenhuma navegação ocorre ao marcar ou ajustar um item.
- [ ] 5.2 Cobrir `useKeepAwake` ativo enquanto a tela está montada.
- [ ] 5.3 Cobrir atualização do rodapé (contador e total) a cada marcação.
- [ ] 5.4 Cobrir a mensagem de fechamento ("Você repôs N itens"/"1 item") em linguagem do usuário, sem termos de sistema.
- [ ] 5.5 Cobrir o retorno à despensa (`router.replace('/')`) após o toast de sucesso terminar.

## 6. Teste dos campos do movimento de fechamento (ACHADO-036)

- [ ] 6.1 Estender `sqlite-compra.repository.test.ts` para, após um fechamento, buscar um movimento específico por `produtoId` e comparar individualmente `usuarioId`, `criadoEm`, `quantidadeDelta` e `quantidadeResultante` com os valores esperados — não só a contagem de movimentos.

## 7. Teste de estilo do item marcado (ACHADO-037)

- [ ] 7.1 Estender `item-compra.test.tsx`: item marcado tem `textDecorationLine: 'line-through'` e cor secundária no nome, e perde o preenchimento (conforme os estilos condicionais de `item-compra.tsx:76-98`).
- [ ] 7.2 Estender `item-compra.test.tsx`: controle de marcação é quadrado (`borderRadius` de `raio.linha`, não circular) e sua área tocável mede no mínimo `ALVO_TOQUE_MINIMO` (48×48).

## 8. Gate de testes obrigatório

- [ ] 8.1 Rodar `npm run verificar` (fronteiras + lint + typecheck) — sem regressões.
- [ ] 8.2 Rodar `npm test` completo — todos os testes verdes, incluindo os novos desta change.
