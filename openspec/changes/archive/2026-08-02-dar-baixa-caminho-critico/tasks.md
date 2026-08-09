> **Ponto de parada (2026-08-02).** Seções 1 a 7 implementadas e testadas; a change **não foi arquivada** e a PR **não foi aberta**.
>
> **Retomar pela seção 8 (medição do KPI K4)** — é a razão de esta change existir e a única que ainda pode mudar o código: se os 10s não forem atingidos, a tarefa 8.5 manda otimizar a etapa dominante antes de encerrar.
>
> As tarefas 8.x e 9.x, mais 3.7, 6.5 e 7.2, exigem **aparelho com development build** — a mesma dependência de `eas login` que bloqueia as tarefas 4.3/4.4 da change 1. Nada além disso está pendente no código.

## 1. Casos de uso

- [x] 1.1 Criar `src/application/estoque/use-dar-baixa.ts` chamando a regra de domínio para obter saldo resultante e variação aplicada, e delegando a persistência ao repositório em transação única
- [x] 1.2 Tratar o retorno "nada a gravar" da regra quando o item já está zerado, sem chamar o repositório
- [x] 1.3 Criar `use-repor-pontual.ts` para a reposição sem compra associada
- [x] 1.4 Criar `use-desfazer-movimento.ts` recebendo o identificador do movimento e inserindo o inverso em transação única
- [x] 1.5 Serializar as escritas por item para que toques rápidos sucessivos produzam um registro cada, sem agrupar
- [x] 1.6 Escrever testes dos hooks com repositório falso, cobrindo consumo normal, consumo maior que o saldo, item já zerado e desfazer

## 2. Stepper de consumo

- [x] 2.1 Implementar `StepperConsumo` como círculo de 40 pontos dentro de alvo de 48 por 48, alinhado à direita
- [x] 2.2 Ligar o toque simples ao registro de consumo de uma unidade, sem confirmação, sem navegação e sem indicador de carregamento
- [x] 2.3 Disparar o retorno tátil leve no instante do toque
- [x] 2.4 Implementar a contração do círculo para 0,92 e retorno, em cerca de 90 milissegundos
- [x] 2.5 Manter o botão com opacidade reduzida e sem função quando o item está zerado
- [x] 2.6 Ligar o toque longo à abertura do painel de quantidade
- [x] 2.7 Definir o rótulo acessível com a ação completa, incluindo nome do produto e unidade

## 3. Animação do nível

- [x] 3.1 Converter a altura do preenchimento em valor animado executado na thread de interface
- [x] 3.2 Implementar a descida com física de mola de amortecimento 18, em cerca de 320 milissegundos
- [x] 3.3 Declarar respeito à preferência de redução de movimento do sistema na própria animação
- [x] 3.4 Fazer a mola redirecionar para o valor-alvo mais recente em vez de reiniciar, para toques rápidos sucessivos
- [x] 3.5 Garantir que apenas o item alterado anima, e que nenhum item anima por rolagem ou por reordenação
- [x] 3.6 Implementar a troca dos números em esmaecimento cruzado curto, sem deslizamento e sem contagem progressiva
- [ ] 3.7 Verificar no aparelho que registrar consumo durante a rolagem não causa engasgo em nenhuma das duas — **bloqueada: exige aparelho. A altura do nível é um shared value do Reanimated, então a mola roda na thread de interface e não disputa com a rolagem**

## 4. Teclado de quantidade

- [x] 4.1 Implementar `TecladoQuantidade` como painel inferior com um único campo numérico e a unidade do item fixa ao lado
- [x] 4.2 Abrir o painel com o campo já em foco e o teclado numérico do sistema visível
- [x] 4.3 Implementar as duas ações de registrar consumo e registrar reposição, fechando o painel ao salvar
- [x] 4.4 Aceitar valor decimal quando a unidade for divisível
- [x] 4.5 Garantir que fechar sem confirmar não altera nada
- [x] 4.6 Adicionar as mesmas duas ações na tela de detalhe do produto, abaixo da quantidade, como caminho visível alternativo ao toque longo
- [x] 4.7 Confirmar que o efeito pelo detalhe é idêntico ao efeito pela lista

## 5. Desfazer

- [x] 5.1 Implementar `ToastDesfazer` com janela de dez segundos e barra fina de tempo restante
- [x] 5.2 Fazer a confirmação nomear o item e a quantidade registrada, com o mesmo verbo da ação
- [x] 5.3 Vincular a ação de desfazer ao **identificador do movimento** descrito na confirmação, e não ao último movimento gravado
- [x] 5.4 Aplicar a política de substituição: uma nova confirmação cancela a anterior, sem empilhar
- [x] 5.5 Garantir que a confirmação não bloqueia a interação com a lista
- [x] 5.6 Escrever teste com três registros em sequência confirmando que o desfazer reverte o registro descrito na confirmação visível
- [x] 5.7 Escrever teste de desfazer de consumo que zerou o item, confirmando que a quantidade volta ao valor real anterior e não à quantidade solicitada
- [x] 5.8 Confirmar que o movimento original permanece no banco após desfazer

## 6. Casos de borda

- [x] 6.1 Implementar o aviso de item acabado quando a quantidade chega a zero por registro de consumo
- [x] 6.2 Confirmar que consumo maior que o saldo fixa em zero e conclui com sucesso
- [x] 6.3 Implementar a mensagem de falha de gravação com a ação de tentar novamente, sem alterar a quantidade
- [x] 6.4 Confirmar que sair da tela durante a animação preserva o registro e não gera erro
- [ ] 6.5 Verificar que o fluxo completo funciona com o aparelho sem conexão — **coberta por construção: não existe caminho de rede no fluxo; tudo é transação SQLite local. Confirmação em aparelho fica com as demais**

## 7. Conformidade de movimento e vocabulário

- [x] 7.1 Revisar todo o app confirmando ausência de animação de entrada de tela, aparecimento em cascata, esqueleto cintilante e contagem progressiva
- [ ] 7.2 Verificar no aparelho, com redução de movimento ligada, que o nível muda em esmaecimento curto e o retorno tátil permanece — **bloqueada: exige aparelho. `ReduceMotion.System` na mola e no fade delega ao sistema; o háptico é disparado fora da animação, então permanece**
- [x] 7.3 Revisar todos os textos deste fluxo confirmando o vocabulário de usuário do começo ao fim, sem termos de sistema
- [x] 7.4 Confirmar que a persistência não aguarda o término de nenhuma animação

## 8. Medição do KPI

- [ ] 8.1 Cronometrar em aparelho real, com o app frio e uma despensa de volume realista, o percurso de abrir o app e registrar o consumo de um item — **bloqueada: exige aparelho. Sem `eas login` + build instalado não há como medir tempo de abertura fria nem o do gesto neste ambiente (sem emulador Android/iOS disponível; expo-sqlite web é alpha/instável e expo-haptics não roda em web, então uma medição via `expo start --web` não seria uma medição válida do K4)**
- [x] 8.2 Contar os toques do percurso e confirmar o máximo de três — verificado por leitura de código: a Despensa é a rota inicial (`app/(tabs)/_layout.tsx`, sem passo de navegação antes dela) e o `StepperConsumo` (`src/presentation/components/stepper-consumo.tsx`) registra o consumo num único `onPress`, sem confirmação, modal ou segunda tela (`src/application/estoque/use-dar-baixa.ts`). Total: 1 toque do app aberto até o toast "Anotado"
- [ ] 8.3 Medir separadamente o tempo de abertura fria e o tempo do gesto, para saber qual domina — **bloqueada: exige aparelho. Mesma limitação de ambiente da 8.1**
- [ ] 8.4 Registrar os números medidos no repositório — **bloqueada: depende dos números reais de 8.1/8.3, que exigem aparelho**
- [ ] 8.5 Se a meta de dez segundos não for atingida, otimizar a etapa dominante antes de encerrar a change — **bloqueada: depende do resultado de 8.1/8.3 em aparelho real**

## 9. Documentos

- [ ] 9.1 Verificar em uso real se a reordenação imediata do item que muda de estado atrapalha registros sucessivos, e registrar a conclusão — **bloqueada: exige aparelho. Mesma limitação de ambiente da 8.1**
- [ ] 9.2 Confirmar em uso real a intensidade do retorno tátil em uso repetido — **bloqueada: exige aparelho. expo-haptics não tem implementação web (Android usa `Vibrator`, iOS usa `UIImpactFeedbackGenerator`); sem device físico não há retorno tátil real para avaliar**
