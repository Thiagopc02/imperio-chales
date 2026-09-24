import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  type Timestamp,
} from "firebase/firestore";

import { auth, db } from "../firebase/config";
import { isAdmin } from "../firebase/admin";

// =====================================================
// TIPOS
// =====================================================

type StatusRestaurante =
  | "pendente"
  | "aprovado"
  | "rejeitado";

type FiltroRestaurante =
  | "todos"
  | "pendente"
  | "aprovado"
  | "rejeitado";

interface Restaurante {
  id: string;
  uid: string;
  nomeEmpresa: string;
  nomeResponsavel: string;
  email: string;
  telefone: string;
  documento: string;
  cep: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  complemento: string;
  modalidadeEntrega: string;
  descricao: string;
  logoUrl: string;
  status: StatusRestaurante;
  criadoEm: Timestamp | null;
}

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function formatarData(data: Timestamp | null): string {
  if (!data) {
    return "Data não informada";
  }

  return data.toDate().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarModalidade(valor: string): string {
  switch (valor) {
    case "entrega_propria":
      return "🛵 Entrega própria";

    case "somente_retirada":
      return "📦 Somente retirada";

    case "ambas":
      return "✅ Entrega própria e retirada";

    default:
      return "Não informada";
  }
}

function formatarStatus(
  status: StatusRestaurante
): string {
  switch (status) {
    case "pendente":
      return "⏳ Aguardando aprovação";

    case "aprovado":
      return "✅ Aprovado";

    case "rejeitado":
      return "❌ Rejeitado";
  }
}

function classeStatus(
  status: StatusRestaurante
): string {
  switch (status) {
    case "pendente":
      return "border-amber-200 bg-amber-100 text-amber-800";

    case "aprovado":
      return "border-green-200 bg-green-100 text-green-800";

    case "rejeitado":
      return "border-red-200 bg-red-100 text-red-800";
  }
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function AdminRestaurantes() {
  // ===================================================
  // ESTADOS
  // ===================================================

  const [restaurantes, setRestaurantes] =
    useState<Restaurante[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState("");

  const [mensagem, setMensagem] =
    useState("");

  const [filtro, setFiltro] =
    useState<FiltroRestaurante>("todos");

  const [busca, setBusca] =
    useState("");

  const [processandoId, setProcessandoId] =
    useState<string | null>(null);

  const [detalhesAbertos, setDetalhesAbertos] =
    useState<string | null>(null);

  // ===================================================
  // CONSULTAR RESTAURANTES EM TEMPO REAL
  // ===================================================

  useEffect(() => {
    /*
      AdminRoute já protege esta página.

      Esta verificação adicional evita iniciar
      a consulta quando não existe uma sessão
      administrativa carregada.

      A proteção real dos dados permanece
      nas regras de segurança do Firestore.
    */

    const usuario = auth.currentUser;

    if (!usuario || !isAdmin(usuario.uid)) {
      setRestaurantes([]);
      setErro("Sessão administrativa não autorizada.");
      setCarregando(false);

      return;
    }

    const referencia = collection(
      db,
      "restaurantes"
    );

    const cancelarInscricao = onSnapshot(
      referencia,

      (resultado) => {
        const lista: Restaurante[] =
          resultado.docs.map((documento) => {
            const dados = documento.data();

            const statusRecebido =
              dados.status;

            const status: StatusRestaurante =
              statusRecebido === "aprovado" ||
              statusRecebido === "rejeitado"
                ? statusRecebido
                : "pendente";

            return {
              id: documento.id,

              uid:
                typeof dados.uid === "string"
                  ? dados.uid
                  : documento.id,

              nomeEmpresa:
                dados.nomeEmpresa ?? "",

              nomeResponsavel:
                dados.nomeResponsavel ?? "",

              email:
                dados.email ?? "",

              telefone:
                dados.telefone ?? "",

              documento:
                dados.documento ?? "",

              cep:
                dados.cep ?? "",

              endereco:
                dados.endereco ?? "",

              numero:
                dados.numero ?? "",

              bairro:
                dados.bairro ?? "",

              cidade:
                dados.cidade ?? "",

              complemento:
                dados.complemento ?? "",

              modalidadeEntrega:
                dados.modalidadeEntrega ?? "",

              descricao:
                dados.descricao ?? "",

              logoUrl:
                dados.logoUrl ?? "",

              status,

              criadoEm:
                dados.criadoEm ?? null,
            };
          });

        /*
          Ordenamos localmente para não exigir
          a criação de um índice no Firestore
          nesta primeira versão.
        */

        lista.sort((a, b) => {
          const dataA =
            a.criadoEm?.toMillis() ?? 0;

          const dataB =
            b.criadoEm?.toMillis() ?? 0;

          return dataB - dataA;
        });

        setRestaurantes(lista);

        setCarregando(false);
        setErro("");
      },

      (erroFirebase) => {
        console.error(
          "Erro ao carregar restaurantes:",
          erroFirebase
        );

        setRestaurantes([]);

        setErro(
          "Não foi possível carregar os restaurantes. Confira se você está conectado como administrador e se as regras do Firestore foram publicadas."
        );

        setCarregando(false);
      }
    );

    return () => {
      cancelarInscricao();
    };
  }, []);

  // ===================================================
  // INDICADORES
  // ===================================================

  const total =
    restaurantes.length;

  const pendentes =
    restaurantes.filter(
      (restaurante) =>
        restaurante.status === "pendente"
    ).length;

  const aprovados =
    restaurantes.filter(
      (restaurante) =>
        restaurante.status === "aprovado"
    ).length;

  const rejeitados =
    restaurantes.filter(
      (restaurante) =>
        restaurante.status === "rejeitado"
    ).length;

  // ===================================================
  // FILTRO E BUSCA
  // ===================================================

  const restaurantesFiltrados =
    restaurantes.filter((restaurante) => {
      const correspondeFiltro =
        filtro === "todos" ||
        restaurante.status === filtro;

      const termo =
        busca.trim().toLowerCase();

      const correspondeBusca =
        termo.length === 0 ||
        restaurante.nomeEmpresa
          .toLowerCase()
          .includes(termo) ||
        restaurante.nomeResponsavel
          .toLowerCase()
          .includes(termo) ||
        restaurante.email
          .toLowerCase()
          .includes(termo);

      return (
        correspondeFiltro &&
        correspondeBusca
      );
    });

  // ===================================================
  // APROVAR OU REJEITAR
  // ===================================================

  async function alterarStatus(
    restaurante: Restaurante,
    novoStatus: "aprovado" | "rejeitado"
  ) {
    if (processandoId !== null) {
      return;
    }

    setErro("");
    setMensagem("");

    // Impede ações repetidas no cliente.
    if (restaurante.status !== "pendente") {
      setErro(
        "Esta solicitação já foi analisada. Atualize a página caso o status tenha mudado."
      );

      return;
    }

    const usuario = auth.currentUser;

    if (!usuario || !isAdmin(usuario.uid)) {
      setErro(
        "Sua sessão administrativa não está autorizada."
      );

      return;
    }

    const acao =
      novoStatus === "aprovado"
        ? "APROVAR"
        : "REJEITAR";

    const confirmou = window.confirm(
      `Deseja ${acao} a solicitação da empresa "${restaurante.nomeEmpresa}"?\n\n` +
        (
          novoStatus === "aprovado"
            ? "O cadastro será marcado como aprovado no Firestore. O login operacional continuará bloqueado até implementarmos a proteção do Portal do Parceiro."
            : "O cadastro será marcado como rejeitado. O registro permanecerá no Firestore para consulta administrativa."
        )
    );

    if (!confirmou) {
      return;
    }

    setProcessandoId(restaurante.id);

    try {
      const referencia = doc(
        db,
        "restaurantes",
        restaurante.id
      );

      /*
        Atualizamos somente os campos
        relacionados à decisão administrativa.

        Não sobrescrevemos os dados cadastrais.

        Atenção: as regras atuais permitem
        atualização administrativa. O controle
        de transições de status também deverá
        ser reforçado no Firestore antes
        da entrada em produção.
      */

      await updateDoc(referencia, {
        status: novoStatus,
        analisadoEm: serverTimestamp(),
        analisadoPor: usuario.uid,
      });

      setMensagem(
        novoStatus === "aprovado"
          ? `A empresa "${restaurante.nomeEmpresa}" foi marcada como aprovada no Firestore.`
          : `A solicitação da empresa "${restaurante.nomeEmpresa}" foi rejeitada.`
      );

    } catch (erroFirebase) {
      console.error(
        "Erro ao atualizar restaurante:",
        erroFirebase
      );

      setErro(
        "Não foi possível atualizar a solicitação. Confira as regras do Firestore e tente novamente."
      );

    } finally {
      setProcessandoId(null);
    }
  }

  // ===================================================
  // ESTILOS
  // ===================================================

  const classeBotaoFiltro =
    "rounded-full border px-4 py-2 text-sm font-bold transition";

  // ===================================================
  // INTERFACE
  // ===================================================

  return (
    <main className="min-h-screen bg-[#f8f6ef] text-[#19352b]">

      {/* =========================================== */}
      {/* CABEÇALHO                                  */}
      {/* =========================================== */}

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
                RESTAURANTES PARCEIROS
              </p>

            </div>

          </div>

          <Link
            to="/admin/dashboard"
            className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold transition hover:bg-white/10"
          >
            ← Dashboard
          </Link>

        </div>

      </header>

      {/* =========================================== */}
      {/* CONTEÚDO                                   */}
      {/* =========================================== */}

      <div className="mx-auto max-w-7xl px-4 py-10">

        {/* APRESENTAÇÃO */}

        <section className="flex flex-wrap items-center justify-between gap-5">

          <div>

            <span className="text-xs font-bold uppercase tracking-[0.3em] text-amber-700">
              CENTRAL ADMINISTRATIVA
            </span>

            <h2 className="mt-3 text-3xl font-black md:text-4xl">
              Restaurantes parceiros
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-500">
              Analise solicitações, consulte os dados
              das empresas e acompanhe os
              estabelecimentos cadastrados
              no Sabores da Chapada.
            </p>

          </div>

          <Link
            to="/parceiro/cadastro"
            className="rounded-2xl border-b-4 border-amber-600 bg-amber-400 px-5 py-4 text-center text-sm font-black text-black shadow-md transition hover:-translate-y-1 hover:bg-amber-300"
          >
            ➕ Abrir cadastro de parceiros
          </Link>

        </section>

        {/* ========================================= */}
        {/* AVISO DE INTEGRAÇÃO                       */}
        {/* ========================================= */}

        <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-900">

          <p className="font-black">
            🔗 Central conectada ao Firestore
          </p>

          <p className="mt-2">
            Esta página consulta os cadastros
            registrados na coleção{" "}
            <strong>restaurantes</strong>.
            As decisões de aprovação e rejeição
            são gravadas no banco de dados.
          </p>

          <p className="mt-2">
            ⚠️ A aprovação do cadastro ainda não
            habilita login operacional nem
            acesso a pedidos reais. Essas proteções
            serão implementadas na próxima etapa.
          </p>

        </div>

        {/* ========================================= */}
        {/* ERRO                                      */}
        {/* ========================================= */}

        {erro && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-300 bg-red-50 p-5 text-sm font-semibold leading-6 text-red-800"
          >
            ⚠️ {erro}
          </div>
        )}

        {/* ========================================= */}
        {/* SUCESSO                                   */}
        {/* ========================================= */}

        {mensagem && (
          <div
            role="status"
            className="mt-6 rounded-2xl border border-green-300 bg-green-50 p-5 text-sm font-semibold leading-6 text-green-800"
          >
            ✅ {mensagem}
          </div>
        )}

        {/* ========================================= */}
        {/* INDICADORES                               */}
        {/* ========================================= */}

        <section className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">

          {[
            {
              titulo: "Total de cadastros",
              valor: total,
              icone: "🏪",
              cor: "text-[#19352b]",
              detalhe: "Empresas registradas",
            },
            {
              titulo: "Pendentes",
              valor: pendentes,
              icone: "⏳",
              cor: "text-amber-700",
              detalhe: "Aguardando análise",
            },
            {
              titulo: "Aprovados",
              valor: aprovados,
              icone: "✅",
              cor: "text-green-700",
              detalhe: "Cadastros autorizados",
            },
            {
              titulo: "Rejeitados",
              valor: rejeitados,
              icone: "❌",
              cor: "text-red-700",
              detalhe: "Solicitações rejeitadas",
            },
          ].map((item) => (

            <article
              key={item.titulo}
              className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:p-6"
            >

              <span className="text-2xl md:text-3xl">
                {item.icone}
              </span>

              <h3 className="mt-4 text-xs font-semibold text-gray-500 md:text-sm">
                {item.titulo}
              </h3>

              <p
                className={`mt-3 text-3xl font-black md:text-4xl ${item.cor}`}
              >
                {carregando ? "—" : item.valor}
              </p>

              <p className="mt-2 text-xs text-gray-400">
                {item.detalhe}
              </p>

            </article>

          ))}

        </section>

        {/* ========================================= */}
        {/* FILTROS                                   */}
        {/* ========================================= */}

        <section className="mt-12 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div>

              <h3 className="text-xl font-black">
                🔎 Localizar estabelecimentos
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Filtre por situação ou pesquise
                pelo nome e e-mail da empresa.
              </p>

            </div>

            <span className="rounded-full bg-[#f8f6ef] px-4 py-2 text-xs font-bold">
              {restaurantesFiltrados.length} resultado(s)
            </span>

          </div>

          {/* BUSCA */}

          <div className="mt-6">

            <label
              htmlFor="buscar-restaurantes"
              className="mb-2 block text-sm font-bold"
            >
              Buscar empresa
            </label>

            <input
              id="buscar-restaurantes"
              type="search"
              value={busca}
              onChange={(event) =>
                setBusca(event.target.value)
              }
              placeholder="Nome da empresa, responsável ou e-mail..."
              className="w-full rounded-xl border border-gray-200 bg-[#f8f6ef] px-4 py-4 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />

          </div>

          {/* BOTÕES DE FILTRO */}

          <div className="mt-5 flex flex-wrap gap-2">

            {[
              {
                valor: "todos",
                titulo: `Todos (${total})`,
              },
              {
                valor: "pendente",
                titulo: `⏳ Pendentes (${pendentes})`,
              },
              {
                valor: "aprovado",
                titulo: `✅ Aprovados (${aprovados})`,
              },
              {
                valor: "rejeitado",
                titulo: `❌ Rejeitados (${rejeitados})`,
              },
            ].map((opcao) => (

              <button
                key={opcao.valor}
                type="button"
                onClick={() =>
                  setFiltro(
                    opcao.valor as FiltroRestaurante
                  )
                }
                aria-pressed={
                  filtro === opcao.valor
                }
                className={`${classeBotaoFiltro} ${
                  filtro === opcao.valor
                    ? "border-[#19352b] bg-[#19352b] text-white"
                    : "border-gray-200 bg-white text-[#19352b] hover:border-green-500"
                }`}
              >
                {opcao.titulo}
              </button>

            ))}

          </div>

        </section>

        {/* ========================================= */}
        {/* LISTAGEM                                  */}
        {/* ========================================= */}

        <section className="mt-12">

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

            <div>

              <h3 className="text-2xl font-black">
                Estabelecimentos cadastrados
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Os dados abaixo são consultados
                diretamente do Firebase.
              </p>

            </div>

            {pendentes > 0 && (
              <span className="animate-pulse rounded-full border border-amber-300 bg-amber-100 px-4 py-2 text-sm font-black text-amber-900 motion-reduce:animate-none">
                🔔 {pendentes} aguardando análise
              </span>
            )}

          </div>

          {/* CARREGANDO */}

          {carregando && (
            <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center shadow-sm">

              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-100 border-t-green-700" />

              <p className="mt-6 text-sm font-bold text-gray-600">
                Consultando restaurantes no Firebase...
              </p>

            </div>
          )}

          {/* NENHUM CADASTRO */}

          {!carregando &&
            !erro &&
            restaurantes.length === 0 && (

            <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center">

              <span className="text-5xl">
                🏪
              </span>

              <h4 className="mt-6 text-xl font-black">
                Nenhum restaurante cadastrado
              </h4>

              <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-gray-500">
                Assim que uma empresa concluir
                o cadastro, ela aparecerá aqui
                automaticamente para análise.
              </p>

            </div>

          )}

          {/* NENHUM RESULTADO NOS FILTROS */}

          {!carregando &&
            !erro &&
            restaurantes.length > 0 &&
            restaurantesFiltrados.length === 0 && (

            <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center">

              <span className="text-5xl">
                🔎
              </span>

              <h4 className="mt-6 text-xl font-black">
                Nenhum resultado encontrado
              </h4>

              <p className="mt-3 text-sm text-gray-500">
                Experimente outro termo de busca
                ou altere o filtro selecionado.
              </p>

              <button
                type="button"
                onClick={() => {
                  setBusca("");
                  setFiltro("todos");
                }}
                className="mt-6 rounded-xl bg-[#19352b] px-5 py-3 text-sm font-bold text-white transition hover:bg-green-800"
              >
                Limpar filtros
              </button>

            </div>

          )}

          {/* ======================================= */}
          {/* CARDS DOS RESTAURANTES                 */}
          {/* ======================================= */}

          {!carregando &&
            !erro &&
            restaurantesFiltrados.length > 0 && (

            <div className="grid gap-6 lg:grid-cols-2">

              {restaurantesFiltrados.map(
                (restaurante) => {

                  const detalhesVisiveis =
                    detalhesAbertos ===
                    restaurante.id;

                  const processando =
                    processandoId ===
                    restaurante.id;

                  const pendente =
                    restaurante.status ===
                    "pendente";

                  return (

                    <article
                      key={restaurante.id}
                      className={`overflow-hidden rounded-3xl border-2 bg-white shadow-sm transition hover:shadow-lg ${
                        pendente
                          ? "border-amber-300"
                          : restaurante.status === "aprovado"
                          ? "border-green-200"
                          : "border-red-200"
                      }`}
                    >

                      {/* CABEÇALHO DO CARD */}

                      <div className="bg-gradient-to-r from-[#10251d] to-[#19352b] p-6 text-white">

                        <div className="flex items-start gap-4">

                          {/* LOGO */}

                          {restaurante.logoUrl ? (

                            <img
                              src={restaurante.logoUrl}
                              alt={`Logo de ${restaurante.nomeEmpresa}`}
                              className="h-20 w-20 shrink-0 rounded-2xl border border-white/20 bg-white p-2 object-contain"
                            />

                          ) : (

                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-4xl">
                              🏪
                            </div>

                          )}

                          <div className="min-w-0 flex-1">

                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${classeStatus(
                                restaurante.status
                              )}`}
                            >
                              {formatarStatus(
                                restaurante.status
                              )}
                            </span>

                            <h4 className="mt-3 break-words text-xl font-black md:text-2xl">
                              {restaurante.nomeEmpresa}
                            </h4>

                            <p className="mt-2 break-all text-xs text-gray-300">
                              ID: {restaurante.id}
                            </p>

                          </div>

                        </div>

                      </div>

                      {/* CONTEÚDO DO CARD */}

                      <div className="p-5 md:p-6">

                        {/* DADOS PRINCIPAIS */}

                        <div className="space-y-4">

                          <div>

                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                              Responsável
                            </p>

                            <p className="mt-1 break-words text-sm font-semibold">
                              👤 {restaurante.nomeResponsavel}
                            </p>

                          </div>

                          <div>

                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                              E-mail
                            </p>

                            <p className="mt-1 break-all text-sm font-semibold">
                              📧 {restaurante.email}
                            </p>

                          </div>

                          <div>

                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                              WhatsApp
                            </p>

                            <p className="mt-1 text-sm font-semibold">
                              📱 {restaurante.telefone}
                            </p>

                          </div>

                          <div>

                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                              Atendimento
                            </p>

                            <p className="mt-1 text-sm font-semibold">
                              {formatarModalidade(
                                restaurante.modalidadeEntrega
                              )}
                            </p>

                          </div>

                        </div>

                        {/* DATA DO CADASTRO */}

                        <div className="mt-6 rounded-2xl bg-[#f8f6ef] p-4">

                          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            Solicitação recebida em
                          </p>

                          <p className="mt-2 text-sm font-bold">
                            🗓️ {formatarData(
                              restaurante.criadoEm
                            )}
                          </p>

                        </div>

                        {/* DETALHES */}

                        <button
                          type="button"
                          onClick={() =>
                            setDetalhesAbertos(
                              detalhesVisiveis
                                ? null
                                : restaurante.id
                            )
                          }
                          aria-expanded={
                            detalhesVisiveis
                          }
                          className="mt-5 w-full rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm font-bold transition hover:bg-[#f8f6ef]"
                        >
                          {detalhesVisiveis
                            ? "▲ Ocultar dados completos"
                            : "▼ Ver dados completos"}
                        </button>

                        {detalhesVisiveis && (

                          <div className="mt-4 space-y-4 rounded-2xl border border-gray-100 bg-[#f8f6ef] p-5 text-sm">

                            <div>

                              <p className="font-bold">
                                📍 Endereço
                              </p>

                              <p className="mt-2 leading-6 text-gray-600">

                                {restaurante.endereco},{" "}
                                {restaurante.numero}

                                {restaurante.complemento
                                  ? ` — ${restaurante.complemento}`
                                  : ""}

                                <br />

                                {restaurante.bairro}

                                <br />

                                {restaurante.cidade}

                                <br />

                                CEP: {restaurante.cep}

                              </p>

                            </div>

                            <div className="border-t border-gray-200 pt-4">

                              <p className="font-bold">
                                🪪 CPF/CNPJ informado
                              </p>

                              <p className="mt-2 text-gray-600">
                                {restaurante.documento ||
                                  "Não informado"}
                              </p>

                            </div>

                            <div className="border-t border-gray-200 pt-4">

                              <p className="font-bold">
                                📝 Descrição
                              </p>

                              <p className="mt-2 whitespace-pre-wrap break-words leading-6 text-gray-600">
                                {restaurante.descricao ||
                                  "Nenhuma descrição cadastrada."}
                              </p>

                            </div>

                            <div className="border-t border-gray-200 pt-4">

                              <p className="font-bold">
                                🔐 UID do responsável
                              </p>

                              <p className="mt-2 break-all text-xs text-gray-600">
                                {restaurante.uid}
                              </p>

                            </div>

                          </div>

                        )}

                        {/* ================================= */}
                        {/* AÇÕES DE APROVAÇÃO                */}
                        {/* ================================= */}

                        {pendente && (

                          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">

                            <p className="text-sm font-black text-amber-900">
                              ⚠️ Solicitação aguardando sua decisão
                            </p>

                            <p className="mt-2 text-xs leading-5 text-amber-800">
                              Confira os dados da empresa
                              antes de aprovar ou rejeitar.
                            </p>

                            <div className="mt-5 grid gap-3 sm:grid-cols-2">

                              {/* APROVAR */}

                              <button
                                type="button"
                                disabled={
                                  processandoId !== null
                                }
                                onClick={() =>
                                  alterarStatus(
                                    restaurante,
                                    "aprovado"
                                  )
                                }
                                className="rounded-xl border-b-4 border-green-900 bg-green-700 px-4 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {processando
                                  ? "⏳ Processando..."
                                  : "✅ Aprovar empresa"}
                              </button>

                              {/* REJEITAR */}

                              <button
                                type="button"
                                disabled={
                                  processandoId !== null
                                }
                                onClick={() =>
                                  alterarStatus(
                                    restaurante,
                                    "rejeitado"
                                  )
                                }
                                className="rounded-xl border border-red-200 bg-white px-4 py-4 text-sm font-black text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {processando
                                  ? "⏳ Processando..."
                                  : "❌ Rejeitar"}
                              </button>

                            </div>

                          </div>

                        )}

                        {/* APROVADO */}

                        {restaurante.status === "aprovado" && (

                          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">

                            <p className="font-black text-green-800">
                              ✅ Cadastro aprovado
                            </p>

                            <p className="mt-2 text-sm leading-6 text-green-700">
                              Esta empresa foi aprovada
                              administrativamente.
                              O acesso ao Portal do Parceiro
                              dependerá da implantação
                              das rotas protegidas.
                            </p>

                          </div>

                        )}

                        {/* REJEITADO */}

                        {restaurante.status === "rejeitado" && (

                          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">

                            <p className="font-black text-red-800">
                              ❌ Solicitação rejeitada
                            </p>

                            <p className="mt-2 text-sm leading-6 text-red-700">
                              O registro foi mantido
                              no Firestore para
                              consulta administrativa.
                            </p>

                          </div>

                        )}

                      </div>

                    </article>

                  );
                }
              )}

            </div>

          )}

        </section>

      </div>

    </main>
  );
}

export default AdminRestaurantes;