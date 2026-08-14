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

### 1. Compensação de teclado: um componente `TelaComTeclado`/wrapper, não `KeyboardAvoidingView` cru em cada arquivo

Criar um único componente de apresentação (ex.: `presentation/components/evita-teclado.tsx`) que encapsula `KeyboardAvoidingView` com `behavior` por plataforma (`padding` no iOS, `height`/`undefined` + resize no Android, já que o app já é Android-first pelo `app.json`) e repassa `children`. `FormularioProduto` passa a envolver seu `ScrollView` com esse wrapper; os 4 `Modal` passam a envolver o conteúdo do sheet (dentro do `Pressable` interno) com o mesmo wrapper.

Alternativa considerada: `KeyboardAvoidingView` inline em cada um dos 6 arquivos. Rejeitada — repete a mesma constante de offset e o mesmo `behavior` seis vezes, contrariando SRP/DRY do CLAUDE.md, e qualquer ajuste futuro (ex.: header height mudando) exigiria editar seis arquivos.

### 2. Máscara e placeholder: função pura de formatação por `tipo`, aplicada no `onChangeText` do `CampoTexto`

`CampoTexto` ganha uma prop `tipo?: 'quantidade' | 'dinheiro'` (além do `keyboardType` que já recebe). Quando presente, o valor exibido é formatado a cada tecla reaproveitando `formatarBRL`/`deTextoDigitado` (dinheiro) ou o parsing de vírgula decimal já usado nas telas (quantidade) — a formatação roda em `presentation/`, o `CampoTexto` nunca importa `domain/produto` (só `domain/shared`, que já é a fronteira aceita para formatadores conforme CLAUDE.md). O placeholder passa a ter um default por `tipo` (`"0,000"` para quantidade, `"0,00"` para dinheiro), sobrescrevível via prop existente.

Alternativa considerada: lib de máscara de terceiros (`react-native-mask-input` ou similar). Rejeitada — o projeto já tem os formatadores certos em `domain/shared/`, e adicionar dependência nova para algo que já existe no domínio contraria "sem abstração além do necessário" do CLAUDE.md.

### 3. Feedback obrigatório: mover a validação de `SheetAvulso`/`SheetAjusteCompra` para o padrão de `SheetAjusteEstoque`

Em vez de `quantidadeNumerica > 0 ? quantidadeNumerica : valorPadrão` (correção silenciosa), passa a ser: se inválido, `setErro('mensagem')` e `return` sem chamar `onSalvar` — igual ao `salvar()` de `sheet-ajuste-estoque.tsx:54-63`. Isso é extensão do padrão já existente no arquivo mais correto do grupo, não uma invenção nova.

### 4. Teto de sanidade em `FormularioProduto`: constante de UI, não regra de domínio

Um valor máximo razoável (ex.: quantidade necessária acima de um teto configurável) vira uma constante em `presentation/` (não em `domain/produto/estoque.rules.ts`) — é prevenção de erro de digitação (dedo no teclado numérico), não uma invariante de negócio. Validado em `salvar()` de `[id].tsx`/`novo.tsx`, mostrando erro em texto (`erros.quantidadeNecessaria`) em vez de bloquear silenciosamente o toque no botão.

### 5. Affordance dos 4 modais: reaproveitar `Botao`/ícone já existentes, não criar componente de header de sheet

Cada `Modal` ganha uma linha de cabeçalho com um botão de fechar (ícone de `IconeSvg`, já usado em `index.tsx`) chamando a mesma função `fechar()` que hoje só é acionada pelo backdrop — sem duplicar lógica de fechamento.

## Risks / Trade-offs

- **[Risco]** `KeyboardAvoidingView` com `behavior="height"` no Android pode gerar salto visual em alguns aparelhos → **Mitigação**: testar nos dois temas e em pelo menos um emulador Android real via `mobile-ux-tester`/Maestro antes de arquivar, conforme já exigido pelo fluxo de teste da change.
- **[Risco]** Adicionar `tipo` ao `CampoTexto` sem cuidado pode quebrar campos que hoje não usam máscara (nome, categoria, marca, observação) → **Mitigação**: `tipo` é opcional, comportamento atual (sem máscara) é o default; só os campos numéricos/monetários dos 6 pontos passam a usar `tipo="quantidade"`/`tipo="dinheiro"` explicitamente.
- **[Risco]** Teto de sanidade arbitrário pode incomodar quem legitimamente tem estoque grande (ex.: papel higiênico em pacote de 500g cada, necessidade de 50 unidades) → **Mitigação**: teto alto o suficiente para não bloquear uso real (a decidir em tasks com um valor como 99999, quatro dígitos a mais que o "26666" do bug relatado), e mensagem de erro permite corrigir, nunca bloqueia o campo.

## Migration Plan

Sem mudança de schema, sem dado a migrar. Rollout é só código de apresentação — mudança de comportamento visível imediatamente após deploy do build. Sem flag necessária (mudança é estritamente correção de bug, não feature opcional).

## Open Questions

- Valor exato do teto de sanidade de quantidade — decidir em `tasks.md`/implementação com base em unidades já suportadas (`un`, `kg`, `L`, etc.), não bloquear aqui.
