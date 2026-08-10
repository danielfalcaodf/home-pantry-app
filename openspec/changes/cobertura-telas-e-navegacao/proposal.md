**Type:** Bug Fix

## Why

Sete achados de QA (F3, `qa/achados/ACHADO-041.md`, `042`, `045`, `048`, `049`, `051`, `052`) apontam telas e composições de navegação sem nenhum teste automatizado próprio: `app/produto/[id].tsx`, `app/conferencia.tsx`, `app/diagnostico.tsx`, `app/produto/[id]/historico.tsx`, `app/(tabs)/resumo.tsx`, `app/compra/historico.tsx`, `app/compra/historico/[id].tsx`, os dois `_layout.tsx` de navegação, o `BotaoVoltar` em sete telas e o `app/compra/[id].tsx`. A lógica subjacente (hooks de `application/`, regras de `domain/`) já está bem coberta — o que falta é a verificação do comportamento **composto** na tela: qual gesto abre qual sheet, qual botão navega para qual destino específico, o texto exato de um estado vazio, a cor de um ícone ativo. Sem esses testes, uma regressão de composição (ex.: um `router.push` errado, um `headerShown` removido, uma prop de navegação trocada) só seria pega manualmente ou não seria pega. Duas peças de comportamento (a posição do `RodapeCompra` e o corte para os últimos 4 meses no mini gráfico do Resumo, ACHADO-052) nunca foram formalizadas em spec — só descritas em `proposal.md`/`design.md` de uma change já arquivada — e precisam virar requisito testável antes de ganhar teste.

## What Changes

- Adicionar teste de composição para `app/produto/[id].tsx`: toque na quantidade abre o sheet de ajuste; `quantidadeAtualEditavel={false}` bloqueia edição direta (ACHADO-041).
- Adicionar teste de composição para `app/conferencia.tsx`, `app/diagnostico.tsx` e `app/produto/[id]/historico.tsx`: progresso "N de M", confirmar em um toque, ausência de diálogo na correção, mensagens afirmativa/acionável do diagnóstico, distinção visual de tipo de movimento (ACHADO-042).
- Adicionar teste de composição para `app/(tabs)/resumo.tsx`, `app/compra/historico.tsx` e `app/compra/historico/[id].tsx`: estado vazio do gasto mensal, distinção de compra cancelada, aviso de valor parcial, navegação a partir de uma contagem de estado (ACHADO-045).
- Adicionar teste leve para `app/_layout.tsx` e `app/(tabs)/_layout.tsx`: `headerShown: false` ativo, e asserção de estilo (`minWidth`/`minHeight`) no `botao-voltar.test.tsx` (ACHADO-048).
- Adicionar teste de destino de navegação do `BotaoVoltar` nas sete telas que o usam, com mock de `router` por tela, confirmando o destino específico exigido por cada cenário já presente em `openspec/specs/chrome-de-navegacao/spec.md` (ACHADO-049).
- Adicionar teste de integração da tab bar (`app/(tabs)/_layout.tsx`): os 4 ícones presentes, cor `action.azulejo` na aba ativa e `text.secondary` nas inativas (ACHADO-051).
- Formalizar em spec e cobrir com teste de integração: a posição do `RodapeCompra` logo acima do botão "Fechar compra" em `app/compra/[id].tsx`, e o corte para os últimos 4 meses (ordem cronológica ascendente) alimentando o `GraficoBarras` em `app/(tabs)/resumo.tsx` (ACHADO-052).

Todos os testes novos verificam o comportamento **já corrigido** pelas changes anteriores (autofoco do detalhe do produto, botão de voltar da conferência, alvos de toque e acessibilidade, backup/diagnóstico) — nenhuma correção de comportamento é feita aqui além da formalização do ACHADO-052.

## Capabilities

### New Capabilities
(nenhuma)

### Modified Capabilities
- `resumo-de-valores`: novo requisito formalizando o mini gráfico de gasto mensal do Resumo — exatamente os últimos 4 meses, em ordem cronológica ascendente, alimentados por `gastoMensal.meses`.
- `modo-compra`: o requisito de rodapé de acompanhamento passa a exigir que o `RodapeCompra` apareça imediatamente acima do botão "Fechar compra".

As demais telas cobertas por esta change (`produto/[id]`, `conferencia`, `diagnostico`, `historico do produto`, `historico de compras`, chrome de navegação) já têm o comportamento definido em specs existentes (`cadastro-de-produto`, `modo-conferencia`, `diagnostico-de-integridade`, `historico-do-produto`, `historico-de-compras`, `chrome-de-navegacao`) — esta change fecha a lacuna de teste automatizado contra esses requisitos já publicados, sem alterar seu texto.

## Impact

- Novos arquivos de teste: `app/produto/__tests__` (ou convenção equivalente do repositório) para `produto/[id].tsx`, `conferencia.tsx`, `diagnostico.tsx`, `produto/[id]/historico.tsx`, `resumo.tsx`, `compra/historico.tsx`, `compra/historico/[id].tsx`, `_layout.tsx`, `(tabs)/_layout.tsx`.
- `src/presentation/components/botao-voltar.test.tsx`: nova asserção de estilo.
- `app/(tabs)/resumo.tsx`, `app/compra/[id].tsx`: nenhuma mudança de código esperada — o comportamento já existe; só ganha teste. Caso a formalização do ACHADO-052 revele uma divergência entre o texto do spec novo e o código atual, a correção mínima necessária entra no mesmo commit do teste que a descobriu.
- Nenhuma mudança em `src/domain/`, `src/infrastructure/` ou schema.

## Dependencies between changes

Depende de `correcao-autofoco-detalhe-produto` (Ordem 02), `botao-voltar-conferencia` (Ordem 03), `alvos-de-toque-e-acessibilidade` (Ordem 06) e `configuracoes-e-backup` (Ordem 07) — ver `openspec/changes/ORDER.md`, Ordem 11. Os testes novos precisam asserir o comportamento **pós-correção** dessas quatro changes (destino de navegação, alvo de toque, rótulo de acessibilidade, vocabulário, link de diagnóstico pós-restauração); escrever os testes antes delas estaria fixando o comportamento errado.
