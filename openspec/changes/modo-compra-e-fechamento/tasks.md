## 1. Iniciar a compra

- [x] 1.1 Adicionar na tela da lista a ação de iniciar a compra, com a contagem de itens no rótulo
- [x] 1.2 Criar `src/application/compra/use-iniciar-compra.ts` materializando os itens correntes da lista como itens planejados da compra aberta
- [x] 1.3 Registrar a quantidade planejada **exatamente** como exibida na lista, sem reaplicar o arredondamento
- [x] 1.4 Registrar o valor estimado por unidade em cada item materializado
- [x] 1.5 Não duplicar os itens avulsos, que já pertencem à compra aberta
- [x] 1.6 Escrever teste confirmando que a lista permanece derivada enquanto a compra não é iniciada
- [x] 1.7 Escrever teste confirmando que consumo registrado após iniciar a compra não altera os itens planejados

## 2. Tela do modo compra

- [ ] 2.1 Implementar `app/compra/[id].tsx` como tela única, sem navegação interna
- [ ] 2.2 Ativar a trava de tela acordada enquanto a tela estiver montada, e restaurar o comportamento padrão ao desmontar
- [x] 2.3 Implementar `ItemCompra` com controle de marcação quadrado de 28 pontos dentro de alvo de 48 por 48
- [x] 2.4 Aplicar ao item marcado o nome em cor secundária com risco horizontal, e remover todo o preenchimento da linha
- [x] 2.5 Implementar o desmarcar revertendo a aparência e o total
- [ ] 2.6 Gravar cada marcação imediatamente no item de compra, e não em memória
- [ ] 2.7 Implementar a saída da tela preservando o progresso, informando que a compra continua aberta
- [ ] 2.8 Adicionar a ação de cancelar a compra no menu da tela, com confirmação, registrando a situação cancelada
- [ ] 2.9 Escrever teste de retomada: marcações preservadas ao sair e voltar

## 3. Ajuste de quantidade e preço

- [ ] 3.1 Assumir a quantidade planejada como comprada quando o item é marcado sem ajuste
- [x] 3.2 Implementar o ajuste da quantidade comprada na própria tela ou em painel sobreposto, sem trocar de rota
- [ ] 3.3 Implementar a informação do valor pago por unidade, com recálculo do total corrente
- [ ] 3.4 Permitir marcar sem informar preço pago, contribuindo com zero para o total
- [ ] 3.5 Confirmar que item marcado sempre tem quantidade comprada definida, tornando o estado rejeitado pelo banco inalcançável pela interface

## 4. Preço de referência

- [x] 4.1 Detectar a divergência entre o valor pago e o valor unitário cadastrado, usando a regra de domínio
- [x] 4.2 Oferecer a pergunta de atualizar o preço de referência como controle embutido na linha do item, nunca como diálogo modal
- [x] 4.3 Oferecer o registro do primeiro preço quando o produto tem valor unitário zero
- [x] 4.4 Não perguntar para itens avulsos
- [ ] 4.5 Registrar a resposta no item de compra, sem alterar o produto naquele momento
- [ ] 4.6 Aplicar as atualizações confirmadas somente dentro da transação de fechamento
- [ ] 4.7 Escrever testes cobrindo confirmação, recusa, ausência de resposta e produto sem preço cadastrado
- [ ] 4.8 Escrever teste confirmando que uma falha de fechamento não altera nenhum valor unitário

## 5. Rodapé de acompanhamento

- [x] 5.1 Implementar o rodapé fixo com o contador de itens marcados sobre o total de itens
- [x] 5.2 Exibir o total corrente do que já está marcado, em família monoespaçada
- [x] 5.3 Calcular o total corrente pela mesma função de domínio usada no fechamento
- [x] 5.4 Confirmar que o total troca diretamente, sem contagem progressiva e sem deslocar elementos adjacentes
- [ ] 5.5 Escrever teste comparando o total corrente exibido com o total pago gravado no fechamento

## 6. Fechamento

- [x] 6.1 Criar `use-finalizar-compra.ts` chamando a regra de domínio que calcula todos os efeitos de uma vez
- [x] 6.2 Delegar a aplicação ao repositório em transação única: reposições, movimentos, atualizações de preço confirmadas, situação e total pago
- [x] 6.3 Vincular cada movimento de reposição à compra de origem, registrando usuário, data e hora, variação e quantidade resultante
- [x] 6.4 Garantir que itens avulsos marcados não alteram nenhuma quantidade nem geram movimento
- [x] 6.5 Garantir que itens não marcados não geram reposição nem movimento
- [x] 6.6 Preencher a data de finalização ao mudar a situação para finalizada
- [x] 6.7 Permitir fechar compra sem nenhum item marcado, registrando total zero
- [x] 6.8 Implementar a mensagem de falha preservando as marcações e oferecendo tentar novamente
- [ ] 6.9 Exibir a confirmação informando quantos itens foram repostos, em vocabulário de usuário
- [ ] 6.10 Retornar à despensa com as quantidades atualizadas

## 7. Testes de atomicidade

- [ ] 7.1 Escrever teste de fechamento bem-sucedido com oito itens marcados de quinze
- [ ] 7.2 Escrever teste de falha injetada no processamento de um item intermediário, confirmando que nenhuma quantidade mudou e nenhum movimento foi gravado
- [ ] 7.3 Escrever teste inspecionando o banco após falha, confirmando que não existe produto reposto sem movimento correspondente
- [ ] 7.4 Escrever teste confirmando que itens não marcados voltam à lista quando continuam abaixo do mínimo
- [ ] 7.5 Verificar que o fechamento funciona com o aparelho sem conexão

## 8. Conformidade

- [ ] 8.1 Executar lint, typecheck e verificação de fronteiras
- [ ] 8.2 Confirmar que nenhum literal de cor foi introduzido fora dos tokens
- [ ] 8.3 Revisar todos os textos do fluxo confirmando vocabulário de usuário, sem termos de sistema
- [ ] 8.4 Verificar em uso real, no mercado, se o controle embutido de preço não interrompe o fluxo do corredor
- [ ] 8.5 Verificar que a trava de tela acordada é desativada ao sair da tela
- [ ] 8.6 Verificar a tela com escala de fonte do sistema em 200 por cento
