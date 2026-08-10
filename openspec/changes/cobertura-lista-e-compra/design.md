## Context

A auditoria F3 (`qa/achados/ACHADO-029` a `033`, `046`, `047`) mapeou sete pontos de `src/presentation/`, `src/application/lista/`, `src/application/resumo/` e `src/infrastructure/repositories/sqlite-compra.repository.ts` sem teste próprio, todos cobrindo comportamento já especificado nas capabilities `itens-avulsos`, `lista-derivada`, `custo-estimado`, `gasto-mensal` e `historico-de-compras`. Como em `cobertura-componentes-apresentacao`, esta change é puramente de teste — nenhum comportamento de produto muda.

## Goals / Non-Goals

**Goals:**
- Cobrir os sete achados com testes contra os cenários já existentes nos specs, incluindo os casos de borda nomeados em cada achado.
- Seguir a convenção de teste por camada do CLAUDE.md: `presentation/` com RTL, `application/` com repositório fake, `infrastructure/` com SQLite em memória.
- Fechar a lacuna específica de `agrupar-lista.ts` e `agruparListaPorCategoria`/`listaContinua`, hoje só exercitados indiretamente via `gerarTextoDaLista`.

**Non-Goals:**
- Não alterar nenhum comportamento de `sheet-avulso.tsx`, `agrupar-lista.ts`, `use-preferencia-agrupamento.ts`, `rodape-total.tsx`, `item-lista.tsx`, `gastoPorMes` ou `use-detalhe-compra.ts` — só adicionar prova.
- Não expandir para telas ainda não tocadas por esta lista de achados (`app/(tabs)/lista.tsx`, `app/compra/[id].tsx` continuam cobertos por outras changes de cobertura, se necessário).

## Decisions

**1. `gastoPorMes` (`ACHADO-046`) ganha teste de infraestrutura com SQLite em memória, não teste de aplicação com fake.**
`gastoPorMes` vive em `sqlite-compra.repository.ts` e depende diretamente da forma do SQL (`COUNT(*)` vs `COALESCE(SUM(...), 0)`); testar com repositório fake mascararia justamente o comportamento que o achado aponta como não comprovado. `use-gasto-mensal.test.ts` (camada de aplicação) recebe um teste complementar, mas o teste decisivo é o de infraestrutura.

**2. `use-detalhe-compra.test.ts` (`ACHADO-047`) estende o arquivo existente, sem duplicar o setup de fake já usado para itens comprados e avulsos.**
O arquivo já monta o cenário de compra com itens variados; adicionar um item `comprado: false` ao mesmo conjunto de dados é mais direto do que criar um teste isolado com novo setup.

**3. `agrupar-lista.test.ts` (`ACHADO-030`) é teste unitário puro, sem RTL.**
`agruparListaPorCategoria` e `listaContinua` são funções puras de formatação (`src/presentation/format/`); não precisam de `render()` nem de providers — mesmo padrão já usado para `normalizar-busca.ts` e outras funções de `format/`.

**4. Testes de `sheet-avulso.tsx` e `item-lista.tsx` dependem de `alvos-de-toque-e-acessibilidade` (Ordem 06) já estar aplicada.**
Essa change altera alvos de toque e rótulos de acessibilidade em componentes de lista/compra; escrever os testes antes fixaria comportamento prestes a mudar — mesma razão já registrada em `ORDER.md` para a dependência da change 10 em relação à 06.

## Risks / Trade-offs

- **[Risco] Teste de `gastoPorMes` com SQLite em memória exige popular compra, itens e produto para simular o cenário de total zero.** → Mitigação: reaproveitar os helpers de fixture já existentes em `sqlite-compra.repository.test.ts`, se houver, ou o padrão de setup usado em testes de infraestrutura irmãos (`sqlite-produto.repository.test.ts`).
- **[Risco] `agrupar-lista.test.ts` cobrir "Sem categoria" por último depende de a ordenação alfabética não colocar acidentalmente "Sem categoria" em outra posição por coincidência de dados de teste.** → Mitigação: usar categorias que alfabeticamente viriam depois de "Sem categoria" (ex.: "Zeladoria") como parte do caso de teste, para provar que a regra é por posição fixa, não por ordem alfabética coincidente.
