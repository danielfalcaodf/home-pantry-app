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
| 2-13 | — | — | — | — | pendente |

## Detalhe — PR-01 (`bootstrap-projeto-expo`)

Ver `qa/por-pr/PR-01.md` seção `## F3` para a matriz completa capability × cenário × teste.

Resumo por capability:
- **`fronteiras-de-camada`**: regras de lint (boundaries, no-restricted-imports, no-restricted-syntax de hex) todas configuradas e o script `verificar:fronteiras` confirmado com exit 0, mas nenhuma tem teste automatizado que force a violação e confirme a rejeição — cobertura é de configuração estática, não de teste. Lacuna adicional: "apresentação usa do domínio apenas tipos e formatadores" não tem nenhuma verificação, nem estática nem de teste.
- **`primitivos-compartilhados`**: `Result<T,E>` e `gerarId()` (UUID v7) bem cobertos em runtime (`src/shared/result.test.ts`, `src/shared/id.test.ts`). Duas lacunas: nenhum teste de tipo (`@ts-expect-error`) para a discriminação obrigatória do `Result`, e nenhum teste explícito para "geração sem coordenação externa" (ausência de chamada de rede).
- **`projeto-base`**: estrutura de diretórios, TypeScript estrito, EAS profiles, separação de projetos Jest (domain/infra/app) e documentação — todos confirmados por inspeção direta de config/estrutura. Único cenário sem cobertura é "app inicia no development build", que depende de F4 (bloqueada por falta de development build instalado) — não é achado novo, é a mesma bloqueante já rastreada no plano.

## Achados produzidos nesta fase

- [[ACHADO-008]] — regras de lint de fronteira (boundaries/hex/import proibido) sem teste automatizado que force a violação, origem PR 1. **Aberto.**
- [[ACHADO-009]] — `Result<T,E>` sem teste de tipo para a discriminação obrigatória exigida pelo spec, origem PR 1. **Aberto.**

## Critério de saída

- [ ] 13 arquivos `qa/por-pr/PR-01.md` … `PR-13.md` com seção `## F3` preenchida.
- [ ] Matriz consolidada acima com as 13 linhas.
- [ ] Achados de lacuna registrados e ancorados na PR/change de origem.

**F3 em andamento — 1/13 PRs auditadas.**
