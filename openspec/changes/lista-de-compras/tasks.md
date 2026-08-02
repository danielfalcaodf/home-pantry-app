## 1. Composição da lista

- [x] 1.1 Criar `src/application/lista/use-lista-compras.ts` compondo a consulta de faltantes com os itens avulsos da compra aberta
- [x] 1.2 Aplicar as regras de domínio de quantidade a comprar e custo estimado sobre os valores brutos vindos da consulta
- [x] 1.3 Subtrair da lista os itens marcados como excluídos da compra aberta
- [x] 1.4 Confirmar que a consulta de faltantes não contém nenhuma expressão de arredondamento por unidade
- [x] 1.5 Confirmar que nenhuma tabela representa a lista de compras no schema
- [x] 1.6 Escrever testes do hook com repositório falso cobrindo item entrando e saindo da lista automaticamente

## 2. Tela da lista

- [x] 2.1 Implementar `app/(tabs)/lista.tsx` com o título de tela e a alternância de agrupamento no cabeçalho
- [x] 2.2 Implementar `ItemLista` com nome, quantidade a comprar com unidade, e custo alinhado à direita no papel tipográfico de dado
- [x] 2.3 Implementar a visão agrupada por categoria, com cabeçalhos, e a visão contínua ordenada por nome
- [x] 2.4 Persistir a preferência de agrupamento na tabela de configuração
- [x] 2.5 Implementar o estado vazio afirmativo para quando nada estiver faltando, mantendo a ação de adicionar avulso acessível
- [x] 2.6 Confirmar que a lista reflete alterações da despensa sem recarregamento manual

## 3. Custo e rodapé

- [x] 3.1 Implementar `RodapeTotal` com a contagem de itens e o total estimado, em família monoespaçada
- [x] 3.2 Exibir a contagem de itens sem preço cadastrado ao lado do total
- [x] 3.3 Marcar visualmente cada item sem preço, no lugar onde o valor apareceria
- [x] 3.4 Garantir que o custo de cada item é calculado sobre a quantidade **já arredondada**, e não sobre a diferença bruta
- [x] 3.5 Incluir os itens avulsos com preço no total
- [x] 3.6 Rotular o total de forma inequívoca como estimativa da compra, distinta do valor do estoque
- [x] 3.7 Confirmar que o total muda diretamente, sem animação de contagem progressiva
- [x] 3.8 Escrever teste do total com lista mista de itens com e sem preço, e de lista inteiramente sem preço

## 4. Itens avulsos

- [x] 4.1 Criar `use-adicionar-avulso.ts` criando a compra aberta sob demanda quando ela ainda não existir
- [x] 4.2 Reusar a compra aberta existente em adições subsequentes, sem criar outra
- [x] 4.3 Implementar `SheetAvulso` com nome, unidade, quantidade e preço opcional, exigindo o nome
- [x] 4.4 Assumir quantidade 1 como padrão editável ao adicionar
- [x] 4.5 Identificar visualmente os itens avulsos na lista
- [x] 4.6 Implementar a edição de nome, quantidade, unidade e preço do avulso, com recálculo do total
- [x] 4.7 Implementar a remoção do avulso, mantendo a compra aberta quando ainda houver itens em falta
- [x] 4.8 Escrever teste confirmando que adicionar avulso não cria nenhum produto na despensa
- [x] 4.9 Escrever teste confirmando que nenhuma operação sobre avulso grava movimento de estoque
- [x] 4.10 Escrever teste de unicidade da compra aberta ao adicionar dois avulsos em sequência rápida

## 5. Remover item da lista

- [x] 5.1 Criar `use-remover-item-lista.ts` registrando a exclusão do item na compra aberta, criando-a sob demanda
- [x] 5.2 Confirmar que a remoção não altera a quantidade em estoque nem o cadastro do produto
- [x] 5.3 Implementar a ação de desfazer a remoção na mesma sessão
- [x] 5.4 Escrever teste de reabertura da tela confirmando que o item removido continua fora da lista
- [x] 5.5 Escrever teste de ciclo completo: remover item, fechar a compra, confirmar que ele volta na próxima lista
- [x] 5.6 Se a marcação de exclusão exigir coluna nova, criá-la em migration forward-only nova, sem editar migration publicada

## 6. Exportação em texto

- [x] 6.1 Criar o gerador de texto da lista em `src/presentation/format/`, produzindo nome e quantidade com unidade por linha
- [x] 6.2 Incluir o total estimado ao final do texto
- [x] 6.3 Sinalizar no texto os itens sem preço e refletir no total apenas os itens com preço
- [x] 6.4 Refletir o agrupamento por categoria no texto quando ele estiver ativo
- [x] 6.5 Ligar a exportação à folha de compartilhamento do sistema
- [x] 6.6 Tornar a ação indisponível ou informativa quando a lista estiver vazia
- [x] 6.7 Confirmar que o texto não contém identificadores internos, nomes de campo do banco nem termos de sistema
- [x] 6.8 Escrever testes do gerador de texto cobrindo lista agrupada, lista contínua e lista com itens sem preço

## 7. Conformidade

- [ ] 7.1 Executar lint, typecheck e verificação de fronteiras
- [ ] 7.2 Confirmar que nenhum literal de cor foi introduzido fora dos tokens
- [ ] 7.3 Confirmar que a aba Lista deixou de ser marcador na barra de abas
- [ ] 7.4 Verificar a tela com escala de fonte do sistema em 200 por cento
- [ ] 7.5 Verificar visualmente o alinhamento da coluna de preço com valores de larguras diferentes
