/**
 * O app formata e agrupa datas em hora local de propósito (ver spec
 * gasto-mensal, "Agrupamento por fuso horário local"). Para a suíte ser
 * determinística em qualquer máquina, o fuso do processo é fixado no do
 * usuário-alvo. Roda no processo principal do Jest antes de qualquer worker,
 * e sobrescreve um TZ herdado do ambiente externo — a config vence.
 */
module.exports = async () => {
  process.env.TZ = 'America/Sao_Paulo';
};
