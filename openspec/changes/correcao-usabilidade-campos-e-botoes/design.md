## Context

Seis pontos de entrada de dados (`FormularioProduto` em duas telas, e os 4 `Modal` — `TecladoQuantidade`, `SheetAvulso`, `SheetAjusteEstoque`, `SheetAjusteCompra`) compartilham a mesma base (`CampoTexto`, `Botao`) e repetem o mesmo padrão de `Modal transparent` com `Pressable` `justifyContent: 'flex-end'`. Nenhum dos seis compensa a abertura do teclado. Dois deles (`SheetAvulso`, `SheetAjusteCompra`) silenciam entrada inválida em vez de rejeitá-la — `SheetAjusteEstoque` já faz certo e serve de referência de padrão.

O domínio já expõe primitivos relevantes para as máscaras: `domain/shared/quantidade.ts` (`formatarNumero`, milésimos) e `domain/shared/dinheiro.ts` (`formatarBRL`, `deTextoDigitado`, centavos). A regra do CLAUDE.md de "conversão só na borda de exibição" significa que a máscara em tempo de digitação vive em `presentation/`, reaproveitando esses formatadores — nunca reimplementando parsing de dinheiro/quantidade em outro lugar.

## Goals / Non-Goals

**Goals:**
- Um único mecanismo de compensação de teclado, usado pelos 6 pontos.
- Um único padrão de validação com feedback em texto (nunca correção silenciosa), usado pelos campos que hoje descartam entrada inválida.
- Máscara de entrada e placeholder padrão no `CampoTexto`, parametrizados por tipo (`decimal-pad` → quantidade; dinheiro → formato R$), sem duplicar lógica de conversão que já existe no domínio.
- Affordance: chevron em "Mais opções", controle de fechar visível nos 4 modais, sugestão de categoria visível ao focar (não só após digitar prefixo).

**Non-Goals:**
- Não muda a representação em milésimos/centavos no banco nem a lógica de arredondamento (`arredondarParaUnidade`, `quantidadeAComprar`) — só a borda de exibição/validação.
- Não introduz `@gorhom/bottom-sheet` (o projeto já optou por `Modal` custom para os sheets existentes; trocar a implementação de sheet está fora do escopo desta correção).
- Não adiciona limites de negócio a valores monetários/quantidade além de um teto de sanidade de UI (não é uma regra de domínio nova, é prevenção de erro de digitação).

## Decisions

### 1. Compensação de teclado: um componente wrapper (`evita-teclado.tsx`), usando `react-native-keyboard-controller`

Criar um único componente de apresentação (`presentation/components/evita-teclado.tsx`) que encapsula `KeyboardAvoidingView` e repassa `children`. `FormularioProduto` envolve seu `ScrollView` com esse wrapper; os 4 `Modal` envolvem o conteúdo do sheet (dentro do `Pressable` interno) com o mesmo wrapper.

**Revisão de decisão (pós-QA manual):** a primeira versão usava o `KeyboardAvoidingView` nativo do React Native (`behavior="height"` no Android). QA manual no emulador provou que isso **não resolvia** o bug nos 6 pontos — o botão "Salvar" continuava atrás do teclado no formulário, e nos 4 sheets o teclado aparecia por cima de tudo (o caso conhecido de `KeyboardAvoidingView` nativo não funcionar de forma confiável dentro de `Modal` no Android). Pesquisa via Context7 na documentação de `react-native-keyboard-controller` confirmou a causa: a lib documenta exatamente essa limitação do componente nativo e afirma ter corrigido o suporte a `Modal` no Android a partir da versão 1.13. Trocado o `KeyboardAvoidingView` importado em `evita-teclado.tsx` para o da lib (substituto direto da mesma API — `behavior`/`style` idênticos), com `automaticOffset` pra calcular o deslocamento sozinho a partir da posição real do componente, sem medir `keyboardVerticalOffset` na mão pro cabeçalho/moldura de cada sheet.

Implicação de infraestrutura: `react-native-keyboard-controller` tem código nativo (Kotlin/Swift) — diferente de uma lib puramente JS, **exige rebuild nativo** (`npx expo run:android`/EAS build) antes de rodar no device; o dev client instalado antes desta mudança não tem o módulo linkado e crasha ao abrir até o rebuild. Isso muda a seção "Migration Plan" abaixo. Também exige mock próprio no Jest (a lib publica um em `react-native-keyboard-controller/jest`, registrado em `jest.setup.app.js`) — sem isso, qualquer arquivo que importe `evita-teclado.tsx` quebra a suíte inteira (é módulo nativo, não JS puro).

Alternativa considerada: `KeyboardAvoidingView` nativo do RN, com behavior/offset ajustados manualmente por tela. Rejeitada depois de comprovado no emulador que não resolve o caso dos 4 sheets (Modal no Android) — não é questão de tuning, é limitação documentada do componente nativo.

Alternativa considerada: `KeyboardAvoidingView` inline em cada um dos 6 arquivos (em vez de um wrapper único). Rejeitada — repete a mesma constante de offset e o mesmo `behavior` seis vezes, contrariando SRP/DRY do CLAUDE.md, e qualquer ajuste futuro (ex.: header height mudando) exigiria editar seis arquivos.

### 2. Máscara e placeholder: `tipo` no `CampoTexto`, dinheiro via `react-native-mask-input`, quantidade em função pura própria

`CampoTexto` ganha uma prop `tipo?: 'quantidade' | 'dinheiro'` (além do `keyboardType` que já recebe). O tratamento difere por tipo, porque o formato natural de entrada é diferente:

- **`dinheiro`**: usa `react-native-mask-input` (`createNumberMask` + `useMaskedInputProps`) — biblioteca madura, em vez de reimplementar o digit-shift na mão (revisão de decisão abaixo). A partir do 3º dígito digitado, cada novo dígito entra pela direita como centavo e a vírgula se ajusta sozinha (129 → "1,29", 1290 → "12,90"); os dois primeiros dígitos aparecem crus (é o comportamento padrão da lib — a máscara só tem posição pra vírgula quando há dígitos suficientes pras casas decimais). Só dígitos contam; qualquer outro caractere é ignorado. Efeito colateral desejado: **entrada inválida deixa de existir estruturalmente** para esse tipo de campo — não há como digitar algo que não vire um número válido, o que elimina a necessidade de validar/rejeitar preço depois (`SheetAvulso`/`SheetAjusteCompra` não precisam mais de `erroPreco`).
- **`quantidade`**: sanitização própria em `aplicarMascaraQuantidade` (dígitos + uma vírgula, truncada em 3 casas, sinal preservado) sem reformatação de dígito-a-dígito — quantidade não tem a convenção de "sempre duas casas" do dinheiro (`5` deve continuar significando `5 unidades`, não `0,005`), então o digit-shift de uma máscara de moeda quebraria a expectativa mais comum de uso. Sem lib pronta pra esse formato específico (3 casas, sinal opcional), continua função própria.

A formatação roda inteiramente em `presentation/` (`campo-texto.tsx`); `CampoTexto` não importa `domain/produto`. O placeholder tem um default por `tipo` (`"0,000"` para quantidade, `"0,00"` para dinheiro), sobrescrevível via prop existente.

**Ponte entre o `value` controlado e o contrato de `useMaskedInputProps`:** a lib espera receber, no parâmetro `value`, o "não mascarado" (a sequência de dígitos que produziria a máscara atual) — não o texto decimal que o resto do app usa como estado (`"12,90"`). `CampoTexto` extrai só os dígitos do `value` recebido (`.replace(/\D/g, '')`) antes de repassar à lib, em vez de reinterpretar como número decimal — reinterpretar quebraria a digitação progressiva ("1" → "12" → "1,29" viraria "1,00" cedo demais). Consequência prática: quem **semeia** um valor inicial de preço (editar item existente) precisa formatá-lo já em `"X,YY"` com duas casas fixas (`.toFixed(2).replace('.', ',')`), não `String(valor)` cru — `sheet-avulso.tsx`, `sheet-ajuste-compra.tsx` e `valoresDoItem()` em `app/produto/[id].tsx` foram ajustados nesse sentido (achado durante teste automatizado: `String(12.5)` = `"12.5"`, que digit-extraído vira `"125"` → mascarado errado como `"1,25"`).

Alternativa considerada (versão original desta decisão, antes do pedido do usuário por libs testadas): reimplementar a máscara de dinheiro na mão, com uma função pura própria (digit-shift simples, sem lib). Funcionava nos testes automatizados, mas o usuário reportou no teste manual que "a máscara não tava muito boa" e pediu pesquisa de biblioteca via Context7 — trocado por `react-native-mask-input`, mais testada e com semântica de mask array já resolvida (inclusive o agrupamento de milhar, que a versão própria não tinha).

Alternativa considerada: reaproveitar `formatarBRL`/`deTextoDigitado` de `domain/shared/dinheiro.ts` diretamente na máscara de digitação. Rejeitada — esses formatadores operam sobre `Centavos`/valor já resolvido (borda de exibição de um valor salvo), não sobre uma sequência de teclas parcial; a máscara de dígito-a-dígito é puramente uma preocupação de UI de digitação (não existe "quantidade parcial digitada" no domínio).

### 3. Feedback obrigatório: mover a validação de quantidade de `SheetAvulso`/`SheetAjusteCompra` para o padrão de `SheetAjusteEstoque`

Em vez de `quantidadeNumerica > 0 ? quantidadeNumerica : valorPadrão` (correção silenciosa), passa a ser: se inválido, `setErro('mensagem')` e `return` sem chamar `onSalvar` — igual ao `salvar()` de `sheet-ajuste-estoque.tsx:54-63`. Isso é extensão do padrão já existente no arquivo mais correto do grupo, não uma invenção nova.

Vale só para **quantidade** — preço usa `tipo="dinheiro"` (decisão 2), cuja máscara já impede entrada inválida na digitação; validar de novo no `salvar()` seria checar um cenário que não pode mais acontecer (contraria a regra do CLAUDE.md de não adicionar tratamento de erro pra cenário impossível). `SheetAvulso`/`SheetAjusteCompra` não têm mais `erroPreco`.

### 4. Teto de sanidade em `FormularioProduto`: constante de UI, não regra de domínio

Um valor máximo razoável (ex.: quantidade necessária acima de um teto configurável) vira uma constante em `presentation/` (não em `domain/produto/estoque.rules.ts`) — é prevenção de erro de digitação (dedo no teclado numérico), não uma invariante de negócio. Validado em `salvar()` de `[id].tsx`/`novo.tsx`, mostrando erro em texto (`erros.quantidadeNecessaria`) em vez de bloquear silenciosamente o toque no botão.

### 5. Affordance dos 4 modais: reaproveitar `Botao`/ícone já existentes, não criar componente de header de sheet

Cada `Modal` ganha uma linha de cabeçalho com um botão de fechar (ícone de `IconeSvg`, já usado em `index.tsx`) chamando a mesma função `fechar()` que hoje só é acionada pelo backdrop — sem duplicar lógica de fechamento.

## Risks / Trade-offs

- **[Risco]** `KeyboardAvoidingView`/máscara não funcionarem como esperado em device real, mesmo com testes automatizados verdes (jsdom/test-renderer não simula geometria real de teclado) → **Materializado**: primeira versão (RN nativo) falhou no teste manual do usuário nos 6 pontos; corrigido trocando pra `react-native-keyboard-controller` (decisão 1) — reforça que QA visual em emulador real (grupo 6 de tasks.md) não é opcional pra este tipo de bug, mesmo com suíte 100% verde.
- **[Risco]** Módulo nativo novo exige rebuild antes de qualquer teste em device → **Mitigação**: `npx expo run:android` local (SDK/Java já disponíveis no ambiente), confirmado com o usuário antes de disparar (build nativo é demorado e reinstala o APK do emulador).
- **[Risco]** Adicionar `tipo` ao `CampoTexto` sem cuidado pode quebrar campos que hoje não usam máscara (nome, categoria, marca, observação) → **Mitigação**: `tipo` é opcional, comportamento atual (sem máscara) é o default; só os campos numéricos/monetários dos 6 pontos passam a usar `tipo="quantidade"`/`tipo="dinheiro"` explicitamente.
- **[Risco]** Teto de sanidade arbitrário pode incomodar quem legitimamente tem estoque grande (ex.: papel higiênico em pacote de 500g cada, necessidade de 50 unidades) → **Mitigação**: teto alto o suficiente para não bloquear uso real (a decidir em tasks com um valor como 99999, quatro dígitos a mais que o "26666" do bug relatado), e mensagem de erro permite corrigir, nunca bloqueia o campo.

## Migration Plan

Sem mudança de schema, sem dado a migrar. Sem flag necessária (mudança é estritamente correção de bug, não feature opcional).

**Revisão (pós-adoção de `react-native-keyboard-controller`):** diferente da previsão inicial ("rollout é só código de apresentação"), essa lib tem módulo nativo — qualquer build já instalado (dev client existente) crasha ao abrir até rodar `npx expo run:android` (local) ou um novo build EAS de development. Isso não é code-push/OTA-compatível: é rebuild nativo obrigatório antes do próximo teste em device ou do próximo build de distribuição (preview/produção). `react-native-mask-input` é JS puro, sem esse requisito.

## Open Questions

- Valor exato do teto de sanidade de quantidade — decidir em `tasks.md`/implementação com base em unidades já suportadas (`un`, `kg`, `L`, etc.), não bloquear aqui.
