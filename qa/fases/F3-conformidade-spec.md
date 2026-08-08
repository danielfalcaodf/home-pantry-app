---
fase: F3
titulo: Conformidade com specs OpenSpec
estado: em andamento
---

## Objetivo

Para cada uma das 13 PRs, mapear cada `#### Scenario:` do(s) spec(s) OpenSpec da change correspondente para o teste automatizado (ou evidência de configuração) que o cobre, ou marcar como lacuna ("descoberto"). Agregado por PR em `qa/por-pr/PR-NN.md`, seção `## F3`.

**Nota metodológica**: o subagent `qa-expert` (definido em `.claude/agents/qa-expert.md`) não estava disponível como `subagent_type` no ambiente desta sessão (`Agent` tool listou apenas `claude, claude-code-guide, Explore, general-purpose, Plan, statusline-setup`). A auditoria da PR-01 foi conduzida diretamente, seguindo a mesma metodologia descrita no agente (mapear cenário → teste, sempre read-only). Repetir esta tentativa nas próximas PRs; se o agente continuar indisponível, manter o mesmo processo manual.

## Resultado agregado

| PR | Change | Capabilities | Cenários cobertos | Cenários descobertos | Estado |
|---|---|---|---|---|---|
| 1 | `bootstrap-projeto-expo` | `fronteiras-de-camada`, `primitivos-compartilhados`, `projeto-base` | 18/24 | 6/24 (ACHADO-008, ACHADO-009, +1 bloqueado por F4) | concluída |
| 2 | `fundacao-dominio` | `regras-de-compra`, `regras-de-estoque`, `regras-de-movimento`, `unidades-e-valores` | 71/72 | 1/72 (ACHADO-010) | concluída |
| 3 | `persistencia-sqlite` | `banco-local`, `dados-iniciais`, `repositorios` | ~50/55 | 5/55 (ACHADO-011 a 014, + ACHADO-004 já rastreado) | concluída |
| 4 | `design-system-tema` | `banco-local` (delta), `componentes-base`, `tema-e-tokens`, `tipografia-carregada` | ~26/40 | 14/40 (ACHADO-015 a 021, + itens dependentes de F4/F6) | concluída |
| 5 | `despensa-e-cadastro-produto` | `adocao-da-lista-base`, `cadastro-de-produto`, `medidor-linha-dagua`, `tela-despensa` | forte na lógica/hooks; fraca nos componentes de tela | ~12 lacunas (ACHADO-022 a 025 + itens dependentes de F4/F6) | concluída |
| 6 | `dar-baixa-caminho-critico` | `registro-de-consumo`, `desfazer-registro`, `movimento-do-gesto`, `medidor-linha-dagua` (delta) | forte no caminho de dados; nenhuma coreografia visual testada | 3 achados novos (026-028) + reaproveita ACHADO-016/019 (PR-04) | concluída |
| 7-13 | — | — | — | — | pendente |

## Detalhe — PR-01 (`bootstrap-projeto-expo`)

Ver `qa/por-pr/PR-01.md` seção `## F3` para a matriz completa capability × cenário × teste.

Resumo por capability:
- **`fronteiras-de-camada`**: regras de lint (boundaries, no-restricted-imports, no-restricted-syntax de hex) todas configuradas e o script `verificar:fronteiras` confirmado com exit 0, mas nenhuma tem teste automatizado que force a violação e confirme a rejeição — cobertura é de configuração estática, não de teste. Lacuna adicional: "apresentação usa do domínio apenas tipos e formatadores" não tem nenhuma verificação, nem estática nem de teste.
- **`primitivos-compartilhados`**: `Result<T,E>` e `gerarId()` (UUID v7) bem cobertos em runtime (`src/shared/result.test.ts`, `src/shared/id.test.ts`). Duas lacunas: nenhum teste de tipo (`@ts-expect-error`) para a discriminação obrigatória do `Result`, e nenhum teste explícito para "geração sem coordenação externa" (ausência de chamada de rede).
- **`projeto-base`**: estrutura de diretórios, TypeScript estrito, EAS profiles, separação de projetos Jest (domain/infra/app) e documentação — todos confirmados por inspeção direta de config/estrutura. Único cenário sem cobertura é "app inicia no development build", que depende de F4 (bloqueada por falta de development build instalado) — não é achado novo, é a mesma bloqueante já rastreada no plano.

## Detalhe — PR-02 (`fundacao-dominio`)

Ver `qa/por-pr/PR-02.md` seção `## F3` para a matriz completa (72 cenários, 4 capabilities de domínio puro). Cobertura quase total via os arquivos de teste já existentes na PR-02 (`compra.rules.test.ts`, `estoque.rules.test.ts`, `validacao.test.ts`, `categoria.test.ts`, `movimento.rules.test.ts`, `quantidade.test.ts`, `unidade.test.ts`, `dinheiro.test.ts`). Única lacuna: o cenário "conjunto fechado de unidades" (compilador rejeita valor fora das 7 unidades) não tem teste de tipo — mesma classe de lacuna do ACHADO-009 (PR-01).

## Detalhe — PR-03 (`persistencia-sqlite`)

Ver `qa/por-pr/PR-03.md` seção `## F3` para a matriz completa (~55 cenários, 3 capabilities). Achado notável: o cenário "aplicação a partir de versão intermediária" era N/A quando a PR-03 foi testada em F2 (só existia a migration `0000_init`), mas hoje há 4 migrations e o cenário ficou testável sem cobertura (ACHADO-013) — exemplo de lacuna que só aparece observando o estado atual do repositório, não o estado da PR isolada. Também sinalizada uma possível divergência de spec (não confirmada, ACHADO-014): `listarDespensa` usa `.select()` sem nomear colunas, ao contrário do padrão do resto do arquivo.

## Detalhe — PR-04 (`design-system-tema`)

Ver `qa/por-pr/PR-04.md` seção `## F3` para a matriz completa (~40 cenários, 4 capabilities incluindo um delta de `banco-local` para a tabela de configuração). Achado de maior atenção: **ACHADO-017**, `ChipEstado` com `ativo=true` usa `tema.bg.raised` (cor neutra) em vez da cor do estado com opacidade reduzida exigida pelo spec — pode ser uma divergência de implementação real, não só lacuna de teste. Também confirmado por comentário no próprio código (**ACHADO-021**): o orçamento de fontes embarcadas está em 696KB, acima do limiar de 400KB citado no spec, mesmo após a remoção da família de display. Vários cenários desta PR dependem de F4/F6 (splash sem flash, escala 200%) e foram marcados como "descoberto (dependente de F4/F6)" sem achado próprio, por já estarem cobertos pela bloqueante conhecida do plano.

## Achados produzidos nesta fase

- [[ACHADO-008]] — regras de lint de fronteira (boundaries/hex/import proibido) sem teste automatizado que force a violação, origem PR 1. **Aberto.**
- [[ACHADO-009]] — `Result<T,E>` sem teste de tipo para a discriminação obrigatória exigida pelo spec, origem PR 1. **Aberto.**
- [[ACHADO-010]] — `Unidade` sem teste de tipo para o conjunto fechado exigido pelo spec, origem PR 2 (mesma classe do ACHADO-009). **Aberto.**
- [[ACHADO-011]] — conexão de banco (WAL, singleton, escuta de mudanças) sem teste dedicado, origem PR 3. **Aberto.**
- [[ACHADO-012]] — fluxo de preparação do banco (`_layout.tsx`) sem teste de sucesso/falha de migration, origem PR 3. **Aberto.**
- [[ACHADO-013]] — "aplicação a partir de versão intermediária" agora testável e ainda sem teste, origem PR 3. **Aberto.**
- [[ACHADO-014]] — possível divergência de "colunas explícitas" em `listarDespensa`, origem PR 3 — revisão humana recomendada antes de virar change. **Aberto.**
- [[ACHADO-015]] — testes de tipo ausentes para papel inválido (Texto) e tema tipado, origem PR 4 (mesma classe do ACHADO-009/010). **Aberto.**
- [[ACHADO-016]] — `toast.tsx` sem nenhum teste, origem PR 4 (já anunciado como pendente na própria PR-04.md). **Aberto.**
- [[ACHADO-017]] — `ChipEstado` ativo usa cor neutra em vez da cor do estado com opacidade reduzida, origem PR 4 — possível divergência de implementação. **Aberto.**
- [[ACHADO-018]] — `usePreferenciaDeTemaPersistida` sem teste apesar de repositório injetável, origem PR 4. **Aberto.**
- [[ACHADO-019]] — comportamento de `reduceMotion` sem teste, origem PR 4. **Aberto.**
- [[ACHADO-020]] — escala de espaçamento sem lint rule de enforcement, origem PR 4. **Aberto.**
- [[ACHADO-021]] — orçamento de bundle de fontes (696KB > 400KB) sem medição automatizada, origem PR 4. **Aberto.**
- [[ACHADO-022]] — `formulario-produto.tsx` sem nenhum teste (campos recolhidos, sugestões de categoria), origem PR 5. **Aberto.**
- [[ACHADO-023]] — `normalizar-busca.ts` (normalização de acento) sem teste unitário, origem PR 5. **Aberto.**
- [[ACHADO-024]] — ação "ver item existente" no fluxo de duplicidade sem teste, origem PR 5. **Aberto.**
- [[ACHADO-025]] — ausência de checagem "sem card/borda/sombra" no teste de conformidade da linha da despensa, origem PR 5. **Aberto.**
- [[ACHADO-026]] — coreografia do gesto (`Haptics.impactAsync`, timing) sem teste de orquestração, origem PR 6. **Aberto.**
- [[ACHADO-027]] — `TecladoQuantidade`: caminho "Repus" sem teste positivo, origem PR 6. **Aberto.**
- [[ACHADO-028]] — prop `animar` de `medidor-nivel.tsx` (animação condicional por item) sem teste, origem PR 6. **Aberto.**

## Detalhe — PR-06 (`dar-baixa-caminho-critico`)

Ver `qa/por-pr/PR-06.md` seção `## F3` para a matriz completa (~50 cenários, 4 capabilities incluindo delta de `medidor-linha-dagua`). **Correção a uma nota da própria PR-06.md**: a F2 tratou "janela de desfazer de 10s" como sinônimo do KPI K4 e descartou como "dependente de F6" — são coisas diferentes. A janela de 10s é um timer de UI (`JANELA_DESFAZER` em `toast-desfazer.tsx`, testável em Jest) que herda a lacuna já registrada em ACHADO-016 (`toast.tsx` sem teste, PR-04); o KPI K4 (tempo de tarefa do usuário) é que de fato depende de medição em F6. Padrão desta PR: caminho de dados (registrar, desfazer, atomicidade) muito bem coberto, mas **nenhuma** parte da coreografia visual/animação (haptics, mola, animação condicional por item) tem teste em toda a cadeia até aqui — confirma e amplia o padrão já visto no ACHADO-019 (PR-04).

## Detalhe — PR-05 (`despensa-e-cadastro-produto`)

Ver `qa/por-pr/PR-05.md` seção `## F3` para a matriz completa (~60 cenários, 4 capabilities). Esta rodada resolve a pendência que a própria PR-05.md tinha deixado aberta na F2 ("ordenação/filtro/busca/duplicidade/remoção lógica — a confirmar na F3"): todos esses cenários **estão** cobertos, só que em arquivos de teste de outras PRs já auditadas (repositório SQLite na PR-03, formatadores/hooks nesta PR). Padrão observado: a cobertura é forte na camada de lógica (hooks, domínio, formatadores puros) e fraca nos componentes de tela — nenhuma tela em `app/` tem teste, e `formulario-produto.tsx` (componente, não tela) também não tem.

## Critério de saída

- [ ] 13 arquivos `qa/por-pr/PR-01.md` … `PR-13.md` com seção `## F3` preenchida.
- [ ] Matriz consolidada acima com as 13 linhas.
- [ ] Achados de lacuna registrados e ancorados na PR/change de origem.

**F3 em andamento — 6/13 PRs auditadas.**
