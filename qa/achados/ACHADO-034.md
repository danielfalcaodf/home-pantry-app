---
id: ACHADO-034
pr: 8
change: 2026-08-03-modo-compra-e-fechamento
capability: modo-compra
severidade: media
fase: F3
estado: virou-change
change-correcao: correcao-fluxo-modo-compra
---
## O que quebra

O aviso de saída durante uma compra com itens marcados é um texto estático sempre visível, não uma resposta ao gesto de voltar. O spec pede que o usuário "seja informado" especificamente **ao acionar voltar** e **quando há itens marcados** — a implementação atual não distingue os dois casos.

## Como reproduzir

```
grep -n "Se sair" app/compra/\[id\].tsx
cat src/presentation/components/botao-voltar.tsx
```

`BotaoVoltar` (`src/presentation/components/botao-voltar.tsx:13`) chama `router.back()` direto no `onPress`, sem `Alert`, sem checar `marcados`. O texto "Toque em cada item para marcar. Se sair, a compra continua aberta com o que você já marcou." em `app/compra/[id].tsx:96-98` é renderizado incondicionalmente, independente de haver ou não item marcado, e não está vinculado ao botão de voltar.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-03-modo-compra-e-fechamento/specs/modo-compra/spec.md`, requirement "Tela única sem navegação interna", cenário "Sair exige intenção": "WHEN o usuário aciona voltar durante uma compra com itens marcados THEN ele é informado de que a compra continua aberta, e o progresso é preservado."

## Observado (saída real, caminho:linha)

`app/compra/[id].tsx:96-98` (texto estático, sempre renderizado) e `src/presentation/components/botao-voltar.tsx:13` (`onPress={() => router.back()}`, sem lógica condicional nem confirmação).

## Change sugerida (slug proposto, escopo de uma frase)

`aviso-saida-compra-marcada`: condicionar o aviso ao botão de voltar quando `marcados > 0`, por exemplo via `Alert.alert` (mesmo padrão já usado em `confirmarCancelamento`) ou variante de `BotaoVoltar` que aceita callback de confirmação.
