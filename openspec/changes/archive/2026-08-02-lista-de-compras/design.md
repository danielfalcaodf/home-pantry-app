## Context

Com a despensa cadastrada e o registro de consumo funcionando, a lista é o retorno do investimento: quem registrou passa a receber pronto o que precisa comprar. É a metade do problema do PRD que ainda não foi resolvida — chegar ao mercado sem lembrar do que faltava.

A restrição estrutural está fechada desde o design de banco (§2): **não existe tabela de lista**. Ela é derivada dos produtos abaixo do mínimo mais os avulsos da compra aberta. Isso não é preferência de modelagem — é o que impede o bug de lista divergente do estoque, que é o modo de falha mais comum desse tipo de app.

FRONTEND §8.2 dá a forma: a coluna de preço em monoespaçada alinhada à direita faz a lista ler como um cupom, "que é exatamente o que ela vai virar".

## Goals / Non-Goals

**Goals:**

- Lista derivada, reativa, sem materialização.
- Quantidade a comprar e custo vindos do domínio; consulta entregando bruto.
- Avulsos funcionando sem poluir a despensa.
- Total confiável mesmo com itens sem preço — é o que sustenta K5.
- Exportação em texto legível fora do app.

**Non-Goals:**

- Marcar itens como comprados e fechar a compra — change `modo-compra-e-fechamento`. A lista prepara; a compra executa.
- Histórico de preço por produto e ordem de corredor configurável (v1.1).
- Comparação de preço entre lojas — fora de escopo declarado.

## Decisions

### D1 — A remoção de item da lista é uma exclusão da compra aberta, não do produto

Problema real: o item está abaixo do mínimo, então a consulta o traz. Se o usuário o remove da lista, como ele não volta na próxima abertura da tela?

**Decisão:** a compra aberta ganha um registro de item **excluído desta compra**. A lista derivada subtrai esses. Quando a compra é fechada, a exclusão morre com ela, e o item volta na próxima lista se ainda estiver em falta — que é exatamente o comportamento descrito no requisito.

Alternativa considerada: uma coluna no produto marcando "ignorar na lista". Rejeitada — é estado permanente para uma decisão momentânea, e o usuário esqueceria de desligar, produzindo um item que nunca mais aparece.

Implementação: um item de compra com marcação de exclusão, aproveitando a tabela existente sem coluna nova no produto.

### D2 — A compra aberta é criada sob demanda, não na abertura do app

Criar uma compra aberta vazia toda vez que o app abre produziria lixo e brigaria com o índice de unicidade em cenários de corrida. Ela nasce quando o usuário adiciona um avulso ou remove um item — os dois eventos que precisam de um recipiente.

Consequência: enquanto não houver nem avulso nem exclusão, a lista é puramente a consulta de faltantes. Simples e sem estado.

### D3 — O agrupamento é preferência persistida, não estado de tela

FRONTEND §8.2 põe "Agrupar" no cabeçalho como alternância. O requisito pede que a escolha permaneça ao voltar à tela.

Diferente dos filtros da despensa (que são efêmeros por decisão em D5 daquela change), o modo corredor é uma preferência de como a pessoa faz compras — ela não muda entre uma abertura e outra. Vai para a tabela de configuração criada na change de tema.

### D4 — Itens sem preço são sinalizados, e o total é honesto sobre o que ignora

K5 mede o desvio entre o custo estimado e o valor real pago, com meta de ≤ 15%. Um total que silenciosamente ignora cinco itens sem preço destrói essa métrica e, pior, a confiança.

Por isso a contagem de itens sem preço fica no rodapé, ao lado do total, e não escondida. O usuário sabe que o total é parcial e por quanto.

### D5 — O arredondamento acontece uma vez, e o custo usa o valor arredondado

Sequência: consulta entrega diferença bruta em milésimos → domínio arredonda por unidade → custo é calculado sobre o valor arredondado.

O erro a evitar é calcular o custo sobre a diferença bruta e exibir a quantidade arredondada — a lista mostraria "1 pacote" e cobraria por meio pacote. DATABASE §6.2 já alerta: o SQL entrega o bruto, o domínio arredonda e **só então** multiplica.

Além disso, o valor arredondado é o que vira `quantidade_planejada` do item de compra na change seguinte — sem rearredondar lá, o que produziria inflação a cada passagem.

### D6 — Exportação é texto simples pela folha de compartilhamento do sistema

Sem formatação rica, sem PDF, sem imagem. Texto que cabe em uma mensagem e que a outra pessoa lê sem ter o app.

O formato acompanha o agrupamento ativo: se a pessoa organiza por corredor, o texto sai por corredor — a lista compartilhada serve para alguém andar no mercado com ela.

### D7 — A lista lê como um cupom, e isso é responsabilidade da tipografia

Preço em monoespaçada tabular alinhado à direita (FRONTEND §4.1). Já garantido pelos tokens; aqui é questão de usar o papel certo e alinhar a coluna, não de estilo novo.

## Risks / Trade-offs

| Risco | Mitigação |
|---|---|
| Total estimado distante do valor real pago, derrubando K5 | Sinalizar itens sem preço explicitamente; a atualização de preço na finalização da compra (change seguinte) é o mecanismo que faz o total convergir com o uso |
| Item removido da lista reaparecendo por engano na mesma compra | Exclusão vive na compra aberta e é testada explicitamente com reabertura da tela |
| Exclusão da compra aberta sobrevivendo além do fechamento | Teste de ciclo completo: remover, fechar a compra, confirmar que o item volta na próxima lista |
| Arredondamento aplicado duas vezes entre lista e compra | O valor arredondado vira a quantidade planejada sem rearredondar; teste de idempotência já existe no domínio, mais teste de integração no fluxo |
| Avulso virando produto por engano | Teste explícito confirmando que nenhum produto novo aparece na despensa após adicionar avulso |
| Compra aberta duplicada por corrida ao adicionar dois avulsos rapidamente | Índice único no banco como garantia final; criação sob demanda serializada |

## Migration Plan

Sem migration de schema — a tabela de compra e a de itens já existem desde a change de persistência, incluindo o suporte a item avulso com produto nulo. A marcação de item excluído da compra usa as colunas existentes.

Se a marcação de exclusão exigir uma coluna nova em `compra_item`, ela chega como migration forward-only nova, e não por edição de migration publicada.

## Open Questions

- **Quantidade padrão do avulso**: assumir 1 na unidade escolhida, editável. Sem dado que sugira outro padrão.
- **Ordem das categorias no modo corredor**: alfabética por ora. Ordem de corredor configurável exige a tabela de categoria descrita em DATABASE §3.2 e é v1.1 — a mesma questão em aberto da change da despensa.
- **Itens sem preço no texto exportado**: incluídos com a marcação. Alternativa seria omiti-los, o que faria a pessoa esquecer de comprá-los — pior.
