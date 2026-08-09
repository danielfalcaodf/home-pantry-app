## Why

O design de frontend aposta tudo em um lugar só: **a linha d'água**. Sem cards, sem sombras, sem bordas na lista principal — um layout que se sustenta pela precisão do espaçamento e pela tipografia, e que desmonta se o ritmo vertical estiver errado (FRONTEND §2.3). Isso significa que os tokens e os componentes-base não são "estilo aplicado depois": eles são a estrutura.

Construí-los antes de qualquer tela evita o resultado clássico de código gerado por IA — cada tela inventando seu próprio espaçamento e sua própria cor. A regra de FRONTEND §12.1 é literal: **nenhum hex fora de `tokens.ts`**, e o lint dessa regra já está ligado desde o bootstrap. Esta change é o que lhe dá algo a proteger.

## What Changes

- Cria `src/presentation/theme/tokens.ts` com as duas paletas irmãs completas: **Despensa** (escuro) e **Porcelana** (claro), com `bg`, `line`, `text`, `state`, `action` e `fillOpacity`.
- Cria os tokens de espaço (`4·8·12·16·24·32·48`), raio (`0·8·12·999`) e a escala tipográfica de oito papéis.
- Instala e carrega as fontes **Archivo** (display), **IBM Plex Sans** (corpo/UI) e **IBM Plex Mono tabular** (todo número), verificando quais pesos cada pacote realmente exporta antes de fixar constantes.
- Cria `ThemeProvider` + `useTheme()`, lendo `useColorScheme()` do sistema com preferência do usuário (`Automático` / `Claro` / `Escuro`) **persistida no SQLite**.
- Lê o tema salvo **antes** de esconder a splash screen, para não piscar branco na abertura (FRONTEND §12.4).
- Implementa os componentes-base que não dependem de dados de produto: `Texto` (com os papéis tipográficos), `Botao`, `CampoTexto`, `ChipEstado`, `Toast`, `EstadoVazio`, `TelaErro`.
- Configura `react-native-reanimated` com respeito automático a `reduceMotion` do sistema.
- Define a preferência de tema como a primeira coluna de configuração persistida — exige uma migration nova.

## Capabilities

### New Capabilities

- `tema-e-tokens`: as duas paletas, a escala tipográfica, espaço e raio, o provedor de tema e a persistência da preferência do usuário.
- `componentes-base`: os componentes de interface que não conhecem o domínio de estoque — texto tipografado, botão, campo, chip, toast, estado vazio e tela de erro.
- `tipografia-carregada`: carregamento das três famílias com os pesos efetivamente usados, e a abertura do app sem flash de tema errado.

### Modified Capabilities

- `banco-local`: adiciona a tabela de configuração para persistir a preferência de tema, através de uma migration nova e forward-only.

## Impact

- **Cria**: `src/presentation/theme/{tokens,tipografia,espaco,provider}.ts`, `src/presentation/components/*` (base), `src/infrastructure/db/migrations/0001_configuracao`.
- **Modifica**: `app/_layout.tsx` (provedor de tema, fontes, controle da splash), `src/infrastructure/db/schema.ts` (tabela de configuração).
- **Depende de**: `bootstrap-projeto-expo` (lint de cor, Reanimated) e `persistencia-sqlite` (persistir a preferência).
- **Bloqueia**: todas as changes de tela.
- **Peso de bundle**: três famílias de fonte. FRONTEND §13 fixa o limite — se passar de 400 KB, Archivo é a primeira a sair.
