## Context

Última peça do ciclo. Sem ela o estoque só desce.

O contexto de uso define o desenho mais do que qualquer preferência estética: a pessoa está em pé no corredor do mercado, empurrando um carrinho, com uma mão livre. FRONTEND §8.3 responde com uma tela só, sem navegação interna, tela travada acordada, checkbox grande, rodapé fixo com contador e total corrente.

E o requisito que domina a implementação vem de ARQUITETURA §5.3 e DATABASE §6.4: **ou a compra inteira repõe, ou nada repõe**. Estoque metade reposto é o pior estado possível para a confiança no app — pior que não repor, porque o usuário não tem como saber o que entrou e o que não entrou.

## Goals / Non-Goals

**Goals:**

- Modo compra utilizável com uma mão, sem sair da tela.
- Fechamento atômico, com teste de falha no meio.
- Preço de referência convergindo com o uso real — o mecanismo que sustenta K5.
- Itens não marcados voltando à lista sem intervenção.

**Non-Goals:**

- Leitura de nota fiscal e scanner de código de barras — fora de escopo declarado (v2.0).
- Histórico de preço por produto (v1.1). Aqui o preço de referência é substituído, não versionado.
- Divisão de despesas entre moradores — fora de escopo.
- Compra parcelada, múltiplas lojas, comparação de preço.

## Decisions

### D1 — A materialização acontece ao iniciar a compra, não antes

A lista é derivada (change anterior). Mas no momento em que a pessoa entra no mercado, ela precisa de uma **fotografia**: se o outro morador registrar um consumo enquanto ela compra, a lista dela não pode mudar sob o dedo.

**Decisão:** "Iniciar compra" converte os itens correntes em `compra_item` com quantidade planejada e valor estimado. A partir daí a compra é um conjunto fixo.

Isso também dá o registro histórico que o resumo vai usar: o que foi planejado versus o que foi comprado versus o que foi pago.

Alternativa considerada: manter derivado até o fechamento. Rejeitada — a lista mudaria durante a compra e não haveria como registrar a quantidade planejada, que é o padrão assumido ao marcar sem ajustar.

### D2 — O arredondamento não é reaplicado na materialização

A quantidade planejada é exatamente a que a lista exibiu. Rearredondar aqui inflaria: 1 pacote arredondado viraria 1 pacote de novo (inofensivo), mas qualquer valor que já tivesse sido arredondado para cima e depois somado produziria deriva.

A regra de domínio já é idempotente e tem teste para isso; aqui a decisão é simplesmente **não chamar a função de novo**.

### D3 — Marcar é local; repor é no fechamento

Marcar um item, ajustar quantidade e preço são escritas em `compra_item` — não tocam no produto nem geram movimento. A reposição inteira acontece no fechamento, em uma transação.

Rationale: repor a cada marcação pareceria mais responsivo e destruiria a atomicidade. Se a pessoa desistir da compra no meio do mercado, o estoque não pode estar metade reposto. E o cancelamento não precisaria de compensação — basta não fechar.

Consequência a assumir: até fechar, a despensa não reflete o que já está no carrinho. Correto — o item ainda não chegou em casa.

### D4 — A pergunta de preço é registrada durante a compra, aplicada no fechamento

A pergunta aparece quando o usuário informa um preço divergente, e a resposta fica registrada no item de compra. A escrita em `produto.valor_unitario` só acontece dentro da transação de fechamento.

Isso mantém a propriedade de "nada acontece até fechar" e evita o estado onde o preço foi atualizado mas a compra foi abandonada.

Detalhe do texto: a pergunta precisa ser respondível sem sair da tela e sem bloquear a marcação dos próximos itens — no corredor do mercado, um diálogo modal por item seria inaceitável. Implementada como controle embutido na linha do item, não como diálogo.

### D5 — Produto sem preço cadastrado também dispara a pergunta

Valor unitário zero significa "nunca soube o preço", não "é de graça". Quando a pessoa informa o valor pago pela primeira vez, oferecer registrá-lo é o caminho mais barato de eliminar a marcação "sem preço" da lista — que é o que degrada K5.

### D6 — Tela acordada durante a compra, restaurada ao sair

`expo-keep-awake` ativo enquanto a tela está montada. Uma pessoa marcando itens a cada dois minutos teria a tela apagando constantemente, e desbloquear com o carrinho na mão é exatamente o atrito que o app existe para eliminar.

Restaurar ao sair é obrigatório — deixar a trava ativa drena bateria por engano.

### D7 — Item marcado perde toda a tinta

FRONTEND §7.7: marcado é nome em secundário com risco horizontal, e a linha perde todo o preenchimento. "A lista vai literalmente esvaziando conforme você anda pelo mercado."

Isso é a mesma metáfora do medidor operando ao contrário — e é o que dá o retorno visual de progresso sem precisar de barra de progresso. O contador do rodapé é a confirmação numérica.

### D8 — Voltar não fecha, e o progresso é preservado

Sair do modo compra não cancela nada: a compra continua aberta com as marcações. É o comportamento certo para quem sai do app no meio do mercado e volta depois.

Só o botão de fechar compra finaliza. Cancelar a compra é uma ação separada — a situação `cancelada` já existe no schema (DATABASE §4) e pode ser oferecida no menu da tela.

## Risks / Trade-offs

| Risco | Mitigação |
|---|---|
| Fechamento falhando no meio e deixando estoque parcial | Transação única no repositório, com teste de falha injetada no processamento de um item intermediário |
| Usuário perder as marcações ao sair do app no mercado | Marcações são gravadas em `compra_item` a cada toque, não em memória; teste de retomada |
| Pergunta de preço interrompendo o fluxo do corredor | Controle embutido na linha, nunca diálogo modal; verificar em uso real |
| Total corrente divergindo do total pago gravado no fechamento | Ambos calculados pela mesma função de domínio; teste comparando o exibido com o gravado |
| Tela acordada esquecida ativa após sair, drenando bateria | Desativação vinculada à desmontagem da tela; verificar em uso real |
| Marcar item com quantidade ausente e o banco rejeitar no fechamento | Restrição do banco já exige quantidade em item marcado; a interface assume a planejada por padrão, tornando o estado inválido inalcançável |
| Compra iniciada e nunca fechada bloqueando a criação de outra | Índice único permite só uma compra aberta; oferecer cancelar a compra no menu da tela |

## Migration Plan

Sem migration de schema — `compra` e `compra_item` já existem com todas as colunas necessárias, incluindo valor estimado por unidade, valor pago por unidade, quantidade planejada, quantidade comprada e a marcação de comprado.

Se a resposta da pergunta de preço exigir uma coluna própria em `compra_item`, ela chega como migration forward-only nova.

## Open Questions

- **Cancelar compra**: a situação `cancelada` existe no schema mas nenhum documento define quando ela é oferecida. Proposta: item de menu na tela do modo compra, com confirmação, mantendo a compra no histórico como cancelada em vez de apagá-la.
- **Compra sem nenhum item marcado**: fechar uma compra vazia é permitido? Proposta: permitir, registrando total zero — é o caso de "fui ao mercado e não achei nada da lista", e bloquear obrigaria a cancelar, que tem outro significado.
