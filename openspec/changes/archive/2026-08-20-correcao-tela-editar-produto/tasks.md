## 1. Correção do bug

- [x] 1.1 Em `app/produto/[id].tsx`, trocar `telaCheia={false}` por `telaCheia={true}` na
      chamada de `FormularioProduto`, ajustando o layout da tela ao redor (remover o
      `ScrollView` externo duplicado, se for o caso, deixando `FormularioProduto` dono do
      próprio scroll/rodapé).
- [x] 1.2 Em `formulario-produto.tsx`, adicionar `ref` ao `ScrollView` e, no toggle "Mais
      opções" (abrir), medir a posição do primeiro campo do bloco revelado e rolar até ele —
      sem `autoFocus`.
- [x] 1.3 Reabilitar/ajustar `scrollEnabled` no `ScrollView` interno se necessário para não
      quebrar o "scroll to focused input" nativo do RN.
- [x] 1.4 Estender `Botao` (`botao.tsx`) com prop opcional de ícone + cor customizada, aditiva
      (variantes `primario`/`secundario` inalteradas).
- [x] 1.5 Adicionar ícone de lixeira em `icones.ts`.
- [x] 1.6 Trocar o botão "Tirar da despensa" em `app/produto/[id].tsx` para usar o ícone de
      lixeira + cor `state.critico` do tema + `accessibilityLabel` explícito.

## 2. Prova do cenário do bug

- [x] 2.1 Teste RNTL: renderizar `app/produto/[id].tsx`, rolar o conteúdo, confirmar que o
      botão "Salvar" permanece fora do fluxo de scroll (mesma estrutura de `produto/novo.tsx`).
- [x] 2.2 Teste RNTL: abrir "Mais opções" com o formulário montado, confirmar que o scroll é
      disparado e que nenhum campo revelado recebe foco.

## 3. Casos de borda do mesmo contexto (obrigatório para Correção de Bug)

- [x] 3.1 Teste de `Botao`: variantes `primario`/`secundario` existentes renderizam idênticas
      (snapshot/props) antes e depois da mudança — não regredir os outros usos no app.
- [x] 3.2 Teste de `Botao`: nova prop de ícone/cor renderiza corretamente quando fornecida.
- [x] 3.3 Teste: botão "Tirar da despensa" expõe `accessibilityLabel` correto (não depende só
      do ícone visual).
- [x] 3.4 Teste: em `produto/novo.tsx` (não tocado por esta change), o comportamento de rodapé
      fixo e "Mais opções" continua idêntico — não regredir.
- [x] 3.5 Teste: abrir "Mais opções" já expandido (recolher) não dispara scroll indesejado.

## 4. Regressão

- [x] 4.1 `npm test` (presentation) passando.
- [x] 4.2 `npm run verificar` sem violação, com atenção ao `typecheck` (assinatura aditiva de
      `Botao` não pode quebrar nenhum uso existente).
