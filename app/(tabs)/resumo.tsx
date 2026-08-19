import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { useGastoMensal } from '@/application/resumo/use-gasto-mensal';
import { useResumoDeValores } from '@/application/resumo/use-resumo-valores';
import { formatarBRL } from '@/domain/shared/dinheiro';
import { AcaoSecundaria } from '@/presentation/components/acao-secundaria';
import { ChipEstado } from '@/presentation/components/chip-estado';
import { GraficoBarras } from '@/presentation/components/grafico-barras';
import { TelaBase } from '@/presentation/components/tela-base';
import { Texto } from '@/presentation/components/texto';
import { contarPorEstado, FiltroEstado } from '@/presentation/format/agrupar-despensa';
import { corDoEstado } from '@/presentation/theme/cor-do-estado';
import { ALVO_TOQUE_MINIMO, espaco } from '@/presentation/theme/espaco';
import { useTheme } from '@/presentation/theme/provider';
import { rotuloDoMes } from '@/presentation/format/gasto-mensal';

const MESES_NO_GRAFICO = 4;

function rotuloCurtoDoMes(mes: string): string {
  return rotuloDoMes(mes).slice(0, 3);
}

// 'faltando' soma critico + emFalta (mesma semântica do chip "Faltando" da
// Despensa — spec resumo-de-valores, "Faltando idêntico ao da Despensa").
const ESTADOS: { valor: Exclude<FiltroEstado, 'tudo'>; rotulo: string }[] = [
  { valor: 'critico', rotulo: 'Acabou' },
  { valor: 'faltando', rotulo: 'Faltando' },
  { valor: 'ok', rotulo: 'Cheio' },
];

/**
 * Única tela onde números grandes são permitidos (FRONTEND §8.4) — por isso
 * o único lugar do app que usa o papel `data.xl`. Os dois valores nunca se
 * somam (design D2): patrimônio (o que está em casa) e despesa futura (o
 * que falta comprar) são blocos distintos, com rótulo próprio.
 */
export default function Resumo() {
  const tema = useTheme();
  const resumo = useResumoDeValores();
  const gastoMensal = useGastoMensal();
  const contagens = useMemo(
    () => contarPorEstado(resumo.itensDaDespensaPorEstado),
    [resumo.itensDaDespensaPorEstado],
  );

  if (resumo.carregando || gastoMensal.carregando) {
    return null;
  }

  const nenhumaCompraFechada = gastoMensal.meses.every((mes) => mes.qtdCompras === 0);

  return (
    <TelaBase>
      <ScrollView style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: espaco.lg,
          paddingTop: espaco.lg,
        }}
      >
        <Texto papel="display.sm">Resumo</Texto>
        {/* Alcançável sem navegação profunda (task 6.1): um toque a partir de uma tela principal. */}
        <Pressable
          onPress={() => router.push('/configuracoes')}
          accessibilityRole="button"
          accessibilityLabel="Configurações"
          hitSlop={8}
          style={{ minHeight: ALVO_TOQUE_MINIMO, justifyContent: 'center' }}
        >
          <Texto papel="body.md" cor={tema.action.azulejo}>
            Configurações
          </Texto>
        </Pressable>
      </View>

      <View style={{ padding: espaco.lg, gap: espaco.xl }}>
        <View style={{ gap: espaco.xs }}>
          <Texto papel="label" tom="secondary">
            Em casa
          </Texto>
          <Texto papel="data.xl">{formatarBRL(resumo.valorDoEstoque)}</Texto>
          {resumo.contagemSemPrecoEstoque > 0 ? (
            <Texto papel="label" tom="secondary">
              {resumo.contagemSemPrecoEstoque}{' '}
              {resumo.contagemSemPrecoEstoque !== 1 ? 'itens sem preço' : 'item sem preço'} — valor
              parcial
            </Texto>
          ) : null}
        </View>

        <View style={{ gap: espaco.xs }}>
          <Texto papel="label" tom="secondary">
            Falta comprar
          </Texto>
          <Texto papel="data.xl">{formatarBRL(resumo.valorDaLista)}</Texto>
          {resumo.contagemSemPrecoLista > 0 ? (
            <Texto papel="label" tom="secondary">
              {resumo.contagemSemPrecoLista}{' '}
              {resumo.contagemSemPrecoLista !== 1 ? 'itens sem preço' : 'item sem preço'} — valor
              parcial
            </Texto>
          ) : null}
        </View>

        <View style={{ gap: espaco.sm }}>
          <Texto papel="label" tom="secondary">
            Sua despensa
          </Texto>
          <View style={{ flexDirection: 'row', gap: espaco.sm, flexWrap: 'wrap' }}>
            {ESTADOS.map(({ valor, rotulo }) => (
              <ChipEstado
                key={valor}
                rotulo={rotulo}
                contagem={contagens[valor]}
                cor={corDoEstado(tema, valor === 'faltando' ? 'emFalta' : valor)}
                onPress={() => router.push(`/?filtro=${valor}`)}
              />
            ))}
          </View>
        </View>

        <View style={{ gap: espaco.xs }}>
          <Texto papel="label" tom="secondary">
            Gasto este mês
          </Texto>
          <Texto papel="data.xl">{formatarBRL(gastoMensal.meses[0]?.totalPago ?? 0)}</Texto>
        </View>

        <View style={{ gap: espaco.sm }}>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Texto papel="label" tom="secondary">
              Gasto por mês
            </Texto>
            <AcaoSecundaria
              titulo="Ver histórico"
              papel="body.md"
              cor={tema.action.azulejo}
              onPress={() => router.push('/compra/historico')}
              style={{ paddingHorizontal: 0 }}
            />
          </View>
          {nenhumaCompraFechada ? (
            <Texto papel="body.md" tom="secondary">
              Nenhuma compra fechada ainda. Assim que você fechar a primeira, o gasto do mês
              aparece aqui.
            </Texto>
          ) : (
            <GraficoBarras
              altura={96}
              dados={[...gastoMensal.meses]
                .slice(0, MESES_NO_GRAFICO)
                .reverse()
                .map((mes) => ({
                  chave: mes.mes,
                  rotulo: rotuloCurtoDoMes(mes.mes),
                  valor: mes.totalPago,
                }))}
            />
          )}
          {nenhumaCompraFechada ? null : (
            gastoMensal.meses.map((mes) => (
              <View
                key={mes.mes}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: espaco.xs,
                  borderBottomWidth: 1,
                  borderBottomColor: tema.line.hairline,
                }}
              >
                <Texto papel="body.md" tom={mes.qtdCompras === 0 ? 'secondary' : 'primary'}>
                  {rotuloDoMes(mes.mes)}
                </Texto>
                <Texto papel="data.md" tom={mes.qtdCompras === 0 ? 'secondary' : 'primary'}>
                  {mes.qtdCompras === 0 ? '—' : formatarBRL(mes.totalPago)}
                </Texto>
              </View>
            ))
          )}
        </View>
      </View>
      </ScrollView>
    </TelaBase>
  );
}
