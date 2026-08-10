## 1. Detalhe do produto — ACHADO-041

- [ ] 1.1 Confirmar (leitura de código, sem alterar) que `app/produto/[id].tsx:180-194` e `formulario-produto.tsx:45,59,146-151` já refletem o comportamento pós-`alvos-de-toque-e-acessibilidade` (alvo de toque, rótulos).
- [ ] 1.2 Teste do cenário exato do bug: tocar a quantidade em destaque abre o `SheetAjusteEstoque` (mock de `useAjustarEstoque`/estado local).
- [ ] 1.3 Teste do cenário exato do bug: com `quantidadeAtualEditavel={false}`, nenhum campo de texto solto de quantidade atual é renderizado no formulário embutido.
- [ ] 1.4 Caso de borda: a quantidade em destaque usa o papel tipográfico `display.lg` (asserção de estilo/prop, não snapshot pixel a pixel).
- [ ] 1.5 Caso de borda: o toque no resumo do histórico navega para `/produto/[id]/historico`.

## 2. Conferência, diagnóstico e histórico do produto — ACHADO-042

- [ ] 2.1 Teste de `app/conferencia.tsx`: o progresso "N de M" está visível durante o percurso (mock de `use-conferencia`).
- [ ] 2.2 Teste de `app/conferencia.tsx`: confirmar a quantidade correta exige um único toque, sem diálogo adicional.
- [ ] 2.3 Teste de `app/conferencia.tsx`: informar uma correção grava o ajuste e avança, sem diálogo de confirmação.
- [ ] 2.4 Teste de `app/diagnostico.tsx`: mensagem afirmativa quando não há divergência (mock de resultado sem divergência).
- [ ] 2.5 Teste de `app/diagnostico.tsx`: mensagem acionável (com ação de corrigir) quando há divergência.
- [ ] 2.6 Teste de `app/produto/[id]/historico.tsx`: os três tipos de movimento (consumo, reposição, ajuste) usam cores distintas (`corDoMovimento`), verificado por prop/estilo, não só snapshot visual.
- [ ] 2.7 Caso de borda: `app/conferencia.tsx` com a categoria já totalmente conferida exibe o resultado de conclusão (quantos corrigidos, quantos corretos).

## 3. Resumo e histórico de compras — ACHADO-045

- [ ] 3.1 Teste de `app/(tabs)/resumo.tsx`: estado vazio do gasto mensal exibe o texto exato esperado quando `gastoMensal.meses` não tem nenhuma compra fechada.
- [ ] 3.2 Teste de `app/(tabs)/resumo.tsx`: tocar numa contagem de estado (ex. "Acabou") navega para a despensa filtrada por aquele estado (`router.push` com o filtro esperado).
- [ ] 3.3 Teste de `app/(tabs)/resumo.tsx`: quando há itens sem preço, o aviso de valor parcial é exibido; quando não há, não é.
- [ ] 3.4 Teste de `app/compra/historico.tsx`: uma compra cancelada aparece visualmente distinta e sem total pago como gasto.
- [ ] 3.5 Teste de `app/compra/historico/[id].tsx`: itens não comprados e itens avulsos aparecem identificados como tal.
- [ ] 3.6 Caso de borda: `app/compra/historico.tsx` com lista vazia (nenhuma compra finalizada ainda) não quebra e exibe estado vazio coerente.

## 4. `headerShown` e alvo de toque do `BotaoVoltar` — ACHADO-048

- [ ] 4.1 Teste leve de `app/_layout.tsx`: `screenOptions` do `Stack` raiz inclui `headerShown: false`.
- [ ] 4.2 Teste leve de `app/(tabs)/_layout.tsx`: `screenOptions` das `Tabs` inclui `headerShown: false`.
- [ ] 4.3 Em `src/presentation/components/botao-voltar.test.tsx`, adicionar asserção de `minWidth`/`minHeight` ≥ `ALVO_TOQUE_MINIMO` (48) no estilo do `Pressable`.

## 5. Destino de navegação do `BotaoVoltar` por tela — ACHADO-049

- [ ] 5.1 Teste de `app/conferencia.tsx`: `router.back()` retorna à tela anterior (mock de histórico de navegação).
- [ ] 5.2 Teste de `app/diagnostico.tsx`: `router.back()` retorna a Configurações.
- [ ] 5.3 Teste de `app/produto/lista-base.tsx`: `router.back()` retorna à Despensa.
- [ ] 5.4 Teste de `app/compra/historico.tsx`: `router.back()` retorna à tela anterior.
- [ ] 5.5 Teste de `app/compra/historico/[id].tsx`: `router.back()` retorna ao Histórico de compras (lista).
- [ ] 5.6 Teste de `app/produto/[id]/historico.tsx`: `router.back()` retorna ao Detalhe do produto.
- [ ] 5.7 Teste de `app/(tabs)/configuracoes.tsx`: `router.back()` retorna à tela anterior à aba Configurações.
- [ ] 5.8 Caso de borda: em pelo menos uma das sete telas, simular pilha de navegação com mais de uma entrada e confirmar que `router.back()` não pula etapas (volta ao topo anterior, não a uma rota fixa via `router.push`/`replace`).

## 6. Tab bar — ACHADO-051

- [ ] 6.1 Teste de integração de `app/(tabs)/_layout.tsx`: os 4 ícones (Despensa, Lista, Resumo, Configurações) estão presentes.
- [ ] 6.2 Teste de integração: a aba ativa recebe a cor `action.azulejo` e as inativas `text.secondary` (verificar a prop `color` recebida por `tabBarIcon`).
- [ ] 6.3 Caso de borda: trocar de aba muda corretamente qual ícone recebe `action.azulejo` (não fica preso na primeira aba renderizada).

## 7. Posição do `RodapeCompra` e mini gráfico de 4 meses — ACHADO-052

- [ ] 7.1 Conferir `app/compra/[id].tsx:114-127` contra o novo requisito de `modo-compra` (rodapé imediatamente acima do botão "Fechar compra"); corrigir no mesmo commit se divergir.
- [ ] 7.2 Conferir `app/(tabs)/resumo.tsx:9,16,143-153` (`MESES_NO_GRAFICO`, `slice(0, 4).reverse()`) contra o novo requisito de `resumo-de-valores` (exatamente 4 meses, ordem ascendente); corrigir no mesmo commit se divergir.
- [ ] 7.3 Teste do cenário exato do bug: `app/compra/[id].tsx` renderiza `RodapeCompra` imediatamente antes do botão "Fechar compra" na árvore (ordem de renderização/posição no layout).
- [ ] 7.4 Teste do cenário exato do bug: `app/(tabs)/resumo.tsx` com gasto agregado em 6 meses passa exatamente os 4 mais recentes ao `GraficoBarras`, em ordem cronológica ascendente.
- [ ] 7.5 Caso de borda: `app/(tabs)/resumo.tsx` com gasto agregado em apenas 2 meses passa os 2 existentes ao `GraficoBarras`, na mesma ordem ascendente, sem erro por índice fora do intervalo.

## 8. Conformidade do repositório

- [ ] 8.1 Rodar `npm run verificar` (fronteiras + lint + typecheck) — sem regressões.
- [ ] 8.2 Rodar `npm test` — todos os testes novos e existentes passando.
