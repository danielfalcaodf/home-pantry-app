---
id: ACHADO-027
pr: 6
change: dar-baixa-caminho-critico
capability: registro-de-consumo
severidade: baixa
fase: F3
estado: aberto
---
## O que quebra

O requisito "Quantidade específica por toque longo" exige que o painel de quantidade permita tanto registrar consumo quanto registrar reposição. `TecladoQuantidade` recebe `onRepus` (`teclado-quantidade.tsx:18,101`) exatamente para o segundo caminho, mas o único teste que o menciona (`registro-e-desfazer.test.tsx:200-207`, "fechar sem confirmar não altera nada") só verifica que `onRepus` **não** é chamado ao fechar — não existe teste equivalente ao de `onUsei` (linha 191, "registra consumo com o valor digitado e fecha") para confirmar que escolher "Repus" chama `onRepus` com a quantidade digitada.

## Como reproduzir

```
grep -n "onRepus" src/presentation/components/registro-e-desfazer.test.tsx
```
As três ocorrências são: declaração do mock, passagem de prop, e a asserção negativa — nenhuma positiva.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-02-dar-baixa-caminho-critico/specs/registro-de-consumo/spec.md`, requisito "Quantidade específica por toque longo", cenário "Registrar reposição específica": "WHEN o usuário informa duas unidades e escolhe registrar reposição THEN a quantidade é aumentada em duas unidades e o painel fecha".

## Observado (saída real, caminho:linha)

`src/presentation/components/registro-e-desfazer.test.tsx:191-198` testa só o caminho `onUsei`; não há teste espelhado para `onRepus` com valor preenchido e confirmado.

## Change sugerida (slug proposto, escopo de uma frase)

`teste-teclado-quantidade-repus`: espelhar o teste "registra consumo com o valor digitado e fecha" para o botão "Repus", confirmando `onRepus` chamado com o valor correto.
