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
| 3 | `persistencia-sqlite` | ✅ | Cliente com PRAGMAs, schema Drizzle, migration `0000_init`, ports, repositórios, transação de baixa e de compra, seed | Fronteira de dados estabelecida. A partir daqui existem dados reais no aparelho. |
| 4 | `design-system-tema` | ✅ | Tokens Despensa/Porcelana, escala tipográfica, 3 fontes, `ThemeProvider`, componentes-base, migration `0001_configuracao` | O layout sem cards se sustenta pelos tokens. Construí-los depois das telas garante deriva. |

### Fase 1 — O ciclo do produto

| # | Change | Estado | Entrega | Por que nessa posição |
|---|---|---|---|---|
| 5 | `despensa-e-cadastro-produto` | ✅ | Linha d'água, tela Despensa, filtros, busca, CRUD de produto, adoção da lista base | Primeira coisa utilizável. Resolve o risco Alto de cadastro inicial pesado. |
| 6 | `dar-baixa-caminho-critico` | ✅ | Stepper funcional, coreografia de movimento, teclado de quantidade, toast de desfazer | O KPI que decide o produto. ARQUITETURA §11 o isola porque "merece iteração de UX própria". Obs.: tasks 3.7, 6.5, 7.2, 8.1, 8.3–8.5, 9.1, 9.2 (medição real do KPI K4, háptico, rolagem, offline em hardware) pendentes de aparelho — ver tabela abaixo. |
| 7 | `lista-de-compras` | ✅ | Lista derivada, itens avulsos, custo estimado, agrupar por categoria, exportar texto | Só faz sentido com estoque real dentro. Obs.: tarefas 7.4 e 7.5 (escala de fonte 200%, alinhamento visual da coluna de preço) pendentes de aparelho — ver tabela abaixo. |
| 8 | `modo-compra-e-fechamento` | ✅ | Modo corredor de mercado, marcação, preço pago, fechamento atômico, atualização de preço de referência | Fecha o ciclo: consome → falta → lista → compra → repõe. |

### Fase 2 — Confiança nos dados

| # | Change | Estado | Entrega | Por que nessa posição |
|---|---|---|---|---|
| 9 | `backup-restore-json` | ✅ | Backup JSON versionado, restauração transacional, reconciliação, tela de configurações | ARQUITETURA §9: **obrigatório antes de qualquer feature nova**. Sem backend, é a única proteção contra perda total — e o único caminho de recuperação de migration ruim. |
| 10 | `ajuste-e-conferencia-estoque` | ✅ | Ajuste com motivo, modo conferência, diagnóstico de integridade, histórico do produto | Compensa a ausência de US-08. ARQUITETURA §1.1: sem sync, K2 depende da conferência semanal. |
| 11 | `resumo-valores-e-historico` | ✅ | Valor do estoque, valor da lista, gasto mensal, histórico de compras | Camada de leitura sobre dados existentes. Não bloqueia nada. |

### Pós-MVP — correções e ajustes

| # | Change | Estado | Entrega | Por que nessa posição |
|---|---|---|---|---|
| 12 | `correcao-navegacao-nativa` | ✅ | Header nativo oculto em toda rota, `BotaoVoltar` compartilhado no Detalhe do produto/Cadastrar produto/Modo compra, tab bar sem ícone (`MissingIcon`) | Bug encontrado após a change 11: nenhuma tela foi desenhada para o header nativo do Expo Router, que vazava nome de arquivo/rota na UI. |
| 13 | `ajuste-visual-telas-design-system` | ✅ | Ícone SVG na tab bar (reverte a decisão "sem ícone" da change 12), cabeçalho da Despensa com ícones de buscar/adicionar, chip "Faltando" somando crítico+em falta, rodapé do Modo compra reposicionado, "Gasto este mês" + gráfico de barras no Resumo | Bug visual encontrado após a change 12: comparação direta com o projeto de design (`claude.ai/design`, importado via `claude_design` MCP) mostrou divergências concretas em 4 telas. |

---

## Onde a implementação parou

**Última atualização: 2026-08-06.** Retomada em outra máquina começa por aqui.

### Estado do repositório

Todas as 11 changes do MVP mais as 2 changes pós-MVP (`correcao-navegacao-nativa` e `ajuste-visual-telas-design-system`) estão **implementadas, arquivadas e com PR aberta**. Não há change pendente — o próximo passo é abrir a PR final de `develop` para `main`, depois que a cadeia de PRs abaixo for mesclada na ordem indicada.

As branches formam uma cadeia — cada PR aponta para a branch da change anterior, e o merge precisa seguir essa ordem:

| PR | Branch | Base | Change |
|---|---|---|---|
| [#1](https://github.com/danielfalcaodf/home-pantry-app/pull/1) | `change/bootstrap-projeto-expo` | `develop` | 1 · bootstrap-projeto-expo |
| [#2](https://github.com/danielfalcaodf/home-pantry-app/pull/2) | `change/fundacao-dominio` | `change/bootstrap-projeto-expo` | 2 · fundacao-dominio |
| [#3](https://github.com/danielfalcaodf/home-pantry-app/pull/3) | `change/persistencia-sqlite` | `change/fundacao-dominio` | 3 · persistencia-sqlite |
| [#4](https://github.com/danielfalcaodf/home-pantry-app/pull/4) | `change/design-system-tema` | `change/persistencia-sqlite` | 4 · design-system-tema |
| [#5](https://github.com/danielfalcaodf/home-pantry-app/pull/5) | `change/despensa-e-cadastro-produto` | `change/design-system-tema` | 5 · despensa-e-cadastro-produto |
| [#6](https://github.com/danielfalcaodf/home-pantry-app/pull/6) | `change/dar-baixa-caminho-critico` | `change/despensa-e-cadastro-produto` | 6 · dar-baixa-caminho-critico |
| [#7](https://github.com/danielfalcaodf/home-pantry-app/pull/7) | `feature/lista-de-compras` | `change/dar-baixa-caminho-critico` | 7 · lista-de-compras |
| [#8](https://github.com/danielfalcaodf/home-pantry-app/pull/8) | `feature/modo-compra-e-fechamento` | `feature/lista-de-compras` | 8 · modo-compra-e-fechamento |
| [#9](https://github.com/danielfalcaodf/home-pantry-app/pull/9) | `feature/backup-restore-json` | `feature/modo-compra-e-fechamento` | 9 · backup-restore-json |
| [#10](https://github.com/danielfalcaodf/home-pantry-app/pull/10) | `feature/ajuste-e-conferencia-estoque` | `feature/backup-restore-json` | 10 · ajuste-e-conferencia-estoque |
| [#11](https://github.com/danielfalcaodf/home-pantry-app/pull/11) | `feature/resumo-valores-e-historico` | `feature/ajuste-e-conferencia-estoque` | 11 · resumo-valores-e-historico |
| [#12](https://github.com/danielfalcaodf/home-pantry-app/pull/12) | `feat/correcao-navegacao-nativa` | `feature/resumo-valores-e-historico` | 12 · correcao-navegacao-nativa |

**A PR de `develop` para `main` ainda não foi aberta** — abrir depois que a cadeia de PRs (1 a 13) for mesclada na ordem acima; ela fecha o ciclo do MVP + correções pós-MVP.

### Change 13 — concluída, escopo ampliado durante a validação manual

Todas as tasks do `tasks.md` concluídas (seções 1-8). `npm run verificar` limpo; `npm test` com as mesmas 2 falhas pré-existentes de sempre (`historico-de-compras.test.ts`, `use-gasto-mensal.test.ts` — dependem de fuso/relógio local, confirmadas via `git stash` antes de qualquer mudança desta change).

- Ícones da tab bar, do cabeçalho da Despensa e do botão de voltar vieram dos paths SVG reais do design system (`claude.ai/design`, projeto `aca58fcf-dc7d-4d76-a375-b1aa5a3dc816`), lidos via `claude_design` MCP/`DesignSync` — os primeiros paths que eu tinha estimado sem essa fonte não batiam; corrigidos depois de importar o projeto e ler `PantryScreen.jsx`/`TabBar.jsx`/`ProductDetailScreen.jsx`/`SummaryScreen.jsx` do `_ds_bundle.js`
- `IconeSvg` aceita `path: string | readonly string[]` — o design usa um único `d` com múltiplos comandos `M` por ícone, não um array
- Chip "Faltando" da Despensa passou a somar `critico + emFalta`; nova `casaComFiltro` em `agrupar-despensa.ts` reaproveita o `EstadoItem` já calculado no domínio, sem duplicar `estadoDoItem()`. `FiltroEstado` manteve os valores antigos (`emFalta`, `ok`) válidos para não quebrar as rotas que o Resumo já usa (`/?filtro=emFalta`), mesmo sem chip próprio para eles
- `GraficoBarras` (novo componente) replica `SummaryScreen.jsx`: todas as barras em `action.azulejo`, só a mais recente em opacidade plena, as demais em 0.4 — sem lib de gráfico
- **Fora do proposal original, pedido em conversa direta com o usuário** depois de comparar o app rodando com o protótipo interativo do design (`Repor Prototype.dc.html`):
  - Botão "Repor" (+) sempre visível ao lado do "−" em cada linha da Despensa (novo `BotaoReporRapido`, par do `StepperConsumo`) — confirmado com o usuário antes, por mexer numa decisão já documentada em `dar-baixa-caminho-critico` (um único botão no caminho crítico)
  - Botão de alternar tema claro/escuro do protótipo **não** foi replicado — é controle de prévia do próprio Claude Design (absolute sobre o frame do telefone, sem componente correspondente no `readme.md` do design system), confirmado com o usuário
  - Tela Configurações virou a 4ª aba (`app/configuracoes.tsx` → `app/(tabs)/configuracoes.tsx`, ícone próprio sem equivalente no design system) e ganhou `ScrollView` (a `View` fixa escondia a nova seção "Despensa" em telas menores — achado na validação manual)
  - `BotaoVoltar` adicionado em todas as telas empilhadas que ainda não tinham: Configurações, Conferência, Diagnóstico, Lista básica, Histórico de compras (lista e detalhe), Histórico do produto
- **Dois bugs pré-existentes encontrados e corrigidos na validação manual, fora do escopo original mas bloqueantes:**
  - `esmaecer`/`molar` (`theme/movimento.ts`) sem a diretiva `'worklet'` — qualquer toque no `StepperConsumo` (o caminho crítico do app inteiro, não só o que esta change tocou) ou no novo `BotaoReporRapido` derrubava a tela com `[Worklets] Tried to synchronously call a Remote Function`. A ação em si já tinha sido registrada antes do crash; só a animação quebrava
  - `BotaoVoltar` do Detalhe do produto (`app/produto/[id].tsx`) ficava esticado e centralizado na tela em vez de à esquerda — era o único lugar do app onde o botão era filho único de uma `View` sem `flexDirection: 'row'`, herdando `alignItems: 'stretch'` do container em coluna

### Change 11 — concluída, com pendências documentadas

49 de 51 tarefas concluídas e testadas. As 2 restantes (6.7 — escala de fonte a 200%, 6.8 — confirmação do usuário sobre exibir os dois valores ou um só) não exigem código novo: 6.7 é a mesma limitação de aparelho das changes 5-10; 6.8 já está implementada com o padrão assumido pelo próprio corpo do PRD e pelo design de frontend (os dois valores, nunca somados), só falta a confirmação real do usuário — a change foi arquivada mesmo assim, seguindo a mesma decisão das anteriores.

- `converterValorBruto` (novo em `domain/shared/dinheiro.ts`) é a única divisão de um bruto milésimos·centavos já somado — `multiplicarQuantidadePorPreco` passou a delegar a ela, então a mesma função cobre tanto um item quanto o bruto agregado em SQL (DATABASE §6.5)
- `ProdutoRepository.valorBrutoDoEstoque` entrega o bruto (nunca dividido por mil); `use-resumo-valores.ts` converte uma vez e nunca soma esse valor ao da lista (design D2) — a lista reaproveita `totalDaLista`/`listarFaltantes`, já existentes desde a change `lista-de-compras`
- Novo papel tipográfico `data.xl` (mono, tabular, 32pt): único lugar do app com números grandes (FRONTEND §8.4), abaixo do teto de 34pt da escala
- `CompraRepository.gastoPorMes` agrega em SQL com `strftime(..., 'localtime')` (design D4) e só considera `status = 'finalizada'` (design D5); `completarMesesSemCompra` (domínio) preenche os doze meses sem compra com zero, sem depender do relógio na função pura
- `CompraRepository.listarHistorico` traz finalizadas e canceladas numa junção agregada única com `compra_item` (contagem de itens comprados sem N+1, DATABASE §6.7), paginando por `COALESCE(finalizada_em, atualizado_em)` — nunca por deslocamento numérico (design D6)
- `app/compra/historico/[id].tsx`: detalhe somente leitura, reaproveitando `listarItens` (já uma junção externa) mais o novo `obterPorId` — duas consultas ao todo, testado explicitamente. Produto removido logicamente após a compra continua aparecendo (a remoção é lógica, a linha permanece — design D7)
- Despensa (`app/(tabs)/index.tsx`) ganhou um parâmetro de rota (`filtro`) para a tela Resumo linkar cada contagem por estado direto ao filtro correspondente

### Change 10 — concluída, com pendências de aparelho documentadas

49 de 51 tarefas concluídas e testadas. As 2 restantes (3.13 — medir 30 itens conferidos em uso real, 6.5 — escala de fonte a 200%) exigem aparelho físico real, pela mesma razão das changes 5-9: sem emulador Android/iOS neste ambiente. A change foi arquivada mesmo assim, seguindo a mesma decisão das anteriores, para não travar o restante do MVP.

- `calcularAjuste` (movimento.rules.ts) reaproveita `construirMovimento`: o usuário informa o **valor final** contado, não a diferença (design D2) — a variação e a rejeição de "sem mudança" ficam com o domínio
- `ProdutoRepository.ajustar` grava a quantidade e o movimento de ajuste (motivo opcional: perda/vencimento/correção) na mesma transação, igual ao padrão de `darBaixa`/`repor`
- `SheetAjusteEstoque`: o toque na quantidade atual do detalhe abre este caminho — nunca um campo de formulário comum (design D3, herdada da change 5 e concretizada aqui)
- `MotivoAjuste` mora em `domain/movimento/movimento.ts`, ao lado de `TipoMovimento` — precisou saída de `ports/` para `presentation/` não depender de `ports/` diretamente (fronteira de camadas)
- `use-conferencia.ts`: percurso por categoria (ou tudo) ordenado por nome, incluindo itens zerados; confirmar avança sem gravar nada, corrigir grava o mesmo ajuste. Posição do percurso persiste em `configuracao` (`conferenciaCategoria`/`conferenciaIndice`) para retomar — o progresso é o próprio estado do banco (design D5), nunca uma transação pendente
- `app/diagnostico.tsx` ganhou tela própria (antes embutida em configurações) com correção em bloco: `MovimentoRepository.corrigirTodasDivergencias` corrige cada produto divergente com seu próprio movimento de ajuste, em uma única transação — testado com falha injetada (rollback total)
- `MovimentoRepository.historicoPorProduto` ganhou paginação por data (`antesDe`), substituindo o parâmetro posicional `limite` — único caminho de chamada era interno ao repositório, sem breaking change de fato
- `app/produto/[id]/historico.tsx`: histórico somente leitura, paginado em blocos de 30, cada linha com o mesmo verbo do momento da ação (Usei/Repus/Comprei/Corrigi para) em cor distinta por tipo, quantidade e data no papel tipográfico de dado
- Vocabulário: a cópia do rodapé do detalhe ("Você anotou N usos...") evita a palavra "baixa" mesmo aparecendo como exemplo literal no FRONTEND-DESIGN §7.3 — resolvido a favor da regra de vocabulário mais explícita (§11), que proíbe termos de sistema no histórico

### Change 9 — concluída, com pendência de aparelho documentada

44 de 45 tarefas concluídas e testadas (a 4.2 e a 4.5 completaram junto da seção 6, quando a UI que as expõe ficou pronta). A restante (7.4 — ciclo completo exportar/desinstalar/reinstalar/restaurar em aparelho real) exige hardware físico, mesma razão das changes 5-8: sem emulador Android/iOS neste ambiente. A transação de restauração em si está coberta por teste de infraestrutura com SQLite real (rollback, idempotência, combinação).

- `domain/backup/backup.schema.ts`: forma do arquivo, validação estrutural e de versão, conversão entre versões — TypeScript puro. Versão do backup acompanha o número de migrations aplicadas (hoje 4)
- `SQLiteBackupRepository` (novo port `BackupRepository`) monta o arquivo pelos repositórios existentes — que ganharam `listarTudoParaBackup` sem os filtros de ativo/removido/limite das consultas normais — e restaura tudo numa única transação, com upsert por identificador
- **Design D8** (nova, registrada no `design.md` arquivado): a restauração nunca insere uma segunda `casa` — reescreve o `casaId` de todo o conteúdo para a casa local, e só atualiza o nome dela. Duas compras `aberta` simultâneas (local + backup) derrubam a transação inteira, comportamento aceito e testado
- **Design D9** (nova): o movimento de correção da reconciliação (`motivo: 'reconciliacao'`) fica fora da própria soma que ele corrige — senão nenhuma correção jamais convergiria, já que o novo delta mudaria o alvo que acabou de usar. Exigiu um ajuste pontual na consulta de `reconciliar()` da change 3
- Novo port `SistemaDeArquivos` (adapter Expo com `File`/`Directory`/`Paths` + `expo-sharing` + `expo-document-picker`, ambos adicionados como dependência) — grava, compartilha, seleciona e lê arquivo, injetável como os repositórios
- `app/configuracoes.tsx`: primeira tela de escolha de tema do projeto (a change 4 só tinha construído a persistência); `ThemeProvider` ganhou o parâmetro opcional `escolher`/`useEscolherTema` para uma única instância do hook de preferência continuar vivendo no layout raiz
- Exportação tabular (CSV) reaproveita `SistemaDeArquivos`, mas é gerada por uma função de domínio própria (`gerarCsvDeProdutos`) — rotulada na tela como "exportar meus dados", distinta e explicitamente não restaurável (design D7)

### Change 8 — concluída, com pendências de aparelho documentadas

53 de 55 tarefas concluídas e testadas. As 2 restantes (8.4, 8.6) exigem aparelho físico real — verificar em uso real no corredor do mercado se a pergunta de preço embutida na linha não interrompe o fluxo, e a tela com escala de fonte do sistema a 200% — pela mesma razão das changes 6 e 7: sem emulador Android/iOS neste ambiente. A change foi arquivada mesmo assim, seguindo a mesma decisão das anteriores, para não travar o restante do MVP.

- `use-iniciar-compra` materializa a lista corrente (tela, não uma nova consulta) em `compra_item`, sem reaplicar arredondamento e sem duplicar avulsos; a lista continua derivada depois disso
- `compra_item` ganhou a coluna `atualizar_preco` (migration `0003`, forward-only) para guardar a resposta da pergunta de preço sem tocar o produto antes do fechamento
- `use-modo-compra` grava cada marcação/ajuste direto no item, sem estado em memória — retomada é automática porque a tela sempre lê do repositório
- `use-finalizar-compra` delega ao repositório, que já aplicava a transação única (reposições + movimentos vinculados à compra + atualizações de preço confirmadas + total pago); teste de rollback com falha injetada no meio do lote confirma que nada muda
- `CompraRepository.cancelar` fecha a compra sem repor nada, liberando `ux_compra_aberta`
- `ItemCompra`/`RodapeCompra` corrigidos para não importar `application/` nem `domain/produto/produto` — a fronteira de camadas exige tipos locais e valores prontos, mesmo quando o dado de origem vem de um hook

### Change 7 — concluída, com pendências de aparelho documentadas

47 de 49 tarefas concluídas e testadas. As 2 restantes (7.4, 7.5) exigem aparelho físico real — escala de fonte do sistema a 200% e o alinhamento visual da coluna de preço — pela mesma razão da change 6: sem emulador Android/iOS neste ambiente, uma medição visual não seria dado real. A change foi arquivada mesmo assim, seguindo a mesma decisão tomada na change 6, para não travar o restante do MVP.

- `use-lista-compras` compõe faltantes (consulta existente) com avulsos da compra aberta, sem tabela de lista — a exclusão de um faltante vira uma marcação (`compra_item.excluido`, migration `0002`) na compra aberta, criada sob demanda e reusada entre chamadas
- Itens avulsos (`use-adicionar-avulso`, `use-editar-avulso`) nunca tocam produto nem movimento de estoque — testado explicitamente
- Tela `Lista` com `ItemLista`, `RodapeTotal` (total estimado + contagem sem preço) e `SheetAvulso`; agrupamento por categoria persistido em `configuracao`
- Exportação como texto simples pela folha de compartilhamento nativa (`Share.share`), refletindo o agrupamento ativo
- `FaltanteBruto` foi movido de `ports/` para `domain/produto/produto.ts` durante a change — o tipo é consumido por uma função pura de domínio (`lista.rules.ts`) e não pode depender de `ports/` (regra de dependência)

### Change 6 — concluída, com pendências de aparelho documentadas

42 de 51 tarefas concluídas e testadas. As 9 restantes (3.7, 6.5, 7.2, 8.1, 8.3–8.5, 9.1, 9.2) exigem aparelho físico real — medição de tempo do KPI K4, sensação de retorno tátil, engasgo de rolagem sob uso real — e não foram arquivadas como concluídas por fabricação de dado: não há emulador Android/iOS neste ambiente, e `expo-sqlite`/`expo-haptics` não têm suporte web viável para produzir uma medição válida (SQLite web é alpha/instável, haptics não existe em web). A tarefa 8.2 (contagem de toques) foi verificada por leitura de código: 1 toque do app aberto até o toast "Anotado". A change foi arquivada mesmo assim, por decisão do usuário, para não travar o restante do MVP — a medição real do K4 fica marcada como dívida pendente de aparelho, junto com as demais tarefas da tabela abaixo.

- Casos de uso de consumo, reposição pontual e desfazer, com escrita **serializada por item** (toques rápidos viram um registro cada)
- `StepperConsumo` com háptico no toque, contração 0,92 e toque longo abrindo o teclado
- Nível animado por *shared value* na thread de interface, mola redirecionável, cross-fade dos números
- `TecladoQuantidade` (painel inferior), `ToastDesfazer` vinculado ao **id do movimento**, e as mesmas ações no detalhe do produto
- Casos de borda: item que acaba, consumo maior que o saldo, falha de gravação com "tentar de novo"

### A próxima change

Nenhuma. As 11 changes do MVP estão implementadas e arquivadas. O que resta é operacional, não de código: mesclar as 11 PRs na ordem da cadeia e abrir a PR de `develop` para `main`.

### O que está bloqueado por falta de aparelho

Um `eas login` e um development build instalado destravam tudo isto de uma vez — nenhuma dessas tarefas exige código novo:

| Change | Tarefas | O que falta |
|---|---|---|
| 1 | 4.3, 4.4 | Primeiro build EAS e abertura pelo Metro |
| 3 | 10.5 | Fumaça do PRAGMA de FK no binding do Expo |
| 4 | 3.4, 6.3, 8.3, 9.2 | Dígitos tabulares, abertura sem flash, redução de movimento, fonte a 200% |
| 5 | 4.11, 7.8, 8.3, 8.6 | Rolagem com 300 itens, adoção offline, fonte a 200%, altura de 68pt |
| 6 | 3.7, 6.5, 7.2, 8.1, 8.3–8.5, 9.1, 9.2 | Engasgo na rolagem, fluxo offline, redução de movimento, **medição real do K4**, retorno tátil em uso repetido |
| 7 | 7.4, 7.5 | Escala de fonte a 200%, alinhamento visual da coluna de preço |
| 8 | 8.4, 8.6 | Uso real no corredor do mercado, fonte a 200% |
| 9 | 7.4 | Ciclo completo exportar → desinstalar → reinstalar → restaurar em aparelho real |
| 10 | 3.13, 6.5 | Medir 30 itens conferidos em uso real, fonte a 200% |
| 11 | 6.7 | Fonte a 200% nas telas de resumo e histórico |

Comando para destravar: `npx eas-cli login && npx eas-cli build --profile development --platform android`.

### Verificação atual

`npm test` → **581 testes, todos verdes** (61 suítes) · `npm run verificar` (fronteiras + lint + typecheck) → **verde, zero avisos**.

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

**KPIs**: K4 é medido na change 6 (tarefa explícita) — **medição real pendente de aparelho**, ver "O que está bloqueado por falta de aparelho". K2 depende da change 10 (conferência). K5 depende da change 8 (atualização de preço). K6 fica suspenso até haver backend.

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
