## 1. Componente de voltar compartilhado

- [x] 1.1 Criar `src/presentation/components/botao-voltar.tsx`: seta "←", `font-weight 600`, cor `tema.text.primary`, alvo de toque mínimo 48×48dp, `accessibilityRole="button"` com `accessibilityLabel="Voltar"`, chama `router.back()`.
- [x] 1.2 Teste do componente (`botao-voltar.test.tsx`): renderiza, dispara `router.back()` ao tocar, expõe o `accessibilityLabel` correto.

## 2. Header nativo oculto

- [x] 2.1 Em `app/_layout.tsx`, adicionar `headerShown: false` a `screenOptions` do `Stack` raiz.

## 3. Botão de voltar nas telas empilhadas

- [x] 3.1 `app/produto/[id].tsx`: adicionar `BotaoVoltar` no topo do conteúdo, antes do bloco de quantidade grande.
- [x] 3.2 `app/produto/novo.tsx` / `FormularioProduto`: adicionar prop opcional de cabeçalho (título + `BotaoVoltar`) usada só por `novo.tsx`, exibindo "Novo produto" como no protótipo.
- [x] 3.3 `app/compra/[id].tsx`: adicionar `BotaoVoltar` no topo do conteúdo, ao lado do título "Compra".
- [x] 3.4 Conferir que `app/produto/lista-base.tsx` (Onboarding) não precisa de botão de voltar próprio — confirmado: é aberta só a partir do estado vazio da Despensa (`app/(tabs)/index.tsx:119`), sem seta explícita no protótipo; navegação de volta continua pelo gesto/botão físico do sistema.

## 4. Tab bar sem ícones

- [x] 4.1 Em `app/(tabs)/_layout.tsx`, adicionar `tabBarIcon: () => null` a `screenOptions` do `Tabs`.

## 5. Verificação manual no emulador

- [x] 5.1 Rodar o app no emulador Android e navegar por Despensa, Lista, Resumo, Detalhe do produto, Cadastrar produto e Modo compra, confirmando que nenhum header nativo com nome de rota aparece. Verificado via screenshots `adb` (emulador `expo-dev`, headless): nenhuma tela mostra header nativo com nome de arquivo/rota.
- [x] 5.2 Confirmar que o botão "←" funciona (volta para a tela anterior) em Detalhe do produto, Cadastrar produto e Modo compra. Confirmado nas três telas — toque no botão volta para a tela anterior correta (Despensa, Despensa, Lista).
- [x] 5.3 Confirmar que a tab bar não mostra nenhum ícone (nem customizado, nem o aviso `MissingIcon`) nas três abas. Confirmado — só rótulos de texto.
- [x] 5.4 Confirmar que o botão físico/gesto de voltar do Android ainda funciona normalmente em todas as telas (o header oculto não deve afetar isso). Confirmado — `KEYCODE_BACK` navega corretamente de volta (Novo produto → Lista).

## 6. Conformidade do repositório

- [x] 6.1 Rodar `npm run verificar` (fronteiras + lint + typecheck) e `npm test` — sem regressões. `npm run verificar` passou limpo. `npm test`: 2 falhas pré-existentes e não relacionadas (`historico-de-compras.test.ts` e `use-gasto-mensal.test.ts`, ambos sensíveis a fuso horário/data corrente — falham igualmente na branch base, antes desta change).
