# Brief — Ícone e Splash Screen ("Repor")

Guia de referência para gerar/redesenhar os assets visuais do app antes da publicação nas lojas. Requisitos técnicos verificados na documentação oficial do Expo (via Context7, docs.expo.dev) em 16/08/2026.

---

## 1. Conceito visual

Direção **"linha d'água"** (já fechada no `FRONTEND-DESIGN-app-estoque-de-casa.md` §7 para a UI): cada item da despensa é um medidor vertical que enche/esvazia como líquido, com uma régua de 2px marcando a superfície. O app tem três frentes — despensa (nível de cada produto), lista de compras (vários itens empilhados) e controle financeiro (valor gasto/estimado) — e o símbolo do app precisa falar as três ao mesmo tempo, não só a primeira.

**Um recipiente isolado (pote/copo) só representa nível de estoque.** O que une as três frentes é a própria tela de Lista de Compras do app: várias "linhas d'água" enfileiradas, cada uma com sua altura. Por isso o símbolo do ícone/splash é uma **miniatura de 3 barras verticais lado a lado, com alturas de preenchimento diferentes, sentadas sobre uma única régua de base** — não é uma metáfora nova, é o próprio produto reduzido a ícone:

- Cada barra = o nível de um produto (despensa).
- O conjunto de barras = uma lista (lista de compras).
- Alturas diferentes lidas em conjunto = leitura de gráfico de valores (controle financeiro).

Regras de composição:
- **3 barras, retangulares, raio de canto 0** — mesma regra da lista principal do app ("card é contêiner neutro"; a régua reta é intencional). Nunca arredondar as barras.
- Barras com alturas de preenchimento visivelmente diferentes (ex.: ~30%, ~65%, ~90%) — não deixar as três iguais, senão vira um padrão decorativo sem leitura de "nível".
- Espaçamento entre barras igual à largura de cada barra (ritmo regular, tipo equalizador/gráfico de barras minimalista).
- Régua de base única, fina, atravessando as 3 barras — é o elemento que amarra "várias barras" como "um só ícone" (não são 3 objetos soltos).
- **Sem mascote, sem texto, sem gradiente vibrante, sem sombra projetada dramática.**
- Composição simples o bastante para ser reconhecível a 32px (tamanho de ícone de app na tela inicial) — nesse tamanho as barras precisam continuar distinguíveis umas das outras.

## 2. Paleta oficial (`src/presentation/theme/tokens.ts`)

Não inventar cor nova — usar só os tokens já validados (contraste AA já testado no projeto):

| Token | Tema **Despensa** (escuro) | Tema **Porcelana** (claro) |
|---|---|---|
| `bg.base` | `#0F1513` | `#F1F4F1` |
| `text.primary` | `#E9EFEA` | `#14201C` |
| `state.cheio` | `#6FB98C` | `#276B44` |
| `action.azulejo` | `#63B4D4` | `#1C5A78` |

> ⚠️ **Achado**: o `app.json` atual define a splash com `backgroundColor: "#208AEF"` — um azul que não existe em nenhum dos dois temas. Isso quebra a regra do projeto de "ler o tema salvo antes de esconder a splash screen para não piscar" (`CLAUDE.md`): hoje ela sempre pisca essa cor, independente do tema ativo. Corrigir junto com os novos assets (seção 6).

## 3. Requisitos técnicos — Expo / iOS / Android

| Arquivo (`assets/images/`) | Tamanho | Formato | Regra |
|---|---|---|---|
| `icon.png` | **1024×1024px** | PNG | Ícone mestre (fallback iOS/Android/web). **Sem transparência, sem cantos arredondados** — o SO aplica a máscara sozinho; imagem com transparência ou canto já arredondado quebra em algumas plataformas. |
| `android-icon-foreground.png` | **1024×1024px** | PNG, fundo transparente | Camada de primeiro plano do ícone adaptativo do Android. O sistema recorta essa imagem em formas diferentes (círculo, "squircle", quadrado arredondado) dependendo do launcher — por isso o conteúdo relevante precisa caber numa **zona segura central de ~66% do diâmetro** do canvas (regra do próprio Android para adaptive icons); qualquer coisa fora disso pode ser cortada. |
| `android-icon-background.png` *(opcional — ver recomendação)* | 1024×1024px | PNG | Camada de fundo do ícone adaptativo. Como é uma cor sólida, **não precisa gerar imagem** — usar `backgroundColor` direto no `app.json` (ver seção 6) e remover essa entrada. |
| `android-icon-monochrome.png` | **1024×1024px** | PNG, fundo transparente | "Ícone temático" do Android 13+ (Material You) — o sistema recolore essa silhueta com a cor de destaque do papel de parede do usuário. Precisa ser **uma silhueta sólida em branco (`#FFFFFF`)**, sem gradiente, sem variação de opacidade — só forma + alpha. |
| `splash-icon.png` | **1024×1024px** | **PNG obrigatório**, fundo transparente | Marca exibida na splash. Qualquer outro formato **quebra o build de produção** (limitação confirmada na doc do `expo-splash-screen`). Tamanho de exibição na tela é controlado à parte por `imageWidth` no plugin (hoje `76`). |
| `favicon.png` | 48×48px | PNG | Só para a versão web (Expo Router). Já está correto — fora de escopo desta rodada. |

**Notas gerais confirmadas na doc do Expo:**
- O app icon **não muda dentro do Expo Go** — só aparece de fato num development/preview/production build.
- Splash screen também não é testável no Expo Go nem no dev client puro — precisa de build preview ou produção pra ver o resultado real.
- `expo-splash-screen` suporta uma variante separada para dark mode (`ios.dark` / `android.dark`, com `image` e `backgroundColor` próprios) — hoje o `app.json` não usa essa opção, então a splash é idêntica nos dois temas. Recomendado usar (seção 6).

## 4. Estado atual dos assets (o que precisa ser refeito)

Os arquivos em `assets/images/` hoje são os placeholders padrão gerados pelo `create-expo-app` — nenhum foi desenhado para o conceito "Repor":

| Arquivo | Tamanho atual | Situação |
|---|---|---|
| `icon.png` | 1024×1024 | Placeholder — **refazer** |
| `android-icon-foreground.png` | 512×512 | Placeholder, **abaixo do recomendado** — refazer em 1024×1024 |
| `android-icon-background.png` | 512×512 | Placeholder — **remover**, trocar por `backgroundColor` sólido |
| `android-icon-monochrome.png` | 432×432 | Placeholder, **abaixo do recomendado** — refazer em 1024×1024 |
| `splash-icon.png` | 228×213 | Placeholder, **muito abaixo do recomendado e fora de proporção quadrada** — refazer em 1024×1024 |

## 5. Prompts RACE (um por imagem — copiar e colar num gerador de imagem)

Formato **R**ole / **A**ction / **C**ontext / **E**xpectation.

### 5.1 `icon.png` — ícone mestre

```
Role: Você é um ilustrador de ícones de app minimalista, especializado em
iconografia flat/geométrica para App Store e Google Play.

Action: Crie um ícone de app quadrado com 3 barras verticais retangulares,
lado a lado, cada uma preenchida até uma altura diferente (aprox. 30%,
65% e 90% da altura da barra, da esquerda pra direita) — como um
equalizador ou gráfico de barras bem simples. As 3 barras repousam sobre
uma única linha horizontal fina (a "régua de base") que atravessa as três.

Context: O app se chama "Repor" e ajuda famílias a controlar o que está
acabando em casa: cada barra representa o nível de estoque de um produto,
o conjunto das 3 representa a lista de compras, e a leitura de alturas
diferentes remete a controle financeiro/gasto. Use fundo sólido na cor
#0F1513 (verde-petróleo bem escuro) preenchendo todo o quadrado. As barras
(contorno) na cor #E9EFEA (quase branco); o preenchimento de cada barra
na cor #63B4D4 (azul-azulejo); a régua de base também em #E9EFEA. Nada de
gradiente vibrante, nada de mascote, nada de texto, nada de sombra
projetada dramática, nada de brilho/glossy. Cantos retos (raio 0) em
todas as barras — não arredondar nada.

Expectation: PNG quadrado, 1024×1024 pixels, fundo sólido cobrindo 100%
do canvas (sem transparência, sem cantos já arredondados — o sistema
operacional aplica a máscara depois), composição centralizada com margem
de respiro de ~12% em cada borda, espaçamento entre barras igual à
largura de cada barra, as 3 barras continuando distinguíveis entre si
mesmo reduzidas a 32px.
```

### 5.2 `android-icon-foreground.png` — camada de primeiro plano (Android)

```
Role: O mesmo ilustrador do ícone mestre, agora adaptando a peça para o
sistema de ícone adaptativo do Android.

Action: Recrie as mesmas 3 barras com níveis diferentes e a régua de base
(mesmas formas e cores do ícone mestre: preenchimento #63B4D4, contorno e
régua #E9EFEA), mas isoladas — só as barras e a régua, sem nenhum fundo
colorido atrás.

Context: Este arquivo é só a camada de "primeiro plano" de um ícone
adaptativo do Android. O sistema operacional aplica máscaras diferentes
por cima dele (círculo, "squircle", quadrado arredondado) dependendo do
launcher do fabricante — por isso todo o conteúdo importante precisa
caber dentro de uma zona segura central de aproximadamente 66% do
diâmetro do canvas; qualquer parte fora dessa área pode ser cortada.

Expectation: PNG quadrado, 1024×1024 pixels, fundo 100% transparente,
composição das 3 barras + régua centralizada, ocupando no máximo ~660px
de largura efetiva (deixando margem generosa fora da zona segura), mesma
paleta do ícone mestre, barras ainda distinguíveis entre si dentro dessa
área reduzida.
```

### 5.3 `android-icon-monochrome.png` — ícone temático Android 13+

```
Role: O mesmo ilustrador, agora produzindo a variante monocromática.

Action: Crie uma versão em silhueta das mesmas 3 barras com níveis
diferentes e a régua de base — só as formas preenchidas em branco sólido
(barra inteira, do topo do preenchimento até a régua, mais o contorno
vazio da parte não preenchida da barra), sem nenhuma cor, sem gradiente,
sem variação de opacidade interna.

Context: Esse arquivo alimenta os "ícones temáticos" do Android 13+
(Material You) — o sistema recolore essa silhueta automaticamente com a
cor de destaque extraída do papel de parede do usuário, então a cor
original da arte não importa, só a forma e o canal alfa. Precisa manter a
mesma zona segura central de ~66% do diâmetro usada no ícone adaptativo
(seção 5.2), para não ser cortada pelas mesmas máscaras, e as 3 barras
continuarem distinguíveis só pelo contorno/preenchimento em branco.

Expectation: PNG quadrado, 1024×1024 pixels, fundo 100% transparente,
formas preenchidas inteiramente em branco sólido (#FFFFFF), silhueta
legível mesmo sem cor e em tamanho pequeno.
```

### 5.4 `splash-icon.png` — marca da tela de splash

```
Role: O mesmo ilustrador, agora criando a versão para a tela de
carregamento (splash screen).

Action: Crie uma versão simplificada do mesmo símbolo (as 3 barras com
níveis diferentes sobre a régua de base) para ser usada como logo central
da splash, sem nenhum fundo — só a marca.

Context: Essa imagem aparece centralizada sobre um fundo sólido (a cor de
fundo do tema ativo do app — #0F1513 no tema escuro "Despensa" ou #F1F4F1
no tema claro "Porcelana"), durante os poucos milissegundos de
carregamento do app antes da primeira tela aparecer. Não pode ter texto
(o nome do app não aparece na splash), não pode ter animação (é uma
imagem estática, exibida em repouso).

Expectation: PNG quadrado, 1024×1024 pixels, fundo 100% transparente,
símbolo em traço único na cor #63B4D4 (azul-azulejo — funciona sobre os
dois fundos claro e escuro por contraste), proporção legível numa largura
de exibição pequena (~76px, conforme configuração atual do projeto).
Entregar também uma segunda versão idêntica trocando a cor do traço para
#E9EFEA (quase branco), para uso opcional sobre o tema escuro caso o azul
não tenha contraste suficiente nos testes visuais.
```

## 6. Ajustes recomendados no `app.json` após gerar os assets

1. Remover `android.adaptiveIcon.backgroundImage` e usar só `backgroundColor` (cor sólida, sem precisar gerar `android-icon-background.png`) — hoje já é `"#E6F4FE"`, pode manter ou trocar por um tom derivado de `action.azulejo`.
2. Corrigir a cor de fundo da splash (hoje `"#208AEF"`, que não existe em nenhum tema) para bater com o tema ativo, usando a variante dark do plugin:

```json
[
  "expo-splash-screen",
  {
    "backgroundColor": "#F1F4F1",
    "image": "./assets/images/splash-icon.png",
    "imageWidth": 76,
    "dark": {
      "backgroundColor": "#0F1513",
      "image": "./assets/images/splash-icon-dark.png"
    }
  }
]
```

3. Validar em build preview/produção (splash e ícone real não aparecem no Expo Go nem no dev client) — usar o workflow `dev-client-build.yml` ou `preview-on-develop.yml` já configurados em `.eas/workflows/`.
