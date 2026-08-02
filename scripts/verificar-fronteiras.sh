#!/usr/bin/env bash
# Teste de conformidade da regra de dependência (ARQUITETURA §2.1):
# src/domain/ é TypeScript puro — nenhum import de expo, react, drizzle ou @react.
# Sai com código != 0 se houver qualquer violação.
set -u

VIOLACOES=$(grep -rE "from ['\"](expo|react|drizzle|@react)" src/domain/ 2>/dev/null)

if [ -n "$VIOLACOES" ]; then
  echo "Violação de fronteira: src/domain/ importa dependência externa:" >&2
  echo "$VIOLACOES" >&2
  exit 1
fi

echo "Fronteiras OK: src/domain/ é TypeScript puro."
