export type Result<T, E> = { ok: true; valor: T } | { ok: false; erro: E };

export function sucesso<T>(valor: T): { ok: true; valor: T } {
  return { ok: true, valor };
}

export function falha<E>(erro: E): { ok: false; erro: E } {
  return { ok: false, erro };
}
