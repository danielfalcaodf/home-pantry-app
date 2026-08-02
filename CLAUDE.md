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

## Testes

- `domain/` deve rodar sem emulador (Jest/Vitest puro) — meta de cobertura **≥ 90%**, é onde os bugs saem caros.
- Casos que quebram silenciosamente e por isso exigem teste explícito: baixa que cruzaria zero (deve fixar em 0), arredondamento de `quantidade_a_comprar`, item sem preço na lista (custo 0, não corrompe total), finalizar compra com falha no meio (rollback total), desfazer (movimento inverso, nunca DELETE).
- `infrastructure/`: Jest + SQLite em memória, cobrindo repositórios/transações/migrations.
- `application/`: React Native Testing Library com repositório fake.

## Design de UI — restrições que não são estéticas, são de produto

- Conceito central: **linha d'água**. Cada item da lista é um medidor vertical que preenche a fração `quantidade_atual / quantidade_necessaria`. Estado nunca depende só de cor — sempre altura + régua colorida + rótulo textual (acessibilidade e legibilidade de relance).
- **Nenhum hex fora de `src/presentation/theme/tokens.ts`.** Um `#` literal em `presentation/components/` é bug.
- Cálculo de estado/fração é sempre função pura no domínio (`estadoDoItem()`, `alturaDoNivel()`), nunca no componente. `fracao` precisa ser clampada em `[0,1]` antes de virar altura.
- O caminho crítico é dar baixa: ≤ 3 toques, ≤ 10s (KPI K4). Nenhum elemento de UI pode competir com esse gesto — sem confirmação, sem navegação extra, sem spinner nele.
- Vocabulário: a UI nunca usa termos de domínio como "dar baixa"/"movimento de estoque". Usa "Usei", "Repus", "Fechar compra", "Despensa", "Faltando", "Acabou" (ver seção 11 do doc de frontend).
- Sem card/sombra/borda na lista principal — decisão deliberada, não esquecimento.

## Fora de escopo do MVP (não implementar sem confirmar)

Scanner de código de barras, leitura de nota fiscal, baixa automática por consumo médio, integração com supermercados/e-commerce, controle de validade/lote, receitas/cardápio, multi-casa por usuário, versão web/desktop, divisão de despesas, qualquer feature de IA. Casa compartilhada (US-08) e sync offline (US-09) também estão fora do MVP porque não há backend ainda — isso é intencional (ver ADR-03), não um esquecimento.

## Documentos-fonte (ler antes de decisões arquiteturais novas)

- `PRD-app-estoque-de-casa.md` — user stories, critérios de aceite, KPIs, não-metas.
- `ARQUITETURA-app-estoque-de-casa.md` — padrão arquitetural, ADRs, estrutura de diretórios, caminho de evolução para sync (Fase 2).
- `DATABASE-app-estoque-de-casa.md` — DDL completo, índices, queries críticas, estratégia de migração, schema Drizzle.
- `FRONTEND-DESIGN-app-estoque-de-casa.md` — sistema visual, tokens de tema, componentes, tipografia, movimento/animação.

Se uma implementação exigir contradizer algo acima, é sinal de atualizar o documento correspondente primeiro — não divergir silenciosamente.
