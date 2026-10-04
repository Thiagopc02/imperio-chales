import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";

import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase/config";

import consultasIcon from "../cliente/consultas.png";

import entregaIcon from "../components/catalogo/entrega.png";

import restauranteEmoji from "../components/catalogo/restaurante-emoji.png";

/* =========================================================
   TIPOS
========================================================= */

type StatusConsulta =
  | "consulta_pendente"
  | "confirmado"
  | "indisponivel";

interface ItemConsulta {
  pratoId: string;

  nome: string;

  descricao: string;

  imagemUrl: string;

  imagem: string;

  precoUnitario: number;

  quantidade: number;

  subtotal: number;

  observacao: string;
}

interface ConsultaCardapio {
  id: string;

  restauranteId: string;

  restauranteNome: string;

  restauranteWhatsapp: string;

  modalidadeEntrega: string;

  atendimento: string;

  atendimentoDescricao: string;

  pagamento: string;

  pagamentoDescricao: string;

  taxaEntrega: number | null;

  totalEstimado: number | null;

  status: StatusConsulta;

  origem: string;

  subtotal: number;

  totalItens: number;

  itens: ItemConsulta[];

  criadoEm: Timestamp | null;

  atualizadoEm: Timestamp | null;
}

type FiltroConsulta =
  | "todas"
  | "consulta_pendente"
  | "confirmado"
  | "indisponivel";

/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function texto(
  valor: unknown
): string {
  return typeof valor === "string"
    ? valor
    : "";
}

function numero(
  valor: unknown
): number {
  return typeof valor === "number" &&
    Number.isFinite(valor)
    ? valor
    : 0;
}

function referenciaCurta(
  id: string
): string {
  const semPrefixo =
    id.replace(
      /^consulta_/,
      ""
    );

  return semPrefixo
    .slice(0, 8)
    .toUpperCase();
}

function descricaoAtendimento(
  consulta: ConsultaCardapio
): string {
  if (
    consulta.atendimentoDescricao
  ) {
    return consulta.atendimentoDescricao;
  }

  switch (
    consulta.atendimento
  ) {
    case "entrega":
      return "Entrega no chalé";

    case "retirada_restaurante":
      return "Retirada no restaurante";

    case "retirada_anfitriao":
      return "Retirada sob consulta";

    default:
      return "Não informado";
  }
}

function descricaoPagamento(
  consulta: ConsultaCardapio
): string {
  if (
    consulta.pagamentoDescricao
  ) {
    return consulta.pagamentoDescricao;
  }

  switch (
    consulta.pagamento
  ) {
    case "pix":
      return "PIX";

    case "credito":
      return "Cartão de crédito";

    case "debito":
      return "Cartão de débito";

    case "dinheiro":
      return "Dinheiro";

    default:
      return "Não informado";
  }
}

function dinheiro(
  valor: number
): string {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  ).format(valor);
}

function formatarData(
  valor: Timestamp | null
): string {
  if (!valor) {
    return "Data não disponível";
  }

  try {
    return new Intl.DateTimeFormat(
      "pt-BR",
      {
        dateStyle: "short",
        timeStyle: "short",
      }
    ).format(
      valor.toDate()
    );
  } catch {
    return "Data não disponível";
  }
}

function lerItem(
  valor: unknown
): ItemConsulta {
  const dados =
    typeof valor ===
      "object" &&
    valor !== null &&
    !Array.isArray(valor)
      ? (
          valor as Record<
            string,
            unknown
          >
        )
      : {};

  return {
    pratoId:
      texto(
        dados.pratoId
      ),

    nome:
      texto(
        dados.nome
      ) ||
      "Prato sem nome",

    descricao:
      texto(
        dados.descricao
      ),

    imagemUrl:
      texto(
        dados.imagemUrl
      ) ||
      texto(
        dados.imagem
      ),

    imagem:
      texto(
        dados.imagem
      ) ||
      texto(
        dados.imagemUrl
      ),

    precoUnitario:
      numero(
        dados.precoUnitario
      ),

    quantidade:
      numero(
        dados.quantidade
      ),

    subtotal:
      numero(
        dados.subtotal
      ),

    observacao:
      texto(
        dados.observacao
      ),
  };
}

function mensagemErroFirebase(
  erro: unknown
): string {
  if (
    typeof erro ===
      "object" &&
    erro !== null &&
    "code" in erro
  ) {
    const codigo =
      String(
        (
          erro as {
            code: unknown;
          }
        ).code
      );

    if (
      codigo ===
      "permission-denied"
    ) {
      return (
        "O Firebase bloqueou o acesso. " +
        "Confira se você entrou com a conta do parceiro aprovado."
      );
    }

    if (
      codigo ===
      "failed-precondition"
    ) {
      return (
        "O Firestore solicitou uma configuração adicional. " +
        "Confira o console."
      );
    }
  }

  return (
    "Não foi possível consultar os dados. " +
    "Confira sua conexão e tente novamente."
  );
}

/* =========================================================
   STATUS
========================================================= */

function tituloStatus(
  status: StatusConsulta
): string {
  switch (status) {
    case "consulta_pendente":
      return "AGUARDANDO RESPOSTA";

    case "confirmado":
      return "CONFIRMADO";

    case "indisponivel":
      return "INDISPONÍVEL";

    default:
      return "DESCONHECIDO";
  }
}

function corStatus(
  status: StatusConsulta
): string {
  switch (status) {
    case "consulta_pendente":
      return `
        border-[#ffcc00]/30
        bg-[#ffcc00]/10
        text-[#ffd83d]
      `;

    case "confirmado":
      return `
        border-[#00ef78]/35
        bg-[#00ef78]/10
        text-[#00ef78]
      `;

    case "indisponivel":
      return `
        border-red-500/35
        bg-red-500/10
        text-red-400
      `;

    default:
      return `
        border-white/15
        bg-white/5
        text-white/50
      `;
  }
}

/* =========================================================
   COMPONENTE
========================================================= */

export function ParceiroPedidos() {
  /* =======================================================
     AUTENTICAÇÃO
  ======================================================= */

  const [
    usuario,
    setUsuario,
  ] =
    useState<User | null>(
      null
    );

  const [
    verificandoLogin,
    setVerificandoLogin,
  ] =
    useState(true);

  /* =======================================================
     CONSULTAS
  ======================================================= */

  const [
    consultas,
    setConsultas,
  ] =
    useState<
      ConsultaCardapio[]
    >([]);

  const [
    carregando,
    setCarregando,
  ] =
    useState(true);

  const [
    erroConsulta,
    setErroConsulta,
  ] =
    useState("");

  const [
    sucesso,
    setSucesso,
  ] =
    useState("");

  const [
    filtro,
    setFiltro,
  ] =
    useState<FiltroConsulta>(
      "todas"
    );

  const [
    busca,
    setBusca,
  ] =
    useState("");

  const [
    salvandoId,
    setSalvandoId,
  ] =
    useState<
      string | null
    >(null);

  /* =======================================================
     LOGIN
  ======================================================= */

  useEffect(() => {
    const cancelar =
      onAuthStateChanged(
        auth,
        (
          usuarioAtual
        ) => {
          setUsuario(
            usuarioAtual
          );

          setVerificandoLogin(
            false
          );
        }
      );

    return () =>
      cancelar();
  }, []);

  /* =======================================================
     CONSULTAS FIREBASE
  ======================================================= */

  useEffect(() => {
    if (
      verificandoLogin
    ) {
      return;
    }

    if (!usuario) {
      setConsultas([]);

      setCarregando(
        false
      );

      setErroConsulta(
        ""
      );

      return;
    }

    setCarregando(
      true
    );

    setErroConsulta(
      ""
    );

    const consultaFirebase =
      query(
        collection(
          db,
          "consultasCardapio"
        ),

        where(
          "restauranteId",
          "==",
          usuario.uid
        )
      );

    const cancelar =
      onSnapshot(
        consultaFirebase,

        (
          resultado
        ) => {
          const lista:
            ConsultaCardapio[] =
            resultado.docs.map(
              (
                documento
              ) => {
                const dados =
                  documento.data();

                const statusOriginal =
                  texto(
                    dados.status
                  );

                const status:
                  StatusConsulta =
                  statusOriginal ===
                  "confirmado"
                    ? "confirmado"
                    : statusOriginal ===
                        "indisponivel"
                      ? "indisponivel"
                      : "consulta_pendente";

                const itens =
                  Array.isArray(
                    dados.itens
                  )
                    ? dados.itens.map(
                        lerItem
                      )
                    : [];

                return {
                  id:
                    documento.id,

                  restauranteId:
                    texto(
                      dados.restauranteId
                    ),

                  restauranteNome:
                    texto(
                      dados.restauranteNome
                    ),

                  restauranteWhatsapp:
                    texto(
                      dados.restauranteWhatsapp
                    ),

                  modalidadeEntrega:
                    texto(
                      dados.modalidadeEntrega
                    ),

                  atendimento:
                    texto(
                      dados.atendimento
                    ),

                  atendimentoDescricao:
                    texto(
                      dados.atendimentoDescricao
                    ),

                  pagamento:
                    texto(
                      dados.pagamento
                    ),

                  pagamentoDescricao:
                    texto(
                      dados.pagamentoDescricao
                    ),

                  taxaEntrega:
                    typeof dados.taxaEntrega ===
                      "number" &&
                    Number.isFinite(
                      dados.taxaEntrega
                    )
                      ? dados.taxaEntrega
                      : null,

                  totalEstimado:
                    typeof dados.totalEstimado ===
                      "number" &&
                    Number.isFinite(
                      dados.totalEstimado
                    )
                      ? dados.totalEstimado
                      : null,

                  status,

                  origem:
                    texto(
                      dados.origem
                    ),

                  subtotal:
                    numero(
                      dados.subtotal
                    ),

                  totalItens:
                    numero(
                      dados.totalItens
                    ),

                  itens,

                  criadoEm:
                    dados.criadoEm ??
                    null,

                  atualizadoEm:
                    dados.atualizadoEm ??
                    null,
                };
              }
            );

          lista.sort(
            (
              primeira,
              segunda
            ) => {
              const dataPrimeira =
                primeira.criadoEm?.toMillis() ??
                0;

              const dataSegunda =
                segunda.criadoEm?.toMillis() ??
                0;

              return (
                dataSegunda -
                dataPrimeira
              );
            }
          );

          setConsultas(
            lista
          );

          setCarregando(
            false
          );

          setErroConsulta(
            ""
          );
        },

        (
          erro
        ) => {
          console.error(
            "Erro ao consultar solicitações:",
            erro
          );

          setErroConsulta(
            mensagemErroFirebase(
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
  }, [
    usuario?.uid,
    verificandoLogin,
  ]);

  /* =======================================================
     INDICADORES
  ======================================================= */

  const pendentes =
    consultas.filter(
      (
        consulta
      ) =>
        consulta.status ===
        "consulta_pendente"
    ).length;

  const confirmadas =
    consultas.filter(
      (
        consulta
      ) =>
        consulta.status ===
        "confirmado"
    ).length;

  const indisponiveis =
    consultas.filter(
      (
        consulta
      ) =>
        consulta.status ===
        "indisponivel"
    ).length;

  const totalConsultas =
    consultas.length;

  /* =======================================================
     FILTRAGEM
  ======================================================= */

  const consultasFiltradas =
    useMemo(() => {
      const termo =
        busca
          .trim()
          .toLocaleLowerCase(
            "pt-BR"
          );

      return consultas.filter(
        (
          consulta
        ) => {
          const filtroCorreto =
            filtro ===
              "todas" ||
            consulta.status ===
              filtro;

          const textoPesquisavel =
            [
              consulta.id,

              consulta.restauranteNome,

              ...consulta.itens.map(
                (
                  item
                ) =>
                  item.nome
              ),
            ]
              .join(" ")
              .toLocaleLowerCase(
                "pt-BR"
              );

          const buscaCorreta =
            !termo ||
            textoPesquisavel.includes(
              termo
            );

          return (
            filtroCorreto &&
            buscaCorreta
          );
        }
      );
    }, [
      consultas,
      filtro,
      busca,
    ]);

  /* =======================================================
     RESPONDER CONSULTA
  ======================================================= */

  async function responderConsulta(
    consulta: ConsultaCardapio,

    novoStatus:
      | "confirmado"
      | "indisponivel"
  ) {
    if (!usuario) {
      setErroConsulta(
        "Entre na sua conta de parceiro para responder."
      );

      return;
    }

    if (
      consulta.restauranteId !==
      usuario.uid
    ) {
      setErroConsulta(
        "Você não possui permissão para responder esta consulta."
      );

      return;
    }

    if (
      consulta.status !==
      "consulta_pendente"
    ) {
      setErroConsulta(
        "Esta consulta já foi respondida."
      );

      return;
    }

    if (
      salvandoId
    ) {
      return;
    }

    const acao =
      novoStatus ===
      "confirmado"
        ? "confirmar a disponibilidade"
        : "marcar os itens como indisponíveis";

    const confirmou =
      window.confirm(
        `Deseja ${acao} para esta consulta?`
      );

    if (!confirmou) {
      return;
    }

    setErroConsulta(
      ""
    );

    setSucesso(
      ""
    );

    setSalvandoId(
      consulta.id
    );

    try {
      await updateDoc(
        doc(
          db,

          "consultasCardapio",

          consulta.id
        ),

        {
          status:
            novoStatus,

          atualizadoEm:
            serverTimestamp(),
        }
      );

      setSucesso(
        novoStatus ===
          "confirmado"
          ? "Disponibilidade confirmada com sucesso."
          : "Indisponibilidade registrada com sucesso."
      );
    } catch (
      erro
    ) {
      console.error(
        "Erro ao responder consulta:",
        erro
      );

      setErroConsulta(
        mensagemErroFirebase(
          erro
        )
      );
    } finally {
      setSalvandoId(
        null
      );
    }
  }

  /* =======================================================
     INTERFACE
  ======================================================= */

  return (
    <main
      className="
        min-h-screen
        overflow-x-hidden

        bg-black
        text-white
      "
      style={{
        fontFamily:
          "'Arial Black', 'Montserrat', Arial, sans-serif",
      }}
    >
      {/* ===================================================
          CABEÇALHO
      =================================================== */}

      <header
        className="
          sticky
          top-0
          z-50

          border-b
          border-white/10

          bg-black/95

          px-4
          py-4

          backdrop-blur-xl
        "
      >
        <div
          className="
            mx-auto

            flex
            max-w-[1500px]

            items-center
            justify-between

            gap-4
          "
        >
          <Link
            to="/parceiro/dashboard"
            className="
              flex
              items-center

              gap-3
            "
          >
            <img
              src="/coroa.png"
              alt="Império"
              draggable={false}
              className="
                h-10
                w-10

                object-contain

                drop-shadow-[0_0_10px_rgba(255,255,255,0.25)]
              "
            />

            <div>
              <p
                className="
                  text-[11px]
                  font-black

                  uppercase

                  tracking-[0.05em]

                  text-white
                "
              >
                Portal do Parceiro
              </p>

              <p
                className="
                  mt-1

                  text-[7px]
                  font-black

                  uppercase

                  tracking-[0.22em]

                  text-red-500
                "
              >
                Sabores da Chapada
              </p>
            </div>
          </Link>

          <Link
            to="/parceiro/dashboard"
            className="
              rounded-xl

              border
              border-white/15

              bg-[#101010]

              px-4
              py-3

              text-[10px]
              font-black

              uppercase

              text-white

              transition

              hover:border-red-500
              hover:text-red-400
            "
          >
            ← Voltar ao painel
          </Link>
        </div>
      </header>

      {/* ===================================================
          CONTEÚDO
      =================================================== */}

      <div
        className="
          mx-auto

          w-full
          max-w-[1500px]

          px-4
          pb-20
          pt-8

          sm:px-6

          lg:px-8
        "
      >
        {/* =================================================
            HERO
        ================================================= */}

        <section
          className="
            relative

            overflow-hidden

            rounded-[28px]

            border
            border-red-500/20

            bg-gradient-to-br
            from-[#171717]
            via-[#090909]
            to-[#130303]

            p-6

            shadow-[0_24px_80px_rgba(0,0,0,0.7)]

            sm:p-8

            lg:p-10
          "
        >
          <div
            aria-hidden="true"
            className="
              pointer-events-none

              absolute
              -right-32
              top-1/2

              h-[400px]
              w-[400px]

              -translate-y-1/2

              rounded-full

              bg-red-600/10

              blur-[100px]
            "
          />

          <div
            className="
              relative
              z-10

              grid
              gap-8

              lg:grid-cols-[1fr_320px]
              lg:items-center
            "
          >
            <div>
              <p
                className="
                  text-[9px]
                  font-black

                  uppercase

                  tracking-[0.30em]

                  text-red-500
                "
              >
                Central operacional
              </p>

              <h1
                className="
                  mt-4

                  text-[38px]
                  font-black

                  uppercase

                  leading-[0.88]

                  tracking-[-0.04em]

                  text-white

                  sm:text-[54px]

                  md:text-[66px]
                "
                style={{
                  textShadow:
                    "3px 3px 0 #000",
                }}
              >
                MEUS
                <span
                  className="
                    block
                    text-red-500
                  "
                >
                  PEDIDOS
                </span>
              </h1>

              <p
                className="
                  mt-5

                  max-w-2xl

                  text-sm
                  font-medium

                  leading-7

                  text-white/45
                "
              >
                Consulte as solicitações
                recebidas e informe ao
                hóspede se os itens estão
                disponíveis.
              </p>
            </div>

            <div
              className="
                flex
                justify-center

                lg:justify-end
              "
            >
              <img
                src={
                  consultasIcon
                }
                alt=""
                draggable={
                  false
                }
                className="
                  h-[160px]
                  w-[160px]

                  object-contain

                  drop-shadow-[0_0_35px_rgba(255,0,40,0.18)]

                  sm:h-[210px]
                  sm:w-[210px]
                "
              />
            </div>
          </div>
        </section>

        {/* =================================================
            LOGIN
        ================================================= */}

        {!verificandoLogin &&
          !usuario && (
            <section
              className="
                mt-7

                rounded-[24px]

                border
                border-red-500/25

                bg-red-500/[0.05]

                p-7

                text-center
              "
            >
              <h2
                className="
                  text-xl
                  font-black

                  uppercase
                "
              >
                LOGIN NECESSÁRIO
              </h2>

              <p
                className="
                  mx-auto
                  mt-3

                  max-w-xl

                  text-sm
                  leading-6

                  text-white/50
                "
              >
                Entre com a conta do
                estabelecimento para
                visualizar suas consultas.
              </p>

              <Link
                to="/parceiro/login"
                className="
                  mt-6

                  inline-flex

                  rounded-xl

                  bg-red-500

                  px-7
                  py-4

                  text-xs
                  font-black

                  uppercase

                  text-white

                  shadow-[0_0_25px_rgba(239,68,68,0.25)]

                  transition

                  hover:bg-red-600
                "
              >
                Fazer login →
              </Link>
            </section>
          )}

        {/* =================================================
            INDICADORES
        ================================================= */}

        <section
          className="
            mt-7

            grid
            grid-cols-2

            gap-3

            lg:grid-cols-4
          "
        >
          {[
            {
              titulo:
                "Todas",
              valor:
                totalConsultas,
              cor:
                "text-white",
              borda:
                "border-white/10",
            },

            {
              titulo:
                "Pendentes",
              valor:
                pendentes,
              cor:
                "text-[#ffd52e]",
              borda:
                "border-[#ffd52e]/20",
            },

            {
              titulo:
                "Confirmadas",
              valor:
                confirmadas,
              cor:
                "text-[#00ef78]",
              borda:
                "border-[#00ef78]/20",
            },

            {
              titulo:
                "Indisponíveis",
              valor:
                indisponiveis,
              cor:
                "text-red-500",
              borda:
                "border-red-500/20",
            },
          ].map(
            (
              item
            ) => (
              <article
                key={
                  item.titulo
                }
                className={`
                  rounded-[22px]

                  border
                  ${item.borda}

                  bg-gradient-to-br
                  from-[#191919]
                  to-[#080808]

                  px-4
                  py-6

                  text-center
                `}
              >
                <p
                  className={`
                    text-3xl
                    font-black

                    ${item.cor}
                  `}
                >
                  {verificandoLogin ||
                  carregando
                    ? "—"
                    : item.valor}
                </p>

                <p
                  className="
                    mt-2

                    text-[9px]
                    font-black

                    uppercase

                    tracking-[0.18em]

                    text-white/40
                  "
                >
                  {
                    item.titulo
                  }
                </p>
              </article>
            )
          )}
        </section>

        {/* =================================================
            ALERTAS
        ================================================= */}

        {sucesso && (
          <div
            role="status"
            className="
              mt-6

              rounded-2xl

              border
              border-[#00ef78]/25

              bg-[#00ef78]/10

              p-4

              text-sm
              font-bold

              text-[#00ef78]
            "
          >
            ✓ {sucesso}
          </div>
        )}

        {erroConsulta && (
          <div
            role="alert"
            className="
              mt-6

              rounded-2xl

              border
              border-red-500/25

              bg-red-500/10

              p-4

              text-sm
              font-bold

              text-red-400
            "
          >
            ⚠ {erroConsulta}
          </div>
        )}

        {/* =================================================
            ÁREA DAS CONSULTAS
        ================================================= */}

        <section
          className="
            mt-10

            rounded-[28px]

            border
            border-white/10

            bg-[#070707]

            p-4

            sm:p-6

            lg:p-8
          "
        >
          {/* CABEÇALHO */}

          <div
            className="
              text-center
            "
          >
            <p
              className="
                text-[9px]
                font-black

                uppercase

                tracking-[0.30em]

                text-red-500
              "
            >
              Atendimento
            </p>

            <h2
              className="
                mt-3

                text-3xl
                font-black

                uppercase

                leading-none

                text-white

                sm:text-4xl
              "
            >
              CONSULTAS
              <span
                className="
                  text-red-500
                "
              >
                {" "}RECEBIDAS
              </span>
            </h2>
          </div>

          {/* BUSCA */}

          <div
            className="
              relative

              mt-8
            "
          >
            <span
              className="
                pointer-events-none

                absolute
                left-5
                top-1/2

                -translate-y-1/2

                text-lg
              "
            >
              🔎
            </span>

            <input
              type="search"
              value={
                busca
              }
              onChange={(
                event
              ) =>
                setBusca(
                  event.target.value
                )
              }
              placeholder="Buscar prato ou referência..."
              className="
                w-full

                rounded-2xl

                border
                border-white/10

                bg-[#131313]

                py-4
                pl-14
                pr-5

                text-sm
                font-semibold

                text-white

                outline-none

                placeholder:text-white/25

                focus:border-red-500/60
              "
            />
          </div>

          {/* FILTROS */}

          <div
            className="
              mt-5

              flex
              flex-wrap

              justify-center

              gap-2
            "
          >
            {[
              {
                valor:
                  "todas",
                titulo:
                  "TODAS",
              },

              {
                valor:
                  "consulta_pendente",
                titulo:
                  "PENDENTES",
              },

              {
                valor:
                  "confirmado",
                titulo:
                  "CONFIRMADAS",
              },

              {
                valor:
                  "indisponivel",
                titulo:
                  "INDISPONÍVEIS",
              },
            ].map(
              (
                item
              ) => (
                <button
                  key={
                    item.valor
                  }
                  type="button"
                  onClick={() =>
                    setFiltro(
                      item.valor as FiltroConsulta
                    )
                  }
                  aria-pressed={
                    filtro ===
                    item.valor
                  }
                  className={`
                    rounded-full

                    border

                    px-4
                    py-3

                    text-[9px]
                    font-black

                    uppercase

                    tracking-[0.09em]

                    transition

                    ${
                      filtro ===
                      item.valor
                        ? `
                          border-red-500
                          bg-red-500
                          text-white
                          shadow-[0_0_20px_rgba(239,68,68,0.25)]
                        `
                        : `
                          border-white/10
                          bg-[#111]
                          text-white/50

                          hover:border-white/25
                          hover:text-white
                        `
                    }
                  `}
                >
                  {
                    item.titulo
                  }
                </button>
              )
            )}
          </div>

          {/* CARREGANDO */}

          {(verificandoLogin ||
            carregando) &&
            usuario && (
              <div
                className="
                  mt-8

                  rounded-2xl

                  border
                  border-white/10

                  bg-[#101010]

                  p-8

                  text-center

                  text-sm
                  font-bold

                  text-white/50
                "
              >
                Carregando consultas...
              </div>
            )}

          {/* NENHUMA CONSULTA */}

          {!verificandoLogin &&
            usuario &&
            !carregando &&
            !erroConsulta &&
            consultasFiltradas.length ===
              0 && (
              <div
                className="
                  mt-8

                  rounded-[24px]

                  border
                  border-dashed
                  border-white/15

                  bg-[#0b0b0b]

                  px-6
                  py-12

                  text-center
                "
              >
                <img
                  src={
                    consultasIcon
                  }
                  alt=""
                  draggable={
                    false
                  }
                  className="
                    mx-auto

                    h-24
                    w-24

                    object-contain
                  "
                />

                <h3
                  className="
                    mt-4

                    text-xl
                    font-black

                    uppercase

                    text-white
                  "
                >
                  NENHUMA CONSULTA
                </h3>

                <p
                  className="
                    mx-auto
                    mt-3

                    max-w-lg

                    text-xs
                    leading-6

                    text-white/40
                  "
                >
                  As novas consultas
                  aparecerão aqui
                  automaticamente.
                </p>
              </div>
            )}

          {/* =================================================
              CARDS
          ================================================= */}

          {!verificandoLogin &&
            usuario &&
            !carregando &&
            consultasFiltradas.length >
              0 && (
              <div
                className="
                  mt-8

                  grid
                  gap-5

                  lg:grid-cols-2
                "
              >
                {consultasFiltradas.map(
                  (
                    consulta
                  ) => (
                    <article
                      key={
                        consulta.id
                      }
                      className="
                        group

                        overflow-hidden

                        rounded-[24px]

                        border
                        border-white/10

                        bg-gradient-to-br
                        from-[#171717]
                        via-[#0e0e0e]
                        to-[#050505]

                        shadow-[0_20px_50px_rgba(0,0,0,0.45)]

                        transition

                        hover:border-red-500/25
                      "
                    >
                      {/* =======================================
                          CABEÇALHO
                      ======================================= */}

                      <div
                        className="
                          border-b
                          border-white/10

                          p-5
                        "
                      >
                        <div
                          className="
                            flex
                            flex-wrap

                            items-start
                            justify-between

                            gap-3
                          "
                        >
                          <div>
                            <p
                              className="
                                text-[8px]
                                font-black

                                uppercase

                                tracking-[0.22em]

                                text-red-500
                              "
                            >
                              NOVA CONSULTA
                            </p>

                            <h3
                              className="
                                mt-2

                                text-xl
                                font-black

                                uppercase

                                text-white
                              "
                            >
                              #
                              {referenciaCurta(
                                consulta.id
                              )}
                            </h3>
                          </div>

                          <span
                            className={`
                              rounded-full

                              border

                              px-3
                              py-2

                              text-[8px]
                              font-black

                              uppercase

                              tracking-[0.08em]

                              ${corStatus(
                                consulta.status
                              )}
                            `}
                          >
                            {tituloStatus(
                              consulta.status
                            )}
                          </span>
                        </div>

                        <p
                          className="
                            mt-3

                            text-[11px]

                            text-white/40
                          "
                        >
                          {formatarData(
                            consulta.criadoEm
                          )}
                        </p>
                      </div>

                      {/* =======================================
                          CONTEÚDO
                      ======================================= */}

                      <div
                        className="
                          p-5
                        "
                      >
                        {/* TOTAL */}

                        <div
                          className="
                            flex

                            items-center
                            justify-between

                            gap-4
                          "
                        >
                          <div>
                            <p
                              className="
                                text-[9px]
                                font-black

                                uppercase

                                tracking-[0.15em]

                                text-white/30
                              "
                            >
                              ITENS
                            </p>

                            <p
                              className="
                                mt-1

                                text-lg
                                font-black

                                text-white
                              "
                            >
                              {
                                consulta.totalItens
                              }
                            </p>
                          </div>

                          <div
                            className="
                              text-right
                            "
                          >
                            <p
                              className="
                                text-[9px]
                                font-black

                                uppercase

                                tracking-[0.15em]

                                text-white/30
                              "
                            >
                              TOTAL ESTIMADO
                            </p>

                            <strong
                              className="
                                mt-1
                                block

                                text-xl
                                font-black

                                text-[#00ef78]

                                sm:text-2xl
                              "
                            >
                              {dinheiro(
                                consulta.totalEstimado ??
                                  consulta.subtotal
                              )}
                            </strong>
                          </div>
                        </div>

                        {/* ITENS */}

                        <div
                          className="
                            mt-5

                            space-y-3
                          "
                        >
                          {consulta.itens.map(
                            (
                              item,
                              indice
                            ) => (
                              <div
                                key={`${item.pratoId}-${indice}`}
                                className="
                                  rounded-2xl

                                  border
                                  border-white/10

                                  bg-[#111]

                                  p-3
                                "
                              >
                                <div
                                  className="
                                    flex
                                    items-center

                                    gap-3
                                  "
                                >
                                  {item.imagemUrl ? (
                                    <img
                                      src={
                                        item.imagemUrl
                                      }
                                      alt={
                                        item.nome
                                      }
                                      className="
                                        h-[72px]
                                        w-[72px]

                                        shrink-0

                                        rounded-xl

                                        object-cover
                                      "
                                    />
                                  ) : (
                                    <div
                                      className="
                                        flex

                                        h-[72px]
                                        w-[72px]

                                        shrink-0

                                        items-center
                                        justify-center

                                        rounded-xl

                                        bg-black
                                      "
                                    >
                                      <img
                                        src={
                                          restauranteEmoji
                                        }
                                        alt=""
                                        className="
                                          h-14
                                          w-14

                                          object-contain
                                        "
                                      />
                                    </div>
                                  )}

                                  <div
                                    className="
                                      min-w-0
                                      flex-1
                                    "
                                  >
                                    <h4
                                      className="
                                        text-sm
                                        font-black

                                        uppercase

                                        text-white
                                      "
                                    >
                                      {
                                        item.nome
                                      }
                                    </h4>

                                    <p
                                      className="
                                        mt-2

                                        text-xs

                                        text-white/40
                                      "
                                    >
                                      {
                                        item.quantidade
                                      }
                                      x{" "}
                                      {dinheiro(
                                        item.precoUnitario
                                      )}
                                    </p>

                                    <p
                                      className="
                                        mt-1

                                        text-sm
                                        font-black

                                        text-[#00ef78]
                                      "
                                    >
                                      {dinheiro(
                                        item.subtotal
                                      )}
                                    </p>
                                  </div>
                                </div>

                                {item.observacao && (
                                  <div
                                    className="
                                      mt-3

                                      rounded-xl

                                      border
                                      border-[#ffd52e]/15

                                      bg-[#ffd52e]/5

                                      p-3
                                    "
                                  >
                                    <p
                                      className="
                                        text-[8px]
                                        font-black

                                        uppercase

                                        tracking-[0.15em]

                                        text-[#ffd52e]
                                      "
                                    >
                                      OBSERVAÇÃO
                                    </p>

                                    <p
                                      className="
                                        mt-2

                                        whitespace-pre-wrap

                                        text-xs
                                        leading-5

                                        text-white/60
                                      "
                                    >
                                      {
                                        item.observacao
                                      }
                                    </p>
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>

                        {/* =====================================
                            ENTREGA / PAGAMENTO
                        ===================================== */}

                        <section
                          className="
                            mt-5

                            rounded-2xl

                            border
                            border-red-500/15

                            bg-red-500/[0.035]

                            p-4
                          "
                        >
                          <div
                            className="
                              flex

                              items-center

                              gap-3
                            "
                          >
                            <img
                              src={
                                entregaIcon
                              }
                              alt=""
                              draggable={
                                false
                              }
                              className="
                                h-14
                                w-14

                                object-contain
                              "
                            />

                            <div>
                              <p
                                className="
                                  text-[8px]
                                  font-black

                                  uppercase

                                  tracking-[0.18em]

                                  text-red-500
                                "
                              >
                                ATENDIMENTO
                              </p>

                              <p
                                className="
                                  mt-1

                                  text-sm
                                  font-black

                                  uppercase

                                  text-white
                                "
                              >
                                {descricaoAtendimento(
                                  consulta
                                )}
                              </p>
                            </div>
                          </div>

                          <div
                            className="
                              mt-4

                              grid
                              grid-cols-2

                              gap-3
                            "
                          >
                            <div
                              className="
                                rounded-xl

                                border
                                border-white/10

                                bg-black/40

                                p-3
                              "
                            >
                              <p
                                className="
                                  text-[7px]
                                  font-black

                                  uppercase

                                  tracking-[0.14em]

                                  text-white/30
                                "
                              >
                                PAGAMENTO
                              </p>

                              <p
                                className="
                                  mt-2

                                  text-xs
                                  font-black

                                  text-white
                                "
                              >
                                {descricaoPagamento(
                                  consulta
                                )}
                              </p>
                            </div>

                            <div
                              className="
                                rounded-xl

                                border
                                border-white/10

                                bg-black/40

                                p-3
                              "
                            >
                              <p
                                className="
                                  text-[7px]
                                  font-black

                                  uppercase

                                  tracking-[0.14em]

                                  text-white/30
                                "
                              >
                                ENTREGA
                              </p>

                              <p
                                className="
                                  mt-2

                                  text-xs
                                  font-black

                                  text-white
                                "
                              >
                                {consulta.taxaEntrega ===
                                null
                                  ? "A confirmar"
                                  : dinheiro(
                                      consulta.taxaEntrega
                                    )}
                              </p>
                            </div>
                          </div>

                          <div
                            className="
                              mt-3

                              flex
                              items-center
                              justify-between

                              border-t
                              border-white/10

                              pt-3
                            "
                          >
                            <span
                              className="
                                text-xs
                                font-bold

                                text-white/40
                              "
                            >
                              Total estimado
                            </span>

                            <span
                              className="
                                text-lg
                                font-black

                                text-[#00ef78]
                              "
                            >
                              {consulta.totalEstimado ===
                              null
                                ? "A confirmar"
                                : dinheiro(
                                    consulta.totalEstimado
                                  )}
                            </span>
                          </div>
                        </section>

                        {/* REFERÊNCIA */}

                        <div
                          className="
                            mt-4

                            rounded-xl

                            border
                            border-white/10

                            bg-[#0b0b0b]

                            p-3
                          "
                        >
                          <p
                            className="
                              text-[7px]
                              font-black

                              uppercase

                              tracking-[0.15em]

                              text-white/30
                            "
                          >
                            REFERÊNCIA
                          </p>

                          <p
                            className="
                              mt-2

                              break-all

                              font-mono
                              text-[9px]

                              text-white/45
                            "
                          >
                            {
                              consulta.id
                            }
                          </p>
                        </div>

                        {/* =====================================
                            AÇÕES
                        ===================================== */}

                        {consulta.status ===
                          "consulta_pendente" && (
                          <div
                            className="
                              mt-5

                              grid
                              gap-3

                              sm:grid-cols-2
                            "
                          >
                            <button
                              type="button"
                              disabled={
                                salvandoId !==
                                null
                              }
                              onClick={() =>
                                responderConsulta(
                                  consulta,
                                  "confirmado"
                                )
                              }
                              className="
                                rounded-xl

                                border
                                border-[#00ef78]

                                bg-[#00ef78]

                                px-4
                                py-4

                                text-[10px]
                                font-black

                                uppercase

                                text-black

                                shadow-[0_0_25px_rgba(0,239,120,0.18)]

                                transition

                                hover:bg-[#29ff91]

                                disabled:opacity-40
                              "
                            >
                              {salvandoId ===
                              consulta.id
                                ? "SALVANDO..."
                                : "CONFIRMAR"}
                            </button>

                            <button
                              type="button"
                              disabled={
                                salvandoId !==
                                null
                              }
                              onClick={() =>
                                responderConsulta(
                                  consulta,
                                  "indisponivel"
                                )
                              }
                              className="
                                rounded-xl

                                border
                                border-red-500/40

                                bg-red-500/10

                                px-4
                                py-4

                                text-[10px]
                                font-black

                                uppercase

                                text-red-400

                                transition

                                hover:bg-red-500/20

                                disabled:opacity-40
                              "
                            >
                              INDISPONÍVEL
                            </button>
                          </div>
                        )}

                        {/* STATUS FINAL */}

                        {consulta.status !==
                          "consulta_pendente" && (
                          <div
                            className={`
                              mt-5

                              rounded-xl

                              border

                              p-4

                              text-xs
                              font-bold

                              ${corStatus(
                                consulta.status
                              )}
                            `}
                          >
                            {consulta.status ===
                            "confirmado"
                              ? "✓ Disponibilidade confirmada."
                              : "✕ Itens informados como indisponíveis."}

                            <p
                              className="
                                mt-2

                                text-[10px]
                                font-normal

                                opacity-60
                              "
                            >
                              Atualizado:{" "}
                              {formatarData(
                                consulta.atualizadoEm
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    </article>
                  )
                )}
              </div>
            )}
        </section>
      </div>

      {/* ===================================================
          RODAPÉ
      =================================================== */}

      <footer
        className="
          border-t
          border-white/10

          bg-[#030303]

          px-4
          py-10

          text-center
        "
      >
        <img
          src="/coroa.png"
          alt=""
          draggable={false}
          className="
            mx-auto

            h-10
            w-10

            object-contain

            opacity-60
          "
        />

        <p
          className="
            mt-4

            text-[9px]
            font-black

            uppercase

            tracking-[0.20em]

            text-white/25
          "
        >
          Império Chalés • Portal do Parceiro
        </p>
      </footer>
    </main>
  );
}

export default ParceiroPedidos;