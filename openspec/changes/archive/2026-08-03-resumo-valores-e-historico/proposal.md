## Why

Última change do MVP. É a camada de leitura sobre dados que já existem — por isso vem por último (ARQUITETURA §11, etapa 8): não bloqueia nada e não faz sentido antes de haver estoque e compras reais dentro.

Ela atende US-07 e fecha a promessa de controle de orçamento da casa. E carrega um requisito de produto que é explicitamente sobre evitar confusão: o PRD separa **deliberadamente** valor do estoque de valor da lista de compras, e exige que os dois apareçam "com rótulos distintos (evitar confusão entre 'total em casa' e 'total a comprar')". São números da mesma ordem de grandeza que significam coisas opostas — um é patrimônio, outro é despesa futura.

É também a única tela onde o design libera números grandes: FRONTEND §8.4 diz que "aqui — e só aqui — os números podem ser grandes", porque é a tela para onde alguém vai deliberadamente.

## What Changes

- Implementa a tela **Resumo** (`app/(tabs)/resumo.tsx`).
- Exibe o **valor do estoque** — soma de quantidade atual × valor unitário de todos os produtos.
- Exibe o **valor da lista de compras** — soma dos custos de reposição dos itens em falta.
- Exibe o **gasto por mês** das compras finalizadas, dos últimos doze meses.
- Exibe a contagem de itens por estado e a de itens sem preço cadastrado.
- Implementa o **histórico de compras**: lista de compras finalizadas com data, contagem de itens e total pago, com acesso ao detalhe de cada uma.
- Implementa `use-resumo-valores` e `use-historico-compras`.
- Garante que a conversão de milésimos × centavos passa pela função única do domínio — o ponto onde um erro produz um valor mil vezes errado na tela (DATABASE §6.5).

## Capabilities

### New Capabilities

- `resumo-de-valores`: o valor do que está em casa e o valor do que falta comprar, com rótulos inequívocos.
- `gasto-mensal`: a agregação das compras finalizadas por mês.
- `historico-de-compras`: a listagem das compras finalizadas e o detalhe de cada uma.

### Modified Capabilities

_Nenhuma._

## Impact

- **Cria**: `app/(tabs)/resumo.tsx`, `app/compra/historico.tsx`, `src/application/resumo/*`.
- **Modifica**: barra de abas (a aba Resumo deixa de ser marcador).
- **Depende de**: `modo-compra-e-fechamento` (compras finalizadas com total pago), `lista-de-compras` (custo de reposição), `fundacao-dominio` (conversões).
- **Bloqueia**: nada. É a última change do MVP.
- **Somente leitura**: nenhuma escrita nova. Todos os números são derivados de dados existentes, nunca persistidos.
