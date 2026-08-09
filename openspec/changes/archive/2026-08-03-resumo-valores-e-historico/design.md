## Context

Última change do MVP, e a mais simples tecnicamente: nenhuma escrita, nenhuma migration, nenhum estado novo. É camada de leitura sobre dados que já existem — razão pela qual ARQUITETURA §11 a coloca por último, na etapa 8.

Simples não significa sem armadilha. A armadilha está em DATABASE §6.5, e é nomeada com precisão: `quantidade_atual * valor_unitario` produz **centavos × 1000**, porque milésimos vezes centavos não é centavos. O documento acrescenta que isso "é exatamente o tipo de detalhe que passa despercebido em código gerado e produz um valor 1000× errado na tela".

O domínio já tem a função única de conversão, com teste. Esta change precisa usá-la e não improvisar aritmética na consulta nem no componente.

A segunda restrição é de produto: PRD §2.2 US-07 exige rótulos distintos para o valor do estoque e o da lista, "evitar confusão entre 'total em casa' e 'total a comprar'". O PRD chega a listar isso como decisão em aberto no apêndice — item 2, confirmando se é isso mesmo. A arquitetura e o design de frontend seguiram assumindo que sim, e é o que esta change implementa.

## Goals / Non-Goals

**Goals:**

- Os dois valores, separados e inequívocos.
- Gasto mensal correto, incluindo o comportamento na virada do mês.
- Histórico de compras navegável, sem consultas repetidas.
- Nenhum valor derivado persistido.

**Non-Goals:**

- Gráfico de gasto mensal — v1.1 no roadmap do PRD. Com dois meses de uso, um gráfico mostra dois pontos e não diz nada; a mesma autocrítica de FRONTEND §13 sobre o gráfico de consumo se aplica.
- Histórico de preço por produto — v1.1.
- Divisão de despesas entre moradores — fora de escopo declarado.
- Projeção de gasto futuro ou qualquer previsão — v2.0, condicionada a massa de dados.

## Decisions

### D1 — A consulta entrega bruto; a conversão acontece uma vez, no domínio

`SELECT SUM(quantidade_atual * valor_unitario)` retorna centavos × 1000. A consulta se chama explicitamente "bruto" e o domínio converte.

Isso não é preciosismo de camada: é a diferença entre R$ 22,30 e R$ 22.300,00 na tela. E é silencioso — nenhum erro é lançado, o número só está errado.

Alternativa considerada: dividir por mil na consulta. Rejeitada por dois motivos — introduz arredondamento no SQL fora do controle do domínio, e cria a segunda implementação da conversão que DATABASE §11 lista como anti-pattern ("Regra de negócio duplicada em SQL").

Teste de aceitação concreto: uma despensa com dois itens de valores conhecidos, verificando o total exato.

### D2 — Os dois valores nunca são somados

Valor do estoque é patrimônio. Valor da lista é despesa futura. Somá-los produz um número sem significado, e é exatamente a confusão que o PRD pede para evitar.

A tela os apresenta como dois blocos distintos, com rótulos em linguagem de usuário — o que está em casa, e o que falta comprar. Sem um "total geral" em lugar nenhum.

### D3 — Contagens são atalhos de navegação, não decoração

Tocar em "12 faltando" leva à despensa filtrada por aquele estado. É o que transforma o resumo em ponto de partida em vez de tela terminal.

Custa pouco e resolve o padrão de uso real: a pessoa abre o resumo, vê que tem 3 itens acabados, e quer ver quais são.

### D4 — Agrupamento mensal no fuso local, não em tempo universal

A agregação por mês usa o fuso do aparelho. Uma compra fechada às 23h do dia 31 precisa cair naquele mês — em tempo universal cairia no seguinte, e o usuário veria um gasto aparecer no mês errado.

DATABASE §6.5 já escreve a consulta com conversão para hora local, o que torna isso uma questão de não desfazer o que já está certo.

### D5 — Compra cancelada aparece no histórico, mas não no gasto

Apagar compras canceladas perderia o registro de que houve uma tentativa. Contá-las no gasto seria mentira — nada foi pago.

A situação `cancelada` existe no schema desde a migration inicial; aqui ela ganha tratamento visual distinto.

### D6 — Histórico paginado por data, pelo mesmo motivo do histórico de produto

Compras crescem devagar (~50/ano), então a paginação não é urgente por volume. Mas a paginação por deslocamento numérico está listada como anti-pattern em DATABASE §11, e o custo de fazer certo agora é zero.

Consistência também importa: dois históricos no mesmo app paginando de formas diferentes é o tipo de divergência que gera bug quando alguém copia o padrão errado.

### D7 — Produto removido não pode quebrar o histórico de compras

`compra_item.produto_id` tem `ON DELETE SET NULL`, e a remoção de produto é lógica — então o vínculo permanece. Mas a consulta usa junção **externa** (DATABASE §6.7), e a tela precisa tratar o caso de o produto não vir.

O item de compra guarda quantidade comprada e valor pago próprios, então o histórico continua correto mesmo sem o produto. O que falta é o nome — resolvido exibindo o nome do produto no momento da compra quando disponível.

### D8 — Sem gráfico, e isso é decisão, não omissão

FRONTEND §13 já cortou o gráfico de consumo do detalhe do produto pelo motivo certo: "com um mês de uso ele mostra três pontos e não diz nada". O mesmo vale aqui.

A lista de meses com valores em monoespaçada tabular é legível e honesta com o volume de dados que existirá. Gráfico é v1.1, quando houver doze meses reais.

## Risks / Trade-offs

| Risco | Mitigação |
|---|---|
| Valor mil vezes errado por conversão feita na consulta ou no componente | Função única do domínio, com teste de aceitação de valor exato sobre uma despensa conhecida |
| Usuário confundir valor do estoque com valor da lista | Blocos separados, rótulos em linguagem de usuário, nenhum total combinado |
| Gasto do mês aparecendo no mês errado na virada | Agregação em fuso local; teste com compra fechada perto da meia-noite do último dia do mês |
| Totais parecerem errados por causa de itens sem preço | A contagem de itens sem preço aparece junto dos valores, deixando explícito que são parciais |
| Detalhe de compra com consultas repetidas por item | Junção externa em consulta única; teste de contagem de consultas |
| Tela do histórico quebrando com produto removido | Junção externa e tratamento do produto ausente; teste explícito |

## Migration Plan

Nenhuma. Change somente de leitura.

## Open Questions

- **Confirmação da decisão do PRD (apêndice, item 2)**: o PRD deixou em aberto se o usuário quer os dois valores ou apenas um. Esta change implementa os dois, que é o que o próprio corpo do PRD e o design de frontend assumem. Se o usuário decidir por um só, remover um bloco é trivial — a decisão pode esperar o uso real.
- **Meses sem compra**: exibir com valor zero ou omitir? Exibir mantém o eixo temporal legível e prepara para o gráfico da v1.1; omitir deixa a lista mais curta. Proposta: exibir, com tratamento visual discreto.
- **Período do gasto mensal**: doze meses, conforme a consulta já escrita no documento de banco. Antes de haver doze meses de dados, a lista simplesmente é mais curta.
