---
id: ACHADO-016
pr: 4
change: design-system-tema
capability: componentes-base
severidade: media
fase: F3
estado: aberto
---
## O que quebra

O componente `toast.tsx` (existe desde a PR-04) não tem nenhum arquivo de teste. Três cenários do requisito "Toast que não bloqueia e não empilha" ficam sem cobertura: substituição em vez de empilhamento, não bloquear interação com a tela por trás, e barra de tempo restante visível. A própria PR-04.md (seção F2, "Fora de escopo desta PR") já sinalizava isso e adiava a formalização para a auditoria F3 — esta é essa formalização.

## Como reproduzir

```
find . -iname "*toast*test*" -not -path "*/node_modules/*"
```
Retorna vazio (só existe `toast-desfazer.tsx`, componente diferente, sem teste próprio também).

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-02-design-system-tema/specs/componentes-base/spec.md`, requisito "Toast que não bloqueia e não empilha", cenários "Substituição em vez de empilhamento", "Não bloqueia interação", "Tempo restante é visível".

## Observado (saída real, caminho:linha)

`src/presentation/components/toast.tsx` existe; nenhum `toast.test.tsx` correspondente.

## Change sugerida (slug proposto, escopo de uma frase)

`teste-toast-substituicao`: teste RTL que dispara dois toasts em sequência e confirma que só um está na árvore, que elementos da tela por trás continuam respondendo a `fireEvent.press`, e que a barra de progresso renderiza com a duração declarada.
