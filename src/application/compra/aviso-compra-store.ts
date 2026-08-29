import { create } from 'zustand';

/**
 * Estado global de UI mínimo (CLAUDE.md: "se precisar de estado global de
 * UI, Zustand") — só pro caso em que a mensagem de sucesso precisa
 * atravessar a navegação: fechar a compra sai direto pra Despensa (achado
 * de QA, esperar o toast local travava quem só quer sair), então o toast
 * não pode ser estado da tela de Compra, que já desmontou. Passar por
 * parâmetro de rota não funciona aqui porque a aba Despensa já costuma
 * estar montada — `useLocalSearchParams` de uma aba já viva não reage à
 * navegação vinda de fora do grupo de abas.
 */
type AvisoCompraState = {
  mensagem: string | null;
  definir: (mensagem: string) => void;
  limpar: () => void;
};

export const useAvisoCompraStore = create<AvisoCompraState>((set) => ({
  mensagem: null,
  definir: (mensagem) => set({ mensagem }),
  limpar: () => set({ mensagem: null }),
}));
