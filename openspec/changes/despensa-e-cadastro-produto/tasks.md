## 1. Hooks de caso de uso

- [x] 1.1 Criar `src/application/estoque/use-produtos.ts` com consulta reativa da despensa, recebendo o repositório por parâmetro com padrão vindo do ponto de composição
- [x] 1.2 Enriquecer cada produto com estado, fração e rótulo vindos das regras de domínio, antes de entregar à apresentação
- [x] 1.3 Criar `use-cadastrar-produto.ts` chamando a validação de domínio e retornando `Result`
- [x] 1.4 Criar `use-editar-produto.ts` e `use-remover-produto.ts`
- [x] 1.5 Criar `use-categorias.ts` fornecendo as categorias existentes para o autocomplete
- [x] 1.6 Escrever testes dos hooks com repositório falso, confirmando que nenhum importa implementação concreta

## 2. Medidor de linha d'água

- [x] 2.1 Implementar `MedidorNivel` como camada absoluta ancorada na base, com altura proporcional à fração recebida e cor de estado na opacidade do tema
- [x] 2.2 Desenhar a régua de 2 pontos na cor cheia do estado, no topo da tinta
- [x] 2.3 Tratar o caso zerado: nenhuma tinta, apenas a régua na base na cor crítica
- [x] 2.4 Tratar o caso cheio: tinta em altura total, régua rente ao topo, sem extravasar
- [x] 2.5 Tratar o caso com sobra: traço de 1 ponto acima da régua, sem número e sem etiqueta
- [x] 2.6 Confirmar que o componente não contém nenhuma aritmética sobre quantidade
- [x] 2.7 Escrever testes de renderização cobrindo os quatro casos de nível

## 3. Linha de item

- [x] 3.1 Implementar `ItemDespensa` com 68 pontos de altura, raio zero, de borda a borda, sem card, borda ou sombra
- [x] 3.2 Montar a área esquerda com nome, categoria e unidade, e a leitura de quantidade com o rótulo de estado no papel tipográfico de dado
- [x] 3.3 Reservar o alvo do botão de consumo à direita, com círculo de 40 pontos dentro de alvo de 48 por 48, ainda sem ação
- [x] 3.4 Aplicar opacidade reduzida ao botão quando o item estiver zerado, mantendo o layout inalterado
- [x] 3.5 Ligar o toque da área esquerda à navegação para o detalhe do produto
- [x] 3.6 Confirmar que nenhum gesto de deslizar dispara ação
- [x] 3.7 Definir o rótulo acessível da linha com nome, leitura de quantidade e estado
- [x] 3.8 Definir o rótulo acessível do botão com a ação completa, nome do produto e unidade
- [x] 3.9 Confirmar que o nível é pintado no valor final, sem animação de rolagem e sem entrada em cascata
- [x] 3.10 Escrever testes confirmando os rótulos acessíveis e a ausência de aritmética no componente

## 4. Tela da despensa

- [x] 4.1 Implementar `app/(tabs)/index.tsx` com o título de tela no papel de display e a lista de itens
- [x] 4.2 Configurar a barra de abas com Despensa, Lista e Resumo, deixando as duas últimas como marcadores por enquanto
- [x] 4.3 Consumir a ordenação vinda da consulta, sem reordenar na apresentação
- [x] 4.4 Implementar o agrupamento por categoria com cabeçalho fixo, apenas no filtro amplo
- [x] 4.5 Agrupar itens sem categoria sob um cabeçalho próprio ao final
- [x] 4.6 Implementar a barra de chips de filtro por estado com contagens reativas
- [x] 4.7 Implementar o filtro por categoria, oferecendo apenas categorias existentes, combinável com o filtro de estado
- [x] 4.8 Implementar a busca por nome, ignorando caixa e acentuação por normalização no cliente
- [x] 4.9 Implementar o resultado vazio de busca com a ação de cadastrar o termo buscado
- [x] 4.10 Usar lista virtualizada de alto desempenho com altura de item fixa
- [ ] 4.11 Verificar no aparelho a fluidez da rolagem com 300 itens
- [x] 4.12 Confirmar que a tela não mantém cópia dos produtos em estado global nem em cache de requisição

## 5. Cadastro de produto

- [x] 5.1 Implementar `app/produto/novo.tsx` com nome, unidade e quantidade necessária em primeiro plano
- [x] 5.2 Implementar a seção recolhida de mais opções com quantidade atual, valor unitário, categoria, marca preferida e observação
- [x] 5.3 Rotular os campos com o vocabulário de interface, sem termos de sistema
- [x] 5.4 Ligar a validação de domínio, exibindo os erros em texto no campo correspondente
- [x] 5.5 Implementar o campo de categoria com autocomplete a partir das categorias existentes, permitindo digitar uma nova
- [x] 5.6 Aplicar a normalização de categoria do domínio antes de gravar
- [x] 5.7 Implementar a detecção de nome duplicado, disparada após a parada da digitação e não a cada tecla
- [x] 5.8 Exibir a mensagem de item já existente com as ações de ver o item e de diferenciar o nome
- [x] 5.9 Confirmar que a criação com nome idêntico ao de um item ativo não é concluída
- [x] 5.10 Confirmar que reutilizar o nome de um item removido é permitido

## 6. Detalhe e edição

- [ ] 6.1 Implementar `app/produto/[id].tsx` com a quantidade atual no papel de display, no topo
- [ ] 6.2 Implementar a edição de todos os campos de cadastro, deixando a quantidade atual como somente leitura
- [ ] 6.3 Implementar o rodapé com o resumo de registros de consumo do período recente, em linguagem do usuário
- [ ] 6.4 Confirmar que alterar a quantidade necessária muda o estado do item na despensa
- [ ] 6.5 Implementar a remoção lógica com confirmação explícita
- [ ] 6.6 Confirmar que o item removido some da despensa e que seus movimentos permanecem no banco

## 7. Adoção da lista base

- [ ] 7.1 Implementar o estado vazio da despensa com o convite e o botão de começar pela lista básica
- [ ] 7.2 Manter a ação de cadastrar do zero acessível no estado vazio
- [ ] 7.3 Implementar a tela de adoção como tela única, com os itens já marcados e um botão de confirmar
- [ ] 7.4 Permitir desmarcar item a item, criando apenas os marcados
- [ ] 7.5 Definir a quantidade necessária sugerida de cada item da lista base por unidade
- [ ] 7.6 Ligar a criação em bloco à transação única do repositório
- [ ] 7.7 Tratar a falha da criação em bloco sem deixar despensa parcial, oferecendo tentar novamente
- [ ] 7.8 Verificar que a adoção funciona com o aparelho sem conexão
- [ ] 7.9 Escrever teste de adoção parcial e de adoção sem nenhum item marcado

## 8. Conformidade e documentos

- [ ] 8.1 Executar lint, typecheck e verificação de fronteiras
- [ ] 8.2 Confirmar que nenhum literal de cor foi introduzido fora dos tokens
- [ ] 8.3 Verificar a tela com escala de fonte do sistema em 200 por cento, confirmando que o nome não trunca
- [ ] 8.4 Atualizar `PRD-app-estoque-de-casa.md` US-01, substituindo "salvar mesmo assim" pelo comportamento de diferenciar o nome, com nota apontando para o índice único do documento de banco
- [ ] 8.5 Atualizar `FRONTEND-DESIGN-app-estoque-de-casa.md` §11 para refletir a mesma decisão
- [ ] 8.6 Revisar visualmente com 200 itens reais em aparelho pequeno e registrar se a altura de 68 pontos se sustenta
