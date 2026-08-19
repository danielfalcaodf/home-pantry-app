## Context

O cabeçalho da aba Lista tem três ações: "Adicionar item avulso" (`AcaoSecundaria`, texto),
"Compartilhar" (`Pressable`+`Texto` cru) e "Agrupar" (`ChipEstado`, já compacto desde a change
`correcao-affordance-busca-e-lista`, Ordem 6). Os dois primeiros, em texto, ocupam quase toda a
largura do cabeçalho.

## Goals / Non-Goals

**Goals:**
- Reduzir a largura ocupada pelas duas ações, dando respiro ao título "Lista".
- Preservar o rótulo acessível completo para leitor de tela.

**Non-Goals:**
- Não mexer no toggle "Agrupar" (já resolvido pela change 6).
- Não introduzir biblioteca de ícones nova — o projeto já tem `IconeSvg`/`theme/icones.ts` sobre
  `react-native-svg` (já instalado); pesquisa via context7 confirmou que `lucide-react-native`
  seria uma alternativa válida (mesmo formato de componente SVG) só se o desenho manual do path
  de "compartilhar" se mostrar inviável — não é o caminho padrão desta change.

## Decisions

- Reaproveitar o padrão de botão-ícone já usado em `sheet-ajuste-estoque.tsx`/
  `formulario-produto.tsx`: `IconeSvg` + `accessibilityLabel` + `hitSlop`, alvo ≥48×48dp.
- Desenhar o path SVG de "compartilhar" à mão em `theme/icones.ts`, seguindo o estilo (stroke,
  viewBox) dos ícones existentes — sem dependência nova.

## Risks / Trade-offs

- [Risco] Ícone sem rótulo visível pode ser menos descobrível para usuário novo → Mitigação:
  ícones seguem convenção visual comum (➕ adicionar, compartilhar) e mantêm `accessibilityLabel`
  completo; se necessário, considerar tooltip/hint na primeira execução (fora do escopo desta
  change).
