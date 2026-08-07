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

- [ ] 4.1 Em `app/(tabs)/index.tsx`, substituir o `CampoTexto` sempre visível por um botão de ícone "Buscar" que alterna a visibilidade do campo (estado local `buscaAberta`).
- [ ] 4.2 Adicionar botão de ícone "Adicionar produto" no cabeçalho, navegando para `/produto/novo` (mesmo destino do fluxo já existente).
- [ ] 4.3 Remover o link de texto "Conferência" do cabeçalho da Despensa.
- [ ] 4.4 Adicionar o acesso à Conferência de estoque em `app/configuracoes.tsx` (novo item de lista/link, navegando para `/conferencia`).
- [ ] 4.5 Reduzir os chips de `FILTROS` em `app/(tabs)/index.tsx` de 4 (`Tudo`/`Acabou`/`Faltando`/`Cheio`) para 3 (`Tudo`/`Acabou`/`Faltando`), com "Faltando" cobrindo os estados `emFalta` e `critico` juntos.
- [ ] 4.6 Ajustar `contarPorEstado`/filtro em `src/presentation/format/agrupar-despensa.ts` (ou onde a contagem é calculada) para expor a contagem combinada de "Faltando" (crítico + em falta) sem duplicar lógica de estado que já existe em `domain/produto/estoque.rules.ts`.
- [ ] 4.7 Atualizar/estender os testes de `agrupar-despensa` e da tela Despensa para cobrir os novos cenários do spec `tela-despensa` (chip "Faltando" soma crítico+emFalta, sem chip "Cheio").

## 5. Modo compra: reposicionar rodapé

- [ ] 5.1 Em `app/compra/[id].tsx`, mover `<RodapeCompra ... />` de logo após o cabeçalho para imediatamente antes dos botões "Fechar compra"/"Cancelar compra", no final da árvore de views.
- [ ] 5.2 Conferir que nenhum teste existente (`rodape-compra.test.tsx` ou teste de tela do Modo compra) dependia da posição anterior; ajustar se necessário.

## 6. Resumo: métrica de destaque e gráfico de barras

- [ ] 6.1 Em `app/(tabs)/resumo.tsx`, promover o mês corrente de `gastoMensal.meses` a um bloco de métrica `data.xl` no mesmo padrão visual de "Em casa"/"Falta comprar" (rótulo "Gasto este mês" + valor grande).
- [ ] 6.2 Adicionar um componente de gráfico de barras simples (`View`s com `flexDirection: 'row', alignItems: 'flex-end'`, altura proporcional ao maior valor do período) para os últimos meses de `gastoMensal.meses`, sem introduzir biblioteca de gráfico.
- [ ] 6.3 Manter a lista textual de meses anteriores abaixo do gráfico (não remover o detalhamento por mês, só adicionar a visualização).
- [ ] 6.4 Teste do novo componente de gráfico: barras proporcionais, sem contagem progressiva, sem toque/interação.

## 7. Conformidade do repositório

- [ ] 7.1 Rodar `npm run verificar` (fronteiras + lint + typecheck) e `npm test`.
- [ ] 7.2 Reportar aqui (ou em comentário da PR) qualquer divergência do `npm run verificar` que não pôde ser resolvida automaticamente.
