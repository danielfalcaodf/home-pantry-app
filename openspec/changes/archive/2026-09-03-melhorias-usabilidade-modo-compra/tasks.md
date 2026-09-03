## 1. Roteiros e testes antes da implementação (TDD)

- [x] 1.1 Escrever testes de domínio/aplicação para a transição atômica de compra aberta: continuar preserva rascunho; recomeçar cancela a anterior e materializa a Lista atual; falha não deixa duas compras abertas nem perde rascunho indevidamente.
- [x] 1.2 Escrever testes de `useModoCompra` para ajuste rápido antes/depois de marcar, limites de unidade indivisível, recálculo de total e preservação do ajuste detalhado/preço.
- [x] 1.3 Escrever testes de aplicação/domínio para identificar somente divergências de itens marcados, selecionar todos/nenhum/subconjunto, excluir avulsos e primeiro preço, e preservar atomicidade no fechamento.
- [x] 1.4 Escrever testes RNTL para faixa de compra em andamento, painel continuar/recomeçar, confirmação de descarte, controles +/− acessíveis e revisão agrupada de preços sem chips inline.
- [x] 1.5 Criar fluxos Maestro da jornada completa: retomar compra aberta, descartar e iniciar lista atualizada, aumentar quantidade em atacado e fechar escolhendo preços de referência; revisar/substituir o flow pendente da change 3 que pressupõe o fluxo antigo.

## 2. Compra aberta explícita e nova lista atualizada

- [x] 2.1 Expor à Lista o resumo da compra aberta necessário para faixa de progresso e entrada explícita, respeitando ports, camada application e reatividade do banco.
- [x] 2.2 Implementar a faixa persistente e o painel de decisão na Lista com ações acessíveis para continuar, começar nova lista e cancelar.
- [x] 2.3 Implementar a confirmação de descarte quando houver progresso ou ajustes e o caso de uso transacional cancelar-aberta-e-iniciar-nova, mantendo a unicidade da compra aberta.
- [x] 2.4 Conectar a navegação para a compra continuada ou a nova compra e garantir que a Lista corrente seja materializada somente ao recomeçar.

## 3. Ajuste rápido de quantidade no Modo Compra

- [x] 3.1 Definir e testar na camada de domínio/application o passo rápido por unidade e seus limites, sem valores `REAL`/`FLOAT` e sem duplicar regra na apresentação.
- [x] 3.2 Reutilizar `StepperConsumo` e `BotaoReporRapido` na linha `ItemCompra`, com rótulos de acessibilidade, háptico e layout responsivo para tela estreita e fonte ampliada.
- [x] 3.3 Conectar os controles ao ajuste persistido de `quantidadeComprada` sem acionar marcação/desmarcação e manter `SheetAjusteCompra` para quantidade exata e preço pago.
- [x] 3.4 Remover ou reposicionar a affordance antiga sem deixar gesto invisível como único caminho para o ajuste detalhado.

## 4. Revisão agrupada de preço no fechamento

- [x] 4.1 Remover a pergunta/chips inline de atualização de preço em `ItemCompra` e limpar decisão pendente ao desmarcar o item.
- [x] 4.2 Expor ao fechamento a lista de divergências marcadas com preço salvo/pago e criar `PainelInferior` de revisão com atualizar todos, manter salvos e escolher exceções.
- [x] 4.3 Persistir as escolhas da revisão antes do fechamento e executar a transação existente apenas após confirmação; cancelar a revisão preserva o rascunho aberto.
- [x] 4.4 Tratar mensagens de primeiro preço, avulsos, nenhum preço divergente e falha de fechamento, mantendo vocabulário de produto e acessibilidade modal.

## 5. Verificação e regressão

- [x] 5.1 Rodar os testes TDD criados nas tarefas 1.1–1.4 e corrigir implementação até todos passarem.
- [x] 5.2 Executar testes de integração com SQLite em memória para cancelamento+abertura, persistência de quantidade e fechamento atômico com subconjunto de preços.
- [x] 5.3 Executar os fluxos Maestro da tarefa 1.5 em development build Android, incluindo tela estreita/fonte ampliada quando disponível, e registrar screenshots dos estados decisivos.
- [x] 5.4 Rodar `npm test`, `npm run verificar` e o fluxo completo `/opsx:test`; registrar resultados e resolver regressões antes de arquivar.
