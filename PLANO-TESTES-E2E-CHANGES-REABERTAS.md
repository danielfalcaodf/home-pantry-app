# Plano de testes E2E — changes reabertas para o gate de Maestro

**Data da preparação:** 2026-08-21
**Estado:** cenários escritos, **nenhum executado**. Esta rodada foi só de preparação.
**Escopo:** 5 changes arquivadas sem E2E, reabertas para fechar o gate de `/opsx:test`.

## Por que estas 5 changes voltaram

As changes 3-8 foram implementadas, testadas em unidade/integração e arquivadas num PR
consolidado (PR #38). O E2E ficou de fora: em duas delas por pedido explícito ("fora de
escopo"), nas outras três por simplesmente não ter rodado. Só a change 4
(`correcao-total-compra-preco-heranca`) teve cenários Maestro executados — por isso ela
continua arquivada e não aparece aqui.

Nenhuma linha de código de produção foi alterada nesta preparação. O que mudou:

- as 5 changes saíram de `openspec/changes/archive/` e voltaram para `openspec/changes/`;
- cada `tasks.md` ganhou uma seção de E2E com as tasks abertas (`- [ ]`);
- `openspec/changes/ORDER.md` registra a reabertura, preservando os números de ordem originais
  do lote (a lista pula o 4 de propósito);
- 24 flows novos em `.maestro/`.

| # | Change | Cenários | Arquivos |
|---|---|---|---|
| 3 | `correcao-baixa-produto-excluido-da-lista` | 4 | `.maestro/bug-exclusao-produto-*.yaml` |
| 5 | `correcao-sheets-ajuste-sem-autofoco` | 5 | `.maestro/bug-autofoco-*.yaml` |
| 6 | `correcao-tela-editar-produto` | 5 | `.maestro/bug-editar-produto-*.yaml` |
| 7 | `correcao-busca-despensa-persiste-entre-tabs` | 5 | `.maestro/bug-busca-despensa-*.yaml` |
| 8 | `feature-apagar-todos-os-dados` | 5 | `.maestro/feature-apagar-dados-*.yaml` |

## Antes de rodar (leia isto primeiro)

0. **A execução é por subagent + Maestro MCP** — `/qa:ux` (`mobile-ux-tester`) para rodar e
   investigar, `/qa:test` (`test-automator`) para corrigir flow. E **bug encontrado vira task na
   change** (`/opsx:update`) antes de qualquer linha de código. O procedimento completo está em
   "Como executar" e "Como registrar o resultado", no fim deste documento — leia as duas antes
   de começar.
1. **Os seletores não foram confirmados no app rodando.** Foram lidos do código-fonte
   (`accessibilityLabel`, rótulos de `CampoTexto`, textos de `Alert.alert`). Todos passam em
   `maestro check-syntax`, o que garante a sintaxe, não o alvo. Rode `inspect_screen` (MCP) ou
   `maestro hierarchy` na primeira execução de cada grupo e ajuste o que não casar.
2. **Confira o `appId` instalado** antes de qualquer coisa — o pacote do development build já
   ficou desatualizado em relação ao `com.danielfalcaodf.repor` dos flows em rodadas passadas.
3. **Os flows partem do zero**: cada um cadastra os próprios produtos pela interface, com nomes
   prefixados por `QA `. Não dependem da massa de seed. O custo disso é que cada execução deixa
   produtos de teste no dispositivo.
4. **Ordem sugerida:** grupos 3 → 5 → 6 → 7 e, por último, o grupo 8 (destrutivo). Evite
   `maestro test .maestro/` (roda a pasta em ordem alfabética e executaria os destrutivos no
   meio da bateria).
5. **Flows destrutivos** estão marcados com ⚠️ abaixo. Exporte um backup JSON pela tela de
   Configurações antes, se houver dado que importa no aparelho.

### Limites assumidos

- Maestro não afirma cor, tipografia nem posição de rolagem. Onde isso importa (botão
  destrutivo, auto-scroll do "Mais opções", rodapé fixo), o flow tira screenshot nomeado e a
  conferência é humana — está indicado cenário a cenário.
- "Campo focado" é afirmado pelo matcher `focused: true` do Maestro **e** por um segundo canal:
  digitar sem tocar no campo e verificar o efeito. Os dois juntos evitam depender de um matcher
  que pode se comportar diferente entre versões do RN.
- "Teclado aberto" não tem comando próprio no Maestro. É afirmado pela presença da janela do IME
  na hierarquia (`id: ".*inputmethod.*:id/keyboard_view"`), o que depende do teclado instalado
  no dispositivo — confirmar o id com `maestro hierarchy` antes da primeira execução do grupo da
  change 5, que é onde isso vira requisito.
- Nenhum flow mede tempo. O KPI K4 (baixa em ≤ 10 s) não é escopo desta rodada.

---

## Change 3 — `correcao-baixa-produto-excluido-da-lista`

**Bug:** excluir um produto não removia o item correspondente marcado "Fora da lista por agora"
da compra aberta — `removerLogicamente` é soft-delete, e o FK `onDelete:'set null'` só dispara
em DELETE físico. O item ficava preso apontando para um produto morto e reaparecia
indefinidamente, inclusive depois de a pessoa recriar um produto com o mesmo nome.

**Correção:** `DELETE FROM compra_item WHERE produto_id = :id AND comprado = false AND excluido
= true`, na mesma transação do soft-delete. Escopo deliberadamente restrito a `excluido = true`.

### 3.1 `bug-exclusao-produto-fora-da-lista-some.yaml`

- **Testa:** cria "QA Excluir Fora", tira da lista (vira `excluido = true`), exclui o produto
  na Despensa e volta à Lista.
- **Esperado:** a seção "Fora da lista por agora" não contém mais o item; nenhum nó com o nome
  do produto sobra na Lista.
- **Falha significa:** o bug original persiste — item fantasma no banco.

### 3.2 `bug-exclusao-produto-recriar-mesmo-nome.yaml`

- **Testa:** a repro exata do relato — tirar da lista, excluir, recriar produto com o mesmo
  nome.
- **Esperado:** o nome aparece uma única vez, na lista ativa; o registro órfão não ressuscita
  em "Fora da lista por agora".
- **Falha significa:** o usuário volta a ver o mesmo nome duas vezes, uma delas morta.

### 3.3 `bug-exclusao-produto-isolamento-outros-itens.yaml`

- **Testa:** dois produtos fora da lista; exclui só um.
- **Esperado:** o outro permanece em "Fora da lista por agora".
- **Falha significa:** o `DELETE` está sem o filtro por `produto_id` e apaga escolhas do
  usuário sobre produtos que ele nem tocou — dano colateral silencioso.

### 3.4 ⚠️ `bug-exclusao-produto-historico-compra-fechada.yaml`

- **Testa:** produto a R$ 7,00, compra marcada e **fechada**, histórico conferido, produto
  excluído, histórico conferido de novo.
- **Esperado:** "Histórico de compras" continua mostrando R$ 7,00 depois da exclusão.
- **Falha significa:** a exclusão de um produto reescreve retroativamente o histórico
  financeiro.
- **Efeito colateral:** ⚠️ fecha uma compra de verdade e repõe estoque.

### Cenário descartado nesta preparação

"Item pendente comum permanece na compra aberta ao excluir o produto" chegou a virar flow e foi
removido antes de rodar. O roteiro dependia de sair do Modo Compra pelo "Voltar" deixando a
compra aberta com o item pendente dentro — e esse fluxo vai mudar: sair pelo "Voltar" e
confirmar "Sair" passará a cancelar a compra na prática, e sem item marcado a compra também não
sobrevive. O resultado esperado deixaria de existir, então o cenário seria falso-verde ou
falso-vermelho dependendo do momento. A regra em si — item pendente comum (`excluido = false`)
NÃO é apagado pelo soft-delete do produto — continua coberta pela task 3.1 da change, no teste
de infra com SQLite em memória.

---

## Change 5 — `correcao-sheets-ajuste-sem-autofoco`

**Bug:** `sheet-ajuste-compra` e `sheet-ajuste-estoque` eram os dois únicos sheets do padrão
`PainelInferior` sem `autoFocus` no primeiro campo — abriam sem teclado, exigindo um toque
extra fora do padrão do resto do app.

**Correção:** `autoFocus` no primeiro `CampoTexto` de cada um.

> **Resultado esperado em todos os cenários desta change:** primeiro campo com `focused: true`
> **e teclado do sistema levantado**. Foco sem teclado não resolve o problema relatado — a
> pessoa continuaria precisando de um toque a mais para digitar. O teclado é afirmado pelo id da
> janela do IME (`.*inputmethod.*:id/keyboard_view`, casado por regex porque o pacote varia
> entre Gboard e AOSP) e registrado por screenshot nomeado. Confirmar esse id com
> `maestro hierarchy` (com o teclado aberto) na primeira execução; é o seletor mais frágil de
> toda a bateria, porque depende do IME do dispositivo, não do app.

### 5.1 `bug-autofoco-sheet-ajuste-estoque.yaml`

- **Testa:** abre o ajuste pelo detalhe do produto ("Corrigir quantidade atual") e digita **sem
  tocar em campo nenhum**.
- **Esperado:** o campo "Quanto você tem agora (un)" está com `focused: true`, o teclado está
  aberto (screenshot `autofoco-ajuste-estoque-teclado`), e o valor digitado chega nele — a
  Despensa passa a mostrar "2 de 3 un, Falta 1".
- **Falha significa:** sem foco automático, o número digitado se perde.
- **Efeito colateral:** grava um movimento de ajuste (histórico append-only, por design).

### 5.2 `bug-autofoco-sheet-ajuste-compra.yaml`

- **Testa:** o mesmo no sheet do Modo Compra, aberto por "Ajustar quantidade e preço de X".
- **Esperado:** campo "Quantidade (un)" focado, teclado aberto (screenshot
  `autofoco-ajuste-compra-teclado`); a quantidade do item passa a 3 un.
- **Falha significa:** o sheet mais usado de pé no mercado ainda exige um toque a mais.
- **Efeito colateral:** deixa uma compra **aberta** com o item ajustado e não marcado.

### 5.3 `bug-autofoco-sheet-reabertura.yaml`

- **Testa:** abre o sheet, fecha pelo "X" **sem salvar**, e abre de novo. Foco e teclado são
  afirmados nas **duas** aberturas.
- **Esperado:** na segunda abertura o foco continua no primeiro campo e o teclado sobe de novo
  (screenshot `autofoco-reabertura-teclado`).
- **Falha significa:** o `autoFocus` só vale na primeira montagem — defeito clássico que teste
  unitário de uma renderização só não pega.

### 5.4 `bug-autofoco-sheet-so-primeiro-campo.yaml`

- **Testa:** no sheet de dois campos (quantidade e preço pago), digita às cegas.
- **Esperado:** teclado aberto (screenshot `autofoco-so-primeiro-campo-teclado`),
  `focused: true` na quantidade e **não** no preço; quantidade vira 4 un e o item continua
  "sem preço".
- **Falha significa:** o foco está no campo errado e a digitação da quantidade vira um valor
  pago inventado — erro silencioso que custa dinheiro (a máscara aceita qualquer dígito).

### 5.5 `bug-autofoco-sheets-ja-corrigidos-regressao.yaml`

- **Testa:** os três sheets que já tinham `autoFocus` antes desta change — teclado de
  quantidade ("Outra quantidade"), preço do produto (toque na linha da Lista) e item avulso.
- **Esperado:** nos três, o campo abre focado e o teclado sobe (screenshots
  `autofoco-teclado-quantidade`, `autofoco-preco-produto-teclado`, `autofoco-avulso-teclado`),
  e digitar sem tocar funciona: reposição registrada (com "Desfazer" logo em seguida), total da
  Lista vira R$ 15,00, avulso criado.
- **Falha significa:** regressão nos vizinhos, provavelmente por alguém ter "unificado" o foco
  no `PainelInferior`.
- **Efeito colateral:** grava preço no produto e cria um item avulso na compra aberta.

---

## Change 6 — `correcao-tela-editar-produto`

**Bug (causa raiz única, três sintomas):** `app/produto/[id].tsx` montava `FormularioProduto`
com `telaCheia={false}` dentro de um `ScrollView` externo. Sem contexto `flex:1`, (1) o rodapé
"Salvar" rolava junto com o conteúdo, (2) o `EvitaTeclado` interno ficava sem efeito e o
"scroll to focused input" nativo não funcionava, e (3) "Mais opções" não rolava até o campo
revelado. Junto veio a extensão aditiva de `Botao` (ícone + cor) para o "Tirar da despensa".

### 6.1 `bug-editar-produto-salvar-fixo.yaml`

- **Testa:** abre a edição, expande "Mais opções", rola até o fim.
- **Esperado:** "Salvar" e "Tirar da despensa" continuam visíveis; screenshot
  `editar-produto-rodape-fixo` registra a posição.
- **Falha significa:** o botão principal da tela some ao rolar.

### 6.2 `bug-editar-produto-mais-opcoes-scroll.yaml`

- **Testa:** com o teclado já aberto, toca "Mais opções"; depois recolhe e reexpande.
- **Esperado:** "Quanto costuma custar" fica visível (o scroll aconteceu) e **não** recebe foco
  (`focused: true` negado); recolher não dispara scroll indesejado.
- **Falha significa:** ou o toque parece não fazer nada (campo revelado fora da dobra), ou o
  app rouba o foco contra a decisão explícita da change.

### 6.3 `bug-editar-produto-teclado-nao-cobre-campo.yaml`

- **Testa:** foca "Anotação" (último campo), digita, salva e reabre a tela.
- **Esperado:** o campo fica visível acima do teclado com o texto digitado, e o texto persiste
  ao reabrir; screenshot `editar-produto-campo-acima-do-teclado`.
- **Falha significa:** o keyboard-avoidance continua sem efeito — digitação às cegas.

### 6.4 `bug-editar-produto-botao-destrutivo.yaml`

- **Testa:** presença do rótulo acessível "Tirar da despensa", abertura do alerta nativo e o
  caminho de **cancelamento** ("Manter").
- **Esperado:** alerta com título e corpo corretos; após "Manter", o produto continua na
  despensa; screenshot `editar-produto-botao-destrutivo` para conferir ícone de lixeira e cor
  crítica (Maestro não afirma cor).
- **Falha significa:** ou o rótulo acessível não existe (a ação depende só do ícone), ou a
  confirmação é decorativa.

### 6.5 `bug-editar-produto-novo-produto-regressao.yaml`

- **Testa:** a tela irmã "Novo produto", que compartilha `formulario-produto.tsx` e `botao.tsx`.
- **Esperado:** autofoco do nome intacto (digitar sem tocar preenche "O que é"), rodapé
  "Adicionar à despensa" fixo com o formulário rolado, cadastro conclui.
- **Falha significa:** a correção da tela de edição quebrou a tela que já funcionava.

---

## Change 7 — `correcao-busca-despensa-persiste-entre-tabs`

**Bug:** as Tabs do Expo Router não desmontam a tela ao trocar de aba, e a Despensa não tinha
nenhum `useFocusEffect` — o campo de busca continuava aberto e com o teclado levantado sobre a
aba de destino.

**Correção:** cleanup no blur — sempre `Keyboard.dismiss()`; fechar o campo só quando a busca
está vazia (busca em andamento não é descartada).

> Nota de seletor: o ícone que abre a busca e o próprio campo têm o mesmo rótulo acessível
> ("Buscar"). O sinal confiável de "campo aberto e vazio" é o placeholder **"Nome do item"**.
> Onde é preciso tocar no campo (e não no ícone), o flow usa `index: 1` — confirmar a ordem com
> `inspect_screen`.

### 7.1 `bug-busca-despensa-vazia-fecha-ao-trocar-tab.yaml`

- **Testa:** abre a busca sem digitar, troca de aba e volta.
- **Esperado:** o campo está fechado ("Nome do item" ausente) e nada focado.
- **Falha significa:** o campo fica aberto para sempre depois do primeiro toque na lupa.

### 7.2 `bug-busca-despensa-com-termo-mantem-filtro.yaml`

- **Testa:** com dois produtos ("Alfa" e "Beta"), busca "Alfa", troca de aba e volta.
- **Esperado:** Alfa visível, Beta não — o filtro sobreviveu; o campo não está focado;
  screenshot `busca-com-termo-apos-voltar-da-aba`.
- **Falha significa:** ou a busca foi descartada (a pessoa tem de redigitar), ou o foco voltou
  junto.

### 7.3 `bug-busca-despensa-teclado-fecha.yaml`

- **Testa:** com o teclado levantado na busca, troca para a Lista.
- **Esperado:** a Lista está usável de imediato ("Iniciar compra (N)" visível), nada da
  Despensa continua focado; screenshot `lista-sem-teclado-apos-trocar-de-aba`.
- **Falha significa:** o sintoma mais visível do bug — teclado cobrindo outra tela.

### 7.4 `bug-busca-despensa-sem-resultado.yaml`

- **Testa:** termo sem correspondência ("zzqq") — a lista some e entra o estado vazio.
- **Esperado:** ao voltar da outra aba, "Nenhum item chamado "zzqq" por aqui." e "Cadastrar
  zzqq" continuam lá.
- **Falha significa:** perde-se o termo justamente no caso em que a pessoa ia usá-lo para
  cadastrar o item.

### 7.5 `bug-busca-despensa-limpar-termo-fecha.yaml`

- **Testa:** digitar → trocar de aba (mantém) → apagar o termo → **só então** trocar de aba.
- **Esperado:** na segunda troca o campo fecha — o comportamento segue o valor atual, não o de
  quando a tela ganhou foco.
- **Falha significa:** closure obsoleta no `useFocusEffect`; o campo nunca mais fecha sozinho.

---

## Change 8 — `feature-apagar-todos-os-dados`

**Feature:** botão "Apagar todos os dados" em Configurações → "Seus dados", com confirmação em
duas camadas (painel inline + `Alert.alert` nativo destrutivo). O reset apaga produtos,
compras, itens de compra e movimentos numa transação, recriando `casa`/`usuario` no fim para o
app continuar funcional sem reiniciar.

> Nota de seletor: depois da confirmação inline, o texto "Apagar tudo" existe **duas vezes** na
> tela (botão inline atrás do alerta + botão do alerta nativo). Os flows desempatam com
> `rightOf: "Manter meus dados"`, seguindo o layout do Alert do Android. Confirmar com
> `inspect_screen`.

### 8.1 ⚠️ `feature-apagar-dados-caminho-completo.yaml`

- **Testa:** cria um produto e percorre o caminho inteiro: botão → painel inline → alerta
  nativo → conclusão.
- **Esperado:** os textos das duas confirmações conferem, toast "Todos os dados foram
  apagados." aparece, e a Despensa volta ao estado vazio de app novo.
- **Falha significa:** ou uma das camadas de confirmação não existe, ou o reset não roda.
- **Efeito colateral:** ⚠️ apaga todos os dados do dispositivo.

### 8.2 `feature-apagar-dados-cancela-inline.yaml`

- **Testa:** abre a confirmação inline e toca "Cancelar".
- **Esperado:** painel fecha, nenhum toast de conclusão, produto de teste intacto.
- **Falha significa:** o primeiro toque no botão já apaga dados — o pior defeito possível nesta
  feature.

### 8.3 `feature-apagar-dados-cancela-alerta-nativo.yaml`

- **Testa:** avança até a última camada e recua em "Manter meus dados".
- **Esperado:** nada apagado, alerta fechado **e** painel inline fechado junto (o `onPress` do
  cancelar chama `apagarTudo.cancelar`).
- **Falha significa:** ou o recuo não aborta, ou a tela fica com a confirmação pendurada,
  convidando a um toque acidental.

### 8.4 ⚠️ `feature-apagar-dados-app-usavel-apos-reset.yaml`

- **Testa:** logo após o reset, **sem reiniciar**, cadastra um produto; depois reinicia o app.
- **Esperado:** o cadastro funciona e o produto sobrevive ao reinício — prova que
  `casa`/`usuario` foram recriados e persistidos.
- **Falha significa:** o app fica sem identidade local depois do reset (o risco central
  registrado no `design.md`). Cobre pela UI a intenção da task 4.1, que ficou sem teste de
  integração.
- **Efeito colateral:** ⚠️ apaga todos os dados do dispositivo.

### 8.5 ⚠️ `feature-apagar-dados-limpa-lista-e-resumo.yaml`

- **Testa:** espalha dado em três telas — produto na Despensa, compra **fechada** (gasto no
  Resumo) e item avulso numa compra **aberta** — e então reseta.
- **Esperado:** Despensa, Lista e Resumo voltam todos ao estado vazio; o avulso e o histórico
  de compras somem.
- **Falha significa:** o reset esquece tabelas que a Despensa não mostra e deixa o banco pior
  do que antes — itens de compra apontando para produtos inexistentes.
- **Efeito colateral:** ⚠️ fecha uma compra de verdade e depois apaga todos os dados.

---

## Como executar (subagent + Maestro MCP)

Esta bateria **não é para rodar `maestro test` na mão**. A execução é feita por subagent, pelo
Maestro MCP, porque cada grupo exige inspecionar a hierarquia antes de confiar num seletor — que
é exatamente o que nenhum destes 24 flows teve ainda.

- **`/qa:ux`** (subagent `mobile-ux-tester`) — é o caminho padrão daqui. Ele dirige o app pelo
  Maestro MCP (`list_devices` → `inspect_screen` → `run`), tira screenshot, e sabe conferir o
  resultado contra as regras de UI do projeto. Use para rodar cada grupo e para investigar
  qualquer falha.
- **`/qa:test`** (subagent `test-automator`) — quando um flow precisar ser corrigido ou estendido
  (seletor errado, passo faltando). Ele inspeciona a hierarquia antes de reescrever o seletor,
  em vez de chutar a partir do código-fonte.

Procedimento por grupo:

1. `list_devices` e confirme o `device_id`; confira também o pacote instalado contra o `appId`
   dos flows (já ficou desatualizado em rodadas passadas).
2. `inspect_screen` nas telas do grupo **antes** de rodar, e ajuste os seletores que não casarem
   — em especial os três marcados como frágeis: o id da janela do teclado (change 5), o
   desempate ícone/campo "Buscar" (change 7) e o desempate do botão "Apagar tudo" (change 8).
3. Rode os flows do grupo com `run`, um de cada vez, na ordem do plano.
4. Registre o resultado conforme a seção abaixo antes de passar para o próximo grupo.

## Como registrar o resultado

Para cada flow executado:

1. **Passou:** marque a task correspondente no `tasks.md` da change (`- [x]`).
2. **Falhou:** antes de mexer em qualquer coisa, decida de quem é o defeito — do flow (seletor
   errado, passo faltando, ambiguidade de hierarquia) ou do app (regressão ou bug real). Nunca
   "conserte" o flow até ele ficar verde sem essa decisão: um flow ajustado para passar sobre um
   bug real apaga a única evidência que temos.
   - **Defeito do flow** → corrija o `.yaml` (via `/qa:test`, que inspeciona a hierarquia antes),
     rode de novo e siga.
   - **Bug do app** → **não corrija o código direto**. O bug entra na change primeiro:
     1. `/opsx:update` na change correspondente, registrando o achado — cenário no
        `specs/<capability>/spec.md` descrevendo o comportamento correto, e as tasks novas em
        `tasks.md` (correção + teste do cenário do bug + casos de borda do mesmo contexto, que é
        o ciclo obrigatório de Correção de Bug do CLAUDE.md).
     2. Se o bug não pertencer a nenhuma das 5 changes reabertas (achado colateral, outra
        capability), `/opsx:propose` uma change nova e registre-a no `ORDER.md`.
     3. Só então implemente, por `/opsx:apply`, e rode o flow de novo.
   - Deixe a task do cenário **aberta** (`- [ ]`) enquanto o bug não estiver corrigido e o flow
     não passar — a task só é marcada com o app verde, não com o bug documentado.
3. Uma change só volta para `openspec/changes/archive/` com todos os seus cenários verdes
   (4 na change 3, 5 nas demais). O arquivamento gera o commit na branch consolidada
   `fix/3-8-correcao-bugs-ux-consolidado`, seguindo a exceção já combinada para este lote (1 PR
   consolidado, não 1 PR por change).
