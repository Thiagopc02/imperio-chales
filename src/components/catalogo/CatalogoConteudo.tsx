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

import { db } from "../../firebase/config";

import { ParceirosCarrossel } from "../ParceirosCarrossel";

import { FiltrosCatalogo } from "./FiltrosCatalogo";
import { SecaoEntrega } from "./SecaoEntrega";
import { SecaoRetirada } from "./SecaoRetirada";
import { RestauranteModal } from "./RestauranteModal";
import { CarrinhoModal } from "./CarrinhoModal";

import {
  CHECKOUT_VALIDADO_NO_SERVIDOR,
} from "./catalogoConstants";

import type {
  Atendimento,
  ItemCarrinho,
  Pagamento,
  PratoPublico,
  RestaurantePublico,
  RespostaConsulta,
} from "./catalogoTypes";

import "../../styles/catalogo-cliente.css";

/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function texto(valor: unknown): string {
  return typeof valor === "string"
    ? valor
    : "";
}

function dinheiro(valor: number): string {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  ).format(valor);
}

function mensagemErro(
  erro: unknown
): string {
  if (
    typeof erro === "object" &&
    erro !== null &&
    "code" in erro &&
    erro.code ===
      "permission-denied"
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

/* =========================================================
   PROPS
========================================================= */

interface CatalogoConteudoProps {
  temaCliente?: boolean;
}

/* =========================================================
   COMPONENTE PRINCIPAL
========================================================= */

export function CatalogoConteudo({
  temaCliente = false,
}: CatalogoConteudoProps) {
  /* =======================================================
     FILTROS
  ======================================================= */

  const [
    categoria,
    setCategoria,
  ] =
    useState<string>("Todos");

  const [
    busca,
    setBusca,
  ] =
    useState("");

  /* =======================================================
     RESTAURANTES
  ======================================================= */

  const [
    restaurantes,
    setRestaurantes,
  ] = useState<
    RestaurantePublico[]
  >([]);

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    erroCatalogo,
    setErroCatalogo,
  ] = useState("");

  /* =======================================================
     RESTAURANTE ABERTO
  ======================================================= */

  const [
    restauranteAberto,
    setRestauranteAberto,
  ] =
    useState<RestaurantePublico | null>(
      null
    );

  const [
    pratos,
    setPratos,
  ] = useState<
    PratoPublico[]
  >([]);

  const [
    carregandoPratos,
    setCarregandoPratos,
  ] = useState(false);

  const [
    erroPratos,
    setErroPratos,
  ] = useState("");

  /* =======================================================
     CARRINHO
  ======================================================= */

  const [
    carrinho,
    setCarrinho,
  ] = useState<
    ItemCarrinho[]
  >([]);

  const [
    observacoes,
    setObservacoes,
  ] = useState<
    Record<string, string>
  >({});

  const [
    carrinhoAberto,
    setCarrinhoAberto,
  ] = useState(false);

  const [
    erroPedido,
    setErroPedido,
  ] = useState("");

  const [
    enviandoConsulta,
    setEnviandoConsulta,
  ] = useState(false);

  const [
    atendimento,
    setAtendimento,
  ] =
    useState<Atendimento>(
      "entrega"
    );

  const [
    pagamento,
    setPagamento,
  ] =
    useState<Pagamento>("pix");

  const [
    respostaConsulta,
    setRespostaConsulta,
  ] =
    useState<RespostaConsulta | null>(
      null
    );

  /* =======================================================
     CONTROLE DE DUPLICIDADE DA CONSULTA
  ======================================================= */

  const tentativaConsultaRef =
    useRef<{
      assinatura: string;
      requestId: string;
    } | null>(null);

  const envioEmAndamentoRef =
    useRef(false);

  /* =======================================================
     CONSULTAR RESTAURANTES
  ======================================================= */

  useEffect(() => {
    const cancelar =
      onSnapshot(
        collection(
          db,
          "catalogoPublico"
        ),

        (resultado) => {
          const lista: RestaurantePublico[] =
            resultado.docs.map(
              (documento) => {
                const dados =
                  documento.data();

                const modalidade =
                  texto(
                    dados.modalidadeEntrega
                  );

                return {
                  id:
                    documento.id,

                  nome:
                    texto(
                      dados.nome
                    ) ||
                    "Restaurante",

                  categoria:
                    texto(
                      dados.categoria
                    ) ||
                    "Gastronomia Especial",

                  descricao:
                    texto(
                      dados.descricao
                    ),

                  whatsapp:
                    texto(
                      dados.whatsapp
                    ) ||
                    texto(
                      dados.telefone
                    ),

                  telefone:
                    texto(
                      dados.telefone
                    ) ||
                    texto(
                      dados.whatsapp
                    ),

                  modalidadeEntrega:
                    modalidade ===
                    "retirada_anfitriao"
                      ? "retirada_anfitriao"
                      : "entrega_propria",

                  horarioFuncionamento:
                    texto(
                      dados.horarioFuncionamento
                    ),

                  logoUrl:
                    texto(
                      dados.logoUrl
                    ) ||
                    texto(
                      dados.logo
                    ),

                  imagemCapa:
                    texto(
                      dados.imagemCapa
                    ),

                  endereco:
                    texto(
                      dados.endereco
                    ),

                  ativo:
                    dados.ativo ===
                    true,

                  aceitaRetirada:
                    dados.permiteRetiradaRestaurante ===
                    true,
                };
              }
            );

          setRestaurantes(
            lista.filter(
              (
                restaurante
              ) =>
                restaurante.ativo
            )
          );

          setCarregando(
            false
          );

          setErroCatalogo(
            ""
          );
        },

        (erro) => {
          console.error(
            "Erro ao consultar restaurantes:",
            erro
          );

          setErroCatalogo(
            mensagemErro(
              erro
            )
          );

          setCarregando(
            false
          );
        }
      );

    return () =>
      cancelar();
  }, []);

  /* =======================================================
     CONSULTAR PRATOS
  ======================================================= */

  useEffect(() => {
    if (
      !restauranteAberto
    ) {
      setPratos([]);

      setCarregandoPratos(
        false
      );

      setErroPratos("");

      return;
    }

    setCarregandoPratos(
      true
    );

    setErroPratos("");

    setPratos([]);

    const cancelar =
      onSnapshot(
        collection(
          db,
          "catalogoPublico",
          restauranteAberto.id,
          "pratos"
        ),

        (resultado) => {
          const lista: PratoPublico[] =
            resultado.docs.map(
              (documento) => {
                const dados =
                  documento.data();

                return {
                  id:
                    documento.id,

                  nome:
                    texto(
                      dados.nome
                    ),

                  descricao:
                    texto(
                      dados.descricao
                    ),

                  preco:
                    typeof dados.preco ===
                    "number"
                      ? dados.preco
                      : 0,

                  pessoas:
                    typeof dados.pessoas ===
                    "number"
                      ? dados.pessoas
                      : 1,

                  imagemUrl:
                    texto(
                      dados.imagemUrl
                    ),

                  disponivel:
                    dados.disponivel ===
                    true,

                  status:
                    texto(
                      dados.status
                    ),
                };
              }
            );

          setPratos(
            lista.filter(
              (prato) =>
                prato.status ===
                  "aprovado" &&
                prato.disponivel &&
                prato.preco >
                  0
            )
          );

          setCarregandoPratos(
            false
          );

          setErroPratos(
            ""
          );
        },

        (erro) => {
          console.error(
            "Erro ao consultar pratos:",
            erro
          );

          setErroPratos(
            mensagemErro(
              erro
            )
          );

          setCarregandoPratos(
            false
          );
        }
      );

    return () =>
      cancelar();
  }, [
    restauranteAberto?.id,
  ]);

  /* =======================================================
     BLOQUEAR ROLAGEM COM MODAL
  ======================================================= */

  useEffect(() => {
    if (
      !restauranteAberto &&
      !carrinhoAberto
    ) {
      return;
    }

    const rolagemAnterior =
      document.body.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        rolagemAnterior;
    };
  }, [
    restauranteAberto,
    carrinhoAberto,
  ]);

  /* =======================================================
     FILTROS
  ======================================================= */

  const restaurantesFiltrados =
    useMemo(() => {
      const termo = busca
        .trim()
        .toLocaleLowerCase(
          "pt-BR"
        );

      return restaurantes.filter(
        (restaurante) => {
          const categoriaCorreta =
            categoria ===
              "Todos" ||
            restaurante.categoria ===
              categoria;

          const buscaCorreta =
            !termo ||
            [
              restaurante.nome,
              restaurante.descricao,
              restaurante.categoria,
            ]
              .join(" ")
              .toLocaleLowerCase(
                "pt-BR"
              )
              .includes(
                termo
              );

          return (
            categoriaCorreta &&
            buscaCorreta
          );
        }
      );
    }, [
      restaurantes,
      categoria,
      busca,
    ]);

  /* =======================================================
     SEPARAR ENTREGA E RETIRADA
  ======================================================= */

  const comEntrega =
    restaurantesFiltrados.filter(
      (
        restaurante
      ) =>
        restaurante.modalidadeEntrega ===
        "entrega_propria"
    );

  const semEntrega =
    restaurantesFiltrados.filter(
      (
        restaurante
      ) =>
        restaurante.modalidadeEntrega ===
        "retirada_anfitriao"
    );

  /* =======================================================
     CARRINHO
  ======================================================= */

  const quantidadeTotal =
    carrinho.reduce(
      (
        total,
        item
      ) =>
        total +
        item.quantidade,
      0
    );

  /* =======================================================
     ABRIR RESTAURANTE
  ======================================================= */

  function abrirRestaurante(
    restaurante: RestaurantePublico
  ) {
    setRestauranteAberto(
      restaurante
    );

    setCarrinhoAberto(
      false
    );

    setErroPratos("");

    setErroPedido("");
  }

  /* =======================================================
     FECHAR RESTAURANTE
  ======================================================= */

  function fecharRestaurante() {
    setRestauranteAberto(
      null
    );

    setPratos([]);

    setErroPratos("");
  }

  /* =======================================================
     ADICIONAR PRATO
  ======================================================= */

  function adicionarPrato(
    prato: PratoPublico
  ) {
    if (
      !restauranteAberto
    ) {
      return;
    }

    const restaurante =
      restauranteAberto;

    setErroPedido("");

    if (
      carrinho.some(
        (item) =>
          item.restauranteId !==
          restaurante.id
      )
    ) {
      setErroPedido(
        "Finalize ou limpe os itens do outro restaurante antes de adicionar este prato."
      );

      return;
    }

    setCarrinho(
      (anterior) => {
        const itemExistente =
          anterior.find(
            (item) =>
              item.restauranteId ===
                restaurante.id &&
              item.pratoId ===
                prato.id
          );

        if (
          !itemExistente
        ) {
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

        return anterior.map(
          (item) => {
            if (
              item.restauranteId ===
                restaurante.id &&
              item.pratoId ===
                prato.id
            ) {
              return {
                ...item,

                quantidade:
                  Math.min(
                    20,
                    item.quantidade +
                      1
                  ),
              };
            }

            return item;
          }
        );
      }
    );
  }

  /* =======================================================
     ALTERAR QUANTIDADE
  ======================================================= */

  function alterarQuantidadeCarrinho(
    pratoId: string,
    quantidade: number
  ) {
    const quantidadeSegura =
      Math.max(
        1,
        Math.min(
          20,
          quantidade
        )
      );

    setCarrinho(
      (anterior) =>
        anterior.map(
          (item) =>
            item.pratoId ===
            pratoId
              ? {
                  ...item,

                  quantidade:
                    quantidadeSegura,
                }
              : item
        )
    );

    setErroPedido("");
  }

  /* =======================================================
     ALTERAR OBSERVAÇÃO
  ======================================================= */

  function alterarObservacaoCarrinho(
    pratoId: string,
    valor: string
  ) {
    const observacao =
      valor.slice(
        0,
        300
      );

    const item =
      carrinho.find(
        (produto) =>
          produto.pratoId ===
          pratoId
      );

    if (!item) {
      return;
    }

    const chave =
      chavePrato(
        item.restauranteId,
        item.pratoId
      );

    setObservacoes(
      (anterior) => ({
        ...anterior,

        [chave]:
          observacao,
      })
    );

    setCarrinho(
      (anterior) =>
        anterior.map(
          (produto) =>
            produto.pratoId ===
            pratoId
              ? {
                  ...produto,

                  observacao,
                }
              : produto
        )
    );
  }

  /* =======================================================
     REMOVER ITEM
  ======================================================= */

  function removerItem(
    pratoId: string
  ) {
    setCarrinho(
      (anterior) =>
        anterior.filter(
          (item) =>
            item.pratoId !==
            pratoId
        )
    );

    setErroPedido("");
  }

  /* =======================================================
     LIMPAR CARRINHO
  ======================================================= */

  function limparCarrinho() {
    const confirmou =
      window.confirm(
        "Deseja remover todos os itens do carrinho?"
      );

    if (!confirmou) {
      return;
    }

    setCarrinho([]);

    setErroPedido("");

    setRespostaConsulta(
      null
    );

    setAtendimento(
      "entrega"
    );

    setPagamento(
      "pix"
    );
  }

  /* =======================================================
     PREPARAR CONSULTA / WHATSAPP
  ======================================================= */

  async function prepararWhatsApp() {
    if (
      envioEmAndamentoRef.current
    ) {
      return;
    }

    setErroPedido("");

    setRespostaConsulta(
      null
    );

    /* -----------------------------------------------------
       CARRINHO
    ----------------------------------------------------- */

    if (
      carrinho.length === 0
    ) {
      setErroPedido(
        "Adicione pelo menos um prato ao carrinho."
      );

      return;
    }

    if (
      !CHECKOUT_VALIDADO_NO_SERVIDOR
    ) {
      setErroPedido(
        "Estamos concluindo a integração segura de entrega e pagamento. A consulta ficará disponível após a atualização da função no servidor."
      );

      return;
    }

    if (
      !atendimento ||
      !pagamento
    ) {
      setErroPedido(
        "Escolha a modalidade de atendimento e a forma de pagamento."
      );

      return;
    }

    /* -----------------------------------------------------
       RESTAURANTE
    ----------------------------------------------------- */

    const restauranteIds = [
      ...new Set(
        carrinho.map(
          (item) =>
            item.restauranteId
        )
      ),
    ];

    if (
      restauranteIds.length !==
      1
    ) {
      setErroPedido(
        "Faça uma consulta para um restaurante por vez."
      );

      return;
    }

    const restaurante =
      restaurantes.find(
        (item) =>
          item.id ===
          restauranteIds[0]
      );

    if (
      !restaurante ||
      !restaurante.ativo
    ) {
      setErroPedido(
        "Este restaurante não está disponível."
      );

      return;
    }

    /* -----------------------------------------------------
       VALIDAR ATENDIMENTO
    ----------------------------------------------------- */

    if (
      atendimento ===
        "entrega" &&
      restaurante.modalidadeEntrega !==
        "entrega_propria"
    ) {
      setErroPedido(
        "Este restaurante não oferece entrega própria."
      );

      return;
    }

    if (
      atendimento ===
        "retirada_restaurante" &&
      !restaurante.aceitaRetirada
    ) {
      setErroPedido(
        "A retirada no restaurante não está autorizada neste cadastro."
      );

      return;
    }

    if (
      atendimento ===
      "retirada_anfitriao"
    ) {
      setErroPedido(
        "Confirme previamente a retirada com o anfitrião antes de enviar a consulta."
      );

      return;
    }

    /* -----------------------------------------------------
       SUPABASE
    ----------------------------------------------------- */

    const supabaseUrl = (
      import.meta.env
        .VITE_SUPABASE_URL ||
      ""
    ).replace(
      /\/$/,
      ""
    );

    const supabaseKey =
      import.meta.env
        .VITE_SUPABASE_PUBLISHABLE_KEY ||
      "";

    if (!supabaseUrl) {
      setErroPedido(
        "O serviço de consultas não está configurado. Entre em contato com a administração."
      );

      return;
    }

    /* -----------------------------------------------------
       DADOS
    ----------------------------------------------------- */

    const itensParaServidor =
      carrinho.map(
        (item) => ({
          pratoId:
            item.pratoId,

          quantidade:
            item.quantidade,

          observacao:
            item.observacao.trim(),
        })
      );

    const assinatura =
      JSON.stringify({
        restauranteId:
          restaurante.id,

        atendimento,

        pagamento,

        itens: [
          ...itensParaServidor,
        ].sort(
          (
            a,
            b
          ) =>
            a.pratoId.localeCompare(
              b.pratoId
            )
        ),
      });

    if (
      tentativaConsultaRef.current
        ?.assinatura !==
      assinatura
    ) {
      tentativaConsultaRef.current =
        {
          assinatura,

          requestId:
            crypto.randomUUID(),
        };
    }

    const requestId =
      tentativaConsultaRef.current
        .requestId;

    /* -----------------------------------------------------
       ABRIR JANELA
    ----------------------------------------------------- */

    const janelaWhatsApp =
      window.open(
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

    envioEmAndamentoRef.current =
      true;

    setEnviandoConsulta(
      true
    );

    try {
      /* ---------------------------------------------------
         EDGE FUNCTION
      --------------------------------------------------- */

      const resposta =
        await fetch(
          `${supabaseUrl}/functions/v1/registrar-consulta`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              ...(supabaseKey
                ? {
                    apikey:
                      supabaseKey,
                  }
                : {}),
            },

            body:
              JSON.stringify({
                restauranteId:
                  restaurante.id,

                requestId,

                atendimento,

                pagamento,

                itens:
                  itensParaServidor,
              }),
          }
        );

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

      /* ---------------------------------------------------
         VALIDAR RESPOSTA
      --------------------------------------------------- */

      const itensConfirmados =
        resultado.itens;

      const nomeRestaurante =
        resultado.restauranteNome;

      const telefone = (
        resultado.restauranteWhatsapp ||
        ""
      ).replace(
        /\D/g,
        ""
      );

      if (
        !Array.isArray(
          itensConfirmados
        ) ||
        itensConfirmados.length ===
          0 ||
        typeof resultado.subtotal !==
          "number" ||
        typeof resultado.taxaEntrega !==
          "number" ||
        typeof resultado.totalEstimado !==
          "number" ||
        resultado.atendimento !==
          atendimento ||
        resultado.pagamento !==
          pagamento ||
        !nomeRestaurante ||
        !/^\d{12,15}$/.test(
          telefone
        )
      ) {
        throw new Error(
          "A consulta foi registrada, mas não foi possível preparar o WhatsApp. Anote a referência: " +
            resultado.consultaId
        );
      }

      setRespostaConsulta(
        resultado
      );

      /* ---------------------------------------------------
         MENSAGEM
      --------------------------------------------------- */

      const linhasPratos =
        itensConfirmados.flatMap(
          (
            item,
            indice
          ) => {
            const linhas = [
              `${
                indice + 1
              }. ${
                item.quantidade
              }x ${
                item.nome
              }`,

              `Valor: ${dinheiro(
                item.subtotal
              )}`,
            ];

            if (
              item.observacao.trim()
            ) {
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

        `*Pratos:* ${dinheiro(
          resultado.subtotal
        )}`,

        `*Atendimento:* ${
          resultado.atendimentoDescricao ||
          (atendimento ===
          "entrega"
            ? "Entrega no chalé"
            : "Retirada no restaurante")
        }`,

        `*Taxa de entrega:* ${dinheiro(
          resultado.taxaEntrega
        )}`,

        `*Total estimado:* ${dinheiro(
          resultado.totalEstimado
        )}`,

        `*Preferência de pagamento:* ${
          resultado.pagamentoDescricao ||
          pagamento.toUpperCase()
        }`,

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

      const linkWhatsApp =
        `https://wa.me/${telefone}?text=` +
        encodeURIComponent(
          mensagem
        );

      janelaWhatsApp.location.href =
        linkWhatsApp;

      setCarrinhoAberto(
        false
      );
    } catch (erro) {
      janelaWhatsApp.close();

      console.error(
        "Erro ao registrar consulta:",
        erro
      );

      const mensagem =
        erro instanceof Error
          ? erro.message
          : "Não foi possível registrar a consulta. Tente novamente.";

      setErroPedido(
        mensagem
      );

      setRespostaConsulta({
        sucesso:
          false,

        erro:
          mensagem,
      });
    } finally {
      envioEmAndamentoRef.current =
        false;

      setEnviandoConsulta(
        false
      );
    }
  }

  /* =======================================================
     INTERFACE
  ======================================================= */

  return (
    <div
      className={`
        relative

        overflow-hidden

        bg-black
        text-white

        ${
          temaCliente
            ? "catalogo-cliente"
            : ""
        }
      `}
    >
      {/* ===================================================
          CONTEÚDO PRINCIPAL
      =================================================== */}

      <main
        className="
          relative
          z-10

          mx-auto

          w-full
          max-w-7xl

          px-4

          pb-24
          pt-6

          sm:px-6
          sm:pt-8

          lg:px-8
          lg:pt-10
        "
      >
        {/* ===============================================
            FILTROS / ESCOLHA DA EXPERIÊNCIA
        =============================================== */}

        <section
          id="categorias"
          className="
            scroll-mt-24
          "
        >
          <FiltrosCatalogo
            busca={
              busca
            }
            categoria={
              categoria
            }
            quantidadeResultados={
              restaurantesFiltrados.length
            }
            onBuscaChange={
              setBusca
            }
            onCategoriaChange={
              setCategoria
            }
          />
        </section>

        {/* ===============================================
            PARCEIROS
        =============================================== */}

        <div
          className="
            mb-14

            sm:mb-16
          "
        >
          <ParceirosCarrossel />
        </div>

        {/* ===============================================
            CARREGAMENTO
        =============================================== */}

        {carregando && (
          <div
            className="
              mb-10

              rounded-2xl

              border
              border-white/10

              bg-gradient-to-r
              from-[#252525]
              via-[#171717]
              to-[#0b0b0b]

              p-5

              text-center

              text-sm
              font-bold

              text-white/60
            "
          >
            <span
              className="
                mr-2

                inline-block

                animate-spin
              "
            >
              ⏳
            </span>

            Carregando restaurantes...
          </div>
        )}

        {/* ===============================================
            ERRO FIREBASE
        =============================================== */}

        {erroCatalogo && (
          <div
            role="alert"
            className="
              mb-10

              rounded-2xl

              border
              border-red-400/25

              bg-red-500/[0.08]

              p-5

              text-sm
              font-bold

              text-red-300
            "
          >
            ⚠️{" "}
            {erroCatalogo}
          </div>
        )}

        {/* ===============================================
            ENTREGA
        =============================================== */}

        {!carregando &&
          !erroCatalogo && (
            <SecaoEntrega
              restaurantes={
                comEntrega
              }
              onAbrirRestaurante={
                abrirRestaurante
              }
            />
          )}

        {/* ===============================================
            RETIRADA
        =============================================== */}

        {!carregando &&
          !erroCatalogo && (
            <SecaoRetirada
              restaurantes={
                semEntrega
              }
              onAbrirRestaurante={
                abrirRestaurante
              }
            />
          )}

        {/* ===============================================
            AVISO FINAL
        =============================================== */}

        <section
          className="
            relative

            mt-12

            overflow-hidden

            rounded-[28px]

            border
            border-white/10

            bg-gradient-to-br
            from-[#303030]
            via-[#171717]
            to-[#070707]

            p-7

            text-center

            shadow-[0_20px_60px_rgba(0,0,0,0.45)]

            sm:p-9

            md:p-12
          "
        >
          {/* BRILHO SUPERIOR */}

          <div
            aria-hidden="true"
            className="
              pointer-events-none

              absolute
              left-1/2
              top-0

              h-48
              w-80

              -translate-x-1/2
              -translate-y-1/2

              rounded-full

              bg-[#d4af37]/10

              blur-[90px]
            "
          />

          <div
            className="
              relative
              z-10
            "
          >
            <span
              className="
                text-3xl

                sm:text-4xl
              "
            >
              🌿
            </span>

            <h2
              className="
                mt-4

                text-2xl
                font-black

                text-white

                sm:text-3xl
              "
            >
              Saboreie cada momento
              da sua viagem.
            </h2>

            <p
              className="
                mx-auto
                mt-4

                max-w-2xl

                text-sm
                leading-7

                text-white/50
              "
            >
              Nosso catálogo apresenta
              restaurantes parceiros.
              Disponibilidade, valor
              final, pedido, pagamento
              e entrega devem ser
              confirmados diretamente
              com o estabelecimento.
            </p>
          </div>
        </section>
      </main>

      {/* ===================================================
          MODAL DO RESTAURANTE
      =================================================== */}

      <RestauranteModal
        restaurante={
          restauranteAberto
        }
        pratos={
          pratos
        }
        carregandoPratos={
          carregandoPratos
        }
        onFechar={
          fecharRestaurante
        }
        onAdicionarPrato={
          adicionarPrato
        }
      />

      {/* ===================================================
          ERRO DOS PRATOS
      =================================================== */}

      {restauranteAberto &&
        erroPratos && (
          <div
            className="
              fixed
              left-1/2
              top-5

              z-[400]

              w-[calc(100%-32px)]
              max-w-lg

              -translate-x-1/2

              rounded-2xl

              border
              border-red-400/30

              bg-[#240b0b]/95

              p-4

              text-center

              text-sm
              font-bold

              text-red-300

              shadow-2xl

              backdrop-blur-xl
            "
          >
            ⚠️{" "}
            {erroPratos}
          </div>
        )}

      {/* ===================================================
          BOTÃO FLUTUANTE DO CARRINHO
      =================================================== */}

      {!carrinhoAberto && (
        <button
          type="button"
          onClick={() => {
            setCarrinhoAberto(
              true
            );

            setRestauranteAberto(
              null
            );
          }}
          aria-label={`Abrir carrinho com ${quantidadeTotal} itens`}
          className="
            fixed

            bottom-5
            right-4

            z-[150]

            flex
            h-16
            w-16

            items-center
            justify-center

            rounded-full

            border-2
            border-[#d4af37]

            bg-gradient-to-br
            from-[#333333]
            via-[#181818]
            to-black

            text-2xl

            shadow-[0_0_30px_rgba(212,175,55,0.32)]

            transition-all
            duration-300

            hover:scale-110

            sm:bottom-7
            sm:right-7
          "
        >
          🛒

          {quantidadeTotal >
            0 && (
            <span
              className="
                absolute

                -right-1
                -top-1

                flex
                h-7
                min-w-7

                items-center
                justify-center

                rounded-full

                border-2
                border-black

                bg-[#d4af37]

                px-1

                text-xs
                font-black

                text-black
              "
            >
              {
                quantidadeTotal
              }
            </span>
          )}
        </button>
      )}

      {/* ===================================================
          MODAL DO CARRINHO
      =================================================== */}

      <CarrinhoModal
        aberto={
          carrinhoAberto
        }
        itens={
          carrinho
        }
        atendimento={
          atendimento
        }
        pagamento={
          pagamento
        }
        carregando={
          enviandoConsulta
        }
        resposta={
          respostaConsulta
        }
        onFechar={() =>
          setCarrinhoAberto(
            false
          )
        }
        onAlterarQuantidade={
          alterarQuantidadeCarrinho
        }
        onAlterarObservacao={
          alterarObservacaoCarrinho
        }
        onRemover={
          removerItem
        }
        onLimpar={
          limparCarrinho
        }
        onAtendimentoChange={
          setAtendimento
        }
        onPagamentoChange={
          setPagamento
        }
        onEnviarConsulta={
          prepararWhatsApp
        }
      />

      {/* ===================================================
          ERRO DO PEDIDO
      =================================================== */}

      {erroPedido && (
        <div
          role="alert"
          className="
            fixed

            bottom-24
            left-1/2

            z-[500]

            w-[calc(100%-32px)]
            max-w-xl

            -translate-x-1/2

            rounded-2xl

            border
            border-red-400/30

            bg-[#210909]/95

            p-4

            text-sm
            font-bold
            leading-6

            text-red-300

            shadow-[0_20px_60px_rgba(0,0,0,0.70)]

            backdrop-blur-xl
          "
        >
          <div
            className="
              flex

              items-start
              justify-between

              gap-4
            "
          >
            <span>
              ⚠️{" "}
              {
                erroPedido
              }
            </span>

            <button
              type="button"
              onClick={() =>
                setErroPedido(
                  ""
                )
              }
              className="
                shrink-0

                text-white/50

                transition-colors

                hover:text-white
              "
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CatalogoConteudo;