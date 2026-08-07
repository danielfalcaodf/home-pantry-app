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

- [ ] 7.1 Rodar `npm run verificar` (fronteiras + lint + typecheck) e `npm test`.
- [ ] 7.2 Reportar aqui (ou em comentário da PR) qualquer divergência do `npm run verificar` que não pôde ser resolvida automaticamente.
