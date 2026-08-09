## Context

O PRD lista, entre os riscos técnicos, um único de impacto **Crítico**: abandono por atrito de entrada. A cadeia de causalidade é direta — se dar baixa não for trivial, a persona P2 para de registrar; sem registro, o estoque desatualiza; com estoque desatualizado, K2 (precisão ≥ 85%) cai e o app deixa de ter função. Nenhum outro risco do projeto tem esse alcance.

A meta que traduz isso é K4: ≤ 3 toques, ≤ 10 segundos. FRONTEND §1 dá a consequência de design: *"nenhum elemento pode competir com o gesto de dar baixa"*.

A vantagem estrutural já está paga: sem backend, a escrita é local e síncrona (ARQUITETURA §5.1), e `produto.quantidade_atual` é materializado justamente para que a leitura não degrade com o histórico (DATABASE §3.3). Esta change é onde essa vantagem vira experiência percebida — ou se perde.

## Goals / Non-Goals

**Goals:**

- Um toque registra e persiste, sem confirmação, navegação ou indicador de carregamento.
- A coreografia de FRONTEND §9 implementada com fidelidade, rodando na thread de interface.
- Desfazer por movimento inverso, com janela de dez segundos e uma única confirmação por vez.
- Caminho por quantidade específica, com alternativa visível ao toque longo.
- Medição real do KPI, registrada.

**Non-Goals:**

- Ajuste manual de quantidade com motivo (perda, vencimento, correção) — change `ajuste-e-conferencia-estoque`. Aqui existem consumo e reposição pontual, não ajuste com justificativa.
- Widget de tela inicial (v1.1) e notificações (v1.1).
- Baixa automática por consumo médio — fora de escopo declarado.

## Decisions

### D1 — Otimismo na interface, verdade no banco, sem estado espelhado

O nível começa a descer no instante do toque, mas a fonte de verdade continua sendo a consulta reativa do banco. A animação recebe o valor-alvo calculado pelo domínio; quando a escrita conclui, a consulta reemite e o valor final coincide.

Alternativa considerada: manter um estado local otimista e reconciliar. Rejeitada — cria a segunda fonte de verdade que ADR-05 evita de propósito, e o bug resultante (um item exibindo um valor diferente do gravado) é exatamente o que destrói a confiança que K2 mede.

Se a escrita falhar, a consulta reemite o valor antigo e o nível sobe de volta, com a mensagem de erro. É o comportamento correto e não precisa de código de reversão próprio.

### D2 — O botão só toca; a regra decide

`use-dar-baixa` chama a regra de domínio para obter saldo resultante e variação aplicada, e passa o resultado ao repositório, que persiste em transação única. O componente não sabe que existe a regra de não-negativo.

Isso é o que faz o caso "item já zerado" funcionar sem código de caso especial na interface: a regra retorna "nada a gravar", o hook não chama o repositório, e o botão já estava com opacidade reduzida por causa do estado.

### D3 — Toques rápidos sucessivos: enfileirar, não descartar nem agrupar

Três toques rápidos precisam produzir três unidades a menos e três registros. Agrupar em um único movimento de −3 pareceria eficiente e quebra duas coisas: a trilha de auditoria deixa de refletir o que aconteceu, e o desfazer passa a reverter três atos com um toque.

Implementação: as escritas são serializadas por item, e a animação persegue sempre o valor-alvo mais recente — a mola não reinicia do zero a cada toque, ela redireciona. É o que faz três toques rápidos parecerem um movimento contínuo em vez de três saltos.

### D4 — Uma confirmação por vez, e ela referencia um movimento específico

FRONTEND §7.4 já determina que o toast não empilha. A consequência que precisa ser explícita: o botão de desfazer carrega o identificador do movimento que descreve. Se uma nova confirmação substitui a anterior, o desfazer da anterior é perdido — e isso é correto, porque o usuário está vendo a nova.

O erro a evitar é um botão de desfazer que reverte "o último movimento" em vez de "o movimento que este toast descreve". Com três registros em sequência, os dois se separam.

### D5 — Desfazer de um consumo que zerou o item volta ao valor real, não ao solicitado

Caso concreto: item com 0,5, usuário registra consumo de 1, saldo fixa em 0 com variação aplicada de −0,5. Desfazer precisa somar 0,5 e voltar a 0,5 — não somar 1 e criar 1 unidade que nunca existiu.

Isso funciona de graça porque o movimento gravado carrega a variação **aplicada**, não a solicitada, e o inverso é o oposto da gravada. É a razão de a regra de domínio devolver as duas informações separadamente, e merece teste explícito porque é silencioso quando erra.

### D6 — Painel inferior com campo único, não formulário

FRONTEND §7.3: um campo, unidade fixa ao lado, dois botões, fecha ao salvar. Sem rótulo de campo, sem seletor de tipo de movimento, sem campo de motivo — motivo pertence ao ajuste, que é outra tela e outra intenção.

O teclado numérico do sistema abre junto com o painel; o campo já vem com foco.

### D7 — Reposição pontual aqui, ajuste com motivo depois

O painel oferece `Usei` e `Repus`. `Repus` grava um movimento de reposição sem compra associada — é o caso de "comprei no caminho de casa e não usei o modo compra".

Ajuste (US-06) é semanticamente diferente: não é entrada nem saída, é correção do que o app errou, e carrega motivo. Manter os dois separados preserva o significado do histórico — sem isso, "reposição" passa a incluir "o app estava errado", e a análise de consumo futura fica sem sentido.

### D8 — Medir o KPI, não presumir

Tarefa explícita de cronometrar o percurso completo — abrir o app frio, encontrar o item, registrar — em aparelho real, com uma despensa de volume realista. Contar os toques.

Sem essa medição, "≤ 10 segundos" é aspiração. Com ela, existe um número para comparar quando a lista crescer. O maior suspeito de estourar o orçamento não é a escrita, que é local e instantânea — é a abertura fria do app, que inclui migrations, leitura de tema e carregamento de fontes.

## Risks / Trade-offs

| Risco | Mitigação |
|---|---|
| Abertura fria consumir a maior parte dos 10 segundos | Medir a abertura separadamente do gesto; se ela dominar, otimizar a inicialização antes de mexer no gesto |
| A animação de mola atrasar a percepção de conclusão | A persistência não espera a animação; a confirmação entra em 120 milissegundos, bem antes do fim da descida |
| Toques rápidos produzindo animação em saltos | A mola redireciona para o valor-alvo mais recente em vez de reiniciar; verificar no aparelho com toques rápidos |
| Desfazer errado após confirmações sucessivas | O desfazer referencia o identificador do movimento descrito; teste explícito com três registros em sequência |
| Desfazer de consumo que zerou criando quantidade inexistente | Movimento grava a variação aplicada, não a solicitada; teste explícito |
| Retorno tátil sendo irritante em uso repetido | Usar a intensidade leve especificada; se incomodar em uso real, torná-lo desligável em configurações, nunca removê-lo do padrão sem dado |
| A lista reordenar sob o dedo quando o item muda de estado | O item alterado pode saltar de grupo; verificar em uso real se a reordenação imediata atrapalha registros sucessivos no mesmo item |

## Migration Plan

Sem migration de schema. A transação de baixa e a inserção de movimento já existem desde a change de persistência; aqui elas ganham o caminho de interface.

## Open Questions

- **Reordenação imediata após mudança de estado**: quando um item passa de "em falta" para "acabou", ele muda de grupo e salta na lista. Isso é informativo, e pode atrapalhar quem vai registrar consumo em dois itens vizinhos. Avaliar em uso real; a alternativa seria adiar a reordenação até a próxima abertura da tela, o que introduz uma lista que não reflete o dado.
- **Intensidade do retorno tátil em uso repetido**: especificado como leve. Confirmar em uso real antes de considerar torná-lo configurável.
