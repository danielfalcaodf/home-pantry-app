---
id: ACHADO-040
pr: 9
change: 2026-08-03-backup-restore-json
capability: exportacao-de-backup
severidade: baixa
fase: F3
estado: virou-change
change-correcao: configuracoes-e-backup
---
## O que quebra

`ExpoSistemaDeArquivos` — o adaptador real que fala com `expo-sharing`, `expo-document-picker` e `expo-file-system` para compartilhar/ler arquivos de backup — não tem nenhum teste próprio. Toda a cobertura de exportação/restauração usa o dublê `SistemaDeArquivosFalso`, então o código que de fato integra com as APIs nativas nunca é exercitado.

## Como reproduzir

```
find src -iname "*sistema-de-arquivos*test*"
```
Não retorna nenhum arquivo para `src/infrastructure/sistema-de-arquivos/expo-sistema-de-arquivos.ts`.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-03-backup-restore-json/specs/exportacao-de-backup/spec.md`, cenário "Compartilhamento acionado": "a folha de compartilhamento do sistema abre com o arquivo pronto."

## Observado (saída real, caminho:linha)

`src/infrastructure/sistema-de-arquivos/expo-sistema-de-arquivos.ts:8-22` (`Sharing.shareAsync`) sem teste que mocke `expo-sharing` e verifique a chamada.

## Change sugerida (slug proposto, escopo de uma frase)

`teste-expo-sistema-de-arquivos`: Jest com `expo-sharing`/`expo-document-picker`/`expo-file-system` mockados, cobrindo o adaptador real (não só o dublê usado pelos hooks).
