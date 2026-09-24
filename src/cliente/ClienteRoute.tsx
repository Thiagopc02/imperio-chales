
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
  getDoc,
} from "firebase/firestore";

import { auth, db } from "../firebase/config";

// =====================================================
// TIPOS
// =====================================================

type EstadoAcesso =
  | "verificando"
  | "autorizado"
  | "nao_autenticado"
  | "sem_perfil"
  | "erro";

interface EstadoCliente {
  status: EstadoAcesso;
  uid: string | null;
}

// =====================================================
// VERIFICAR PERFIL DO CLIENTE
// =====================================================

async function verificarPerfilCliente(
  usuario: User
): Promise<boolean> {
  const referencia = doc(
    db,
    "clientes",
    usuario.uid
  );

  const documento = await getDoc(referencia);

  if (!documento.exists()) {
    return false;
  }

  const dados = documento.data();

  // Não basta existir uma conta no Firebase.
  // Ela precisa possuir um perfil válido
  // na coleção privada de clientes.

  return (
    dados.uid === usuario.uid &&
    dados.tipo === "cliente" &&
    typeof dados.nomeCompleto === "string" &&
    dados.nomeCompleto.trim().length >= 3 &&
    typeof dados.email === "string" &&
    dados.email === usuario.email
  );
}

// =====================================================
// COMPONENTE DE PROTEÇÃO
// =====================================================

export function ClienteRoute() {
  const location = useLocation();

  const [estado, setEstado] = useState<EstadoCliente>({
    status: "verificando",
    uid: null,
  });

  // ===================================================
  // ACOMPANHAR AUTENTICAÇÃO
  // ===================================================

  useEffect(() => {
    let ativo = true;

    let versaoVerificacao = 0;

    const cancelar = onAuthStateChanged(
      auth,

      async (usuario) => {
        // Identifica a verificação mais recente.
        // Evita que uma operação antiga autorize
        // um usuário após a troca de sessão.

        const minhaVersao = ++versaoVerificacao;

        if (!ativo) {
          return;
        }

        setEstado({
          status: "verificando",
          uid: null,
        });

        // -----------------------------------------
        // NÃO EXISTE USUÁRIO AUTENTICADO
        // -----------------------------------------

        if (!usuario) {
          setEstado({
            status: "nao_autenticado",
            uid: null,
          });

          return;
        }

        // -----------------------------------------
        // CONSULTAR PERFIL NO FIRESTORE
        // -----------------------------------------

        try {
          const perfilValido =
            await verificarPerfilCliente(usuario);

          if (
            !ativo ||
            minhaVersao !== versaoVerificacao
          ) {
            return;
          }

          // Confere novamente se a sessão
          // pertence ao mesmo usuário.

          if (auth.currentUser?.uid !== usuario.uid) {
            setEstado({
              status: "verificando",
              uid: null,
            });

            return;
          }

          if (!perfilValido) {
            setEstado({
              status: "sem_perfil",
              uid: usuario.uid,
            });

            return;
          }

          // -------------------------------------
          // ACESSO AUTORIZADO
          // -------------------------------------

          setEstado({
            status: "autorizado",
            uid: usuario.uid,
          });

        } catch (erro) {
          console.error(
            "Erro ao verificar perfil do cliente:",
            erro
          );

          if (
            !ativo ||
            minhaVersao !== versaoVerificacao
          ) {
            return;
          }

          setEstado({
            status: "erro",
            uid: usuario.uid,
          });
        }
      },

      (erro) => {
        console.error(
          "Erro ao acompanhar autenticação:",
          erro
        );

        if (!ativo) {
          return;
        }

        setEstado({
          status: "erro",
          uid: null,
        });
      }
    );

    return () => {
      ativo = false;

      versaoVerificacao++;

      cancelar();
    };
  }, []);

  // ===================================================
  // CARREGAMENTO
  // ===================================================

  if (estado.status === "verificando") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f6ef] px-4 text-[#19352b]">

        <div className="w-full max-w-sm rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-lg">

          <div className="text-4xl">
            ⏳
          </div>

          <h1 className="mt-4 text-xl font-black">
            Verificando sua conta
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-600">
            Estamos verificando sua sessão
            e suas permissões de acesso.
          </p>

        </div>

      </main>
    );
  }

  // ===================================================
  // USUÁRIO NÃO AUTENTICADO
  // ===================================================

  if (estado.status === "nao_autenticado") {
    return (
      <Navigate
        to="/cliente/login"
        replace
        state={{
          from:
            location.pathname === "/cliente/perfil"
              ? "/cliente/perfil"
              : "/cardapio",
        }}
      />
    );
  }

  // ===================================================
  // USUÁRIO SEM PERFIL DE CLIENTE
  // ===================================================

  if (estado.status === "sem_perfil") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f6ef] px-4 py-10 text-[#19352b]">

        <section className="w-full max-w-md rounded-3xl border border-amber-200 bg-white p-6 text-center shadow-lg sm:p-8">

          <div className="text-4xl">
            ⚠️
          </div>

          <h1 className="mt-4 text-2xl font-black">
            Perfil de cliente não encontrado
          </h1>

          <p className="mt-4 text-sm leading-7 text-gray-600">
            Existe uma sessão autenticada neste
            navegador, mas ela não possui um
            perfil de cliente concluído.
          </p>

          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            Se você acabou de criar sua conta,
            não faça outro cadastro com o mesmo
            e-mail. Pode ser necessário concluir
            o salvamento do perfil.
          </p>

          <p className="mt-4 text-xs leading-6 text-gray-500">
            Se esta for uma sessão administrativa
            ou de restaurante, utilize uma janela
            separada para acessar a área do cliente.
          </p>

          <a
            href="/cliente/login"
            className="mt-6 block rounded-xl bg-[#19352b] px-5 py-4 text-sm font-black text-white"
          >
            Ir para login
          </a>

          <a
            href="/cardapio"
            className="mt-3 block rounded-xl border border-gray-200 px-5 py-4 text-sm font-bold"
          >
            Voltar ao cardápio
          </a>

        </section>

      </main>
    );
  }

  // ===================================================
  // ERRO DE VERIFICAÇÃO
  // ===================================================

  if (estado.status === "erro") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f6ef] px-4 py-10 text-[#19352b]">

        <section className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-6 text-center shadow-lg sm:p-8">

          <div className="text-4xl">
            ⚠️
          </div>

          <h1 className="mt-4 text-2xl font-black">
            Não foi possível verificar sua conta
          </h1>

          <p className="mt-4 text-sm leading-7 text-gray-600">
            Verifique sua conexão e tente novamente.
            O acesso ao perfil continuará bloqueado
            enquanto a verificação não for concluída.
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 w-full rounded-xl bg-[#19352b] px-5 py-4 text-sm font-black text-white"
          >
            Tentar novamente
          </button>

        </section>

      </main>
    );
  }

  // ===================================================
  // AUTORIZADO
  // ===================================================

  return <Outlet />;
}

export default ClienteRoute;