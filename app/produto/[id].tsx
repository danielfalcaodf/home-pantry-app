import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { ProdutoNaDespensa } from '@/application/estoque/use-produtos';
import { useCategorias } from '@/application/estoque/use-categorias';
import {
  useEditarProduto,
  useProduto,
  useRemoverProduto,
} from '@/application/estoque/use-editar-produto';
import { normalizarCategoria } from '@/domain/produto/categoria';
import { centavos, formatarBRL } from '@/domain/shared/dinheiro';
import { deDecimal, formatarNumero, paraDecimal } from '@/domain/shared/quantidade';
import { rotuloDaUnidade } from '@/domain/shared/unidade';
import { Botao } from '@/presentation/components/botao';
import {
  FormularioProduto,
  ValoresDoProduto,
} from '@/presentation/components/formulario-produto';
import { TelaErro } from '@/presentation/components/tela-erro';
import { Texto } from '@/presentation/components/texto';
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
        {/* Quantidade atual é somente leitura: mudá-la gera movimento e é
            ajuste, que tem regra própria (D8). */}
        <Texto papel="display.lg">
          {formatarNumero(produto.quantidadeAtual)}{' '}
          {rotuloDaUnidade(produto.unidade, produto.quantidadeAtual !== 1000)}
        </Texto>
        <Texto papel="label" tom="secondary">
          {item.rotulo}
          {produto.valorUnitario > 0
            ? ` · costuma custar ${formatarBRL(produto.valorUnitario)}`
            : ''}
        </Texto>
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

      <View style={{ padding: espaco.lg }}>
        <Botao titulo="Tirar da despensa" variante="secundario" onPress={confirmarRemocao} />
      </View>
    </View>
  );
}
