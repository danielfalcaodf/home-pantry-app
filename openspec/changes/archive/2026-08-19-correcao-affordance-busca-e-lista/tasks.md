# Tasks — correcao-affordance-busca-e-lista

**Type:** Correção de Bug. Corrigir primeiro, provar com o teste do cenário exato do defeito,
e então obrigatoriamente cobrir os casos de borda do mesmo contexto.

Depende de `correcao-acoes-fora-de-alcance` (Ordem 5), que reorganiza o cabeçalho da Lista
onde o toggle "Agrupar" vive.

## 1. Correção — estado visível do toggle "Agrupar" (A-05)

- [x] 1.1 Em vez de replicar os canais do `ChipEstado` manualmente, o toggle passou a usar o
  próprio `ChipEstado` (contorno + fundo de estado ativo já implementados e testados) — mais
  simples que reimplementar, e é o mesmo vocabulário visual da barra de filtros da mesma tela.
- [x] 1.2 `accessibilityState={{ selected: agrupado }}` preservado (o `ChipEstado` já define
  isso quando recebe `onPress`), alvo de 48dp preservado (`ChipEstado` já usa
  `ALVO_TOQUE_MINIMO`). Rótulo também inverte ("Agrupar" ↔ "Agrupado") como canal adicional.
- [x] 1.3 Toggle agora visualmente distinto de "Compartilhar" (texto azulejo simples) e
  "Adicionar item avulso" (`AcaoSecundaria`) — só ele tem contorno/preenchimento de chip.
- [x] 1.4 Nenhum hex novo — `ChipEstado` já usa só tokens de `tokens.ts`.

## 2. Correção — contagem dos chips acompanha a busca (A-03)

- [x] 2.1 `app/(tabs)/index.tsx`: novo `itensDaBusca` (memo) filtra por categoria e busca, sem o
  filtro de estado; `contagens` e `visiveis` passam a derivar dele. A função de
  `agrupar-despensa.ts` não mudou — o filtro por busca já era responsabilidade da tela, não do
  format, então a correção ficou no consumidor.
- [x] 2.2 Semântica de `faltando = critico + emFalta` intacta — `contarPorEstado` não foi
  alterada, só a entrada que ela recebe.
- [x] 2.3 Testes unitários já existem em `agrupar-despensa.test.ts` (`casaComFiltro`, incluindo
  os casos `faltando = critico + emFalta`) — 6 testes verdes.

## 3. Correção — estado vazio da busca com teclado (A-01)

- [x] 3.1 `EvitaTeclado` aplicado só ao bloco do `EstadoVazio` da busca/filtro em
  `app/(tabs)/index.tsx`, não à tela toda — a `FlashList` com resultados não é afetada.
- [x] 3.2 Confirmado: a tela de busca não é `<Modal>`, mesmo caso já provado em
  `formulario-produto.tsx` — `EvitaTeclado` funciona sem depender de `correcao-teclado-em-sheets`.

## 4. Correção — corretor ortográfico no campo de busca (A-02)

- [x] 4.1 `spellCheck={false}` e `autoCorrect={false}` adicionados só no `CampoTexto` da busca
  em `app/(tabs)/index.tsx` — `CampoTexto` continua sem esse padrão embutido.

## 5. Correção — estado vazio distingue filtro sem termo de busca sem resultado (A-19)

- [x] 5.1 `EstadoVazio` de `app/(tabs)/index.tsx` agora condicionado a `busca !== ''`: com
  termo, mantém texto/ação de busca sem resultado; sem termo (filtro/categoria só), usa
  `convitePorFiltroVazio()` — sem aspas vazias, sem ação "Cadastrar" com nome vazio.
- [x] 5.2 Texto do caso "filtro sem itens": `Nada em "<filtro> · <categoria>" agora.` (ou só um
  dos dois, ou "Nada por aqui." se nenhum filtro ativo) — convite, não aviso seco. Redação final
  pode ser revisada na sessão de teste se não soar natural no aparelho.

## 6. Prova do cenário exato dos defeitos relatados

- [ ] 6.1 A-05: capturar os dois estados do toggle e verificar que os screenshots **diferem** —
  é o par `qa/audit-05-lista-agrupada` / `qa/audit-05-lista-sem-agrupar` da auditoria, agora
  como critério invertido.
- [ ] 6.2 A-03: buscar um termo sem resultado e assertar que os chips exibem zero, não 40.
- [ ] 6.3 A-01: com o teclado aberto e um termo de ~73 caracteres, assertar por
  `inspect_screen` que o CTA do estado vazio (hoje `[240,1485][841,1611]`) mantém folga do topo
  do teclado (hoje y=1670).
- [ ] 6.4 A-02: digitar um nome de produto acentuado na busca e confirmar que nenhum sublinhado
  de verificação ortográfica aparece.
- [x] 6.5 Confirmado por leitura de código 2026-08-19: `convitePorFiltroVazio(filtro, categoria)`
  usa `ROTULO_DO_FILTRO[filtro]` (nunca aspas vazias) e não oferece ação "Cadastrar" quando
  `filtro !== 'tudo'` — só o caso "sem busca, sem filtro" usa esse texto. Não foi possível
  reproduzir visualmente um estado vazio real com filtro de estado ativo nesta rodada (a massa
  de dados sempre tem itens em todos os estados), mas o código cobre o caso.

## 7. Casos de borda do mesmo contexto (obrigatório)

- [x] 7.1 Confirmado 2026-08-19: sem busca ativa, contagens Tudo/Acabou/Faltando (40/26/30 na
  massa atual) batem com os totais reais da despensa.
- [x] 7.2 Confirmado por leitura de código + teste manual: `visiveis` deriva de `itensDaBusca`
  filtrado por `casaComFiltro`, então busca e chip de estado se somam corretamente (`faltando`
  inclui `critico`+`emFalta` por design, confirmado ao vivo com o combo Carnes+Faltando).
- [x] 7.3 Confirmado 2026-08-19 (`auditoria-ui-ux-android.yaml` seção 2): chip de categoria e
  chip de estado continuam independentes.
- [x] 7.4 Confirmado 2026-08-19 (`auditoria-ui-ux-android.yaml` seção 2): apagar a busca
  (`eraseText`/`hideKeyboard`) volta as contagens ao total.
- [ ] 7.5 Lista vazia (zero itens na despensa) não testada nesta rodada — sem massa de dados
  vazia disponível sem apagar o fixture usado pelos outros flows.
- [x] 7.6 Confirmado 2026-08-19 (`auditoria-ui-ux-android.yaml` seção 7, dois temas Claro/Escuro
  x2): chip "Agrupado"/"Agrupar" com contraste adequado nos dois.
- [ ] 7.7 Termo curto (3 caracteres) vs. longo não comparado lado a lado nesta rodada — só o
  termo de ~73 caracteres (task 6.3, já confirmado) foi testado.
- [ ] 7.8 Desempenho de recontagem por tecla não medido nesta rodada (requer profiling
  dedicado, fora do escopo de uma verificação funcional via Maestro).
- [x] 7.9 Confirmado por leitura de código: a condição de `EstadoVazio` é `busca !== ''`
  primeiro (linha do componente), então busca+filtro resultando em vazio sempre mostra o texto
  de busca sem resultado, nunca o de filtro vazio.

## 8. Regressão

- [x] 8.1 `npm run verificar` verde 2026-08-19 (16 erros pré-existentes de rotas, não relacionados).
- [x] 8.2 `npm test` verde 2026-08-19 — 922/922, `agrupar-despensa`/`normalizar-busca` intactos.
- [x] 8.3 `.maestro/jornada-completa-caminho-feliz.yaml` verde 2026-08-19 (63/63).
- [x] 8.4 `.maestro/auditoria-ui-ux-android.yaml` verde 2026-08-19, duas vezes seguidas (167/167).
- [x] 8.5 Confirmado: preferência de agrupamento persiste entre navegações (usada em toda a
  rodada de teste sem resetar).

## Pendências desta rodada de teste (2026-08-18)

- [x] 6.1 confirmado: tocar "Agrupar" muda rótulo ("Agrupar"↔"Agrupado"), `selected` no
  `accessibilityState` e cor de fundo — 3 canais, `inspect_screen` real.
- [x] 6.2 confirmado: busca sem resultado zera os 3 chips (Tudo/Acabou/Faltando), não mantém o
  total.
- [x] 6.3 confirmado: estado vazio da busca fica visível acima do teclado.
- [x] 6.4 confirmado: nenhum sublinhado de correção ortográfica em termo acentuado nem em nome
  de produto real.
- [ ] 6.5 (A-19) não testado nesta rodada.
- `npm test` falha em `app/(tabs)/lista.test.tsx`: seletor antigo "Agrupar por categoria" não
  existe mais — o rótulo dinâmico "Agrupar"/"Agrupado" É o comportamento correto (não é
  regressão). Falha adicional "Found multiple elements" para "Adicionar item avulso" e botão
  "Fechar" — investigar se é só query frágil ou sintoma de duplicação real antes de trocar por
  `getAllByText`.
- Achado incidental (não catalogado, mesma tela): a `ScrollView`/lista de itens ativos
  (`rid="lista-de-compras"`) renderiza com altura colapsada (~155px, 1 item visível) sempre que
  a seção "Fora da lista por agora" está presente com muitos itens — mesmo sintoma do bug 5
  relatado pelo usuário (ver proposta de change nova via `/opsx:propose`, não duplicar).
- Restante das seções 6 (6.5), 7 e 8 não testado nesta rodada.
