import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  collection,
  onSnapshot,
  type DocumentData,
  type Timestamp,
} from "firebase/firestore";

import {
  db,
} from "../firebase/config";

import estabelecimentoIcon from "../components/catalogo/estabelecimento.png";
import gastroIcon from "../components/catalogo/gastro.png";
import entregaIcon from "../components/catalogo/entrega.png";

/* =========================================================
   TIPOS
========================================================= */

type StatusRestaurante =
  | "pendente"
  | "aprovado"
  | "rejeitado";

type StatusConsulta =
  | "consulta_pendente"
  | "confirmado"
  | "indisponivel";

type FiltroConsulta =
  | "todas"
  | StatusConsulta;

interface Restaurante {
  id: string;
  nome: string;
  email: string;
  status: StatusRestaurante;
}

interface ItemConsulta {
  pratoId: string;
  nome: string;
  imagemUrl: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
  observacao: string;
}

interface Consulta {
  id: string;

  restauranteId: string;
  restauranteNome: string;

  status: StatusConsulta;

  atendimento: string;
  pagamento: string;

  subtotal: number;
  taxaEntrega: number | null;
  totalEstimado: number | null;

  totalItens: number;
  itens: ItemConsulta[];

  criadoEm: Timestamp | null;
  atualizadoEm: Timestamp | null;
}

/* =========================================================
   AUXILIARES
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

function numeroOpcional(
  valor: unknown
): number | null {
  return typeof valor === "number" &&
    Number.isFinite(valor) &&
    valor >= 0
    ? valor
    : null;
}

function moeda(
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

function moedaOpcional(
  valor: number | null
): string {
  return valor === null
    ? "Não informado"
    : moeda(valor);
}

function dataFormatada(
  valor: Timestamp | null
): string {
  if (!valor) {
    return "Data indisponível";
  }

  return valor
    .toDate()
    .toLocaleString(
      "pt-BR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
}

function nomeAtendimento(
  valor: string
): string {
  switch (valor) {
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

function nomePagamento(
  valor: string
): string {
  switch (valor) {
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

function rotuloStatus(
  status: StatusConsulta
): string {
  switch (status) {
    case "confirmado":
      return "CONFIRMADA";

    case "indisponivel":
      return "INDISPONÍVEL";

    default:
      return "AGUARDANDO";
  }
}

function classeStatus(
  status: StatusConsulta
): string {
  switch (status) {
    case "confirmado":
      return `
        border-emerald-400/30
        bg-emerald-400/10
        text-emerald-300
      `;

    case "indisponivel":
      return `
        border-red-500/30
        bg-red-500/10
        text-red-400
      `;

    default:
      return `
        border-[#ffd429]/30
        bg-[#ffd429]/10
        text-[#ffd429]
      `;
  }
}

function referenciaCurta(
  id: string
): string {
  const referencia =
    id.startsWith(
      "consulta_"
    )
      ? id.slice(
          "consulta_".length
        )
      : id;

  return referencia
    .slice(0, 8)
    .toUpperCase();
}

/* =========================================================
   CONVERTER RESTAURANTE
========================================================= */

function converterRestaurante(
  id: string,
  dados: DocumentData
): Restaurante {
  const status: StatusRestaurante =
    dados.status === "aprovado" ||
    dados.status === "rejeitado"
      ? dados.status
      : "pendente";

  return {
    id,

    nome:
      texto(
        dados.nomeEmpresa
      ) ||
      "Estabelecimento",

    email:
      texto(
        dados.email
      ) ||
      "E-mail não informado",

    status,
  };
}

/* =========================================================
   CONVERTER CONSULTA
========================================================= */

function converterConsulta(
  id: string,
  dados: DocumentData
): Consulta {
  const status: StatusConsulta =
    dados.status === "confirmado" ||
    dados.status === "indisponivel"
      ? dados.status
      : "consulta_pendente";

  const itens: ItemConsulta[] =
    Array.isArray(
      dados.itens
    )
      ? dados.itens.map(
          (
            item: unknown
          ) => {
            const valor =
              item &&
              typeof item ===
                "object" &&
              !Array.isArray(
                item
              )
                ? (
                    item as Record<
                      string,
                      unknown
                    >
                  )
                : {};

            return {
              pratoId:
                texto(
                  valor.pratoId
                ),

              nome:
                texto(
                  valor.nome
                ) ||
                "Prato",

              imagemUrl:
                texto(
                  valor.imagemUrl
                ) ||
                texto(
                  valor.imagem
                ),

              quantidade:
                numero(
                  valor.quantidade
                ),

              precoUnitario:
                numero(
                  valor.precoUnitario
                ),

              subtotal:
                numero(
                  valor.subtotal
                ),

              observacao:
                texto(
                  valor.observacao
                ),
            };
          }
        )
      : [];

  return {
    id,

    restauranteId:
      texto(
        dados.restauranteId
      ),

    restauranteNome:
      texto(
        dados.restauranteNome
      ) ||
      "Restaurante",

    status,

    atendimento:
      texto(
        dados.atendimento
      ),

    pagamento:
      texto(
        dados.pagamento
      ),

    subtotal:
      numero(
        dados.subtotal
      ),

    taxaEntrega:
      numeroOpcional(
        dados.taxaEntrega
      ),

    totalEstimado:
      numeroOpcional(
        dados.totalEstimado
      ),

    totalItens:
      numero(
        dados.totalItens
      ),

    itens,

    criadoEm:
      dados.criadoEm &&
      typeof dados.criadoEm
        .toMillis ===
        "function"
        ? (
            dados.criadoEm as Timestamp
          )
        : null,

    atualizadoEm:
      dados.atualizadoEm &&
      typeof dados.atualizadoEm
        .toMillis ===
        "function"
        ? (
            dados.atualizadoEm as Timestamp
          )
        : null,
  };
}

/* =========================================================
   DASHBOARD
========================================================= */

export function AdminDashboard() {
  /* =======================================================
     RESTAURANTES
  ======================================================= */

  const [
    restaurantes,
    setRestaurantes,
  ] =
    useState<
      Restaurante[]
    >([]);

  const [
    carregandoRestaurantes,
    setCarregandoRestaurantes,
  ] =
    useState(true);

  const [
    erroRestaurantes,
    setErroRestaurantes,
  ] =
    useState("");

  /* =======================================================
     CONSULTAS
  ======================================================= */

  const [
    consultas,
    setConsultas,
  ] =
    useState<
      Consulta[]
    >([]);

  const [
    carregandoConsultas,
    setCarregandoConsultas,
  ] =
    useState(true);

  const [
    erroConsultas,
    setErroConsultas,
  ] =
    useState("");

  const [
    busca,
    setBusca,
  ] =
    useState("");

  const [
    filtro,
    setFiltro,
  ] =
    useState<FiltroConsulta>(
      "todas"
    );

  /* =======================================================
     FIRESTORE - RESTAURANTES
  ======================================================= */

  useEffect(() => {
    const cancelar =
      onSnapshot(
        collection(
          db,
          "restaurantes"
        ),

        (
          resultado
        ) => {
          const lista =
            resultado.docs.map(
              (
                documento
              ) =>
                converterRestaurante(
                  documento.id,
                  documento.data()
                )
            );

          setRestaurantes(
            lista
          );

          setErroRestaurantes(
            ""
          );

          setCarregandoRestaurantes(
            false
          );
        },

        (
          erro
        ) => {
          console.error(
            "Erro ao consultar restaurantes:",
            erro
          );

          setErroRestaurantes(
            "Não foi possível carregar os estabelecimentos."
          );

          setCarregandoRestaurantes(
            false
          );
        }
      );

    return () =>
      cancelar();
  }, []);

  /* =======================================================
     FIRESTORE - CONSULTAS
  ======================================================= */

  useEffect(() => {
    const cancelar =
      onSnapshot(
        collection(
          db,
          "consultasCardapio"
        ),

        (
          resultado
        ) => {
          const lista =
            resultado.docs.map(
              (
                documento
              ) =>
                converterConsulta(
                  documento.id,
                  documento.data()
                )
            );

          lista.sort(
            (
              a,
              b
            ) =>
              (
                b.criadoEm?.toMillis() ??
                0
              ) -
              (
                a.criadoEm?.toMillis() ??
                0
              )
          );

          setConsultas(
            lista
          );

          setErroConsultas(
            ""
          );

          setCarregandoConsultas(
            false
          );
        },

        (
          erro
        ) => {
          console.error(
            "Erro ao consultar consultasCardapio:",
            erro
          );

          setConsultas(
            []
          );

          setErroConsultas(
            erro.code ===
              "permission-denied"
              ? "Acesso negado às consultas."
              : "Não foi possível carregar as consultas."
          );

          setCarregandoConsultas(
            false
          );
        }
      );

    return () =>
      cancelar();
  }, []);

  /* =======================================================
     INDICADORES
  ======================================================= */

  const pendentes =
    restaurantes.filter(
      (
        restaurante
      ) =>
        restaurante.status ===
        "pendente"
    );

  const aprovados =
    restaurantes.filter(
      (
        restaurante
      ) =>
        restaurante.status ===
        "aprovado"
    );

  const rejeitados =
    restaurantes.filter(
      (
        restaurante
      ) =>
        restaurante.status ===
        "rejeitado"
    );

  const consultasPendentes =
    consultas.filter(
      (
        consulta
      ) =>
        consulta.status ===
        "consulta_pendente"
    ).length;

  const consultasConfirmadas =
    consultas.filter(
      (
        consulta
      ) =>
        consulta.status ===
        "confirmado"
    ).length;

  const consultasIndisponiveis =
    consultas.filter(
      (
        consulta
      ) =>
        consulta.status ===
        "indisponivel"
    ).length;

  /* =======================================================
     FILTROS
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
          const statusCorreto =
            filtro ===
              "todas" ||
            consulta.status ===
              filtro;

          const buscaCorreta =
            !termo ||
            [
              consulta.id,

              consulta
                .restauranteNome,

              consulta
                .atendimento,

              consulta
                .pagamento,

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
              )
              .includes(
                termo
              );

          return (
            statusCorreto &&
            buscaCorreta
          );
        }
      );
    }, [
      consultas,
      busca,
      filtro,
    ]);

  /* =======================================================
     INTERFACE
  ======================================================= */

  return (
    <main
      className="
        min-h-screen
        bg-black
        text-white
      "
      style={{
        fontFamily:
          "'Arial Black', 'Montserrat', Arial, sans-serif",
      }}
    >
      {/* ===================================================
          HEADER
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
            max-w-7xl

            items-center
            justify-between

            gap-4
          "
        >
          {/* LOGO */}

          <Link
            to="/admin/dashboard"
            className="
              flex

              items-center

              gap-3
            "
          >
            <img
              src="/coroa.png"
              alt="Império"
              className="
                h-10
                w-10

                object-contain

                drop-shadow-[0_0_10px_rgba(255,212,41,0.18)]
              "
            />

            <div
              className="
                hidden

                sm:block
              "
            >
              <p
                className="
                  text-xs
                  font-black

                  uppercase

                  text-white
                "
              >
                CENTRAL ADMIN
              </p>

              <p
                className="
                  mt-1

                  text-[7px]
                  font-black

                  uppercase

                  tracking-[0.20em]

                  text-[#ffd429]
                "
              >
                IMPÉRIO CHALÉS
              </p>
            </div>
          </Link>

          {/* NAVEGAÇÃO */}

          <nav
            className="
              flex

              items-center

              gap-2
            "
          >
            <Link
              to="/admin/restaurantes"
              className="
                rounded-xl

                border
                border-[#ffd429]/30

                bg-[#ffd429]/10

                px-4
                py-3

                text-[9px]
                font-black

                uppercase

                text-[#ffd429]

                transition

                hover:bg-[#ffd429]
                hover:text-black
              "
            >
              PARCEIROS
            </Link>

            <Link
              to="/admin/pratos"
              className="
                rounded-xl

                border
                border-white/15

                bg-white/[0.04]

                px-4
                py-3

                text-[9px]
                font-black

                uppercase

                text-white

                transition

                hover:bg-white
                hover:text-black
              "
            >
              PRATOS
            </Link>

            <Link
              to="/cardapio"
              className="
                hidden

                rounded-xl

                border
                border-white/15

                px-4
                py-3

                text-[9px]
                font-black

                uppercase

                text-white

                sm:block
              "
            >
              CARDÁPIO
            </Link>
          </nav>
        </div>
      </header>

      {/* ===================================================
          CONTEÚDO
      =================================================== */}

      <div
        className="
          mx-auto

          max-w-7xl

          px-4
          py-10

          sm:px-6

          lg:px-8
        "
      >
        {/* =================================================
            TÍTULO
        ================================================= */}

        <section
          className="
            mb-10
            text-center
          "
        >
          <span
            className="
              inline-flex

              rounded-full

              border
              border-[#ffd429]/25

              bg-[#ffd429]/10

              px-4
              py-2

              text-[8px]
              font-black

              uppercase

              tracking-[0.22em]

              text-[#ffd429]
            "
          >
            PAINEL DE CONTROLE
          </span>

          <h1
            className="
              mt-5

              text-[36px]
              font-black

              uppercase

              leading-[0.92]

              tracking-[-0.04em]

              text-white

              sm:text-[48px]

              md:text-[58px]
            "
          >
            CENTRAL
            <span
              className="
                ml-3
                text-[#ffd429]
              "
              style={{
                textShadow:
                  "0 0 20px rgba(255,212,41,0.30)",
              }}
            >
              ADMINISTRATIVA
            </span>
          </h1>
        </section>

        {/* =================================================
            ATALHOS PRINCIPAIS
        ================================================= */}

        <section
          className="
            grid

            gap-4

            md:grid-cols-3
          "
        >
          {/* PARCEIROS */}

          <Link
            to="/admin/restaurantes"
            className="
              group

              relative

              overflow-hidden

              rounded-[26px]

              border
              border-[#ffd429]/25

              bg-gradient-to-br
              from-[#191609]
              via-[#0d0d0d]
              to-black

              p-6

              transition-all
              duration-300

              hover:-translate-y-1

              hover:border-[#ffd429]
            "
          >
            <img
              src={
                estabelecimentoIcon
              }
              alt=""
              className="
                h-[82px]
                w-[82px]

                object-contain

                drop-shadow-[0_15px_20px_rgba(0,0,0,.5)]

                transition-transform
                duration-300

                group-hover:scale-110
              "
            />

            <p
              className="
                mt-4

                text-[8px]
                font-black

                uppercase

                tracking-[0.18em]

                text-[#ffd429]
              "
            >
              CADASTROS
            </p>

            <h2
              className="
                mt-2

                text-2xl
                font-black

                uppercase
              "
            >
              PARCEIROS
            </h2>

            <p
              className="
                mt-2

                text-xs

                text-white/35
              "
            >
              {restaurantes.length} cadastrados
            </p>
          </Link>

          {/* PRATOS */}

          <Link
            to="/admin/pratos"
            className="
              group

              relative

              overflow-hidden

              rounded-[26px]

              border
              border-[#ffd429]/25

              bg-gradient-to-br
              from-[#17140a]
              via-[#0d0d0d]
              to-black

              p-6

              transition-all
              duration-300

              hover:-translate-y-1

              hover:border-[#ffd429]
            "
          >
            <img
              src={
                gastroIcon
              }
              alt=""
              className="
                h-[82px]
                w-[82px]

                object-contain

                transition-transform

                group-hover:scale-110
              "
            />

            <p
              className="
                mt-4

                text-[8px]
                font-black

                uppercase

                tracking-[0.18em]

                text-[#ffd429]
              "
            >
              CARDÁPIO
            </p>

            <h2
              className="
                mt-2

                text-2xl
                font-black

                uppercase
              "
            >
              PRATOS
            </h2>

            <p
              className="
                mt-2

                text-xs

                text-white/35
              "
            >
              Gerenciar produtos
            </p>
          </Link>

          {/* CARDÁPIO */}

          <Link
            to="/cardapio"
            className="
              group

              relative

              overflow-hidden

              rounded-[26px]

              border
              border-emerald-400/25

              bg-gradient-to-br
              from-[#07190f]
              via-[#0c0c0c]
              to-black

              p-6

              transition-all
              duration-300

              hover:-translate-y-1

              hover:border-emerald-400
            "
          >
            <img
              src="/cardapio.png"
              alt=""
              className="
                h-[82px]
                w-[82px]

                object-contain

                transition-transform

                group-hover:scale-110
              "
            />

            <p
              className="
                mt-4

                text-[8px]
                font-black

                uppercase

                tracking-[0.18em]

                text-emerald-400
              "
            >
              VISUALIZAÇÃO
            </p>

            <h2
              className="
                mt-2

                text-2xl
                font-black

                uppercase
              "
            >
              VER CARDÁPIO
            </h2>

            <p
              className="
                mt-2

                text-xs

                text-white/35
              "
            >
              Abrir como cliente
            </p>
          </Link>
        </section>

        {/* =================================================
            PARCEIROS
        ================================================= */}

        <section
          className="
            mt-8

            overflow-hidden

            rounded-[30px]

            border
            border-white/10

            bg-gradient-to-br
            from-[#171717]
            via-[#0b0b0b]
            to-black

            p-6

            md:p-8
          "
        >
          <div
            className="
              flex
              flex-wrap

              items-end
              justify-between

              gap-4
            "
          >
            <div>
              <p
                className="
                  text-[8px]
                  font-black

                  uppercase

                  tracking-[0.22em]

                  text-[#ffd429]
                "
              >
                ESTABELECIMENTOS
              </p>

              <h2
                className="
                  mt-2

                  text-3xl
                  font-black

                  uppercase
                "
              >
                RESTAURANTES
                <span
                  className="
                    ml-2

                    text-[#ffd429]
                  "
                >
                  PARCEIROS
                </span>
              </h2>
            </div>

            <Link
              to="/admin/restaurantes"
              className="
                rounded-xl

                bg-[#ffd429]

                px-5
                py-3

                text-[9px]
                font-black

                uppercase

                text-black
              "
            >
              GERENCIAR →
            </Link>
          </div>

          {erroRestaurantes && (
            <div
              className="
                mt-6

                rounded-xl

                border
                border-red-500/30

                bg-red-500/10

                p-4

                text-xs
                font-bold

                text-red-400
              "
            >
              ⚠️ {erroRestaurantes}
            </div>
          )}

          <div
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
                  "TOTAL",
                valor:
                  restaurantes.length,
                cor:
                  "text-white",
              },

              {
                titulo:
                  "PENDENTES",
                valor:
                  pendentes.length,
                cor:
                  "text-[#ffd429]",
              },

              {
                titulo:
                  "APROVADOS",
                valor:
                  aprovados.length,
                cor:
                  "text-emerald-400",
              },

              {
                titulo:
                  "REJEITADOS",
                valor:
                  rejeitados.length,
                cor:
                  "text-red-400",
              },
            ].map(
              (
                item
              ) => (
                <article
                  key={
                    item.titulo
                  }
                  className="
                    rounded-[20px]

                    border
                    border-white/10

                    bg-white/[0.035]

                    p-5
                  "
                >
                  <p
                    className="
                      text-[8px]
                      font-black

                      tracking-[0.14em]

                      text-white/35
                    "
                  >
                    {
                      item.titulo
                    }
                  </p>

                  <p
                    className={`
                      mt-3

                      text-4xl
                      font-black

                      ${
                        item.cor
                      }
                    `}
                  >
                    {carregandoRestaurantes
                      ? "—"
                      : item.valor}
                  </p>
                </article>
              )
            )}
          </div>

          {pendentes.length >
            0 && (
            <div
              className="
                mt-6

                rounded-[20px]

                border
                border-[#ffd429]/20

                bg-[#ffd429]/[0.05]

                p-5
              "
            >
              <p
                className="
                  text-xs
                  font-black

                  uppercase

                  text-[#ffd429]
                "
              >
                ⚠️ {pendentes.length} CADASTRO(S) AGUARDANDO ANÁLISE
              </p>

              <div
                className="
                  mt-4
                  space-y-2
                "
              >
                {pendentes
                  .slice(
                    0,
                    4
                  )
                  .map(
                    (
                      restaurante
                    ) => (
                      <div
                        key={
                          restaurante.id
                        }
                        className="
                          rounded-xl

                          bg-black/40

                          px-4
                          py-3
                        "
                      >
                        <p
                          className="
                            text-sm
                            font-black
                          "
                        >
                          {
                            restaurante.nome
                          }
                        </p>

                        <p
                          className="
                            mt-1

                            text-[9px]

                            text-white/35
                          "
                        >
                          {
                            restaurante.email
                          }
                        </p>
                      </div>
                    )
                  )}
              </div>
            </div>
          )}
        </section>

        {/* =================================================
            CONSULTAS
        ================================================= */}

        <section
          className="
            mt-8

            rounded-[30px]

            border
            border-white/10

            bg-gradient-to-br
            from-[#141414]
            via-[#090909]
            to-black

            p-6

            md:p-8
          "
        >
          <div
            className="
              flex
              flex-wrap

              items-end
              justify-between

              gap-4
            "
          >
            <div>
              <p
                className="
                  text-[8px]
                  font-black

                  uppercase

                  tracking-[0.22em]

                  text-emerald-400
                "
              >
                TEMPO REAL
              </p>

              <h2
                className="
                  mt-2

                  text-3xl
                  font-black

                  uppercase
                "
              >
                CENTRAL DE
                <span
                  className="
                    ml-2

                    text-emerald-400
                  "
                >
                  CONSULTAS
                </span>
              </h2>
            </div>

            <img
              src={
                entregaIcon
              }
              alt=""
              className="
                hidden

                h-20
                w-20

                object-contain

                md:block
              "
            />
          </div>

          {/* INDICADORES */}

          <div
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
                  "REGISTRADAS",

                valor:
                  consultas.length,

                cor:
                  "text-white",
              },

              {
                titulo:
                  "AGUARDANDO",

                valor:
                  consultasPendentes,

                cor:
                  "text-[#ffd429]",
              },

              {
                titulo:
                  "CONFIRMADAS",

                valor:
                  consultasConfirmadas,

                cor:
                  "text-emerald-400",
              },

              {
                titulo:
                  "INDISPONÍVEIS",

                valor:
                  consultasIndisponiveis,

                cor:
                  "text-red-400",
              },
            ].map(
              (
                item
              ) => (
                <article
                  key={
                    item.titulo
                  }
                  className="
                    rounded-[20px]

                    border
                    border-white/10

                    bg-white/[0.035]

                    p-5
                  "
                >
                  <p
                    className="
                      text-[8px]
                      font-black

                      tracking-[0.12em]

                      text-white/35
                    "
                  >
                    {
                      item.titulo
                    }
                  </p>

                  <p
                    className={`
                      mt-3

                      text-4xl
                      font-black

                      ${
                        item.cor
                      }
                    `}
                  >
                    {carregandoConsultas
                      ? "—"
                      : item.valor}
                  </p>
                </article>
              )
            )}
          </div>

          {/* BUSCA */}

          <div
            className="
              mt-7

              rounded-[20px]

              border
              border-white/10

              bg-white/[0.025]

              p-4
            "
          >
            <input
              type="search"
              value={busca}
              onChange={(
                evento
              ) =>
                setBusca(
                  evento.target
                    .value
                )
              }
              placeholder="Buscar referência, restaurante ou prato..."
              className="
                w-full

                rounded-xl

                border
                border-white/10

                bg-black

                px-5
                py-4

                text-sm

                text-white

                outline-none

                placeholder:text-white/25

                focus:border-[#ffd429]/60
              "
            />

            <div
              className="
                mt-4

                flex
                flex-wrap

                gap-2
              "
            >
              {(
                [
                  [
                    "todas",
                    "TODAS",
                  ],

                  [
                    "consulta_pendente",
                    "AGUARDANDO",
                  ],

                  [
                    "confirmado",
                    "CONFIRMADAS",
                  ],

                  [
                    "indisponivel",
                    "INDISPONÍVEIS",
                  ],
                ] as Array<
                  [
                    FiltroConsulta,
                    string
                  ]
                >
              ).map(
                ([
                  valor,
                  titulo,
                ]) => (
                  <button
                    key={
                      valor
                    }
                    type="button"
                    onClick={() =>
                      setFiltro(
                        valor
                      )
                    }
                    className={`
                      rounded-full

                      border

                      px-4
                      py-2

                      text-[8px]
                      font-black

                      uppercase

                      transition

                      ${
                        filtro ===
                        valor
                          ? `
                            border-[#ffd429]
                            bg-[#ffd429]
                            text-black
                          `
                          : `
                            border-white/10
                            bg-white/[0.03]
                            text-white/50
                          `
                      }
                    `}
                  >
                    {
                      titulo
                    }
                  </button>
                )
              )}
            </div>
          </div>

          {/* ERRO */}

          {erroConsultas && (
            <div
              className="
                mt-6

                rounded-xl

                border
                border-red-500/30

                bg-red-500/10

                p-4

                text-xs
                font-bold

                text-red-400
              "
            >
              ⚠️ {erroConsultas}
            </div>
          )}

          {/* CARREGANDO */}

          {carregandoConsultas &&
            !erroConsultas && (
              <div
                className="
                  mt-6

                  rounded-xl

                  border
                  border-white/10

                  p-6

                  text-center

                  text-xs

                  text-white/40
                "
              >
                CARREGANDO CONSULTAS...
              </div>
            )}

          {/* VAZIO */}

          {!carregandoConsultas &&
            !erroConsultas &&
            consultasFiltradas.length ===
              0 && (
              <div
                className="
                  mt-6

                  rounded-[20px]

                  border
                  border-dashed
                  border-white/10

                  p-10

                  text-center

                  text-xs

                  text-white/35
                "
              >
                NENHUMA CONSULTA ENCONTRADA.
              </div>
            )}

          {/* LISTA */}

          {!carregandoConsultas &&
            !erroConsultas &&
            consultasFiltradas.length >
              0 && (
              <div
                className="
                  mt-6

                  grid

                  gap-4

                  xl:grid-cols-2
                "
              >
                {consultasFiltradas.map(
                  (
                    consulta
                  ) => {
                    const valorDestaque =
                      consulta.totalEstimado ??
                      consulta.subtotal;

                    return (
                      <article
                        key={
                          consulta.id
                        }
                        className="
                          overflow-hidden

                          rounded-[24px]

                          border
                          border-white/10

                          bg-gradient-to-br
                          from-[#171717]
                          to-[#080808]
                        "
                      >
                        {/* CABEÇALHO */}

                        <header
                          className="
                            border-b
                            border-white/10

                            p-5
                          "
                        >
                          <div
                            className="
                              flex

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

                                  tracking-[0.16em]

                                  text-[#ffd429]
                                "
                              >
                                CONSULTA #
                                {referenciaCurta(
                                  consulta.id
                                )}
                              </p>

                              <h3
                                className="
                                  mt-2

                                  text-xl
                                  font-black

                                  uppercase
                                "
                              >
                                {
                                  consulta.restauranteNome
                                }
                              </h3>

                              <p
                                className="
                                  mt-2

                                  text-[9px]

                                  text-white/35
                                "
                              >
                                {dataFormatada(
                                  consulta.criadoEm
                                )}
                              </p>
                            </div>

                            <span
                              className={`
                                rounded-full

                                border

                                px-3
                                py-2

                                text-[7px]
                                font-black

                                ${
                                  classeStatus(
                                    consulta.status
                                  )
                                }
                              `}
                            >
                              {rotuloStatus(
                                consulta.status
                              )}
                            </span>
                          </div>
                        </header>

                        {/* CONTEÚDO */}

                        <div
                          className="
                            p-5
                          "
                        >
                          {/* TOTAL */}

                          <div
                            className="
                              flex

                              items-end
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

                                  text-white/35
                                "
                              >
                                {
                                  consulta.totalItens
                                }{" "}
                                ITEM(NS)
                              </p>
                            </div>

                            <strong
                              className="
                                text-2xl
                                font-black

                                text-emerald-400
                              "
                            >
                              {moeda(
                                valorDestaque
                              )}
                            </strong>
                          </div>

                          {/* ITENS */}

                          <div
                            className="
                              mt-5
                              space-y-2
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
                                    flex

                                    items-center

                                    gap-3

                                    rounded-[16px]

                                    border
                                    border-white/10

                                    bg-white/[0.03]

                                    p-3
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
                                        h-14
                                        w-14

                                        rounded-xl

                                        object-cover
                                      "
                                    />
                                  ) : (
                                    <img
                                      src={
                                        gastroIcon
                                      }
                                      alt=""
                                      className="
                                        h-14
                                        w-14

                                        object-contain
                                      "
                                    />
                                  )}

                                  <div
                                    className="
                                      min-w-0
                                      flex-1
                                    "
                                  >
                                    <p
                                      className="
                                        text-sm
                                        font-black

                                        uppercase
                                      "
                                    >
                                      {
                                        item.nome
                                      }
                                    </p>

                                    <p
                                      className="
                                        mt-1

                                        text-[9px]

                                        text-white/40
                                      "
                                    >
                                      {
                                        item.quantidade
                                      }{" "}
                                      ×{" "}
                                      {moeda(
                                        item.precoUnitario
                                      )}
                                    </p>
                                  </div>

                                  <strong
                                    className="
                                      text-xs

                                      text-[#ffd429]
                                    "
                                  >
                                    {moeda(
                                      item.subtotal
                                    )}
                                  </strong>
                                </div>
                              )
                            )}
                          </div>

                          {/* ATENDIMENTO */}

                          <div
                            className="
                              mt-5

                              rounded-[18px]

                              border
                              border-white/10

                              bg-black/50

                              p-4
                            "
                          >
                            <div
                              className="
                                grid

                                gap-3

                                sm:grid-cols-2
                              "
                            >
                              <div>
                                <p
                                  className="
                                    text-[7px]
                                    font-black

                                    uppercase

                                    text-white/30
                                  "
                                >
                                  ATENDIMENTO
                                </p>

                                <p
                                  className="
                                    mt-1

                                    text-xs
                                    font-black
                                  "
                                >
                                  {nomeAtendimento(
                                    consulta.atendimento
                                  )}
                                </p>
                              </div>

                              <div>
                                <p
                                  className="
                                    text-[7px]
                                    font-black

                                    uppercase

                                    text-white/30
                                  "
                                >
                                  PAGAMENTO
                                </p>

                                <p
                                  className="
                                    mt-1

                                    text-xs
                                    font-black
                                  "
                                >
                                  {nomePagamento(
                                    consulta.pagamento
                                  )}
                                </p>
                              </div>
                            </div>

                            <div
                              className="
                                mt-4

                                border-t
                                border-white/10

                                pt-4
                              "
                            >
                              <div
                                className="
                                  flex

                                  justify-between

                                  text-[10px]
                                "
                              >
                                <span
                                  className="
                                    text-white/40
                                  "
                                >
                                  Pratos
                                </span>

                                <strong>
                                  {moeda(
                                    consulta.subtotal
                                  )}
                                </strong>
                              </div>

                              <div
                                className="
                                  mt-2

                                  flex

                                  justify-between

                                  text-[10px]
                                "
                              >
                                <span
                                  className="
                                    text-white/40
                                  "
                                >
                                  Entrega
                                </span>

                                <strong>
                                  {moedaOpcional(
                                    consulta.taxaEntrega
                                  )}
                                </strong>
                              </div>

                              <div
                                className="
                                  mt-4

                                  flex

                                  items-center
                                  justify-between

                                  border-t
                                  border-white/10

                                  pt-4
                                "
                              >
                                <span
                                  className="
                                    text-xs
                                    font-black

                                    uppercase
                                  "
                                >
                                  TOTAL
                                </span>

                                <strong
                                  className="
                                    text-lg
                                    font-black

                                    text-emerald-400
                                  "
                                >
                                  {moedaOpcional(
                                    consulta.totalEstimado
                                  )}
                                </strong>
                              </div>
                            </div>
                          </div>

                          {/* REFERÊNCIA */}

                          <div
                            className="
                              mt-4

                              rounded-xl

                              bg-white/[0.025]

                              px-4
                              py-3
                            "
                          >
                            <p
                              className="
                                text-[7px]
                                font-black

                                uppercase

                                text-white/25
                              "
                            >
                              REFERÊNCIA
                            </p>

                            <p
                              className="
                                mt-1

                                truncate

                                font-mono

                                text-[9px]

                                text-white/50
                              "
                            >
                              {
                                consulta.id
                              }
                            </p>
                          </div>
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            )}
        </section>

        {/* =================================================
            GERENCIAMENTO
        ================================================= */}

        <section
          className="
            mt-8
          "
        >
          <p
            className="
              text-center

              text-[8px]
              font-black

              uppercase

              tracking-[0.22em]

              text-[#ffd429]
            "
          >
            ADMINISTRAÇÃO
          </p>

          <h2
            className="
              mt-2

              text-center

              text-3xl
              font-black

              uppercase
            "
          >
            GERENCIAR
            <span
              className="
                ml-2

                text-[#ffd429]
              "
            >
              SISTEMA
            </span>
          </h2>

          <div
            className="
              mt-7

              grid

              gap-4

              md:grid-cols-2
            "
          >
            <Link
              to="/admin/restaurantes"
              className="
                rounded-[24px]

                border
                border-white/10

                bg-gradient-to-br
                from-[#181818]
                to-black

                p-6

                transition

                hover:border-[#ffd429]/60
              "
            >
              <img
                src={
                  estabelecimentoIcon
                }
                alt=""
                className="
                  h-16
                  w-16

                  object-contain
                "
              />

              <h3
                className="
                  mt-4

                  text-xl
                  font-black

                  uppercase
                "
              >
                RESTAURANTES
              </h3>

              <p
                className="
                  mt-2

                  text-xs

                  text-white/35
                "
              >
                Cadastros, análise e aprovação.
              </p>
            </Link>

            <Link
              to="/admin/pratos"
              className="
                rounded-[24px]

                border
                border-white/10

                bg-gradient-to-br
                from-[#181818]
                to-black

                p-6

                transition

                hover:border-[#ffd429]/60
              "
            >
              <img
                src={
                  gastroIcon
                }
                alt=""
                className="
                  h-16
                  w-16

                  object-contain
                "
              />

              <h3
                className="
                  mt-4

                  text-xl
                  font-black

                  uppercase
                "
              >
                CARDÁPIO E PRATOS
              </h3>

              <p
                className="
                  mt-2

                  text-xs

                  text-white/35
                "
              >
                Produtos, preços e fotografias.
              </p>
            </Link>
          </div>
        </section>

        {/* =================================================
            RODAPÉ
        ================================================= */}

        <footer
          className="
            mt-14

            border-t
            border-white/10

            py-10

            text-center
          "
        >
          <img
            src="/coroa.png"
            alt=""
            className="
              mx-auto

              h-10
              w-10

              object-contain

              opacity-50
            "
          />

          <p
            className="
              mt-4

              text-[8px]
              font-black

              uppercase

              tracking-[0.18em]

              text-white/20
            "
          >
            IMPÉRIO CHALÉS • CENTRAL ADMINISTRATIVA
          </p>
        </footer>
      </div>
    </main>
  );
}

export default AdminDashboard;