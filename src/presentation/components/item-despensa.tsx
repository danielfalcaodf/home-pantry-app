import { Pressable, View } from 'react-native';

import { ALTURA_ITEM, ALVO_TOQUE_MINIMO, espaco, raio } from '../theme/espaco';
import { useTheme } from '../theme/provider';
import { EstadoDoMedidor, MedidorNivel } from './medidor-nivel';
import { Texto } from './texto';

const DIAMETRO_BOTAO = 40;
const OPACIDADE_ZERADO = 0.35;

export type ItemDespensaProps = {
  nome: string;
  categoria: string | null;
  /** Texto pronto, do tipo "2 de 3 pacotes" — nada é calculado aqui. */
  leitura: string;
  rotuloEstado: string;
  estado: EstadoDoMedidor;
  fracao: number;
  temSobra: boolean;
  /** Rótulo do leitor de tela para o botão, com a ação completa. */
  rotuloAcaoConsumo: string;
  onAbrir: () => void;
  onConsumir?: () => void;
};

/**
 * A linha: 68 pontos, raio zero, de borda a borda. Sem card, sem borda, sem
 * sombra — a hierarquia vem do nível de tinta (FRONTEND §5 e §7.1).
 */
export function ItemDespensa({
  nome,
  categoria,
  leitura,
  rotuloEstado,
  estado,
  fracao,
  temSobra,
  rotuloAcaoConsumo,
  onAbrir,
  onConsumir,
}: ItemDespensaProps) {
  const tema = useTheme();
  const zerado = estado === 'critico';

  return (
    <View
      style={{
        height: ALTURA_ITEM,
        borderRadius: raio.linha,
        borderBottomWidth: 1,
        borderBottomColor: tema.line.hairline,
        backgroundColor: tema.bg.base,
      }}
    >
      <MedidorNivel fracao={fracao} estado={estado} temSobra={temSobra} />
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
        <Pressable
          onPress={onAbrir}
          accessibilityRole="button"
          accessibilityLabel={`${nome}, ${leitura}, ${rotuloEstado}`}
          style={{
            flex: 1,
            height: '100%',
            justifyContent: 'center',
            paddingHorizontal: espaco.lg,
            gap: espaco.xs,
          }}
        >
          <Texto papel="body.lg" numberOfLines={1}>
            {nome}
          </Texto>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.sm }}>
            <Texto papel="data.md" tom="secondary">
              {leitura}
            </Texto>
            <Texto papel="label" cor={tema.state[estado]}>
              {rotuloEstado}
            </Texto>
            {categoria ? (
              <Texto papel="label" tom="secondary" numberOfLines={1}>
                {categoria}
              </Texto>
            ) : null}
          </View>
        </Pressable>
        {/* O botão permanece mesmo zerado, só esmaecido: removê-lo mudaria o
            layout da linha e quebraria o alinhamento da lista (FRONTEND §7.2). */}
        <Pressable
          onPress={onConsumir}
          disabled={zerado || !onConsumir}
          accessibilityRole="button"
          accessibilityLabel={rotuloAcaoConsumo}
          accessibilityState={{ disabled: zerado || !onConsumir }}
          style={{
            width: ALVO_TOQUE_MINIMO,
            height: ALVO_TOQUE_MINIMO,
            marginRight: espaco.md,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: zerado ? OPACIDADE_ZERADO : 1,
          }}
        >
          <View
            style={{
              width: DIAMETRO_BOTAO,
              height: DIAMETRO_BOTAO,
              borderRadius: raio.pilula,
              borderWidth: 1,
              borderColor: tema.line.hairline,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Texto papel="body.lg" tom="secondary">
              −
            </Texto>
          </View>
        </Pressable>
      </View>
    </View>
  );
}
