---
name: solid
description: Decision rules for applying SRP, Open-Closed, Liskov Substitution, Interface Segregation and Dependency Inversion when designing or reviewing a class/module/interface split. Use this whenever the user asks "isso viola algum princípio SOLID?", is deciding whether to split a function/class, add an interface, or extend behavior without touching existing callers — even if they don't name SOLID explicitly, just describe symptoms like "essa interface tem método demais" or "toda vez que muda X eu preciso mudar Y também".
license: MIT (rules extracted from Clean Architecture by Robert C. Martin, via https://github.com/ciembor/agent-rules-books full version — see note below)
---

# SOLID — recorte de Clean Architecture (Robert C. Martin)

**Nota de origem:** o repositório de referência (`agent-rules-books`) não tem um livro "SOLID"
próprio — SOLID é tratado ali como uma subseção curta dentro do arquivo completo de
`clean-architecture` ("Paradigm and Component Rules", itens 4-8). As cinco regras abaixo são
essa subseção, expandida fielmente sem adicionar conteúdo que não veio da fonte. Para o resto
das decisões de Clean Architecture (dependência inward, ports/adapters, boundaries), use a
skill `clean-architecture`.

## As cinco regras

- **SRP (Single Responsibility)** — separe código que muda por atores ou razões diferentes. Se
  duas partes de uma classe/módulo mudam por motivos diferentes (um pedido do time de negócio,
  outro de infraestrutura), elas pertencem a lugares diferentes, mesmo que hoje pareçam "a mesma
  entidade".
- **OCP (Open-Closed)** — proteja a política estável dos detalhes voláteis de extensão. Uma
  regra de negócio que não muda não deveria precisar ser editada só porque um detalhe de
  implementação (novo formato, novo canal, nova unidade) foi adicionado — a extensão deve
  encaixar por composição/polimorfismo, não por edição do que já funciona.
- **LSP (Liskov Substitution)** — garanta que implementações substituíveis preservem a
  expectativa de quem chama. Uma implementação alternativa de uma interface (real ou fake de
  teste) não pode surpreender o código que a usa com um comportamento diferente do contrato
  esperado.
- **ISP (Interface Segregation)** — mantenha interfaces focadas no que cada cliente realmente
  precisa. Uma interface grande com métodos que só uma parte dos consumidores usa deveria virar
  interfaces menores e específicas.
- **DIP (Dependency Inversion)** — faça as dependências de código apontarem para a política
  estável e para abstrações, não para detalhes concretos e voláteis. Quem decide a regra de
  negócio não deveria depender de quem implementa o detalhe — é o contrário.

## Lente de decisão (quando aplicar cada uma)

Antes de dividir uma classe ou criar uma interface nova, pergunte:

1. **Isso muda por dois motivos diferentes hoje, ou só parece que vai mudar um dia?** Só divida
   por SRP quando há uma razão de mudança real e presente — dividir por antecipação é
   abstração especulativa, não SOLID.
2. **Se eu adicionar um caso novo, preciso editar código que já funciona, ou só adicionar algo
   novo ao lado?** Se a resposta é "editar", é sinal de OCP quebrado — mas só vale a pena
   corrigir se esse ponto de extensão é realmente esperado, não hipotético.
3. **A implementação fake de teste se comporta igual à implementação real, do ponto de vista de
   quem chama?** Se não, é quebra de LSP — o teste está mentindo sobre o comportamento real.
4. **Esse consumidor usa todos os métodos dessa interface, ou só uma fatia?** Se só uma fatia,
   é sinal de ISP — mas uma interface pequena de propósito único não precisa ser fatiada de novo.
5. **Quem decide a regra depende de quem faz o trabalho sujo, ou o contrário?** Se a regra de
   negócio importa a implementação concreta em vez de uma interface, é quebra de DIP.

## This project (Repor)

O `CLAUDE.md` já nomeia esses cinco princípios na seção "Princípios de código", com os exemplos
concretos do projeto (SRP em `use-dar-baixa`/`use-lista-compras` separados, OCP/DIP via
`ports/` em vez de `SQLiteProdutoRepository` direto, LSP como o que permite testar `application/`
com repositório fake, ISP como `ProdutoRepository`/`MovimentoRepository`/`CompraRepository`
pequenas em vez de uma `Repository` gigante). Essa skill não repete esses exemplos — ela existe
pra trazer a lente de decisão acima quando a dúvida for "isso é uma violação real ou estou
inventando problema" antes de propor a divisão.
