## Why

O app vai errar. Alguém da casa consome sem registrar, um item vence e vai fora, uma contagem estava errada desde o cadastro. Sem um caminho de correção, o usuário perde a confiança nos números — e quando isso acontece ele para de usar, que é o mesmo desfecho do risco crítico do PRD.

Isso é agravado pela decisão de não ter backend. ARQUITETURA §1.1 é explícito: **K2 (precisão ≥ 85%) fica em risco se a outra pessoa da casa consumir sem registrar**, e nomeia a mitigação — *"tela de conferência de estoque semanal para recalibrar"*. Não é uma feature secundária: é o que compensa a ausência de US-08 no MVP.

Esta change também expõe a **reconciliação** como diagnóstico completo, fechando o ciclo de salvaguardas da desnormalização de `quantidade_atual` (DATABASE §3.3).

## What Changes

- Implementa o **ajuste manual de quantidade** com motivo opcional (perda, vencimento, correção), gravando um movimento do tipo ajuste — nunca um `UPDATE` solto.
- Torna a quantidade atual editável na tela de detalhe do produto, pelo caminho de ajuste.
- Implementa o **modo conferência**: percorre os itens de uma categoria, um a um, para revisão rápida, confirmando ou corrigindo cada quantidade.
- Implementa a **tela de diagnóstico** com a consulta de reconciliação, mostrando divergências e oferecendo correção.
- Implementa o **histórico do produto**: a lista de movimentos com tipo, quantidade, data e motivo.
- Implementa `use-ajustar-estoque` e `use-conferencia`.

## Capabilities

### New Capabilities

- `ajuste-de-estoque`: correção manual da quantidade com motivo, sempre gravando movimento de ajuste.
- `modo-conferencia`: o percurso guiado por categoria para recalibrar o estoque em bloco.
- `diagnostico-de-integridade`: a reconciliação exposta em tela, com detecção e correção de divergência.
- `historico-do-produto`: a leitura da trilha de movimentos de um produto.

### Modified Capabilities

- `cadastro-de-produto`: a quantidade atual deixa de ser somente leitura no detalhe e passa a ser editável pelo caminho de ajuste.

## Impact

- **Cria**: `app/conferencia.tsx`, `app/diagnostico.tsx`, `app/produto/[id]/historico.tsx`, `src/application/estoque/{use-ajustar-estoque,use-conferencia}.ts`.
- **Modifica**: `app/produto/[id].tsx` (quantidade editável), `app/configuracoes.tsx` (acesso ao diagnóstico).
- **Depende de**: `dar-baixa-caminho-critico` (regras de movimento), `backup-restore-json` (a reconciliação já existe como consulta), `despensa-e-cadastro-produto`.
- **Bloqueia**: nada.
- **Semântica**: ajuste é distinto de consumo e de reposição. Misturar os três destruiria a análise de consumo futura — "reposição" passaria a incluir "o app estava errado".
