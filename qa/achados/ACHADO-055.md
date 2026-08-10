---
id: ACHADO-055
pr: 10
change: 2026-08-03-ajuste-e-conferencia-estoque
capability: modo-conferencia
severidade: baixa
fase: F5
estado: virou-change
change-correcao: botao-voltar-conferencia
---
## O que quebra

No modo Conferência (`app/conferencia.tsx`), o campo "Corrigir para" mostra um número dentro dele antes de qualquer toque do usuário (ex. "1", "2", "3,5") — mas esse número é só o `placeholder` do campo (`app/conferencia.tsx:116`), não um valor real digitado. O estado real (`valorCorrecao`) começa vazio (`''`), e o botão "Corrigir" nasce **desabilitado** (`disabled={valorCorrecao.trim() === ''}`, `app/conferencia.tsx:122`).

Um usuário (ou uma automação) que olha o campo, vê o número já "preenchido" e toca direto em "Corrigir" sem digitar nada primeiro, sofre um **no-op silencioso**: nenhum erro aparece, o percurso não avança, nada é gravado — a única forma de perceber é notar que o progresso ("N de M conferidos") não mudou.

## Como reproduzir

1. Entrar em Configurações → "Conferência de estoque".
2. No item atual, sem tocar no campo "Corrigir para", tocar diretamente em "Corrigir".
3. Observar: nenhuma mudança de tela, nenhum toast, contador "N de M" permanece igual.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-03-ajuste-e-conferencia-estoque/specs/modo-conferencia/spec.md` — cenário "confirmar exige um único toque" pressupõe que qualquer ação de toque no percurso produz efeito visível (avança ou dá feedback), nunca um estado ambíguo sem resposta. CLAUDE.md também não permite estado sem sinal claro ("estado nunca depende só de cor... três canais redundantes" é para o medidor, mas o princípio de feedback explícito para toda ação é o mesmo espírito).

## Observado (saída real, caminho:linha)

`app/conferencia.tsx:116` (placeholder com o valor atual, visualmente indistinguível de um valor real) e `app/conferencia.tsx:122` (`disabled={valorCorrecao.trim() === ''}`) — confirmado em runtime durante a autoria do flow `.maestro/conferencia-estoque.yaml` (F5, PR-10): tocar "Corrigir" sem digitar antes não avançou o percurso.

## Change sugerida (slug proposto, escopo de uma frase)

`feedback-visual-correcao-conferencia`: distinguir visualmente placeholder de valor real (ex. campo vazio de fato, ou botão com texto indicando "digite um valor"), evitando a leitura equivocada de "já preenchido, pode confirmar direto".
