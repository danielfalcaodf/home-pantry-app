import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { ProdutoNaDespensa } from '@/application/estoque/use-produtos';
import { useAjustarEstoque } from '@/application/estoque/use-ajustar-estoque';
import { useCategorias } from '@/application/estoque/use-categorias';
import { useDarBaixa } from '@/application/estoque/use-dar-baixa';
import { useDesfazerMovimento } from '@/application/estoque/use-desfazer-movimento';
import {
  useEditarProduto,
  useProduto,
  useRemoverProduto,
} from '@/application/estoque/use-editar-produto';
import { useReporPontual } from '@/application/estoque/use-repor-pontual';
import { useResumoHistoricoRecente } from '@/application/estoque/use-resumo-historico';
import { normalizarCategoria } from '@/domain/produto/categoria';
import { centavos, formatarBRL } from '@/domain/shared/dinheiro';
import { deDecimal, formatarNumero, milesimos, paraDecimal } from '@/domain/shared/quantidade';
import { MotivoAjuste } from '@/domain/movimento/movimento';
import { rotuloDaUnidade } from '@/domain/shared/unidade';
import { Botao } from '@/presentation/components/botao';
import {
  FormularioProduto,
  ValoresDoProduto,
} from '@/presentation/components/formulario-produto';
import { SheetAjusteEstoque } from '@/presentation/components/sheet-ajuste-estoque';
import { TecladoQuantidade } from '@/presentation/components/teclado-quantidade';
import { TelaErro } from '@/presentation/components/tela-erro';
import { Texto } from '@/presentation/components/texto';
import { Toast } from '@/presentation/components/toast';
import { ToastDesfazer } from '@/presentation/components/toast-desfazer';
import {
  mensagemDeAjuste,
  MENSAGEM_AJUSTE_SEM_MUDANCA,
  MENSAGEM_FALHA_AO_GRAVAR,
} from '@/presentation/format/mensagem-de-registro';
import { useRegistroDeConsumo } from '@/presentation/components/use-registro-de-consumo';
import { espaco } from '@/presentation/theme/espaco';
import { useTheme } from '@/presentation/theme/provider';

function valoresDoItem(item: ProdutoNaDespensa): ValoresDoProduto {
  const { produto } = item;
  return {
    nome: produto.nome,
    unidade: produto.unidade,
    quantidadeNecessaria: String(paraDecimal(produto.quantidadeNecessaria)).replace('.', ','),
    quantidadeAtual: '',
    valorUnitario:
      produto.valorUnitario > 0 ? String(produto.valorUnitario / 100).replace('.', ',') : '',
    categoria: produto.categoria ?? '',
    marcaPreferida: produto.marcaPreferida ?? '',
    observacao: produto.observacao ?? '',
  };
}

export default function DetalheProduto() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { item, carregando } = useProduto(id);

  if (carregando) {
    return null;
  }
  if (!item) {
    return (
      <TelaErro
        titulo="Esse item não está mais na sua despensa"
        descricao="Ele pode ter sido apagado. Volte para ver o que você tem."
        acao={{ titulo: 'Voltar para a despensa', onPress: () => router.back() }}
      />
    );
  }
  // Só monta o formulário com o item em mãos: assim o estado inicial nasce
  // pronto, sem um efeito de sincronização que dispararia render em cascata.
  return <Detalhe id={id} item={item} />;
}

function Detalhe({ id, item }: { id: string; item: ProdutoNaDespensa }) {
  const tema = useTheme();
  const categorias = useCategorias();
  const { editar } = useEditarProduto();
  const { remover } = useRemoverProduto();

  const [valores, setValores] = useState<ValoresDoProduto>(() => valoresDoItem(item));
  const [erros, setErros] = useState<Partial<Record<keyof ValoresDoProduto, string>>>({});
  const [tecladoAberto, setTecladoAberto] = useState(false);
  const [ajusteAberto, setAjusteAberto] = useState(false);
  const [avisoDeAjuste, setAvisoDeAjuste] = useState<string | null>(null);

  // Mesmos casos de uso da lista: o efeito pelo detalhe é idêntico.
  const { registrar: registrarConsumo } = useDarBaixa();
  const { registrar: registrarReposicao } = useReporPontual();
  const { ajustar } = useAjustarEstoque();
  const { desfazer } = useDesfazerMovimento();
  const confirmacao = useRegistroDeConsumo();
  const resumoHistorico = useResumoHistoricoRecente(id);

  async function usar(quantidade = milesimos(1000)) {
    const resultado = await registrarConsumo(id, quantidade);
    confirmacao.anunciar(resultado, item.produto, quantidade, 'consumo');
  }

  async function repor(quantidade = milesimos(1000)) {
    const resultado = await registrarReposicao(id, quantidade);
    confirmacao.anunciar(resultado, item.produto, quantidade, 'reposicao');
  }

  // Caminho de correção (design D3): o toque na quantidade atual abre este
  // fluxo — o resultado é idêntico ao de um ajuste feito por qualquer outro
  // caminho (tasks 2.1, 2.5), nunca um campo de formulário comum (task 2.2).
  async function corrigirQuantidade({
    valorFinal,
    motivo,
  }: {
    valorFinal: number;
    motivo: MotivoAjuste | null;
  }) {
    const resultado = await ajustar(id, item.produto.quantidadeAtual, deDecimal(valorFinal), motivo);
    if ('erro' in resultado) {
      setAvisoDeAjuste(MENSAGEM_FALHA_AO_GRAVAR);
      return;
    }
    if (!resultado.ajustou) {
      setAvisoDeAjuste(resultado.motivo === 'sem_mudanca' ? MENSAGEM_AJUSTE_SEM_MUDANCA : MENSAGEM_FALHA_AO_GRAVAR);
      return;
    }
    setAvisoDeAjuste(mensagemDeAjuste(item.produto.nome, deDecimal(valorFinal), item.produto.unidade));
  }

  async function salvar() {
    const quantidade = Number(valores.quantidadeNecessaria.replace(',', '.'));
    if (!(quantidade > 0)) {
      setErros({ quantidadeNecessaria: 'Diga quanto você quer ter em casa' });
      return;
    }
    const preco = valores.valorUnitario
      ? Math.round(Number(valores.valorUnitario.replace(',', '.')) * 100)
      : 0;
    const resultado = await editar(id, {
      nome: valores.nome.trim(),
      unidade: valores.unidade,
      quantidadeNecessaria: deDecimal(quantidade),
      valorUnitario: centavos(preco),
      categoria: normalizarCategoria(valores.categoria),
    });
    if (!resultado.ok) {
      setErros({ [resultado.erro.campo]: resultado.erro.mensagem });
      return;
    }
    setErros({});
    router.back();
  }

  function confirmarRemocao() {
    Alert.alert(
      `Tirar ${item.produto.nome} da despensa?`,
      'O histórico de uso continua guardado.',
      [
        { text: 'Manter', style: 'cancel' },
        {
          text: 'Tirar da despensa',
          style: 'destructive',
          onPress: async () => {
            await remover(id);
            router.back();
          },
        },
      ],
    );
  }

  const { produto } = item;

  return (
    <View style={{ flex: 1, backgroundColor: tema.bg.base }}>
      <View style={{ padding: espaco.lg, gap: espaco.xs }}>
        {/* O toque abre o caminho de ajuste (design D3) — a quantidade
            atual nunca é um campo de formulário comum (task 2.2). */}
        <Pressable
          onPress={() => setAjusteAberto(true)}
          accessibilityRole="button"
          accessibilityLabel="Corrigir quantidade atual"
        >
          <Texto papel="display.lg">
            {formatarNumero(produto.quantidadeAtual)}{' '}
            {rotuloDaUnidade(produto.unidade, produto.quantidadeAtual !== 1000)}
          </Texto>
        </Pressable>
        <Texto papel="label" tom="secondary">
          {item.rotulo}
          {produto.valorUnitario > 0
            ? ` · costuma custar ${formatarBRL(produto.valorUnitario)}`
            : ''}
        </Texto>
      </View>

      {/* Caminho visível para as mesmas ações do toque longo na lista:
          gesto invisível não pode ser o único acesso (FRONTEND §10). */}
      <View style={{ flexDirection: 'row', gap: espaco.md, paddingHorizontal: espaco.lg }}>
        <View style={{ flex: 1 }}>
          <Botao
            titulo="Usei"
            onPress={() => void usar()}
            disabled={produto.quantidadeAtual <= 0}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Botao titulo="Repus" variante="secundario" onPress={() => void repor()} />
        </View>
        <View style={{ flex: 1 }}>
          <Botao
            titulo="Outra quantidade"
            variante="secundario"
            onPress={() => setTecladoAberto(true)}
          />
        </View>
      </View>

      <FormularioProduto
        valores={valores}
        aoMudar={setValores}
        erros={erros}
        categoriasExistentes={categorias}
        tituloAcao="Salvar"
        aoSalvar={salvar}
        quantidadeAtualEditavel={false}
      />

      {/* Resumo do histórico (task 5.10): a mesma confiança de que o app
          registra o que deveria, com acesso ao histórico completo. */}
      {!resumoHistorico.carregando ? (
        <Pressable
          onPress={() => router.push(`/produto/${id}/historico`)}
          accessibilityRole="button"
          accessibilityLabel="Ver histórico completo"
          style={{ paddingHorizontal: espaco.lg, paddingVertical: espaco.sm }}
        >
          <Texto papel="label" tom="secondary">
            {resumoHistorico.quantidadeDeUsos === 0
              ? 'Sem uso registrado nos últimos 30 dias'
              : resumoHistorico.quantidadeDeUsos === 1
                ? 'Você anotou 1 uso nos últimos 30 dias'
                : `Você anotou ${resumoHistorico.quantidadeDeUsos} usos nos últimos 30 dias`}
          </Texto>
        </Pressable>
      ) : null}

      <View style={{ padding: espaco.lg }}>
        <Botao titulo="Tirar da despensa" variante="secundario" onPress={confirmarRemocao} />
      </View>

      <ToastDesfazer
        registro={confirmacao.registro}
        onDesfazer={(movimentoId) => {
          void desfazer(movimentoId);
          confirmacao.limpar();
        }}
        onFim={confirmacao.limpar}
      />
      {confirmacao.aviso && !confirmacao.registro ? (
        <Toast mensagem={confirmacao.aviso} onFim={confirmacao.limpar} />
      ) : null}
      {avisoDeAjuste ? (
        <Toast mensagem={avisoDeAjuste} onFim={() => setAvisoDeAjuste(null)} />
      ) : null}

      {tecladoAberto ? (
        <TecladoQuantidade
          visivel
          nomeDoItem={produto.nome}
          unidade={produto.unidade}
          onFechar={() => setTecladoAberto(false)}
          onUsei={(quantidade) => void usar(deDecimal(quantidade))}
          onRepus={(quantidade) => void repor(deDecimal(quantidade))}
        />
      ) : null}

      <SheetAjusteEstoque
        visivel={ajusteAberto}
        nome={produto.nome}
        unidade={produto.unidade}
        quantidadeAtual={paraDecimal(produto.quantidadeAtual)}
        onFechar={() => setAjusteAberto(false)}
        onSalvar={(dados) => void corrigirQuantidade(dados)}
      />
    </View>
  );
}
