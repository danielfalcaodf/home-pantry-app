## Context

O app desenha todo o seu chrome no conteúdo: `headerShown: false` em todas as rotas
(`app/_layout.tsx:24`), cada tela pinta o próprio cabeçalho, e a tab bar é a do Expo Router
com `tabBarStyle` customizado (`app/(tabs)/_layout.tsx:14`). Essa escolha é deliberada e está
registrada na capability `chrome-de-navegacao` — não está em discussão aqui.

O que falta é a contraparte dela. Quem esconde o header nativo assume a responsabilidade pelos
insets do sistema, e essa responsabilidade nunca foi assumida: `react-native-safe-area-context`
está instalada e não é importada em lugar nenhum. O mesmo vale para `expo-status-bar`.

Duas verificações feitas depois da auditoria mudaram o desenho da correção:

**O `SafeAreaProvider` já existe.** O Expo Router monta um na raiz da árvore
(`expo-router/build/ExpoRoot.js:79`) — a biblioteca é peer dependency dele, e a própria
documentação da Expo diz que só é preciso montar o provider à mão em projetos *sem* Expo
Router. Falta apenas o consumo.

**Ninguém controla a barra de status — nem o app, nem o sistema.** O tema nativo gerado
(`android/app/src/main/res/values/styles.xml`) declara `AppTheme` com
`parent="Theme.AppCompat.DayNight.NoActionBar"` e as duas barras transparentes, mas **sem**
`android:windowLightStatusBar`; o `Theme.App.SplashScreen` também não o define. Nenhum
`<StatusBar>` é montado em runtime. Sem nenhuma das duas declarações, o AOSP entrega conteúdo
claro incondicionalmente — foi o que as screenshots `qa/audit-07a` e `qa/audit-07b` capturaram,
com o sistema em modo **claro** (`adb shell cmd uimode night` → `Night mode: no`) e ícones
brancos idênticos nos dois temas do app.

Em aparelhos de alguns fabricantes os ícones parecem acompanhar o tema; é auto-contraste do
OEM sobre um app que não declarou nada. O defeito é a ausência de declaração, e o sintoma é
que a legibilidade fica a cargo do fabricante.

O tema já é resolvido corretamente e num único lugar.

`usePreferenciaDeTemaPersistida` roda uma
única vez no layout raiz (`app/_layout.tsx:39`), depois das migrations, e a splash só é
escondida quando `tudoPronto` (`:41-48`). O `ThemeProvider` combina a preferência persistida com
`useColorScheme()` do sistema em `resolverTema(preferencia, aparencia)`
(`src/presentation/theme/provider.tsx:37`) e publica o objeto de tokens. O ponto de acoplamento
para a barra de status já existe, portanto — só não é usado.

## Goals / Non-Goals

**Goals:**

- Nenhum elemento de conteúdo dentro da barra de status nem da faixa de gestos, em qualquer
  tela, em retrato e em paisagem.
- Conteúdo da barra de status derivado do tema efetivo do app, aplicado no mesmo quadro em que
  as cores do tema são aplicadas.
- Insets lidos do sistema em tempo de execução, nunca constantes.
- Correção na raiz: um provider e um lugar que resolve o estilo da barra, não um `paddingTop`
  copiado em cada tela.

**Non-Goals:**

- Reintroduzir o header nativo do React Navigation. A decisão de desenhar o cabeçalho no
  conteúdo permanece.
- Redesenhar qualquer tela, mudar espaçamentos internos, tipografia ou hierarquia visual. O
  conteúdo é o mesmo; só a origem dele muda.
- Corrigir os alvos de toque abaixo de 48dp (A-10, A-13) ou o posicionamento da ação primária no
  fluxo do `ScrollView` (A-09). São a change `correcao-acoes-fora-de-alcance`. Esta change
  garante que a ação não caia **na faixa de gestos**; garantir que ela seja **alcançável e
  tocável** é a outra.
- Suporte a iOS notch/Dynamic Island como escopo próprio — a solução é a mesma biblioteca e
  passa a funcionar de graça, mas a verificação desta change é em Android.

## Decisions

### 1. Nenhum `SafeAreaProvider` novo — o do Expo Router basta

Não se monta provider algum. O Expo Router já embrulha a árvore inteira em `SafeAreaProvider`
(`ExpoRoot.js:79`), acima tanto do grupo de abas quanto das rotas empilhadas — que é
justamente o alcance necessário, já que `app/produto/[id]` e `app/compra/*` desenham cabeçalho
próprio com botão de voltar (`chrome-de-navegacao`) e sofrem o mesmo corte no topo. A
`TelaErro` está sob a mesma raiz e também é coberta.

Alternativa descartada: montar um segundo provider dentro do `ThemeProvider`, como esta change
previa antes. Além de redundante, é ativamente nocivo — um `SafeAreaProvider` aninhado mede os
insets relativos ao *seu próprio* layout, não aos da janela, e o caminho mais comum para isso
é entregar inset zero em todas as bordas. Seria trocar um defeito visível por um silencioso.

O que resta, então, é só consumo — o que reduz o diff desta change ao que a decisão 2 descreve.

### 2. Insets consumidos por um componente de tela, não espalhados

Em vez de cada tela chamar `useSafeAreaInsets()` e somar padding à mão — que é o caminho para
esquecer uma tela e para os números divergirem —, o consumo fica concentrado. Duas frentes:

- **Topo**: as telas que desenham cabeçalho no conteúdo passam a fazê-lo dentro de um
  `SafeAreaView edges={['top']}` (ou equivalente do design system). São as quatro abas mais as
  rotas empilhadas.
- **Base**: a tab bar recebe o inset inferior via `tabBarStyle`, de forma que o fundo continue
  se estendendo até a borda física mas os ícones e rótulos parem acima da faixa de gestos.
  Telas fora do grupo de abas que ancoram botão na base usam `edges={['bottom']}`.

Alternativa descartada: um `SafeAreaView` único envolvendo tudo na raiz. Isso pintaria a faixa
de gestos com a cor de fundo e cortaria a tab bar do fundo dela, que é justamente o visual que
o Android espera *não* ver — a tab bar deve sangrar por baixo, só o conteúdo dela não.

### 3. `<StatusBar />` derivado do tema efetivo, não de `useColorScheme()`

O `ThemeProvider` hoje calcula `resolverTema(preferencia, aparencia)` internamente
(`provider.tsx:37`) mas só publica o objeto de tokens — o **nome** do modo resolvido
(`claro`/`escuro`) não sai do `useMemo`. Passa a sair, por um `useModoDeTema()` ao lado de
`useTheme()`, e um único `<StatusBar style={modo === 'escuro' ? 'light' : 'dark'} />` é montado
junto do provider.

Isso é o ponto inteiro da correção: hoje o app tem **zero** fontes de verdade para o conteúdo
da barra de status. Não é que a fonte esteja errada — não existe fonte. O que preenche o vazio
é o padrão do AOSP (branco sempre) ou a heurística de auto-contraste do fabricante, conforme o
aparelho. Derivar a barra do mesmo `resolverTema` que governa os tokens cria a fonte única que
falta e torna o resultado igual em qualquer aparelho.

Alternativa descartada: `style="auto"` do `expo-status-bar`. Parece a resposta óbvia e não é —
por documentação, `auto` escolhe pelo color scheme **ativo do sistema**, exatamente o valor que
este app deliberadamente não segue. Num aparelho com sistema escuro e app no tema Claro, `auto`
entrega conteúdo claro sobre fundo Porcelana: o defeito de novo, agora por escrito.

Alternativa descartada: manter `app.json` como controle e só ajustar `userInterfaceStyle`.
Não resolve — essa chave é estática e não conhece a preferência que vive no SQLite.

Alternativa descartada: `StatusBar` por tela. Multiplica o mesmo cálculo por N telas e
reintroduz o risco de divergência que a change está eliminando.

### 3b. O primeiro quadro precisa do config plugin, não do runtime

Um `<StatusBar>` em React só age depois que o React monta. Antes disso vale o tema nativo, e
nenhum dos dois (`AppTheme`, `Theme.App.SplashScreen`) declara `windowLightStatusBar`. Para
que não exista um quadro de abertura com a barra errada, o valor inicial é fixado pelo config
plugin do `expo-status-bar` em `app.json` (`{"style": "..."}`), que escreve o atributo no tema
nativo em tempo de build.

Como é estático, esse valor não pode acertar as duas preferências — escolhe-se o que casa com
o fundo da splash (`#208AEF`, azul escuro → conteúdo claro), e o runtime corrige no primeiro
quadro do React. Isso exige um build novo para valer, e é a única parte desta change que não
se resolve em JavaScript.

### 4. Nada de constante de altura

`SafeAreaProvider` já entrega os valores reais. Os números desta proposta (63px de barra de
status, 126px de faixa de gestos, y=2274) são **critério de verificação** no emulador de
referência, não valores a codificar. Um `paddingTop: 63` passaria no teste e quebraria em
qualquer outro aparelho.

### 5. Verificação por bounds, não por screenshot

A prova é `mcp__maestro__inspect_screen` comparando `b` (bounds) de cada nó contra os limites
do sistema — é medição, reproduzível e não depende de comparação visual. Os screenshots
continuam como evidência para o A-14, onde o defeito é de contraste e não de posição.

Para o A-14 há uma condição a mais: a verificação vale no **emulador AOSP**, onde o
comportamento é determinístico e o defeito reprodutível. Um aparelho com auto-contraste de
fabricante mostra a barra legível mesmo sem a correção — testar só lá dá falso verde. O
aparelho OEM entra como verificação complementar, para confirmar que a declaração explícita do
app não briga com a heurística do fabricante.

## Risks / Trade-offs

- **[Cada tela ganha padding no topo e o conteúdo "desce", mudando o enquadramento]** →
  É o efeito pretendido, mas altera o primeiro quadro de todas as telas. Mitigação: o
  `takeScreenshot` de cada tela nos dois temas, antes e depois, entra nas tasks — e a régua é o
  design (`FRONTEND-DESIGN`), não "ficou parecido com antes".

- **[`SafeAreaView` dentro de `ScrollView` aplica o inset ao conteúdo rolável e o padding
  "rola junto"]** → Aplicar o inset ao contêiner externo, nunca ao conteúdo do scroll. Nas
  telas em que o cabeçalho rola junto (o formulário é uma delas, verificado na auditoria), o
  inset vai no wrapper da tela.

- **[A faixa de gestos ainda não é o mesmo em navegação por três botões]** → Por isso o valor
  vem do sistema. O teste manual precisa cobrir os dois modos de navegação do Android; fica
  como task explícita.

- **[Mexer no `_layout.tsx` raiz toca o caminho de abertura, que já tem uma ordem delicada
  (migrations → tema → fontes → esconder splash)]** → O `StatusBar` entra **dentro** do
  `ThemeProvider`, depois de `tudoPronto`, sem alterar a ordem nem as condições existentes. A
  capability `tema-e-tokens` já cobre "abertura sem flash" e ganha um cenário novo para a barra
  de status; o teste existente é a rede de segurança.

- **[O A-14 não reproduz em todo aparelho, o que pode fazer a correção parecer desnecessária]**
  → Em aparelhos com auto-contraste de fabricante a barra já aparece legível hoje. Não é o app
  funcionando: é o fabricante compensando uma omissão. Os critérios de aceite são escritos
  como "o conteúdo da barra contrasta com o fundo do tema do app, em qualquer aparência do
  sistema", nunca como "sistema escuro + app claro" — essa condição não é o gatilho do defeito
  e escreveria um teste que passa vazio.

- **[O config plugin do `expo-status-bar` só vale em build novo]** → O valor inicial da barra
  é atributo de tema nativo. Trocá-lo não chega por atualização de JS: exige rebuild do dev
  client e um build novo em produção. A parte de runtime funciona sem isso; só o primeiro
  quadro depende do build.

- **[Escopo de arquivos amplo — toca praticamente toda tela]** → Mas o diff por tela é de uma
  a duas linhas, e a lógica fica em dois pontos. É o oposto de uma correção espalhada: a
  amplitude vem da causa ser única e global.

## Migration Plan

Não há migração de dados nem de schema. Não toca `src/domain/`, `src/application/` nem
`src/infrastructure/` — a regra de dependência permanece intacta e
`npm run verificar:fronteiras` deve continuar limpo.

A parte de árvore de componentes é aplicável e reversível por deploy normal. A exceção é o
config plugin do `expo-status-bar` no `app.json` (decisão 3b): é atributo de tema nativo,
exige rebuild do dev client para ser verificado e um build novo para chegar em produção.

## Open Questions

- A `TelaErro` e as rotas empilhadas usam algum wrapper de tela em comum hoje, ou cada uma
  monta a própria `View` raiz? Se houver um wrapper, ele é o lugar único do inset de topo e o
  diff encolhe bastante; se não houver, criar um é parte da correção na raiz — e não uma
  abstração especulativa, já que existem pelo menos oito consumidores reais.
