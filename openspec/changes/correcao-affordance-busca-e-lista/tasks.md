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
- [ ] 2.3 Testes unitários ficam para a sessão de teste dedicada (ver ORDER.md).

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
- [ ] 6.5 A-19: aplicar o filtro "Acabou" numa despensa sem nenhum item nesse estado, sem
  digitar nada na busca, e confirmar que o texto exibido não contém aspas vazias e a ação
  exibida não é "Cadastrar" com nome vazio.

## 7. Casos de borda do mesmo contexto (obrigatório)

- [ ] 7.1 Contagem sem busca ativa permanece idêntica à de hoje — prova de que a mudança de
  universo não alterou o caso comum.
- [ ] 7.2 Busca ativa combinada com chip de estado selecionado: as duas restrições se somam, e
  a contagem reflete a interseção.
- [ ] 7.3 Busca ativa combinada com filtro de categoria: as duas réguas de chips continuam
  independentes (verificado como conforme na auditoria — não pode regredir).
- [ ] 7.4 Apagar o termo de busca: as contagens voltam ao total, sem estado preso.
- [ ] 7.5 Toggle "Agrupar" com a lista vazia e com a lista cheia: o estado visual funciona nos
  dois.
- [ ] 7.6 Toggle "Agrupar" nos dois temas (Despensa e Porcelana): contraste suficiente em ambos.
- [ ] 7.7 Estado vazio da busca com termo curto (3 caracteres) e com termo longo: a folga do
  teclado não depende do comprimento do termo.
- [ ] 7.8 Desempenho: medir a contagem recalculada a cada tecla com a massa de 40 itens, contra
  o requisito "Desempenho da lista longa" de `tela-despensa`.
- [ ] 7.9 Filtro de chip **e** busca ativos ao mesmo tempo, resultando em lista vazia: o texto
  exibido é o de busca sem resultado (há termo digitado), não o de filtro sem itens — a
  distinção de 5.1 é por `busca !== ''`, não por chip ativo.

## 8. Regressão

- [ ] 8.1 `npm run verificar` verde (fronteiras + lint + typecheck), incluindo a regra de hex.
- [ ] 8.2 `npm test` verde, com os testes existentes de `agrupar-despensa` e
  `normalizar-busca` intactos.
- [ ] 8.3 `.maestro/jornada-completa-caminho-feliz.yaml` verde (baseline: 62 comandos).
- [ ] 8.4 `.maestro/auditoria-ui-ux-android.yaml` verde (baseline: 163 comandos), duas vezes
  seguidas. Atenção: a §1 do roteiro assere contagens de chip por regex `"Tudo, \\d+"` — segue
  válida, mas os valores esperados na busca mudam.
- [ ] 8.5 A preferência de agrupamento continua persistindo (`usePreferenciaDeAgrupamento`), o
  que `lista-derivada` já exige — a mudança é só visual.
