---
id: ACHADO-061
pr: 13
change: null
capability: despensa
severidade: baixa
fase: F6
estado: virou-change
change-correcao: alvos-de-toque-e-acessibilidade
---
## O que quebra

O rótulo de acessibilidade (`accessibilityLabel`, falado por leitor de tela) do botão "−" do stepper de cada item na tab Despensa é **"Registrar consumo de X"**, não "Usei X". O CLAUDE.md exige que o verbo se mantenha idêntico ponta a ponta: botão "Usei" → toast "Anotado" → histórico "Você anotou". Um usuário de leitor de tela ouve "Registrar consumo", um verbo de sistema/domínio, em vez do verbo de produto documentado — divergência de conteúdo entre o que é falado e o que é visto/especificado, mesmo não sendo visível na tela (o glyph visual é só "−").

## Como reproduzir

1. Abrir o app na tab Despensa.
2. Inspecionar a hierarquia de acessibilidade de qualquer item (ex. "Carne moída").
3. Ler o `content-description`/`accessibilityLabel` do botão de decremento: "Registrar consumo de 1 kg de Carne moída".

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

CLAUDE.md §Design de UI: "A ação mantém o mesmo nome do início ao fim: botão `Usei` → toast `Anotado` → histórico `Você anotou`." O rótulo de acessibilidade deveria usar "Usei", não "Registrar consumo".

## Observado (saída real, caminho:linha)

Componente do stepper de item da Despensa (provavelmente `src/presentation/components/medidor-e-item.tsx` ou equivalente) — `accessibilityLabel` do botão de decremento monta a frase com o verbo "Registrar consumo de X" em vez de "Usei X". Evidência: rodada F6-R2 (2026-08-09), hierarquia via `mcp__maestro__inspect_screen`, exemplos capturados: `"Registrar consumo de 1 kg de Carne moída"`.

## Change sugerida (slug proposto, escopo de uma frase)

`alinhar-a11y-stepper-verbo-usei`: trocar o verbo usado na montagem do `accessibilityLabel` do botão de decremento do stepper de "Registrar consumo de X" para "Usei X", mantendo consistência com o vocabulário documentado.
