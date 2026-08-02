# Arquitetura — App de Estoque de Casa

| Campo | Valor |
|---|---|
| Versão | 0.1 |
| Data | 02/08/2026 |
| Documento base | PRD — App de Estoque de Casa v0.1 |
| Stack | React Native + Expo + SQLite (expo-sqlite) |
| Backend no MVP | **Nenhum** — 100% local no dispositivo |
| Time | 1 dev com apoio de IA (Claude Code) |
| Prioridade | Base estruturada para evoluir sem retrabalho |

---

```
Architecture Design Progress:
- [x] Step 1: Entender requisitos e restrições
- [x] Step 2: Dimensionar projeto e time
- [x] Step 3: Selecionar padrão arquitetural
- [x] Step 4: Definir estrutura de diretórios
- [x] Step 5: Documentar trade-offs (ADRs)
- [x] Step 6: Validar contra o framework de decisão
```

---

## 1. Contexto e restrições

**Do PRD:**
- Baixa de estoque precisa ser instantânea (≤ 3 toques, ≤ 10s) — é o KPI que decide se o produto vive ou morre.
- Cálculos são determinísticos e simples: `necessária − atual`, somatórios, classificação de estado.
- Movimentos de estoque são append-only (histórico e, no futuro, resolução de conflito por delta).
- Casa compartilhada entre 2 moradores com sync offline-first.

**Da sessão de decisão:**
- MVP **sem backend**. Isso remove sync do escopo imediato.
- Dev solo, código gerado com apoio de IA.
- Otimizar para evolução sem retrabalho, não para velocidade bruta.

### 1.1 Consequência imediata no escopo (importante)

Sem backend, **US-08 (casa compartilhada) e US-09 (sync offline) saem do MVP**. O app roda em um dispositivo só. As duas consequências práticas:

- **K6** (sync em ≤ 5s entre aparelhos) fica suspenso até a Fase 2.
- **K2** (precisão do estoque ≥ 85%) fica em risco se a outra pessoa da casa consumir sem registrar. Mitigação de produto na Fase 1: tela de "conferência de estoque" semanal para recalibrar.

Isso é uma troca consciente, não um esquecimento. O ponto central desta arquitetura é: **a Fase 2 (sync) deve ser aditiva, não uma reescrita.** Tudo abaixo é desenhado para isso.

---

## 2. Dimensionamento e escolha do padrão

| Critério | Situação | Implicação |
|---|---|---|
| Tamanho estimado | 6–10K LOC no MVP | Faixa de "simples" pela tabela de referência |
| Time | 1 dev + IA | Monolito com módulos claros |
| Complexidade de domínio | Baixa, mas com regras que não podem errar (delta, arredondamento, dinheiro) | Domínio isolado e testável |
| Evolução prevista | Trocar persistência local por local+remoto | Fronteira de I/O precisa ser plugável |

**Padrão escolhido: Layered feature-based com Ports & Adapters na fronteira de dados.**

Clean Architecture completa (use case como classe para cada operação, DTOs em cada camada, injeção via container) seria overhead para um app doméstico de dev solo. Layered puro, por outro lado, deixa o SQLite vazar para dentro dos componentes — e aí o retrofit de sync vira reescrita.

O meio-termo: **camadas simples, mas com a persistência atrás de uma porta (interface).** É o único ponto onde vale pagar o preço da abstração, porque é exatamente ali que a Fase 2 vai mexer.

```
┌───────────────────────────────────────────────┐
│  Presentation — telas Expo Router, componentes │
│  Sem regra de negócio. Só renderiza e dispara. │
├───────────────────────────────────────────────┤
│  Application — hooks/casos de uso              │
│  darBaixa, gerarLista, finalizarCompra         │
├───────────────────────────────────────────────┤
│  Domain — entidades + regras puras             │
│  Zero import de React, Expo ou SQLite          │
├───────────────────────────────────────────────┤
│  Ports — interfaces de repositório             │
├───────────────────────────────────────────────┤
│  Infrastructure — adapters                     │
│  SQLiteProdutoRepository (hoje)                │
│  SyncedProdutoRepository (Fase 2)              │
└───────────────────────────────────────────────┘
```

### 2.1 Regra de dependência

As setas apontam **sempre para dentro**:

- `domain/` não importa nada de fora. Nem React, nem Expo, nem Drizzle. É TypeScript puro.
- `application/` importa `domain/` e as **interfaces** de `ports/`, nunca a implementação concreta.
- `infrastructure/` implementa `ports/` e é a única camada que conhece SQLite.
- `presentation/` importa `application/`, e do `domain/` só tipos e formatadores.

Teste rápido de conformidade — se este comando retornar qualquer linha, a regra foi violada:

```bash
grep -rE "from ['\"](expo|react|drizzle|@react)" src/domain/
```

Vale colocar isso num script de CI local ou num lint rule (`eslint-plugin-boundaries`).

---

## 3. Estrutura de diretórios

```
app/                              # Expo Router — só rotas, telas finas
├── (tabs)/
│   ├── index.tsx                 # Estoque (tela principal)
│   ├── lista.tsx                 # Lista de compras
│   └── resumo.tsx                # Valores e histórico
├── produto/
│   ├── [id].tsx                  # Detalhe/edição
│   └── novo.tsx
├── compra/[id].tsx               # Modo compra (checkbox no mercado)
└── _layout.tsx

src/
├── domain/                       # ⬅ núcleo puro, sem dependências externas
│   ├── produto/
│   │   ├── produto.ts            # tipo Produto
│   │   ├── estoque.rules.ts      # emFalta, estado, quantidadeAComprar
│   │   └── estoque.rules.test.ts
│   ├── compra/
│   │   ├── compra.ts
│   │   └── compra.rules.ts       # reposição, total pago
│   ├── movimento/
│   │   └── movimento.ts          # baixa | reposicao | ajuste
│   └── shared/
│       ├── quantidade.ts         # milésimos ↔ decimal, arredondamento
│       ├── dinheiro.ts           # centavos, formatação BRL
│       └── unidade.ts            # un, kg, g, L, ml, pacote, caixa
│
├── ports/                        # ⬅ contratos (interfaces)
│   ├── produto.repository.ts
│   ├── movimento.repository.ts
│   ├── compra.repository.ts
│   └── clock.ts                  # data/hora injetável (testes determinísticos)
│
├── infrastructure/
│   ├── db/
│   │   ├── client.ts             # abertura do expo-sqlite
│   │   ├── schema.ts             # schema Drizzle
│   │   ├── migrations/           # geradas por drizzle-kit
│   │   └── seed.ts               # lista base de ~40 itens (onboarding)
│   └── repositories/
│       ├── sqlite-produto.repository.ts
│       ├── sqlite-movimento.repository.ts
│       └── sqlite-compra.repository.ts
│
├── application/                  # ⬅ casos de uso, orquestração
│   ├── estoque/
│   │   ├── use-dar-baixa.ts
│   │   ├── use-ajustar-estoque.ts
│   │   └── use-produtos.ts       # live query
│   ├── lista/
│   │   ├── use-lista-compras.ts
│   │   └── use-adicionar-avulso.ts
│   └── compra/
│       └── use-finalizar-compra.ts
│
├── presentation/
│   ├── components/               # ItemEstoque, StepperQuantidade, ...
│   ├── theme/                    # tokens, cores por estado
│   └── format/                   # exibição de moeda/quantidade
│
└── shared/
    ├── result.ts                 # Result<T, E> em vez de throw no domínio
    └── id.ts                     # geração de UUID v4
```

**Por que feature-based dentro de cada camada e não pastas por tipo (`components/`, `services/`, `models/`):** com IA gerando código, o custo maior é achar e alterar coisa relacionada. Agrupar por conceito de negócio (`produto`, `compra`, `movimento`) mantém a mudança local — mexer em preço não deveria abrir 5 pastas.

---

## 4. Modelo de dados local (SQLite)

Schema desenhado **hoje** com os campos que a sincronização vai exigir **amanhã**. Adicionar essas colunas custa quase nada agora; adicioná-las depois, com dados reais no aparelho, exige migração e conciliação.

```sql
CREATE TABLE casa (
  id            TEXT PRIMARY KEY,        -- uuid, não autoincrement
  nome          TEXT NOT NULL,
  criada_em     INTEGER NOT NULL
);

CREATE TABLE usuario (
  id            TEXT PRIMARY KEY,
  casa_id       TEXT NOT NULL REFERENCES casa(id),
  nome          TEXT NOT NULL,
  perfil        TEXT NOT NULL DEFAULT 'admin'   -- admin | membro
);

CREATE TABLE produto (
  id                     TEXT PRIMARY KEY,
  casa_id                TEXT NOT NULL REFERENCES casa(id),
  nome                   TEXT NOT NULL,
  categoria              TEXT,
  unidade                TEXT NOT NULL,
  quantidade_atual       INTEGER NOT NULL DEFAULT 0,   -- milésimos
  quantidade_necessaria  INTEGER NOT NULL,             -- milésimos
  valor_unitario         INTEGER NOT NULL DEFAULT 0,   -- centavos
  marca_preferida        TEXT,
  ativo                  INTEGER NOT NULL DEFAULT 1,
  criado_em              INTEGER NOT NULL,
  atualizado_em          INTEGER NOT NULL,             -- last-write-wins (Fase 2)
  deletado_em            INTEGER,                      -- soft delete (Fase 2)
  sync_status            TEXT NOT NULL DEFAULT 'local' -- local | pendente | sincronizado
);

CREATE TABLE movimento_estoque (      -- append-only, nunca UPDATE
  id                     TEXT PRIMARY KEY,
  produto_id             TEXT NOT NULL REFERENCES produto(id),
  usuario_id             TEXT NOT NULL REFERENCES usuario(id),
  tipo                   TEXT NOT NULL,   -- baixa | reposicao | ajuste
  quantidade_delta       INTEGER NOT NULL,
  quantidade_resultante  INTEGER NOT NULL,
  motivo                 TEXT,
  criado_em              INTEGER NOT NULL,
  sync_status            TEXT NOT NULL DEFAULT 'local'
);

CREATE TABLE compra (
  id                TEXT PRIMARY KEY,
  casa_id           TEXT NOT NULL REFERENCES casa(id),
  usuario_id        TEXT NOT NULL REFERENCES usuario(id),
  status            TEXT NOT NULL,        -- aberta | finalizada
  valor_total_pago  INTEGER,
  criada_em         INTEGER NOT NULL,
  finalizada_em     INTEGER
);

CREATE TABLE compra_item (
  id                     TEXT PRIMARY KEY,
  compra_id              TEXT NOT NULL REFERENCES compra(id),
  produto_id             TEXT REFERENCES produto(id),   -- NULL = item avulso
  nome_avulso            TEXT,
  quantidade_planejada   INTEGER NOT NULL,
  quantidade_comprada    INTEGER,
  valor_pago_unitario    INTEGER,
  comprado               INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_produto_casa_ativo  ON produto(casa_id, ativo);
CREATE INDEX idx_movimento_produto   ON movimento_estoque(produto_id, criado_em DESC);
CREATE INDEX idx_sync_pendente       ON movimento_estoque(sync_status) WHERE sync_status <> 'sincronizado';
```

### 4.1 Decisões de modelagem que evitam retrabalho

| Decisão | Por quê |
|---|---|
| **UUID como PK, não autoincrement** | Dois aparelhos gerando IDs 1, 2, 3 colidem no primeiro sync. UUID é gerado offline sem coordenação. Custo hoje: zero. |
| **Quantidade em milésimos (INTEGER)** | `1.5 kg` vira `1500`. Elimina erro de ponto flutuante em somatório. O domínio converte na fronteira de exibição. |
| **Dinheiro em centavos (INTEGER)** | Mesma razão. `R$ 12,90` é `1290`. Nunca use `REAL` para dinheiro. |
| **`casa_id` presente desde o MVP** | Mesmo com uma casa só e um usuário só, todas as queries já filtram por casa. Na Fase 2 não é preciso reescrever nenhum repositório. |
| **`usuario_id` no movimento** | Registra quem fez a baixa desde já. Na Fase 2 o histórico não fica "órfão de autor" nos dados antigos. |
| **Movimentos append-only** | Permite recalcular `quantidade_atual` a partir do zero e é a base da resolução de conflito por delta na Fase 2. |
| **Soft delete (`deletado_em`)** | Deletar de verdade impede propagar a exclusão no sync. |
| **Campos derivados nunca persistidos** | `valor_total`, `em_falta`, `quantidade_a_comprar` são função pura no domínio. Persistir gera divergência silenciosa. |

### 4.2 Onboarding sem backend

O `seed.ts` com ~40 itens comuns de mercado é embarcado no bundle como JSON e inserido na primeira execução. Resolve o risco de "cadastro inicial pesado" do PRD sem depender de rede.

---

## 5. Fluxos principais

### 5.1 Dar baixa (o caminho crítico — meta ≤ 10s)

```
Toque em "−1"
   ↓
useDarBaixa (application)
   ↓  chama regra pura
domain/estoque.rules → novaQuantidade = max(0, atual − delta)
   ↓  uma transação
INSERT movimento_estoque  +  UPDATE produto.quantidade_atual
   ↓
live query do Drizzle reemite → UI re-renderiza sozinha
   ↓
Toast com "Desfazer" (10s) → insere movimento inverso, nunca DELETE
```

Sem confirmação, sem navegação, sem spinner. A escrita é local e síncrona o suficiente para ser instantânea — essa é a maior vantagem de não ter backend no MVP, e é bom aproveitá-la.

### 5.2 Gerar lista de compras

Não existe tabela "lista". A lista é **derivada** por query dos produtos com `quantidade_atual < quantidade_necessaria`, com os itens avulsos vindo de uma `compra` em status `aberta`. Isso evita o clássico bug de lista dessincronizada do estoque.

### 5.3 Finalizar compra

```
Para cada compra_item marcado, dentro de UMA transação:
  1. INSERT movimento_estoque (tipo=reposicao, delta=+quantidade_comprada)
  2. UPDATE produto.quantidade_atual += quantidade_comprada
  3. Se valor_pago ≠ valor_unitario e usuário confirmou → UPDATE valor_unitario
  4. UPDATE compra SET status='finalizada', valor_total_pago=Σ, finalizada_em=now
```

Transação única: ou a compra inteira entra, ou nada entra. Estoque parcialmente reposto por falha no meio é o pior estado possível para a confiança no app.

---

## 6. Architecture Decision Records

### ADR-01 — Padrão arquitetural

**Contexto:** Dev solo com IA, app pequeno, mas com troca de persistência prevista.

**Opções:**
1. Layered simples (telas → serviços → SQLite direto)
2. Clean Architecture completa (use cases como classes, DTOs, DI container)
3. Layered feature-based com Ports & Adapters só na fronteira de dados

| Critério | Opção 1 | Opção 2 | Opção 3 |
|---|---|---|---|
| Complexidade | Baixa | Alta | Média-baixa |
| Custo do retrofit de sync | Alto | Baixo | Baixo |
| Testabilidade do domínio | Baixa | Alta | Alta |
| Adequação a dev solo | Alta | Baixa | Alta |
| Previsibilidade p/ código gerado por IA | Média | Alta | Alta |

**Decisão:** Opção 3. Abstrai exatamente o ponto que vai mudar (persistência) e nada além disso.

**Consequências:**
- ✅ Regras de estoque testáveis sem emulador, sem banco, em milissegundos.
- ✅ Fase 2 troca implementações de repositório sem tocar em tela.
- ❌ Uma indireção a mais entre hook e SQLite — aceito conscientemente.
- ❌ Exige disciplina para não deixar SQL vazar para dentro dos componentes (mitigado pelo lint de fronteira da seção 2.1).

---

### ADR-02 — Camada de acesso ao SQLite

**Opções:** `expo-sqlite` puro · **Drizzle ORM sobre expo-sqlite** · WatermelonDB

| Critério | expo-sqlite puro | Drizzle | WatermelonDB |
|---|---|---|---|
| Tipagem | Nenhuma | Forte, derivada do schema | Média |
| Migrations | Manual | drizzle-kit gera | Próprio |
| Reatividade da UI | Manual | `useLiveQuery` | Observables |
| Sync embutido | Não | Não | Sim (protocolo próprio) |
| Peso/curva | Mínimo | Baixo | Alto, modelo opinado |

**Decisão:** Drizzle + expo-sqlite.

O sync embutido do WatermelonDB é tentador, mas amarra o modelo de dados ao protocolo dele e cobra a complexidade **agora** por um benefício que só chega na Fase 2. Drizzle dá tipagem e migrations versionadas — que é o que protege contra retrabalho hoje — e deixa a escolha de sync em aberto.

**Consequências:** migrations versionadas desde o commit 1 (crítico: haverá dados reais no seu aparelho antes da Fase 2); a estratégia de sync fica a decidir depois, sem custo de saída.

---

### ADR-03 — MVP sem backend, com o schema pronto para sync

**Contexto:** O PRD pede casa compartilhada; a decisão de execução é não ter backend no MVP.

**Decisão:** Rodar local-only, mas pagar antecipadamente o custo barato de UUID, `casa_id`, `usuario_id`, `atualizado_em`, `deletado_em`, `sync_status` e movimentos append-only.

**Consequências:**
- ✅ Fase 2 é aditiva: sobe backend, escreve o adapter de sync, liga a fila. Zero migração de identidade de registro.
- ✅ Sem custo de infra e sem tela de login no MVP.
- ❌ US-08 e US-09 ficam fora; a casa opera em um aparelho.
- ❌ **Risco real: os dados vivem só no dispositivo.** Perdeu o celular, perdeu o estoque. Mitigação obrigatória na Fase 1: exportação/importação de backup em JSON.

---

### ADR-04 — Números inteiros para quantidade e dinheiro

**Decisão:** Quantidade em milésimos, dinheiro em centavos, ambos `INTEGER`. Conversão só na borda de exibição, em `domain/shared/`.

**Consequências:** somatórios exatos; um helper de formatação obrigatório (nenhuma tela faz `valor / 100` na mão); arredondamento de `quantidade_a_comprar` para cima em unidades indivisíveis fica centralizado numa função testada.

---

### ADR-05 — Estado e reatividade

**Decisão:** Sem Redux, sem TanStack Query. O banco local é a fonte de verdade; `useLiveQuery` do Drizzle re-renderiza a UI a cada escrita. Estado efêmero de tela (filtros, busca, aberto/fechado) fica em `useState`; se houver estado global de UI, Zustand.

**Racional:** TanStack Query resolve cache de rede — não há rede. Introduzir uma segunda fonte de verdade num app offline-only é criar bug de invalidação sem ganho.

**Consequência:** na Fase 2, o cache remoto ainda não é necessário — o repositório sincronizado continua escrevendo no SQLite e a UI continua lendo dele. O padrão se mantém.

---

### ADR-06 — Development build, não Expo Go

**Decisão:** Usar EAS development build desde o início.

**Racional:** `expo-sqlite` funciona no Expo Go, mas notificações (v1.1), widget de tela inicial (v1.1) e scanner (v2.0) não. Descobrir isso no meio da v1.1 custa uma reconfiguração de projeto. Configurar dev build no dia 1 custa uma tarde.

---

## 7. Estratégia de testes

| Camada | Ferramenta | O que cobrir | Meta |
|---|---|---|---|
| `domain/` | Jest/Vitest, sem emulador | Regras de estoque, arredondamento, dinheiro, delta, reposição | **≥ 90% de cobertura** — é onde os bugs custam caro |
| `infrastructure/` | Jest + SQLite em memória | Repositórios, transações, migrations aplicando em sequência | Caminhos principais |
| `application/` | React Native Testing Library | Hooks de caso de uso com repositório fake | Casos de uso principais |
| `presentation/` | RNTL | Componentes com lógica de exibição | Pontual |
| E2E | Maestro (opcional) | Fluxo: dar baixa → gerar lista → finalizar compra | 1 fluxo feliz |

O domínio ser TypeScript puro é o que torna essa meta de 90% barata — roda em segundos, sem Metro, sem emulador. Especialmente útil com código gerado por IA: o teste é o contrato que pega a regra sutil que a geração errou.

**Casos que precisam de teste explícito (são os que quebram silenciosamente):**
- Baixa que levaria a quantidade abaixo de zero → fixa em 0.
- `quantidade_a_comprar` de 0,5 pacote → arredonda para 1.
- Item sem preço na lista → custo 0, marcado, e não corrompe o total.
- Finalizar compra com falha no meio → rollback total.
- Desfazer baixa → movimento inverso, nunca DELETE.

---

## 8. Caminho de evolução para a Fase 2 (sync)

**O que NÃO muda:** `domain/`, `application/`, `presentation/`, e o SQLite continua sendo a fonte de leitura da UI.

**O que muda:**

```
1. Sobe o backend                    → Supabase (Postgres + Auth + Realtime)
2. Nova tabela local                 → outbox (fila de operações pendentes)
3. Novo adapter                      → SyncedProdutoRepository implements ProdutoRepository
                                       (escreve local + enfileira no outbox)
4. Novo serviço                      → SyncEngine (push do outbox, pull por atualizado_em)
5. Nova tela                         → login e convite para a casa (código de 6 dígitos)
6. Troca de 1 linha                  → no ponto de composição dos repositórios
```

**Resolução de conflito, já definida:**
- Quantidade → aplicar **deltas** dos movimentos, nunca sobrescrever valor absoluto. Dois moradores dando `−1` sobre 5 resulta em 3.
- Cadastro (nome, preço, mínimo) → last-write-wins por `atualizado_em` do servidor.
- Exclusão → `deletado_em` propaga como qualquer outro campo.

**Alternativa a avaliar na Fase 2:** PowerSync ou ElectricSQL sobre Postgres entregam sync bidirecional pronto para SQLite local, eliminando a escrita manual do `SyncEngine`. O schema acima é compatível com os dois — mais uma razão para os UUIDs e timestamps existirem desde já.

---

## 9. Riscos arquiteturais

| Risco | Impacto | Mitigação |
|---|---|---|
| **Perda de dados** — sem backend, o estoque existe só no aparelho | Alto | Backup/restore em JSON como item obrigatório da Fase 1, antes de qualquer feature nova |
| **Migration mal feita corrompendo dados reais** | Alto | drizzle-kit versionado; toda migration testada aplicando desde o schema vazio; backup automático antes de aplicar |
| **Abstração vazando** — IA gerando SQL direto dentro de componente | Médio | Lint de fronteira + revisão do `grep` da seção 2.1 antes de cada merge |
| **Domínio anêmico** — regras acabando espalhadas nos hooks | Médio | Toda regra que envolve cálculo mora em `*.rules.ts` com teste; hook só orquestra |
| **Retrofit de sync mais caro que o previsto** | Médio | Schema sync-ready (ADR-03); pode-se prototipar o `SyncEngine` cedo, contra um Supabase de teste, mesmo sem lançar |
| **Over-engineering para um app de casa** | Médio | Limite explícito: abstrair só persistência. Nada de DI container, nada de mapper entre camadas, nada de use case como classe |

---

## 10. Validação da arquitetura

```
- [x] Compatível com o tamanho e a complexidade do projeto
- [x] Alinhada à capacidade do time (1 dev + IA)
- [x] Suporta os requisitos atuais do MVP
- [~] Suporta o crescimento previsto — sync é aditivo, mas ainda não provado em código
- [x] Dependências fluem para dentro (domain sem dependência externa)
- [x] Fronteiras claras entre camadas
- [x] Estratégia de testes viável (domínio puro roda sem emulador)
- [x] Trade-offs documentados em ADRs
```

O único item parcial é o crescimento: só vira ✅ quando um protótipo de sync rodar contra um backend de teste. Vale fazer isso antes de a base de dados no seu aparelho ficar grande.

---

## 11. Sequência sugerida de implementação

| Etapa | Entrega | Por que nessa ordem |
|---|---|---|
| 0 | Expo + dev build + Drizzle + primeira migration + seed | Base configurada antes de qualquer regra |
| 1 | `domain/` completo com testes | Regras corretas antes de qualquer tela — barato de gerar e validar com IA |
| 2 | Ports + repositórios SQLite + testes | Fronteira estabelecida |
| 3 | CRUD de produto + tela de estoque | Primeira coisa utilizável |
| 4 | **Dar baixa** (caminho crítico) | É o KPI que decide o produto — merece iteração de UX própria |
| 5 | Lista de compras derivada | Só faz sentido com estoque real dentro |
| 6 | Modo compra + finalização | Fecha o ciclo |
| 7 | Backup/restore JSON | Antes de você depender dos dados de verdade |
| 8 | Resumo de valores e histórico | Camada de leitura sobre dados já existentes |
