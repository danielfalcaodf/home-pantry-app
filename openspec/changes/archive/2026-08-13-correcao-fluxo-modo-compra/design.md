## Context

`app/compra/[id].tsx` é a tela do modo compra: uma tela única (sem subtelas), com `useKeepAwake()` ligado enquanto ela está montada, uma lista de itens (`ItemCompra`, um por linha) e um rodapé com contador e total. O botão de voltar do cabeçalho é `BotaoVoltar` (`src/presentation/components/botao-voltar.tsx`), compartilhado com outras telas empilhadas (Detalhe do produto, Cadastrar produto), que hoje chama `router.back()` direto no `onPress`, sem parâmetros. A tela já tem um padrão de confirmação análogo em `confirmarCancelamento` (mesmo arquivo), usando `Alert.alert` com duas opções.

O QA (ACHADO-034, 054, 035, 036, 037) achou dois bugs médios e três lacunas de teste, todos na mesma tela/capability. `openspec/changes/ORDER.md` já registra que a change depende só da `correcao-fuso-horario-testes` (gate de `npm test` limpo) — nenhuma outra change ativa toca os mesmos arquivos.

## Goals / Non-Goals

**Goals:**
- Aviso de saída do modo compra só aparece quando faz sentido: ao acionar voltar, com pelo menos um item marcado.
- Determinar, com evidência reproduzível, se a suspeita de corrida de re-render do ACHADO-054 é um bug real; corrigir se for, documentar se não for.
- Fechar as três lacunas de teste (tela de modo compra, campos do movimento de fechamento, estilos do item marcado) sem alterar o comportamento que elas cobrem.

**Non-Goals:**
- Não redesenhar a tela do modo compra nem seu vocabulário — o texto de aviso muda de estático para condicional, mas mantém a mesma linguagem ("a compra continua aberta com o que você já marcou").
- Não introduzir biblioteca de gesto/swipe nem mudar a marcação de item (regra do CLAUDE.md: sem swipe na ação principal).
- Não alterar `use-finalizar-compra` nem a lógica de transação do fechamento — só o teste que verifica os campos do movimento já gravado.

## Decisions

**1. Confirmação como prop opcional de `BotaoVoltar`, não uma variante nova de componente.**
`BotaoVoltar` ganha uma prop opcional `aoConfirmarSaida?: () => boolean | Promise<boolean>` ou, mais simples, uma prop `confirmar?: { titulo: string; mensagem: string }` que, quando presente, abre um `Alert.alert` antes de chamar `router.back()`, só navegando se o usuário confirmar. Quando a prop está ausente (caso de Detalhe do produto e Cadastrar produto, que não têm progresso a perder), o comportamento atual é preservado, sem `Alert`. Alternativa considerada: duplicar a lógica de confirmação dentro de `app/compra/[id].tsx`, sem tocar em `BotaoVoltar` — rejeitada porque o botão físico/gesto de voltar do Android também aciona `router.back()` via navegação do próprio Expo Router em telas empilhadas, mas como o app já trata isso via `BotaoVoltar` desenhado no conteúdo (change `correcao-navegacao-nativa`) e não há listener de `beforeRemove` hoje, a superfície certa para interceptar é o único ponto de acionamento visível: o botão em si.
- `marcados > 0` é calculado em `app/compra/[id].tsx` (já existe como `marcados`, via `useMemo`) e passado para `BotaoVoltar` como a condição que ativa a prop de confirmação — a tela decide *quando* confirmar, o componente só sabe *como* confirmar.
- O texto de aviso estático em `app/compra/[id].tsx:96-98` ("Toque em cada item...") permanece como instrução permanente da tela (não é o aviso de saída em si — é orientação de uso); o aviso de saída passa a existir *só* no `Alert.alert` acionado pelo botão, condicionado a `marcados > 0`. Isso resolve a lacuna apontada pelo achado (aviso desvinculado do gesto) sem remover a orientação de uso, que continua útil.

**2. ACHADO-054 investigado antes de qualquer mudança de código de produção.**
Passo 1: escrever um teste RNTL que renderiza `app/compra/[id].tsx` (ou, se mais direto, a lista de `ItemCompra` dentro dela) com um repositório fake de compra contendo múltiplos itens, e dispara dois `fireEvent.press` em itens diferentes sem `await`/`waitFor` entre eles — reproduzindo a condição de "toques rápidos consecutivos" do achado. Passo 2: inspecionar o resultado (quais itens o repositório fake recebeu como `comprado: true`). Se o item marcado divergir do item tocado, é bug confirmado — a causa mais provável, dado que a tela usa `.map` com `key={linha.item.id}` (não há `FlashList` nesta tela, ao contrário da hipótese do achado) e cada `onPress` fecha sobre `linha.item` do render corrente, seria uma leitura de estado desatualizado entre o primeiro `editarItem` (assíncrono) e a re-renderização disparada por `observadorDoBanco`. Se não reproduzir, o achado fica documentado como não confirmado sob teste automatizado, e a change não altera `use-modo-compra.ts` nem `item-compra.tsx` além da cobertura de teste.

**3. Testes de estilo por valor computado, não por snapshot.**
Para o ACHADO-037, as asserções comparam a prop `style` resolvida de `Texto`/`View` (via `toHaveStyle` do RNTL ou leitura direta da prop) contra os valores esperados (`textDecorationLine: 'line-through'`, dimensões `ALVO_TOQUE_MINIMO`), não snapshot — snapshot quebra a cada mudança visual não relacionada e não documenta a intenção testada.

## Risks / Trade-offs

- **[Risco] `Alert.alert` é síncrono/nativo e não pode ser interceptado de forma determinística por todo test runner sem mock.** → Mitigação: mockar `Alert.alert` no teste (padrão já usado em outros testes de `confirmarCancelamento`, se existirem) para capturar os botões oferecidos e simular a escolha do usuário.
- **[Risco] O ACHADO-054 pode não reproduzir mesmo sendo um bug real de dispositivo físico (timing de touch events nativos difere de `fireEvent.press` sintético).** → Mitigação: documentar explicitamente em `tasks.md` que "não reproduzido sob RNTL" não é a mesma garantia que "não existe em produção" — se a suspeita persistir após esta change, abre-se um novo achado de QA para teste manual/Maestro dedicado, fora do escopo desta change de correção.
- **[Risco] Mudar a prop de `BotaoVoltar` pode afetar Detalhe do produto e Cadastrar produto, que também o usam.** → Mitigação: a prop é opcional e o comportamento sem ela é idêntico ao atual; o teste existente de `botao-voltar.test.tsx` (da change `correcao-navegacao-nativa`) continua válido sem alteração.
