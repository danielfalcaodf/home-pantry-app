---
id: ACHADO-035
pr: 8
change: 2026-08-03-modo-compra-e-fechamento
capability: modo-compra
severidade: media
fase: F3
estado: aberto
---
## O que quebra

`app/compra/[id].tsx` (a tela do modo compra) não tem nenhum arquivo de teste. Vários requisitos de tela inteira — não decompostos nos hooks — ficam sem verificação: ausência de navegação ao marcar/ajustar, `useKeepAwake` ativo durante a tela e restaurado ao desmontar, atualização do rodapé a cada marcação, mensagem de confirmação do fechamento em linguagem do usuário, e retorno à despensa com estado atualizado após sucesso.

## Como reproduzir

```
find src app -iname "*compra*id*test*" -o -iname "*modo-compra*test*" | grep -i "app/compra"
```
Não retorna nenhum arquivo de teste para `app/compra/[id].tsx`.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-03-modo-compra-e-fechamento/specs/modo-compra/spec.md`, cenários "Sem subtelas", "Tela permanece acesa", "Comportamento normal restaurado ao sair", "Contador atualiza a cada marcação"; e `fechamento-de-compra/spec.md`, cenários "Vocabulário do usuário" e "Retorno à despensa com estado atualizado".

## Observado (saída real, caminho:linha)

Implementação existe (`app/compra/[id].tsx:28` `useKeepAwake()`; `:42-56` mensagem "Você repôs N itens"; `:39-40` `useMemo` do rodapé), mas nenhuma é exercitada por teste de tela — só os hooks subjacentes (`use-modo-compra.test.ts`, `use-finalizar-compra.test.ts`) têm cobertura, e eles não capturam o comportamento de composição na tela.

## Change sugerida (slug proposto, escopo de uma frase)

`teste-tela-modo-compra`: RTL renderizando `app/compra/[id].tsx` com router/hooks mockados, cobrindo ausência de navegação ao marcar, mensagem de fechamento sem termos técnicos, e retorno à despensa após sucesso.
