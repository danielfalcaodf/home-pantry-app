---
id: ACHADO-039
pr: 9
change: 2026-08-03-backup-restore-json
capability: restauracao-de-backup
severidade: media
fase: F3
estado: aberto
---
## O que quebra

Após uma restauração com divergências, a reconciliação as informa só como contagem em um toast na tela de Configurações ("X produto(s) com divergência"), sem link direto para a tela de Diagnóstico, onde a correção de fato acontece. Nenhum teste (unitário ou E2E) valida o encadeamento completo restaurar → divergência informada → correção acessível.

## Como reproduzir

```
grep -n "divergencia" app/\(tabs\)/configuracoes.tsx
```
`app/(tabs)/configuracoes.tsx:191-199` mostra o toast com a contagem, mas não navega nem oferece ação direta para `/diagnostico`.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-03-backup-restore-json/specs/restauracao-de-backup/spec.md`, requirement "Reconciliação após restaurar", cenário "Divergência é informada": "o app informa quais produtos divergem **e oferece corrigir** pela soma dos movimentos."

## Observado (saída real, caminho:linha)

`app/(tabs)/configuracoes.tsx:191-199` (toast apenas informativo, sem CTA); a correção em si existe e está testada em `use-diagnostico.ts:39-63` / `use-diagnostico.test.ts:40-85`, mas fica desconectada do fluxo pós-restauração.

## Change sugerida (slug proposto, escopo de uma frase)

`link-diagnostico-pos-restauracao`: adicionar ação no toast de divergência (ou navegação automática) que leva direto a `/diagnostico`, com teste cobrindo o encadeamento restaurar→divergência→correção acessível.
