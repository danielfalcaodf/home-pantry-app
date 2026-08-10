---
id: ACHADO-051
pr: 13
change: 2026-08-06-ajuste-visual-telas-design-system
capability: chrome-de-navegacao
severidade: baixa
fase: F3
estado: virou-change
change-correcao: cobertura-telas-e-navegacao
---
## O que quebra

A tab bar (`app/(tabs)/_layout.tsx`) não tem teste de integração. A cobertura existente (`icone-svg.test.tsx`) valida o componente `IconeSvg` isoladamente — não que a tab bar injeta os 4 ícones corretos (Despensa/Lista/Resumo/Configurações) nem que a cor muda corretamente entre `action.azulejo` (ativa) e `text.secondary` (inativas) ao trocar de aba.

## Como reproduzir

```
find app -iname "*layout*test*" -path "*tabs*"
```
Nenhum arquivo retornado.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-06-ajuste-visual-telas-design-system/specs/chrome-de-navegacao/spec.md`, cenários "Renderizar a tab bar" e "Cor do ícone segue a aba ativa".

## Observado (saída real, caminho:linha)

`app/(tabs)/_layout.tsx:15-16,19-48` (`tabBarActiveTintColor`/`tabBarInactiveTintColor` repassados via prop `color` a cada `tabBarIcon`) sem teste que renderize a tab bar completa e confirme os 4 ícones + a troca de cor.

## Change sugerida (slug proposto, escopo de uma frase)

`teste-tab-bar-icones`: teste de integração renderizando `app/(tabs)/_layout.tsx` (ou um mock equivalente com `@react-navigation/bottom-tabs`) confirmando os 4 ícones presentes e a cor correta por aba ativa/inativa.
