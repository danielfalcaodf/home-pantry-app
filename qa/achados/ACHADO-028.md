---
id: ACHADO-028
pr: 6
change: dar-baixa-caminho-critico
capability: medidor-linha-dagua
severidade: media
fase: F3
estado: virou-change
change-correcao: cobertura-componentes-apresentacao
---
## O que quebra

O requisito modificado "Sem animação durante a rolagem" (delta desta PR) exige que a tinta anime **exclusivamente** quando a quantidade daquele item específico muda por ação do usuário — nunca na rolagem, nunca para outros itens. `medidor-nivel.tsx:40` implementa exatamente essa condicional: `nivel.set(animar ? molar(fracao) : fracao)`. É o mecanismo central da capability, mas nenhum teste renderiza o componente com `animar={true}` para verificar que `molar()` é usado (spring), nem monta uma lista com dois itens onde só um muda de quantidade para confirmar que apenas aquele recebe `animar={true}`. O cenário "Reordenação após mudança de estado não anima o nível" também não tem teste.

## Como reproduzir

```
grep -n "animar" src/presentation/components/medidor-e-item.test.tsx
```
Não retorna nada.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-02-dar-baixa-caminho-critico/specs/medidor-linha-dagua/spec.md`, requisito "Sem animação durante a rolagem" (MODIFIED), cenários "Mudança de quantidade anima", "Apenas o item alterado anima" e "Reordenação após mudança de estado não anima o nível".

## Observado (saída real, caminho:linha)

`src/presentation/components/medidor-nivel.tsx:37-40`:
```ts
const nivel = useSharedValue(fracao);
...
nivel.set(animar ? molar(fracao) : fracao);
```
Nenhum teste em `medidor-e-item.test.tsx` passa `animar` como prop.

## Change sugerida (slug proposto, escopo de uma frase)

`teste-animacao-condicional-medidor`: teste que renderiza `MedidorNivel` com `animar={false}` e confirma valor final direto (sem chamada a `molar`), depois com `animar={true}` e confirma a chamada a `molar`; teste de lista com dois itens onde só um tem `animar={true}` propagado a partir de uma mudança de quantidade.
