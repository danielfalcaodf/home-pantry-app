import { useEffect } from 'react';
import { BackHandler, Keyboard } from 'react-native';

/**
 * Voltar (hardware/gesto) com o teclado aberto fecha só o teclado, mantendo
 * o usuário na tela — sem isso, o back expulsa a pessoa no meio da digitação
 * (ACHADO-056). Com o teclado fechado, a navegação segue o padrão do sistema.
 */
export function useVoltarFechaTeclado() {
  useEffect(() => {
    const assinatura = BackHandler.addEventListener('hardwareBackPress', () => {
      if (Keyboard.isVisible()) {
        Keyboard.dismiss();
        return true;
      }
      return false;
    });
    return () => assinatura.remove();
  }, []);
}
