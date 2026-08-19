# Correção das bordas do sistema (safe area e barra de status)

**Type:** Correção de Bug

## Why

O app nunca ligou as duas bibliotecas que existem justamente para reconciliá-lo com o chrome
do sistema Android. `react-native-safe-area-context` e `expo-status-bar` estão no
`package.json`, mas `grep -rl SafeArea src app` e `grep -rn StatusBar src app` não retornam
nada. Consequência medida no emulador (1080×2400 @ 420dpi, density 2.625): conteúdo passa por
baixo do relógio no topo, botões primários caem dentro da faixa de gestos embaixo, e o
conteúdo da barra de status é branco nos dois temas — sobre o fundo Porcelana, ilegível.

Não é polimento: são elementos tocáveis dentro de uma faixa que o Android intercepta, e texto
do sistema ilegível. Afeta todas as telas de uma vez, o que faz desta a correção de maior
alcance do lote de auditoria — e a mais barata, porque a causa é uma só em dois pontos.

O A-04 ganhou urgência por mudança de plataforma, não por descuido: o projeto está em
Expo SDK 57 / React Native 0.86, e o Android passou a ter **edge-to-edge obrigatório** a
partir do SDK 54. A documentação de system bars da Expo é explícita — antes do edge-to-edge as
barras eram translúcidas e o conteúdo já nascia por baixo delas sem precisar de safe area;
com edge-to-edge, usar safe areas passou a ser necessário. O app atravessou essa mudança sem
adotar a contraparte.

## What Changes

- **A-04 — conteúdo invade as duas bordas.** Nenhuma tela desconta os insets do sistema.
  Medições na auditoria:

  | Elemento | Bounds | Problema |
  |---|---|---|
  | Botão "Configurações" (header do Resumo) | `[782,42][1038,168]` | começa em y=42, dentro da barra de status (0→63): **21px sobrepostos** |
  | Título "Resumo" | `[42,68][270,142]` | 5px (≈2dp) de folga do relógio — encosta |
  | Rótulos da tab bar | `[75,2295][195,2332]` | inteiramente dentro da faixa de gestos (y ≥ 2274) |
  | "Adicionar à despensa" (form. expandido) | termina em ≈ y2334 | invade a faixa de gestos em ~60px |

  A faixa de gestos do Android tem 48dp (126px) e começa em y=2274; a barra de status ocupa
  os primeiros 63px. Passa a haver consumo de `useSafeAreaInsets()`/`SafeAreaView` nas bordas
  que hoje são cortadas. O `SafeAreaProvider` **não** precisa ser montado: o Expo Router já
  monta um na raiz da árvore (`expo-router/build/ExpoRoot.js:79`).

- **A-14 — conteúdo da barra de status não é controlado por ninguém.** O sintoma relatado foi
  "ilegível no tema Porcelana", mas a causa medida é mais ampla: o app não declara estilo de
  barra de status em lugar nenhum, nem nativamente nem em runtime.

  - `android/app/src/main/res/values/styles.xml` define `AppTheme` com
    `parent="Theme.AppCompat.DayNight.NoActionBar"`, `android:statusBarColor` e
    `android:navigationBarColor` transparentes, e **nenhum** item
    `android:windowLightStatusBar`. O `Theme.App.SplashScreen` também não define.
  - Nenhum `<StatusBar>` é montado em runtime.

  Sem nenhuma das duas declarações, o padrão do AOSP é conteúdo claro (branco) de forma
  incondicional. As duas screenshots da auditoria provam: `qa/audit-07a-tema-claro-despensa.png`
  e `qa/audit-07b-tema-escuro-despensa.png` foram tiradas com o modo noturno do sistema
  **desligado** (`adb shell cmd uimode night` → `Night mode: no`) e trazem relógio e ícones de
  wi-fi/sinal/bateria idênticos e brancos nos dois temas do app. No tema Porcelana isso é
  branco sobre `#F2F2F0`.

  Isso corrige o diagnóstico inicial, que atribuía o defeito a `app.json:9`
  `"userInterfaceStyle": "automatic"` e o descrevia como divergência entre o tema do app e o
  do sistema. A barra não segue o tema do app **nem** o do sistema — o sistema estava claro e
  os ícones vieram brancos.

  **Variação por aparelho (verificada em device real):** em aparelhos de alguns fabricantes
  (Xiaomi, Samsung) os ícones da barra *aparentam* acompanhar o tema, ficando pretos no claro e
  brancos no escuro. Isso é heurística de auto-contraste do OEM, aplicada por cima de um app
  que não declarou nada — não é comportamento do Repor. É por isso que o defeito some no
  aparelho de um e aparece no de outro, e é exatamente o motivo de corrigir: hoje a
  legibilidade da barra de status depende de um padrão indefinido de fabricante. Os critérios
  de aceite desta change, portanto, **não** podem ser escritos como divergência entre app e
  sistema, e precisam valer para qualquer aparência do sistema.

  Passa a existir um `<StatusBar style={...} />` derivado do **mesmo** tema que alimenta os
  tokens. O `style="auto"` do `expo-status-bar` não serve: por documentação ele escolhe pelo
  color scheme ativo do sistema, que é justamente o que este app não segue. E o estado inicial
  da barra — o quadro antes do primeiro render de React — só é endereçável pelo config plugin
  do `expo-status-bar` no `app.json`, já que nenhum dos dois temas nativos define
  `windowLightStatusBar`.

- Sem mudança de comportamento de produto: nenhuma tela nova, nenhum fluxo alterado. O que
  muda é onde o conteúdo começa e termina, e a cor do conteúdo da barra de status.

## Capabilities

### New Capabilities

- `bordas-do-sistema`: como o app respeita as áreas reservadas do sistema operacional —
  insets de barra de status e de navegação/gestos em todas as telas, e o estilo do conteúdo
  da barra de status derivado do tema efetivo do app.

### Modified Capabilities

- `tema-e-tokens`: o requisito "Preferência de tema persistida" passa a exigir que o tema
  efetivo do app governe também o conteúdo da barra de status, não só as cores da UI. Hoje
  nada governa esse conteúdo, e o resultado varia por fabricante de aparelho.
- `chrome-de-navegacao`: o requisito "Tab bar com ícone por aba" passa a exigir que a tab bar
  respeite o inset inferior, para que os rótulos e os alvos de toque não caiam dentro da faixa
  de gestos.

## Impact

- **Código**: `app/_layout.tsx` (`StatusBar` derivado do tema), `app.json` (config plugin do
  `expo-status-bar` para o estado inicial da barra), `app/(tabs)/_layout.tsx` (inset
  inferior da tab bar), telas que desenham header próprio no conteúdo (`app/(tabs)/index.tsx`,
  `lista.tsx`, `resumo.tsx`, `configuracoes.tsx`, e as rotas empilhadas sob `app/produto/` e
  `app/compra/`), e o ponto de leitura do tema antes de esconder a splash.
- **Dependências**: nenhuma nova — `react-native-safe-area-context` e `expo-status-bar` já
  estão instaladas e passam a ser efetivamente usadas.
- **Camadas**: só `presentation/` e `app/`. Nada em `domain/`, `application/`,
  `infrastructure/` — a regra de dependência não é tocada.
- **Testes**: os dois flows Maestro da auditoria (`.maestro/auditoria-ui-ux-android.yaml`,
  `.maestro/jornada-completa-caminho-feliz.yaml`) já rodam verdes e servem de baseline de
  regressão; as asserções de bounds entram como verificação nova.

### Dependências entre changes

Nenhuma. As duas outras changes ativas (`correcao-usabilidade-campos-e-botoes` e
`correcao-lista-de-compras`) estão 100% concluídas e já mergeadas em `develop` — continuam
ativas apenas porque `/opsx:archive` ainda não rodou. Os arquivos que elas tocaram
(`campo-texto.tsx`, `botao.tsx`, os sheets, `lista.tsx`, `item-lista.tsx`, `item-compra.tsx`)
não se sobrepõem aos layouts e ao provider de tema que esta change altera. Entra como Ordem 3
no `ORDER.md`, sem "Depende de".
