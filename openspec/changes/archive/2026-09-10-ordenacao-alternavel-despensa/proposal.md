**Type:** Nova Feature

## Why

A despensa hoje só ordena por estado (crítico → em falta → ok), vindo direto do `ORDER BY CASE`
de `listarDespensa`. Quando o usuário usa o stepper `+`/`-` no caminho crítico de dar baixa e o
item muda de bucket de estado (ex.: acabou → em falta), a lista inteira é recarregada pelo
listener reativo do SQLite e o item salta de posição instantaneamente, no meio do próprio gesto
que o usuário está fazendo — o item "foge" do lugar onde o dedo/olhar está. Usuários reclamam
de perder a posição e se confundirem. É necessário oferecer uma ordenação alfabética estável
como default, manter a ordenação por estado como alternativa, e — só nesse segundo modo — parar
de reordenar a cada mudança de quantidade durante a sessão da tela.

## What Changes

- Seis modos de ordenação da despensa, agrupados em três pares critério × direção: **Nome
  (A-Z)** / **Nome (Z-A)** (novo default é Nome A-Z), **Acabou primeiro** / **Cheio primeiro**
  (por estado), **Menor quantidade** / **Maior quantidade**. Preço fica de fora — critério mais
  adequado à Lista de Compras (ainda não existe) do que à despensa.
- Menu de ícone na tela da despensa, entre a busca (lupa) e o botão de novo produto (+),
  substituindo o toggle binário original — implementado com `<Menu>`/`<Menu.Item>` de
  `react-native-paper` (biblioteca liberada no CLAUDE.md exclusivamente para este componente,
  estilizada 100% pelos tokens do tema via `theme`/`contentStyle`/`titleStyle`). Os três pares
  aparecem separados por `Divider`, sem cabeçalho de texto por grupo; cada opção tem um ícone
  MaterialCommunityIcons coerente com o critério (`sort-alphabetical-ascending/descending` para
  Nome, `gauge-empty`/`gauge-full` para Estado, `sort-numeric-ascending/descending` para
  Quantidade) e marca de seleção (`check`) na opção ativa.
- Preferência de modo persistida por casa no SQLite (mesmo mecanismo já usado para tema e para
  o modo corredor/agrupado), sobrevivendo ao fechar o app — mesma chave `ordenacaoDaDespensa`,
  agora com 6 valores possíveis.
- Nos modos por **Estado** e por **Quantidade**: a posição dos itens na lista é congelada por
  sessão de tela — capturada no mount, mantida durante toda a permanência na tela (inclusive
  através dos ajustes de quantidade feitos pelo stepper), e recalculada apenas no próximo mount
  da tela (entrar/voltar para ela, ou o app retornar de background). Pull-to-refresh manual
  **não** dispara reordenação. O estado visual de cada item (linha d'água, cor, rótulo) sempre
  reflete a quantidade real e atualiza imediatamente — só a posição na lista fica congelada.
  Os dois critérios precisam de congelamento pela mesma razão: ambos dependem de
  `quantidade_atual`, que muda a cada gesto do stepper no caminho crítico.
- No modo por **Nome** (A-Z ou Z-A), não há congelamento: a ordem por nome já é insensível a
  mudanças de quantidade, então nunca há necessidade de recálculo intermediário.
- Produto criado durante a sessão (ausente do snapshot) entra na posição que a ordenação
  ativa indicaria; produto removido/inativado desaparece normalmente da lista congelada.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `tela-despensa`: requisitos "Ordenação por estado" e "Ordenação alfabética" passam a
  descrever pares de direção (A-Z/Z-A, Acabou/Cheio primeiro); novo requisito "Ordenação por
  quantidade" (Menor/Maior); requisito de alternância de modo passa de botão-toggle para menu de
  6 opções agrupadas por `Divider`; requisito de congelamento de posição por sessão de tela
  passa a valer para os pares Estado e Quantidade (não mais só Estado).
- `repositorios`: `listarDespensa` passa a aceitar 6 valores no parâmetro de modo de ordenação,
  ramificando o `ORDER BY` conforme o modo (nome ASC/DESC, estado ASC/DESC, quantidade
  ASC/DESC).

## Impact

- `src/infrastructure/repositories/sqlite-produto.repository.ts` (`listarDespensa` — parâmetro
  de modo com 6 valores, ramificação do `ORDER BY` incluindo `quantidade_atual`)
- `src/application/estoque/use-produtos.ts` (congelamento estendido do par Estado para os pares
  Estado e Quantidade)
- `src/infrastructure/db/observador.ts` (sem mudança de contrato — apenas consumido pelo hook
  acima do jeito já existente)
- `src/ports/configuracao.repository.ts` e
  `src/infrastructure/repositories/sqlite-configuracao.repository.ts` (`OrdenacaoDaDespensa` com
  6 valores em `Configuracoes`/`PADROES`)
- Hook `src/application/lista/use-preferencia-ordenacao.ts` (`selecionar(modo)` em vez de
  `alternar()`, já que agora há 6 modos e não uma alternância binária)
- `app/(tabs)/index.tsx` (menu de ordenação via `react-native-paper`, entre lupa e +; leitura do
  hook de preferência)
- `app/_layout.tsx` (`PaperProvider` envolvendo as rotas — só para o Portal/tema do `<Menu>`,
  nenhum outro componente do Paper é usado no app)
- `package.json` (`react-native-paper`, `@expo/vector-icons` — tentativa anterior com `@expo/ui`
  foi descartada por não suportar cor customizada em todos os controles nas duas plataformas
  sem código nativo por plataforma; ver design.md D4)
- Testes: infraestrutura (Jest + SQLite em memória para os 6 modos de `listarDespensa`),
  aplicação (RNTL/fake repository para o snapshot congelado do hook, agora cobrindo Estado e
  Quantidade), componente (RNTL do menu com os 6 itens e 2 dividers), E2E Maestro (seleção de
  cada modo, persistência entre reaberturas, e o cenário do bug original — item não muda de
  posição durante ajuste de quantidade nos modos Estado e Quantidade).

## Dependencies between changes

Sem dependência de ordenação obrigatória com as demais changes ativas
(`correcao-baixa-produto-excluido-da-lista`, `correcao-sheets-ajuste-sem-autofoco`,
`feature-apagar-todos-os-dados`). Duas sobreposições de baixo risco, registradas aqui para
consciência de merge, sem exigir sequenciamento:

- `correcao-baixa-produto-excluido-da-lista` também edita
  `sqlite-produto.repository.ts`, mas em outro método (`removerLogicamente`) — sem conflito de
  lógica.
- `feature-apagar-todos-os-dados` apaga o conteúdo da tabela `configuracao`; isso já reverte a
  preferência de ordenação para o default (`alfabetica`) como efeito colateral esperado do
  reset completo, não como bug.
