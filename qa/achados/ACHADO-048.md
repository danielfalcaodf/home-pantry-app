---
id: ACHADO-048
pr: 12
change: 2026-08-06-correcao-navegacao-nativa
capability: chrome-de-navegacao
severidade: baixa
fase: F3
estado: virou-change
change-correcao: cobertura-telas-e-navegacao
---
## O que quebra

Nenhum teste automatizado verifica que `headerShown: false` está de fato ativo nas rotas (`app/_layout.tsx` e `app/(tabs)/_layout.tsx`) nem que o alvo de toque do `BotaoVoltar` mede pelo menos 48×48dp. A própria PR já registrou essa lacuna manualmente na F2 ("não há assert direto de estilo no teste do componente"), mas nunca virou achado formal. A verificação real desta capability inteira foi feita manualmente via emulador/screenshots (`tasks.md` da change, seção 5), não por teste automatizado — não há arquivo `*.test.*` para `app/_layout.tsx` ou `app/(tabs)/_layout.tsx`.

## Como reproduzir

```
find app -iname "_layout*test*"
grep -n "minWidth\|minHeight\|toHaveStyle" src/presentation/components/botao-voltar.test.tsx
```
Nenhum arquivo de teste para os layouts; `botao-voltar.test.tsx` não verifica dimensões.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-06-correcao-navegacao-nativa/specs/chrome-de-navegacao/spec.md`, cenário "Botão de voltar tem alvo de toque acessível": "sua área de toque é de no mínimo 48×48dp"; e os quatro cenários de "Header nativo oculto em toda rota".

## Observado (saída real, caminho:linha)

`src/presentation/components/botao-voltar.tsx` usa `minWidth`/`minHeight: ALVO_TOQUE_MINIMO` (`theme/espaco.ts:21` = 48), mas `botao-voltar.test.tsx` só verifica rótulo acessível e chamada de `router.back()`, sem asserção de estilo; `app/_layout.tsx:23` e `app/(tabs)/_layout.tsx:10` (`headerShown: false`) sem teste que capture regressão se removido.

## Change sugerida (slug proposto, escopo de uma frase)

`teste-alvo-toque-e-header-oculto`: adicionar asserção de `minWidth`/`minHeight` em `botao-voltar.test.tsx`, e um teste leve (snapshot de `screenOptions` ou render raso) confirmando `headerShown: false` nos dois layouts.
