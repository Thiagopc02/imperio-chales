import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import type { FormEvent } from "react";
import { auth } from "../firebase/config";
import { isAdmin } from "../firebase/admin";

export function AdminLogin() {
  const navigate = useNavigate();

  // ==========================================
  // ESTADOS
  // ==========================================

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  // ==========================================
  // TRATAMENTO DE ERROS DO FIREBASE
  // ==========================================

  function mensagemErro(codigo: string): string {
    switch (codigo) {
      case "auth/invalid-email":
        return "O endereço de e-mail informado é inválido.";

      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "E-mail ou senha incorretos.";

      case "auth/user-disabled":
        return "Esta conta foi desativada. Entre em contato com o responsável.";

      case "auth/too-many-requests":
        return "Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.";

      case "auth/network-request-failed":
        return "Falha de conexão. Verifique sua internet e tente novamente.";

      case "auth/operation-not-allowed":
        return "O login por e-mail e senha não está habilitado no Firebase.";

      default:
        return "Não foi possível realizar o login. Tente novamente.";
    }
  }

  // ==========================================
  // LOGIN ADMINISTRATIVO
  // ==========================================

  async function entrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (carregando) return;

    setErro("");
    setSucesso("");
    setCarregando(true);

    try {
      const emailLimpo = email.trim();

      // Autenticação real no Firebase.
      const resultado = await signInWithEmailAndPassword(
        auth,
        emailLimpo,
        senha
      );

      const usuario = resultado.user;

      // Verifica se o UID pertence ao administrador.
      if (!isAdmin(usuario.uid)) {
        await signOut(auth);

        setErro(
          "Esta conta não possui autorização para acessar a Central Administrativa."
        );

        return;
      }

      // Login autorizado.
      setSucesso("Autenticação realizada com sucesso!");

      // Limpa a senha do formulário.
      setSenha("");

      // Redireciona para o Dashboard.
      navigate("/admin/dashboard", {
        replace: true,
      });

    } catch (error: unknown) {
      console.error("Falha no login administrativo.");

      const codigo =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof error.code === "string"
          ? error.code
          : "";

      setErro(mensagemErro(codigo));

    } finally {
      setCarregando(false);
    }
  }

  // ==========================================
  // INTERFACE
  // ==========================================

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#081510] px-4 py-12">

      <div className="w-full max-w-md">

        {/* ================================= */}
        {/* LOGO                              */}
        {/* ================================= */}

        <div className="mb-8 text-center">

          <img
            src="/logo-imperio.png"
            alt="Império Chalés"
            className="mx-auto h-24 w-24 rounded-full object-contain"
          />

          <h1 className="mt-5 text-3xl font-bold text-white">
            Central Administrativa
          </h1>

          <p className="mt-2 text-sm text-amber-300">
            IMPÉRIO CHALÉS — VILA DO SOSSEGO
          </p>

        </div>

        {/* ================================= */}
        {/* FORMULÁRIO                        */}
        {/* ================================= */}

        <form
          onSubmit={entrar}
          className="rounded-3xl border border-white/10 bg-white p-6 shadow-2xl sm:p-8"
        >

          <h2 className="text-2xl font-bold text-[#19352b]">
            Acesso administrativo
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Entre com suas credenciais para gerenciar
            os serviços do Império Chalés.
          </p>

          {/* ================================= */}
          {/* MENSAGEM DE ERRO                  */}
          {/* ================================= */}

          {erro && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4"
            >
              <p className="text-sm font-semibold text-red-700">
                ⚠️ {erro}
              </p>
            </div>
          )}

          {/* ================================= */}
          {/* MENSAGEM DE SUCESSO               */}
          {/* ================================= */}

          {sucesso && (
            <div
              role="status"
              className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4"
            >
              <p className="text-sm font-semibold text-green-700">
                ✓ {sucesso}
              </p>
            </div>
          )}

          {/* ================================= */}
          {/* EMAIL                             */}
          {/* ================================= */}

          <div className="mt-8">

            <label
              htmlFor="email"
              className="text-sm font-semibold text-[#19352b]"
            >
              E-mail
            </label>

            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setErro("");
              }}
              placeholder="Digite seu e-mail"
              autoComplete="username"
              disabled={carregando}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:opacity-60"
            />

          </div>

          {/* ================================= */}
          {/* SENHA                             */}
          {/* ================================= */}

          <div className="mt-5">

            <label
              htmlFor="senha"
              className="text-sm font-semibold text-[#19352b]"
            >
              Senha
            </label>

            <div className="relative mt-2">

              <input
                id="senha"
                type={mostrarSenha ? "text" : "password"}
                required
                value={senha}
                onChange={(event) => {
                  setSenha(event.target.value);
                  setErro("");
                }}
                placeholder="Digite sua senha"
                autoComplete="current-password"
                disabled={carregando}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-20 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:opacity-60"
              />

              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                disabled={carregando}
                aria-label={
                  mostrarSenha
                    ? "Ocultar senha"
                    : "Mostrar senha"
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 transition hover:text-[#19352b]"
              >
                {mostrarSenha ? "Ocultar" : "Mostrar"}
              </button>

            </div>

          </div>

          {/* ================================= */}
          {/* BOTÃO ENTRAR                      */}
          {/* ================================= */}

          <button
            type="submit"
            disabled={carregando}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl bg-[#19352b] px-5 py-4 font-bold text-white transition hover:bg-[#28533e] disabled:cursor-not-allowed disabled:opacity-70"
          >

            {carregando ? (
              <>
                <span
                  className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"
                  aria-hidden="true"
                />

                Verificando acesso...
              </>
            ) : (
              "Entrar no painel"
            )}

          </button>

          {/* ================================= */}
          {/* AVISO DE SEGURANÇA                */}
          {/* ================================= */}

          <div className="mt-6 flex items-center justify-center gap-2">

            <span aria-hidden="true">🔒</span>

            <p className="text-center text-xs text-gray-500">
              Acesso restrito ao administrador.
            </p>

          </div>

        </form>

        {/* ================================= */}
        {/* VOLTAR AO SITE                     */}
        {/* ================================= */}

        <div className="mt-7 text-center">

          <Link
            to="/"
            className="text-sm text-gray-300 transition hover:text-amber-300"
          >
            ← Voltar ao site dos chalés
          </Link>

        </div>

        {/* ================================= */}
        {/* RODAPÉ                             */}
        {/* ================================= */}

        <p className="mt-8 text-center text-xs text-gray-500">
          © Império Chalés — Vila do Sossego
        </p>

      </div>

    </main>
  );
}

export default AdminLogin;