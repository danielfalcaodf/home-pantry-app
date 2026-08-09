## Context

Esta change existe porque o app vai errar, e porque a arquitetura escolhida garante que ele vai errar de um jeito específico.

ARQUITETURA §1.1 declara a consequência de não ter backend: **K2 fica em risco se a outra pessoa da casa consumir sem registrar**. Não há sync, não há segundo aparelho, e a segunda pessoa da casa pega o leite sem abrir o app. A mitigação nomeada ali é a "tela de conferência de estoque semanal para recalibrar" — ou seja, esta change não é uma feature de conveniência, é a compensação de produto pela ausência de US-08 no MVP.

Além disso, a desnormalização de `quantidade_atual` foi aceita com **três salvaguardas** (DATABASE §3.3): transação única, quantidade resultante gravada em cada movimento, e a consulta de reconciliação. As duas primeiras já existem. A terceira está implementada como consulta desde a change de backup; aqui ela ganha uma tela.

## Goals / Non-Goals

**Goals:**

- Corrigir quantidade sem quebrar a trilha append-only.
- Recalibrar a despensa inteira rápido, sem recadastrar nada.
- Expor a integridade dos dados de forma verificável pelo usuário.
- Tornar o histórico legível — é o que dá confiança de que o app registra o que deveria.

**Non-Goals:**

- Editar ou apagar movimentos passados. A trilha é append-only; corrigir é adicionar, nunca alterar.
- Controle de validade e lote — v1.1, e DATABASE §10.2 já alerta que "por lote" é migração estrutural, não coluna nova.
- Baixa automática por consumo médio — fora de escopo.
- Notificar para conferir semanalmente — notificação é v1.1.

## Decisions

### D1 — Ajuste é um tipo próprio, e isso é semântica, não taxonomia

Três tipos de movimento existem no schema desde o início: consumo, reposição e ajuste. A tentação de implementação seria tratar ajuste como "reposição quando sobe, consumo quando desce" — menos código, mesmo efeito no saldo.

**Rejeitado.** O efeito no saldo é igual; o significado não. "Repus 2 pacotes" e "o app estava errado em 2 pacotes" são fatos diferentes sobre o mundo. Misturá-los destrói qualquer análise de consumo futura — que é justamente a base dos recursos de v2.0 no PRD §3 (sugestão de quantidade necessária, previsão de ruptura). Um histórico onde ajustes se disfarçam de consumo produz previsões erradas com dados que parecem bons.

O `CHECK` do banco já permite ajuste com qualquer sinal, justamente para isso.

### D2 — O usuário informa o valor final, não a diferença

A pessoa contou 5 pacotes na despensa. Ela informa "5", não "+3". O domínio calcula a variação necessária.

Isso é o contrário do que o modelo de dados sugere — o movimento armazena variação. Mas pedir a diferença exigiria que o usuário fizesse a subtração de cabeça, olhando para um número que ele acabou de constatar estar errado. É o desenho que gera erro.

### D3 — A quantidade atual no detalhe abre o ajuste, não vira campo de texto

Decisão herdada e agora concretizada: a change da despensa deixou a quantidade atual como somente leitura precisamente porque alterá-la gera movimento.

Aqui ela vira tocável, e o toque abre o caminho de ajuste — com motivo opcional. Se fosse um campo de formulário comum ao lado de "nome" e "categoria", pareceria uma edição de cadastro qualquer, e o usuário alteraria o estoque sem perceber que está registrando um fato.

### D4 — Conferência confirma por padrão, corrige por exceção

O percurso mostra a quantidade registrada e um botão de confirmar. Um toque avança sem gravar nada. Corrigir exige informar o novo valor.

Rationale: na conferência semanal a maioria dos itens está certa. Se cada item exigisse digitação, ninguém conferiria trinta itens. O caminho rápido precisa ser o caso comum — é a mesma lógica do KPI da baixa aplicada a outro fluxo.

Confirmar **não grava movimento**. Registrar "confirmei que estava certo" poluiria a trilha com milhares de movimentos de variação zero — que o `CHECK` do banco rejeita de qualquer forma.

### D5 — Conferência é interrompível porque ninguém confere trinta itens de uma vez

O progresso é o próprio estado do banco: os ajustes já gravados estão gravados. "Retomar de onde parou" é uma posição de percurso guardada, não uma transação pendente.

Se o usuário sair no item 10 de 30, nada fica em suspenso — os 10 primeiros foram conferidos, os 20 restantes seguem com os valores que tinham.

### D6 — O diagnóstico corrige pelos movimentos, não pelo materializado

Quando há divergência, qual dos dois números está certo? A soma dos movimentos.

Rationale: o movimento é append-only e cada linha grava a quantidade resultante no momento em que aconteceu (DATABASE §3.3, salvaguarda 2). O materializado é a cópia. Se divergiram, foi uma transação quebrada em algum caminho de escrita — e o valor que sobrevive é o da trilha.

A correção grava um ajuste, o que preserva a propriedade de que a soma dos movimentos sempre explica o saldo. Corrigir com um `UPDATE` silencioso reintroduziria a divergência na iteração seguinte.

### D7 — Histórico paginado por data, nunca por deslocamento numérico

`movimento_estoque` é a única tabela que cresce sem limite (DATABASE §1). A paginação por deslocamento numérico degrada com o tamanho e é listada explicitamente como anti-pattern em DATABASE §11, que já indica o caminho: chave por `criado_em`.

O índice de histórico por produto e data decrescente já existe exatamente para isso.

### D8 — Histórico é somente leitura, sem exceção

Nenhuma ação de editar ou remover movimento. Se o usuário percebe que registrou errado, o caminho é um ajuste — que é um fato novo, não a negação de um fato antigo.

O contrato do repositório de movimento já não expõe atualização nem remoção (decisão da change de persistência). Aqui a interface simplesmente não oferece o que não existe.

## Risks / Trade-offs

| Risco | Mitigação |
|---|---|
| Usuário nunca conferir, e K2 degradar mesmo com a ferramenta pronta | A conferência precisa ser rápida o bastante para ser feita; lembrete é v1.1. Medir quanto tempo leva conferir 30 itens |
| Ajuste virando o caminho preferido de registrar consumo, poluindo a análise | O caminho de consumo é de um toque na lista; o ajuste exige abrir o produto e informar valor. A diferença de atrito é o que separa os dois usos |
| Divergência aparecer e assustar sem ser acionável | A tela explica o que significa e oferece a correção; a linguagem evita alarme |
| Correção em bloco falhando no meio | Transação única para a correção em bloco, com teste de falha injetada |
| Conferência de "tudo" sendo longa demais para terminar | Padrão é conferir por categoria; conferir tudo existe mas não é o caminho sugerido |
| Histórico de produto muito ativo ficando lento | Paginação por data com índice existente; teste com histórico grande |

## Migration Plan

Sem migration de schema. O tipo ajuste, a coluna de motivo e os índices de histórico existem desde a migration inicial — foi exatamente para isso que os `CHECK` foram postos lá, já que adicioná-los depois exigiria o rebuild de 12 passos do SQLite.

## Open Questions

- **Periodicidade sugerida da conferência**: ARQUITETURA §1.1 fala em semanal. Sem notificação (v1.1), a sugestão só pode viver como texto na tela. Avaliar se vale exibir "última conferência há N dias" na despensa, ou se isso vira ruído no caminho crítico.
- **Conferência por categoria versus por estado**: conferir os itens que o app acha que estão cheios é onde a divergência mais aparece — quem consome sem registrar deixa o app achando que tem mais do que tem. Vale avaliar oferecer "conferir os que estão cheios" como atalho, mas sem substituir o percurso por categoria, que é o que corresponde a andar pela despensa.
