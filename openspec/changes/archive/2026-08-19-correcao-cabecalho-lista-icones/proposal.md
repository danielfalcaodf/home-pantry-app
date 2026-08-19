**Type:** Correção de Bug

## Why

Usuário relatou em teste manual (screenshot anexado): no cabeçalho da aba Lista, "Adicionar item
avulso" e "Compartilhar" aparecem como texto grande, ocupando quase toda a largura da tela e
colados no título "Lista" sem respiro visual. Confirmado na sessão de teste de 2026-08-18 via
`inspect_screen`: os três controles do cabeçalho ("Adicionar item avulso", "Compartilhar",
"Agrupar") ocupam de x=175 a x=1065 num total de 1080px de largura — sobra quase nenhum espaço
em branco, e o título "Lista" fica sem destaque hierárquico.

Não viola nenhuma regra explícita do CLAUDE.md, mas destoa da estética "sem excesso" do design
system e compete visualmente com o título da tela — o usuário pediu explicitamente para os dois
primeiros virarem ícone.

## What Changes

- "Adicionar item avulso" e "Compartilhar" passam de texto para ícone, com
  `accessibilityLabel` preservando o texto original como rótulo acessível (o texto visual some,
  o rótulo pro leitor de tela continua completo).
- "Agrupar" continua como está hoje (já é um `ChipEstado` compacto, corrigido pela change
  `correcao-affordance-busca-e-lista`, Ordem 6 — fora do escopo desta change).
- Segue o padrão já usado em `sheet-ajuste-estoque.tsx`/`formulario-produto.tsx`: `IconeSvg` com
  `accessibilityLabel` + `hitSlop`, alvo de toque ≥48×48dp.
- Sem dependência nova: o projeto já tem `react-native-svg` instalado (base de `IconeSvg`/
  `theme/icones.ts`). O path de "adicionar" já existe (`M12 5v14M5 12h14`); falta desenhar o path
  de "compartilhar" em `theme/icones.ts`.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

(nenhuma — reuso direto do padrão de `IconeSvg`/alvo de toque já especificado em
`componentes-base`, sem mudança de requirement)

## Impact

- `app/(tabs)/lista.tsx` — barra de ações do cabeçalho.
- `src/presentation/theme/icones.ts` — novo path SVG de "compartilhar".
- Puramente `presentation/`, sem mudança de comportamento funcional (as duas ações continuam
  fazendo exatamente o mesmo que fazem hoje).
