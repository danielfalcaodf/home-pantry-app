## Why

A tela de editar produto (`app/produto/[id].tsx`) reusa `FormularioProduto` com
`telaCheia={false}` dentro de UM `ScrollView` externo só — diferente da tela de "Novo produto"
(`telaCheia=true`, container `flex:1` próprio). Isso quebra três coisas ao mesmo tempo, porque
compartilham a mesma causa raiz estrutural: (1) o botão "Salvar" não fica fixo como o "Adicionar"
de "Novo produto", rolando junto com o conteúdo; (2) o toggle "Mais opções" não faz scroll até
o primeiro campo revelado quando o teclado já está aberto, porque o `ScrollView` interno do
formulário está sem `ref` e com `scrollEnabled=false`, quebrando também o "scroll to focused
input" nativo; (3) o botão "Tirar da despensa" usa a variante genérica `secundario` do
componente `Botao`, sem ícone nem cor de perigo — hoje `Botao` só aceita
`'primario'|'secundario'` e o app não tem ícone de lixeira.

## What Changes

- `app/produto/[id].tsx` passa a usar `telaCheia={true}` no `FormularioProduto`, dando a ele um
  container `flex:1` próprio — isso resolve o rodapé fixo do "Salvar" e reabilita o
  keyboard-avoidance (`EvitaTeclado`) que já existe no componente mas está sem efeito hoje.
- `formulario-produto.tsx`: o `ScrollView` ganha `ref`; ao expandir "Mais opções", a tela rola
  automaticamente até o primeiro campo extra revelado — **sem** dar foco automático nele (só
  scroll, o usuário decide se toca).
- `Botao` (`src/presentation/components/botao.tsx`) ganha suporte **aditivo** (variantes
  existentes inalteradas) a ícone e cor customizada.
- Novo ícone de lixeira em `icones.ts`; o botão "Tirar da despensa" passa a usar ícone de
  lixeira + cor vermelha (`state.critico` do tema, nunca hex literal), com
  `accessibilityLabel` explícito.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `cadastro-de-produto`: requisitos "Cadastro com campos essenciais em primeiro plano" (scroll
  automático ao expandir "Mais opções"), "Detalhe e edição do produto" (rodapé fixo do botão
  Salvar, auto-scroll para campo coberto pelo teclado) e "Remoção lógica de produto" (botão de
  remoção com ícone de lixeira vermelho) ganham novos cenários.

## Impact

- `app/produto/[id].tsx`
- `src/presentation/components/formulario-produto.tsx`
- `src/presentation/components/botao.tsx`
- `src/presentation/theme/icones.ts`
- Testes: RNTL para as duas telas + componente `Botao` (variantes antigas não regridem).
