
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  collection,
  onSnapshot,
  type DocumentData,
  type Timestamp,
} from "firebase/firestore";

import { db } from "../firebase/config";

// =====================================================
// TIPOS
// =====================================================

type StatusRestaurante =
  | "pendente"
  | "aprovado"
  | "rejeitado";

type StatusConsulta =
  | "consulta_pendente"
  | "confirmado"
  | "indisponivel";

type FiltroConsulta = "todas" | StatusConsulta;

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

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}

function numero(valor: unknown): number {
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

function moeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
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
    return "Data não disponível";
  }

  return valor.toDate().toLocaleString(
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
      return "🚚 Entrega no chalé";

    case "retirada_restaurante":
      return "🛍️ Retirada no restaurante";

    case "retirada_anfitriao":
      return "🛍️ Retirada sob consulta ao anfitrião";

    default:
      return "Não informado (consulta anterior)";
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
      return "Não informado (consulta anterior)";
  }
}

function rotuloStatus(
  status: StatusConsulta
): string {
  switch (status) {
    case "confirmado":
      return "✅ Disponibilidade confirmada";

    case "indisponivel":
      return "❌ Indisponível";

    default:
      return "⏳ Aguardando resposta";
  }
}

function referenciaCurta(id: string): string {
  const referencia = id.startsWith("consulta_")
    ? id.slice("consulta_".length)
    : id;

  return referencia.slice(0, 8).toUpperCase();
}

// =====================================================
// CONVERSÃO DOS RESTAURANTES
// =====================================================

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
      texto(dados.nomeEmpresa) ||
      "Estabelecimento sem nome",

    email:
      texto(dados.email) ||
      "E-mail não informado",

    status,
  };
}

// =====================================================
// CONVERSÃO DAS CONSULTAS
// =====================================================

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
    Array.isArray(dados.itens)
      ? dados.itens.map((item: unknown) => {
          const valor =
            item &&
            typeof item === "object" &&
            !Array.isArray(item)
              ? (item as Record<string, unknown>)
              : {};

          return {
            pratoId: texto(valor.pratoId),

            nome:
              texto(valor.nome) ||
              "Prato sem nome",

            imagemUrl:
              texto(valor.imagemUrl) ||
              texto(valor.imagem),

            quantidade:
              numero(valor.quantidade),

            precoUnitario:
              numero(valor.precoUnitario),

            subtotal:
              numero(valor.subtotal),

            observacao:
              texto(valor.observacao),
          };
        })
      : [];

  return {
    id,

    restauranteId:
      texto(dados.restauranteId),

    restauranteNome:
      texto(dados.restauranteNome) ||
      "Restaurante não informado",

    status,

    atendimento:
      texto(dados.atendimento),

    pagamento:
      texto(dados.pagamento),

    subtotal:
      numero(dados.subtotal),

    // Campos ausentes nos registros antigos
    // devem continuar como null.
    // Nunca converter null em NaN.

    taxaEntrega:
      numeroOpcional(dados.taxaEntrega),

    totalEstimado:
      numeroOpcional(dados.totalEstimado),

    totalItens:
      numero(dados.totalItens),

    itens,

    criadoEm:
      dados.criadoEm &&
      typeof dados.criadoEm.toMillis === "function"
        ? (dados.criadoEm as Timestamp)
        : null,

    atualizadoEm:
      dados.atualizadoEm &&
      typeof dados.atualizadoEm.toMillis === "function"
        ? (dados.atualizadoEm as Timestamp)
        : null,
  };
}

// =====================================================
// DASHBOARD
// =====================================================

export function AdminDashboard() {
  // ===================================================
  // RESTAURANTES
  // ===================================================

  const [restaurantes, setRestaurantes] =
    useState<Restaurante[]>([]);

  const [
    carregandoRestaurantes,
    setCarregandoRestaurantes,
  ] = useState(true);

  const [
    erroRestaurantes,
    setErroRestaurantes,
  ] = useState("");

  // ===================================================
  // CONSULTAS
  // ===================================================

  const [consultas, setConsultas] =
    useState<Consulta[]>([]);

  const [
    carregandoConsultas,
    setCarregandoConsultas,
  ] = useState(true);

  const [erroConsultas, setErroConsultas] =
    useState("");

  const [busca, setBusca] =
    useState("");

  const [filtro, setFiltro] =
    useState<FiltroConsulta>("todas");

  // ===================================================
  // LISTAR RESTAURANTES EM TEMPO REAL
  // ===================================================

  useEffect(() => {
    const cancelar = onSnapshot(
      collection(db, "restaurantes"),

      (resultado) => {
        const lista = resultado.docs.map(
          (documento) =>
            converterRestaurante(
              documento.id,
              documento.data()
            )
        );

        setRestaurantes(lista);

        setErroRestaurantes("");
        setCarregandoRestaurantes(false);
      },

      (erro) => {
        console.error(
          "Erro ao consultar restaurantes:",
          erro
        );

        setErroRestaurantes(
          "Não foi possível carregar os restaurantes. Confira a autenticação e as regras do Firebase."
        );

        setCarregandoRestaurantes(false);
      }
    );

    return () => cancelar();
  }, []);

  // ===================================================
  // LISTAR CONSULTAS EM TEMPO REAL
  // ===================================================

  useEffect(() => {
    const cancelar = onSnapshot(
      collection(db, "consultasCardapio"),

      (resultado) => {
        const lista = resultado.docs.map(
          (documento) =>
            converterConsulta(
              documento.id,
              documento.data()
            )
        );

        lista.sort(
          (a, b) =>
            (b.criadoEm?.toMillis() ?? 0) -
            (a.criadoEm?.toMillis() ?? 0)
        );

        setConsultas(lista);

        setErroConsultas("");
        setCarregandoConsultas(false);
      },

      (erro) => {
        console.error(
          "Erro ao consultar consultasCardapio:",
          erro
        );

        setConsultas([]);

        setErroConsultas(
          erro.code === "permission-denied"
            ? "Acesso negado. Confira sua conta administrativa e as regras de consultasCardapio."
            : "Não foi possível carregar as consultas."
        );

        setCarregandoConsultas(false);
      }
    );

    return () => cancelar();
  }, []);

  // ===================================================
  // INDICADORES DOS RESTAURANTES
  // ===================================================

  const pendentes = restaurantes.filter(
    (restaurante) =>
      restaurante.status === "pendente"
  );

  const aprovados = restaurantes.filter(
    (restaurante) =>
      restaurante.status === "aprovado"
  );

  const rejeitados = restaurantes.filter(
    (restaurante) =>
      restaurante.status === "rejeitado"
  );

  // ===================================================
  // INDICADORES DAS CONSULTAS
  // ===================================================

  const consultasPendentes = consultas.filter(
    (consulta) =>
      consulta.status === "consulta_pendente"
  ).length;

  const consultasConfirmadas = consultas.filter(
    (consulta) =>
      consulta.status === "confirmado"
  ).length;

  const consultasIndisponiveis = consultas.filter(
    (consulta) =>
      consulta.status === "indisponivel"
  ).length;

  // ===================================================
  // FILTROS
  // ===================================================

  const consultasFiltradas = useMemo(() => {
    const termo = busca
      .trim()
      .toLocaleLowerCase("pt-BR");

    return consultas.filter((consulta) => {
      const statusCorreto =
        filtro === "todas" ||
        consulta.status === filtro;

      const buscaCorreta =
        !termo ||
        [
          consulta.id,
          consulta.restauranteNome,
          consulta.atendimento,
          consulta.pagamento,
          ...consulta.itens.map(
            (item) => item.nome
          ),
        ]
          .join(" ")
          .toLocaleLowerCase("pt-BR")
          .includes(termo);

      return statusCorreto && buscaCorreta;
    });
  }, [consultas, busca, filtro]);

  // ===================================================
  // INTERFACE
  // ===================================================

  return (
    <main className="min-h-screen bg-[#f8f6ef] text-[#19352b]">

      {/* ============================================= */}
      {/* CABEÇALHO                                     */}
      {/* ============================================= */}

      <header className="bg-[#101813] px-4 py-5 text-white">

        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">

          <div className="flex items-center gap-3">

            <img
              src="/logo-imperio.png"
              alt="Império Chalés"
              className="h-12 w-12 rounded-full object-contain"
            />

            <div>

              <h1 className="text-lg font-black">
                Império Chalés
              </h1>

              <p className="text-xs font-bold tracking-widest text-amber-300">
                CENTRAL ADMINISTRATIVA
              </p>

            </div>

          </div>

          <nav className="flex flex-wrap gap-2">

            <Link
              to="/admin/restaurantes"
              className="rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-sm font-bold text-amber-300"
            >
              🏪 Parceiros
            </Link>

            <Link
              to="/admin/pratos"
              className="rounded-full border border-white/20 px-4 py-2 text-sm"
            >
              🍽️ Pratos
            </Link>

            <Link
              to="/cardapio"
              className="rounded-full border border-white/20 px-4 py-2 text-sm"
            >
              Ver cardápio
            </Link>

            <Link
              to="/"
              className="rounded-full border border-white/20 px-4 py-2 text-sm"
            >
              Ver site
            </Link>

          </nav>

        </div>

      </header>

      {/* ============================================= */}
      {/* CONTEÚDO                                     */}
      {/* ============================================= */}

      <div className="mx-auto max-w-7xl px-4 py-8 md:py-10">

        <section className="mb-8">

          <span className="text-xs font-black uppercase tracking-[0.3em] text-amber-700">
            PAINEL DE CONTROLE
          </span>

          <h2 className="mt-3 text-3xl font-black md:text-4xl">
            Visão geral do Império
          </h2>

          <p className="mt-3 text-sm leading-6 text-gray-500">
            Acompanhe os restaurantes parceiros,
            o catálogo e as consultas recebidas.
          </p>

        </section>

        {/* =========================================== */}
        {/* RESTAURANTES                                */}
        {/* =========================================== */}

        <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#10251d] via-[#19352b] to-[#10251d] p-6 text-white shadow-xl md:p-8">

          <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-xs font-black text-amber-300">
            🏪 SABORES DA CHAPADA
          </span>

          <h2 className="mt-7 text-3xl font-black uppercase leading-tight md:text-5xl">

            CENTRAL DE

            <span className="block text-amber-400">
              RESTAURANTES PARCEIROS
            </span>

          </h2>

          <p className="mt-5 max-w-3xl text-sm leading-7 text-gray-200">
            Acompanhe os cadastros e as aprovações
            dos estabelecimentos.
          </p>

          {erroRestaurantes && (
            <div
              role="alert"
              className="mt-6 rounded-xl bg-red-950/40 p-4 text-sm text-red-100"
            >
              ⚠️ {erroRestaurantes}
            </div>
          )}

          <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">

            {[
              {
                titulo: "Total cadastrados",
                valor: restaurantes.length,
                icone: "🏪",
                cor: "text-white",
              },

              {
                titulo: "Pendentes",
                valor: pendentes.length,
                icone: "⏳",
                cor: "text-amber-300",
              },

              {
                titulo: "Aprovados",
                valor: aprovados.length,
                icone: "✅",
                cor: "text-green-300",
              },

              {
                titulo: "Rejeitados",
                valor: rejeitados.length,
                icone: "❌",
                cor: "text-red-300",
              },
            ].map((item) => (

              <article
                key={item.titulo}
                className="rounded-2xl border border-white/10 bg-white/10 p-5"
              >

                <span className="text-2xl">
                  {item.icone}
                </span>

                <p className="mt-4 text-xs text-gray-200">
                  {item.titulo}
                </p>

                <p className={`mt-2 text-3xl font-black ${item.cor}`}>
                  {carregandoRestaurantes ||
                  erroRestaurantes
                    ? "—"
                    : item.valor}
                </p>

              </article>

            ))}

          </div>

          {pendentes.length > 0 &&
            !carregandoRestaurantes &&
            !erroRestaurantes && (

              <div className="mt-7 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-5">

                <h3 className="text-xl font-black text-amber-300">
                  🔔 {pendentes.length} cadastro(s)
                  aguardando análise
                </h3>

                {pendentes.slice(0, 4).map(
                  (restaurante) => (

                    <div
                      key={restaurante.id}
                      className="mt-4 rounded-xl bg-white/10 p-4"
                    >

                      <p className="font-black">
                        {restaurante.nome}
                      </p>

                      <p className="mt-1 break-all text-xs text-gray-300">
                        {restaurante.email}
                      </p>

                    </div>

                  )
                )}

              </div>

            )}

          {!carregandoRestaurantes &&
            !erroRestaurantes &&
            pendentes.length === 0 && (

              <div className="mt-7 rounded-xl border border-green-400/30 bg-green-400/10 p-4 text-sm text-green-200">
                ✅ Nenhuma solicitação está aguardando
                análise neste momento.
              </div>

            )}

          <Link
            to="/admin/restaurantes"
            className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-amber-400 px-6 py-4 text-sm font-black text-black sm:w-auto"
          >
            🏪 GERENCIAR TODOS OS RESTAURANTES →
          </Link>

        </section>

        {/* =========================================== */}
        {/* CENTRAL DE CONSULTAS                        */}
        {/* =========================================== */}

        <section
          className="mt-10"
          aria-label="Consultas reais do cardápio"
        >

          <div className="flex flex-wrap items-end justify-between gap-4">

            <div>

              <span className="text-xs font-black uppercase tracking-[0.25em] text-amber-700">
                🔔 INTEGRAÇÃO AO FIRESTORE
              </span>

              <h2 className="mt-3 text-3xl font-black">
                Central de consultas recebidas
              </h2>

              <p className="mt-3 text-sm leading-6 text-gray-600">
                Solicitações registradas no catálogo,
                em tempo real. Uma consulta não é uma
                venda ou um pedido confirmado.
              </p>

            </div>

            <Link
              to="/admin/pratos"
              className="rounded-xl bg-[#101813] px-5 py-3 text-sm font-bold text-white"
            >
              🍽️ Gerenciar pratos →
            </Link>

          </div>

          {/* INDICADORES */}

          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">

            {[
              {
                titulo: "Consultas registradas",
                valor: consultas.length,
                icone: "📋",
                cor: "text-blue-700",
              },

              {
                titulo: "Aguardando resposta",
                valor: consultasPendentes,
                icone: "⏳",
                cor: "text-amber-700",
              },

              {
                titulo: "Disponibilidade confirmada",
                valor: consultasConfirmadas,
                icone: "✅",
                cor: "text-green-700",
              },

              {
                titulo: "Indisponíveis",
                valor: consultasIndisponiveis,
                icone: "❌",
                cor: "text-red-700",
              },
            ].map((item) => (

              <article
                key={item.titulo}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
              >

                <span className="text-2xl">
                  {item.icone}
                </span>

                <p className="mt-3 text-xs font-bold text-gray-600">
                  {item.titulo}
                </p>

                <p className={`mt-2 text-3xl font-black ${item.cor}`}>
                  {carregandoConsultas || erroConsultas
                    ? "—"
                    : item.valor}
                </p>

              </article>

            ))}

          </div>

          {/* ERRO */}

          {erroConsultas && (

            <div
              role="alert"
              className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-800"
            >
              ⚠️ {erroConsultas}
            </div>

          )}

          {/* BUSCA E FILTROS */}

          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

            <label
              htmlFor="buscarConsultaAdmin"
              className="text-sm font-bold"
            >
              🔎 Buscar consulta
            </label>

            <input
              id="buscarConsultaAdmin"
              type="search"
              value={busca}
              onChange={(evento) =>
                setBusca(evento.target.value)
              }
              placeholder="Referência, restaurante ou prato..."
              className="mt-2 w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-amber-400"
            />

            <div className="mt-4 flex flex-wrap gap-2">

              {(
                [
                  ["todas", "Todas"],

                  [
                    "consulta_pendente",
                    "⏳ Pendentes",
                  ],

                  [
                    "confirmado",
                    "✅ Confirmadas",
                  ],

                  [
                    "indisponivel",
                    "❌ Indisponíveis",
                  ],
                ] as Array<
                  [FiltroConsulta, string]
                >
              ).map(([valor, titulo]) => (

                <button
                  key={valor}
                  type="button"
                  onClick={() =>
                    setFiltro(valor)
                  }
                  aria-pressed={
                    filtro === valor
                  }
                  className={`rounded-full px-4 py-2 text-xs font-bold ${
                    filtro === valor
                      ? "bg-[#101813] text-white"
                      : "border border-gray-200 bg-white text-gray-700"
                  }`}
                >
                  {titulo}
                </button>

              ))}

            </div>

          </div>

          {/* CARREGAMENTO */}

          {carregandoConsultas &&
            !erroConsultas && (

              <div className="mt-6 rounded-xl bg-blue-50 p-5 text-sm text-blue-900">
                ⏳ Carregando consultas...
              </div>

            )}

          {/* SEM RESULTADOS */}

          {!carregandoConsultas &&
            !erroConsultas &&
            consultasFiltradas.length === 0 && (

              <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-600">
                Nenhuma consulta encontrada para os
                filtros selecionados.
              </div>

            )}

          {/* LISTA DE CONSULTAS */}

          {!carregandoConsultas &&
            !erroConsultas &&
            consultasFiltradas.length > 0 && (

              <div className="mt-6 grid gap-5 lg:grid-cols-2">

                {consultasFiltradas.map(
                  (consulta) => {

                    const valorDestaque =
                      consulta.totalEstimado ??
                      consulta.subtotal;

                    return (

                      <article
                        key={consulta.id}
                        className="overflow-hidden rounded-3xl border border-sky-300 bg-white shadow-[0_0_18px_rgba(14,165,233,0.18)]"
                      >

                        {/* CABEÇALHO */}

                        <header className="bg-[#101813] p-5 text-white">

                          <div className="flex flex-wrap items-center justify-between gap-2">

                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                              SABORES DA CHAPADA
                            </span>

                            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                              {rotuloStatus(
                                consulta.status
                              )}
                            </span>

                          </div>

                          <h3 className="mt-3 text-xl font-black">
                            {consulta.restauranteNome}
                          </h3>

                          <p className="mt-1 text-xs text-gray-300">
                            Consulta #{referenciaCurta(
                              consulta.id
                            )}
                          </p>

                          <p className="mt-2 text-xs text-gray-300">
                            📅 {dataFormatada(
                              consulta.criadoEm
                            )}
                          </p>

                        </header>

                        <div className="p-5">

                          {/* RESUMO */}

                          <div className="flex flex-wrap items-center justify-between gap-3">

                            <span className="text-sm font-bold text-gray-600">
                              {consulta.totalItens} item(ns)
                            </span>

                            <strong className="text-2xl font-black text-green-900">
                              {moeda(valorDestaque)}
                            </strong>

                          </div>

                          <p className="mt-1 text-xs text-gray-500">
                            {consulta.totalEstimado !== null
                              ? "Total estimado, não contabilizado como receita."
                              : "Subtotal estimado. Total da consulta anterior não informado."}
                          </p>

                          {/* PRATOS */}

                          <div className="mt-5 space-y-3">

                            {consulta.itens.map(
                              (item, indice) => (

                                <div
                                  key={`${item.pratoId}-${indice}`}
                                  className="flex items-start gap-3 rounded-2xl bg-[#f8f6ef] p-3"
                                >

                                  {item.imagemUrl ? (

                                    <img
                                      src={item.imagemUrl}
                                      alt={`Imagem ilustrativa de ${item.nome}`}
                                      className="h-20 w-20 shrink-0 rounded-xl object-cover"
                                    />

                                  ) : (

                                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-white text-2xl">
                                      🍽️
                                    </div>

                                  )}

                                  <div className="min-w-0 flex-1">

                                    <h4 className="font-black">
                                      {item.nome}
                                    </h4>

                                    <p className="mt-1 text-xs text-gray-600">
                                      {item.quantidade} ×{" "}
                                      {moeda(
                                        item.precoUnitario
                                      )}
                                    </p>

                                    <p className="mt-1 text-sm font-black text-green-900">
                                      {moeda(
                                        item.subtotal
                                      )}
                                    </p>

                                    {item.observacao && (

                                      <p className="mt-2 whitespace-pre-wrap rounded-lg bg-amber-50 p-2 text-xs text-amber-900">
                                        📝 {item.observacao}
                                      </p>

                                    )}

                                  </div>

                                </div>

                              )
                            )}

                          </div>

                          {/* ATENDIMENTO E PAGAMENTO */}

                          <div className="mt-5 rounded-2xl border border-pink-200 bg-[#fffafd] p-4">

                            <h4 className="font-black">
                              🚚 Atendimento e pagamento
                            </h4>

                            <div className="mt-4 space-y-3 text-xs">

                              <div className="flex flex-wrap items-start justify-between gap-2">

                                <span>
                                  Modalidade escolhida
                                </span>

                                <strong className="text-right">
                                  {nomeAtendimento(
                                    consulta.atendimento
                                  )}
                                </strong>

                              </div>

                              <div className="flex flex-wrap items-start justify-between gap-2">

                                <span>
                                  Preferência de pagamento
                                </span>

                                <strong className="text-right">
                                  {nomePagamento(
                                    consulta.pagamento
                                  )}
                                </strong>

                              </div>

                            </div>

                            <div className="mt-4 space-y-3 border-t border-pink-200 pt-4 text-xs">

                              <div className="flex items-center justify-between gap-3">

                                <span>
                                  Subtotal dos pratos
                                </span>

                                <strong>
                                  {moeda(
                                    consulta.subtotal
                                  )}
                                </strong>

                              </div>

                              <div className="flex items-center justify-between gap-3">

                                <span>
                                  Taxa de entrega
                                </span>

                                <strong>
                                  {moedaOpcional(
                                    consulta.taxaEntrega
                                  )}
                                </strong>

                              </div>

                              <div className="flex items-center justify-between gap-3 border-t border-pink-200 pt-3">

                                <strong className="text-sm">
                                  Total estimado
                                </strong>

                                <strong className="text-base text-green-900">
                                  {moedaOpcional(
                                    consulta.totalEstimado
                                  )}
                                </strong>

                              </div>

                            </div>

                            <p className="mt-4 text-xs leading-6 text-gray-600">
                              O pagamento é combinado
                              diretamente entre o cliente
                              e o restaurante. A modalidade,
                              os valores e a forma de
                              pagamento precisam ser
                              confirmados pelo parceiro.
                            </p>

                          </div>

                          {/* REFERÊNCIA */}

                          <div className="mt-5 rounded-xl bg-gray-50 p-4">

                            <p className="text-xs font-bold text-gray-500">
                              REFERÊNCIA COMPLETA
                            </p>

                            <p className="mt-2 break-all font-mono text-xs">
                              {consulta.id}
                            </p>

                            <p className="mt-2 text-xs text-gray-500">
                              Atualização:{" "}
                              {dataFormatada(
                                consulta.atualizadoEm
                              )}
                            </p>

                          </div>

                          {/* AVISO */}

                          <div className="mt-4 rounded-xl bg-blue-50 p-4 text-xs leading-6 text-blue-900">

                            O parceiro responde à
                            disponibilidade pelo próprio
                            portal. Confirmar disponibilidade
                            não comprova compra, recebimento
                            de pagamento ou entrega.

                          </div>

                        </div>

                      </article>

                    );
                  }
                )}

              </div>

            )}

        </section>

        {/* =========================================== */}
        {/* PEDIDOS E VENDAS                            */}
        {/* =========================================== */}

        <section className="mt-9 rounded-3xl border border-blue-200 bg-blue-50 p-5 md:p-6">

          <h3 className="text-lg font-black text-blue-950">
            📋 Pedidos e vendas reais
          </h3>

          <p className="mt-3 text-sm leading-7 text-blue-900">
            As consultas estão integradas acima.
            A confirmação de uma compra, o pagamento
            e a entrega não são verificados
            automaticamente nesta etapa.

            Nenhum valor de consulta é contabilizado
            como receita do Império Chalés.
          </p>

        </section>

        {/* =========================================== */}
        {/* CENTRAL DEMONSTRATIVA                       */}
        {/* =========================================== */}

        <section className="mt-12">

          <span className="text-xs font-black uppercase tracking-[0.3em] text-amber-700">
            🧪 AMBIENTE DE TREINAMENTO
          </span>

          <h2 className="mt-3 text-3xl font-black">
            Central de pedidos demonstrativos
          </h2>

          <p className="mt-3 text-sm leading-7 text-gray-500">
            A simulação de pedidos permanece separada
            das consultas reais. Esta versão do painel
            prioriza o acompanhamento de restaurantes
            e consultas do Firestore.
          </p>

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-900">

            ⚠️ Nenhum pedido real é criado nesta área.
            As consultas recebidas devem ser acompanhadas
            na central acima.

          </div>

        </section>

        {/* =========================================== */}
        {/* GERENCIAMENTO                              */}
        {/* =========================================== */}

        <section className="mt-14">

          <h2 className="mb-6 text-2xl font-black">
            Gerenciamento do site
          </h2>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

            {[
              {
                titulo: "Restaurantes parceiros",
                descricao:
                  "Analise cadastros e gerencie os estabelecimentos.",
                icone: "🏪",
                caminho: "/admin/restaurantes",
              },

              {
                titulo: "Cardápios e pratos",
                descricao:
                  "Gerencie os pratos publicados e suas fotografias.",
                icone: "🍽️",
                caminho: "/admin/pratos",
              },

              {
                titulo: "Indicações",
                descricao:
                  "Acompanhamento de indicações em desenvolvimento.",
                icone: "🎟️",
                caminho: "",
              },

              {
                titulo: "Comissões",
                descricao:
                  "Controle financeiro ainda não habilitado.",
                icone: "💰",
                caminho: "",
              },

              {
                titulo: "Imagens do site",
                descricao:
                  "Gerenciamento em desenvolvimento.",
                icone: "🖼️",
                caminho: "",
              },

              {
                titulo: "Configurações",
                descricao:
                  "Configurações administrativas em desenvolvimento.",
                icone: "⚙️",
                caminho: "",
              },
            ].map((item) => (

              <article
                key={item.titulo}
                className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
              >

                <span className="text-3xl">
                  {item.icone}
                </span>

                <h3 className="mt-4 text-xl font-black">
                  {item.titulo}
                </h3>

                <p className="mt-3 flex-1 text-sm leading-6 text-gray-500">
                  {item.descricao}
                </p>

                {item.caminho ? (

                  <Link
                    to={item.caminho}
                    className="mt-6 rounded-xl bg-[#19352b] px-5 py-3 text-center text-sm font-bold text-white"
                  >
                    Gerenciar →
                  </Link>

                ) : (

                  <div className="mt-6 rounded-xl bg-gray-100 px-5 py-3 text-center text-sm font-semibold text-gray-400">
                    Em desenvolvimento
                  </div>

                )}

              </article>

            ))}

          </div>

        </section>

        {/* =========================================== */}
        {/* ACESSO AO CARDÁPIO                          */}
        {/* =========================================== */}

        <section className="mt-12 rounded-3xl bg-[#19352b] p-8 text-white md:p-10">

          <h2 className="text-2xl font-black">
            Sabores da Chapada
          </h2>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-300">
            Visualize como o catálogo gastronômico
            aparece para os hóspedes.
          </p>

          <Link
            to="/cardapio"
            className="mt-6 inline-block rounded-full bg-amber-400 px-6 py-3 text-sm font-black text-[#19352b]"
          >
            Visualizar cardápio →
          </Link>

        </section>

      </div>

    </main>
  );
}

export default AdminDashboard;