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

`bug-preco-*.yaml` (8 arquivos, change `correcao-total-compra-preco-heranca`) foram escritos
sem rodar contra o app de verdade — seletores lidos do código-fonte, não confirmados por
`inspect_screen`. Revisar/ajustar seletores antes de rodar; ver `tasks.md` da change (seção 6)
para o que cada um prova.
