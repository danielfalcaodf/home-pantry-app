# Design de Frontend — App de Estoque de Casa

| Campo | Valor |
|---|---|
| Versão | 0.1 |
| Data | 02/08/2026 |
| Documentos base | PRD v0.1 · Arquitetura v0.1 · Database v0.1 |
| Plataforma | React Native + Expo — Android e iOS |
| Temas | Escuro e claro, ambos de primeira classe |
| Direção | **"Linha d'água"** |

---

## 1. O briefing, fechado

**Sujeito:** a despensa de uma casa. Não é um ERP, não é um app de finanças, não é um to-do list. É o armário da cozinha.

**Público:** duas pessoas na mesma casa, com posturas opostas. Uma cadastra e planeja. A outra só quer marcar que acabou o leite, em pé na frente da geladeira, com uma mão só, provavelmente segurando outra coisa.

**Trabalho único da tela principal:** responder *"o que está acabando?"* em uma olhada, e registrar consumo em um toque.

Tudo abaixo se subordina a isso. O PRD colocou ≤ 3 toques e ≤ 10 segundos como KPI (K4) — em design, isso significa que **nenhum elemento pode competir com o gesto de dar baixa**.

---

## 2. Direção visual

### 2.1 O conceito: linha d'água

Ninguém pensa no estoque de casa em números. Pensa em **nível**: o pote de arroz pela metade, o vidro de azeite no fim, o pacote de café que ainda está cheio. O app inteiro é construído em cima dessa metáfora — não como enfeite, mas como o mecanismo principal de leitura.

Cada item da lista **é** um medidor. A linha preenche a altura da própria linha, de baixo para cima, na proporção `quantidade_atual / quantidade_necessaria`. Uma régua de 2px marca a superfície — a linha d'água.

Ler a tela é ver uma paisagem de níveis. Os vales são o que falta comprar. Nenhum número precisa ser lido para isso funcionar.

### 2.2 O que foi descartado, e por quê

| Descartado | Motivo |
|---|---|
| Cards com sombra, cantos 16px, um por item | Card é contêiner neutro — não diz nada sobre o conteúdo. E empilhar 200 cards vira um catálogo, não uma despensa. |
| Barra de progresso horizontal dentro do card | É a resposta template. Além disso, progresso horizontal significa "avanço até uma meta"; estoque é nível, e nível é vertical. |
| Dashboard com números grandes no topo | Rouba o espaço e a atenção do único gesto que importa. Os totais vivem na aba Resumo, onde alguém vai deliberadamente. |
| Fundo creme (~#F4F1EA) + serifada de alto contraste + terracota | É a estética padrão de IA de 2025–26. Aparece em qualquer briefing, portanto não é escolha. |
| Preto quase absoluto + um verde-ácido | Idem. E verde-ácido colide semanticamente com o verde de "cheio". |
| Gradientes e vidro fosco | Não existe nada na cozinha que se pareça com isso. |

### 2.3 A aposta

**A lista não tem cards, não tem bordas e não tem sombras.** Só linhas cheias de tinta até certa altura, separadas por hairlines. É um layout que se sustenta pela precisão do espaçamento e pela tipografia — se o ritmo vertical estiver errado, desmonta. Foi a escolha de gastar a ousadia em um lugar só: o medidor. Todo o resto é deliberadamente quieto.

---

## 3. Cor

Duas paletas irmãs, não uma invertida na outra. O tema escuro é **Despensa** (armário fechado, luz da geladeira à noite). O claro é **Porcelana** (azulejo e louça, luz de manhã) — cinza-esverdeado frio, propositalmente longe do creme.

### 3.1 Tema escuro — Despensa

| Token | Hex | Uso | Contraste vs base |
|---|---|---|---|
| `bg.base` | `#0F1513` | Fundo do app | — |
| `bg.surface` | `#161E1B` | Barras, sheets, campos | — |
| `bg.raised` | `#1D2724` | Sheet elevado, item pressionado | — |
| `line.hairline` | `#2B3733` | Divisores de 1px | 1.49 |
| `text.primary` | `#E9EFEA` | Nome do item, títulos | **15.8** |
| `text.secondary` | `#98A8A2` | Categoria, unidade, legendas | **7.4** |
| `state.cheio` | `#6FB98C` | Nível OK | **7.9** |
| `state.emFalta` | `#E7B24E` | Abaixo do mínimo | **9.6** |
| `state.critico` | `#EA6247` | Zerado | **5.6** |
| `action.azulejo` | `#63B4D4` | Ação primária, links, foco | **7.9** |

### 3.2 Tema claro — Porcelana

| Token | Hex | Uso | Contraste vs base |
|---|---|---|---|
| `bg.base` | `#F1F4F1` | Fundo do app | — |
| `bg.surface` | `#FFFFFF` | Barras, sheets, campos | — |
| `line.hairline` | `#D9E0DB` | Divisores de 1px | 1.21 |
| `text.primary` | `#14201C` | Nome do item, títulos | **15.1** |
| `text.secondary` | `#5A6B65` | Categoria, unidade, legendas | **5.1** |
| `state.cheio` | `#276B44` | Nível OK (texto e ícone) | **5.8** |
| `state.emFalta` | `#8A6410` | Abaixo do mínimo | **4.9** |
| `state.critico` | `#B33A20` | Zerado | **5.4** |
| `action.azulejo` | `#1C5A78` | Ação primária, links, foco | **6.8** |

Branco sobre `action.azulejo`: **7.6**. Branco sobre `state.critico`: **5.9**. Todos os pares passam WCAG AA; a maioria passa AAA.

### 3.3 Tinta do nível

A cor de estado cheia não pinta a linha inteira — seria ruído em uma lista de 200 itens. A tinta do nível é a cor de estado a **12% de opacidade** no tema escuro e **10%** no claro. A régua da linha d'água usa a cor **em 100%**, com 2px.

O resultado: de longe você lê o relevo dos níveis; de perto, a régua colorida confirma o estado.

### 3.4 Estado nunca depende só de cor

Cada item comunica seu estado por **três canais redundantes**: altura do preenchimento, cor da régua e rótulo textual (`Cheio` / `Falta 2` / `Acabou`). Quem não distingue as cores lê pela altura e pelo texto. Isto não é um extra de acessibilidade — é o que permite a lista funcionar em uma olhada de 1 segundo.

### 3.5 Escolha de tema

Três opções: `Automático (sistema)` · `Claro` · `Escuro`, com automático como padrão. O tema é lido de `useColorScheme()` e a preferência do usuário fica no SQLite, não em estado volátil.

---

## 4. Tipografia

Três papéis, três famílias, cada uma com uma função que a outra não faz bem.

| Papel | Família | Onde |
|---|---|---|
| **Display** | Archivo (SemiBold 600 / Bold 700), tracking −2% | Títulos de tela, nome do item em destaque, quantidade grande no detalhe |
| **Corpo/UI** | IBM Plex Sans (Regular 400 / Medium 500) | Nomes na lista, rótulos, textos de apoio, botões |
| **Dados** | IBM Plex Mono (Regular 400 / Medium 500), **tabular** | Preços, quantidades, totais, datas |

### 4.1 Por que mono nos números

Dois motivos, os dois funcionais:

1. **O cupom fiscal é monoespaçado.** É a tipografia nativa do mundo do supermercado — preço, subtotal, total. Usar mono para dinheiro faz a lista de compras parecer o que ela é.
2. **Figuras tabulares não pulam.** Quando a quantidade cai de 10 para 9, ou o total muda de R$ 189,00 para R$ 92,50, os dígitos ocupam a mesma largura e nada se desloca. Em uma tela onde os números mudam a cada toque, isso é a diferença entre estável e nervoso.

Archivo entra com restrição: só em título de tela e na quantidade grande da tela de detalhe. Se aparecer na lista, vira barulho.

> Verifique os pesos exportados por `@expo-google-fonts/archivo`, `@expo-google-fonts/ibm-plex-sans` e `@expo-google-fonts/ibm-plex-mono` antes de fixar os nomes das constantes — nem toda família exporta todos os pesos.

### 4.2 Escala

| Token | Tamanho / Altura | Família | Uso |
|---|---|---|---|
| `display.lg` | 34 / 38 | Archivo 700 | Quantidade na tela de detalhe |
| `display.sm` | 24 / 28 | Archivo 600 | Título de tela |
| `body.lg` | 17 / 24 | Plex Sans 500 | Nome do item na lista |
| `body.md` | 15 / 22 | Plex Sans 400 | Texto corrente, botões |
| `label` | 13 / 18 | Plex Sans 500 | Categoria, unidade, rótulo de estado |
| `caption` | 11 / 16, tracking +4% | Plex Sans 500 uppercase | Cabeçalho de grupo (categoria) |
| `data.lg` | 20 / 24 | Plex Mono 500 tabular | Total da compra |
| `data.md` | 15 / 20 | Plex Mono 400 tabular | Preço e quantidade na lista |

Nada acima de 34pt. Números gigantes de dashboard não pertencem a este app.

---

## 5. Espaço, raio, elevação

```
espaço:  4 · 8 · 12 · 16 · 24 · 32 · 48
raio:    0 (linhas da lista) · 8 (campos, chips) · 12 (sheets) · 999 (stepper)
```

**Raio 0 na lista é intencional.** A linha vai de borda a borda porque ela é um recipiente cheio de líquido — arredondar quebraria a leitura de nível e reintroduziria o card que foi descartado.

**Elevação:** só sheets e o toast têm sombra. Itens de lista não têm nenhuma. A hierarquia vem do nível de tinta, não de profundidade falsa.

**Altura da linha de item: 68px.** Alta o bastante para o nível ser legível como área, e para o alvo de toque do stepper caber com folga.

---

## 6. Elemento-assinatura: a linha d'água

```
        ┌──────────────────────────────────────────────┐
        │  Café em pó                            ╭───╮ │  ← 68px
        │  Mercearia · 500 g                     │ − │ │
        │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ╰───╯ │
        │▓▓▓▓▓▓▓ 2 de 3 pacotes ▓▓▓▓▓ Falta 1 ▓▓▓▓▓▓▓▓ │  ← tinta sobe até 67%
        └══════════════════════════════════════════════┘
         ↑ régua de 2px na cor do estado, no topo da tinta
```

**Regras do medidor:**

| Situação | Comportamento |
|---|---|
| `atual / necessária` entre 0 e 1 | Tinta preenche essa fração da altura, régua na superfície |
| Exatamente cheio ou acima | Tinta 100%, régua rente ao topo, sem "transbordar" |
| Acima do necessário | Um traço fino de 1px acima da régua marca a sobra — sem número, sem badge |
| Zerado | **Sem tinta.** Só a régua de 2px na base, em `state.critico`. O vazio é o sinal. |

O item zerado ser o único visualmente *vazio* é o ponto do design: numa lista de 200 linhas, seus olhos vão direto para os buracos.

**Nunca anime a tinta durante a rolagem.** O nível é pintado no valor final; a animação só existe no momento em que o usuário muda a quantidade (seção 9).

---

## 7. Componentes

### 7.1 Linha de item (`ItemDespensa`)

```
esquerda (flex)                             direita (fixa)
├─ Nome                        body.lg      ├─ [ − ]  48×48 alvo
├─ Categoria · unidade         label        │  círculo 40px, borda hairline
└─ "2 de 3 pacotes" + estado   data.md      └─
```

- Toque na área esquerda → abre o detalhe do produto.
- Toque no `−` → registra o consumo de 1 e nada mais acontece na navegação.
- Toque longo no `−` → abre o teclado de quantidade (7.3).
- Sem swipe. Gesto invisível não pode carregar a ação principal do app.

### 7.2 Stepper de consumo

O botão é um círculo de 40px dentro de um alvo de 48×48, alinhado à direita para o polegar. No item zerado ele fica desabilitado com opacidade 0.35 — presente, mas claramente sem função. Remover o botão faria a linha mudar de layout e quebrar o alinhamento vertical da lista.

### 7.3 Teclado de quantidade (bottom sheet)

Numérico grande, unidade fixa ao lado, botões `Usei` e `Repus`. Abre por toque longo no stepper ou pelo detalhe. Fecha no salvamento. Um único campo, sem formulário.

### 7.4 Toast de desfazer

Ancorado acima da tab bar, 10 segundos, com barra de tempo fina. Texto: **"Anotado. 2 pacotes de café."** e ação **Desfazer**. Não bloqueia nada e nunca empilha — um novo toast substitui o anterior.

### 7.5 Chip de estado

Usado no filtro do topo da lista: `Tudo` · `Acabou (3)` · `Faltando (12)`. Ativo recebe fundo na cor do estado a 16% e texto na cor cheia. O número entre parênteses é a informação; o chip é só o alvo.

### 7.6 Campo de texto

Fundo `bg.surface`, sem borda no estado normal, hairline embaixo. Em foco: hairline de 2px em `action.azulejo`. Rótulo sempre visível acima do campo — nunca placeholder como rótulo, porque ele some justo quando o usuário está digitando.

### 7.7 Item do modo compra

Checkbox quadrado de 28px à esquerda (não circular — está riscando uma lista, não selecionando opção). Marcado: nome em `text.secondary` com risco horizontal, e a linha perde toda a tinta. A lista vai literalmente esvaziando conforme você anda pelo mercado.

---

## 8. Telas

### 8.1 Despensa (principal)

```
┌────────────────────────────────────────┐
│  Despensa                          ⌕ ＋│  Archivo 24
├────────────────────────────────────────┤
│  [Tudo] [Acabou 3] [Faltando 12]       │  chips, rolagem horizontal
├────────────────────────────────────────┤
│  HORTIFRÚTI                            │  caption, sticky
│ ┌────────────────────────────────────┐ │
│ │ Tomate                        ╭─╮  │ │
│ │ 1 kg                          │−│  │ │
│ │════════════════════════════════════│ │  ← régua na base = acabou
│ │ 0 de 1 kg · Acabou                 │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │ Cebola                        ╭─╮  │ │
│ │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │−│  │ │
│ │▓▓ 2 de 2 kg · Cheio ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ │
│ └────────────────────────────────────┘ │
│  MERCEARIA                             │
│ ┌────────────────────────────────────┐ │
│ │ Café em pó                    ╭─╮  │ │
│ │                               │−│  │ │
│ │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ │
│ │▓▓ 2 de 3 pacotes · Falta 1 ▓▓▓▓▓▓▓▓│ │
│ └────────────────────────────────────┘ │
├────────────────────────────────────────┤
│   Despensa      Lista        Resumo    │
└────────────────────────────────────────┘
```

Ordenação: acabou → faltando → cheio, e alfabética dentro de cada grupo — o cabeçalho de categoria só aparece dentro do filtro `Tudo`, onde a ordem é por categoria.

### 8.2 Lista de compras

```
┌────────────────────────────────────────┐
│  Lista                        Agrupar ⇅│
├────────────────────────────────────────┤
│  15 itens · R$ 189,40 estimado         │  Plex Mono 20
│  3 sem preço cadastrado                │  label, secondary
├────────────────────────────────────────┤
│  Tomate               1 kg     R$ 8,90 │
│  Café em pó      1 pacote     R$ 22,50 │
│  Detergente          2 un      sem preço│
│  ＋ Carvão (avulso)   1 un     R$ 18,00│
├────────────────────────────────────────┤
│       [  Comprar esses 15 itens  ]     │  azulejo, full width
└────────────────────────────────────────┘
```

Aqui a coluna de preço em mono se alinha perfeitamente à direita e a lista lê como um cupom — que é exatamente o que ela vai virar.

### 8.3 Modo compra

Uma tela só, sem navegação interna, **com a tela travada acordada**. Checkbox grande, nome, e o valor pago editável em um toque. Rodapé fixo com contador (`8 de 15`) e total corrente em mono, que atualiza a cada item marcado.

Botão final: **Fechar compra**. O toast confirma: **"Compra fechada. 8 itens repostos."**

### 8.4 Resumo

Valor em casa, valor da lista, gasto por mês. Aqui — e só aqui — os números podem ser grandes. É a tela para onde alguém vai deliberadamente, então ela pode ser densa.

### 8.5 Detalhe do produto

Quantidade em Archivo 34 no topo, com `Usei` e `Repus` logo abaixo. Campos de edição em seguida. No rodapé, o histórico: **"Você anotou 3 baixas nos últimos 30 dias."** — é a informação que dá confiança de que o app está registrando o que deveria.

---

## 9. Movimento

Um único momento orquestrado, no gesto que importa.

**Ao tocar em `−`:**

| Fase | Duração | O quê |
|---|---|---|
| 0ms | — | Háptico leve (`impactAsync.Light`) |
| 0–90ms | 90ms | Círculo do stepper contrai para 0.92 e volta |
| 0–320ms | spring, damping 18 | Linha d'água desce até o novo nível |
| 0–200ms | fade | Números trocam com cross-fade curto, sem slide |
| 120ms | — | Toast entra deslizando 12px de baixo |

A tinta descendo com física de líquido é a recompensa do gesto. É a única animação com personalidade no app inteiro.

**O que não anima:** entrada de tela, itens da lista aparecendo em cascata, skeleton shimmer, números contando progressivamente. Tudo isso adiciona latência percebida ao caminho crítico e faz o app parecer gerado.

**Reduced motion ligado:** o nível muda em corte seco (fade de 100ms), o háptico permanece. A informação nunca depende do movimento.

---

## 10. Acessibilidade

| Item | Regra |
|---|---|
| Alvos de toque | Mínimo 48×48dp, inclusive o stepper |
| Contraste | Todos os pares da seção 3 verificados, mínimo AA |
| Estado sem cor | Altura + régua + rótulo textual (3.4) |
| Fonte do sistema | Layout aguenta até 200% de escala; a linha cresce, nunca trunca o nome |
| Leitor de tela | Rótulo por linha: `"Café em pó, 2 de 3 pacotes, falta 1"`. Botão: `"Registrar consumo de 1 pacote de café em pó"` — nunca só "menos" |
| Foco visível | Anel de 2px em `action.azulejo` com 2px de folga, para teclado externo |
| Toque longo | Toda ação por toque longo tem caminho alternativo visível na tela de detalhe |

---

## 11. Voz da interface

O domínio fala "dar baixa", "movimento de estoque", "reposição". **A interface não.** Isso é vocabulário de sistema, e quem está em pé na frente da geladeira não pensa assim.

| Sistema diz | Interface diz |
|---|---|
| Estoque | Despensa |
| Dar baixa | Usei |
| Reposição | Repus / Comprei |
| Finalizar compra | Fechar compra |
| Quantidade necessária | Quanto quero ter em casa |
| Item em falta | Faltando |
| Quantidade zerada | Acabou |

A ação mantém o mesmo nome do começo ao fim: o botão diz `Usei`, o toast diz `Anotado`, o histórico diz `Você anotou`.

**Estados vazios são convites, não avisos:**

- Despensa vazia → *"Nada cadastrado ainda. Comece pelos 40 itens que quase toda casa tem — depois é só ajustar."* · **Começar pela lista básica**
- Lista vazia → *"Nada faltando. Todo item está no nível que você definiu."*
- Busca sem resultado → *"Nenhum item com esse nome."* · **Cadastrar "azeite trufado"**

**Erros dizem o que houve e o que fazer, sem pedir desculpa:**

- *"Não foi possível salvar. Toque para tentar de novo."*
- *"Já existe um item chamado Arroz na sua despensa."* · **Ver o item** / **Salvar assim mesmo**
- *"O backup é de uma versão mais nova do app. Atualize antes de restaurar."*

---

## 12. Implementação

### 12.1 Tokens

`src/presentation/theme/tokens.ts` exporta `light` e `dark` com a mesma forma, consumidos por um `ThemeProvider` com `useTheme()`. **Nenhum hex fora desse arquivo** — nem em componente, nem em estilo inline. Vale um lint rule: qualquer `#` literal em `presentation/components/` é erro.

```ts
export type Theme = {
  bg: { base: string; surface: string; raised: string };
  line: { hairline: string };
  text: { primary: string; secondary: string };
  state: { cheio: string; emFalta: string; critico: string };
  action: { azulejo: string };
  fillOpacity: number;   // 0.12 escuro · 0.10 claro
};
```

### 12.2 Onde o design encosta na arquitetura

A camada de apresentação **não calcula estado**. `estadoDoItem()` e `alturaDoNivel()` são funções puras em `domain/produto/estoque.rules.ts`, testadas sem emulador. O componente recebe `{ estado, fracao, rotulo }` prontos.

Isso importa para um caso concreto: `fracao` precisa ser limitada a `[0, 1]` antes de virar altura. Se um produto tiver 5 de 2, `fracao` bruta é 2.5 e a tinta vazaria da linha. Esse clamp é regra de domínio com teste, não um `Math.min` improvisado dentro do estilo.

### 12.3 Bibliotecas

| Necessidade | Escolha |
|---|---|
| Animação do nível | `react-native-reanimated` — spring roda na UI thread, essencial para não engasgar durante scroll |
| Háptico | `expo-haptics` |
| Lista | `FlashList` se passar de ~150 itens; `FlatList` resolve abaixo disso |
| Tela acordada no modo compra | `expo-keep-awake` |
| Bottom sheet | `@gorhom/bottom-sheet` |
| Ícones | Um set só, contorno, peso 1.5px — não misture famílias |

Sem biblioteca de componentes pronta. Um design system inteiro para ~12 componentes traria mais opinião visual do que este documento, e a lista — o componente central — teria que ser customizada de qualquer forma.

### 12.4 Modo escuro sem piscar

Ler o tema salvo antes de esconder a splash (`expo-splash-screen`). O flash branco na abertura de um app de tema escuro é o detalhe que denuncia acabamento ruim, e custa três linhas evitar.

---

## 13. Autocrítica

**O que foi cortado depois de desenhado:**

- **Ícone por categoria em cada linha.** Bonito, e ruído puro: a lista já está agrupada por categoria, então o ícone repetia a informação do cabeçalho 12 vezes seguidas.
- **Gráfico de consumo no detalhe do produto.** Com um mês de uso ele mostra três pontos e não diz nada. Vira candidato real quando existir histórico — e aí é decisão de produto, não de decoração.
- **Badge de contagem na tab bar.** A tela de Lista já abre com o número no topo. Contador em cima de contador cansa.

**Riscos assumidos:**

| Risco | Como saber se deu errado |
|---|---|
| O nível vertical pode ser lido como barra de progresso | Se alguém perguntar "progresso de quê?" no primeiro uso, adicione o rótulo `2 de 3` em peso maior antes de mexer no medidor |
| Lista sem cards pode parecer densa demais em telas pequenas | Testar com 200 itens reais em um aparelho de 5,5"; se cansar, aumentar a linha para 76px antes de reintroduzir bordas |
| Três famílias de fonte custam peso no bundle | Carregar só os pesos usados; se passar de 400 KB, Archivo é a primeira a sair (o app sobrevive com Plex Sans + Plex Mono) |

**O que este design aposta:** que a informação mais valiosa da tela não é um número, é um relevo. Se em uma semana de uso você conseguir olhar a lista e saber o estado da casa sem ler nada, funcionou.
