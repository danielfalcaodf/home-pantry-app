# Formato de um achado

Cada falha encontrada durante a execução do plano de testes vira um arquivo `qa/achados/ACHADO-NNN.md`. Um achado **descreve**, nunca corrige — a correção é sempre feita depois, numa change OpenSpec própria.

## Template

```markdown
---
id: ACHADO-NNN
pr: <número da PR onde a falha foi localizada, ou "n/a" se for de ferramental>
change: <slug da change OpenSpec correspondente>
capability: <capability afetada, se aplicável>
severidade: critica | media | baixa
fase: <F0..F6>
estado: aberto | virou-change | descartado
---
## O que quebra
## Como reproduzir
## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)
## Observado (saída real, caminho:linha)
## Change sugerida (slug proposto, escopo de uma frase)
```

## Regras

- **Nenhum achado é corrigido durante a execução do plano.** O plano só descreve e cataloga.
- Todo achado precisa referenciar um requisito nomeado de um `spec.md` do `openspec/specs/` ou uma regra explícita do `CLAUDE.md` — achado sem âncora não entra.
- `qa/achados/` é a fila de entrada de `/opsx:propose`: no fim do plano, cada achado (ou grupo de achados com a mesma raiz) vira uma change nova.
- Ao virar change, atualizar o `estado` do achado para `virou-change` e citar o slug da change no próprio arquivo.
