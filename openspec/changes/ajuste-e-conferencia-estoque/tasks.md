## 1. Ajuste de estoque

- [x] 1.1 Criar `src/application/estoque/use-ajustar-estoque.ts` recebendo o **valor final** informado pelo usuário e calculando a variação pela regra de domínio
- [x] 1.2 Delegar a persistência ao repositório em transação única: atualização da quantidade e gravação do movimento de tipo ajuste
- [x] 1.3 Não gravar nada quando o valor informado for igual ao registrado
- [x] 1.4 Rejeitar valor negativo com erro em texto
- [x] 1.5 Implementar o motivo opcional com as sugestões de perda, vencimento e correção, aceitando ausência de motivo
- [x] 1.6 Preservar o tipo ajuste independentemente do sinal da variação
- [x] 1.7 Escrever testes cobrindo ajuste para cima, para baixo, para zero, sem mudança e com valor negativo
- [x] 1.8 Escrever teste de atomicidade: falha na gravação do movimento deixa a quantidade inalterada

## 2. Quantidade editável no detalhe

- [x] 2.1 Tornar a quantidade atual tocável na tela de detalhe, abrindo o caminho de ajuste
- [x] 2.2 Confirmar que a quantidade atual não é editável como campo de formulário comum
- [x] 2.3 Confirmar que alterar a quantidade necessária continua sendo edição de cadastro, sem gravar movimento
- [x] 2.4 Usar linguagem de correção na interface, sem termos de sistema
- [x] 2.5 Escrever teste confirmando que o ajuste pelo detalhe produz o mesmo efeito de qualquer outro caminho

## 3. Modo conferência

- [x] 3.1 Criar `app/conferencia.tsx` com a escolha da categoria a conferir, ou a opção de conferir tudo
- [x] 3.2 Criar `use-conferencia.ts` fornecendo a sequência de itens e a posição do percurso
- [x] 3.3 Apresentar um item por vez, com a quantidade registrada em destaque
- [x] 3.4 Exibir o progresso com quantos itens já foram conferidos de quantos
- [x] 3.5 Implementar o confirmar de um toque, avançando sem gravar nenhum movimento
- [x] 3.6 Implementar a correção informando o valor final, gravando ajuste e avançando, sem diálogo adicional
- [x] 3.7 Incluir itens zerados no percurso, permitindo corrigir para valor maior
- [x] 3.8 Não oferecer criação nem remoção de produto durante o percurso
- [x] 3.9 Guardar a posição do percurso para permitir retomar de onde parou
- [x] 3.10 Informar ao final quantos itens foram corrigidos e quantos estavam corretos
- [x] 3.11 Usar alvos de toque generosos, adequados ao uso rápido
- [x] 3.12 Verificar que a conferência funciona com o aparelho sem conexão — verificado por leitura de código: todo o caminho de escrita usa apenas `produtoRepository`/`configuracaoRepository` (SQLite local), sem nenhuma chamada de rede
- [ ] 3.13 Medir quanto tempo leva conferir trinta itens e registrar o resultado — pendente de aparelho físico (sem emulador Android/iOS neste ambiente, mesma razão das changes 5-9)

## 4. Diagnóstico de integridade

- [x] 4.1 Criar `app/diagnostico.tsx` executando a consulta de reconciliação sob demanda
- [x] 4.2 Listar os produtos divergentes com o valor registrado e o valor calculado pelos movimentos
- [x] 4.3 Confirmar que a verificação não realiza nenhuma escrita — `reconciliar()` é um `SELECT` puro, sem transação de escrita
- [x] 4.4 Implementar a correção individual gravando movimento de ajuste até o valor calculado pelos movimentos
- [x] 4.5 Implementar a correção em bloco em uma única transação, com um movimento de ajuste por produto
- [x] 4.6 Permitir sair sem corrigir, sem alterar nada
- [x] 4.7 Escrever a mensagem afirmativa para o caso sem divergência, e a acionável para o caso com divergência, sem alarme
- [x] 4.8 Ligar o acesso a partir da tela de configurações
- [x] 4.9 Escrever teste de banco coerente retornando zero divergências
- [x] 4.10 Escrever teste com divergência injetada, confirmando detecção, correção e verificação limpa em seguida
- [x] 4.11 Escrever teste de falha injetada na correção em bloco, confirmando que nada foi alterado

## 5. Histórico do produto

- [x] 5.1 Criar `app/produto/[id]/historico.tsx` listando os movimentos do mais recente para o mais antigo
- [x] 5.2 Exibir em cada linha o que aconteceu, a quantidade, a data e o motivo quando houver
- [x] 5.3 Distinguir visualmente consumos, reposições e ajustes
- [x] 5.4 Indicar quando uma reposição veio de uma compra
- [x] 5.5 Usar o papel tipográfico de dado para quantidades e datas
- [x] 5.6 Descrever cada movimento com o mesmo verbo usado no momento da ação, sem termos de sistema
- [x] 5.7 Não oferecer nenhuma ação de editar ou remover movimento
- [x] 5.8 Implementar a paginação por data, carregando um bloco recente e continuando por rolagem
- [x] 5.9 Confirmar que a consulta de continuação usa a data do último item, e não deslocamento numérico
- [x] 5.10 Ligar o resumo do rodapé do detalhe ao histórico completo
- [x] 5.11 Escrever teste de paginação com histórico grande, verificando que a carga inicial é limitada

## 6. Conformidade

- [x] 6.1 Executar lint, typecheck e verificação de fronteiras — `npm run verificar`: verde, zero avisos
- [x] 6.2 Confirmar que nenhum literal de cor foi introduzido fora dos tokens — varredura por `#[0-9A-Fa-f]{3,8}` nos arquivos desta change: zero ocorrências fora de `theme/tokens.ts`
- [x] 6.3 Revisar todos os textos confirmando vocabulário de usuário, sem termos de sistema — varredura por "dar baixa"/"movimento de estoque"/"reposição": só aparecem em comentários de código, nunca em texto de tela
- [x] 6.4 Confirmar que nenhum caminho do app permite alterar quantidade sem gravar movimento — `ProdutoRepository.editar` exclui `quantidadeAtual` do tipo aceito; `ajustar`, `darBaixa`, `repor` e `corrigirTodasDivergencias` sempre gravam o `UPDATE` e o `INSERT` do movimento na mesma transação
- [ ] 6.5 Verificar as telas com escala de fonte do sistema em 200 por cento — pendente de aparelho físico (sem emulador Android/iOS neste ambiente, mesma razão das changes 5-9)
- [x] 6.6 Avaliar se vale exibir há quantos dias foi a última conferência, sem poluir o caminho crítico da despensa — decidido não exibir: a despensa já ganhou um link para a conferência nesta change (task 3.1), e mais um dado no cabeçalho competiria com o caminho crítico de dar baixa; fica como candidato de v1.1 junto da notificação semanal
