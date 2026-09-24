
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  collection,
  onSnapshot,
} from "firebase/firestore";

import { db } from "../firebase/config";

import { ParceirosCarrossel } from "./ParceirosCarrossel";

import "../styles/catalogo-cliente.css";

// =====================================================
// TIPOS
// =====================================================

type Categoria =
  | "Hambúrgueres"
  | "Pizzarias"
  | "Jantinhas e Espetinhos"
  | "Almoço e Comida Caseira"
  | "Gastronomia Especial"
  | "Cafeterias e Sobremesas";

type ModalidadeEntrega =
  | "entrega_propria"
  | "retirada_anfitriao";

interface RestaurantePublico {
  id: string;
  nome: string;
  categoria: string;
  descricao: string;
  whatsapp: string;
  telefone: string;
  modalidadeEntrega: ModalidadeEntrega;
  horarioFuncionamento: string;
  logoUrl: string;
  imagemCapa: string;
  endereco: string;
  ativo: boolean;
  aceitaRetirada: boolean;
}

interface PratoPublico {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  pessoas: number;
  imagemUrl: string;
  disponivel: boolean;
  status: string;
}

interface ItemCarrinho {
  restauranteId: string;
  restauranteNome: string;
  pratoId: string;
  imagemUrl: string;
  nome: string;
  preco: number;
  quantidade: number;
  observacao: string;
}

interface ItemConsultaValidado {
  pratoId: string;
  nome: string;
  descricao: string;
  imagemUrl: string;
  precoUnitario: number;
  quantidade: number;
  subtotal: number;
  observacao: string;
}

interface RespostaConsulta {
  sucesso: boolean;
  erro?: string;
  consultaId?: string;
  restauranteNome?: string;
  restauranteWhatsapp?: string;
  subtotal?: number;
  taxaEntrega?: number;
  totalEstimado?: number;
  atendimento?: Atendimento;
  atendimentoDescricao?: string;
  pagamento?: Pagamento;
  pagamentoDescricao?: string;
  totalItens?: number;
  itens?: ItemConsultaValidado[];
}

// =====================================================
// CATEGORIAS
// =====================================================

const TAXA_ENTREGA_ESTIMADA = 20;
// Ativar apenas depois que registrar-consulta validar e persistir atendimento,
// pagamento, taxa e total no servidor.
const CHECKOUT_VALIDADO_NO_SERVIDOR = true;

type Atendimento = "entrega" | "retirada_restaurante" | "retirada_anfitriao";
type Pagamento = "pix" | "credito" | "debito" | "dinheiro";

const categorias: Array<{
  nome: "Todos" | Categoria;
  icone: string;
}> = [
  {
    nome: "Todos",
    icone: "✨",
  },
  {
    nome: "Hambúrgueres",
    icone: "🍔",
  },
  {
    nome: "Pizzarias",
    icone: "🍕",
  },
  {
    nome: "Jantinhas e Espetinhos",
    icone: "🍢",
  },
  {
    nome: "Almoço e Comida Caseira",
    icone: "🍛",
  },
  {
    nome: "Gastronomia Especial",
    icone: "🍝",
  },
  {
    nome: "Cafeterias e Sobremesas",
    icone: "☕",
  },
];

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}

function dinheiro(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function mensagemErro(erro: unknown): string {
  if (
    typeof erro === "object" &&
    erro !== null &&
    "code" in erro &&
    erro.code === "permission-denied"
  ) {
    return (
      "O Firebase bloqueou a consulta pública. " +
      "Confira as regras de leitura da coleção catalogoPublico."
    );
  }

  return "Não foi possível carregar os dados do catálogo.";
}

function chavePrato(
  restauranteId: string,
  pratoId: string
): string {
  return `${restauranteId}/${pratoId}`;
}

// =====================================================
// COMPONENTE
// =====================================================

interface CatalogoConteudoProps {
  temaCliente?: boolean;
}

export function CatalogoConteudo({
  temaCliente = false,
}: CatalogoConteudoProps) {
    
    // ===================================================
  // FILTROS
  // ===================================================

  const [categoria, setCategoria] =
    useState<string>("Todos");

  const [busca, setBusca] =
    useState("");

  const [copiado, setCopiado] =
    useState(false);

  // ===================================================
  // RESTAURANTES
  // ===================================================

  const [restaurantes, setRestaurantes] =
    useState<RestaurantePublico[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [erroCatalogo, setErroCatalogo] =
    useState("");

  // ===================================================
  // RESTAURANTE ABERTO
  // ===================================================

  const [restauranteAberto, setRestauranteAberto] =
    useState<RestaurantePublico | null>(null);

  const [pratos, setPratos] =
    useState<PratoPublico[]>([]);

  const [carregandoPratos, setCarregandoPratos] =
    useState(false);

  const [erroPratos, setErroPratos] =
    useState("");

  // ===================================================
  // CARRINHO
  // ===================================================

  const [carrinho, setCarrinho] =
    useState<ItemCarrinho[]>([]);

  const [observacoes, setObservacoes] =
    useState<Record<string, string>>({});

  const [carrinhoAberto, setCarrinhoAberto] =
    useState(false);

  const [erroPedido, setErroPedido] =
    useState("");

  const [enviandoConsulta, setEnviandoConsulta] =
    useState(false);

  const [atendimento, setAtendimento] = useState<Atendimento | "">("");
  const [pagamento, setPagamento] = useState<Pagamento | "">("");

  // Uma identificação por conteúdo do carrinho. Mantê-la entre tentativas
  // permite recuperar o mesmo registro, inclusive após uma falha de rede.
  const tentativaConsultaRef = useRef<{
    assinatura: string;
    requestId: string;
  } | null>(null);

  // Impede cliques simultâneos antes de o React atualizar o estado visual.
  const envioEmAndamentoRef = useRef(false);

  // ===================================================
  // CONSULTAR RESTAURANTES PUBLICADOS
  // ===================================================

  useEffect(() => {
    const cancelar = onSnapshot(
      collection(db, "catalogoPublico"),

      (resultado) => {
        const lista: RestaurantePublico[] =
          resultado.docs.map((documento) => {
            const dados = documento.data();

            const modalidade =
              texto(dados.modalidadeEntrega);

            return {
              id: documento.id,

              nome:
                texto(dados.nome) ||
                "Restaurante",

              categoria:
                texto(dados.categoria) ||
                "Gastronomia Especial",

              descricao:
                texto(dados.descricao),

              whatsapp:
                texto(dados.whatsapp) ||
                texto(dados.telefone),

              telefone:
                texto(dados.telefone) ||
                texto(dados.whatsapp),

              modalidadeEntrega:
                modalidade === "retirada_anfitriao"
                  ? "retirada_anfitriao"
                  : "entrega_propria",

              horarioFuncionamento:
                texto(dados.horarioFuncionamento),

              logoUrl:
                texto(dados.logoUrl) ||
                texto(dados.logo),

              imagemCapa:
                texto(dados.imagemCapa),

              endereco:
                texto(dados.endereco),

              ativo:
                dados.ativo === true,

              aceitaRetirada: dados.permiteRetiradaRestaurante === true,
            };
          });

        setRestaurantes(
          lista.filter(
            (restaurante) => restaurante.ativo
          )
        );

        setCarregando(false);
        setErroCatalogo("");
      },

      (erro) => {
        console.error(
          "Erro ao consultar restaurantes:",
          erro
        );

        setErroCatalogo(
          mensagemErro(erro)
        );

        setCarregando(false);
      }
    );

    return () => cancelar();
  }, []);

  // ===================================================
  // CONSULTAR PRATOS DO RESTAURANTE
  // ===================================================

  useEffect(() => {
    if (!restauranteAberto) {
      setPratos([]);
      setCarregandoPratos(false);
      setErroPratos("");

      return;
    }

    setCarregandoPratos(true);
    setErroPratos("");
    setPratos([]);

    const cancelar = onSnapshot(
      collection(
        db,
        "catalogoPublico",
        restauranteAberto.id,
        "pratos"
      ),

      (resultado) => {
        const lista: PratoPublico[] =
          resultado.docs.map((documento) => {
            const dados = documento.data();

            return {
              id: documento.id,

              nome:
                texto(dados.nome),

              descricao:
                texto(dados.descricao),

              preco:
                typeof dados.preco === "number"
                  ? dados.preco
                  : 0,

              pessoas:
                typeof dados.pessoas === "number"
                  ? dados.pessoas
                  : 1,

              imagemUrl:
                texto(dados.imagemUrl),

              disponivel:
                dados.disponivel === true,

              status:
                texto(dados.status),
            };
          });

        setPratos(
          lista.filter(
            (prato) =>
              prato.status === "aprovado" &&
              prato.disponivel &&
              prato.preco > 0
          )
        );

        setCarregandoPratos(false);
        setErroPratos("");
      },

      (erro) => {
        console.error(
          "Erro ao consultar pratos:",
          erro
        );

        setErroPratos(
          mensagemErro(erro)
        );

        setCarregandoPratos(false);
      }
    );

    return () => cancelar();
  }, [restauranteAberto?.id]);

  // ===================================================
  // BLOQUEAR ROLAGEM QUANDO UMA JANELA ESTIVER ABERTA
  // ===================================================

  useEffect(() => {
    if (!restauranteAberto && !carrinhoAberto) {
      return;
    }

    const rolagemAnterior =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        rolagemAnterior;
    };
  }, [restauranteAberto, carrinhoAberto]);

  // ===================================================
  // FILTRAR RESTAURANTES
  // ===================================================

  const restaurantesFiltrados = useMemo(() => {
    const termo = busca
      .trim()
      .toLocaleLowerCase("pt-BR");

    return restaurantes.filter((restaurante) => {
      const categoriaCorreta =
        categoria === "Todos" ||
        restaurante.categoria === categoria;

      const buscaCorreta =
        !termo ||
        [
          restaurante.nome,
          restaurante.descricao,
          restaurante.categoria,
        ]
          .join(" ")
          .toLocaleLowerCase("pt-BR")
          .includes(termo);

      return categoriaCorreta && buscaCorreta;
    });
  }, [
    restaurantes,
    categoria,
    busca,
  ]);

  const comEntrega =
    restaurantesFiltrados.filter(
      (restaurante) =>
        restaurante.modalidadeEntrega ===
        "entrega_propria"
    );

  const semEntrega =
    restaurantesFiltrados.filter(
      (restaurante) =>
        restaurante.modalidadeEntrega ===
        "retirada_anfitriao"
    );

  // ===================================================
  // RESUMO DO CARRINHO
  // ===================================================

  const quantidadeTotal = carrinho.reduce(
    (total, item) =>
      total + item.quantidade,
    0
  );

  const valorTotal = carrinho.reduce(
    (total, item) =>
      total + item.preco * item.quantidade,
    0
  );

  // Checkout é uma preferência do cliente: o servidor deve validar e registrar
  // os valores antes de habilitar o envio. Não confundir com pagamento efetuado.
  const restauranteCarrinho = restaurantes.find(
    (restaurante) => restaurante.id === carrinho[0]?.restauranteId
  );
  const taxaEntrega = atendimento === "entrega" ? TAXA_ENTREGA_ESTIMADA : 0;
  const totalEstimado = valorTotal + taxaEntrega;

  // ===================================================
  // ABRIR RESTAURANTE
  // ===================================================

  function abrirRestaurante(
    restaurante: RestaurantePublico
  ) {
    setRestauranteAberto(restaurante);
    setCarrinhoAberto(false);
    setErroPratos("");
    setErroPedido("");
  }

  // ===================================================
  // FECHAR RESTAURANTE
  // ===================================================

  function fecharRestaurante() {
    setRestauranteAberto(null);
    setPratos([]);
    setErroPratos("");
  }

  // ===================================================
  // CONSULTAR QUANTIDADE DE UM PRATO
  // ===================================================

  function quantidadePrato(
    restauranteId: string,
    pratoId: string
  ): number {
    const item = carrinho.find(
      (produto) =>
        produto.restauranteId ===
          restauranteId &&
        produto.pratoId === pratoId
    );

    return item?.quantidade ?? 0;
  }

  // ===================================================
  // ADICIONAR OU REMOVER PRATO
  // ===================================================

  function alterarQuantidade(
    restaurante: RestaurantePublico,
    prato: PratoPublico,
    variacao: number
  ) {
    setErroPedido("");

    if (variacao > 0 && carrinho.some((item) => item.restauranteId !== restaurante.id)) {
      setErroPedido("Finalize ou limpe os itens do outro restaurante antes de adicionar este prato.");
      return;
    }

    setCarrinho((anterior) => {
      const itemExistente = anterior.find(
        (item) =>
          item.restauranteId ===
            restaurante.id &&
          item.pratoId === prato.id
      );

      // Sem item existente: adicionar.
      if (!itemExistente) {
        if (variacao <= 0) {
          return anterior;
        }

        return [
          ...anterior,
          {
            restauranteId:
              restaurante.id,

            restauranteNome:
              restaurante.nome,

            pratoId:
              prato.id,

            imagemUrl:
              prato.imagemUrl,

            nome:
              prato.nome,

            preco:
              prato.preco,

            quantidade:
              1,

            observacao:
              observacoes[
                chavePrato(
                  restaurante.id,
                  prato.id
                )
              ] ?? "",
          },
        ];
      }

      const novaQuantidade = Math.max(
        0,
        Math.min(
          20,
          itemExistente.quantidade + variacao
        )
      );

      // Quantidade zero: remover.
      if (novaQuantidade === 0) {
        return anterior.filter(
          (item) =>
            !(
              item.restauranteId ===
                restaurante.id &&
              item.pratoId === prato.id
            )
        );
      }

      return anterior.map((item) => {
        if (
          item.restauranteId ===
            restaurante.id &&
          item.pratoId === prato.id
        ) {
          return {
            ...item,
            quantidade: novaQuantidade,
          };
        }

        return item;
      });
    });
  }

  // ===================================================
  // OBSERVAÇÃO DO PRATO
  // ===================================================

  function alterarObservacao(
    restauranteId: string,
    pratoId: string,
    valor: string
  ) {
    const chave = chavePrato(
      restauranteId,
      pratoId
    );

    const observacao = valor.slice(0, 300);

    setObservacoes((anterior) => ({
      ...anterior,
      [chave]: observacao,
    }));

    setCarrinho((anterior) =>
      anterior.map((item) => {
        if (
          item.restauranteId ===
            restauranteId &&
          item.pratoId === pratoId
        ) {
          return {
            ...item,
            observacao,
          };
        }

        return item;
      })
    );
  }

  // ===================================================
  // REMOVER ITEM DO CARRINHO
  // ===================================================

  function removerItem(
    restauranteId: string,
    pratoId: string
  ) {
    setCarrinho((anterior) =>
      anterior.filter(
        (item) =>
          !(
            item.restauranteId ===
              restauranteId &&
            item.pratoId === pratoId
          )
      )
    );
  }

  // ===================================================
  // LIMPAR CARRINHO
  // ===================================================

  function limparCarrinho() {
    const confirmou = window.confirm(
      "Deseja remover todos os itens do carrinho?"
    );

    if (!confirmou) {
      return;
    }

    setCarrinho([]);
    setErroPedido("");
    setAtendimento("");
    setPagamento("");
  }

  // ===================================================
  // COPIAR CÓDIGO DE INDICAÇÃO
  // ===================================================

  async function copiarCodigo() {
    try {
      await navigator.clipboard.writeText(
        "IMPERIO"
      );

      setCopiado(true);
    } catch {
      window.alert(
        "Copie manualmente o código IMPERIO."
      );
    }
  }

// ===================================================
// REGISTRAR CONSULTA E ABRIR WHATSAPP
// ===================================================

async function prepararWhatsApp() {
  if (envioEmAndamentoRef.current) {
    return;
  }

  setErroPedido("");

  // -------------------------------------------------
  // VERIFICAR CARRINHO
  // -------------------------------------------------

  if (carrinho.length === 0) {
    setErroPedido(
      "Adicione pelo menos um prato ao carrinho."
    );
    return;
  }

  if (!CHECKOUT_VALIDADO_NO_SERVIDOR) {
    setErroPedido("Estamos concluindo a integração segura de entrega e pagamento. A consulta ficará disponível após a atualização da função no servidor.");
    return;
  }
  if (!atendimento || !pagamento) {
    setErroPedido("Escolha a modalidade de atendimento e a forma de pagamento.");
    return;
  }

  // Cada consulta pertence a apenas um restaurante.

  const restauranteIds = [
    ...new Set(
      carrinho.map((item) => item.restauranteId)
    ),
  ];

  if (restauranteIds.length !== 1) {
    setErroPedido(
      "Faça uma consulta para um restaurante por vez."
    );
    return;
  }

  const restaurante = restaurantes.find(
    (item) => item.id === restauranteIds[0]
  );

  if (!restaurante || !restaurante.ativo) {
    setErroPedido(
      "Este restaurante não está disponível."
    );
    return;
  }

  if (atendimento === "entrega" && restaurante.modalidadeEntrega !== "entrega_propria") {
    setErroPedido("Este restaurante não oferece entrega própria.");
    return;
  }
  if (atendimento === "retirada_restaurante" && !restaurante.aceitaRetirada) {
    setErroPedido("A retirada no restaurante não está autorizada neste cadastro.");
    return;
  }
  if (atendimento === "retirada_anfitriao") {
    setErroPedido("Confirme previamente a retirada com o anfitrião antes de enviar a consulta.");
    return;
  }

  // -------------------------------------------------
  // VERIFICAR CONFIGURAÇÃO DO SUPABASE
  // -------------------------------------------------

  const supabaseUrl = (
    import.meta.env.VITE_SUPABASE_URL || ""
  ).replace(/\/$/, "");

  const supabaseKey =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

  if (!supabaseUrl) {
    setErroPedido(
      "O serviço de consultas não está configurado. Entre em contato com a administração."
    );
    return;
  }

  // -------------------------------------------------
  // PREPARAR SOMENTE OS DADOS NECESSÁRIOS
  // -------------------------------------------------

  // Não enviamos preços, nomes de pratos ou subtotal.
  // O servidor buscará esses dados no Firebase.

  const itensParaServidor = carrinho.map(
    (item) => ({
      pratoId: item.pratoId,
      quantidade: item.quantidade,
      observacao: item.observacao.trim(),
    })
  );

  // A assinatura inclui restaurante, pratos, quantidades e observações.
  // Uma nova composição recebe nova chave; a mesma composição reutiliza
  // a chave antiga para recuperar a consulta, sem criar duplicatas.
  const assinatura = JSON.stringify({
    restauranteId: restaurante.id,
    atendimento,
    pagamento,
    itens: [...itensParaServidor].sort((a, b) =>
      a.pratoId.localeCompare(b.pratoId)
    ),
  });

  if (tentativaConsultaRef.current?.assinatura !== assinatura) {
    tentativaConsultaRef.current = {
      assinatura,
      requestId: crypto.randomUUID(),
    };
  }

  const requestId = tentativaConsultaRef.current.requestId;

  // -------------------------------------------------
  // ABRIR UMA JANELA DURANTE O CLIQUE
  // -------------------------------------------------

  // Isso ajuda a evitar o bloqueio de pop-ups
  // depois da resposta assíncrona do servidor.

  const janelaWhatsApp = window.open(
    "",
    "_blank"
  );

  if (!janelaWhatsApp) {
    setErroPedido(
      "Seu navegador bloqueou a abertura do WhatsApp. Permita pop-ups para este site e tente novamente."
    );
    return;
  }

  janelaWhatsApp.document.title =
    "Preparando consulta";

  janelaWhatsApp.document.body.textContent =
    "Registrando sua consulta com segurança...";

  envioEmAndamentoRef.current = true;
  setEnviandoConsulta(true);

  try {
    // ------------------------------------------------
    // CHAMAR A EDGE FUNCTION
    // ------------------------------------------------

    const resposta = await fetch(
      `${supabaseUrl}/functions/v1/registrar-consulta`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          ...(supabaseKey
            ? {
                apikey: supabaseKey,
              }
            : {}),
        },

        body: JSON.stringify({
          restauranteId: restaurante.id,
          requestId,
          atendimento,
          pagamento,
          itens: itensParaServidor,
        }),
      }
    );

    // ------------------------------------------------
    // LER RESPOSTA
    // ------------------------------------------------

    const resultado: RespostaConsulta =
      await resposta.json();

    if (
      !resposta.ok ||
      !resultado.sucesso ||
      !resultado.consultaId
    ) {
      throw new Error(
        resultado.erro ||
          "Não foi possível registrar sua consulta."
      );
    }

    // ------------------------------------------------
    // VALIDAR OS DADOS DEVOLVIDOS PELO SERVIDOR
    // ------------------------------------------------

    const itensConfirmados = resultado.itens;

    const nomeRestaurante =
      resultado.restauranteNome;

    const telefone = (
      resultado.restauranteWhatsapp || ""
    ).replace(/\D/g, "");

    if (
      !Array.isArray(itensConfirmados) ||
      itensConfirmados.length === 0 ||
      typeof resultado.subtotal !== "number" ||
      typeof resultado.taxaEntrega !== "number" ||
      typeof resultado.totalEstimado !== "number" ||
      resultado.atendimento !== atendimento ||
      resultado.pagamento !== pagamento ||
      !nomeRestaurante ||
      !/^\d{12,15}$/.test(telefone)
    ) {
      throw new Error(
        "A consulta foi registrada, mas não foi possível preparar o WhatsApp. Anote a referência: " +
          resultado.consultaId
      );
    }

    // ------------------------------------------------
    // MONTAR MENSAGEM COM PREÇOS DO SERVIDOR
    // ------------------------------------------------

    const linhasPratos = itensConfirmados.flatMap(
      (item, indice) => {
        const linhas = [
          `${indice + 1}. ${item.quantidade}x ${item.nome}`,
          `Valor: ${dinheiro(item.subtotal)}`,
        ];

        if (item.observacao.trim()) {
          linhas.push(
            `Observação: ${item.observacao.trim()}`
          );
        }

        return [
          ...linhas,
          "",
        ];
      }
    );

    const mensagem = [
      "Olá! Estou hospedado nos Império Chalés.",
      "",
      `Gostaria de consultar a disponibilidade dos pratos do ${nomeRestaurante}.`,
      "",
      "*MINHA CONSULTA*",
      "",
      ...linhasPratos,
      `*Pratos:* ${dinheiro(resultado.subtotal)}`,
      `*Atendimento:* ${resultado.atendimentoDescricao || (atendimento === "entrega" ? "Entrega no chalé" : "Retirada no restaurante")}`,
      `*Taxa de entrega:* ${dinheiro(resultado.taxaEntrega)}`,
      `*Total estimado:* ${dinheiro(resultado.totalEstimado)}`,
      `*Preferência de pagamento:* ${resultado.pagamentoDescricao || pagamento.toUpperCase()}`,
      "Pagamento combinado e realizado diretamente com o restaurante.",
      "",
      "*Código de indicação:* IMPERIO",
      "",
      `*Referência da consulta:* ${resultado.consultaId}`,
      "",
      "Por favor, confirme a disponibilidade dos pratos, o preço final, o pagamento e a entrega.",
      "",
      "Esta mensagem é uma consulta e não representa um pedido confirmado nem pagamento realizado.",
    ].join("\n");

    // ------------------------------------------------
    // ABRIR WHATSAPP
    // ------------------------------------------------

    const linkWhatsApp =
      `https://wa.me/${telefone}?text=` +
      encodeURIComponent(mensagem);

    janelaWhatsApp.location.href =
      linkWhatsApp;

    // Fechamos o carrinho somente após
    // o registro e a preparação do WhatsApp.

    setCarrinhoAberto(false);

    // Não limpamos o carrinho automaticamente.
    // Abrir o WhatsApp não garante envio,
    // pagamento ou confirmação do pedido.

  } catch (erro) {
    janelaWhatsApp.close();

    console.error(
      "Erro ao registrar consulta:",
      erro
    );

    setErroPedido(
      erro instanceof Error
        ? erro.message
        : "Não foi possível registrar a consulta. Tente novamente."
    );
  } finally {
    envioEmAndamentoRef.current = false;
    setEnviandoConsulta(false);
  }
}

  // ===================================================
  // CARD DO RESTAURANTE
  // ===================================================

  function renderizarRestaurante(
    restaurante: RestaurantePublico
  ) {
    return (
      <article
        key={restaurante.id}
        className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
      >

        {restaurante.imagemCapa && (
          <img
            src={restaurante.imagemCapa}
            alt={restaurante.nome}
            className="h-48 w-full object-cover"
          />
        )}

        <div className="p-5 sm:p-6">

          {/* LOGO E NOME */}

          <div className="flex items-center gap-4">

            {restaurante.logoUrl ? (
              <img
                src={restaurante.logoUrl}
                alt={`Logomarca de ${restaurante.nome}`}
                className="h-20 w-20 shrink-0 rounded-2xl border border-gray-200 bg-white p-1 object-contain"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-3xl">
                🍽️
              </div>
            )}

            <div className="min-w-0">

              <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                {restaurante.categoria}
              </span>

              <h3 className="mt-2 break-words text-xl font-black text-[#19352b]">
                {restaurante.nome}
              </h3>

            </div>

          </div>

          {/* DESCRIÇÃO */}

          <p className="mt-5 text-sm leading-7 text-gray-600">
            {restaurante.descricao ||
              "Conheça os pratos deste restaurante parceiro."}
          </p>

          {/* INFORMAÇÕES */}

          <div className="mt-5 space-y-2 text-sm text-gray-700">

            {restaurante.endereco && (
              <p>
                📍 {restaurante.endereco}
              </p>
            )}

            {restaurante.horarioFuncionamento && (
              <p>
                🕒 {restaurante.horarioFuncionamento}
              </p>
            )}

            <p className="font-bold">
              {restaurante.modalidadeEntrega ===
              "entrega_propria"
                ? "🚚 Entrega própria"
                : "🛍️ Retirada sob consulta"}
            </p>

          </div>

          {/* AVISO DE RETIRADA */}

          {restaurante.modalidadeEntrega ===
            "retirada_anfitriao" && (
            <div className="mt-4 rounded-xl bg-amber-50 p-4 text-xs leading-6 text-amber-900">
              A retirada depende de consulta,
              disponibilidade e confirmação
              prévia do anfitrião.
            </div>
          )}

          {/* ABRIR CARDÁPIO */}

          <button
            type="button"
            onClick={() =>
              abrirRestaurante(restaurante)
            }
            className="mt-6 w-full rounded-xl bg-[#19352b] px-5 py-4 text-sm font-black text-white transition hover:bg-[#28533e]"
          >
            🍽️ Ver pratos e cardápio →
          </button>

        </div>

      </article>
    );
  }

  // ===================================================
  // INTERFACE
  // ===================================================

  return (
<div
  className={
    temaCliente
      ? "catalogo-cliente bg-[#171717] text-white"
      : "bg-[#faf8f2] text-[#19352b]"
  }
>
      {/* ============================================= */}
      {/* APRESENTAÇÃO                                  */}
      {/* ============================================= */}

      <section className="mx-auto max-w-6xl px-4 pb-8 pt-14 text-center">

        <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#ad8746]">
          EXPERIÊNCIA GASTRONÔMICA
        </span>

        <h2 className="mt-4 text-3xl font-black md:text-5xl">
          Descubra os sabores da Chapada
        </h2>

        <p className="mx-auto mt-5 max-w-2xl text-gray-600">
          Explore os restaurantes parceiros,
          conheça seus pratos e prepare sua consulta.
        </p>

      </section>

      <div className="mx-auto max-w-6xl px-4 pb-20">

        {/* =========================================== */}
        {/* CÓDIGO IMPERIO                              */}
        {/* =========================================== */}

        <section
          id="codigo"
          className="mb-14 scroll-mt-8 overflow-hidden rounded-3xl bg-[#17352a] p-6 text-white shadow-xl md:p-10"
        >

          <div className="grid items-center gap-8 md:grid-cols-2">

            <div>

              <span className="text-xs font-bold uppercase tracking-[0.3em] text-amber-300">
                SEU CÓDIGO EXCLUSIVO
              </span>

              <h3 className="mt-4 text-3xl font-black">
                Um toque de Império na sua experiência.
              </h3>

              <p className="mt-4 text-sm leading-7 text-gray-300">
                Informe nosso código ao restaurante
                para que o estabelecimento saiba que
                você chegou pelo Império Chalés.
              </p>

              <p className="mt-4 text-xs text-gray-400">
                Código de indicação. Não concede
                descontos automaticamente.
              </p>

            </div>

            <div className="rounded-2xl border border-amber-300/20 bg-white/10 p-6 text-center">

              <p className="text-xs uppercase tracking-widest text-amber-300">
                CÓDIGO DE INDICAÇÃO
              </p>

              <strong className="mt-4 block text-3xl font-black tracking-[0.2em] sm:text-4xl">
                IMPERIO
              </strong>

              <button
                type="button"
                onClick={copiarCodigo}
                className="mt-6 w-full rounded-xl bg-amber-400 px-5 py-4 font-black text-[#19352b]"
              >
                {copiado
                  ? "✓ Código copiado!"
                  : "📋 Copiar código"}
              </button>

            </div>

          </div>

        </section>

        {/* =========================================== */}
        {/* CATEGORIAS                                  */}
        {/* =========================================== */}

        <section
          id="categorias"
          className="mb-14 scroll-mt-8"
        >

          <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#ad8746]">
            ESCOLHA SUA EXPERIÊNCIA
          </span>

          <h2 className="mt-3 text-3xl font-black">
            O que vamos comer hoje?
          </h2>

          <p className="mt-3 text-gray-500">
            Escolha uma categoria ou pesquise
            um restaurante.
          </p>

          {/* BUSCA */}

          <input
            type="search"
            value={busca}
            onChange={(event) =>
              setBusca(event.target.value)
            }
            placeholder="🔎 Buscar restaurantes ou especialidades..."
            className="mt-8 w-full rounded-2xl border border-gray-200 bg-white px-6 py-5 outline-none focus:border-amber-400"
          />

          {/* BOTÕES DE CATEGORIA */}

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">

            {categorias.map((item) => (
              <button
                key={item.nome}
                type="button"
                onClick={() =>
                  setCategoria(item.nome)
                }
                aria-pressed={
                  categoria === item.nome
                }
                className={`flex min-h-[125px] flex-col items-center justify-center rounded-2xl border p-4 text-center transition hover:-translate-y-1 hover:shadow-lg ${
                  categoria === item.nome
                    ? "border-[#19352b] bg-[#19352b] text-white"
                    : "border-[#e8e2d5] bg-white"
                }`}
              >

                <span className="mb-3 text-3xl">
                  {item.icone}
                </span>

                <span className="text-sm font-bold">
                  {item.nome}
                </span>

              </button>
            ))}

          </div>

          {/* RESULTADO */}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">

            <p>
              Categoria:{" "}
              <strong className="text-[#19352b]">
                {categoria}
              </strong>
            </p>

            <p>
              {restaurantesFiltrados.length}{" "}
              {restaurantesFiltrados.length === 1
                ? "restaurante disponível"
                : "restaurantes disponíveis"}
            </p>

          </div>

        </section>

        {/* =========================================== */}
        {/* CARROSSEL                                   */}
        {/* =========================================== */}

        <ParceirosCarrossel />

        {/* =========================================== */}
        {/* CARREGAMENTO E ERROS                        */}
        {/* =========================================== */}

        {carregando && (
          <div className="mb-10 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-center text-sm font-bold text-blue-900">
            ⏳ Carregando restaurantes...
          </div>
        )}

        {erroCatalogo && (
          <div
            role="alert"
            className="mb-10 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-800"
          >
            ⚠️ {erroCatalogo}
          </div>
        )}

        {/* =========================================== */}
        {/* ENTREGA PRÓPRIA                             */}
        {/* =========================================== */}

        <section
          id="entrega"
          className="mb-12 scroll-mt-8"
        >

          <div className="mb-6 flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-3xl">
              🚚
            </div>

            <div>

              <span className="text-xs font-bold uppercase tracking-[0.2em] text-green-700">
                ENTREGA DIRETA
              </span>

              <h2 className="text-2xl font-black md:text-3xl">
                Receba no seu chalé
              </h2>

            </div>

          </div>

          <div className="mb-7 rounded-2xl border border-green-100 bg-green-50 p-5">

            <p className="text-sm leading-7 text-green-900">
              <strong>Como funciona?</strong>{" "}
              Escolha o restaurante, conheça os pratos
              e prepare sua consulta.
              O estabelecimento confirma
              disponibilidade, preço final,
              pagamento e entrega.
            </p>

          </div>

          {comEntrega.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">

              {comEntrega.map(
                renderizarRestaurante
              )}

            </div>
          ) : (
            !carregando &&
            !erroCatalogo && (
              <div className="rounded-3xl border border-dashed border-green-200 bg-white px-6 py-12 text-center">

                <div className="text-4xl">
                  🍽️
                </div>

                <h3 className="mt-4 text-xl font-black">
                  Nenhum restaurante encontrado
                </h3>

                <p className="mt-3 text-sm text-gray-500">
                  Não encontramos opções com entrega
                  para os filtros selecionados.
                </p>

              </div>
            )
          )}

        </section>

        {/* =========================================== */}
        {/* RETIRADA SOB CONSULTA                       */}
        {/* =========================================== */}

        <section
          id="retirada"
          className="mb-12 scroll-mt-8"
        >

          <div className="mb-6 flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-3xl">
              🛍️
            </div>

            <div>

              <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
                RETIRADA SOB CONSULTA
              </span>

              <h2 className="text-2xl font-black md:text-3xl">
                Consulte o anfitrião
              </h2>

            </div>

          </div>

          <div className="mb-7 overflow-hidden rounded-3xl border border-amber-200 bg-white">

            <div className="bg-[#f4e7c8] px-6 py-4">

              <h3 className="font-black text-amber-950">
                ⚠️ Retirada mediante confirmação!
              </h3>

            </div>

            <div className="p-6">

              <p className="leading-7 text-gray-700">
                Antes de realizar qualquer pedido
                ou pagamento, entre em contato
                com o anfitrião para verificar
                a disponibilidade da retirada.
              </p>

              <h4 className="mt-6 font-black">
                Horários para possível retirada
              </h4>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">

                <div className="rounded-2xl bg-amber-50 p-5">

                  <span className="text-2xl">
                    ☀️
                  </span>

                  <p className="mt-2 text-sm text-gray-500">
                    ALMOÇO
                  </p>

                  <p className="mt-1 text-xl font-black">
                    11h às 13h
                  </p>

                </div>

                <div className="rounded-2xl bg-[#19352b] p-5 text-white">

                  <span className="text-2xl">
                    🌙
                  </span>

                  <p className="mt-2 text-sm text-gray-300">
                    NOITE
                  </p>

                  <p className="mt-1 text-xl font-black">
                    20h às 22h
                  </p>

                </div>

              </div>

              <p className="mt-5 rounded-xl bg-gray-50 p-4 text-sm leading-6 text-gray-600">
                Esses horários são períodos para consulta.
                A retirada depende de disponibilidade
                e confirmação prévia.
              </p>

            </div>

          </div>

          {semEntrega.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">

              {semEntrega.map(
                renderizarRestaurante
              )}

            </div>
          ) : (
            !carregando &&
            !erroCatalogo && (
              <div className="rounded-3xl border border-dashed border-amber-200 bg-white px-6 py-12 text-center">

                <h3 className="text-xl font-black">
                  Nenhuma opção encontrada
                </h3>

                <p className="mt-3 text-sm text-gray-500">
                  Não encontramos restaurantes
                  com retirada nos filtros selecionados.
                </p>

              </div>
            )
          )}

        </section>

        {/* =========================================== */}
        {/* AVISO FINAL                                 */}
        {/* =========================================== */}

        <section className="rounded-3xl bg-[#19352b] p-8 text-center text-white md:p-12">

          <span className="text-3xl">
            🌿
          </span>

          <h2 className="mt-4 text-2xl font-black">
            Saboreie cada momento da sua viagem.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-gray-300">
            Nosso catálogo apresenta restaurantes
            parceiros. Disponibilidade, valor final,
            pedido, pagamento e entrega devem ser
            confirmados com o estabelecimento.

            Quando necessário, a retirada pelo anfitrião
            depende de consulta e confirmação prévia.
          </p>

        </section>

      </div>

      {/* ============================================= */}
      {/* JANELA SOBREPOSTA DO RESTAURANTE              */}
      {/* ============================================= */}

      {restauranteAberto && (
        <div
          role="presentation"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-2 backdrop-blur-sm sm:p-5"
        >

          <section
            role="dialog"
            aria-modal="true"
            aria-label={`Cardápio de ${restauranteAberto.nome}`}
            className="flex max-h-[95dvh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-[#faf8f2] shadow-2xl"
          >

            {/* CABEÇALHO */}

            <div className="flex shrink-0 items-center justify-between gap-3 bg-[#101813] p-4 text-white sm:p-6">

              <div className="flex min-w-0 items-center gap-3">

                {restauranteAberto.logoUrl ? (
                  <img
                    src={restauranteAberto.logoUrl}
                    alt={restauranteAberto.nome}
                    className="h-12 w-12 shrink-0 rounded-xl bg-white object-contain p-1 sm:h-16 sm:w-16"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-2xl">
                    🍽️
                  </div>
                )}

                <div className="min-w-0">

                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                    CARDÁPIO DO ESTABELECIMENTO
                  </p>

                  <h2 className="mt-1 break-words text-lg font-black sm:text-2xl">
                    {restauranteAberto.nome}
                  </h2>

                </div>

              </div>

              <button
                type="button"
                onClick={fecharRestaurante}
                aria-label="Fechar cardápio"
                className="shrink-0 rounded-xl border border-white/20 px-3 py-3 text-sm font-bold text-white"
              >
                ✕ Fechar
              </button>

            </div>

            {/* CONTEÚDO COM ROLAGEM */}

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-7">

              {restauranteAberto.descricao && (
                <p className="mb-6 rounded-2xl bg-white p-4 text-sm leading-7 text-gray-600">
                  {restauranteAberto.descricao}
                </p>
              )}

              <h3 className="text-2xl font-black">
                🍽️ Nossos pratos
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Escolha seus pratos e informe
                suas preferências.
              </p>

              {/* CARREGAMENTO */}

              {carregandoPratos && (
                <div className="mt-6 rounded-xl bg-blue-50 p-5 text-sm text-blue-900">
                  ⏳ Carregando pratos...
                </div>
              )}

              {/* ERRO */}

              {erroPratos && (
                <div
                  role="alert"
                  className="mt-6 rounded-xl bg-red-50 p-5 text-sm text-red-800"
                >
                  ⚠️ {erroPratos}
                </div>
              )}

              {/* SEM PRATOS */}

              {!carregandoPratos &&
                !erroPratos &&
                pratos.length === 0 && (
                  <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">

                    <p className="text-4xl">
                      🍽️
                    </p>

                    <h4 className="mt-4 font-black">
                      Nenhum prato disponível
                    </h4>

                    <p className="mt-2 text-sm text-gray-500">
                      Consulte o restaurante
                      sobre as opções disponíveis.
                    </p>

                  </div>
                )}

              {/* LISTA DE PRATOS */}

              {!carregandoPratos &&
                !erroPratos &&
                pratos.length > 0 && (
                  <div className="mt-7 grid gap-5 md:grid-cols-2">

                    {pratos.map((prato) => {
                      const quantidade =
                        quantidadePrato(
                          restauranteAberto.id,
                          prato.id
                        );

                      const chave =
                        chavePrato(
                          restauranteAberto.id,
                          prato.id
                        );

                      return (
                        <article
                          key={prato.id}
                          className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                        >

                          {/* IMAGEM */}

                          {prato.imagemUrl ? (
                            <img
                              src={prato.imagemUrl}
                              alt={`Imagem ilustrativa de ${prato.nome}`}
                              className="h-52 w-full bg-[#f8f6ef] object-contain sm:h-64"
                            />
                          ) : (
                            <div className="flex h-52 items-center justify-center bg-gray-100 text-5xl">
                              🍽️
                            </div>
                          )}

                          <div className="p-5">

                            {/* NOME */}

                            <h4 className="text-xl font-black">
                              {prato.nome}
                            </h4>

                            {/* DESCRIÇÃO */}

                            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                              {prato.descricao}
                            </p>

                            {/* PREÇO E RENDIMENTO */}

                            <div className="mt-5 grid grid-cols-2 gap-3">

                              <div className="rounded-xl bg-lime-50 p-4">

                                <p className="text-xs text-green-800">
                                  💰 Preço
                                </p>

                                <p className="mt-2 text-lg font-black text-green-900">
                                  {dinheiro(prato.preco)}
                                </p>

                              </div>

                              <div className="rounded-xl bg-amber-50 p-4">

                                <p className="text-xs text-amber-900">
                                  👥 Serve
                                </p>

                                <p className="mt-2 font-black text-amber-900">
                                  {prato.pessoas}{" "}
                                  {prato.pessoas === 1
                                    ? "pessoa"
                                    : "pessoas"}
                                </p>

                              </div>

                            </div>

                            {/* OBSERVAÇÃO */}

                            <div className="mt-5">

                              <label
                                htmlFor={`obs-${chave}`}
                                className="text-sm font-black"
                              >
                                📝 Observação para o restaurante
                              </label>

                              <textarea
                                id={`obs-${chave}`}
                                rows={3}
                                maxLength={300}
                                value={
                                  observacoes[chave] ?? ""
                                }
                                onChange={(event) =>
                                  alterarObservacao(
                                    restauranteAberto.id,
                                    prato.id,
                                    event.target.value
                                  )
                                }
                                placeholder="Ex.: sem cebola, pouco sal..."
                                className="mt-3 w-full resize-none rounded-xl border border-gray-200 p-4 text-sm outline-none focus:border-pink-400"
                              />

                              <p className="mt-1 text-right text-xs text-gray-400">
                                {(observacoes[chave] ?? "").length}/300
                              </p>

                            </div>

                            {/* CONTROLE DE QUANTIDADE */}

                            <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-[#f8f6ef] p-3">

                              <div>

                                <p className="text-xs font-bold text-gray-500">
                                  Quantidade
                                </p>

                                <p className="mt-1 text-sm font-black">
                                  {dinheiro(
                                    prato.preco * quantidade
                                  )}
                                </p>

                              </div>

                              <div className="flex items-center gap-3">

                                <button
                                  type="button"
                                  onClick={() =>
                                    alterarQuantidade(
                                      restauranteAberto,
                                      prato,
                                      -1
                                    )
                                  }
                                  disabled={
                                    quantidade === 0
                                  }
                                  aria-label={`Diminuir quantidade de ${prato.nome}`}
                                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-2xl font-black shadow-sm disabled:opacity-40"
                                >
                                  −
                                </button>

                                <span className="min-w-6 text-center text-lg font-black">
                                  {quantidade}
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    alterarQuantidade(
                                      restauranteAberto,
                                      prato,
                                      1
                                    )
                                  }
                                  disabled={
                                    quantidade >= 20
                                  }
                                  aria-label={`Aumentar quantidade de ${prato.nome}`}
                                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ff4fa0] text-2xl font-black text-black shadow-sm disabled:opacity-40"
                                >
                                  +
                                </button>

                              </div>

                            </div>

                          </div>

                        </article>
                      );
                    })}

                  </div>
                )}

              <div className="mt-7 rounded-xl bg-blue-50 p-4 text-xs leading-6 text-blue-900">
                ℹ️ O carrinho apenas organiza sua consulta.
                A disponibilidade, o preço final e a entrega
                precisam ser confirmados pelo estabelecimento.
              </div>

            </div>

            {/* RODAPÉ DA JANELA */}

<div className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-200 bg-white p-4 sm:p-5">

  <div>
    <p className="text-xs text-gray-500">
      {quantidadeTotal} item(ns)
    </p>

    <p className="text-lg font-black">
      {dinheiro(valorTotal)}
    </p>
  </div>

  {/* No celular some o botão grande e fica só a bolinha flutuante */}
  <button
    type="button"
    onClick={() => {
      setCarrinhoAberto(true);
      setRestauranteAberto(null);
    }}
    className="hidden rounded-2xl bg-[#ff4fa0] px-5 py-4 text-sm font-black text-black shadow-lg shadow-pink-300/60 sm:inline-flex"
  >
    🛒 Ver carrinho
  </button>

</div>

          </section>

        </div>
      )}

      {/* ============================================= */}
      {/* BOLINHA ROSA FLUTUANTE                        */}
      {/* ============================================= */}

      {!carrinhoAberto && (
        <button
          type="button"
          onClick={() => {
            setCarrinhoAberto(true);
            setRestauranteAberto(null);
          }}
          aria-label={`Abrir carrinho com ${quantidadeTotal} itens`}
          className="fixed bottom-5 right-4 z-[90] flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-[#ff4fa0] text-3xl text-black shadow-[0_0_25px_rgba(255,79,160,0.75)] transition hover:scale-110 sm:bottom-7 sm:right-7"
        >

          🛒

          {/* CONTADOR */}

          {quantidadeTotal > 0 && (
            <span className="absolute -right-1 -top-1 flex h-7 min-w-7 items-center justify-center rounded-full border-2 border-white bg-black px-1 text-xs font-black text-white">
              {quantidadeTotal}
            </span>
          )}

        </button>
      )}

      {/* ============================================= */}
      {/* JANELA DO CARRINHO                            */}
      {/* ============================================= */}

      {carrinhoAberto && (
        <div
          role="presentation"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-2 backdrop-blur-sm sm:p-5"
        >

          <section
            role="dialog"
            aria-modal="true"
            aria-label="Meu carrinho"
            className="flex max-h-[95dvh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-[#faf8f2] shadow-2xl"
          >

            {/* CABEÇALHO */}

            <div className="flex shrink-0 items-center justify-between gap-4 bg-[#101813] p-5 text-white">

              <div>

                <span className="text-xs font-bold uppercase tracking-widest text-[#ff80bc]">
                  SABORES DA CHAPADA
                </span>

                <h2 className="mt-2 text-2xl font-black">
                  🛒 Meu carrinho
                </h2>

              </div>

              <button
                type="button"
                onClick={() =>
                  setCarrinhoAberto(false)
                }
                aria-label="Fechar carrinho"
                className="rounded-xl border border-white/20 px-4 py-3 text-sm font-bold"
              >
                ✕
              </button>

            </div>

            {/* ITENS */}

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">

              {carrinho.length === 0 ? (
                <div className="py-12 text-center">

                  <div className="text-6xl">
                    🛒
                  </div>

                  <h3 className="mt-5 text-xl font-black">
                    Seu carrinho está vazio
                  </h3>

                  <p className="mt-3 text-sm text-gray-500">
                    Abra um restaurante e adicione
                    seus pratos preferidos.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setCarrinhoAberto(false)
                    }
                    className="mt-6 rounded-xl bg-[#19352b] px-6 py-4 text-sm font-black text-white"
                  >
                    🍽️ Escolher pratos
                  </button>

                </div>
              ) : (
                <div className="space-y-4">

                  {carrinho.map((item) => (
                    <article
                      key={chavePrato(
                        item.restauranteId,
                        item.pratoId
                      )}
                      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                    >

                      <div className="flex items-start justify-between gap-3">

                        {item.imagemUrl ? (
                          <img
                            src={item.imagemUrl}
                            alt={`Imagem ilustrativa de ${item.nome}`}
                            className="h-20 w-20 shrink-0 rounded-xl bg-[#f8f6ef] object-cover"
                          />
                        ) : (
                          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-2xl">🍽️</div>
                        )}

                        <div className="min-w-0 flex-1">

                          <p className="text-xs font-bold text-amber-700">
                            🏪 {item.restauranteNome}
                          </p>

                          <h3 className="mt-2 break-words text-lg font-black">
                            {item.nome}
                          </h3>

                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removerItem(
                              item.restauranteId,
                              item.pratoId
                            )
                          }
                          aria-label={`Remover ${item.nome}`}
                          className="shrink-0 rounded-lg bg-red-50 px-3 py-2 text-sm font-black text-red-700"
                        >
                          ✕
                        </button>

                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">

                        <span className="rounded-full bg-pink-50 px-4 py-2 text-xs font-black text-pink-900">
                          {item.quantidade}x
                        </span>

                        <strong className="text-lg text-green-900">
                          {dinheiro(
                            item.preco * item.quantidade
                          )}
                        </strong>

                      </div>

                      {item.observacao && (
                        <div className="mt-4 rounded-xl bg-amber-50 p-4 text-xs leading-6 text-amber-900">

                          <strong>
                            📝 Observação:
                          </strong>

                          <p className="mt-1 whitespace-pre-wrap">
                            {item.observacao}
                          </p>

                        </div>
                      )}

                    </article>
                  ))}

                  <button
                    type="button"
                    onClick={limparCarrinho}
                    className="w-full rounded-xl border border-red-200 bg-white px-5 py-4 text-sm font-bold text-red-700"
                  >
                    🗑️ Limpar carrinho
                  </button>

                </div>
              )}

              {/* ESCOLHAS DE ATENDIMENTO E PAGAMENTO */}
              {carrinho.length > 0 && (
                <section className="mt-6 space-y-5 rounded-2xl border border-pink-200 bg-white p-4 sm:p-5">
                  <div>
                    <h3 className="text-lg font-black">🚚 Como deseja receber?</h3>
                    <p className="mt-1 text-xs text-gray-500">Escolha somente uma opção disponível para este estabelecimento.</p>
                    {restauranteCarrinho?.modalidadeEntrega === "entrega_propria" && (
                      <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-gray-200 p-4 text-sm font-bold">
                        <span><input type="radio" name="atendimento" checked={atendimento === "entrega"} onChange={() => setAtendimento("entrega")} className="mr-2 accent-pink-500" />Entrega no chalé</span>
                        <strong>{dinheiro(TAXA_ENTREGA_ESTIMADA)}</strong>
                      </label>
                    )}
                    {restauranteCarrinho?.modalidadeEntrega === "entrega_propria" && restauranteCarrinho.aceitaRetirada && (
                      <label className="mt-2 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-gray-200 p-4 text-sm font-bold">
                        <span><input type="radio" name="atendimento" checked={atendimento === "retirada_restaurante"} onChange={() => setAtendimento("retirada_restaurante")} className="mr-2 accent-pink-500" />Retirada no restaurante</span>
                        <strong>Sem taxa</strong>
                      </label>
                    )}
                    {restauranteCarrinho?.modalidadeEntrega === "retirada_anfitriao" && (
                      <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold">
                        <span><input type="radio" name="atendimento" checked={atendimento === "retirada_anfitriao"} onChange={() => setAtendimento("retirada_anfitriao")} className="mr-2 accent-pink-500" />Retirada pelo anfitrião, somente sob consulta prévia</span>
                        <strong>Confirmar</strong>
                      </label>
                    )}
                    {atendimento === "retirada_anfitriao" && (
                      <p className="mt-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Consulte e obtenha a confirmação prévia do anfitrião. O envio automático dessa modalidade ainda não está liberado.</p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-black">💳 Como pretende pagar?</h3>
                    <p className="mt-1 text-xs text-gray-500">O pagamento será combinado e realizado diretamente com o restaurante, nunca neste site. As opções precisam ser confirmadas pelo parceiro.</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {([
                        ["pix", "PIX"],
                        ["credito", "Cartão de crédito"],
                        ["debito", "Cartão de débito"],
                        ["dinheiro", "Dinheiro"],
                      ] as const).map(([valor, rotulo]) => (
                        <label key={valor} className="flex cursor-pointer items-center rounded-xl border border-gray-200 p-3 text-sm font-bold">
                          <input type="radio" name="pagamento" checked={pagamento === valor} onChange={() => setPagamento(valor)} className="mr-2 accent-pink-500" />{rotulo}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 rounded-xl bg-[#faf8f2] p-4 text-sm">
                    <div className="flex justify-between gap-3"><span>Pratos</span><strong>{dinheiro(valorTotal)}</strong></div>
                    <div className="flex justify-between gap-3"><span>Taxa de entrega {atendimento === "entrega" ? "(fixa)" : ""}</span><strong>{atendimento ? dinheiro(taxaEntrega) : "Escolha o atendimento"}</strong></div>
                    <div className="flex justify-between gap-3 border-t border-gray-200 pt-3 text-lg font-black"><span>Total estimado</span><span>{atendimento ? dinheiro(totalEstimado) : "—"}</span></div>
                    <p className="text-xs leading-5 text-gray-500">A taxa fixa de R$ 20,00 é prevista para entrega no chalé. O parceiro deverá confirmar a modalidade, a taxa e o preço final.</p>
                  </div>
                  {!CHECKOUT_VALIDADO_NO_SERVIDOR && (
                    <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-900">⏳ Prévia do novo carrinho. O envio está temporariamente desativado até a função registrar-consulta validar os R$ 20,00 e registrar as escolhas para o parceiro. Isso evita salvar consultas incompletas.</p>
                  )}
                </section>
              )}

              {/* ERRO */}

              {erroPedido && (
                <div
                  role="alert"
                  className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold leading-6 text-red-800"
                >
                  ⚠️ {erroPedido}
                </div>
              )}

              <div className="mt-6 rounded-xl bg-blue-50 p-4 text-xs leading-6 text-blue-900">
                ℹ️ Ao continuar, a consulta será registrada no Firebase e o WhatsApp será aberto com uma mensagem pronta. Você ainda precisará tocar em enviar. O restaurante deverá confirmar disponibilidade, valores e entrega.
              </div>

            </div>

            {/* RODAPÉ */}

            <div className="shrink-0 border-t border-gray-200 bg-white p-4 sm:p-6">

              <div className="mb-5 flex items-end justify-between gap-3">

                <div>

                  <p className="text-xs text-gray-500">
                    Total estimado
                  </p>

                  <p className="mt-1 text-3xl font-black">
                    {atendimento ? dinheiro(totalEstimado) : dinheiro(valorTotal)}
                  </p>

                </div>

                <span className="rounded-full bg-pink-100 px-3 py-2 text-xs font-black text-pink-900">
                  {quantidadeTotal} item(ns)
                </span>

              </div>

              <button
                type="button"
                disabled={
                  carrinho.length === 0 || enviandoConsulta || !CHECKOUT_VALIDADO_NO_SERVIDOR || !atendimento || !pagamento || atendimento === "retirada_anfitriao"
                }
                onClick={prepararWhatsApp}
                className="w-full rounded-2xl bg-[#ff4fa0] px-5 py-5 text-sm font-black text-black shadow-lg shadow-pink-200 transition hover:bg-[#ff3690] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {enviandoConsulta
                  ? "⏳ Registrando consulta..."
                  : CHECKOUT_VALIDADO_NO_SERVIDOR ? "📱 Registrar consulta e abrir WhatsApp" : "⏳ Aguardando integração segura"}
              </button>

              <p className="mt-3 text-center text-xs leading-5 text-gray-500">
                O restaurante confirmará os valores,
                a disponibilidade e a entrega.
              </p>

            </div>

          </section>

        </div>
      )}

    </div>
  );
}

export default CatalogoConteudo;