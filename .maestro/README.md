# Flows Maestro — Repor

E2E do app real rodando no emulador/dispositivo, complementar aos testes Jest (que não sobem o app). Ver `CLAUDE.md` §Testes pra saber o que já é coberto por Jest — só escreva flow aqui para roteiros de usuário ponta a ponta que o Jest não alcança.

## Rodar

```bash
maestro test .maestro/smoke-launch.yaml
maestro test .maestro/dar-baixa-caminho-critico.yaml
maestro test .maestro/            # roda todos os flows da pasta
```

Requer o app já instalado no emulador/dispositivo ativo (`adb devices`) e o Metro/dev client rodando se for build de desenvolvimento.

## Convenções

- `appId: com.danielfalcaodf.repor` em todo flow.
- Selecionar por texto visível/rótulo acessível, nunca por índice de posição.
- Vocabulário de assertion é o da UI ("Usei"/"Anotado"/"Falta N"), nunca termo de domínio ("dar baixa"/"movimento") — CLAUDE.md §Vocabulário.
- Flows que alteram dados (consumir, repor, fechar compra) são side-effect real no banco do dispositivo — documentar isso no comentário do flow, como em `dar-baixa-caminho-critico.yaml`.
- Para gerar um flow novo, prefira pedir ao subagent `mobile-ux-tester` ou `test-automator` (`/qa:test`) — eles inspecionam a hierarquia de view pelo Maestro MCP antes de escrever o seletor, reduzindo erro de primeira tentativa.

## Flows pendentes de execução real

Todos os flows abaixo foram escritos sem rodar contra o app de verdade — seletores lidos do
código-fonte, não confirmados por `inspect_screen`. Revisar/ajustar seletores antes de rodar.

Rode-os pelo subagent + Maestro MCP, não por `maestro test` na mão: `/qa:ux`
(`mobile-ux-tester`) executa e investiga falhas, `/qa:test` (`test-automator`) corrige o flow
inspecionando a hierarquia antes de reescrever o seletor. Bug do app achado por um desses flows
entra primeiro na change (`/opsx:update`: cenário no spec + tasks de correção, teste do bug e
casos de borda) e só depois vira código.

- `bug-preco-*.yaml` (8 arquivos, change `correcao-total-compra-preco-heranca`) — ver
  `tasks.md` da change (seção 6) para o que cada um prova.
- `bug-exclusao-produto-*.yaml`, `bug-autofoco-*.yaml`, `bug-editar-produto-*.yaml`,
  `bug-busca-despensa-*.yaml`, `feature-apagar-dados-*.yaml` (24 arquivos, 5 changes reabertas
  em 2026-08-21) — ver `PLANO-TESTES-E2E-CHANGES-REABERTAS.md` na raiz do repositório, que
  lista cenário por cenário o que é testado e qual o resultado esperado.

Os flows de `bug-autofoco-*` afirmam que o **teclado do sistema** subiu junto com o foco, pelo
id da janela do IME (`.*inputmethod.*:id/keyboard_view`). Esse id depende do teclado instalado
no dispositivo — confirmar com `maestro hierarchy` (teclado aberto) antes de rodar o grupo.

⚠️ Quatro desses flows são **destrutivos** (`feature-apagar-dados-caminho-completo`,
`feature-apagar-dados-app-usavel-apos-reset`, `feature-apagar-dados-limpa-lista-e-resumo` apagam
todos os dados do dispositivo; `bug-exclusao-produto-historico-compra-fechada` fecha uma compra
de verdade). Rodar por último, em dispositivo de QA. `maestro test .maestro/` roda a pasta
inteira em ordem alfabética — o que executa os destrutivos no meio da bateria; prefira rodar
por grupo.
