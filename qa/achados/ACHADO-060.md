---
id: ACHADO-060
pr: 13
change: null
capability: configuracoes
severidade: baixa
fase: F6
estado: virou-change
change-correcao: alvos-de-toque-e-acessibilidade
---
## O que quebra

Na tab Configurações (`app/(tabs)/configuracoes.tsx`), seção "Despensa", o botão de atalho para a auditoria de itens tem o texto visível **"Conferência de estoque"**. A palavra "estoque" é jargão técnico que o CLAUDE.md pede para evitar em favor do vocabulário do usuário — o restante do app usa consistentemente "Despensa" (título da tab, "Sua despensa" no Resumo, etc.), mas esse botão reintroduz o termo de sistema.

## Como reproduzir

1. Abrir o app, ir para a tab Configurações.
2. Ler o texto do botão na seção "Despensa": "Conferência de estoque".

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

CLAUDE.md §Design de UI: "Vocabulário: a UI nunca usa termos de domínio como 'dar baixa'/'movimento de estoque'/'reposição'. Usa [...] 'Despensa', 'Faltando', 'Acabou'." "Estoque" usado como termo de sistema no rótulo do botão contradiz o vocabulário consolidado no resto do app.

## Observado (saída real, caminho:linha)

`app/(tabs)/configuracoes.tsx` — botão `[42,1673][1038,1799]` com texto "Conferência de estoque". Evidência: rodada F6-R2 (2026-08-09), screenshots `config-escuro.png`/`config-claro.png`.

## Change sugerida (slug proposto, escopo de uma frase)

`renomear-conferencia-estoque-para-despensa`: renomear o texto do botão de "Conferência de estoque" para "Conferência da despensa" em `app/(tabs)/configuracoes.tsx`, alinhando com o vocabulário já usado no resto do app.
