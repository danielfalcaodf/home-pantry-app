// O domínio nunca chama Date.now() — a hora entra por esta interface,
// o que mantém os testes determinísticos sem mock global.
export interface Clock {
  agora(): number;
}
