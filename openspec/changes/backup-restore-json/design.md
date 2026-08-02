## Context

O MVP escolheu não ter backend (ADR-03). A troca foi consciente e barata em quase tudo — exceto em um ponto, que o próprio ADR nomeia como consequência negativa: **"Risco real: os dados vivem só no dispositivo. Perdeu o celular, perdeu o estoque."** A mitigação declarada ali é exportação e importação de backup em JSON, marcada como obrigatória.

ARQUITETURA §9 reforça o prazo: "item obrigatório da Fase 1, **antes de qualquer feature nova**".

Há um segundo motivo que torna isso urgente e não apenas prudente. Migrations são forward-only e não revertem no aparelho (DATABASE §9.2). O caminho de recuperação de uma migration ruim é backup e restauração — e enquanto ele não existir, toda alteração de schema roda sem rede.

Por isso esta change precede o resumo de valores, que é uma feature de leitura sobre dados existentes e pode esperar.

## Goals / Non-Goals

**Goals:**

- Backup completo, versionado, em formato que sobrevive a mudanças de schema.
- Restauração transacional e idempotente.
- Reconciliação obrigatória ao final da restauração.
- Um lugar visível no app onde isso mora.

**Non-Goals:**

- Backup automático em nuvem — exigiria backend, que é Fase 2.
- Backup automático agendado local: o arquivo ficaria no mesmo aparelho que se está tentando proteger. Sem valor real.
- Sincronização, mesclagem de dois aparelhos, resolução de conflito — Fase 2.
- Criptografia do arquivo de backup: os dados são nome de produto e preço de mercado; o PRD §4.4 declara que não há dado sensível além de nome. Criptografar adicionaria gestão de chave sem proteger nada relevante.

## Decisions

### D1 — JSON, não cópia do arquivo de banco

DATABASE §9.4 é explícito e o motivo é decisivo: **JSON sobrevive a mudanças de schema, arquivo binário não.** Um `.db` exportado hoje e restaurado depois de três migrations restauraria o schema antigo por cima do novo.

A cópia binária continua existindo, mas para outro propósito: o backup automático pré-migration (change de persistência), que é de curtíssima duração e para o mesmo schema. Os dois mecanismos coexistem e resolvem problemas diferentes.

### D2 — Combinação por identificador em vez de substituir tudo

Os identificadores são UUID v7 — globalmente únicos, gerados offline sem coordenação. Isso torna a combinação por identificador segura de um jeito que não seria com chaves sequenciais.

Consequência prática: restaurar um backup em um aparelho que já tem dados **mescla** em vez de destruir. Restaurar o mesmo backup duas vezes não duplica nada.

Alternativa considerada: apagar tudo e inserir. Rejeitada — perde os dados criados depois do backup, e transforma um erro de toque em perda irrecuperável.

Isso também deixa o caminho pronto para a Fase 2: a lógica de combinação por identificador é a base do que o sync vai fazer.

### D3 — Recusar backup de versão mais nova; aceitar e converter os mais antigos

Um backup gerado por uma versão futura do app pode conter campos que esta versão não entende — restaurá-lo perderia dados em silêncio. A mensagem exata já está definida em FRONTEND §11: *"O backup é de uma versão mais nova do app. Atualize antes de restaurar."*

O caminho inverso é suportado: backup antigo é convertido para o formato corrente antes de aplicar. Isso exige uma função de conversão por versão, que cresce uma entrada a cada migration que mude a forma dos dados.

### D4 — Reconciliação é obrigatória ao final da restauração, não opcional

DATABASE §6.6 define a consulta e diz onde rodá-la: após restaurar backup, e num botão de diagnóstico. Ela deve retornar zero linhas sempre; se retornar algo, há transação quebrada em algum caminho de escrita.

Depois de uma restauração é exatamente quando a divergência tem mais chance de existir — o arquivo pode ter sido gerado por uma versão com bug, ou editado à mão.

Correção de divergência grava um **movimento de ajuste**, nunca altera a quantidade em silêncio. Alterar em silêncio destruiria a propriedade que torna a reconciliação possível.

### D5 — Sem criptografia e sem senha no arquivo

Nome de produto, quantidade e preço de mercado. PRD §4.4: "Nenhum dado sensível além de nome e e-mail; sem dados de pagamento no MVP" — e no MVP local nem e-mail existe.

Adicionar senha ao backup criaria o modo de falha mais previsível de todos: a pessoa perde o celular, tem o backup, e esqueceu a senha.

### D6 — A validação do formato mora no domínio

`domain/backup/backup.schema.ts` define a forma esperada e a valida, retornando `Result`. O domínio é TypeScript puro — validar estrutura de dados é exatamente o tipo de regra que pertence a ele, e que precisa de teste sem emulador.

A leitura e escrita de arquivo ficam na infraestrutura. A separação importa: os casos de arquivo malformado, versão incompatível e campo ausente são testáveis sem tocar em sistema de arquivos.

### D7 — Exportação tabular é coisa diferente de backup, e a interface precisa dizer isso

PRD §4.4 pede exportação em CSV ou JSON a pedido do usuário — portabilidade de dados, não recuperação. O arquivo tabular tem valores convertidos para leitura humana e não é restaurável.

Oferecê-los sem distinção produziria a falha previsível: a pessoa exporta a planilha achando que fez backup. Os rótulos precisam separar "backup restaurável" de "exportar meus dados".

## Risks / Trade-offs

| Risco | Mitigação |
|---|---|
| Usuário nunca fazer backup e perder tudo | A tela informa quando foi o último e convida quando nunca houve; sem notificação ativa, que é v1.1 |
| Backup corrompido restaurado por cima de dados bons | Validação da estrutura antes de qualquer escrita, confirmação com resumo do conteúdo, e transação única |
| Arquivo de backup crescendo com o histórico de movimentos | Cerca de 7 mil movimentos por ano, texto — poucos megabytes em anos; DATABASE §10.1 já decidiu não purgar histórico agora |
| Conversão entre versões de schema acumulando complexidade | Uma função por versão, testada com um arquivo de exemplo de cada versão publicada |
| Reconciliação encontrando divergência e o usuário não saber o que fazer | A correção é oferecida como ação, calculada pela soma dos movimentos, e registra um ajuste |
| Restauração parcial por falha de memória com backup grande | Transação única; se o volume vier a ser um problema, processar em lotes dentro da mesma transação |
| Pessoa confundir exportação tabular com backup | Rótulos distintos e a exportação tabular explicitamente marcada como não restaurável |

## Migration Plan

Sem migration de schema. Esta change lê e escreve pelos repositórios existentes.

O que ela estabelece é operacional: a partir daqui, a política de "backup antes de aplicar migration" tem um segundo mecanismo — o usuário pode gerar um backup JSON antes de atualizar o app, e esse é o único que sobrevive a mudanças de schema.

## Open Questions

- **Versão de schema do backup versus versão de migration do Drizzle**: usar o mesmo número mantém tudo alinhado; usar um contador próprio permite mudar o formato do backup sem migration. Proposta: mesmo número, porque a forma do backup deriva do schema.
- **Lembrete de backup periódico**: seria eficaz, mas notificação é v1.1. Por ora, a data do último backup visível na tela de configurações é o que existe.
- **Reconciliação como diagnóstico manual**: DATABASE §6.6 sugere "um botão escondido de diagnóstico". Esta change o coloca nas configurações; a tela de diagnóstico mais completa pertence à change de ajuste e conferência.
