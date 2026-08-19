## Context

`ChipEstado` (`src/presentation/components/chip-estado.tsx:17-42`) tem dois modos de uso:

1. **Chip de estado do domínio** (ex.: filtro "Acabou 40" na Despensa): recebe `cor` — o fundo
   ativo é `sobrepor(cor, tema.bg.base, tema.fillOpacity)`, uma cor calculada que nunca coincide
   por acaso com o fundo ao redor.
2. **Chip de múltipla escolha genérico, sem estado de domínio** (ex.: unidade de medida, motivo
   do ajuste): não recebe `cor` — o fundo ativo cai no fallback `tema.bg.raised` (linha 23).

O modo 2 funciona hoje em `formulario-produto.tsx` (tela cheia, fundo `bg.base`) só porque
`bg.raised` é visualmente distinto de `bg.base` nos tokens atuais — coincidência, não garantia.
Em `sheet-avulso.tsx` e `sheet-ajuste-estoque.tsx`, o próprio bottom sheet usa
`backgroundColor: tema.bg.raised` (mesmo valor do fallback), e o chip ativo desaparece.

## Goals / Non-Goals

**Goals:**
- Garantir que o fundo do chip ativo, no modo sem `cor`, seja sempre distinguível do fundo do
  container ao redor — tela cheia ou bottom sheet, tema claro ou escuro.
- Não alterar a assinatura de `ChipEstadoProps` nem exigir que os 5 call sites passem `cor`.

**Non-Goals:**
- Não criar um componente novo de chip multi-escolha (`ChipMultiplo` não existe e não precisa
  existir — a correção fica dentro do `ChipEstado` já usado nesses 5 pontos).
- Não mudar a lógica de seleção/toggle (`useState` + comparação de valor) em nenhum call site —
  já está correta, confirmado por leitura de código em ambos os sheets.

## Decisions

**Trocar o fallback de `fundoAtivo` de `tema.bg.raised` para uma cor derivada de
`tema.action.azulejo` com `tema.fillOpacity`** — mesma fórmula (`sobrepor`) já usada no modo com
`cor`, só que com a cor de ação do tema como padrão em vez de depender de quem chama passar uma
cor de estado. `action.azulejo` é a cor de destaque do app (usada em botões primários, "Ver
histórico", etc.) e nunca é igual a `bg.raised` nem a `bg.base` em nenhum dos dois temas —
elimina a coincidência que causa o bug, sem introduzir um token novo.

Alternativa considerada: manter `tema.bg.raised` mas mudar a borda ou adicionar um ícone de
check no chip ativo. Descartada porque o requirement existente em `componentes-base`
("Chip ativo é distinguível" → "fundo na cor do estado com opacidade reduzida") já define fundo
como o canal principal — mudar para depender só de borda/ícone divergiria do padrão já
estabelecido para o chip com `cor`, criando dois comportamentos visuais diferentes para o mesmo
componente.

## Risks / Trade-offs

- [Risco] Usar `action.azulejo` como cor "genérica" de ativo pode ler como se o chip carregasse
  significado de ação/navegação (a mesma cor de "Ver histórico", por exemplo) → Mitigação: é a
  cor de destaque padrão do tema, já usada em outros controles de seleção sem esse problema de
  leitura (ex.: seleção de unidade em `formulario-produto.tsx`, que já usa esse mesmo padrão
  visual hoje sem queixa).
- [Risco] Mudar o fallback afeta os 5 call sites simultaneamente → Mitigação: é exatamente o
  objetivo (corrigir a causa raiz uma vez); teste de regressão cobre os 5 pontos.

## Migration Plan

Mudança pura de `presentation/`, sem estado persistido. Deploy é o build normal do app.
