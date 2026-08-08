---
id: ACHADO-038
pr: 9
change: 2026-08-03-backup-restore-json
capability: tela-de-configuracoes
severidade: media
fase: F3
estado: aberto
---
## O que quebra

`app/(tabs)/configuracoes.tsx` não tem nenhum teste de componente/E2E. Toda a lógica de UI da tela (agrupamento das ações de dados, distinção visual da ação destrutiva de restaurar, ausência de confirmação no export, exibição do resumo de confirmação de restauração, toast de divergência) só é exercitada via os hooks isolados (`use-exportar-backup`, `use-restaurar-backup`, `use-ultimo-backup`), não pela composição da tela em si.

## Como reproduzir

```
find src app -iname "*configuracoes*test*"
```
Não retorna nenhum arquivo, e não há flow Maestro em `.maestro/` cobrindo `configuracoes`/`diagnostico`.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-03-backup-restore-json/specs/tela-de-configuracoes/spec.md`, cenários "Ações de dados agrupadas", "Restauração sinalizada" e "Exportação não pede confirmação".

## Observado (saída real, caminho:linha)

Implementação presente em `app/(tabs)/configuracoes.tsx:95-131` (seção "Seus dados"), `:107-117` (variante secundária + texto de aviso da restauração) e `:44-48` (comentário "Sem confirmação (task 6.5)" no fluxo de exportar), mas nenhuma dessas decisões de UI é verificada por teste.

## Change sugerida (slug proposto, escopo de uma frase)

`teste-tela-configuracoes`: RTL renderizando `app/(tabs)/configuracoes.tsx` com hooks mockados, confirmando agrupamento das três ações, distinção visual/textual da ação de restaurar, e ausência de diálogo ao exportar.
