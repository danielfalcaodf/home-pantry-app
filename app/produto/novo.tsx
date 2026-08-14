import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { useCadastrarProduto } from '@/application/estoque/use-cadastrar-produto';
import { useCategorias } from '@/application/estoque/use-categorias';
import { useProdutos } from '@/application/estoque/use-produtos';
import {
  FormularioProduto,
  LIMITE_SANIDADE_QUANTIDADE,
  LIMITE_SANIDADE_VALOR,
  ValoresDoProduto,
  VALORES_INICIAIS,
} from '@/presentation/components/formulario-produto';
import { normalizarParaBusca } from '@/presentation/format/normalizar-busca';

const ATRASO_CHECAGEM_NOME = 400;

export default function NovoProduto() {
  const { nome: nomeInicial } = useLocalSearchParams<{ nome?: string }>();
  const [valores, setValores] = useState<ValoresDoProduto>({
    ...VALORES_INICIAIS,
    nome: nomeInicial ?? '',
  });
  const [erros, setErros] = useState<Partial<Record<keyof ValoresDoProduto, string>>>({});
  const [duplicado, setDuplicado] = useState<{ id: string; nome: string } | null>(null);

  const categorias = useCategorias();
  const { itens } = useProdutos();
  const { cadastrar, salvando } = useCadastrarProduto();

  // Checagem após a parada da digitação, nunca a cada tecla: no campo de nome
  // a latência é percebida imediatamente.
  useEffect(() => {
    const alvo = normalizarParaBusca(valores.nome);
    const temporizador = setTimeout(() => {
      const existente =
        alvo === ''
          ? undefined
          : itens.find((item) => normalizarParaBusca(item.produto.nome) === alvo);
      setDuplicado(existente ? { id: existente.produto.id, nome: existente.produto.nome } : null);
    }, ATRASO_CHECAGEM_NOME);
    return () => clearTimeout(temporizador);
  }, [valores.nome, itens]);

  async function salvar() {
    const quantidadeNecessaria = Number(valores.quantidadeNecessaria.replace(',', '.'));
    if (quantidadeNecessaria > LIMITE_SANIDADE_QUANTIDADE) {
      setErros({ quantidadeNecessaria: `Valor muito alto — no máximo ${LIMITE_SANIDADE_QUANTIDADE}` });
      return;
    }
    const quantidadeAtual = valores.quantidadeAtual
      ? Number(valores.quantidadeAtual.replace(',', '.'))
      : undefined;
    if (quantidadeAtual !== undefined && quantidadeAtual > LIMITE_SANIDADE_QUANTIDADE) {
      setErros({ quantidadeAtual: `Valor muito alto — no máximo ${LIMITE_SANIDADE_QUANTIDADE}` });
      return;
    }
    const valorUnitario = valores.valorUnitario
      ? Number(valores.valorUnitario.replace(',', '.'))
      : undefined;
    if (valorUnitario !== undefined && valorUnitario > LIMITE_SANIDADE_VALOR) {
      setErros({ valorUnitario: `Valor muito alto — no máximo ${LIMITE_SANIDADE_VALOR}` });
      return;
    }
    const resultado = await cadastrar({
      nome: valores.nome,
      unidade: valores.unidade,
      quantidadeNecessaria,
      quantidadeAtual,
      valorUnitario: valorUnitario !== undefined ? Math.round(valorUnitario * 100) : undefined,
      categoria: valores.categoria || undefined,
    });

    if (!resultado.ok) {
      setErros({ [resultado.erro.campo]: resultado.erro.mensagem });
      return;
    }
    setErros({});
    router.back();
  }

  return (
    <FormularioProduto
      valores={valores}
      aoMudar={setValores}
      erros={erros}
      categoriasExistentes={categorias}
      tituloCabecalho="Novo produto"
      tituloAcao="Adicionar à despensa"
      autofocarNome
      aoSalvar={salvar}
      salvando={salvando}
      avisoDeNome={
        duplicado
          ? {
              mensagem: `Já existe um item chamado ${duplicado.nome} na sua despensa.`,
              acoes: [
                {
                  titulo: 'Ver o item',
                  onPress: () => router.replace(`/produto/${duplicado.id}`),
                },
                {
                  titulo: 'Usar outro nome',
                  onPress: () => setValores({ ...valores, nome: `${valores.nome} ` }),
                },
              ],
            }
          : undefined
      }
    />
  );
}
