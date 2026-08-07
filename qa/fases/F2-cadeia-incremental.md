---
fase: F2
titulo: Cadeia incremental por worktree (13 PRs)
estado: concluida
---

## Objetivo

Percorrer as 13 PRs empilhadas na ordem de merge, cada uma isolada em um worktree próprio, para distinguir "nunca funcionou" de "quebrou entre uma PR e outra" — e localizar a change certa para cada achado.

## Resultado agregado

| PR | Branch | `verificar` | Testes | Estado |
|---|---|---|---|---|
| 1 | `change/bootstrap-projeto-expo` | verde | 2/2 suítes, 9/9 testes | concluída |
| 2 | `change/fundacao-dominio` | verde | 10/10 suítes, 110/110 testes | concluída |
| 3 | `change/persistencia-sqlite` | verde (1 warning) | 16/16 suítes, 163/163 testes | concluída |
| 4 | `change/design-system-tema` | verde (1 warning herdado) | 21/21 suítes, 234/234 testes | concluída |
| 5 | `change/despensa-e-cadastro-produto` | **falha (exit 1)** | 24/24 suítes, 279/279 testes | achado crítico (corrigido na PR 6) |
| 6 | `change/dar-baixa-caminho-critico` | verde, sem warnings | 26/26 suítes, 314/314 testes | concluída |
| 7 | `feature/lista-de-compras` | verde | 32/32 suítes, 355/355 testes | concluída |
| 8 | `feature/modo-compra-e-fechamento` | verde | 40/40 suítes, 405/405 testes | concluída |
| 9 | `feature/backup-restore-json` | verde | 49/49 suítes, 470/470 testes | concluída |
| 10 | `feature/ajuste-e-conferencia-estoque` | verde | 55/55 suítes, 530/530 testes | concluída |
| 11 | `feature/resumo-valores-e-historico` | verde | 59/61 suítes, 579/581 testes | origem de ACHADO-001/002 |
| 12 | `feat/correcao-navegacao-nativa` | **falha (exit 1)** | 60/62 suítes, 584/586 testes | achado crítico (corrigido na PR 13) |
| 13 | `feat/ajuste-visual-telas-design-system` | verde (= baseline F1) | 63/65 suítes, 609/611 testes | concluída |

## Achados produzidos nesta fase

- [[ACHADO-004]] — `backup-pre-migration.ts` sem teste, origem PR 3, confirmado ainda presente na PR 9. **Aberto.**
- [[ACHADO-005]] — import não usado `Milesimos`, origem PR 3, corrigido na PR 6. **Aberto** (baixa severidade, correção trivial não priorizada).
- [[ACHADO-006]] — `npm run verificar` falhava isoladamente na PR 5 (2 erros de lint `set-state-in-effect`); corrigido na PR 6 via `eslint-disable` justificado. **Descartado** (resolvido, problema de sequenciamento).
- [[ACHADO-007]] — `npm run verificar` falhava isoladamente na PR 12 (`react-native-get-random-values` não declarado); corrigido na PR 13. **Descartado** (resolvido, problema de sequenciamento).
- Confirmado: [[ACHADO-001]] e [[ACHADO-002]] (fuso horário) se originam exatamente na PR 11.

## Observação metodológica

Durante a investigação da PR 9, um `--listTests` do Jest pareceu inicialmente omitir uma suíte inteira (`sqlite-backup.repository.test.ts`) — investigação mostrou que era efeito de cache do Jest (`--clearCache` "resolveu"), mas a comparação de contagem final (49 suítes/470 testes antes e depois) provou que **não havia problema real**: a suíte já estava incluída, só não apareceu no trecho de saída que o comando `tail -50` cortou. Registrado aqui só para não induzir dúvida em quem reler os logs desta sessão — não é achado.

## Critério de saída

- [x] 13 arquivos `qa/por-pr/PR-01.md` … `PR-13.md` preenchidos com resultado real de cada rodada.
- [x] `git worktree list` mostra só o worktree principal ao final (nenhum vazamento) — confirmado após cada rodada.
- [x] Achados numerados e ancorados na PR de origem real (não na PR onde o sintoma apareceu no topo).

**F2 concluída.**
