# Correção do teclado que cobre os sheets

**Type:** Correção de Bug

## Why

Nos cinco painéis inferiores do app, abrir o teclado cobre por inteiro o título, o campo e o
botão de confirmar. A pessoa não vê o que digita nem alcança o "Salvar". Reproduzido no
aparelho, não deduzido do código.

Isto **já foi corrigido uma vez**. A change `correcao-usabilidade-campos-e-botoes` (Ordem 1,
mergeada em `develop` pela PR #34) criou `EvitaTeclado` justamente para esse cenário, e o
componente está presente nos cinco sheets. Mesmo assim o defeito reproduz no binário atual.
Esta change reabre esse escopo: é gap de correção, não causa nova sem dono.

Atinge o KPI K4 (baixa em ≤ 3 toques e ≤ 10s), porque `teclado-quantidade` é a variante de
toque longo do caminho crítico — o gesto principal do app.

## What Changes

- **A-06 — o teclado cobre os cinco sheets.** Todos seguem o mesmo padrão:
  `<Modal transparent animationType="slide">` envolvendo um `<EvitaTeclado>`.

  | Componente | Modal | EvitaTeclado |
  |---|---|---|
  | `sheet-preco-produto.tsx` | `:48` | (dentro) |
  | `sheet-avulso.tsx` | `:74` | `:80` |
  | `teclado-quantidade.tsx` | `:59` | `:65` |
  | `sheet-ajuste-compra.tsx` | `:69` | `:71` |
  | `sheet-ajuste-estoque.tsx` | `:70` | `:76` |

  Causa raiz, uma só para os cinco: o `<Modal>` do React Native abre uma **janela nativa
  separada**. O `KeyboardProvider` montado na raiz (`app/_layout.tsx:53` e `:70`) não alcança
  essa janela, então o `KeyboardAvoidingView` de `react-native-keyboard-controller` dentro de
  `EvitaTeclado` (`evita-teclado.tsx:26`) nunca recebe evento de teclado e não desloca nada.
  `formulario-produto.tsx` **não** é afetado — é tela normal, sem Modal, e lá o mesmo
  `EvitaTeclado` funciona (verificado na auditoria).

- **A-07 — `autoFocus` nos sheets não levanta o teclado.** `sheet-preco-produto.tsx:84`,
  `teclado-quantidade.tsx:96` e `sheet-avulso.tsx:113` declaram `autoFocus`, mas ao abrir o
  painel o teclado não sobe (`dumpsys input_method` → `mInputShown=false`); só depois de um
  toque manual no campo. Um toque a mais num painel cuja única função é digitar um número —
  e o mesmo isolamento de janela é a causa provável.

- Nenhuma mudança de fluxo ou de conteúdo dos painéis. O que muda é a técnica de apresentação
  e a garantia de que campo e botão permanecem visíveis com o teclado aberto.

## Capabilities

### Modified Capabilities

- `componentes-base`: ganha um requisito novo (delta `ADDED`) para o painel inferior. Hoje
  nenhuma capability especifica o comportamento do teclado nos sheets — `cadastro-de-produto`
  cobre foco e Voltar **na tela de detalhe**, não nos painéis. É justamente essa lacuna que
  permitiu o defeito passar por uma correção anterior sem ser pego.

## Impact

- **Código**: `src/presentation/components/evita-teclado.tsx` e os cinco sheets
  (`sheet-preco-produto.tsx`, `sheet-avulso.tsx`, `teclado-quantidade.tsx`,
  `sheet-ajuste-compra.tsx`, `sheet-ajuste-estoque.tsx`). Possivelmente
  `android/app/src/main/AndroidManifest.xml` — hoje já declara
  `windowSoftInputMode="adjustResize"`, o que descarta essa hipótese, mas a verificação faz
  parte do escopo. **Também `app/_layout.tsx:53` e `:70`**: a pesquisa encontrou que o
  `KeyboardProvider` é montado sem `statusBarTranslucent`/`navigationBarTranslucent`, apesar de
  o app ter as duas barras transparentes (`android/app/src/main/res/values/styles.xml`) —
  correção obrigatória, independente da saída escolhida para o Modal (ver `design.md`,
  hipótese D).
- **Dependências**: nenhuma nova. `react-native-keyboard-controller` 1.21.9 já está instalada
  e expõe `OverKeyboardView`, descrito na doc oficial como alternativa ao `Modal` que mantém o
  teclado aberto e que **funciona sem `KeyboardProvider`**.
- **Camadas**: só `presentation/`.
- **KPI**: K4 (caminho crítico de dar baixa) via `teclado-quantidade`.

### Dependências entre changes

Reabre parte do escopo do achado de Keyboard Overlap da change
`correcao-usabilidade-campos-e-botoes` (Ordem 1), já concluída e mergeada em `develop` —
depende dela no sentido de partir do código que ela entregou, não de esperar por ela. Sem
sobreposição de arquivos com `correcao-lista-de-compras` (Ordem 2, que tocou `lista.tsx`,
`item-lista.tsx`, `item-compra.tsx`).

**Nova dependência, encontrada pela pesquisa**: a correção da hipótese D (`design.md`) toca
`app/_layout.tsx:53` e `:70`, para adicionar `statusBarTranslucent`/`navigationBarTranslucent`
ao `KeyboardProvider` — exatamente o bloco onde `correcao-bordas-do-sistema` (Ordem 3) monta o
`<StatusBar>` e o consumo de insets. Esta change passa a depender também da 3, para que a
edição desse bloco não seja feita duas vezes em paralelo sobre a mesma base. Antes desta
pesquisa não havia sobreposição de arquivos declarada entre as duas changes; a Ordem 4 já
vem depois da 3 na lista, então a dependência formaliza uma sequência que já existia na
prática.
