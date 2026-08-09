## Context

O projeto "Repor Design System" (claude.ai/design `aca58fcf-dc7d-4d76-a375-b1aa5a3dc816`) contém componentes prontos (`components/*.jsx`), tokens (`tokens/*.css`) e telas de referência montadas (`ui_kits/repor-app/*.jsx`: `PantryScreen`, `ProductDetailScreen`, `PurchaseModeScreen`, `ShoppingListScreen`, `SummaryScreen`, `TabBar`). Comparando esses arquivos com o código atual (`app/`, `src/presentation/`), a fundação já bate: `tokens/colors.css` tem os mesmos hex de `src/presentation/theme/tokens.ts`; `ItemDespensa.jsx` do design replica exatamente `estadoDoItem`/`alturaDoNivel` de `domain/produto/estoque.rules.ts`; o vocabulário ("Usei"/"Repus"/"Falta N"/"Acabou"/"Cheio") já é o mesmo dos dois lados. As divergências reais estão em quatro telas específicas, detalhadas abaixo.

## Goals / Non-Goals

**Goals:**
- Cabeçalho da Despensa com ícones (buscar, adicionar) em vez de campo de busca sempre visível + link de texto.
- Tab bar com ícone por aba (reabre a decisão do change `correcao-navegacao-nativa`, que havia optado por texto puro).
- Rodapé do Modo compra reposicionado para o final da tela, acima do botão "Fechar compra".
- Resumo com "Gasto este mês" como métrica grande e um mini gráfico de barras dos últimos meses.

**Non-Goals:**
- Não reduzir o formulário de Detalhe do produto aos 2 campos da maquete simplificada — a maquete no design system é ilustrativa, o formulário real (marca, observação, remover, "Outra quantidade") continua existindo.
- Não introduzir biblioteca de ícones prontos (`@expo/vector-icons` ou similar) — os ícones vêm como paths SVG do próprio design system, renderizados via `react-native-svg`.
- Não mexer em `domain/`, `application/` (fora de leitura de dados já expostos) nem no schema do banco.
- Não implementar drill-down/interação no gráfico de barras do Resumo (é só leitura, sem toque) — não há requisito para isso em `resumo-de-valores`.

## Decisions

**1. `react-native-svg` como motor de ícone, paths copiados do design system.**
O design system usa `<svg>` com `<path>` cru (ex.: ícone de busca `M11 19a8 8 0 100-16...`, tab Despensa `M4 8h16M4 8v10a1...`). Não existe hoje `react-native-svg` no projeto. Alternativa considerada: `@expo/vector-icons` (Ionicons/Feather) — rejeitada porque o design não usa nenhum ícone de biblioteca padrão, os paths são desenhados sob medida para o produto (ex.: o ícone da aba Despensa é uma casinha estilizada específica), e trocar por um ícone genérico de lib divergiria visualmente. `react-native-svg` é a peça mínima que falta para desenhar exatamente os paths do design.

**2. Componente `IconeSvg` compartilhado, não um componente por ícone.**
Um componente `src/presentation/components/icone-svg.tsx` recebe `path` (ou array de paths) e `cor`, e monta `<Svg><Path .../></Svg>`. Evita 6+ arquivos quase idênticos (3 ícones de aba + buscar + adicionar + voltar, que o `correcao-navegacao-nativa` também usa). Os paths em si (strings SVG) ficam num arquivo de dados `src/presentation/theme/icones.ts`, não espalhados pelos componentes de tela — mesmo padrão de `tokens.ts` centralizando valores de tema.

**3. Busca e "Conferência" saem do cabeçalho principal da Despensa, mas continuam alcançáveis.**
O design mostra só dois ícones no cabeçalho (buscar, adicionar) — sem link de texto. Decisão: o ícone de busca abre/fecha inline o `CampoTexto` já existente (toggle, sem tela nova); "Conferência" deixa de ter link fixo no cabeçalho da Despensa e passa a ficar acessível a partir da tela de Configurações (`app/configuracoes.tsx`), que já concentra ações de baixa frequência — coerente com o comentário já existente no código ("alcançável, mas fora do caminho crítico"). Alternativa considerada: manter "Conferência" como terceiro ícone no cabeçalho — rejeitada por não ter equivalente na maquete do design e por adicionar um terceiro slot de ícone que não existe lá.

**4. Chip "Cheio" removido, contagem de "Faltando" passa a somar crítico + em falta.**
O design mostra 3 chips (`Tudo`/`Acabou`/`Faltando`), com a contagem de "Faltando" somando itens críticos e em falta (`ItemDespensa.jsx`/`PantryScreen.jsx`: `faltando + critico`). O spec `tela-despensa` já existente não exige um chip por estado (exige "chips de filtro por estado, cada um com a contagem") — reduzir para 3 não quebra nenhum requisito formal, mas muda o comportamento do filtro "Faltando" (hoje filtra só `emFalta`, precisa passar a filtrar `emFalta` OU `critico`). Isso é uma mudança de requisito em `tela-despensa` e por isso está listado como Modified Capability no proposal.

**5. Rodapé do Modo compra: mover, não duplicar.**
Hoje `<RodapeCompra>` é renderizado logo após o cabeçalho, antes da `ScrollView`. Passa a ser renderizado depois da `ScrollView`, imediatamente acima dos botões "Fechar compra"/"Cancelar compra" — um único componente reposicionado, sem duplicar a contagem/total em dois lugares.

**6. Gráfico de barras do Resumo: `View`s com altura proporcional, sem lib de gráfico.**
O design monta o gráfico com 4 `<div>` de largura igual (`flex: 1`) e altura em `%` proporcional ao maior valor do período (`(v / max) * 100`). Replicável 1:1 em React Native com `View` (`flexDirection: 'row', alignItems: 'flex-end'`) — não precisa de `victory-native`, `react-native-svg-charts` nem similar. Os dados já existem via `useGastoMensal()`; só muda a apresentação de "lista de linhas" para "barras + métrica grande do mês corrente".

## Risks / Trade-offs

- **[Risco] Mudar o filtro "Faltando" para somar crítico+emFalta pode confundir quem já usa o chip "Cheio" hoje para conferir o que está completo.** → Mitigação: "Cheio" continua sendo um estado real e um rótulo (`rotuloDoItem`), só deixa de ter chip próprio na Despensa — o filtro "Tudo" sem nenhum chip ativo já mostra tudo, incluindo os cheios, agrupado por categoria.
- **[Risco] Adicionar `react-native-svg` é uma nova dependência nativa (requer rebuild do development build via EAS, não só JS).** → Mitigação: é uma lib madura, já dependência transitiva comum no ecossistema Expo/React Navigation; o projeto já faz rebuilds de dev client para outras libs nativas (ex. `expo-dev-client` já em uso). Task de conformidade cobre rodar o build antes de considerar a task concluída.
- **[Risco] Este change e o `correcao-navegacao-nativa` (ainda não arquivado) mexem no mesmo arquivo (`app/(tabs)/_layout.tsx`) com decisões contraditórias sobre ícone.** → Mitigação: antes de aplicar este change, `correcao-navegacao-nativa` precisa ser atualizado (via `/opsx:update correcao-navegacao-nativa`) para refletir "ícone SVG" em vez de "sem ícone" — tratado como pré-requisito de sequenciamento, não implementado aqui.

## Open Questions

- Mover "Conferência" para Configurações é a decisão tomada aqui por analogia com o padrão já comentado no código; se o usuário preferir manter um atalho mais rápido (ex. dentro do próprio ícone de busca expandido, ou um terceiro ícone), isso é fácil de revisar antes da fase de tasks/apply.
