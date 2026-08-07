## Context

O app usa Expo Router com um `Stack` raiz (`app/_layout.tsx`) envolvendo um grupo de abas (`app/(tabs)/_layout.tsx`, com `Tabs`) e rotas empilhadas (`app/produto/[id].tsx`, `app/produto/novo.tsx`, `app/compra/[id].tsx`, `app/produto/lista-base.tsx`). Nenhuma tela define `options.headerShown` nem `options.title`, então o Expo Router usa o comportamento padrão: header nativo visível, com título derivado do nome do arquivo/segmento de rota. O design do produto (protótipo `Repor.dc.html` e `FRONTEND-DESIGN-app-estoque-de-casa.md`) nunca previu esse header nativo — todas as telas do protótipo desenham o próprio título dentro do conteúdo, e as telas empilhadas (Detalhe do produto, Modo compra, Cadastrar produto) desenham um botão "←" explícito ao lado do título.

Da mesma forma, `app/(tabs)/_layout.tsx` declara `Tabs.Screen` para as três abas sem `tabBarIcon`. O Expo Router (`expo-router/build/react-navigation/bottom-tabs/views/BottomTabBar.js`) faz fallback para o componente `MissingIcon` sempre que `options.tabBarIcon` não é informado — não existe um "modo sem ícone" implícito. O wireframe do design (`FRONTEND-DESIGN-app-estoque-de-casa.md`, tab bar `Despensa · Lista · Resumo`) mostra uma tab bar só com rótulos de texto, sem nenhum ícone.

## Goals / Non-Goals

**Goals:**
- Header nativo do Expo Router oculto em todas as rotas, sem vazar nomes de arquivo/segmento na UI.
- Nenhuma navegação de volta quebrada: toda tela que hoje depende do botão nativo de voltar recebe um "←" equivalente desenhado no conteúdo.
- Tab bar sem o ícone de aviso `MissingIcon` — visualmente igual ao wireframe do design (texto apenas).

**Non-Goals:**
- Não introduzir biblioteca de ícones (`@expo/vector-icons` ou similar) — o design não pede ícones na tab bar, e instalar uma lib só para isso seria escopo além do que o bug pede.
- Não alterar cores, tokens, tipografia, espaçamento, raio ou o componente de medidor (linha d'água) — já conferem com o design.
- Não implementar a tela Resumo (é stub intencional, rastreado pela change `resumo-valores-e-historico`, fora de escopo aqui).
- Não mudar a estrutura de rotas em si (nomes de arquivo, agrupamentos) — só o chrome visual em torno delas.

## Decisions

**1. Esconder o header no nível do `Stack` raiz, não tela a tela.**
`app/_layout.tsx` passa `headerShown: false` em `screenOptions` do `<Stack>`. Alternativa considerada: esconder por `Stack.Screen` individual — rejeitada porque exigiria listar toda rota presente e futura manualmente, e o design não usa header nativo em nenhuma tela do app (não é uma exceção pontual).

**2. Botão "←" como componente compartilhado `BotaoVoltar`, não duplicado em cada tela.**
As três telas que precisam do botão (Detalhe do produto, Cadastrar produto, Modo compra) usam o mesmo padrão visual do protótipo: seta, `font-weight 600`, cor `tema.text.primary`, alvo de toque ≥ 48×48dp (regra de `ALVO_TOQUE_MINIMO`), chamando `router.back()`. Um componente novo em `src/presentation/components/botao-voltar.tsx` evita repetir esse bloco três vezes e mantém o alvo de toque mínimo consistente. Alternativa considerada: inline em cada tela — rejeitada por duplicar a mesma lógica de acessibilidade (rótulo "Voltar", `accessibilityRole="button"`) três vezes.

**3. `FormularioProduto` ganha um cabeçalho opcional (título + voltar), controlado por quem o usa.**
`FormularioProduto` é compartilhado entre `produto/novo.tsx` (Cadastrar produto) e `produto/[id].tsx` (Detalhe do produto, via campos do formulário abaixo da seção Usei/Repus). O protótipo mostra cabeçalho "← Novo produto" só na tela de cadastro; o Detalhe do produto já tem seu próprio cabeçalho definido em `produto/[id].tsx` (quantidade grande + rótulo), então o botão "←" ali é adicionado diretamente em `produto/[id].tsx`, fora do `FormularioProduto`. `FormularioProduto` recebe uma prop opcional para o título do cabeçalho (usada só por `novo.tsx`), evitando forçar `produto/[id].tsx` a exibir dois títulos.

**4. `tabBarIcon: () => null` em vez de omitir a prop.**
Confirmado no código-fonte do `expo-router` que omitir `tabBarIcon` aciona o fallback `MissingIcon`; só passar uma função que retorna `null` suprime completamente o slot de ícone. Isso é feito em `screenOptions` do `<Tabs>` (uma vez, para as três abas), não repetido em cada `Tabs.Screen`.

## Risks / Trade-offs

- **[Risco] Esconder o header remove o gesto nativo de "voltar" com swipe-from-edge em iOS/Android que alguns usuários esperam.** → Mitigação: o `router.back()` do botão "←" continua funcionando, e o gesto de sistema (botão de voltar do Android, swipe do sistema operacional) continua funcionando independente do header nativo — só o header visual (barra com título e seta) some, não a navegação em si.
- **[Risco] Novas rotas futuras podem esquecer de desenhar o próprio título/voltar, já que o header nativo não vai mais fazer isso por padrão.** → Mitigação: como o app já segue esse padrão em todas as telas hoje implementadas (Despensa, Lista, Modo compra em texto, Detalhe, Cadastro, Onboarding), o precedente já está estabelecido; não é uma mudança de convenção, é uma correção para bater com o que já é praticado.

