## 1. Pré-requisito: coordenar com `correcao-navegacao-nativa`

- [x] 1.1 `correcao-navegacao-nativa` já está arquivada (não é mais change ativa), então `/opsx:update` não se aplica a ela — a coordenação foi feita criando um delta spec `chrome-de-navegacao` nesta própria change (`specs/chrome-de-navegacao/spec.md`), modificando o requisito "Tab bar sem ícones" para "Tab bar com ícone por aba". Esse delta é sincronizado para `openspec/specs/chrome-de-navegacao/spec.md` junto do `tela-despensa` no `/opsx:sync` desta change, mantendo `headerShown: false` e `BotaoVoltar` intactos (nenhum dos dois muda).
- [x] 1.2 Nenhuma tarefa de `correcao-navegacao-nativa/tasks.md` (arquivada) precisa ser revertida — a mudança de ícone é aditiva sobre o que já foi entregue (header oculto, `BotaoVoltar`), só reverte o valor de `tabBarIcon`.

## 2. Infraestrutura de ícone

- [x] 2.1 Adicionar `react-native-svg` ao `package.json` (`npx expo install react-native-svg`) e rodar o dev build necessário.
- [x] 2.2 Criar `src/presentation/theme/icones.ts` com os paths SVG extraídos do design system: buscar, adicionar (`+`), tab Despensa, tab Lista, tab Resumo, voltar (`←`, reaproveitado do `correcao-navegacao-nativa`).
- [x] 2.3 Criar `src/presentation/components/icone-svg.tsx`: recebe `path`, `cor`, `tamanho`; renderiza `<Svg><Path .../></Svg>`; teste cobrindo renderização com cor customizada.

## 3. Tab bar com ícone

- [x] 3.1 Em `app/(tabs)/_layout.tsx`, substituir `tabBarIcon: () => null` (ou omissão) por `tabBarIcon: ({ color }) => <IconeSvg path={...} cor={color} />` para as 3 abas, usando `tabBarActiveTintColor`/`tabBarInactiveTintColor` já configurados para resolver a cor.

## 4. Cabeçalho da Despensa

- [x] 4.1 Em `app/(tabs)/index.tsx`, substituir o `CampoTexto` sempre visível por um botão de ícone "Buscar" que alterna a visibilidade do campo (estado local `buscaAberta`).
- [x] 4.2 Adicionar botão de ícone "Adicionar produto" no cabeçalho, navegando para `/produto/novo` (mesmo destino do fluxo já existente).
- [x] 4.3 Remover o link de texto "Conferência" do cabeçalho da Despensa.
- [x] 4.4 Adicionar o acesso à Conferência de estoque em `app/configuracoes.tsx` (novo item de lista/link, navegando para `/conferencia`).
- [x] 4.5 Reduzir os chips de `FILTROS` em `app/(tabs)/index.tsx` de 4 (`Tudo`/`Acabou`/`Faltando`/`Cheio`) para 3 (`Tudo`/`Acabou`/`Faltando`), com "Faltando" cobrindo os estados `emFalta` e `critico` juntos.
- [x] 4.6 Ajustar `contarPorEstado`/filtro em `src/presentation/format/agrupar-despensa.ts` (ou onde a contagem é calculada) para expor a contagem combinada de "Faltando" (crítico + em falta) sem duplicar lógica de estado que já existe em `domain/produto/estoque.rules.ts`. Nova `casaComFiltro` reaproveita `EstadoItem` já calculado, sem duplicar `estadoDoItem()`; `FiltroEstado` continua aceitando os valores antigos (`emFalta`, `ok`) para não quebrar as rotas que o Resumo já usa (`/?filtro=emFalta`), mesmo sem chip próprio para eles na Despensa.
- [x] 4.7 Testes: `src/presentation/format/agrupar-despensa.test.ts` (novo) cobre `contarPorEstado` (chip "Faltando" soma crítico+emFalta, chips zerados) e `casaComFiltro` (composto e estados isolados). Não há precedente de teste de tela em `app/` neste projeto (telas são finas por arquitetura) — a lógica testável do cabeçalho já está coberta no nível de `agrupar-despensa`.

## 5. Modo compra: reposicionar rodapé

- [x] 5.1 Em `app/compra/[id].tsx`, mover `<RodapeCompra ... />` de logo após o cabeçalho para imediatamente antes dos botões "Fechar compra"/"Cancelar compra", no final da árvore de views — agrupado com eles no mesmo bloco condicional (`aviso?.sucesso ? null : (...)`), já que rodapé e botões só fazem sentido juntos enquanto a compra segue aberta.
- [x] 5.2 Nenhum teste existente dependia da posição anterior: `rodape-compra.test.tsx` testa o componente isolado, sem tela em volta; não há teste de tela do Modo compra neste projeto.

## 6. Resumo: métrica de destaque e gráfico de barras

- [x] 6.1 Em `app/(tabs)/resumo.tsx`, promovido `gastoMensal.meses[0]` (mês corrente — confirmado pela ordem de `completarMesesSemCompra`, mais recente primeiro) a bloco `data.xl` "Gasto este mês", no mesmo padrão de "Em casa"/"Falta comprar".
- [x] 6.2 Novo componente `src/presentation/components/grafico-barras.tsx` (`GraficoBarras`): `View`s em `flexDirection: 'row', alignItems: 'flex-end'`, altura proporcional ao maior valor (`(valor/maior)*100`, com piso de 2px para valores > 0 não desaparecerem visualmente). Resumo usa os últimos 4 meses (`MESES_NO_GRAFICO`), revertidos para ordem cronológica (mais antigo à esquerda).
- [x] 6.3 Lista textual de todos os 12 meses mantida abaixo do gráfico, sem remoção de detalhamento.
- [x] 6.4 `grafico-barras.test.tsx`: rótulos renderizados, altura proporcional ao maior valor, nenhuma barra com `onPress`/responder a toque, período todo zerado não quebra.

## 7. Conformidade do repositório

- [x] 7.1 `npm run verificar` (fronteiras + lint + typecheck) passa limpo. `npm test`: 602 passando, 2 falhando — ambas pré-existentes (confirmado com `git stash` antes das mudanças desta change), sem relação com o escopo deste proposal:
  - `historico-de-compras.test.ts` (`formatarDataDaCompra`): depende do fuso horário local da máquina de execução, não das mudanças aqui.
  - `use-gasto-mensal.test.ts`: mesma classe de flakiness — timing entre `Date.now()`/relógio do sistema no ambiente de teste.
- [x] 7.2 Nenhuma divergência introduzida por esta change ficou sem resolver.

## 8. Ajustes pedidos pelo usuário durante a validação manual no emulador

Escopo além do proposal original, decidido em conversa direta com o usuário depois de comparar o app rodando com o `Repor Prototype.dc.html` do projeto de design (importado via `claude_design` MCP/`DesignSync`).

- [x] 8.1 Paths de ícone corrigidos para os valores reais do design system (lidos de `PantryScreen.jsx`, `TabBar.jsx`, `ProductDetailScreen.jsx` via `_ds_bundle.js`) — os que eu tinha estimado nas tasks 2.2/3.1 não batiam. `IconeSvg` passou a aceitar `string | readonly string[]` porque o design usa um único `d` com múltiplos comandos `M` por ícone.
- [x] 8.2 `GraficoBarras` ajustado para bater com `SummaryScreen.jsx`: todas as barras em `action.azulejo`, só a mais recente em opacidade plena (as demais em 0.4) — substituiu a lógica de "cor neutra para valor zero" que eu tinha inventado sem fonte no design.
- [x] 8.3 Botão "Repor" (+) sempre visível ao lado do botão de consumir ("−") em cada linha da Despensa, igual ao par de botões do protótipo (`PantryScreen.jsx`) — confirmado com o usuário antes de implementar, porque mexia numa decisão já documentada e testada em `dar-baixa-caminho-critico` (um único botão no caminho crítico). Novo componente `src/presentation/components/botao-repor-rapido.tsx` (par do `StepperConsumo` existente, sempre 1 unidade; ajuste de quantidade exata continua só pelo toque longo do stepper ou pelo Detalhe do produto). Teste em `medidor-e-item.test.tsx`.
- [x] 8.4 Botão de alternar tema claro/escuro do protótipo **não** foi implementado — é um controle de prévia do próprio Claude Design (position absolute sobre o frame do telefone, fora da área de conteúdo, sem componente correspondente no `readme.md` do design system), não um componente de produto. Confirmado com o usuário; a tela Configurações continua sendo a única fonte de preferência de tema.
- [x] 8.5 Tela Configurações movida de `app/configuracoes.tsx` (rota push) para `app/(tabs)/configuracoes.tsx` (4ª aba, ícone próprio em `icones.tabConfiguracoes` — sem equivalente no design system, que só define 3 abas). A URL `/configuracoes` não muda (grupo de rota `(tabs)` é invisível na URL), então o link existente em `app/(tabs)/resumo.tsx` continua funcionando.
- [x] 8.6 `BotaoVoltar` adicionado a todas as telas empilhadas que ainda não tinham (pedido explícito do usuário, "todas as telas é bom ter botão de voltar"): `app/(tabs)/configuracoes.tsx`, `app/conferencia.tsx` (só na tela de escolha de categoria — as telas do meio do percurso guiado já têm saída própria via "Voltar para a despensa"), `app/diagnostico.tsx`, `app/produto/lista-base.tsx`, `app/compra/historico.tsx`, `app/compra/historico/[id].tsx`, `app/produto/[id]/historico.tsx`. Detalhe do produto, Cadastrar produto e Modo compra já tinham desde `correcao-navegacao-nativa`.
- [x] 8.7 Delta spec `chrome-de-navegacao` atualizado: requisito de tab bar agora cobre 4 abas; requisito de botão de voltar ganhou os novos cenários das 6 telas do item 8.6.
