## 1. Cabeçalho da Lista — ACHADO-057

- [ ] 1.1 Em `app/(tabs)/lista.tsx`, aumentar o alvo de toque de "Compartilhar lista" e "Agrupar por categoria" para ≥48×48dp (`hitSlop`/padding via `ALVO_TOQUE_MINIMO`), sem mudar o texto visível.
- [ ] 1.2 Teste do cenário exato do bug: medir `minWidth`/`minHeight` (ou `hitSlop` equivalente) de cada `Pressable` e afirmar ≥48.
- [ ] 1.3 Caso de borda: os dois botões lado a lado não têm áreas tocáveis sobrepostas (medir o espaçamento resultante entre eles).

## 2. Cabeçalho do Resumo — ACHADO-058

- [ ] 2.1 Em `app/(tabs)/resumo.tsx`, aumentar o alvo de toque do botão "Configurações" para ≥48×48dp.
- [ ] 2.2 Teste do cenário exato do bug: medir a área tocável do botão "Configurações" e afirmar ≥48.
- [ ] 2.3 Caso de borda: o toque no botão continua navegando para `/configuracoes` após a mudança de estilo.

## 3. Seletor de tema em Configurações — ACHADO-059

- [ ] 3.1 Em `app/(tabs)/configuracoes.tsx`, aumentar a altura de toque dos três botões de tema para ≥48dp.
- [ ] 3.2 Teste do cenário exato do bug: medir a área tocável de cada uma das três opções e afirmar ≥48.
- [ ] 3.3 Caso de borda: a seleção de tema (`accessibilityState.selected`) e a persistência da escolha continuam funcionando após a mudança de estilo.

## 4. Detalhe/cadastro de produto — ACHADO-063

- [ ] 4.1 Em `app/produto/[id].tsx`, aumentar o alvo de toque de "Corrigir quantidade atual" (linhas ~185-194) e "Ver histórico completo" (linhas ~238-244) para ≥48×48dp.
- [ ] 4.2 Em `src/presentation/components/formulario-produto.tsx`, aumentar o alvo de toque de "Mais opções"/"Menos opções" para ≥48×48dp.
- [ ] 4.3 Teste do cenário exato do bug: medir a área tocável dos três controles (nas telas de Detalhe e de Cadastro, já que `FormularioProduto` é compartilhado) e afirmar ≥48.
- [ ] 4.4 Caso de borda: tocar "Corrigir quantidade atual" ainda abre o sheet de ajuste, e tocar "Ver histórico completo" ainda navega para `/produto/[id]/historico`, sem regressão de comportamento.

## 5. Vocabulário do stepper — ACHADO-061

- [ ] 5.1 Em `app/(tabs)/index.tsx:268`, trocar o verbo do `rotuloAcaoConsumo` de "Registrar consumo de X" para "Usei X".
- [ ] 5.2 Teste do cenário exato do bug: com um item de exemplo, afirmar que `accessibilityLabel` do botão de decremento é "Usei 1 kg de Carne moída" (ou equivalente), e não contém "Registrar consumo".
- [ ] 5.3 Caso de borda: nenhum outro texto do fluxo (botão visível, toast "Anotado", histórico) usa "Registrar consumo" — grep de confirmação em `app/`, `src/presentation/`.
- [ ] 5.4 Atualizar `src/presentation/components/medidor-e-item.test.tsx` (linhas 67 e 78, que hoje fixam `'Registrar consumo de 1 pacote de Café em pó'`) para o novo texto esperado.

## 6. Agrupamento acessível do histórico — ACHADO-064

- [ ] 6.1 Em `app/produto/[id]/historico.tsx`, envolver cada linha (`Linha`) num contêiner `accessible` com `accessibilityLabel` combinando verbo, quantidade, data e motivo (quando houver).
- [ ] 6.2 Teste do cenário exato do bug: renderizar uma linha de histórico com motivo e afirmar que existe um único nó acessível com o rótulo combinado (ex.: `getByLabelText(/Usei 3 pacotes.*9 de agosto/)`), em vez de três `Texto`s soltos no snapshot de acessibilidade.
- [ ] 6.3 Caso de borda: uma linha sem motivo (consumo/reposição comum, não ajuste) monta o rótulo combinado sem o fragmento "· motivo" pendurado.
- [ ] 6.4 Caso de borda: o texto visível de cada `Texto` interno permanece inalterado (a correção é só na árvore de acessibilidade, não no layout visual).

## 7. Vocabulário "Conferência da despensa" — ACHADO-060

- [ ] 7.1 Em `app/(tabs)/configuracoes.tsx`, renomear o texto do botão de "Conferência de estoque" para "Conferência da despensa".
- [ ] 7.2 Teste do cenário exato do bug: renderizar a tela de Configurações e afirmar que o texto "Conferência da despensa" existe e "Conferência de estoque" não existe.
- [ ] 7.3 Caso de borda: o botão continua navegando para `/conferencia` após a troca do texto.

## 8. Conformidade do repositório

- [ ] 8.1 Rodar `npm run verificar` (fronteiras + lint + typecheck) — sem regressões.
- [ ] 8.2 Rodar `npm test` — todos os testes novos e existentes passando, incluindo os testes atualizados de `medidor-e-item.test.tsx`.
