## 1. Consultas de valores

- [x] 1.1 Implementar no repositório a consulta do valor bruto do estoque, somando quantidade atual por valor unitário sobre produtos ativos e não removidos, nomeando o retorno como bruto
- [x] 1.2 Confirmar que a consulta **não** divide por mil nem aplica qualquer conversão de unidade
- [x] 1.3 Criar `src/application/resumo/use-resumo-valores.ts` aplicando a função única de conversão do domínio sobre o valor bruto
- [x] 1.4 Calcular o valor da lista somando os custos de reposição, com a quantidade a comprar já arredondada pela regra de domínio
- [x] 1.5 Calcular as contagens por estado e a contagem de itens sem preço cadastrado
- [x] 1.6 Escrever teste de aceitação com despensa conhecida: dois itens de valores dados produzem o total exato esperado
- [x] 1.7 Escrever teste confirmando que produtos removidos e produtos sem preço não invalidam o total

## 2. Tela de resumo

- [x] 2.1 Implementar `app/(tabs)/resumo.tsx` com o título de tela no papel de display
- [x] 2.2 Exibir o valor do estoque e o valor da lista como dois blocos distintos, com rótulos em linguagem de usuário
- [x] 2.3 Confirmar que os dois valores nunca são somados em um total único
- [x] 2.4 Usar tipografia de destaque dentro do limite máximo da escala, com família monoespaçada e figuras tabulares
- [x] 2.5 Exibir as contagens por estado e a contagem de itens sem preço, indicando que os valores são parciais
- [x] 2.6 Ligar cada contagem de estado à despensa já filtrada por aquele estado
- [x] 2.7 Confirmar que os valores trocam diretamente, sem animação de contagem progressiva
- [x] 2.8 Confirmar que a aba Resumo deixou de ser marcador na barra de abas

## 3. Gasto mensal

- [x] 3.1 Implementar a consulta de gasto por mês sobre compras finalizadas dos últimos doze meses, agregando no fuso horário local
- [x] 3.2 Retornar por mês o total pago e a quantidade de compras fechadas
- [x] 3.3 Excluir compras abertas e canceladas da agregação
- [x] 3.4 Contar compras finalizadas com total zero na quantidade do mês, contribuindo com zero ao total
- [x] 3.5 Exibir os meses do mais recente para o mais antigo, com valores em família monoespaçada
- [x] 3.6 Definir e aplicar o tratamento consistente para meses sem compra, exibindo-os de forma discreta
- [x] 3.7 Implementar o estado vazio afirmativo para quando nenhuma compra tiver sido fechada
- [x] 3.8 Escrever teste com compra fechada perto da meia-noite do último dia do mês, confirmando que ela cai no mês correto
- [x] 3.9 Escrever teste confirmando que compras abertas e canceladas não entram no gasto

## 4. Histórico de compras

- [x] 4.1 Implementar `app/compra/historico.tsx` listando compras finalizadas da mais recente para a mais antiga
- [x] 4.2 Exibir em cada linha a data de finalização, a quantidade de itens comprados e o total pago
- [x] 4.3 Distinguir visualmente compras canceladas, sem exibir seu valor como gasto
- [x] 4.4 Implementar a paginação por data, com carga inicial limitada e continuação por rolagem
- [x] 4.5 Confirmar que a consulta de continuação usa a data da última compra, e não deslocamento numérico
- [x] 4.6 Ligar o acesso ao histórico a partir da tela de resumo

## 5. Detalhe da compra

- [x] 5.1 Implementar a tela de detalhe de uma compra finalizada, listando os itens com nome, quantidade comprada e valor pago por unidade
- [x] 5.2 Carregar os itens com junção externa em consulta única, sem consultas repetidas por item
- [x] 5.3 Identificar itens não comprados e itens avulsos
- [x] 5.4 Tratar o caso de produto removido após a compra, sem quebrar a tela
- [x] 5.5 Não oferecer nenhuma ação de editar itens ou reabrir a compra
- [x] 5.6 Escrever teste de contagem de consultas no carregamento do detalhe
- [x] 5.7 Escrever teste com produto removido após a compra, confirmando que o item continua aparecendo

## 6. Conformidade

- [x] 6.1 Executar lint, typecheck e verificação de fronteiras
- [x] 6.2 Confirmar que nenhuma coluna do schema armazena valor de estoque, valor de lista ou gasto agregado
- [x] 6.3 Confirmar que a tela de resumo não realiza nenhuma escrita no banco
- [x] 6.4 Confirmar que nenhuma consulta desta change replica conversão de unidade ou arredondamento do domínio
- [x] 6.5 Confirmar que nenhum literal de cor foi introduzido fora dos tokens
- [x] 6.6 Revisar os textos confirmando vocabulário de usuário, sem termos de sistema
- [ ] 6.7 Verificar as telas com escala de fonte do sistema em 200 por cento
- [ ] 6.8 Confirmar com o usuário a decisão em aberto do PRD sobre exibir os dois valores ou apenas um
