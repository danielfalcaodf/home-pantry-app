## MODIFIED Requirements

### Requirement: Reconciliação após restaurar

Ao final de toda restauração bem-sucedida, o app SHALL verificar se a quantidade materializada de cada produto corresponde à soma das variações de seus movimentos, e SHALL informar qualquer divergência oferecendo um caminho direto para corrigi-la.

#### Scenario: Banco coerente após restaurar

- **WHEN** a reconciliação roda após uma restauração de backup íntegro
- **THEN** nenhuma divergência é encontrada

#### Scenario: Divergência é informada com ação para corrigir

- **WHEN** a reconciliação encontra produtos cuja quantidade não corresponde à soma dos movimentos
- **THEN** o app informa quantos produtos divergem e oferece uma ação que leva à correção pela soma dos movimentos

#### Scenario: Ação do aviso leva ao Diagnóstico

- **WHEN** o usuário toca na ação oferecida junto ao aviso de divergência
- **THEN** o app navega para a tela de Diagnóstico, onde a correção pode ser aplicada

#### Scenario: Correção registra a mudança

- **WHEN** o usuário opta por corrigir uma divergência
- **THEN** um movimento de ajuste é gravado, e a quantidade não é alterada em silêncio
