## Why

O app roda hoje com o chrome de navegação padrão do Expo Router ligado, mas nenhuma tela foi desenhada para ele: o design (protótipo funcional `Repor.dc.html` em claude.ai/design e `FRONTEND-DESIGN-app-estoque-de-casa.md`) assume telas sem header nativo, com título e botão "voltar" desenhados dentro do próprio conteúdo, e uma tab bar só de texto. Como resultado, toda tela mostra um header nativo com o nome literal do arquivo de rota (`(tabs)`, `produto/[id]`, `novo`, `[id]`) e a tab bar mostra o ícone de aviso `MissingIcon` do React Navigation nas três abas. Isso foi confirmado comparando screenshots do app rodando no emulador com o protótipo e com o código-fonte do `expo-router`.

## What Changes

- Esconder o header nativo (`headerShown: false`) no `Stack` raiz (`app/_layout.tsx`), já que nenhuma tela foi desenhada para usá-lo.
- Adicionar um botão "←" explícito, desenhado no conteúdo (mesmo padrão visual do protótipo: `font-weight 600`, ao lado do título), nas telas que hoje dependem do botão de voltar nativo: `app/produto/[id].tsx` (Detalhe do produto), `app/produto/novo.tsx` via `FormularioProduto` (Cadastrar produto) e `app/compra/[id].tsx` (Modo compra). Sem esse botão, esconder o header quebraria a navegação de volta nessas três telas.
- Suprimir o ícone padrão da tab bar em `app/(tabs)/_layout.tsx` (`tabBarIcon: () => null` ou equivalente), alinhando com o wireframe do design (`FRONTEND-DESIGN-app-estoque-de-casa.md`, tab bar só com os rótulos "Despensa · Lista · Resumo", sem ícones) e evitando o fallback `MissingIcon`.
- Nenhuma mudança em cores, tokens, tipografia, espaçamento ou no componente de medidor (linha d'água) — já conferem com o design.

## Capabilities

### New Capabilities
- `chrome-de-navegacao`: comportamento do header nativo e da tab bar em todas as rotas do app — cobre quando o header nativo fica oculto, quais telas desenham seu próprio botão de voltar, e a ausência de ícones na tab bar.

### Modified Capabilities
(nenhuma — não há spec existente cobrindo header nativo ou tab bar)

## Impact

- `app/_layout.tsx` — `screenOptions` do `Stack` raiz.
- `app/(tabs)/_layout.tsx` — `screenOptions`/`Tabs.Screen` da tab bar.
- `app/produto/[id].tsx`, `app/produto/novo.tsx`, `app/compra/[id].tsx` — cabeçalho de conteúdo com botão "←".
- Possivelmente `src/presentation/components/formulario-produto.tsx`, se o botão "←" do Cadastrar produto/Detalhe do produto for extraído para um componente compartilhado (a decidir em design.md).
- Nenhum impacto em `src/domain/`, `src/infrastructure/`, banco de dados ou schema.
