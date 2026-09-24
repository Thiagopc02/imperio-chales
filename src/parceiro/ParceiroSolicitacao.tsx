import { useEffect, useState } from "react";

import {
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";

import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";

import {
  doc,
  onSnapshot,
} from "firebase/firestore";

import { auth, db } from "../firebase/config";
import { isAdmin } from "../firebase/admin";

// ==========================================
// TIPOS
// ==========================================

type EstadoSolicitacao =
  | "carregando"
  | "sem_login"
  | "sem_cadastro"
  | "pendente"
  | "aprovado"
  | "rejeitado"
  | "erro";

interface Empresa {
  nomeEmpresa: string;
  nomeResponsavel: string;
  email: string;
  status: string;
}

// ==========================================
// PÁGINA DE ACOMPANHAMENTO
// ==========================================

export function ParceiroSolicitacao() {
  const navigate = useNavigate();

  const [estado, setEstado] =
    useState<EstadoSolicitacao>("carregando");

  const [usuario, setUsuario] =
    useState<User | null>(null);

  const [empresa, setEmpresa] =
    useState<Empresa | null>(null);

  // ========================================
  // CONSULTAR SITUAÇÃO EM TEMPO REAL
  // ========================================

  useEffect(() => {
    let cancelarEmpresa: (() => void) | null =
      null;

    const cancelarAutenticacao =
      onAuthStateChanged(
        auth,

        (usuarioAtual) => {
          if (cancelarEmpresa) {
            cancelarEmpresa();
            cancelarEmpresa = null;
          }

          setUsuario(usuarioAtual);
          setEmpresa(null);
          setEstado("carregando");

          if (!usuarioAtual) {
            setEstado("sem_login");
            return;
          }

          if (isAdmin(usuarioAtual.uid)) {
            setEstado("sem_cadastro");
            return;
          }

          const referencia = doc(
            db,
            "restaurantes",
            usuarioAtual.uid
          );

          cancelarEmpresa = onSnapshot(
            referencia,

            (resultado) => {
              if (!resultado.exists()) {
                setEstado("sem_cadastro");
                return;
              }

              const dados = resultado.data();

              if (dados.uid !== usuarioAtual.uid) {
                setEstado("erro");
                return;
              }

              setEmpresa({
                nomeEmpresa:
                  typeof dados.nomeEmpresa === "string"
                    ? dados.nomeEmpresa
                    : "Estabelecimento",

                nomeResponsavel:
                  typeof dados.nomeResponsavel === "string"
                    ? dados.nomeResponsavel
                    : "",

                email:
                  typeof dados.email === "string"
                    ? dados.email
                    : "",

                status:
                  typeof dados.status === "string"
                    ? dados.status
                    : "",
              });

              if (dados.status === "aprovado") {
                setEstado("aprovado");
                return;
              }

              if (dados.status === "rejeitado") {
                setEstado("rejeitado");
                return;
              }

              if (dados.status === "pendente") {
                setEstado("pendente");
                return;
              }

              setEstado("erro");
            },

            (erroFirebase) => {
              console.error(
                "Erro ao consultar solicitação:",
                erroFirebase
              );

              setEstado("erro");
            }
          );
        },

        (erroFirebase) => {
          console.error(
            "Erro ao verificar autenticação:",
            erroFirebase
          );

          setEstado("erro");
        }
      );

    return () => {
      cancelarAutenticacao();

      if (cancelarEmpresa) {
        cancelarEmpresa();
      }
    };
  }, []);

  // ========================================
  // REDIRECIONAR APÓS APROVAÇÃO
  // ========================================

  useEffect(() => {
    if (estado === "aprovado") {
      navigate(
        "/parceiro/dashboard",
        { replace: true }
      );
    }
  }, [estado, navigate]);

  // ========================================
  // CARREGAMENTO
  // ========================================

  if (estado === "carregando" || estado === "aprovado") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f6ef] px-4">

        <div className="rounded-3xl bg-white p-10 text-center shadow-lg">

          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-100 border-t-green-700" />

          <p className="mt-6 font-bold text-[#19352b]">
            {estado === "aprovado"
              ? "Cadastro aprovado! Abrindo seu painel..."
              : "Consultando sua solicitação..."}
          </p>

        </div>

      </main>
    );
  }

  // ========================================
  // SEM SESSÃO
  // ========================================

  if (estado === "sem_login") {
    return (
      <Navigate
        to="/parceiro/cadastro"
        replace
      />
    );
  }

  // ========================================
  // USUÁRIO ADMINISTRADOR
  // ========================================

  if (usuario && isAdmin(usuario.uid)) {
    return (
      <Navigate
        to="/admin/dashboard"
        replace
      />
    );
  }

  // ========================================
  // SEM CADASTRO
  // ========================================

  if (estado === "sem_cadastro") {
    return (
      <Navigate
        to="/parceiro/cadastro"
        replace
      />
    );
  }

  // ========================================
  // ERRO
  // ========================================

  if (estado === "erro") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f6ef] px-4">

        <div
          role="alert"
          className="w-full max-w-xl rounded-3xl border border-red-200 bg-white p-8 text-center shadow-lg"
        >

          <span className="text-5xl">
            ⚠️
          </span>

          <h1 className="mt-5 text-2xl font-black text-red-800">
            Não foi possível consultar sua solicitação
          </h1>

          <p className="mt-4 text-sm leading-7 text-gray-600">
            Tivemos uma dificuldade para consultar
            os dados no Firebase.
            Nenhum acesso operacional foi liberado.
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-[#19352b] px-6 py-3 text-sm font-bold text-white"
          >
            Tentar novamente
          </button>

        </div>

      </main>
    );
  }

  // ========================================
  // SOLICITAÇÃO REJEITADA
  // ========================================

  const rejeitado = estado === "rejeitado";

  return (
    <main className="min-h-screen bg-[#f8f6ef] text-[#19352b]">

      {/* ==================================== */}
      {/* CABEÇALHO                            */}
      {/* ==================================== */}

      <header className="bg-[#101813] px-4 py-5 text-white">

        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">

          <div className="flex items-center gap-3">

            <img
              src="/logo-imperio.png"
              alt="Império Chalés"
              className="h-12 w-12 rounded-full object-contain"
            />

            <div>

              <h1 className="text-lg font-black">
                Portal do Parceiro
              </h1>

              <p className="text-xs font-bold tracking-widest text-amber-300">
                SABORES DA CHAPADA
              </p>

            </div>

          </div>

          <span className="rounded-full border border-amber-400/40 px-4 py-2 text-xs font-black text-amber-300">
            ACOMPANHAMENTO DO CADASTRO
          </span>

        </div>

      </header>

      {/* ==================================== */}
      {/* CONTEÚDO                             */}
      {/* ==================================== */}

      <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">

        {/* ================================== */}
        {/* CARD PRINCIPAL                     */}
        {/* ================================== */}

        <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#10251d] via-[#143627] to-[#0e2019] p-6 text-white shadow-xl md:p-10">

          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />

          <div className="relative">

            <span
              className={`inline-flex rounded-full border px-4 py-2 text-xs font-black tracking-wider ${
                rejeitado
                  ? "border-red-300/50 bg-red-500/20 text-red-200"
                  : "border-amber-400/40 bg-amber-400/10 text-amber-300"
              }`}
            >
              {rejeitado
                ? "❌ SOLICITAÇÃO REJEITADA"
                : "⏳ SOLICITAÇÃO EM ANÁLISE"}
            </span>

            <h2 className="mt-7 text-3xl font-black uppercase leading-tight md:text-5xl">

              {rejeitado
                ? "SUA SOLICITAÇÃO"
                : "SUA SOLICITAÇÃO ESTÁ"}

              <span
                className={`mt-2 block ${
                  rejeitado
                    ? "text-red-300"
                    : "text-amber-400"
                }`}
              >
                {rejeitado
                  ? "NÃO FOI APROVADA"
                  : "PENDENTE!"}
              </span>

            </h2>

            <p className="mt-6 max-w-3xl text-lg font-semibold leading-8 text-white md:text-xl">

              {rejeitado
                ? "O Império Chalés concluiu a análise e não aprovou esta solicitação."
                : "Recebemos seu cadastro! Nossa administração precisa analisar os dados da empresa antes de liberar o acesso."}

            </p>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/10 p-5">

              <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Estabelecimento
              </p>

              <h3 className="mt-2 break-words text-2xl font-black">
                🏪 {empresa?.nomeEmpresa ?? "Estabelecimento"}
              </h3>

              {empresa?.email && (
                <p className="mt-3 break-all text-sm text-gray-200">
                  📧 {empresa.email}
                </p>
              )}

            </div>

            {/* ETAPAS */}

            <div className="mt-8 grid gap-3 md:grid-cols-3">

              <div className="rounded-2xl border border-green-400/30 bg-green-400/10 p-5">

                <span className="text-3xl">
                  ✅
                </span>

                <p className="mt-3 text-xs font-bold text-green-300">
                  ETAPA 1
                </p>

                <h4 className="mt-1 font-black">
                  Cadastro recebido
                </h4>

                <p className="mt-2 text-xs leading-5 text-gray-200">
                  Seus dados foram registrados.
                </p>

              </div>

              <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5">

                <span className="text-3xl">
                  {rejeitado ? "📋" : "⏳"}
                </span>

                <p className="mt-3 text-xs font-bold text-amber-300">
                  ETAPA 2
                </p>

                <h4 className="mt-1 font-black">
                  Análise administrativa
                </h4>

                <p className="mt-2 text-xs leading-5 text-gray-200">
                  {rejeitado
                    ? "A análise foi concluída."
                    : "Aguardando avaliação do Império Chalés."}
                </p>

              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-5">

                <span className="text-3xl">
                  🔒
                </span>

                <p className="mt-3 text-xs font-bold text-gray-300">
                  ETAPA 3
                </p>

                <h4 className="mt-1 font-black">
                  Acesso operacional
                </h4>

                <p className="mt-2 text-xs leading-5 text-gray-200">
                  {rejeitado
                    ? "Acesso não autorizado."
                    : "Liberado após aprovação."}
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* ================================== */}
        {/* EXPLICAÇÃO DO BLOQUEIO             */}
        {/* ================================== */}

        <section
          className={`mt-7 rounded-3xl border p-6 shadow-sm md:p-8 ${
            rejeitado
              ? "border-red-200 bg-red-50"
              : "border-amber-200 bg-amber-50"
          }`}
        >

          <div className="flex items-start gap-4">

            <span className="text-4xl">
              {rejeitado ? "🚫" : "⚠️"}
            </span>

            <div>

              <h3
                className={`text-xl font-black md:text-2xl ${
                  rejeitado
                    ? "text-red-900"
                    : "text-amber-900"
                }`}
              >
                {rejeitado
                  ? "Seu acesso continua bloqueado"
                  : "O que acontece agora?"}
              </h3>

              <p
                className={`mt-3 text-sm leading-7 ${
                  rejeitado
                    ? "text-red-800"
                    : "text-amber-900"
                }`}
              >
                {rejeitado
                  ? "O estabelecimento não está autorizado a acessar o painel operacional ou gerenciar pedidos. Entre em contato com a administração caso precise esclarecer a decisão."
                  : "Nossa equipe verificará os dados informados. Quando a empresa for aprovada, o sistema identificará a alteração no Firebase e abrirá sua Dashboard automaticamente, desde que esta conta continue conectada."}
              </p>

              {!rejeitado && (
                <p className="mt-3 text-sm leading-7 text-amber-900">
                  Você pode permanecer nesta página
                  para acompanhar a situação.
                  Não é necessário enviar outro cadastro.
                </p>
              )}

            </div>

          </div>

        </section>

        {/* ================================== */}
        {/* ACESSO A PEDIDOS                   */}
        {/* ================================== */}

        <section className="mt-7 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h3 className="text-2xl font-black">
                📋 Meus pedidos
              </h3>

              <p className="mt-3 max-w-xl text-sm leading-7 text-gray-500">
                O gerenciamento de pedidos somente
                ficará disponível após a aprovação
                do estabelecimento.
              </p>

            </div>

            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-2xl bg-gray-200 px-6 py-4 text-sm font-black text-gray-500"
            >
              🔒 Acesso bloqueado
            </button>

          </div>

        </section>

        {/* ================================== */}
        {/* RODAPÉ                             */}
        {/* ================================== */}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">

          <p className="text-sm text-gray-500">
            Situação consultada diretamente no Firebase.
          </p>

          <Link
            to="/cardapio"
            className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold transition hover:border-green-600"
          >
            ← Voltar ao cardápio
          </Link>

        </div>

      </div>

    </main>
  );
}

export default ParceiroSolicitacao;