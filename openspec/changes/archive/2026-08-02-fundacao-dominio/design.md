## Context

`src/domain/` é a única camada que não pode errar em silêncio. Todo o resto do app é I/O e pintura — o domínio é onde mora a diferença entre o app dizer a verdade sobre a despensa e o app mentir sem lançar exceção nenhuma.

Três documentos convergem nisso: ARQUITETURA §7 põe a meta de 90% de cobertura aqui e lista os cinco casos que quebram silenciosamente; DATABASE §12 exige que os helpers de milésimos e centavos existam **antes de qualquer query**; FRONTEND §12.2 exige que o componente receba `{ estado, fracao, rotulo }` prontos, nunca calculados na tela.

Estado do repositório: `bootstrap-projeto-expo` já entregou o runner de teste em Node puro, o `Result<T,E>` e o gerador de UUID v7. Nada mais existe.

## Goals / Non-Goals

**Goals:**

- Todas as regras de cálculo do MVP escritas como funções puras nomeadas pelo que calculam.
- Cobertura ≥ 90% em `src/domain/`, com teste explícito para os cinco casos de falha silenciosa de ARQUITETURA §7.
- Uma única implementação de cada regra — nenhuma duplicada em SQL ou em componente.
- Zero import externo, verificado pelo script de fronteiras.

**Non-Goals:**

- Persistência, transação, repositório — o domínio não sabe que SQLite existe.
- Hooks, telas, componentes.
- Cálculos de sincronização por delta (Fase 2) — o domínio já produz movimentos com variação, o que é a base disso, mas nenhuma lógica de merge entra aqui.

## Decisions

### D1 — Funções puras nomeadas, não classes de entidade

`estadoDoItem(produto)`, `quantidadeAComprar(produto)`, `alturaDoNivel(produto)`. Não `class Produto { get estado() }`.

Rationale: o produto vem do banco como linha, vai para a tela como props, e é serializado no backup. Uma classe exigiria hidratação em cada uma dessas fronteiras e ganharia nada — não há invariante que precise ser protegida por encapsulamento, porque a regra de não-negativo é aplicada no momento do movimento, não no estado do objeto. ARQUITETURA §9 lista over-engineering como risco explícito com o limite "abstrair só persistência".

### D2 — Tipos nominais leves para milésimos e centavos

`type Milesimos = number & { readonly __marca: 'milesimos' }` e equivalente para `Centavos`. Custo zero em runtime, e o compilador passa a rejeitar `valorEmEstoque(quantidade, quantidade)`.

Alternativa considerada: `number` cru com convenção de nome de variável. Rejeitada — DATABASE §6.5 aponta a confusão de unidade (milésimos × centavos = centavos × 1000) como risco de impacto **Alto**, e é exatamente a classe de erro que um tipo nominal elimina de graça.

Alternativa considerada: classes wrapper (`new Dinheiro(1290)`). Rejeitada — aloca objeto em cada célula de uma lista de 300 itens e obriga desembrulhar em toda fronteira.

### D3 — Arredondamento vive em `quantidade.ts`, não em `estoque.rules.ts`

`quantidadeAComprar` chama `arredondarParaUnidade(valor, unidade)`. A separação importa porque o mesmo arredondamento é usado no modo compra (quantidade realmente comprada) e no ajuste manual — três chamadores, uma implementação.

### D4 — O clamp da fração é regra de domínio testada, não `Math.min` no estilo

FRONTEND §12.2 nomeia esse caso: produto com 5 de 2 tem fração bruta 2,5 e a tinta vazaria da linha. `alturaDoNivel` retorna a fração já limitada, mais um sinalizador de sobra — porque o design (§6) pede um traço fino de 1px marcando a sobra, o que exige distinguir "exatamente cheio" de "acima do necessário". Uma única função retorna as duas informações.

### D5 — Quantidade necessária zero retorna fração 0, não erro

`alturaDoNivel` é chamada em loop de renderização de lista. Lançar exceção ali derruba a tela inteira por causa de uma linha. A validação de cadastro já impede quantidade necessária zero de ser persistida (US-01); a função de exibição é defensiva por ser caminho de renderização, não por desconfiar do dado.

Isso é uma exceção consciente à regra do repositório de "não tratar cenário que não pode acontecer": aqui o cenário **pode** acontecer com dado legado ou backup corrompido, e o custo de falhar é a tela toda.

### D6 — Baixa em item já zerado não gera movimento

`aplicarMovimento` sobre saldo 0 com uma baixa retorna um resultado que indica "nada a gravar". Alternativa seria gravar um movimento de variação 0 — impossível, porque o `CHECK` do banco rejeita variação zero (DATABASE §4), e porque um movimento que não moveu nada polui a trilha de auditoria e a reconciliação.

A interface trata isso como o toast "Estoque zerado" de US-02, sem erro.

### D7 — Rótulo em português de interface dentro do domínio

`rotuloDoItem` retorna "Acabou" / "Falta 1" / "Cheio" — texto de UI produzido no domínio. Isso parece violar a separação de camadas, e é deliberado: FRONTEND §3.4 estabelece que o rótulo textual é um dos **três canais redundantes** que comunicam o estado, e §12.2 exige que o componente receba `rotulo` pronto. Deixar a formatação na apresentação abriria a porta para dois componentes rotularem o mesmo estado de forma diferente.

Trade-off aceito: internacionalização futura precisaria de uma camada de tradução. O PRD não prevê outro idioma, e o vocabulário de FRONTEND §11 é parte do produto, não decoração.

### D8 — Nenhuma dependência de data no domínio puro

Onde a hora é necessária (criação de movimento, de compra), ela entra como parâmetro, via a interface `Clock` declarada em `ports/`. O domínio nunca chama `Date.now()`. É o que torna o teste determinístico sem mock global.

## Risks / Trade-offs

| Risco | Mitigação |
|---|---|
| Arredondamento aplicado duas vezes (uma no cálculo da lista, outra na compra) inflando a quantidade | `quantidadeAComprar` retorna valor já arredondado e o modo compra usa esse valor como planejado, sem rearredondar; teste explícito verificando idempotência do arredondamento |
| Tipo nominal atrapalhando ergonomia e sendo contornado com `as` | Construtores explícitos (`milesimos(1500)`, `centavos(1290)`) e regra de lint proibindo asserção de tipo para esses aliases |
| Regra de arredondamento replicada em SQL por conveniência de query | DATABASE §6.2 já estabelece que o SQL entrega valor bruto; a change de persistência tem tarefa de revisão para isso |
| Cobertura de 90% sendo atingida com testes triviais que não cobrem os casos sutis | Os cinco casos de ARQUITETURA §7 são tarefas nomeadas individualmente em `tasks.md`, não subsumidos em "escrever testes" |
| Rótulo "Falta 1" em unidade divisível ficando estranho ("Falta 0,5") | Tarefa de teste específica cobrindo unidade divisível; o rótulo usa a mesma formatação de exibição do resto do app |

## Migration Plan

Não aplicável — nenhum dado, nenhum consumidor anterior. O domínio é código novo sem chamadores até a change de persistência.

## Open Questions

- **Reposição no fechamento da compra**: o PRD (Apêndice, item 3) deixa em aberto se a reposição é `atual += comprado` ou "voltar ao nível necessário". Esta change implementa `atual += comprado`, que é o que ARQUITETURA §5.3 e DATABASE §6.4 assumem. Se a decisão mudar, muda uma função em `compra.rules.ts` — por isso ela está isolada.
- **Rótulo de sobra**: FRONTEND §6 pede um traço de 1px para item acima do necessário, "sem número, sem badge". O domínio expõe o sinalizador; se a interface um dia quiser um rótulo textual da sobra, ele nasce aqui.
