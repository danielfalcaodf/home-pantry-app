import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
} from '@expo-google-fonts/ibm-plex-mono';
import {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
} from '@expo-google-fonts/ibm-plex-sans';

// Só os quatro pesos que a escala referencia. Peso medido automaticamente
// (não editar este número à mão) por src/shared/orcamento-de-fonte.test.ts,
// que compara contra o limiar de 400 KB de tipografia-carregada e falha só
// acima do limite rígido de regressão de 750 KB (ACHADO-021).
export const fontesDoApp = {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
};
