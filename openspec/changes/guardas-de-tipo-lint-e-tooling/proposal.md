## Why

**Type:** Bug Fix

O "bug" aqui é a lacuna de guardas de conformidade apontada pela auditoria de QA — não um comportamento errado hoje, mas garantias arquiteturais que dependem só de disciplina humana (code review) em vez de um mecanismo executável que falha quando alguém desvia: regras ESLint de fronteira sem teste que force a violação, tipos fechados (`Result<T,E>`, `Unidade`, papel do `Texto`, `Theme`) sem prova de rejeição em tempo de compilação, escala de espaçamento sem enforcement, e o orçamento de fonte já estourado (696KB vs. 400KB citado no spec) sem medição automatizada. A "correção" desta change é escrever os testes/guardas que fecham essa lacuna — provando, de forma executável, que cada regra dispara quando deveria — e decidir os dois pontos de tooling que exigem uma escolha humana antes: gerenciador de pacotes (npm vs. pnpm) e o limiar de peso de fonte aceito.

Nenhuma task desta change altera comportamento do app em produção; o único código de produto potencialmente tocado é a extração de uma regra de lint customizada (espaçamento) ou um teste de conformidade equivalente, e a limpeza de artefatos de tooling untracked.

**Dependencies between changes:** nenhuma. `ORDER.md` a lista sem depender de nenhuma outra change ativa — não toca código de produto de nenhuma feature, só fronteiras, primitivos compartilhados, tema/tipografia e tooling de build, então pode ser aplicada a qualquer momento em relação às demais.

## What Changes

- Decidir entre `npm` e `pnpm` como gerenciador de pacotes único do projeto; como todo o `CLAUDE.md` e os scripts de `package.json` já documentam o fluxo `npm`, remover os artefatos `pnpm-lock.yaml` e `pnpm-workspace.yaml` (hoje untracked) e adicioná-los ao `.gitignore` para não reaparecerem por engano (ACHADO-003).
- Adicionar teste Jest que roda o ESLint programaticamente (`ESLint.lintText`) sobre fixtures inline que violam cada regra de fronteira — import proibido em `src/domain/`, `application/` importando `infrastructure/`, `presentation/`/`app/` acessando o cliente de banco, e hex literal em componente — confirmando que cada uma produz erro (ACHADO-008).
- Adicionar testes de tipo com `@ts-expect-error`, validados por `tsc --noEmit`, para: `Result<T,E>` (acesso a `.valor`/`.erro` sem discriminar por `.ok`), `Unidade` (string fora do conjunto fechado), papel do componente `Texto` (papel fora da escala tipográfica), e `Theme` (token inexistente) (ACHADO-009, 010, 015).
- Adicionar enforcement da escala de espaçamento fechada (4, 8, 12, 16, 24, 32, 48): avaliar regra de lint customizada vs. teste de conformidade por grep sobre `src/presentation/components/`, e implementar a opção mais barata de manter (ACHADO-020).
- Decidir o limiar aceito de peso de fontes embarcadas (hoje 696KB, acima dos 400KB citados no spec) e adicionar script/teste que mede o peso real dos arquivos de fonte resolvidos e falha acima do limiar acordado, substituindo o comentário manual em `fontes.ts:9` (ACHADO-021).

## Capabilities

### New Capabilities
(nenhuma)

### Modified Capabilities
- `fronteiras-de-camada`: adiciona o requisito de que as regras de lint de fronteira sejam comprovadas por teste executável, não apenas configuradas.
- `primitivos-compartilhados`: esclarece o cenário de discriminação obrigatória de `Result<T,E>`, exigindo prova por teste de tipo.
- `unidades-e-valores`: esclarece o cenário de conjunto fechado de `Unidade`, exigindo prova por teste de tipo.
- `componentes-base`: esclarece o cenário de papel inválido do componente `Texto`, exigindo prova por teste de tipo.
- `tema-e-tokens`: esclarece o cenário de token tipado (`Theme`) exigindo prova por teste de tipo, e adiciona enforcement executável da escala de espaçamento.
- `tipografia-carregada`: adiciona medição automatizada do orçamento de bundle de fontes, com limiar acordado e decisão registrada.
- `projeto-base`: adiciona o requisito de gerenciador de pacotes único, sem artefatos de um segundo gerenciador coexistindo no repositório.

## Impact

- `pnpm-lock.yaml`, `pnpm-workspace.yaml` — removidos; `.gitignore` atualizado.
- Novo arquivo de teste de fronteiras ESLint (ex. `eslint.config.test.ts` ou local equivalente em `scripts/`).
- Novo arquivo de testes de tipo (ex. `src/shared/tipos.test-d.ts` ou equivalente), cobrindo `Result`, `Unidade`, `Texto`, `Theme`.
- `eslint.config.js` — possível regra nova de espaçamento (se essa for a decisão) ou nenhum, se a decisão for teste de conformidade.
- `src/presentation/theme/fontes.ts` — comentário manual substituído por medição automatizada; novo script/teste de orçamento de bundle.
- Nenhum impacto em `src/domain/`, `src/infrastructure/db/`, schema ou migrations.
