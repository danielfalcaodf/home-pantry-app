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
| 7 | `lista-de-compras` | `lista-derivada`, `itens-avulsos`, `custo-estimado`, `exportacao-em-texto` | ~20/26 | 6/26 (ACHADO-029 a 033, mais telas finas sem teste) | concluída |
| 8 | `modo-compra-e-fechamento` | `atualizacao-de-preco-referencia`, `fechamento-de-compra`, `lista-derivada`, `modo-compra` | ~30/45 | 15/45 (ACHADO-034 a 037, mais tela `app/compra/[id].tsx` sem teste) | concluída |
| 9 | `backup-restore-json` | `exportacao-de-backup`, `restauracao-de-backup`, `tela-de-configuracoes` | ~25/35 | 10/35 (ACHADO-038 a 040, mais tela `configuracoes.tsx` sem teste) | concluída |
| 10 | `ajuste-e-conferencia-estoque` | `ajuste-de-estoque`, `cadastro-de-produto` (delta), `diagnostico-de-integridade`, `historico-do-produto`, `modo-conferencia` | ~28/45 | 17/45 (ACHADO-041 a 044, mais telas sem teste) | concluída |
| 11-13 | — | — | — | — | pendente |

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
- [[ACHADO-029]] — `SheetAvulso` sem teste; validação de nome obrigatório do avulso nunca exercitada, origem PR 7. **Aberto.**
- [[ACHADO-030]] — `agrupar-lista.ts` (visão agrupada/contínua da lista de compras) sem teste, origem PR 7. **Aberto.**
- [[ACHADO-031]] — `use-preferencia-agrupamento.ts` sem teste, origem PR 7. **Aberto.**
- [[ACHADO-032]] — `rodape-total.tsx` (rótulo, contagem e total da lista) sem teste, origem PR 7. **Aberto.**
- [[ACHADO-033]] — `item-lista.tsx` (distinção visual avulso/produto) sem teste, origem PR 7. **Aberto.**

## Detalhe — PR-06 (`dar-baixa-caminho-critico`)

Ver `qa/por-pr/PR-06.md` seção `## F3` para a matriz completa (~50 cenários, 4 capabilities incluindo delta de `medidor-linha-dagua`). **Correção a uma nota da própria PR-06.md**: a F2 tratou "janela de desfazer de 10s" como sinônimo do KPI K4 e descartou como "dependente de F6" — são coisas diferentes. A janela de 10s é um timer de UI (`JANELA_DESFAZER` em `toast-desfazer.tsx`, testável em Jest) que herda a lacuna já registrada em ACHADO-016 (`toast.tsx` sem teste, PR-04); o KPI K4 (tempo de tarefa do usuário) é que de fato depende de medição em F6. Padrão desta PR: caminho de dados (registrar, desfazer, atomicidade) muito bem coberto, mas **nenhuma** parte da coreografia visual/animação (haptics, mola, animação condicional por item) tem teste em toda a cadeia até aqui — confirma e amplia o padrão já visto no ACHADO-019 (PR-04).

## Detalhe — PR-05 (`despensa-e-cadastro-produto`)

Ver `qa/por-pr/PR-05.md` seção `## F3` para a matriz completa (~60 cenários, 4 capabilities). Esta rodada resolve a pendência que a própria PR-05.md tinha deixado aberta na F2 ("ordenação/filtro/busca/duplicidade/remoção lógica — a confirmar na F3"): todos esses cenários **estão** cobertos, só que em arquivos de teste de outras PRs já auditadas (repositório SQLite na PR-03, formatadores/hooks nesta PR). Padrão observado: a cobertura é forte na camada de lógica (hooks, domínio, formatadores puros) e fraca nos componentes de tela — nenhuma tela em `app/` tem teste, e `formulario-produto.tsx` (componente, não tela) também não tem.

## Detalhe — PR-07 (`lista-de-compras`)

Ver `qa/por-pr/PR-07.md` seção `## F3` para a matriz completa (26 cenários, 4 capabilities). Mesmo padrão das PRs 5 e 6 se repete e se aprofunda: a lógica pura (`lista.rules.ts`, geração de texto) e os hooks de aplicação (`use-lista-compras`, `use-adicionar-avulso`, `use-editar-avulso`, `use-remover-item-lista`) estão bem cobertos, mas **todo** componente de apresentação novo desta PR está sem teste — `SheetAvulso` (inclui a única validação de nome obrigatório do sistema, ACHADO-029), `agrupar-lista.ts` (ACHADO-030), `use-preferencia-agrupamento.ts` (ACHADO-031), `rodape-total.tsx` (ACHADO-032) e `item-lista.tsx` (ACHADO-033). Cenário "Sem tabela de lista" confirmado por inspeção do schema (nenhuma `sqliteTable` de lista), sem necessidade de teste dedicado. `app/(tabs)/lista.tsx` (tela) não tem teste próprio — consistente com o padrão já observado na PR-05, não é achado novo.

## Detalhe — PR-08 (`modo-compra-e-fechamento`)

Ver `qa/por-pr/PR-08.md` seção `## F3` para a matriz completa (~45 cenários, 4 capabilities). Diferente das PRs anteriores, esta rodada identificou não só lacunas de teste mas uma **divergência de implementação real** (ACHADO-034): o spec exige que o app avise o usuário "ao acionar voltar durante uma compra com itens marcados", mas a implementação (`app/compra/[id].tsx:96-98` + `botao-voltar.tsx:13`) mostra um texto estático sempre visível, sem interceptar o gesto de voltar nem condicionar o aviso a haver marcação — o `BotaoVoltar` chama `router.back()` direto, sem checagem. Padrão já visto nas PRs 5-7 se repete e se concentra numa única tela desta vez: `app/compra/[id].tsx` não tem nenhum teste próprio (ACHADO-035), o que deixa sem cobertura direta a ausência de subtelas, o `useKeepAwake`, a atualização do rodapé e a mensagem de fechamento em linguagem do usuário — mesmo com os hooks subjacentes bem testados isoladamente. Também identificadas lacunas menores em asserção de estilo (ACHADO-037) e em campos individuais do movimento de estoque gravado pelo fechamento (ACHADO-036).

## Achados produzidos nesta fase (continuação)

- [[ACHADO-034]] — aviso de saída com compra marcada é texto estático, não responde ao botão voltar nem checa itens marcados; possível divergência real de implementação, origem PR 8. **Aberto.**
- [[ACHADO-035]] — `app/compra/[id].tsx` (tela do modo compra) sem nenhum teste, origem PR 8. **Aberto.**
- [[ACHADO-036]] — campos individuais do movimento de estoque do fechamento (autor/data/variação/resultado) sem teste, origem PR 8. **Aberto.**
- [[ACHADO-037]] — estilo do item marcado e geometria do controle de marcação sem asserção de teste, origem PR 8. **Aberto.**

## Detalhe — PR-09 (`backup-restore-json`)

Ver `qa/por-pr/PR-09.md` seção `## F3` para a matriz completa (~35 cenários, 3 capabilities). O caminho de dados (exportar/restaurar/reconciliar via `sqlite-backup.repository.ts`) está muito bem coberto, inclusive idempotência e atomicidade — mesmo padrão forte já visto nas PRs anteriores para lógica pura/hooks. A lacuna concentra-se, mais uma vez, na composição de tela: `app/(tabs)/configuracoes.tsx` não tem nenhum teste de componente (ACHADO-038), e a divergência pós-restauração fica exposta só como toast informativo sem link direto para a correção em Diagnóstico (ACHADO-039) — um gap funcional, não só de teste. Também identificado que o adaptador real de sistema de arquivos (`ExpoSistemaDeArquivos`, share sheet/document picker) nunca é exercitado — só o dublê usado pelos hooks (ACHADO-040).

## Achados produzidos nesta fase (continuação 2)

- [[ACHADO-038]] — `app/(tabs)/configuracoes.tsx` sem nenhum teste de componente/E2E, origem PR 9. **Aberto.**
- [[ACHADO-039]] — divergência pós-restauração sem link direto para a correção em Diagnóstico, origem PR 9. **Aberto.**
- [[ACHADO-040]] — `ExpoSistemaDeArquivos` (adaptador real de share/document-picker/file-system) sem teste próprio, origem PR 9. **Aberto.**

## Detalhe — PR-10 (`ajuste-e-conferencia-estoque`)

Ver `qa/por-pr/PR-10.md` seção `## F3` para a matriz completa (~45 cenários, 5 capabilities). Padrão sistemático confirmado pela quinta vez consecutiva (PRs 5-10): lógica de domínio/aplicação muito bem coberta (ajuste atômico, reconciliação, correção em bloco, paginação keyset, retomada de conferência), e **nenhuma** das 4 telas novas desta PR (`app/produto/[id].tsx`, `app/produto/[id]/historico.tsx`, `app/conferencia.tsx`, `app/diagnostico.tsx`) tem teste próprio. Identificados também dois gaps pontuais: distinção visual de tipo de movimento (`corDoMovimento`) sem teste (ACHADO-043), e "verificação não altera dados" do diagnóstico sem teste explícito apesar da implementação ser só-leitura por construção (ACHADO-044). Nenhuma divergência de implementação real encontrada nesta rodada (diferente da PR-08).

## Achados produzidos nesta fase (continuação 3)

- [[ACHADO-041]] — `app/produto/[id].tsx` sem teste, origem PR 10. **Aberto.**
- [[ACHADO-042]] — `app/conferencia.tsx`, `app/diagnostico.tsx` e `app/produto/[id]/historico.tsx` sem teste, origem PR 10. **Aberto.**
- [[ACHADO-043]] — `cor-do-estado.ts` sem teste, origem PR 10. **Aberto.**
- [[ACHADO-044]] — "verificação não altera dados" do diagnóstico sem teste explícito, origem PR 10. **Aberto.**

## Critério de saída

- [ ] 13 arquivos `qa/por-pr/PR-01.md` … `PR-13.md` com seção `## F3` preenchida.
- [ ] Matriz consolidada acima com as 13 linhas.
- [ ] Achados de lacuna registrados e ancorados na PR/change de origem.

**F3 em andamento — 10/13 PRs auditadas.**
