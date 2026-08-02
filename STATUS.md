# STATUS — Ordem de implementação do MVP

Este arquivo é o índice de execução do projeto. As 11 changes abaixo cobrem o MVP inteiro descrito no PRD, na Arquitetura, no Database e no Frontend Design. **A ordem importa** — cada change assume que as anteriores já estão no lugar.

Os artefatos de cada change vivem em `openspec/changes/<nome>/` (`proposal.md`, `design.md`, `specs/`, `tasks.md`).
Para implementar uma delas: `/opsx:apply <nome>`. Para arquivar após concluir: `/opsx:archive <nome>`.

| Estado | Significado |
|---|---|
| ⬜ | Não iniciada |
| 🟡 | Em andamento |
| ✅ | Concluída e arquivada |

---

## Ordem de execução

### Fase 0 — Fundação (nada é utilizável ainda)

| # | Change | Estado | Entrega | Por que nessa posição |
|---|---|---|---|---|
| 1 | `bootstrap-projeto-expo` | ✅ | Projeto Expo + Expo Router + development build EAS + camadas + lint de fronteira + `Result` + UUID v7 | Não existe `package.json`. Bloqueia tudo. Obs.: tasks 4.3/4.4 (primeiro build EAS no aparelho) pendentes de `eas login` manual — configuração pronta. |
| 2 | `fundacao-dominio` | ✅ | `src/domain/` completo com testes ≥ 90%: milésimos, centavos, estado do item, quantidade a comprar, movimento, compra | Regras corretas antes de qualquer tela. DATABASE §12: os helpers de unidade vêm **antes de qualquer query**. |
| 3 | `persistencia-sqlite` | ⬜ | Cliente com PRAGMAs, schema Drizzle, migration `0000_init`, ports, repositórios, transação de baixa e de compra, seed | Fronteira de dados estabelecida. A partir daqui existem dados reais no aparelho. |
| 4 | `design-system-tema` | ⬜ | Tokens Despensa/Porcelana, escala tipográfica, 3 fontes, `ThemeProvider`, componentes-base, migration `0001_configuracao` | O layout sem cards se sustenta pelos tokens. Construí-los depois das telas garante deriva. |

### Fase 1 — O ciclo do produto

| # | Change | Estado | Entrega | Por que nessa posição |
|---|---|---|---|---|
| 5 | `despensa-e-cadastro-produto` | ⬜ | Linha d'água, tela Despensa, filtros, busca, CRUD de produto, adoção da lista base | Primeira coisa utilizável. Resolve o risco Alto de cadastro inicial pesado. |
| 6 | `dar-baixa-caminho-critico` | ⬜ | Stepper funcional, coreografia de movimento, teclado de quantidade, toast de desfazer, **medição do KPI K4** | O KPI que decide o produto. ARQUITETURA §11 o isola porque "merece iteração de UX própria". |
| 7 | `lista-de-compras` | ⬜ | Lista derivada, itens avulsos, custo estimado, agrupar por categoria, exportar texto | Só faz sentido com estoque real dentro. |
| 8 | `modo-compra-e-fechamento` | ⬜ | Modo corredor de mercado, marcação, preço pago, fechamento atômico, atualização de preço de referência | Fecha o ciclo: consome → falta → lista → compra → repõe. |

### Fase 2 — Confiança nos dados

| # | Change | Estado | Entrega | Por que nessa posição |
|---|---|---|---|---|
| 9 | `backup-restore-json` | ⬜ | Backup JSON versionado, restauração transacional, reconciliação, tela de configurações | ARQUITETURA §9: **obrigatório antes de qualquer feature nova**. Sem backend, é a única proteção contra perda total — e o único caminho de recuperação de migration ruim. |
| 10 | `ajuste-e-conferencia-estoque` | ⬜ | Ajuste com motivo, modo conferência, diagnóstico de integridade, histórico do produto | Compensa a ausência de US-08. ARQUITETURA §1.1: sem sync, K2 depende da conferência semanal. |
| 11 | `resumo-valores-e-historico` | ⬜ | Valor do estoque, valor da lista, gasto mensal, histórico de compras | Camada de leitura sobre dados existentes. Não bloqueia nada. |

---

## Grafo de dependências

```
1 bootstrap-projeto-expo
├── 2 fundacao-dominio
│   └── 3 persistencia-sqlite
│       ├── 4 design-system-tema
│       │   └── 5 despensa-e-cadastro-produto
│       │       └── 6 dar-baixa-caminho-critico
│       │           └── 7 lista-de-compras
│       │               └── 8 modo-compra-e-fechamento
│       │                   ├── 9 backup-restore-json
│       │                   │   └── 10 ajuste-e-conferencia-estoque
│       │                   └── 11 resumo-valores-e-historico
```

As changes 10 e 11 são independentes entre si e podem ser feitas em qualquer ordem depois da 9.

---

## Cobertura das user stories do PRD

| US | Descrição | Change |
|---|---|---|
| US-01 | Cadastrar produto | 5 |
| US-02 | Dar baixa no consumo | 6 |
| US-03 | Ver o que está faltando | 5 |
| US-04 | Gerar lista de compras | 7 |
| US-05 | Comprar e repor o estoque | 8 |
| US-06 | Ajustar estoque manualmente | 10 |
| US-07 | Acompanhar valor do estoque e gasto | 11 |
| US-08 | Compartilhar a casa | **Fora do MVP** — ADR-03, sem backend |
| US-09 | Usar offline e sincronizar | **Parcial** — offline integral desde a change 3; sync é Fase 2 |
| US-10 | Notificação de reposição | **v1.1** — fora do MVP |

**KPIs**: K4 é medido na change 6 (tarefa explícita). K2 depende da change 10 (conferência). K5 depende da change 8 (atualização de preço). K6 fica suspenso até haver backend.

---

## Conflitos entre documentos resolvidos nas changes

Estes são pontos onde os quatro documentos-fonte se contradiziam. A resolução está registrada no `design.md` da change indicada, e cada uma tem tarefa de **corrigir o documento-fonte** — conforme a regra do `CLAUDE.md` de atualizar o documento em vez de divergir em silêncio.

| # | Conflito | Resolução | Onde | Documento a corrigir |
|---|---|---|---|---|
| 1 | ARQUITETURA §3 diz `id.ts` gera **UUID v4**; DATABASE §4.2 corrige para **v7** | v7 — v4 fragmenta o índice de `movimento_estoque`, que é append-only e cresce sem limite | Change 1, D1 | ARQUITETURA §3 |
| 2 | PRD US-01 permite "salvar mesmo assim" com nome duplicado; DATABASE §5 tem `UNIQUE INDEX` no nome | O índice vence — "salvar assim mesmo" passa a significar salvar com nome diferenciado | Change 5, D1 | PRD US-01 e FRONTEND §11 |
| 3 | ARQUITETURA §4 e DATABASE §4 divergem no schema (sem `casa_id`/`compra_id` no movimento, sem `observacao`, sem status `cancelada`) | DATABASE §4 é o DDL canônico | Change 3 | — |
| 4 | ARQUITETURA §3 nomeia `ItemEstoque`; FRONTEND §7.1 nomeia `ItemDespensa` | `ItemDespensa` — vocabulário de interface do §11 | Change 5 | — |
| 5 | DATABASE §7 (Drizzle) omite `DESC` no índice de histórico e `.references()` em `compraId`, divergindo do DDL §5 | Corrigir o schema Drizzle | Change 3, D8 | DATABASE §7 |
| 6 | ARQUITETURA §4.2 diz que o seed é "inserido na primeira execução"; FRONTEND §11 especifica o estado vazio com botão de adoção | O frontend vence — inserir 40 itens automaticamente entrega uma despensa que não é a do usuário | Change 3, D6 | ARQUITETURA §4.2 |
| 7 | FRONTEND §4.1 supõe pesos tipográficos que os pacotes de fonte podem não exportar | Verificar o que cada pacote exporta antes de fixar constantes | Change 4, D8 | FRONTEND §4.2, se divergir |

---

## Questões em aberto que precisam de decisão do usuário

Nenhuma bloqueia o início da implementação. Todas têm um padrão assumido, registrado no `design.md` da change correspondente.

| Questão | Padrão assumido | Change | Origem |
|---|---|---|---|
| Nome do app ("Repor" é placeholder) e identificador de pacote | "Repor" no development build; decidir antes do build de produção | 1 | PRD, apêndice 5 |
| Exibir os dois valores (estoque e lista) ou apenas um | Os dois, com rótulos distintos | 11 | PRD, apêndice 2 |
| Reposição no fechamento: `atual += comprado` ou "voltar ao nível necessário" | `atual += comprado` | 2 e 8 | PRD, apêndice 3 |
| Perfis admin/membro no MVP de um usuário só | Usuário local criado como admin; distinção só significa algo na Fase 2 | 3 | PRD, apêndice 4 |
| Quando oferecer cancelar uma compra | Item de menu no modo compra, com confirmação | 8 | Não definido em nenhum documento |
| Ordem das categorias no modo corredor | Alfabética; ordem configurável exige a tabela de categoria e é v1.1 | 7 | DATABASE §3.2 |
| Reordenação imediata do item que muda de estado sob o dedo | Reordenar imediatamente; avaliar em uso real | 6 | Não definido |

---

## Fora do escopo do MVP (não implementar sem confirmar)

Scanner de código de barras · leitura de nota fiscal · baixa automática por consumo médio · integração com supermercados · controle de validade e lote · receitas e cardápio · multi-casa · versão web ou desktop · divisão de despesas · qualquer feature de IA · casa compartilhada (US-08) · sync offline (US-09) · notificações (US-10) · widget de tela inicial · gráfico de gasto mensal.

Casa compartilhada e sync estão fora **por decisão** (ADR-03), não por esquecimento. O schema já está desenhado para que a Fase 2 seja aditiva: UUID v7, `casa_id`, `usuario_id`, `atualizado_em`, `deletado_em`, `sync_status` e movimentos append-only já existem desde a migration inicial.
