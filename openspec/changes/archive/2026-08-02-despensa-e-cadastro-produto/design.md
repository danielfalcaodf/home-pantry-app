## Context

Primeira change que produz algo que o usuário abre e usa. Ela carrega o elemento-assinatura do design — a linha d'água — que é onde FRONTEND §2.3 declara ter gastado toda a ousadia do projeto: "a lista não tem cards, não tem bordas e não tem sombras", um layout que "se sustenta pela precisão do espaçamento e pela tipografia — se o ritmo vertical estiver errado, desmonta".

Tudo já está no lugar para isso: o domínio calcula estado, fração e rótulo; os repositórios entregam a consulta ordenada; os tokens e os componentes-base existem.

O que esta change **não** entrega é o gesto de dar baixa. Isso é deliberado: ARQUITETURA §11 separa "CRUD de produto + tela de estoque" (etapa 3) de "Dar baixa" (etapa 4) justamente porque a segunda "é o KPI que decide o produto — merece iteração de UX própria". Misturar as duas faria o caminho crítico ser implementado de passagem.

## Goals / Non-Goals

**Goals:**

- O medidor de linha d'água funcionando com dados reais, incluindo os casos de borda (zerado, exatamente cheio, com sobra).
- Despensa navegável: ordenação, agrupamento, filtros, busca.
- Ciclo completo de cadastro, edição e remoção lógica de produto.
- Estado vazio resolvendo o risco de cadastro inicial pesado.

**Non-Goals:**

- Botão de consumo funcional, teclado de quantidade, toast de desfazer — change seguinte.
- Lista de compras, modo compra, resumo.
- Ajuste manual de quantidade e conferência de estoque — change `ajuste-e-conferencia-estoque`. O detalhe permite editar a quantidade necessária, mas alterar a quantidade **atual** gera movimento e por isso pertence lá.

## Decisions

### D1 — O índice único do banco vence o texto do PRD sobre nome duplicado

Conflito documental real. PRD US-01: nome duplicado "exibe alerta e permite cancelar ou **salvar mesmo assim**". DATABASE §5, índice 1: `UNIQUE INDEX ux_produto_casa_nome ON produto (casa_id, nome COLLATE NOCASE) WHERE deletado_em IS NULL`.

Os dois não podem estar certos. "Salvar mesmo assim" resultaria em erro de restrição do banco.

**Decisão: o índice vence.** DATABASE §5.1 é explícito sobre a intenção — o índice "resolve na raiz o problema de duplicata que o PRD tratava só com alerta na UI". Dois produtos "Arroz" na mesma despensa quebram a busca, o autocomplete e a lista de compras, e o usuário não tem como distinguir qual é qual.

O comportamento fica: detectar cedo (na digitação do nome), mostrar a mensagem de FRONTEND §11 — *"Já existe um item chamado Arroz na sua despensa."* — e oferecer **Ver o item** ou diferenciar o nome. A ação "Salvar assim mesmo" do documento de frontend passa a significar "salvar com o nome que você diferenciou", não "salvar duplicado".

**Ação:** atualizar PRD US-01 e FRONTEND §11 para refletir isso, conforme a regra do repositório de corrigir o documento em vez de divergir em silêncio.

### D2 — Medidor por camada de fundo posicionada, não por gradiente nem por SVG

O preenchimento é uma view absoluta ancorada na base, com altura proporcional e a cor de estado na opacidade do tema; a régua é uma view de 2 pontos no topo dessa camada.

Alternativas consideradas: gradiente com parada dura — mais caro e sem ganho; SVG — dependência a mais para um retângulo. A escolha também importa para a change seguinte: uma altura em valor animado do Reanimated roda na thread de UI, que é o que FRONTEND §12.3 exige para não engasgar durante a rolagem.

### D3 — Item zerado mantém o botão, com opacidade reduzida

FRONTEND §7.2 dá o motivo e ele não é estético: remover o botão faria a linha mudar de layout e quebrar o alinhamento vertical da lista. Numa lista sem cards, o alinhamento é a única estrutura que existe.

### D4 — A consulta ordena; o componente não reordena

A ordenação por estado e alfabética vem do SQL (DATABASE §6.1). O componente recebe a lista pronta.

Rationale: reordenar em JavaScript a cada renderização de 300 itens é trabalho repetido, e — mais importante — cria uma segunda implementação da regra de ordenação, que é como as duas divergem. O agrupamento por categoria é feito na apresentação, porque é decisão de layout, não de dados.

### D5 — Filtros e busca em estado local, não global

`useState` na tela. ADR-05 já estabelece: estado efêmero de tela fica local; só estado global de UI justificaria Zustand, e filtro de uma tela não é global.

A busca ignora acentuação por normalização do texto no lado do cliente antes de comparar — o `COLLATE NOCASE` do SQLite é ASCII-only e não resolve acento (DATABASE §5.1 é explícito sobre essa limitação).

### D6 — Lista virtualizada acima de ~150 itens, conforme o documento

`FlashList` acima do limiar, conforme FRONTEND §12.3. Com o volume esperado (80–300 produtos), o app frequentemente estará acima. Usar a lista virtualizada desde já evita a troca depois e o retrabalho de medir altura de item — que é fixa em 68 pontos, o que torna a virtualização barata e precisa.

### D7 — A adoção da lista base é uma tela, não um assistente de várias etapas

Uma tela com os 40 itens já marcados e um botão de confirmar. Não um fluxo de boas-vindas com várias telas.

Rationale: o risco que se está mitigando é atrito de entrada. Um assistente de onboarding para resolver um problema de atrito é a contradição clássica. O usuário desmarca o que não usa e confirma — ou fecha e cadastra manualmente.

### D8 — Detalhe edita a quantidade necessária, mas não a atual

Alterar a quantidade **necessária** é edição de cadastro: muda o estado do item, não gera movimento. Alterar a quantidade **atual** é um ajuste, gera movimento append-only, e tem regra própria (US-06). Deixar os dois no mesmo formulário faria o segundo parecer um campo de texto qualquer e abriria caminho para alterar o estoque sem trilha.

O campo de quantidade atual no detalhe é somente leitura nesta change. A edição chega em `ajuste-e-conferencia-estoque`.

## Risks / Trade-offs

| Risco | Como saber se deu errado | Mitigação |
|---|---|---|
| O nível vertical ser lido como barra de progresso (FRONTEND §13) | Alguém perguntar "progresso de quê?" no primeiro uso | Aumentar o peso do rótulo "2 de 3" antes de mexer no medidor |
| Lista sem cards parecer densa demais em tela pequena | Cansaço visual com volume real | Testar com 200 itens em aparelho de 5,5 polegadas; se cansar, subir a linha para 76 pontos **antes** de reintroduzir bordas |
| Texto sobre a tinta perder contraste | Verificação de contraste sobre o preenchimento, não só sobre o fundo | Já coberto por teste na change de tema; revalidar com os três estados |
| Cabeçalho de categoria fixo brigando com o medidor da linha logo abaixo | Revisão visual com dados reais | Cabeçalho usa fundo opaco da superfície, não translúcido |
| Detecção de nome duplicado atrasando a digitação | Latência perceptível no campo de nome | Consulta indexada, disparada com atraso curto após a parada da digitação, nunca a cada tecla |
| Item com quantidade necessária muito maior que a atual produzir tinta quase invisível | Itens em falta parecerem zerados | O rótulo textual e a régua carregam o estado; a redundância de três canais é o que cobre esse caso |

## Migration Plan

Sem migration de schema — esta change só lê e escreve nas tabelas existentes. A adoção da lista base cria produtos reais; nada aqui altera estrutura.

## Open Questions

- **Quantidade necessária sugerida na lista base**: cada um dos 40 itens precisa de um valor sugerido. Um padrão razoável por unidade (1 para pacote e caixa, 1 kg, 1 L) resolve sem pesquisa, e o usuário ajusta. Revisar com uso real.
- **Ordem das categorias no filtro "Tudo"**: alfabética por ora. O "modo corredor de mercado" do PRD pediria ordem configurável de corredor, o que é v1.1 e exigiria a tabela de categoria descrita em DATABASE §3.2.
