## Why

O projeto de design system "Repor Design System" (claude.ai/design, projeto `aca58fcf-dc7d-4d76-a375-b1aa5a3dc816`) evoluiu depois que as telas atuais foram implementadas, e hoje diverge do código em pontos visuais concretos: cabeçalho da Despensa, posição do rodapé no Modo compra, ausência de gráfico no Resumo, e a tab bar (que o change `correcao-navegacao-nativa` decidiu deixar sem ícone, mas o design atual mostra com ícone). Tokens de cor, tipografia, espaçamento, o vocabulário da UI e o cálculo de estado/fração no domínio já conferem com o design (confirmado comparando `tokens/*.css` do projeto com `src/presentation/theme/tokens.ts` e `src/domain/produto/estoque.rules.ts`) — não fazem parte do escopo deste change.

## What Changes

- **Despensa** (`app/(tabs)/index.tsx`): trocar o campo de busca sempre visível e o link "Conferência" por dois botões de ícone no cabeçalho (buscar, adicionar produto); reduzir os chips de filtro de 4 para 3 (`Tudo`/`Acabou`/`Faltando`, sem chip `Cheio` isolado — "Faltando" passa a somar crítico+em falta, como no design); manter a busca e a Conferência acessíveis por outro caminho (a definir em design.md).
- **Tab bar** (`app/(tabs)/_layout.tsx`): reverter a decisão de ícone `() => null` do change `correcao-navegacao-nativa` — desenhar os 3 ícones (Despensa/Lista/Resumo) como SVG inline via `react-native-svg`, com os mesmos paths do design system, cor `text.secondary`/`action.azulejo` conforme aba ativa/inativa. **Isso exige atualizar o design.md, tasks.md e o spec draft `chrome-de-navegacao` do change `correcao-navegacao-nativa`** para não ficarem contraditórios.
- **Modo compra** (`app/compra/[id].tsx`): mover o `RodapeCompra` (contagem + total) de logo abaixo do cabeçalho para imediatamente acima do botão "Fechar compra", no final da tela, como no design.
- **Resumo** (`app/(tabs)/resumo.tsx`): promover "Gasto este mês" a métrica grande (`data.xl`), no mesmo padrão visual de "Em casa" e "Falta comprar"; adicionar um mini gráfico de barras dos últimos 4 meses (barras via `View` com altura proporcional — sem biblioteca de gráfico) acima ou no lugar da lista textual atual de meses.
- **Detalhe do produto** (`app/produto/[id].tsx`): nenhuma remoção de campo ou de ação — o formulário completo (marca, observação, remover, "Outra quantidade") é mantido; só ajustes de espaçamento/estilo onde não houver conflito funcional com a maquete simplificada do design.
- Nenhuma mudança em `src/domain/`, `src/application/` (além de eventualmente consumir dados já existentes) ou no schema do banco.

## Capabilities

### New Capabilities
(nenhuma — todo o escopo é ajuste visual sobre capacidades já especificadas)

### Modified Capabilities
- `tela-despensa`: o filtro "Faltando" passa a incluir também os itens críticos (chip "Cheio" some, "Faltando" soma crítico + em falta) — muda o cenário testável do requisito de filtro por estado. Cabeçalho com ícones e posição do rodapé/gráfico no Modo compra e Resumo são só reposicionamento visual, não alteram nenhum requisito formal existente desses specs — tratados apenas em design.md/tasks.md, sem delta de spec.

## Impact

- `app/(tabs)/index.tsx`, `app/(tabs)/_layout.tsx`, `app/compra/[id].tsx`, `app/(tabs)/resumo.tsx` — layout e composição de tela.
- Possível componente novo `src/presentation/components/icone-tab.tsx` (ou similar) para os SVGs da tab bar e dos ícones de busca/adicionar da Despensa.
- Nova dependência: `react-native-svg` (motor de SVG, não biblioteca de ícones pronta — os paths vêm do design system).
- `openspec/changes/correcao-navegacao-nativa/{design.md,tasks.md,specs/chrome-de-navegacao/spec.md}` — precisa de revisão coordenada para não contradizer a decisão de ícone na tab bar (tratado como segunda etapa, via `/opsx:update correcao-navegacao-nativa`, depois que este proposal for aceito).
- Nenhum impacto em `src/domain/`, `src/infrastructure/`, banco de dados ou schema.
