## Why

Sem backend, **os dados existem só no aparelho**. Perdeu o celular, perdeu o estoque inteiro — meses de cadastro e histórico. ARQUITETURA §9 classifica isso como risco de impacto **Alto** e nomeia a mitigação como *"item obrigatório da Fase 1, antes de qualquer feature nova"*. ADR-03 repete: é a contrapartida explícita de ter escolhido não ter backend no MVP.

Há um segundo motivo, mais imediato: migrations são **forward-only e não revertem no aparelho** (DATABASE §9.2). O único caminho de recuperação de uma migration ruim é backup e restauração. Enquanto isso não existir, toda alteração de schema é uma aposta sem rede.

Por isso esta change vem **antes** do resumo de valores, contrariando a ordem natural de "features primeiro". Ela é infraestrutura de segurança, não funcionalidade.

## What Changes

- Implementa **exportação em JSON** com `schema_version`, contendo casa, usuários, produtos, movimentos, compras e itens de compra.
- Exporta via folha de compartilhamento do sistema, para o usuário salvar onde quiser.
- Implementa **importação/restauração** dentro de uma transação, com upsert por identificador — seguro porque as chaves são UUID.
- Recusa backups de versão de schema **mais nova** que a do app, com a mensagem exata de FRONTEND §11.
- Roda a **consulta de reconciliação** ao final de toda restauração, detectando divergência entre a quantidade materializada e a soma dos movimentos.
- Implementa a tela de configurações onde backup e restauração vivem, junto da escolha de tema.
- Adiciona a exportação em CSV dos produtos, atendendo ao requisito de portabilidade de dados do PRD §4.4.

## Capabilities

### New Capabilities

- `exportacao-de-backup`: geração do arquivo JSON versionado com todos os dados da casa, e seu compartilhamento.
- `restauracao-de-backup`: importação transacional com upsert por identificador, verificação de versão e reconciliação ao final.
- `tela-de-configuracoes`: o lugar onde tema, backup, restauração e diagnóstico ficam acessíveis.

### Modified Capabilities

_Nenhuma._

## Impact

- **Cria**: `app/configuracoes.tsx`, `src/application/backup/{use-exportar,use-restaurar}.ts`, `src/infrastructure/backup/*`, `src/domain/backup/backup.schema.ts`.
- **Modifica**: barra de abas ou cabeçalho (acesso às configurações).
- **Depende de**: `persistencia-sqlite` (todos os repositórios), `modo-compra-e-fechamento` (para que compras existam no formato exportado), `design-system-tema` (tela de configurações).
- **Bloqueia**: nada tecnicamente, mas é pré-requisito de segurança para confiar nos dados — e a política de migration com backup depende dela.
- **Formato**: JSON, não cópia binária do arquivo de banco. JSON sobrevive a mudanças de schema; arquivo binário não (DATABASE §9.4).
