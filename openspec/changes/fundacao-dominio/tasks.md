## 1. Unidades

- [x] 1.1 Criar `src/domain/shared/unidade.ts` com o tipo união das sete unidades (`un`, `kg`, `g`, `L`, `ml`, `pacote`, `caixa`)
- [x] 1.2 Implementar `ehIndivisivel(unidade)` classificando `un`, `pacote` e `caixa` como indivisíveis
- [x] 1.3 Implementar o rótulo de exibição de cada unidade, no singular e no plural
- [x] 1.4 Escrever testes de classificação e de rotulagem cobrindo as sete unidades

## 2. Quantidade em milésimos

- [x] 2.1 Criar `src/domain/shared/quantidade.ts` com o tipo nominal `Milesimos` e o construtor `milesimos(n)`
- [x] 2.2 Implementar `deDecimal(valor)` convertendo o decimal digitado para milésimos, e `paraDecimal(m)` para o caminho inverso
- [x] 2.3 Implementar `formatarQuantidade(m, unidade)` produzindo texto sem casas decimais supérfluas
- [x] 2.4 Implementar `arredondarParaUnidade(m, unidade)` arredondando para cima só em unidade indivisível
- [x] 2.5 Escrever testes de conversão, de formatação e de arredondamento, cobrindo meio pacote virando um pacote, valor já inteiro não sendo inflado, e unidade divisível preservando a fração
- [x] 2.6 Escrever teste de idempotência: arredondar um valor já arredondado não o altera

## 3. Dinheiro em centavos

- [ ] 3.1 Criar `src/domain/shared/dinheiro.ts` com o tipo nominal `Centavos` e o construtor `centavos(n)`
- [ ] 3.2 Implementar `deTextoDigitado(texto)` convertendo entrada do usuário para centavos, e `formatarBRL(c)` para exibição
- [ ] 3.3 Implementar `multiplicarQuantidadePorPreco(milesimos, centavos)` — a **única** conversão de milésimos por centavos para centavos, com arredondamento ao centavo mais próximo
- [ ] 3.4 Escrever testes de formatação, de conversão de entrada e do produto quantidade por preço, incluindo quantidade fracionária e valor zero
- [ ] 3.5 Escrever teste que verifica que 2000 milésimos por 1290 centavos resulta em 2580 centavos, e não em valor mil vezes maior

## 4. Tipos de entidade

- [ ] 4.1 Criar `src/domain/produto/produto.ts` com o tipo `Produto` refletindo as colunas de DATABASE §4, usando os tipos nominais de quantidade e dinheiro
- [ ] 4.2 Criar `src/domain/movimento/movimento.ts` com o tipo `MovimentoEstoque` e a união dos três tipos de movimento
- [ ] 4.3 Criar `src/domain/compra/compra.ts` com os tipos `Compra` e `CompraItem`, incluindo o caso de item avulso sem produto associado
- [ ] 4.4 Criar `src/ports/clock.ts` com a interface de fonte de tempo injetável

## 5. Regras de estoque

- [ ] 5.1 Criar `src/domain/produto/estoque.rules.ts` e implementar `estadoDoItem(produto)` retornando crítico, em falta ou ok
- [ ] 5.2 Implementar `emFalta(produto)` e `quantidadeAComprar(produto)`, esta última aplicando o arredondamento por unidade
- [ ] 5.3 Implementar `custoReposicao(produto)` e `valorEmEstoque(produto)` usando a conversão única de milésimos por centavos
- [ ] 5.4 Implementar `alturaDoNivel(produto)` retornando a fração clampada em `[0,1]` mais o sinalizador de sobra, e retornando fração 0 sem lançar quando a quantidade necessária for 0
- [ ] 5.5 Implementar `rotuloDoItem(produto)` produzindo "Acabou", "Falta N" ou "Cheio", usando a formatação de quantidade do projeto
- [ ] 5.6 Implementar `totalDaLista(produtos)` retornando o total em centavos e a contagem de itens sem preço, separadamente
- [ ] 5.7 Escrever testes de estado cobrindo zerado, abaixo do mínimo, no mínimo exato e acima do mínimo
- [ ] 5.8 Escrever testes de `quantidadeAComprar` cobrindo unidade divisível, unidade indivisível com fração, item ok e item zerado
- [ ] 5.9 Escrever testes de `alturaDoNivel` cobrindo fração parcial, item acima do necessário sem transbordar, item zerado e quantidade necessária inválida
- [ ] 5.10 Escrever teste de item sem preço na lista: custo 0, marcado como sem preço, e total da lista não corrompido
- [ ] 5.11 Escrever teste garantindo que nenhum rótulo contém vocabulário de sistema

## 6. Categoria e validação de produto

- [ ] 6.1 Criar `src/domain/produto/categoria.ts` com `normalizarCategoria(texto)` aplicando trim, colapso de espaços e capitalização
- [ ] 6.2 Fazer `normalizarCategoria` retornar ausência de categoria quando o texto for só espaços
- [ ] 6.3 Criar `src/domain/produto/validacao.ts` com `validarCadastroProduto(entrada)` retornando `Result`, exigindo nome não vazio, unidade suportada e quantidade necessária maior que zero
- [ ] 6.4 Aplicar os padrões de quantidade atual 0 e valor unitário 0 quando não fornecidos
- [ ] 6.5 Escrever testes de normalização de categoria cobrindo espaços nas pontas, caixa, espaços internos repetidos e texto vazio
- [ ] 6.6 Escrever testes de validação cobrindo cadastro válido, nome vazio, quantidade necessária zero, quantidade necessária decimal e valor unitário negativo

## 7. Regras de movimento

- [ ] 7.1 Criar `src/domain/movimento/movimento.rules.ts` com `construirMovimento(tipo, variacao, ...)` validando coerência de sinal e rejeitando variação zero
- [ ] 7.2 Implementar `aplicarMovimento(saldoAtual, movimento)` retornando o saldo resultante e a variação efetivamente aplicada, fixando em zero quando cruzaria o zero
- [ ] 7.3 Fazer `aplicarMovimento` sinalizar "nada a gravar" quando a baixa incide sobre saldo já zerado
- [ ] 7.4 Implementar `movimentoInverso(movimento)` produzindo a variação de sinal oposto, preservando o tipo `ajuste` quando aplicável
- [ ] 7.5 Escrever testes de coerência de sinal cobrindo baixa negativa, reposição positiva, variação zero rejeitada e sinal incoerente rejeitado
- [ ] 7.6 Escrever teste da baixa que cruzaria zero: saldo 500 com baixa de 2000 resulta em saldo 0 e variação aplicada de -500
- [ ] 7.7 Escrever teste de desfazer confirmando que o movimento original é preservado e que o inverso é um novo movimento

## 8. Regras de compra

- [ ] 8.1 Criar `src/domain/compra/compra.rules.ts` com `totalPago(itens)` somando apenas os itens marcados
- [ ] 8.2 Implementar `efeitoDeReposicao(item, produto)` retornando a nova quantidade e o movimento de reposição, e nada para item avulso
- [ ] 8.3 Implementar `divergenciaDePreco(item, produto)` sinalizando quando o valor pago difere do cadastrado, inclusive quando o cadastrado é zero
- [ ] 8.4 Implementar `efeitosDaFinalizacao(compra, produtos, confirmacoesDePreco)` retornando reposições, atualizações de preço confirmadas e total pago em uma única estrutura, ou falha sem efeito parcial
- [ ] 8.5 Escrever testes de total pago cobrindo itens marcados e não marcados, compra sem marcações e item marcado sem preço
- [ ] 8.6 Escrever testes de reposição cobrindo item de estoque, item avulso e quantidade comprada diferente da planejada
- [ ] 8.7 Escrever testes de divergência de preço cobrindo preço igual, preço diferente, produto sem preço cadastrado, e o efeito de confirmar ou não confirmar
- [ ] 8.8 Escrever teste de falha na finalização: um item marcado sem quantidade comprada produz falha e nenhum efeito para nenhum item

## 9. Conformidade e cobertura

- [ ] 9.1 Executar o script de verificação de fronteiras e confirmar que `src/domain/` não tem nenhum import externo
- [ ] 9.2 Executar a suíte de testes do domínio e confirmar que ela roda sem emulador e sem Metro
- [ ] 9.3 Verificar que a cobertura de `src/domain/` atinge no mínimo 90% e que os cinco casos de falha silenciosa têm teste nomeado
- [ ] 9.4 Revisar que nenhuma regra implementada aqui está duplicada em outro lugar do repositório
