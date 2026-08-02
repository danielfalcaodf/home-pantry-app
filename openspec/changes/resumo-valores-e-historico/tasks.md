## 1. Consultas de valores

- [ ] 1.1 Implementar no repositório a consulta do valor bruto do estoque, somando quantidade atual por valor unitário sobre produtos ativos e não removidos, nomeando o retorno como bruto
- [ ] 1.2 Confirmar que a consulta **não** divide por mil nem aplica qualquer conversão de unidade
- [ ] 1.3 Criar `src/application/resumo/use-resumo-valores.ts` aplicando a função única de conversão do domínio sobre o valor bruto
- [ ] 1.4 Calcular o valor da lista somando os custos de reposição, com a quantidade a comprar já arredondada pela regra de domínio
- [ ] 1.5 Calcular as contagens por estado e a contagem de itens sem preço cadastrado
- [ ] 1.6 Escrever teste de aceitação com despensa conhecida: dois itens de valores dados produzem o total exato esperado
- [ ] 1.7 Escrever teste confirmando que produtos removidos e produtos sem preço não invalidam o total

## 2. Tela de resumo

- [ ] 2.1 Implementar `app/(tabs)/resumo.tsx` com o título de tela no papel de display
- [ ] 2.2 Exibir o valor do estoque e o valor da lista como dois blocos distintos, com rótulos em linguagem de usuário
- [ ] 2.3 Confirmar que os dois valores nunca são somados em um total único
- [ ] 2.4 Usar tipografia de destaque dentro do limite máximo da escala, com família monoespaçada e figuras tabulares
- [ ] 2.5 Exibir as contagens por estado e a contagem de itens sem preço, indicando que os valores são parciais
- [ ] 2.6 Ligar cada contagem de estado à despensa já filtrada por aquele estado
- [ ] 2.7 Confirmar que os valores trocam diretamente, sem animação de contagem progressiva
- [ ] 2.8 Confirmar que a aba Resumo deixou de ser marcador na barra de abas

## 3. Gasto mensal

- [ ] 3.1 Implementar a consulta de gasto por mês sobre compras finalizadas dos últimos doze meses, agregando no fuso horário local
- [ ] 3.2 Retornar por mês o total pago e a quantidade de compras fechadas
- [ ] 3.3 Excluir compras abertas e canceladas da agregação
- [ ] 3.4 Contar compras finalizadas com total zero na quantidade do mês, contribuindo com zero ao total
- [ ] 3.5 Exibir os meses do mais recente para o mais antigo, com valores em família monoespaçada
- [ ] 3.6 Definir e aplicar o tratamento consistente para meses sem compra, exibindo-os de forma discreta
- [ ] 3.7 Implementar o estado vazio afirmativo para quando nenhuma compra tiver sido fechada
- [ ] 3.8 Escrever teste com compra fechada perto da meia-noite do último dia do mês, confirmando que ela cai no mês correto
- [ ] 3.9 Escrever teste confirmando que compras abertas e canceladas não entram no gasto

## 4. Histórico de compras

- [ ] 4.1 Implementar `app/compra/historico.tsx` listando compras finalizadas da mais recente para a mais antiga
- [ ] 4.2 Exibir em cada linha a data de finalização, a quantidade de itens comprados e o total pago
- [ ] 4.3 Distinguir visualmente compras canceladas, sem exibir seu valor como gasto
- [ ] 4.4 Implementar a paginação por data, com carga inicial limitada e continuação por rolagem
- [ ] 4.5 Confirmar que a consulta de continuação usa a data da última compra, e não deslocamento numérico
- [ ] 4.6 Ligar o acesso ao histórico a partir da tela de resumo

## 5. Detalhe da compra

- [ ] 5.1 Implementar a tela de detalhe de uma compra finalizada, listando os itens com nome, quantidade comprada e valor pago por unidade
- [ ] 5.2 Carregar os itens com junção externa em consulta única, sem consultas repetidas por item
- [ ] 5.3 Identificar itens não comprados e itens avulsos
- [ ] 5.4 Tratar o caso de produto removido após a compra, sem quebrar a tela
- [ ] 5.5 Não oferecer nenhuma ação de editar itens ou reabrir a compra
- [ ] 5.6 Escrever teste de contagem de consultas no carregamento do detalhe
- [ ] 5.7 Escrever teste com produto removido após a compra, confirmando que o item continua aparecendo

## 6. Conformidade

- [ ] 6.1 Executar lint, typecheck e verificação de fronteiras
- [ ] 6.2 Confirmar que nenhuma coluna do schema armazena valor de estoque, valor de lista ou gasto agregado
- [ ] 6.3 Confirmar que a tela de resumo não realiza nenhuma escrita no banco
- [ ] 6.4 Confirmar que nenhuma consulta desta change replica conversão de unidade ou arredondamento do domínio
- [ ] 6.5 Confirmar que nenhum literal de cor foi introduzido fora dos tokens
- [ ] 6.6 Revisar os textos confirmando vocabulário de usuário, sem termos de sistema
- [ ] 6.7 Verificar as telas com escala de fonte do sistema em 200 por cento
- [ ] 6.8 Confirmar com o usuário a decisão em aberto do PRD sobre exibir os dois valores ou apenas um
