import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { corDoEstado } from '../theme/cor-do-estado';
import { sobrepor } from '../theme/contraste';
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
  /** Repassado ao `MedidorNivel` — identidade da linha por trás da célula
   *  reciclada pela `FlashList` (correcao-reciclagem-de-lista-anima-item-errado). */
  idDoItem?: string;
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
  idDoItem,
}: ItemDespensaProps) {
  const tema = useTheme();
  const zerado = estado === 'critico';
  const full = estado === 'ok';

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
      <MedidorNivel
        fracao={fracao}
        estado={estado}
        temSobra={temSobra}
        animar={animar}
        idDoItem={idDoItem}
      />
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
          }}
        >
          {/* Zerado ("Acabou") não tem tinta atrás (design: "zerado = sem
              tinta, só a régua na base") — nada pra colidir, nome e leitura
              ficam em texto simples. Nos demais estados a tinta preenche
              atrás e pode colidir com o texto — nome e leitura ganham um
              chip semitransparente (45%, cor do estado) igual ao do rótulo,
              que é a única peça que SEMPRE tem chip, mesmo zerado
              (correcao-regua-risca-texto-medidor). */}
          <View style={{ gap: espaco.xs }}>
            {(zerado || full)? (
              <Texto papel="body.lg" numberOfLines={1}>
                {nome}
              </Texto>
            ) : (
              <View
                style={{
                  alignSelf: 'flex-start',
                  maxWidth: '100%',
                  backgroundColor: sobrepor(corDoEstado(tema, estado), tema.bg.base, 0.15),
                  borderRadius: raio.pilula,
                  paddingHorizontal: espaco.sm,
                  paddingVertical: espaco.xs,
                }}
              >
                <Texto papel="body.lg" numberOfLines={1}>
                  {nome}
                </Texto>
              </View>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.sm }}>
              {/* Cross-fade curto: o número troca sem deslizar e sem contagem
                  progressiva, que adicionariam latência percebida ao gesto. */}
              <Animated.View
                key={leitura}
                entering={FadeIn.duration(DURACAO_FADE)}
                exiting={FadeOut.duration(DURACAO_FADE)}
              >
                {(zerado || full) ? (
                  <Texto papel="data.md" tom="secondary">
                    {leitura}
                  </Texto>
                ) : (
                  <View
                    style={{
                      backgroundColor: sobrepor(corDoEstado(tema, estado), tema.bg.base, 0.15),
                      borderRadius: raio.pilula,
                      paddingHorizontal: espaco.sm,
                      paddingVertical: espaco.xs,
                    }}
                  >
                    <Texto papel="data.md" tom="secondary">
                      {leitura}
                    </Texto>
                  </View>
                )}
              </Animated.View>
              {/* O chip do rótulo de estado nunca some, nem zerado — é o
                  único texto que precisa continuar lendo "Acabou" claramente
                  mesmo sem tinta nenhuma atrás dele. */}
              <View
                style={{
                  backgroundColor: sobrepor(corDoEstado(tema, estado), tema.bg.base, 0.45),
                  borderRadius: raio.pilula,
                  paddingHorizontal: espaco.sm,
                  paddingVertical: espaco.xs,
                }}
              >
                <Texto papel="caption" cor={corDoEstado(tema, estado)}>
                  {rotuloEstado}
                </Texto>
              </View>
              {categoria ? (
                <Texto papel="label" tom="secondary" numberOfLines={1}>
                  {categoria}
                </Texto>
              ) : null}
            </View>
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
              onAbrirTeclado={onAbrirTeclado}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}
