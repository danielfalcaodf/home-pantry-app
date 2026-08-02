# CLAUDE.md

Guia de trabalho para este repositório. É um cheat sheet — para o "porquê" de cada decisão, ver os documentos-fonte linkados no fim.

## O que é o projeto

App mobile (React Native + Expo) de controle de estoque doméstico ("Repor"). Cada produto tem `quantidade_atual` e `quantidade_necessaria`; o app calcula o que falta e gera lista de compras. MVP roda **100% local, sem backend** — sync entre dispositivos é Fase 2, e o schema já está desenhado para ela ser aditiva, não uma reescrita.

Projeto ainda **não foi inicializado** (sem `package.json`, sem código — só os 4 documentos de design). Ao fazer o scaffold inicial, siga a stack e a estrutura abaixo; não improvise outra.

## Stack

- **Mobile**: React Native + Expo, **EAS development build** (não Expo Go — notificações, widget e scanner previstos nas próximas fases não funcionam no Expo Go)
- **Roteamento**: Expo Router
- **Banco local**: SQLite via `expo-sqlite` + **Drizzle ORM** (`drizzle-kit` para migrations)
- **Estado**: sem Redux/TanStack Query. SQLite é a fonte de verdade; `useLiveQuery` do Drizzle re-renderiza a UI. Estado efêmero de tela em `useState`; se precisar de estado global de UI, Zustand.
- **Animação**: `react-native-reanimated` (spring na UI thread)
- **Outros**: `expo-haptics`, `expo-keep-awake`, `@gorhom/bottom-sheet`, `FlashList` (listas >150 itens)
- Sem biblioteca de design system pronta — os ~12 componentes são custom (ver design de frontend).

## Comandos (a confirmar após o scaffold)

Ainda não há `package.json`. Ao inicializar, documentar aqui os comandos reais de `dev`, `test`, `lint` e `typecheck` assim que existirem — não adivinhar.

Fluxo de schema já definido na arquitetura:
```
alterar src/infrastructure/db/schema.ts
→ npx drizzle-kit generate
→ revisar o .sql gerado manualmente antes do commit
→ commit
```

## Arquitetura — regra de dependência (não violar)

Layered feature-based com Ports & Adapters só na fronteira de persistência. As setas apontam sempre para dentro:

```
presentation/  → importa application/, e de domain/ só tipos e formatadores
application/   → importa domain/ e as INTERFACES de ports/ (nunca a implementação)
domain/        → TypeScript puro. ZERO import de React, Expo, Drizzle ou SQLite
infrastructure/→ implementa ports/; única camada que conhece SQLite
```

Teste de conformidade antes de qualquer merge — se retornar alguma linha, a regra foi violada:
```bash
grep -rE "from ['\"](expo|react|drizzle|@react)" src/domain/
```

Estrutura de diretórios (feature-based dentro de cada camada, não por tipo — `produto/`, `compra/`, `movimento/`, não `components/`, `services/`, `models/`):

```
app/                    # Expo Router — só rotas, telas finas
src/
├── domain/             # entidades + regras puras, com testes
├── ports/              # interfaces de repositório
├── infrastructure/
│   ├── db/             # client, schema Drizzle, migrations, seed
│   └── repositories/   # SQLiteProdutoRepository etc.
├── application/        # casos de uso / hooks (use-dar-baixa, use-lista-compras...)
├── presentation/        # componentes, theme, formatadores
└── shared/              # Result<T,E>, geração de UUID
```

## Regras de domínio que não podem ser violadas por código gerado

- **Quantidade em milésimos** (`INTEGER`): `1.5 kg` = `1500`. **Dinheiro em centavos** (`INTEGER`): `R$ 12,90` = `1290`. Nunca `REAL`/`FLOAT` para nenhum dos dois. Conversão só na borda de exibição, em `domain/shared/`.
- **UUID v7** como PK de tudo (não v4, não autoincrement) — offline-safe e ordenável por tempo.
- **`movimento_estoque` é append-only.** Nunca `UPDATE`/`DELETE`. Desfazer = movimento inverso.
- **`produto.quantidade_atual` é desnormalizado de propósito** (materializado, não derivado de `SUM(movimento_estoque)`) — é o único jeito de manter a baixa ≤ 10s (KPI K4) conforme o histórico cresce. Toda escrita que mexe nele **precisa** estar na mesma transação do `INSERT` em `movimento_estoque`. Nunca separar as duas chamadas.
- **Campos derivados nunca são persistidos**: `valor_total_estoque`, `em_falta`, `quantidade_a_comprar`, `custo_reposicao` são sempre função pura no domínio (`domain/produto/estoque.rules.ts`), nunca coluna de tabela nem cálculo duplicado em SQL. SQL entrega valor bruto; o domínio arredonda/converte.
- **`quantidade_a_comprar` arredonda para cima** em unidades indivisíveis (`un`, `pacote`, `caixa`) — regra testada, não inline.
- **`PRAGMA foreign_keys = ON`** precisa rodar a cada abertura de conexão (SQLite vem com FK desligada por padrão) — sem isso, FKs do schema viram decoração.
- **Toda escrita passa pelo repositório.** Nenhum acesso direto ao `db` fora de `infrastructure/`.
- Não há tabela `lista_compras` — a lista é sempre derivada por query (`quantidade_atual < quantidade_necessaria`) + itens avulsos da `compra` em status `aberta`. Não materializar.
- `categoria` é texto livre por decisão consciente (não é FK para uma tabela própria) — mas precisa ser normalizada na escrita (trim, capitalização) e ter autocomplete a partir do que já existe. Nunca gravar o texto cru do usuário.
- Migrations são **forward-only** (sem rollback executável no aparelho); testar aplicando desde o schema vazio e desde cada versão anterior; nunca editar migration já publicada, criar uma nova; backup automático do `.db` antes de aplicar.

## Princípios de código

O projeto segue SOLID, clean code e design patterns como consequência prática da arquitetura em camadas — não como checklist à parte:

- **SRP**: cada caso de uso em `application/` faz uma coisa (`use-dar-baixa`, `use-lista-compras`, não um `use-produto` genérico com dez responsabilidades). Cada regra de domínio é uma função pura nomeada pelo que calcula (`estadoDoItem`, `alturaDoNivel`, `quantidadeAComprar`), não um util genérico.
- **OCP/DIP via Ports & Adapters**: `application/` depende da interface em `ports/`, nunca de `SQLiteProdutoRepository` diretamente. Trocar SQLite por outra fonte (ou adicionar sync na Fase 2) é implementar um novo adapter, não editar caso de uso. Isso já é a regra de dependência da seção de arquitetura — não a reinvente com abstrações extras.
- **LSP**: qualquer implementação de uma interface de `ports/` (real ou fake de teste) precisa ser substituível sem o caso de uso saber a diferença — é o que permite testar `application/` com repositório fake em vez de SQLite em memória.
- **ISP**: interfaces de `ports/` ficam pequenas e focadas por agregado (`ProdutoRepository`, `MovimentoRepository`, `CompraRepository`), não uma `Repository` gigante com todos os métodos do domínio.
- **Composição sobre herança**: React não tem herança útil aqui de qualquer forma — hooks de `application/` e componentes pequenos e compostos em `presentation/`, não classes base ou HOCs genéricos.
- **Clean code**: nomes revelam intenção em português do domínio (`quantidadeAComprar`, não `calc()`); funções pequenas, um nível de abstração por função; sem comentário explicando *o quê* (nome já diz) — comentário só quando explica um *porquê* não óbvio (ex.: por que `quantidade_atual` é desnormalizado, já documentado acima). Não adicionar abstração, flag ou tratamento de erro para cenário que não pode acontecer — regra geral do repositório, vale também aqui.
- **Result/erro explícito**: `shared/Result<T,E>` para falhas esperadas (validação, conflito de nome de produto) em vez de exceptions genéricas atravessando camadas; exceptions ficam para o realmente excepcional (falha de I/O do SQLite).
- Padrões concretos já implícitos na arquitetura, não adicionar novos sem necessidade: **Repository** (ports/infrastructure), **Factory** só se a criação de entidade (UUID v7 + defaults) ficar repetida em mais de um caso de uso, **Strategy** só se `estadoDoItem()` precisar de variantes reais — não introduzir por antecipação.

## Testes

- `domain/` deve rodar sem emulador (Jest/Vitest puro) — meta de cobertura **≥ 90%**, é onde os bugs saem caros.
- Casos que quebram silenciosamente e por isso exigem teste explícito: baixa que cruzaria zero (deve fixar em 0), arredondamento de `quantidade_a_comprar`, item sem preço na lista (custo 0, não corrompe total), finalizar compra com falha no meio (rollback total), desfazer (movimento inverso, nunca DELETE).
- `infrastructure/`: Jest + SQLite em memória, cobrindo repositórios/transações/migrations.
- `application/`: React Native Testing Library com repositório fake.

## Design de UI — restrições que não são estéticas, são de produto

Direção: **"linha d'água"**. Cada item da lista é um medidor vertical que preenche a fração `quantidade_atual / quantidade_necessaria`, de baixo para cima, com uma régua de 2px marcando a superfície. Sem cards, sem sombra, sem borda na lista principal — decisão deliberada (card é contêiner neutro, e 200 cards viram catálogo, não despensa).

- Estado nunca depende só de cor — sempre **três canais redundantes**: altura do preenchimento + cor da régua + rótulo textual (`Cheio` / `Falta 2` / `Acabou`). Zerado = **sem tinta**, só a régua na base em `state.critico` — o vazio é o sinal.
- **Nenhum hex fora de `src/presentation/theme/tokens.ts`.** Um `#` literal em `presentation/components/` é bug — vale lint rule.
- Cálculo de estado/fração é sempre função pura no domínio (`estadoDoItem()`, `alturaDoNivel()` em `domain/produto/estoque.rules.ts`), nunca no componente. O componente recebe `{ estado, fracao, rotulo }` prontos. `fracao` precisa ser clampada em `[0,1]` antes de virar altura (produto com 5 de 2 não pode vazar da linha) — isso é regra de domínio testada, não um `Math.min` improvisado no estilo.
- O caminho crítico é dar baixa: ≤ 3 toques, ≤ 10s (KPI K4). Nenhum elemento de UI pode competir com esse gesto — sem confirmação, sem navegação extra, sem spinner nele. Sem swipe: gesto invisível não pode carregar a ação principal do app.
- Vocabulário: a UI nunca usa termos de domínio como "dar baixa"/"movimento de estoque"/"reposição". Usa "Usei", "Repus"/"Comprei", "Fechar compra", "Despensa", "Faltando", "Acabou". A ação mantém o mesmo nome do início ao fim: botão `Usei` → toast `Anotado` → histórico `Você anotou`. Estados vazios e erros são convites/instruções, nunca avisos secos (ver §11 do doc de frontend para os textos exatos).
- Altura da linha de item: 68px, raio 0 (intencional — a linha é um recipiente cheio de líquido). Alvos de toque mínimo 48×48dp, inclusive o stepper.
- Duas paletas irmãs (não uma invertida na outra): tema escuro **Despensa**, tema claro **Porcelana** — tokens completos em `src/presentation/theme/tokens.ts` (`bg`, `line`, `text`, `state.{cheio,emFalta,critico}`, `action.azulejo`, `fillOpacity` 0.12 escuro / 0.10 claro). Tema lido de `useColorScheme()`, preferência persistida no SQLite; ler o tema salvo **antes** de esconder a splash screen para não piscar branco na abertura.
- Tipografia com três papéis fixos, nunca intercambiáveis: **Archivo** (display — só título de tela e quantidade grande do detalhe), **IBM Plex Sans** (corpo/UI), **IBM Plex Mono tabular** (todo número: preço, quantidade, total, data — figuras tabulares evitam que a lista "pule" a cada toque). Nada acima de 34pt. Confirmar os pesos exportados pelos pacotes `@expo-google-fonts/*` antes de fixar constantes — nem toda família exporta todos os pesos.
- Movimento é orquestrado só no gesto de dar baixa (háptico leve → stepper contrai 0.92 → linha d'água desce em spring damping 18 sobre `react-native-reanimated`, rodando na UI thread → cross-fade dos números → toast). Nada mais anima: sem entrada de tela em cascata, sem skeleton shimmer, sem contagem progressiva de números — isso adiciona latência percebida ao caminho crítico. Com `reduceMotion` do sistema ligado, o nível muda em corte seco (fade 100ms) e o háptico permanece; usar `withSpring(..., { reduceMotion: ReduceMotion.System })` para respeitar a preferência de acessibilidade automaticamente em vez de checar a flag manualmente.
- Sem biblioteca de design system pronta — os ~12 componentes (`ItemDespensa`, stepper, teclado de quantidade em bottom sheet, toast de desfazer, chip de estado, campo de texto, item do modo compra) são custom. Ver `FRONTEND-DESIGN-app-estoque-de-casa.md` §7 antes de implementar qualquer um deles — a especificação de layout, estados e comportamento de toque já está fechada lá.

## Fora de escopo do MVP (não implementar sem confirmar)

Scanner de código de barras, leitura de nota fiscal, baixa automática por consumo médio, integração com supermercados/e-commerce, controle de validade/lote, receitas/cardápio, multi-casa por usuário, versão web/desktop, divisão de despesas, qualquer feature de IA. Casa compartilhada (US-08) e sync offline (US-09) também estão fora do MVP porque não há backend ainda — isso é intencional (ver ADR-03), não um esquecimento.

## Documentos-fonte (ler antes de decisões arquiteturais novas)

- `PRD-app-estoque-de-casa.md` — user stories, critérios de aceite, KPIs, não-metas.
- `ARQUITETURA-app-estoque-de-casa.md` — padrão arquitetural, ADRs, estrutura de diretórios, caminho de evolução para sync (Fase 2).
- `DATABASE-app-estoque-de-casa.md` — DDL completo, índices, queries críticas, estratégia de migração, schema Drizzle.
- `FRONTEND-DESIGN-app-estoque-de-casa.md` — sistema visual, tokens de tema, componentes, tipografia, movimento/animação.

Se uma implementação exigir contradizer algo acima, é sinal de atualizar o documento correspondente primeiro — não divergir silenciosamente.
