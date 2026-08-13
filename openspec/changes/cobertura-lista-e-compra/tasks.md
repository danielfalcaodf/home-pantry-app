## 1. Validação de `SheetAvulso` (ACHADO-029)

- [x] 1.1 Criar `src/presentation/components/sheet-avulso.test.tsx`: salvar com nome preenchido chama `onSalvar` com os dados corretos.
- [x] 1.2 Salvar com nome vazio (ou só espaços) exibe o erro "Dê um nome ao item" e não chama `onSalvar`.
- [x] 1.3 Preço em branco entra como `null` nos dados salvos.
- [x] 1.4 Modo de edição: `inicial` preenchido popula os campos com os valores do item existente.

## 2. Agrupamento e lista contínua (ACHADO-030)

- [x] 2.1 Criar `src/presentation/format/agrupar-lista.test.ts` para `agruparListaPorCategoria`: grupos em ordem alfabética, itens ordenados por nome dentro do grupo.
- [x] 2.2 Confirmar que o grupo "Sem categoria" aparece por último mesmo com categorias que alfabeticamente viriam depois dele.
- [x] 2.3 Testar `listaContinua`: ordenação única por nome, avulsos misturados aos produtos.

## 3. Preferência de agrupamento (ACHADO-031)

- [x] 3.1 Criar `src/application/lista/use-preferencia-agrupamento.test.ts` com repositório fake: leitura inicial reflete o valor salvo.
- [x] 3.2 `alternar()` inverte o valor e persiste via `gravar` no fake.

## 4. Rodapé de totais (ACHADO-032)

- [x] 4.1 Criar `src/presentation/components/rodape-total.test.tsx`: rótulo "estimado" presente no total exibido.
- [x] 4.2 Linha de itens sem preço aparece quando `contagemSemPreco` > 0 e não aparece quando é 0.
- [x] 4.3 Contagem de itens e total exibidos corretamente a partir das props.

## 5. Linha de item da lista (ACHADO-033)

- [x] 5.1 Criar `src/presentation/components/item-lista.test.tsx`: item avulso renderiza com o prefixo "+ " no nome.
- [x] 5.2 Item de produto (não avulso) não recebe o prefixo.
- [x] 5.3 Item com `semPreco` verdadeiro exibe a indicação de sem preço em vez do valor.

## 6. Gasto mensal com compra de total zero (ACHADO-046)

- [x] 6.1 Estender o teste de infraestrutura de `gastoPorMes` (`sqlite-compra.repository.test.ts`) com uma compra finalizada sem itens marcados (total zero).
- [x] 6.2 Confirmar que `qtdCompras` do mês inclui essa compra e que `totalPago` não é distorcido por ela.
- [x] 6.3 Estender `use-gasto-mensal.test.ts` com o mesmo cenário na camada de aplicação.

## 7. Item não comprado no detalhe (ACHADO-047)

- [x] 7.1 Estender `use-detalhe-compra.test.ts` com um item `comprado: false` no conjunto de itens da compra.
- [x] 7.2 Confirmar que o hook retorna esse item com a marcação preservada, distinguível dos comprados.

## 8. Gate de testes

- [x] 8.1 Rodar `npm run verificar` (fronteiras + lint + typecheck) — sem regressões.
- [x] 8.2 Rodar `npm test` completo (`domain` e `app`) e confirmar 100% verde, incluindo os sete testes novos/estendidos desta change.
