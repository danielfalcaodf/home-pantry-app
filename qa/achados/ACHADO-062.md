---
id: ACHADO-062
pr: 10
change: 2026-08-03-ajuste-e-conferencia-estoque
capability: modo-conferencia
severidade: critica
fase: F6
estado: virou-change
change-correcao: botao-voltar-conferencia
---
## O que quebra

A tela de conferência (`app/conferencia.tsx`) **não tem nenhum botão "Voltar"** na árvore de acessibilidade — é a única tela de toda a campanha (F4/F5/F6, 12 telas auditadas) sem essa affordance. A única forma de sair é o botão/gesto de sistema do Android, que: (a) não existe como affordance visível dentro do app; (b) no iOS não teria equivalente universal (gesto de borda pode conflitar com scroll); (c) contradiz o padrão estabelecido pelas PRs 12/13, que estenderam o `BotaoVoltar` a todas as telas fora das tabs justamente para não depender da navegação de sistema.

## Como reproduzir

1. Configurações → "Conferência de estoque".
2. Inspecionar a hierarquia de acessibilidade (uiautomator/`maestro hierarchy`): nenhum elemento "Voltar".
3. Comparar com qualquer outra tela secundária (`produto/[id]`, `diagnostico`, `historico`): todas têm `BotaoVoltar` com alvo de 126px.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

Specs das PRs 12/13 (`feat/correcao-navegacao-nativa`, `feat/ajuste-visual-telas-design-system`): botão de voltar estendido a todas as telas fora das tabs (ver ACHADO-049, que já apontava a falta de teste de navegação dessas telas). CLAUDE.md §Design de UI: gesto invisível não pode carregar ação essencial — sair de uma tela é ação essencial.

## Observado (saída real, caminho:linha)

Rodada F6-R3 no `emulator-5554`: hierarquia da tela de conferência sem nenhum nó "Voltar"; screenshots em evidência da rodada. As demais 6 telas auditadas na mesma rodada têm `BotaoVoltar` em 126px exatos.

## Change sugerida (slug proposto, escopo de uma frase)

`botao-voltar-conferencia`: adicionar o `BotaoVoltar` padrão à tela de conferência, com o mesmo comportamento de preservação de progresso já garantido pela retomada (`use-conferencia.test.ts:112`).
