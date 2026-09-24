import { useEffect, useState } from "react";

import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";

import { auth } from "../firebase/config";
import { isAdmin } from "../firebase/admin";

// ==========================================
// PROTEÇÃO DAS ROTAS ADMINISTRATIVAS
// ==========================================

export function AdminRoute() {
  const location = useLocation();

  const [usuario, setUsuario] = useState<User | null>(null);
  const [carregando, setCarregando] = useState(true);

  // ==========================================
  // VERIFICAR AUTENTICAÇÃO
  // ==========================================

  useEffect(() => {
    const cancelarInscricao = onAuthStateChanged(
      auth,

      (usuarioAtual) => {
        setUsuario(usuarioAtual);
        setCarregando(false);
      },

      (erro) => {
        console.error(
          "Erro ao verificar autenticação:",
          erro.message
        );

        setUsuario(null);
        setCarregando(false);
      }
    );

    return () => cancelarInscricao();
  }, []);

  // ==========================================
  // CARREGANDO
  // ==========================================

  if (carregando) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#081510] px-4 text-center text-white">

        <img
          src="/logo-imperio.png"
          alt="Império Chalés"
          className="mb-8 h-24 w-24 rounded-full object-contain"
        />

        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-amber-400"
          role="status"
          aria-label="Verificando autenticação"
        />

        <h1 className="mt-6 text-xl font-bold">
          Verificando acesso...
        </h1>

        <p className="mt-2 text-sm text-gray-400">
          Aguarde enquanto confirmamos suas credenciais.
        </p>

      </main>
    );
  }

  // ==========================================
  // USUÁRIO NÃO AUTENTICADO
  // ==========================================

  if (!usuario) {
    return (
      <Navigate
        to="/admin/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // ==========================================
  // USUÁRIO SEM PERMISSÃO ADMINISTRATIVA
  // ==========================================

  if (!isAdmin(usuario.uid)) {
    return (
      <Navigate
        to="/admin/login"
        replace
      />
    );
  }

  // ==========================================
  // ACESSO AUTORIZADO
  // ==========================================

  return <Outlet />;
}

export default AdminRoute;