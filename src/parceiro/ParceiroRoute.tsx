import { useEffect, useState } from "react";

import {
  Navigate,
  Outlet,
  useLocation,
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

type SituacaoParceiro =
  | "carregando"
  | "sem_login"
  | "sem_cadastro"
  | "pendente"
  | "aprovado"
  | "rejeitado"
  | "erro";

// ==========================================
// PROTEÇÃO DAS ROTAS DO PARCEIRO
// ==========================================

export function ParceiroRoute() {
  const location = useLocation();

  const [situacao, setSituacao] =
    useState<SituacaoParceiro>("carregando");

  const [usuario, setUsuario] =
    useState<User | null>(null);

  // ========================================
  // AUTENTICAÇÃO + CONSULTA DO RESTAURANTE
  // ========================================

  useEffect(() => {
    let cancelarRestaurante: (() => void) | null =
      null;

    const cancelarAutenticacao =
      onAuthStateChanged(
        auth,

        (usuarioAtual) => {
          // Cancela a consulta da sessão anterior.
          if (cancelarRestaurante) {
            cancelarRestaurante();
            cancelarRestaurante = null;
          }

          setUsuario(usuarioAtual);
          setSituacao("carregando");

          // Sem conta conectada.
          if (!usuarioAtual) {
            setSituacao("sem_login");
            return;
          }

          // Administrador não entra como restaurante.
          if (isAdmin(usuarioAtual.uid)) {
            setSituacao("sem_cadastro");
            return;
          }

          // Cada empresa possui documento com ID
          // igual ao UID do responsável.
          const referencia = doc(
            db,
            "restaurantes",
            usuarioAtual.uid
          );

          cancelarRestaurante = onSnapshot(
            referencia,

            (resultado) => {
              if (!resultado.exists()) {
                setSituacao("sem_cadastro");
                return;
              }

              const dados = resultado.data();

              if (dados.uid !== usuarioAtual.uid) {
                setSituacao("erro");
                return;
              }

              if (dados.status === "aprovado") {
                setSituacao("aprovado");
                return;
              }

              if (dados.status === "rejeitado") {
                setSituacao("rejeitado");
                return;
              }

              if (dados.status === "pendente") {
                setSituacao("pendente");
                return;
              }

              setSituacao("erro");
            },

            (erroFirebase) => {
              console.error(
                "Erro ao verificar parceiro:",
                erroFirebase
              );

              setSituacao("erro");
            }
          );
        },

        (erroFirebase) => {
          console.error(
            "Erro de autenticação:",
            erroFirebase
          );

          setUsuario(null);
          setSituacao("erro");
        }
      );

    return () => {
      cancelarAutenticacao();

      if (cancelarRestaurante) {
        cancelarRestaurante();
      }
    };
  }, []);

  // ========================================
  // VERIFICANDO ACESSO
  // ========================================

  if (situacao === "carregando") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f6ef] px-4">

        <div className="rounded-3xl bg-white p-10 text-center shadow-lg">

          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-100 border-t-green-700" />

          <h1 className="mt-6 text-xl font-black text-[#19352b]">
            Verificando seu acesso...
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Consultando a situação do estabelecimento.
          </p>

        </div>

      </main>
    );
  }

  // ========================================
  // ADMINISTRADOR
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
  // USUÁRIO NÃO AUTENTICADO
  // ========================================

  if (situacao === "sem_login") {
    return (
      <Navigate
        to="/parceiro/cadastro"
        state={{
          mensagem:
            "Para acessar seu estabelecimento, entre com sua conta. O login do parceiro será disponibilizado na próxima etapa.",
          origem: location.pathname,
        }}
        replace
      />
    );
  }

  // ========================================
  // SEM DOCUMENTO CADASTRADO
  // ========================================

  if (situacao === "sem_cadastro") {
    return (
      <Navigate
        to="/parceiro/cadastro"
        replace
      />
    );
  }

  // ========================================
  // AGUARDANDO APROVAÇÃO OU REJEITADO
  // ========================================

  if (
    situacao === "pendente" ||
    situacao === "rejeitado"
  ) {
    return (
      <Navigate
        to="/parceiro/solicitacao"
        replace
      />
    );
  }

  // ========================================
  // ERRO: NÃO LIBERAR ACESSO
  // ========================================

  if (situacao === "erro") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f6ef] px-4">

        <div
          role="alert"
          className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-lg"
        >

          <span className="text-5xl">
            ⚠️
          </span>

          <h1 className="mt-5 text-2xl font-black text-red-800">
            Não foi possível verificar seu acesso
          </h1>

          <p className="mt-4 text-sm leading-7 text-gray-600">
            Não conseguimos confirmar a situação
            do estabelecimento no Firebase.
            Por segurança, a área operacional
            permanecerá bloqueada.
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
  // ACESSO APROVADO
  // ========================================

  if (situacao === "aprovado") {
    return <Outlet />;
  }

  // Estado desconhecido: acesso negado.
  return (
    <Navigate
      to="/parceiro/cadastro"
      replace
    />
  );
}

export default ParceiroRoute;