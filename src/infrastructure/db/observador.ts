import { addDatabaseChangeListener } from 'expo-sqlite';

import { ObservadorDeMudancas } from '../../ports/observador-de-mudancas';

export const observadorDoBanco: ObservadorDeMudancas = {
  assinar(ouvinte) {
    const inscricao = addDatabaseChangeListener(() => ouvinte());
    return () => inscricao.remove();
  },
};
