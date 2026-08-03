import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

import { useGastoMensal } from '@/application/resumo/use-gasto-mensal';
import { useResumoDeValores } from '@/application/resumo/use-resumo-valores';
import { EstadoItem } from '@/domain/produto/estoque.rules';
import { formatarBRL } from '@/domain/shared/dinheiro';
import { ChipEstado } from '@/presentation/components/chip-estado';
import { Texto } from '@/presentation/components/texto';
import { corDoEstado } from '@/presentation/theme/cor-do-estado';
import { espaco } from '@/presentation/theme/espaco';
import { useTheme } from '@/presentation/theme/provider';
import { rotuloDoMes } from '@/presentation/format/gasto-mensal';

const ESTADOS: { valor: EstadoItem; rotulo: string }[] = [
  { valor: 'critico', rotulo: 'Acabou' },
  { valor: 'emFalta', rotulo: 'Faltando' },
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

  if (resumo.carregando || gastoMensal.carregando) {
    return null;
  }

  const nenhumaCompraFechada = gastoMensal.meses.every((mes) => mes.qtdCompras === 0);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: tema.bg.base }}>
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
                contagem={resumo.contagensPorEstado[valor]}
                cor={corDoEstado(tema, valor)}
                onPress={() => router.push(`/?filtro=${valor}`)}
              />
            ))}
          </View>
        </View>

        <View style={{ gap: espaco.sm }}>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Texto papel="label" tom="secondary">
              Gasto por mês
            </Texto>
            <Texto
              papel="body.md"
              cor={tema.action.azulejo}
              onPress={() => router.push('/compra/historico')}
            >
              Ver histórico
            </Texto>
          </View>
          {nenhumaCompraFechada ? (
            <Texto papel="body.md" tom="secondary">
              Nenhuma compra fechada ainda. Assim que você fechar a primeira, o gasto do mês
              aparece aqui.
            </Texto>
          ) : (
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
  );
}
