---
id: ACHADO-049
pr: 13
change: 2026-08-06-ajuste-visual-telas-design-system
capability: chrome-de-navegacao
severidade: media
fase: F3
estado: virou-change
change-correcao: cobertura-telas-e-navegacao
---
## O que quebra

O botão `BotaoVoltar` foi estendido a sete telas novas (Conferência, Diagnóstico, Lista básica, Histórico de compras — lista e detalhe —, Histórico do produto, aba Configurações), mas nenhuma tem teste próprio. A cobertura existente (`botao-voltar.test.tsx`) só verifica que o componente genérico chama `router.back()` e expõe o rótulo acessível — não verifica o **destino específico** exigido por cada cenário da spec (ex.: "volta para Configurações" no Diagnóstico, "volta para o Detalhe do produto" no Histórico do produto). Como `router.back()` depende inteiramente da pilha de navegação do Expo Router, um erro de navegação (ex.: push em vez de rota correta antes de chegar na tela) não seria pego por nenhum teste, nem unitário nem Maestro.

## Como reproduzir

```
find app -iname "*conferencia*test*" -o -iname "*diagnostico*test*" -o -iname "*lista-base*test*"
grep -rn "conferencia\|diagnostico\|historico" .maestro/*.yaml
```
Nenhum teste de tela; nenhum flow Maestro cobre essas rotas.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-06-ajuste-visual-telas-design-system/specs/chrome-de-navegacao/spec.md`, cenários "Voltar da Conferência de estoque", "Voltar do Diagnóstico", "Voltar da Lista básica", "Voltar do Histórico de compras" e "Voltar do Histórico do produto".

## Observado (saída real, caminho:linha)

`app/conferencia.tsx:9,33`, `app/diagnostico.tsx:6,23`, `app/produto/lista-base.tsx:9,45`, `app/compra/historico.tsx:7,61`, `app/compra/historico/[id].tsx:8,77`, `app/produto/[id]/historico.tsx:7,75`, `app/(tabs)/configuracoes.tsx:9,62` — todos usam `<BotaoVoltar />` sem teste de tela que confirme o destino da navegação.

## Change sugerida (slug proposto, escopo de uma frase)

`teste-destino-botao-voltar`: para cada tela empilhada, um teste leve de navegação (mock de `router` com histórico) confirmando que `router.back()` de fato retorna à rota anterior esperada pela spec.
