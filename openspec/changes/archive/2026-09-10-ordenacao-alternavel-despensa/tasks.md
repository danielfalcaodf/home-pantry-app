## 1. Configuração persistida (chave de preferência)

- [x] 1.1 Teste (infra, Jest + SQLite em memória): `sqlite-configuracao.repository.test.ts` — ler
      `ordenacaoDaDespensa` sem gravação prévia retorna o padrão `'alfabetica'`; gravar e reler
      retorna `'estado'`.
- [x] 1.2 Implementar: adicionar `OrdenacaoDaDespensa = 'alfabetica' | 'estado'`,
      `ordenacaoDaDespensa` em `Configuracoes` e `PADROES` (`src/ports/configuracao.repository.ts`).
      Nenhuma mudança em `sqlite-configuracao.repository.ts` é esperada (upsert genérico por
      chave já cobre a nova chave) — task 1.1 prova isso.
- [x] 1.3 Rodar o teste de 1.1 e confirmar verde.

## 2. Repositório: `listarDespensa` com modo de ordenação

- [x] 2.1 Teste (infra, Jest + SQLite em memória) em
      `sqlite-produto.repository.test.ts`: `listarDespensa(casaId, 'alfabetica')` retorna os
      produtos ordenados só pelo nome, ignorando caixa, independente do estado de cada um
      (reforça o cenário "Ordenação alfabética pura" da spec `repositorios`).
- [x] 2.2 Teste (infra): `listarDespensa(casaId, 'estado')` continua com o comportamento atual
      (crítico → em falta → ok, nome como desempate) — reaproveitar/adaptar os testes já
      existentes de ordenação por estado, agora passando o modo explicitamente.
- [x] 2.3 Teste (infra): chamar `listarDespensa(casaId)` sem o segundo argumento mantém o
      comportamento por estado (compatibilidade com os ~15 callers existentes que não têm
      interesse na ordem — `use-finalizar-compra`, `use-conferencia`, `use-exportar-dados`,
      `use-resumo-valores`, testes de `sqlite-compra.repository.test.ts` e
      `sqlite-backup.repository.test.ts`).
- [x] 2.4 Implementar: `ProdutoRepository.listarDespensa(casaId: string, modo?: OrdenacaoDaDespensa): Promise<Produto[]>`
      em `src/ports/produto.repository.ts`, com `modo` opcional (default `'estado'` no
      comportamento, não precisa de valor default explícito na assinatura da interface).
- [x] 2.5 Implementar em `sqlite-produto.repository.ts`: ramificar `.orderBy(...)` conforme
      `modo` (design D1) — `alfabetica` usa só `nome COLLATE NOCASE`; `estado` mantém o `CASE`
      atual + nome como desempate; `modo` ausente/`undefined` cai em `'estado'`.
- [x] 2.6 Atualizar `repositorio-falso.ts` (`src/application/estoque/teste/`) para aceitar o
      novo parâmetro e replicar as duas ordenações em memória (usado pelos testes de
      `application/`).
- [x] 2.7 Rodar os testes de 2.1-2.3 e confirmar verdes; rodar toda a suíte de
      `sqlite-produto.repository.test.ts` para confirmar que nada quebrou.

## 3. Preferência de ordenação (hook de aplicação)

- [x] 3.1 Teste (RNTL/hook, repositório fake): `use-preferencia-ordenacao.test.ts`, no molde de
      `use-preferencia-agrupamento.test.ts` — lê o padrão `'alfabetica'` no mount; `alternar()`
      grava e atualiza para `'estado'`; chamar de novo volta para `'alfabetica'`.
- [x] 3.2 Implementar `src/application/lista/use-preferencia-ordenacao.ts`
      (`usePreferenciaDeOrdenacao`), por cópia estrutural de `usePreferenciaDeAgrupamento`
      (design D3).
- [x] 3.3 Rodar o teste de 3.1 e confirmar verde.

## 4. Congelamento de posição (núcleo do bug fix)

- [x] 4.1 Teste (unitário, função pura): extrair e testar `aplicarOrdemCongelada(itens: ProdutoNaDespensa[], ordem: string[]): ProdutoNaDespensa[]`
      em `src/application/estoque/use-produtos.ts` (ou arquivo irmão) — casos: item na ordem
      aparece na posição correta; item ausente da ordem (novo) é anexado ao final na posição
      relativa em que veio; item da ordem ausente dos itens (removido) é omitido do resultado.
- [x] 4.2 Teste (RNTL/hook, repositório fake + observador fake) em `use-produtos.test.ts`: com
      modo `'estado'`, simular uma notificação do observador que muda o estado de um item
      (crítico → em falta) e verificar que a posição do item na lista retornada **não muda**,
      mas seus campos `estado`/`fracao`/`rotulo` refletem o novo valor — este é o teste que
      prova o cenário "Item não muda de posição ao trocar de estado" da spec.
- [x] 4.3 Teste (RNTL/hook): com modo `'alfabetica'`, a mesma simulação de notificação não
      precisa de snapshot — a ordem apenas segue a query (comportamento já coberto
      implicitamente, teste serve de regressão de que o modo alfabético nunca aplica
      congelamento).
- [x] 4.4 Teste (RNTL/hook): trocar de modo (`alternar()` via preferência) durante a sessão
      recaptura a ordem congelada imediatamente (cenário "Trocar de modo... recaptura a posição
      congelada" do design D2).
- [x] 4.5 Teste (RNTL/hook): produto criado durante a sessão (ausente do snapshot original)
      aparece na lista sem deslocar os itens existentes; produto removido desaparece sem afetar
      a ordem relativa dos demais.
- [x] 4.6 Implementar em `use-produtos.ts`: receber o modo ativo (parâmetro, injetado pela tela
      a partir de `usePreferenciaDeOrdenacao`), capturar `ordemCongelada` em `useRef` no mount
      (só quando `modo === 'estado'`), reaplicar via `aplicarOrdemCongelada` nas atualizações
      reativas subsequentes, e recapturar ao trocar de modo (design D2). Revisar/remover o
      comentário "a ordenação vem do SQL — a apresentação não reordena" (linha 53), que deixa
      de ser inteiramente verdade no modo por estado.
- [x] 4.7 Rodar todos os testes de 4.1-4.5 e confirmar verdes.

## 5. Interface: botão de alternância na tela da despensa

- [x] 5.1 Teste (RNTL, componente/tela) em `app/(tabs)/index.test.tsx` (ou arquivo de teste já
      existente da tela): botão de alternância existe entre a busca e o `+`; tocar nele chama
      `alternar()` da preferência e a lista muda de ordem; rótulo acessível indica o modo atual
      (três canais redundantes — CLAUDE.md).
- [x] 5.2 Implementar o botão em `app/(tabs)/index.tsx`, consumindo `usePreferenciaDeOrdenacao`
      e repassando o modo para `useProdutos`.
- [x] 5.3 Rodar o teste de 5.1 e confirmar verde.

## 6. Regressão e verificação de fronteiras

- [x] 6.1 Rodar `npm run test:domain` e `npm test` completos — confirmar que nenhuma suíte
      pré-existente quebrou (em especial `sqlite-compra.repository.test.ts` e
      `sqlite-backup.repository.test.ts`, que chamam `listarDespensa` sem o novo parâmetro).
- [x] 6.2 Rodar `npm run verificar` (fronteiras + lint + typecheck) e corrigir qualquer
      apontamento. Fronteiras e lint verdes; os erros de `typecheck` restantes (rotas do Expo
      Router com `require.d.ts` desatualizado) são dívida pré-existente confirmada via
      `git stash` — nenhum deles nos arquivos tocados por esta change.
- [x] 6.3 Conferir cobertura de domínio/aplicação ≥ 90% nos arquivos tocados.

## 7. QA end-to-end (Maestro)

- [x] 7.1 Flow Maestro: cenário do bug original — no modo por estado, usar o stepper `+`/`-` até
      um item trocar de bucket de estado e confirmar visualmente que ele não muda de posição na
      tela. (`feature-ordenacao-despensa-posicao-congelada.yaml`)
- [x] 7.2 Flow Maestro: alternar entre os dois modos pelo botão de ícone e confirmar que a
      ordem da lista muda de fato. (`feature-ordenacao-despensa-alternar-modo.yaml`)
- [x] 7.3 Flow Maestro: escolher o modo por estado, fechar e reabrir o app, confirmar que a
      preferência persiste. (`feature-ordenacao-despensa-persiste-apos-reabrir.yaml`)
- [x] 7.4 Flow Maestro: regressão — modo alfabético (default) continua funcional para busca,
      filtros por estado/categoria e agrupamento por categoria já existentes (specs não
      tocadas por esta change). (`feature-ordenacao-despensa-regressao-alfabetico.yaml`)
- [x] 7.5 Rodar os 4 flows no emulador e confirmar sucesso antes de liberar para
      `/opsx:test`/`/opsx:archive`. Todos os 4 passaram no `emulator-5554` (dev-client
      reconectado ao Metro em `http://localhost:8081`).

## 8. Expansão para 6 modos e menu com `react-native-paper` (revisão de escopo)

As tasks 1-7 implementaram a versão de 2 modos com botão de alternância binária. A revisão de
escopo em proposal.md/design.md troca isso por 6 modos (3 pares) num menu — as tasks abaixo
cobrem só o delta, seguindo TDD (teste antes do código).

- [x] 8.1 Teste (infra, Jest + SQLite em memória) em `sqlite-produto.repository.test.ts`:
      `listarDespensa(casaId, 'quantidade')` retorna os produtos em ordem crescente de
      `quantidade_atual`, com desempate alfabético para quantidades iguais.
- [x] 8.2 Teste (infra): `listarDespensa(casaId, 'quantidadeInversa')` retorna em ordem
      decrescente, mesmo desempate.
- [x] 8.3 Implementar em `src/ports/produto.repository.ts` e `sqlite-produto.repository.ts`:
      adicionar `'quantidade' | 'quantidadeInversa'` a `OrdenacaoDaDespensa`
      (`src/ports/configuracao.repository.ts`) e ramificar `.orderBy(...)` para os dois novos
      valores (design D1) — desempate por `nomeNocase`.
- [x] 8.4 Atualizar `repositorio-falso.ts` (`src/application/estoque/teste/`) com o comparador
      dos dois novos modos.
- [x] 8.5 Rodar os testes de 8.1-8.2 e confirmar verdes; rodar toda a suíte de
      `sqlite-produto.repository.test.ts`.
- [x] 8.6 Teste (RNTL/hook, repositório fake + observador fake) em `hooks.test.ts`: com
      modo `'quantidade'`, simular notificação do observador que muda `quantidade_atual` de um
      item e verificar que a posição na lista **não muda**, mas o valor exibido reflete a
      mudança — mesmo padrão do teste já existente para `'estado'` (prova o cenário "Item não
      muda de posição ao trocar de quantidade" da spec).
- [x] 8.7 Teste (RNTL/hook): trocar de modo dentro do mesmo par (`'estado'` →
      `'estadoInverso'`) recaptura a ordem congelada imediatamente (cenário "Trocar de direção
      no mesmo par recalcula a ordem").
- [x] 8.8 Implementar em `use-produtos.ts`: estender a condição de congelamento de
      `modo === 'estado'` para `modoPorEstado || modoPorQuantidade` (design D2), onde
      `modoPorQuantidade = modo === 'quantidade' || modo === 'quantidadeInversa'`.
- [x] 8.9 Rodar os testes de 8.6-8.7 e confirmar verdes.
- [x] 8.10 Teste (RNTL, componente) em `app/(tabs)/index.test.tsx`: o menu de ordenação exibe as
      6 opções com os rótulos finais (`Nome (A-Z)`, `Nome (Z-A)`, `Acabou primeiro`, `Cheio
      primeiro`, `Menor quantidade`, `Maior quantidade`), agrupadas por 2 `Divider` sem texto de
      cabeçalho; a opção ativa exibe a marca de seleção (`check`).
- [x] 8.11 Implementar em `app/(tabs)/index.tsx`: renomear `ROTULO_DA_ORDENACAO` para os rótulos
      finais acima; adicionar as entradas `quantidade`/`quantidadeInversa` a
      `ROTULO_DA_ORDENACAO` e `ICONE_DA_ORDENACAO`
      (`sort-numeric-ascending`/`sort-numeric-descending`); trocar `OPCOES_DE_ORDENACAO` por
      `GRUPOS_DE_ORDENACAO` (3 pares) e inserir um `<Divider>` entre cada par de `<Menu.Item>`.
- [x] 8.12 Rodar o teste de 8.10 e confirmar verde.
- [x] 8.13 Rodar `npm run test:domain` e `npm test` completos (229 e 1141 testes,
      respectivamente, todos verdes); rodar `npm run verificar` — fronteiras e lint OK; os erros
      de typecheck restantes são só a dívida pré-existente de tipos de rota do Expo Router
      (mesmos arquivos/natureza já confirmados fora de escopo na task 6.2, nenhum novo
      introduzido por esta seção).
- [x] 8.14 Conferir cobertura de domínio/aplicação ≥ 90% nos arquivos tocados por esta seção.
      Domínio: 95.84% geral (`npm run test:cov`). `use-produtos.ts`: 98.31%.
      `sqlite-produto.repository.ts`: 94.43%. `configuracao.repository.ts` é só tipos/
      constantes (sem lógica a cobrir).
- [x] 8.15 Atualizar o flow Maestro `feature-ordenacao-despensa-alternar-modo.yaml` para abrir o
      menu (não mais um botão de alternância binária) e selecionar opções dos pares Nome e
      Estado, confirmando a reordenação real.
- [x] 8.16 Novo flow Maestro `feature-ordenacao-despensa-quantidade-congelada.yaml`: no modo
      "Menor quantidade", usar o stepper para que um item ultrapasse o outro em quantidade e
      confirmar visualmente que a posição não muda — mesmo padrão do flow já existente para o
      modo por estado (task 7.1), agora provando a extensão do congelamento ao par Quantidade.
- [x] 8.17 Rodar os flows Maestro afetados no emulador (`emulator-5554`, dev-client reconectado
      ao Metro): `feature-ordenacao-despensa-alternar-modo.yaml` passou de ponta a ponta (37
      comandos). `feature-ordenacao-despensa-quantidade-congelada.yaml` **não passa de forma
      confiável sob execução 100% automatizada** — investigação extensa (ver design.md, Risks)
      isolou uma condição de corrida gatilhada puramente pela velocidade de toques em sequência
      via Maestro (não por valores empatados, não resolvida por pausas artificiais de até 5s
      dentro do flow). Validado manualmente no ritmo humano real, por dois métodos independentes
      (teste do usuário e teste do agente passo a passo no emulador): a posição fica congelada
      corretamente nos dois casos. O flow permanece no repositório como documentação executável
      e para revalidação manual; a garantia de regressão automatizada desse comportamento vem do
      teste determinístico `hooks.test.ts` ("modo quantidade", 36/36 verdes) mais a validação
      manual registrada em design.md. Decisão do usuário: registrar como achado conhecido,
      não-bloqueante, e seguir — não investigar a causa raiz exata agora.
- [x] 8.18 Bug visual (achado em revisão manual no emulador, screenshot do usuário): o primeiro
      `<Divider>` do menu aparecia mais claro que o segundo — `<Divider>` sem `style` herdava o
      token de cor default do tema do `react-native-paper` (`outlineVariant`, não coberto pelo
      `theme` parcial passado ao `<Menu>`) em vez do hairline do projeto. Corrigido em
      `app/(tabs)/index.tsx` fixando `style={{ backgroundColor: tema.line.hairline }}` nos dois
      `<Divider>` (mesmo token usado em toda borda/divisória do app — design D4). Confirmado
      visualmente no emulador (`emulator-5554`) com os dois divisores idênticos; suíte
      `app/(tabs)/index.test.tsx` (15/15) continua verde.
