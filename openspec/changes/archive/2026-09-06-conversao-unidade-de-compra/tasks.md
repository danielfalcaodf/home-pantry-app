## 1. Schema e migration

- [x] 1.1 Adicionar colunas opcionais em `produto` (`src/infrastructure/db/schema.ts`): fator de
      conversão de embalagem (inteiro) e valor de referência do pacote (centavos), ambas
      nullable, sem `CHECK` que exija unidade indivisível (validação fica no domínio, não no SQL)
- [x] 1.2 Adicionar colunas opcionais em `compra_item`: quantidade de pacotes comprados e fator
      de pacote usado naquela compra (inteiro), ambas nullable
- [x] 1.3 Gerar migration (`npx drizzle-kit generate --name conversao-unidade-de-compra`) e
      revisar o `.sql` gerado manualmente antes do commit
- [x] 1.4 Testar a migration aplicando desde schema vazio e desde a versão anterior, confirmando
      que produtos e itens existentes continuam com os novos campos `NULL` e comportamento
      inalterado (achado: `drizzle-kit generate` produziu SQL com dois bugs corrigidos
      manualmente — o `INSERT...SELECT` de repovoamento tentava ler as colunas novas da tabela
      antiga antes de existirem, e o `PRAGMA foreign_keys=ON` reativava a checagem entre a
      reconstrução de `compra_item` e a de `produto`, causando `ON DELETE SET NULL` em cascata
      no `DROP TABLE produto` e violando `ck_compra_item_origem`; a correção moveu o `PRAGMA
      foreign_keys=ON` para depois de ambas as reconstruções)

## 2. Domínio — testes antes da implementação (TDD)

- [x] 2.1 Escrever testes de `domain/produto/conversao-embalagem.rules.ts` (arquivo novo)
      cobrindo: fator aceito só em unidade indivisível, fator rejeitado em unidade divisível,
      fator opcional, fator deve ser inteiro positivo, rótulo "Vem em pacotes de N", produto sem
      fator não exibe rótulo
- [x] 2.2 Escrever testes de derivação do valor unitário a partir do valor do pacote: divisão
      exata e divisão com resto (arredondamento ao centavo mais próximo)
- [x] 2.3 Escrever testes de arredondamento da quantidade a comprar para múltiplo do fator: falta
      menor que um pacote, falta maior que um pacote, falta exata em múltiplo do fator, e
      confirmação de que produto sem fator continua usando a regra existente de arredondar para 1
      unidade (não deve haver regressão nos cenários já cobertos em `estoque.rules.test.ts`)
- [x] 2.4 Escrever testes de derivação do preço pago por unidade a partir de pacotes: tamanho
      igual ao cadastrado, tamanho diferente do cadastrado no mercado, e confirmação de que a
      divergência de tamanho não altera o fator cadastrado no produto
- [x] 2.5 Escrever teste confirmando que o preço pago por unidade derivado de pacotes, quando
      diverge do valor unitário cadastrado, aciona a mesma detecção de divergência já existente
      em `regras-de-compra` (reuso, sem regra nova)
- [x] 2.6 Rodar `npm run test:domain` e confirmar que todos os testes escritos acima falham
      (nenhuma implementação ainda existe)

## 3. Domínio — implementação

- [x] 3.1 Implementar `domain/produto/conversao-embalagem.rules.ts`: validação do fator (inteiro
      positivo, só unidade indivisível), composição do rótulo, derivação do valor unitário a
      partir do valor do pacote
- [x] 3.2 Estender `arredondarParaUnidade`/`quantidadeAComprar` em `domain/produto/estoque.rules.ts`
      (ou nova função dedicada) para arredondar ao múltiplo do fator quando presente, retornando
      também o excedente de unidades
- [x] 3.3 Implementar a derivação do preço pago por unidade a partir de pacotes (quantidade de
      pacotes × tamanho real ÷ valor total pago), reaproveitando `multiplicarQuantidadePorPreco`/
      `converterValorBruto` de `domain/shared/dinheiro.ts` sem duplicar a lógica de conversão
      milésimos↔centavos
- [x] 3.4 Rodar `npm run test:domain` e confirmar que todos os testes de 2.1-2.5 passam, e que a
      suíte de domínio completa continua verde (sem regressão em `estoque.rules.test.ts`)
- [x] 3.5 Rodar `npm run test:cov` e confirmar cobertura ≥ 90% mantida no domínio (débito
      pré-existente: cobertura de branch global já estava em 88,06% antes desta change, por
      `passoDoStepper`/`validacao.ts` não relacionados; código novo desta change está 100% coberto
      e o total subiu para 88,94%, sem regressão)

## 4. Infraestrutura — testes antes da implementação (TDD)

- [x] 4.1 Escrever teste de infra (SQLite em memória) confirmando que `ProdutoRepository` grava e
      lê o fator de conversão e o valor de referência do pacote
- [x] 4.2 Escrever teste de infra confirmando que `CompraRepository`/item de compra grava a
      quantidade de pacotes e o fator usado naquela compra, e que o fechamento aplica o valor
      pago por unidade derivado na mesma transação já existente (sem quebrar a atomicidade
      documentada em `fechamento-de-compra`)
- [x] 4.3 Rodar os testes de infra e confirmar que falham antes da implementação

## 5. Infraestrutura — implementação

- [x] 5.1 Atualizar `SQLiteProdutoRepository` para persistir/ler os novos campos
- [x] 5.2 Atualizar o repositório de compra para persistir os novos campos de `compra_item` e
      aplicar a derivação de preço por unidade dentro da transação de fechamento existente
      (o valor derivado é calculado na application antes de chegar em `editarItem`/`finalizar`,
      que só persistem o resultado — mesma divisão de responsabilidade já usada para preço direto)
- [x] 5.3 Rodar os testes de infra de 4.1-4.2 e confirmar que passam, sem regressão nos testes de
      transação/rollback já existentes (suíte completa: 1078/1078 testes verdes)

## 6. Application — testes antes da implementação (TDD)

- [x] 6.1 Escrever teste (repositório fake) do caso de uso de cadastro/edição de produto
      aceitando os campos de embalagem só quando a unidade é indivisível (coberto via
      `validacao.test.ts`, já que `useCadastrarProduto`/`useEditarProduto` são repasse fino sem
      lógica nova — a cobertura de comportamento está no domínio, evitando teste duplicado)
- [x] 6.2 Escrever teste do caso de uso de marcar item comprado no modo compra: para produto com
      fator, aceitar pacotes + tamanho real do pacote (editável) + valor total, calculando
      quantidade comprada e preço pago por unidade; para produto sem fator, confirmar que o
      fluxo existente (quantidade/preço por unidade direto) continua intacto
- [x] 6.3 Escrever teste confirmando que o fechamento de compra com item de pacote diferente do
      cadastrado não altera o fator do produto, e que o preço derivado diferente aciona a
      revisão de divergência de preço já existente
- [x] 6.4 Rodar os testes de application acima e confirmar que falham antes da implementação

## 7. Application — implementação

- [x] 7.1 Atualizar o caso de uso de cadastro/edição de produto para os campos novos (automático:
      `EntradaCadastroProduto`/`ProdutoValidado` já carregam os campos novos até `validarCadastroProduto`)
- [x] 7.2 Atualizar o caso de uso de marcar item comprado (modo compra) para o fluxo de pacotes
      quando o produto tiver fator cadastrado (`useModoCompra.ajustarComPacotes`)
- [x] 7.3 Rodar os testes de application de 6.1-6.3 e confirmar que passam, sem regressão na
      suíte de `application/` existente (fechamento, materialização da lista, etc.) — suíte
      completa 1082/1082 verde

## 8. Presentation

- [x] 8.1 `FormularioProduto`: para unidade `un`, exibir controle "Vem em pacote fechado?" (chip
      binário Não/Sim, default Não, reaproveitando `ChipEstado`) na seção "Mais opções"; com
      "Não" manter apenas "Quanto costuma custar" (comportamento inalterado, ex.: sabonete); com
      "Sim", ocultar "Quanto costuma custar" e exibir os dois campos de embalagem. Para unidade
      `pacote`/`caixa`, NÃO exibir o controle — ir direto aos dois campos de embalagem, sem
      "Quanto costuma custar" (a unidade já significa "pacote fechado", perguntar é redundante).
      Escondendo/descartando controle e campos de pacote ao trocar para unidade divisível
      (reaberta em 2026-09-05: a versão anterior desta task deixava os dois campos de pacote
      sempre visíveis junto do preço direto quando indivisível, gerando dois campos de preço
      simultâneos e ambíguos, com o valor do pacote sobrescrevendo silenciosamente o valor
      unitário digitado — ver decisão em `design.md`. Reimplementada em 2026-09-05: estado local
      `pacoteFechado` deriva do fator já cadastrado (edição) ou default `false` (cadastro novo);
      "Não" limpa os dois campos de embalagem para não deixar valor obsoleto pronto pra reaparecer.
      Reaberta de novo em 2026-09-05: restringir o chip a `un` e pular a pergunta pra
      `pacote`/`caixa`, ver decisão "Chip... só para unidade `un`" em `design.md`)
- [x] 8.2 Sheet de ajuste no modo compra: para item com fator cadastrado, substituir os campos de
      quantidade/preço por unidade pelos campos de pacotes/tamanho do pacote (pré-preenchido,
      editável)/valor total pago
- [x] 8.3 Lista de compras: exibir "compre N pacotes" e o excedente convidativo ("dá para X")
      quando o produto tiver fator, sem tocar no texto de produtos sem fator
- [x] 8.4 Testes de componente (React Native Testing Library) para o controle "Vem em pacote
      fechado?": default Não (só "Quanto costuma custar" visível) pra unidade `un`, alternar
      para Sim troca os campos exibidos (esconde preço direto, mostra os dois campos de pacote),
      "Não" a partir de produto com fator já cadastrado descarta a embalagem e retoma o preço
      direto, alternar unidade para divisível descarta controle e valores, produto sem fator
      permanece sem mudança visual, unidade `pacote`/`caixa` vai direto aos dois campos de
      embalagem sem exibir o controle nem "Quanto costuma custar", e ida-e-volta entre `un` (com
      fator) e `pacote` mantém a embalagem visível sem reintroduzir o preço direto (9 cenários em
      `formulario-produto.embalagem.test.tsx`). Achado: montar dois toggles do chip em sequência
      rápida no mesmo teste (Sim → editar campo → Não → Sim de novo) colide com o
      `requestAnimationFrame`
      de scroll que "Mais opções" agenda (ACHADO-058) — `act()` sobreposto corrompe a árvore do
      teste seguinte no arquivo. Contornado evitando esse encadeamento: o cenário "Não descarta a
      embalagem" parte de um produto que já nasce com fator cadastrado (chip em "Sim" pela
      derivação do estado inicial) em vez de simular os dois cliques na mesma árvore.
- [x] 8.5 Verificação manual dos três canais de estado redundantes (altura, cor, rótulo textual)
      continuam intactos na lista quando o item tem excedente de pacote (feita nesta sessão de
      QA/E2E, `emulator-5554`: item "Item Teste QA Pacote" com 16 de 13 un após compra com pacote
      diferente do cadastrado — `accessibilityLabel` "Item Teste QA Pacote, 16 de 13 un, Cheio"
      confirmado via `inspect_screen`/`assertVisible`, screenshot capturado; `estado='ok'` deriva
      a cor do estado, `fracao` clampada em `[0,1]` já testada no domínio garante altura cheia sem
      vazar, rótulo "Cheio" presente — os três canais permanecem redundantes e corretos com o
      fator de conversão de embalagem ativo)
- [x] 8.6 (aberta em 2026-09-05, achado pós-exploração — ver decisão "Passo rápido... anda de
      pacote em pacote" em `design.md`) `passoRapido`/`ajustarQuantidadeRapida`
      (`domain/compra/quantidade-compra.rules.ts`, `application/compra/use-modo-compra.ts`)
      passam a considerar o fator do item (`item.fatorUsadoNaCompra ?? produto.fatorConversaoEmbalagem`):
      quando presente, o passo do "+/-" no Modo Compra vira o fator inteiro de unidades (nunca 1
      unidade), e o piso de decremento existente (não descer abaixo de 1 passo) passa a valer 1
      pacote inteiro. `podeDiminuirQuantidade` em `app/compra/[id].tsx` precisa da mesma lógica de
      piso. `custoTotal` do item nesse caminho reaproveita `custoEstimadoComFator` (já usado na
      correção de arredondamento desta sessão) em vez de multiplicar quantidade × valorEstimadoUnit.
      Produto sem fator: comportamento inalterado.
- [x] 8.7 Testes cobrindo 8.6: `passoRapido`/`ajustarQuantidadeRapida` com fator do cadastro,
      com fator confirmado na compra (precedência sobre o cadastrado), sem fator (regressão), e
      piso de decremento em 1 pacote; teste de componente/tela confirmando que o botão "-" fica
      desabilitado em 1 pacote e que "+" nunca produz uma quantidade que não seja múltiplo do
      fator

## 9. QA — integração, regressão e E2E

- [x] 9.1 Rodar `npm run verificar` (fronteiras + lint + typecheck) e resolver qualquer violação
      introduzida por esta change (não confundir com os erros de roteamento pré-existentes já
      documentados em outras changes) — fronteiras OK, lint sem erros, os únicos erros de
      typecheck restantes são os 18 pré-existentes de tipagem de rota do Expo Router (mesmos já
      documentados nas changes reabertas, nenhum introduzido por esta)
- [x] 9.2 Rodar `npm test` completo (domain + app) e confirmar suíte 100% verde — 1092/1092
- [x] 9.3 Escrever e rodar cenário Maestro E2E cobrindo a jornada completa: cadastrar produto com
      fator de conversão → ver "compre 1 pacote (dá para 18)" na lista → iniciar compra → marcar
      item informando tamanho de pacote diferente do cadastrado e valor total pago → fechar
      compra → confirmar que o estoque final e o preço de referência refletem o fluxo, e que o
      fator cadastrado no produto não mudou (executado nesta sessão de QA/E2E em
      `emulator-5554`, `.maestro/conversao-unidade-de-compra-jornada-completa.yaml` — verde: item
      com fator 6/R$18,00, necessária 13 → lista exibe "compre 3 pacotes"/"(dá para 18)" →
      ajuste detalhado no Modo Compra com 2 pacotes de 8 un/R$24,00 (tamanho diferente do
      cadastrado) → fechamento repõe 16 un (estoque final "16 de 13 un, Cheio") → cadastro do
      produto confirmado com fator ainda 6, "Sim" selecionado. ACHADO (registrar em
      `/opsx:update` antes de qualquer ajuste de código): ao resolver a divergência de preço no
      fechamento, o botão "Manter preços salvos" em `app/compra/[id].tsx` não mantém o preço —
      ele chama `setPrecosSelecionados(new Set())` e na mesma função síncrona já invoca
      `confirmarRevisao()`, que lê `precosSelecionados` do closure de render (ainda com o Set
      pré-populado com todos os produtos divergentes, setado ao abrir o painel); o `setState`
      não teve tempo de propagar antes da leitura, então "Manter" se comporta como "Atualizar
      todos". Confirmado via leitura direta do SQLite do dispositivo: fator/valor de embalagem
      permanecem intactos (6/1800), mas `produto.valor_unitario` foi de 300 para 150 mesmo
      escolhendo "Manter". Não é específico de produto com fator — mesma função serve produtos
      sem embalagem; bug pré-existente na tela, só evidenciado agora pela derivação de preço via
      pacotes. Nenhum código de produção foi alterado nesta sessão)
- [x] 9.4 Escrever e rodar cenário Maestro E2E cobrindo produto sem fator de conversão
      (regressão): fluxo de compra continua idêntico ao comportamento anterior à esta change
      (executado nesta sessão, `.maestro/conversao-unidade-de-compra-sem-fator-regressao.yaml` —
      verde na primeira execução limpa: cadastro com chip "Não" (default), sheet de ajuste com
      "Quantidade (un)"/"Preço pago (opcional)" e sem nenhum campo de pacote, fechamento repõe
      3 un — comportamento idêntico ao pré-existente)
- [x] 9.5 Confirmar visualmente (screenshot) nos dois temas (Despensa e Porcelana) que os campos
      novos e o texto de excedente seguem os tokens de `presentation/theme/tokens.ts`, sem hex
      literal (executado nesta sessão, `.maestro/conversao-unidade-de-compra-screenshots-temas.yaml`
      — 6 screenshots capturados (formulário, lista com excedente, sheet de ajuste × 2 temas);
      inspeção visual confirma paleta consistente com os tokens em ambos os temas, sem cor
      estranha/hardcoded nos componentes novos)

## 10. Correção de bug encontrado no E2E (registrado por `/opsx:update` a partir do achado da task 9.3)

- [x] 10.1 Corrigir `app/compra/[id].tsx`: o botão "Manter preços salvos" da revisão de
      divergência de preço no fechamento de compra chama `setPrecosSelecionados(new Set())` e,
      na mesma função síncrona, já invoca `confirmarRevisao()` — que lê `precosSelecionados` do
      closure de render, ainda populado com todos os produtos divergentes (o `setState` não
      propaga antes dessa leitura). Resultado: "Manter" se comporta como "Atualizar todos",
      sobrescrevendo `produto.valorUnitario` mesmo quando o usuário pediu para manter o valor
      antigo. Não é específico de produto com fator (mesma função atende qualquer produto), mas
      bloqueia esta change porque `regras-de-compra`/`conversao-de-embalagem` reaproveitam
      exatamente esse fluxo para a divergência de preço derivada de pacotes (`design.md`,
      decisão "Preço pago por unidade deságua no fluxo de revisão existente"). Correção de raiz:
      passar o conjunto de seleção final diretamente para `confirmarRevisao` (ex.:
      `confirmarRevisao(new Set())`) em vez de depender do estado React ainda não propagado —
      nunca ler `precosSelecionados` do closure na mesma função que acabou de chamar seu setter.
- [x] 10.2 Provar a correção com o teste do cenário do bug: em `app/compra/[id].test.tsx`,
      renomeado o teste `"Manter preços salvos"` para asserir explicitamente
      `responderAtualizarPreco` chamado com `false` (antes só verificava que `finalizar` era
      chamado, sem checar o argumento — por isso não pegava a regressão). Introduzido
      `mockResponderAtualizarPreco` (jest.fn) no lugar do stub `async () => {}` para permitir a
      asserção.
- [x] 10.3 Casos de borda cobertos no mesmo describe: "Atualizar N" agora asserido com `true`;
      novo teste com dois itens divergentes (um deles produto com fator de conversão de
      embalagem) confirma que "Manter" preserva ambos; teste existente de "Escolher quais
      atualizar" (seleção individual) passou a asserir `true`/`false` por item. Suíte do arquivo:
      9/9 testes do describe `revisão agrupada de preço no fechamento` verdes.
- [x] 10.4 Re-rodado `npm test` completo (1117/1117 verde, +1 teste novo de 10.3) e
      `npm run verificar` (fronteiras OK, lint sem erros, mesmos 18 erros pré-existentes de rota).
      Confirmado end-to-end na sessão seguinte de `/opsx:test`: re-executado
      `.maestro/conversao-unidade-de-compra-jornada-completa.yaml` em `emulator-5554` (verde) e
      inspecionado o SQLite do dispositivo diretamente — o produto criado nesta execução (UUID v7
      mais recente) ficou com `valor_unitario = 300` após "Manter preços salvos" (preço de
      referência do pacote, 18/6), não `150` (preço derivado da compra real, 24/16), confirmando
      que a correção da task 10.1 funciona no app real, não só nos testes. Execuções anteriores
      à correção (UUIDs mais antigos, mesmo nome de produto residual no dispositivo) mostravam
      `150`, evidenciando o bug antes do fix.
