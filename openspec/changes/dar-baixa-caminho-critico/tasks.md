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

- [ ] 3.1 Converter a altura do preenchimento em valor animado executado na thread de interface
- [ ] 3.2 Implementar a descida com física de mola de amortecimento 18, em cerca de 320 milissegundos
- [ ] 3.3 Declarar respeito à preferência de redução de movimento do sistema na própria animação
- [ ] 3.4 Fazer a mola redirecionar para o valor-alvo mais recente em vez de reiniciar, para toques rápidos sucessivos
- [ ] 3.5 Garantir que apenas o item alterado anima, e que nenhum item anima por rolagem ou por reordenação
- [ ] 3.6 Implementar a troca dos números em esmaecimento cruzado curto, sem deslizamento e sem contagem progressiva
- [ ] 3.7 Verificar no aparelho que registrar consumo durante a rolagem não causa engasgo em nenhuma das duas

## 4. Teclado de quantidade

- [ ] 4.1 Implementar `TecladoQuantidade` como painel inferior com um único campo numérico e a unidade do item fixa ao lado
- [ ] 4.2 Abrir o painel com o campo já em foco e o teclado numérico do sistema visível
- [ ] 4.3 Implementar as duas ações de registrar consumo e registrar reposição, fechando o painel ao salvar
- [ ] 4.4 Aceitar valor decimal quando a unidade for divisível
- [ ] 4.5 Garantir que fechar sem confirmar não altera nada
- [ ] 4.6 Adicionar as mesmas duas ações na tela de detalhe do produto, abaixo da quantidade, como caminho visível alternativo ao toque longo
- [ ] 4.7 Confirmar que o efeito pelo detalhe é idêntico ao efeito pela lista

## 5. Desfazer

- [ ] 5.1 Implementar `ToastDesfazer` com janela de dez segundos e barra fina de tempo restante
- [ ] 5.2 Fazer a confirmação nomear o item e a quantidade registrada, com o mesmo verbo da ação
- [ ] 5.3 Vincular a ação de desfazer ao **identificador do movimento** descrito na confirmação, e não ao último movimento gravado
- [ ] 5.4 Aplicar a política de substituição: uma nova confirmação cancela a anterior, sem empilhar
- [ ] 5.5 Garantir que a confirmação não bloqueia a interação com a lista
- [ ] 5.6 Escrever teste com três registros em sequência confirmando que o desfazer reverte o registro descrito na confirmação visível
- [ ] 5.7 Escrever teste de desfazer de consumo que zerou o item, confirmando que a quantidade volta ao valor real anterior e não à quantidade solicitada
- [ ] 5.8 Confirmar que o movimento original permanece no banco após desfazer

## 6. Casos de borda

- [ ] 6.1 Implementar o aviso de item acabado quando a quantidade chega a zero por registro de consumo
- [ ] 6.2 Confirmar que consumo maior que o saldo fixa em zero e conclui com sucesso
- [ ] 6.3 Implementar a mensagem de falha de gravação com a ação de tentar novamente, sem alterar a quantidade
- [ ] 6.4 Confirmar que sair da tela durante a animação preserva o registro e não gera erro
- [ ] 6.5 Verificar que o fluxo completo funciona com o aparelho sem conexão

## 7. Conformidade de movimento e vocabulário

- [ ] 7.1 Revisar todo o app confirmando ausência de animação de entrada de tela, aparecimento em cascata, esqueleto cintilante e contagem progressiva
- [ ] 7.2 Verificar no aparelho, com redução de movimento ligada, que o nível muda em esmaecimento curto e o retorno tátil permanece
- [ ] 7.3 Revisar todos os textos deste fluxo confirmando o vocabulário de usuário do começo ao fim, sem termos de sistema
- [ ] 7.4 Confirmar que a persistência não aguarda o término de nenhuma animação

## 8. Medição do KPI

- [ ] 8.1 Cronometrar em aparelho real, com o app frio e uma despensa de volume realista, o percurso de abrir o app e registrar o consumo de um item
- [ ] 8.2 Contar os toques do percurso e confirmar o máximo de três
- [ ] 8.3 Medir separadamente o tempo de abertura fria e o tempo do gesto, para saber qual domina
- [ ] 8.4 Registrar os números medidos no repositório
- [ ] 8.5 Se a meta de dez segundos não for atingida, otimizar a etapa dominante antes de encerrar a change

## 9. Documentos

- [ ] 9.1 Verificar em uso real se a reordenação imediata do item que muda de estado atrapalha registros sucessivos, e registrar a conclusão
- [ ] 9.2 Confirmar em uso real a intensidade do retorno tátil em uso repetido
