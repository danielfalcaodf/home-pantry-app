## Context

Os cinco painéis inferiores do app seguem o mesmo molde:
`<Modal transparent animationType="slide">` envolvendo um `<EvitaTeclado>`
(`sheet-preco-produto.tsx:48`, `sheet-avulso.tsx:74/:80`, `teclado-quantidade.tsx:59/:65`,
`sheet-ajuste-compra.tsx:69/:71`, `sheet-ajuste-estoque.tsx:70/:76`).

`EvitaTeclado` (`src/presentation/components/evita-teclado.tsx`) é um wrapper fino sobre o
`KeyboardAvoidingView` de `react-native-keyboard-controller`, com `behavior="padding"` e
`automaticOffset`. Foi criado pela change `correcao-usabilidade-campos-e-botoes` exatamente
para este problema, e o comentário no próprio arquivo (`:16-19`) afirma que a lib passou a
suportar `Modal` a partir da 1.13.

O aparelho contradiz o comentário. Com a lib **1.21.9**, o teclado cobre os cinco painéis por
inteiro. E as hipóteses ambientais mais óbvias já foram descartadas na auditoria:

- o binário auditado **contém** as correções: `HEAD` inclui `90ae47a` (PR #34) e `7de9b53`
  (PR #35), e o dev client foi reconstruído dessa árvore com `expo prebuild --clean`;
- `android/app/src/main/AndroidManifest.xml:19` já declara `windowSoftInputMode="adjustResize"`;
- `formulario-produto.tsx`, que usa o **mesmo** `EvitaTeclado` fora de um `<Modal>`, funciona
  perfeitamente.

O que sobra é a diferença estrutural: `<Modal>` do RN é uma janela nativa separada, e o
`KeyboardProvider` está montado na raiz da árvore de rotas (`app/_layout.tsx:53` e `:70`), fora
dela.

A alegação de suporte a `Modal` não é vaga, e a pesquisa nos docs oficiais (context7,
`kirillzyusko/react-native-keyboard-controller`) já responde a pergunta que ficaria em aberto
aqui. O changelog da versão 1.13 (`docs/blog/2024-08-16-release-1-13`, seção "Key features >
Modal support on Android") descreve exatamente a causa estrutural acima — "Modal exists in its
own view hierarchy and React Native forces an adjustResize mode on it" — e afirma que a partir
dessa versão isso foi resolvido "without requiring extra configuration or workarounds". Não é
a lib exagerando nem regressão: é este projeto não atender alguma pré-condição que a doc não
deixa óbvia. A pesquisa encontrou uma candidata concreta — ver hipótese D abaixo — o que muda o
diagnóstico de "decidir entre regressão ou limitação" para "achar a pré-condição não atendida".

## Goals / Non-Goals

**Goals:**

- Campo em foco e ação de confirmar visíveis acima do teclado nos cinco painéis.
- Painel de digitação de valor abre com o teclado já visível.
- Correção **na raiz**: um mecanismo compartilhado pelos cinco, não cinco ajustes locais.
- Verificação medida no aparelho, que é o que faltou da primeira vez.

**Non-Goals:**

- Redesenhar os painéis, mudar conteúdo, ordem de campos ou vocabulário.
- Trocar o padrão de painel inferior por navegação para tela cheia.
- Mexer em `formulario-produto.tsx`, que não é afetado.
- Corrigir a posição do botão do formulário (A-09) — é `correcao-acoes-fora-de-alcance`.

## Decisions

### 1. Diagnosticar antes de escolher a saída

Primeira tarefa, obrigatória: determinar por que a lib não compensa dentro do `<Modal>` neste
projeto. Quatro hipóteses concretas e testáveis — não mais mutuamente excludentes, porque a
pesquisa já encontrou uma candidata (D) que pode coexistir com qualquer uma das outras três:

1. **O provider não alcança a janela do Modal** — a leitura estrutural. Teste: montar um
   `KeyboardProvider` dentro de um dos Modals e ver se aquele painel passa a compensar.
2. **`automaticOffset` + `behavior="padding"` não é a combinação certa dentro de Modal** —
   teste: variar `behavior` e desligar `automaticOffset` num painel isolado. Prioridade
   elevada pela pesquisa: `automaticOffset` **não é o recurso que a 1.13 corrigiu**. Ele só foi
   introduzido na linha 1.21 (`docs/blog/2026-03-16-release-1-21`, "Other notable changes >
   automaticOffset for KeyboardAvoidingView"), que calcula o deslocamento a partir de "native
   APIs to detect the component's absolute screen position". O comentário em
   `evita-teclado.tsx:16-19` atribui a correção do Modal à 1.13, mas o prop realmente em uso é
   ~6 minors mais novo e nunca foi validado pela própria lib nesse cenário específico.
3. **Regressão entre 1.13 e 1.21.9** — teste: comparar com o exemplo oficial da lib.
4. **`statusBarTranslucent`/`navigationBarTranslucent` ausentes no `KeyboardProvider`** — ver
   detalhe abaixo. Diferente das outras três, esta não é excludente: pode estar errada *junto*
   com qualquer uma delas, porque afeta a matemática de offset da lib como um todo, não só
   dentro do Modal.

Isto está aqui como decisão, e não como "investigar depois", porque a change anterior falhou
justamente por aplicar a correção esperada sem medir o resultado. Sem esse diagnóstico
qualquer escolha abaixo é chute.

#### Hipótese D — status bar e navigation bar transparentes sem o app avisar a lib

O `KeyboardProvider` do projeto (`app/_layout.tsx:53` e `:70`) é montado sem
`statusBarTranslucent` nem `navigationBarTranslucent`. A documentação do prop
(`src/types/provider.ts`) é direta: *"Set the value to `true`, if you use translucent status
bar on Android... Defaults to `false`"*, com referência ao issue #14 do repositório da lib. O
app tem as duas barras transparentes — `android/app/src/main/res/values/styles.xml` declara
`android:statusBarColor` e `android:navigationBarColor` como `@android:color/transparent`
(achado feito na change irmã `correcao-bordas-do-sistema`, Ordem 3, que corrige o consumo dos
insets do lado de `presentation/`).

O código nativo Android da lib (`EdgeToEdgeReactViewGroup.kt`) confirma o efeito:

```kotlin
if (this.isStatusBarTranslucent) 0 else systemBarInsets.top
```

Sem o prop, a lib aplica margem de topo como se a status bar ocupasse espaço físico — quando na
verdade não ocupa, porque o app já é edge-to-edge. Isso desalinha a base de cálculo que o
`automaticOffset` usa para detectar a posição absoluta do componente na tela.

Isto **não** explica sozinho por que só dentro do Modal quebra — o `KeyboardProvider` é único,
na raiz, e afetaria `formulario-produto.tsx` da mesma forma, que funciona. Por isso não
substitui a causa estrutural do Modal como hipótese principal. Mas é um defeito real,
documentado, específico deste app e barato de corrigir — e por não ser excludente das outras
três, a correção dos dois props é obrigatória **independente** de qual saída for escolhida
para o Modal em si (grupo 2, tarefa nova).

### 2. Saída preferida: `OverKeyboardView` no lugar do `<Modal>`

A doc oficial descreve `OverKeyboardView` como alternativa ao `Modal` cuja razão de existir é
exatamente esta — exibir conteúdo sobre o teclado sem fechá-lo — e registra que ele
**funciona independentemente do `KeyboardProvider`**. Isso ataca a hipótese 1 na raiz, em vez
de contorná-la.

Há evidência adicional, não conclusiva mas consistente, de que `OverKeyboardView` não herda o
isolamento estrutural do `<Modal>` do React Native. A doc de introdução do componente
(`docs/blog/2024-10-01-over-keyboard-view`) descreve seu propósito como eliminar "instant
keyboard transitions, visual jumps" ao renderizar "over the keyboard" — sem abrir uma nova
janela Dialog separada como o `Modal`, e sim permanecendo na mesma janela raiz. E a doc da
1.21 já cita `automaticOffset` sendo usado internamente por `KeyboardAwareScrollView` "to
improve scrolling precision in edge cases like inputs within modals or nested navigators" —
ou seja, a própria lib já testa essa técnica de posicionamento em cenários equivalentes ao dos
cinco sheets. Isso não é prova, mas é o oposto de um chute: a saída escolhida é a que a lib
mais investiu para funcionar no caso deste app.

Custo: `OverKeyboardView` não traz o backdrop, o `onRequestClose` do Android nem o
`animationType="slide"` de graça. Cada um precisa ser reconstruído no wrapper compartilhado —
o botão físico de Voltar fechando o painel é comportamento existente e não pode regredir.

Alternativa considerada: **montar `KeyboardProvider` dentro de cada `<Modal>`**. É o menor
diff se a hipótese 1 se confirmar, e mantém `Modal` com todo o comportamento nativo que ele já
dá. Fica como plano B — e vira plano A se o diagnóstico mostrar que reconstruir backdrop e
Voltar custa mais do que o provider aninhado. A decisão sai do resultado da tarefa 1, não daqui.

### 3. A mudança vive num componente só

Seja `OverKeyboardView` ou provider aninhado, a solução entra em **um** componente de painel
compartilhado, e os cinco sheets passam a consumi-lo. Hoje o molde
`<Modal><EvitaTeclado>…</EvitaTeclado></Modal>` está copiado cinco vezes; é essa duplicação
que fez o defeito ter cinco instâncias em vez de uma.

Alternativa descartada: corrigir os cinco arquivos individualmente. Mesmo diff total, e deixa
o sexto painel futuro nascer quebrado.

### 4. `autoFocus` (A-07) é tratado junto, não depois

O foco automático não levantar o teclado é o mesmo isolamento de janela visto de outro ângulo.
Se a saída 2 resolver o A-06, o A-07 provavelmente cai junto; se não cair, a correção é
explícita — chamar o foco após o painel estar montado e visível, em vez de confiar no
`autoFocus` declarativo. O critério de aceite é `mInputShown=true`, não a presença da prop.

### 5. Critério de aceite é medido, não inspecionado

Cada painel é verificado com `inspect_screen`: com o teclado aberto, os bounds do campo e do
botão de confirmar precisam estar acima do topo do teclado. É o teste que a change anterior
não tinha — ela verificou que `EvitaTeclado` estava presente, o que era verdade e insuficiente.

## Risks / Trade-offs

- **[`OverKeyboardView` perde backdrop, `onRequestClose` e animação de entrada]** →
  Reconstruir no wrapper compartilhado e cobrir com cenário de teste explícito, em especial o
  Voltar do Android fechando o painel (comportamento já existente, regressão inaceitável).

- **[Trocar `Modal` por outra técnica muda a ordem de renderização e pode afetar o toast e o
  háptico do caminho crítico]** → `teclado-quantidade` é a variante de toque longo do gesto do
  KPI K4. O flow `.maestro/jornada-completa-caminho-feliz.yaml` cobre o caminho crítico e é
  gate de regressão.

- **[O diagnóstico pode concluir que é regressão da lib]** → Nesse caso a saída é o plano B
  (provider aninhado) e um registro do porquê, para não tentar `OverKeyboardView` de novo numa
  próxima rodada. Não fazer upgrade especulativo de versão como primeira tentativa.

- **[Reabrir escopo de uma change já mergeada pode parecer retrabalho]** → É, e o `Why` diz
  isso abertamente. O ganho é a lacuna de spec que a permitiu: `componentes-base` passa a ter
  requisito verificável de painel inferior, que não existia.

## Migration Plan

Sem migração de dados ou schema. Só `presentation/`. Nada em `domain/`, `application/` ou
`infrastructure/`.

## Open Questions

- O `hook` de Voltar com teclado aberto extraído em change anterior (`cadastro-de-produto`,
  cenário "Voltar com teclado aberto fecha só o teclado") se aplica aos painéis também, ou é
  específico da tela de detalhe? Se for reaproveitável, é o lugar de tratar o Voltar do
  `OverKeyboardView`.
