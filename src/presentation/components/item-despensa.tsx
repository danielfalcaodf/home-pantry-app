import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { corDoEstado } from '../theme/cor-do-estado';
import { ALTURA_ITEM, espaco, raio } from '../theme/espaco';
import { DURACAO_FADE } from '../theme/movimento';
import { useTheme } from '../theme/provider';
import { BotaoReporRapido } from './botao-repor-rapido';
import { EstadoDoMedidor, MedidorNivel } from './medidor-nivel';
import { StepperConsumo } from './stepper-consumo';
import { Texto } from './texto';

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
  /** Rótulo do leitor de tela para o botão de repor rápido (design system:
   *  um botão de repor sempre visível ao lado do de usar). */
  rotuloAcaoReposicao?: string;
  onAbrir: () => void;
  onConsumir?: () => void;
  onAbrirTeclado?: () => void;
  onRepor?: () => void;
  /** Falso na primeira pintura: nenhuma entrada em cascata na lista. */
  animar?: boolean;
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
  rotuloAcaoReposicao,
  onAbrir,
  onConsumir,
  onAbrirTeclado,
  onRepor,
  animar = true,
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
      <MedidorNivel fracao={fracao} estado={estado} temSobra={temSobra} animar={animar} />
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
            {/* Cross-fade curto: o número troca sem deslizar e sem contagem
                progressiva, que adicionariam latência percebida ao gesto. */}
            <Animated.View
              key={leitura}
              entering={FadeIn.duration(DURACAO_FADE)}
              exiting={FadeOut.duration(DURACAO_FADE)}
            >
              <Texto papel="data.md" tom="secondary">
                {leitura}
              </Texto>
            </Animated.View>
            <Texto papel="label" cor={corDoEstado(tema, estado)}>
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
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: espaco.sm }}>
          <StepperConsumo
            rotuloAcessivel={rotuloAcaoConsumo}
            desabilitado={zerado || !onConsumir}
            onRegistrar={() => onConsumir?.()}
            onAbrirTeclado={onAbrirTeclado}
          />
          {onRepor ? (
            <BotaoReporRapido
              rotuloAcessivel={rotuloAcaoReposicao ?? `Repor ${nome}`}
              onRegistrar={onRepor}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}
