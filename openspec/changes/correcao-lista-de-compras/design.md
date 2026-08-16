## Context

`app/(tabs)/lista.tsx` foi implementado antes da Despensa adotar `FlashList` e nunca recebeu scroll — confirmado como bug real no QA visual da change anterior (`correcao-usabilidade-campos-e-botoes`). Separadamente, o usuário relatou que um produto genuinamente faltante (`quantidade_atual < quantidade_necessaria`) às vezes não aparece na lista, mesmo trocando de aba ou reiniciando o app — comportamento que a leitura estática do código (mesmo mecanismo de reatividade nativo do SQLite que a Despensa usa, mesma query derivada, sem lógica especial por contagem de itens) não explica; precisa de reprodução ao vivo antes de qualquer correção.

No Modo Compra, o ajuste de quantidade/preço de um item (`SheetAjusteCompra`, já existente) só é alcançável por toque longo (`onLongPress` em `item-compra.tsx`) — funciona, mas sem nenhuma pista visual, mesma classe de bug de Affordance já corrigida em outros pontos do app pela change anterior. A pergunta inline "Atualizar o preço de X para R$ Y?" (mesmo arquivo) tem o mesmo problema.

O usuário também pediu uma funcionalidade nova: editar o preço de referência (`produto.valorUnitario`) de um produto normal direto na Lista de compras, sem precisar entrar no Modo Compra — hoje só itens avulsos são tocáveis ali (`lista.tsx:173-174`, `disabled={linha.item.tipo !== 'avulso'}`).

## Goals / Non-Goals

**Goals:**
- Lista de compras navegável com lista longa (`FlashList`, mesmo componente da Despensa).
- Diagnosticar e corrigir o bug de item faltante não aparecendo, com reprodução guiada antes da correção.
- Affordance visível pro ajuste de quantidade/preço e pra pergunta de atualização de preço no Modo Compra.
- Caminho de edição do preço de referência de um produto normal direto na Lista de compras.

**Non-Goals:**
- Não muda o design D4 (pergunta embutida na linha, nunca modal) nem o comportamento de fechamento de compra (`efeitosDaFinalizacao`) — usuário confirmou explicitamente manter a pergunta em vez de atualizar preço automaticamente sem confirmar.
- Não introduz um novo mecanismo de reatividade (`useLiveQuery` do Drizzle, por exemplo) — a investigação confirmou que o mecanismo atual (observer + `addDatabaseChangeListener`) não era a causa raiz do bug relatado (era dado duplicado, ver decisão 2), então não há motivo pra trocá-lo.
- Não cria um novo hook de aplicação pra editar preço — `useEditarProduto` (`src/application/estoque/use-editar-produto.ts`) já aceita edição parcial (`CamposEditaveis = Partial<Omit<ProdutoValidado, 'quantidadeAtual'>>`), reaproveitado como está.

## Decisions

### 1. Scroll da Lista de compras: `FlashList`, não `ScrollView`

`app/(tabs)/lista.tsx` troca o `View` + `.map()` por `FlashList` (`@shopify/flash-list`, já dependência do projeto, já usado em `app/(tabs)/index.tsx`), com o `data` sendo o array `linhas` (cabeçalhos de categoria + itens) já produzido por `agruparListaPorCategoria`/`listaContinua`, e `renderItem` decidindo entre cabeçalho e `ItemLista` pelo `linha.tipo`, igual ao que o `.map()` já faz hoje — só troca o container.

Alternativa considerada: `ScrollView` simples, já que a lista de compras costuma ser curta (dezenas de itens, CLAUDE.md recomenda `FlashList` só a partir de 150+). Rejeitada — a Despensa já estabeleceu `FlashList` como o padrão do app pra qualquer lista de itens roláveis; usar `ScrollView` aqui criaria uma segunda convenção sem necessidade, e `FlashList` já é uma dependência paga (sem custo de bundle adicional).

### 2. Bug de item faltante não aparecendo: era dado duplicado, não timing

**Revisão de decisão (pós-investigação ao vivo):** a hipótese original (corrida de timing do listener nativo, "mesma classe do bug do `SheetAjusteEstoque`") foi descartada. Reprodução guiada no emulador (`mobile-ux-tester`, com fallback via `adb` porque o Maestro MCP estava indisponível na sessão) mostrou que o bug é **100% determinístico por item, não intermitente**: um produto específico nunca aparecia (5/5 tentativas), independente de quantos outros itens estivessem faltando, de trocar de aba ou de reiniciar o app a frio — enquanto outros produtos que ficaram faltantes na mesma sessão apareciam corretamente e imediatamente.

Inspecionar o `.db` puxado do dispositivo (`adb exec-out run-as com.triasoftware.repor cat files/SQLite/estoque.db`, depois `sqlite3` local) revelou a causa: existiam **duas linhas em `compra_item`** para o mesmo `produto_id` dentro da mesma compra aberta — uma criada por `iniciarCompra` (materialização, sem exclusão) e outra criada por `remover()` da lista (`excluido = true`). `compuserLista` (`domain/lista/lista.rules.ts`) monta `idsExcluidos` a partir de **qualquer** linha de `compra_item` com `excluido = true` para aquele `produtoId` — não importa se existe também uma linha válida para o mesmo produto. A query SQL de `listarFaltantes` em si estava correta (confirmado rodando a mesma condição `WHERE` manualmente contra o `.db` real — o produto aparecia no resultado bruto); o filtro por exclusão, na composição da lista em memória, é que escondia o produto de novo.

A causa da duplicata: `use-remover-item-lista.ts`'s `remover()` sempre chamava `compras.adicionarItem(...)` (INSERT) para marcar a exclusão, sem checar se já existia uma linha de `compra_item` para aquele produto na compra aberta — diferente de `use-iniciar-compra.ts`'s `iniciar()`, que já fazia essa checagem (`jaMaterializados`) antes de inserir. Sequência que produz o bug: usuário inicia uma compra incluindo o produto (materializa uma linha sem exclusão) → sai sem fechar a compra → volta pra Lista mais tarde (o produto continua aparecendo ali, porque a Lista sempre re-deriva do estoque, sem saber que já foi materializado em uma compra aberta) → toca "remover" (×) nesse produto → uma segunda linha é inserida, agora com `excluido = true` → as duas linhas coexistem, e a segunda esconde o produto pra sempre enquanto aquela compra continuar aberta.

**Correção**: `remover()` agora busca (`compras.listarItens`) uma linha não-excluída existente para o mesmo `produtoId` antes de decidir — se achar, reaproveita com `editarItem(id, { excluido: true })`; só insere uma linha nova se realmente não havia nenhuma. `desfazer()` acompanha essa distinção via um novo campo `criouNovaLinha` em `RemocaoDaLista`: se a linha foi criada agora, desfazer apaga (`removerItem`, comportamento original); se reaproveitou uma linha já materializada, desfazer só reverte `excluido` para `false` (`editarItem`) — nunca apaga dado real que já estava lá (quantidade planejada, preço estimado etc.). Isso exigiu adicionar `excluido` a `EdicaoItemCompra` (`ports/compra.repository.ts`) e ao `.set()` do `editarItem` em `sqlite-compra.repository.ts`, que antes só aceitavam os outros campos editáveis.

O dado já corrompido no dispositivo de QA (a duplicata que já existe) não é migrado automaticamente — cancelar/fechar a compra aberta que contém as duas linhas libera o produto (a Lista volta a derivar normalmente assim que não há mais compra aberta com exclusão pendurada nele).

### 3. Affordance no Modo Compra: ícone indicador, mantendo o toque longo como gatilho

`ItemCompra` ganha um ícone (`IconeSvg`, reaproveitando `icones.ts` — provavelmente um novo ícone de "editar"/"ajustar", a definir no ícone SVG existente ou um novo path no mesmo estilo) posicionado perto do preço, sinalizando visualmente que o item é ajustável. O gatilho continua sendo o toque longo (`onLongPress`) — não se adiciona um botão extra separado, que competiria por espaço na linha compacta do Modo Compra (linha de 68px/48dp como o resto do app) e duplicaria a área de toque com o próprio `Pressable` da linha (que já trata toque curto pra marcar/desmarcar). Ícone comunica "isso é tocável de outro jeito", sem inventar um segundo alvo de toque.

A pergunta inline "Atualizar o preço de X para R$ Y?" (mesmo componente) já é suficientemente visível quando aparece (é texto + dois chips, não escondida) — sua "affordance" na prática é a mesma do item 3, já que ambas vivem no mesmo `ItemCompra` e o problema real é descobrir que o ajuste existe, não a pergunta em si depois que ela já apareceu.

### 4. Editar preço de produto normal na Lista de compras: sheet dedicado, reaproveitando `useEditarProduto`

`item-lista.tsx` ganha um toque habilitado também para itens `tipo: 'produto'` (hoje só `avulso`), abrindo um sheet pequeno com um único `CampoTexto` (`tipo="dinheiro"`, já entregue pela change anterior) pra editar `valorUnitario`. Grava via `useEditarProduto().editar(produtoId, { valorUnitario })` — hook e porta já existentes, edição parcial já suportada, nenhuma mudança de domínio ou de repositório necessária.

Alternativa considerada: reaproveitar `SheetAjusteCompra` (usado no Modo Compra) pra esse fluxo. Rejeitada — `SheetAjusteCompra` grava em `compra_item` (via `ajustarPreco`/`ajustarQuantidade` do `use-modo-compra`), que só existe depois que uma compra foi iniciada; usar esse componente aqui exigiria ou uma compra fantasma, ou desviar sua gravação — mais complexo que um sheet novo, pequeno e focado, que grava direto no produto (que é semanticamente o que a ação pede: mudar o preço de referência, não o preço pago de um item de compra).

Alternativa considerada: abrir o formulário completo de edição do produto (`app/produto/[id].tsx`) a partir da Lista. Rejeitada — a intenção do usuário é um ajuste rápido de preço sem sair do fluxo de fazer a lista, abrir a tela inteira de edição (com nome, unidade, categoria etc.) é fricção desnecessária pro caso de uso.

## Risks / Trade-offs

- **[Risco]** A causa raiz do bug de reatividade pode não se confirmar na primeira tentativa de reprodução (é intermitente, por definição difícil de reproduzir de forma determinística) → **Mitigação**: task de reprodução permite múltiplas tentativas e registra o que foi observado mesmo se inconclusivo na primeira rodada, seguindo o mesmo padrão já usado com sucesso pra achar o bug do `SheetAjusteEstoque` na change anterior (repetir a ação 4-5 vezes).
- **[Risco]** Adicionar toque em itens `tipo: 'produto'` na Lista pode confundir com o toque que hoje só existe pra avulso (que abre edição completa do avulso, não só preço) → **Mitigação**: o sheet novo de preço é deliberadamente mais simples (só o campo de preço) que `SheetAvulso` (nome, quantidade, unidade, preço) — a diferença de conteúdo já comunica que são ações diferentes; rótulo do sheet deixa claro que é "editar preço", não "editar item".
- **[Risco]** `FlashList` exige altura estimada de item (`estimatedItemSize`) pra performance — item errado pode causar salto visual no primeiro render → **Mitigação**: usar o mesmo valor/abordagem já validado em `app/(tabs)/index.tsx` como referência, já que `ItemLista` tem altura fixa (`ALVO_TOQUE_MINIMO`, como o resto do app).

## Migration Plan

Sem mudança de schema, sem dado a migrar, sem dependência nativa nova (`FlashList` e `CampoTexto`/`EvitaTeclado` já estão no app, instalados e linkados pela change anterior) — não deve exigir rebuild nativo, diferente da change anterior.

## Open Questions

- Causa raiz exata do bug de reatividade — só resolve depois da task de reprodução (decisão 2); tasks.md registra isso como investigação, não como correção pré-determinada.
- Ícone exato pro indicador de affordance do Modo Compra (decisão 3) — escolher um path SVG consistente com o estilo já usado em `icones.ts` (stroke 1.5, sem curvas) durante a implementação, não bloqueia o design.
