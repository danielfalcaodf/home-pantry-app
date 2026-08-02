## 1. Cliente de banco

- [x] 1.1 Criar `src/infrastructure/db/client.ts` abrindo `expo-sqlite` como módulo singleton, com a escuta de alterações habilitada
- [x] 1.2 Executar na abertura os PRAGMAs de journal WAL, chaves estrangeiras ligadas, sincronismo normal e tempo limite de ocupação
- [x] 1.3 Exportar a instância do Drizzle vinculada ao schema
- [x] 1.4 Escrever teste que consulta o PRAGMA de chaves estrangeiras e falha se ele não estiver ligado
- [x] 1.5 Escrever teste que tenta inserir uma linha com referência inexistente e espera falha por restrição de chave estrangeira

## 2. Schema Drizzle

- [x] 2.1 Criar `src/infrastructure/db/schema.ts` com as tabelas `casa` e `usuario`, incluindo a restrição de perfil
- [x] 2.2 Adicionar a tabela `produto` com todas as colunas do documento de banco, incluindo `observacao`, `deletado_em` e situação de sincronização
- [x] 2.3 Adicionar as restrições de `produto`: quantidade atual não negativa, quantidade necessária positiva, valor unitário não negativo, nome não vazio e unidade dentro do conjunto suportado
- [x] 2.4 Adicionar a tabela `movimento_estoque` com `casa_id`, `compra_id` **com referência a compra**, e as restrições de variação não nula e de coerência de sinal
- [x] 2.5 Adicionar as tabelas `compra` e `compra_item` com as restrições de situação finalizada exigindo data, item sendo de produto ou avulso, e item marcado exigindo quantidade comprada
- [x] 2.6 Declarar os índices do MVP: unicidade de nome por casa ignorando caixa e removidos, parcial de faltantes, categoria para autocompletar, histórico por produto **em ordem decrescente de data**, histórico por casa em ordem decrescente, unicidade de compra aberta, e itens por compra
- [x] 2.7 Confirmar que nenhum índice sobre situação de sincronização foi declarado

## 3. Migration inicial

- [x] 3.1 Criar `drizzle.config.ts` com dialeto SQLite e driver do Expo
- [x] 3.2 Gerar a migration `0000_init` e revisar integralmente o SQL produzido
- [x] 3.3 Completar manualmente no SQL gerado tudo que o gerador não emitir: restrições, índices parciais, ordenação decrescente e agrupamento insensível a caixa
- [x] 3.4 Escrever teste que aplica todas as migrations sobre um banco vazio e compara o schema resultante com o declarado
- [x] 3.5 Escrever teste que tenta violar cada restrição declarada e confirma que o banco rejeita
- [x] 3.6 Escrever teste do índice parcial: inspecionar o plano de execução da consulta de faltantes e falhar se houver varredura completa

## 4. Aplicação de migrations na abertura

- [ ] 4.1 Ligar a aplicação de migrations no layout raiz, antes de qualquer tela de dados renderizar
- [ ] 4.2 Renderizar tela de erro explícita quando a migration falhar, sem prosseguir para a interface normal
- [ ] 4.3 Renderizar tela de carregamento enquanto as migrations são aplicadas
- [ ] 4.4 Implementar a cópia de segurança do arquivo de banco antes de aplicar migration pendente, mantendo as duas cópias mais recentes
- [ ] 4.5 Registrar no guia do repositório a regra de nunca editar migration já publicada

## 5. Contratos de persistência

- [x] 5.1 Criar `src/ports/produto.repository.ts` com as operações de criação, edição, remoção lógica, consulta da despensa, consulta de faltantes, busca por nome e registro de consumo
- [x] 5.2 Criar `src/ports/movimento.repository.ts` **apenas** com inserção e consultas — sem nenhum método de atualização ou remoção
- [x] 5.3 Criar `src/ports/compra.repository.ts` com abertura de compra, gestão de itens, marcação e finalização
- [x] 5.4 Confirmar que nenhuma interface expõe tipo específico do Drizzle ou do SQLite na assinatura

## 6. Repositório de produto

- [ ] 6.1 Implementar `src/infrastructure/repositories/sqlite-produto.repository.ts` com criação, edição e remoção lógica, gravando a categoria já normalizada pelo domínio
- [ ] 6.2 Implementar a consulta da despensa com colunas explícitas, ordenação por estado e alfabética dentro do grupo, excluindo inativos e removidos
- [ ] 6.3 Implementar a consulta de faltantes retornando diferença bruta e produto bruto, **sem** arredondar nem converter — nomear os campos como brutos
- [ ] 6.4 Implementar a consulta de categorias distintas para autocompletar
- [ ] 6.5 Implementar `darBaixa` em transação única: atualizar a quantidade com proteção de não-negativo e inserir o movimento lendo o saldo resultante do banco após a atualização
- [ ] 6.6 Marcar a situação de sincronização do produto como pendente em toda escrita que altere a quantidade
- [ ] 6.7 Escrever teste da transação de baixa: quantidade atualizada e movimento gravado juntos
- [ ] 6.8 Escrever teste de rollback: falha na inserção do movimento deixa a quantidade inalterada e nenhum movimento gravado
- [ ] 6.9 Escrever teste de baixa maior que o saldo: quantidade final zero, operação bem-sucedida
- [ ] 6.10 Escrever teste de unicidade de nome, incluindo o caso de reutilizar nome de produto removido logicamente

## 7. Repositório de movimento

- [ ] 7.1 Implementar `sqlite-movimento.repository.ts` com inserção e as consultas de histórico por produto e por casa, ambas do mais recente para o mais antigo
- [ ] 7.2 Implementar a inserção do movimento inverso para desfazer, sem tocar no movimento original
- [ ] 7.3 Implementar a consulta de reconciliação comparando a quantidade materializada com a soma das variações dos movimentos
- [ ] 7.4 Escrever teste de desfazer: movimento original permanece, novo movimento de sinal oposto é inserido
- [ ] 7.5 Escrever teste de reconciliação retornando zero linhas em um banco coerente
- [ ] 7.6 Escrever teste de reconciliação detectando divergência quando a quantidade é adulterada fora da transação

## 8. Repositório de compra

- [ ] 8.1 Implementar `sqlite-compra.repository.ts` com abertura de compra, respeitando o limite de no máximo uma compra aberta por casa
- [ ] 8.2 Implementar adição, edição, ordenação e remoção de itens, incluindo itens avulsos sem produto associado
- [ ] 8.3 Implementar a consulta de itens da compra com junção externa trazendo os dados do produto em uma única consulta
- [ ] 8.4 Implementar `finalizar` em transação única aplicando reposições, movimentos, atualizações de preço confirmadas e a mudança de situação com o total pago
- [ ] 8.5 Escrever teste de finalização bem-sucedida com três itens marcados
- [ ] 8.6 Escrever teste de falha no meio: nenhuma quantidade alterada, nenhum movimento gravado, compra continua aberta
- [ ] 8.7 Escrever teste confirmando que itens não marcados não geram reposição nem movimento
- [ ] 8.8 Escrever teste confirmando que item avulso não gera reposição e que ele não desaparece da consulta de itens
- [ ] 8.9 Escrever teste de contagem de consultas na carga de itens, garantindo consulta única

## 9. Dados iniciais

- [ ] 9.1 Criar `src/infrastructure/db/seed.ts` com a criação da casa e do usuário local na primeira abertura, sem duplicar em aberturas seguintes
- [ ] 9.2 Criar o arquivo JSON embarcado com aproximadamente 40 itens comuns de mercado, cada um com nome, categoria e unidade, mais uma quantidade necessária sugerida
- [ ] 9.3 Implementar o método de repositório que insere um subconjunto escolhido da lista base em uma única transação, aplicando a normalização de categoria do domínio
- [ ] 9.4 Confirmar que a lista base **não** é inserida automaticamente na primeira abertura
- [ ] 9.5 Escrever teste de idempotência da criação da casa e do usuário
- [ ] 9.6 Escrever teste de adoção parcial da lista base

## 10. Composição e conformidade

- [ ] 10.1 Criar o ponto de composição único exportando as três implementações tipadas pelas respectivas interfaces
- [ ] 10.2 Confirmar por lint de fronteira que nenhum arquivo fora da infraestrutura importa o cliente de banco ou o schema
- [ ] 10.3 Revisar todas as consultas escritas, confirmando colunas explícitas e ausência de regra de arredondamento ou de conversão de moeda no SQL
- [ ] 10.4 Atualizar `DATABASE-app-estoque-de-casa.md` §7 corrigindo a ordenação decrescente do índice de histórico e a referência de chave estrangeira do identificador de compra no movimento
- [ ] 10.5 Rodar o teste de fumaça no aparelho confirmando que o PRAGMA de chaves estrangeiras está ligado no binding do Expo
