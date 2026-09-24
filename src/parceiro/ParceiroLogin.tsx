import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../firebase/config";
import { isAdmin } from "../firebase/admin";

// =====================================================
// TIPOS
// =====================================================

type EstadoPagina =
  | "verificando"
  | "login"
  | "entrando"
  | "recuperando";

type StatusParceiro =
  | "pendente"
  | "aprovado"
  | "rejeitado";

// =====================================================
// MENSAGENS DO FIREBASE
// =====================================================

function mensagemErroFirebase(erro: unknown): string {
  const codigo =
    typeof erro === "object" &&
    erro !== null &&
    "code" in erro
      ? String(erro.code)
      : "";

  switch (codigo) {
    case "auth/invalid-email":
      return "Informe um endereço de e-mail válido.";

    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "E-mail ou senha incorretos. Confira os dados e tente novamente.";

    case "auth/too-many-requests":
      return "Muitas tentativas de acesso. Aguarde um pouco antes de tentar novamente.";

    case "auth/user-disabled":
      return "Esta conta foi desativada. Entre em contato com a administração.";

    case "auth/network-request-failed":
      return "Não foi possível conectar ao Firebase. Confira sua internet.";

    case "permission-denied":
    case "firestore/permission-denied":
      return "Não foi possível consultar sua empresa. Verifique as permissões do cadastro.";

    default:
      return "Não foi possível concluir a operação. Tente novamente.";
  }
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function ParceiroLogin() {
  const navigate = useNavigate();

  // ===================================================
  // CAMPOS
  // ===================================================

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarRecuperacao, setMostrarRecuperacao] =
    useState(false);

  // ===================================================
  // ESTADOS DA INTERFACE
  // ===================================================

  const [estado, setEstado] =
    useState<EstadoPagina>("verificando");

  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  // ===================================================
  // VERIFICAR SE JÁ EXISTE UMA SESSÃO
  // ===================================================

  useEffect(() => {
    let ativo = true;

    const cancelarInscricao = onAuthStateChanged(
      auth,
      async (usuario) => {
        if (!usuario) {
          if (ativo) {
            setEstado("login");
          }

          return;
        }

        if (isAdmin(usuario.uid)) {
          navigate("/admin/dashboard", {
            replace: true,
          });

          return;
        }

        try {
          const referencia = doc(
            db,
            "restaurantes",
            usuario.uid
          );

          const documento = await getDoc(referencia);

          if (!ativo) return;

          if (!documento.exists()) {
            setErro(
              "Sua conta existe, mas não encontramos o cadastro do estabelecimento. Entre em contato com a administração."
            );

            setEstado("login");
            return;
          }

          const dados = documento.data();

          if (dados.uid !== usuario.uid) {
            setErro(
              "Não foi possível confirmar o vínculo desta conta com o estabelecimento."
            );

            setEstado("login");
            return;
          }

          const status = dados.status as StatusParceiro;

          if (
            status === "pendente" ||
            status === "rejeitado"
          ) {
            navigate("/parceiro/solicitacao", {
              replace: true,
            });

            return;
          }

          if (status === "aprovado") {
            navigate("/parceiro/dashboard", {
              replace: true,
            });

            return;
          }

          setErro(
            "A situação do estabelecimento não foi reconhecida. Entre em contato com a administração."
          );

          setEstado("login");
        } catch (erroFirebase) {
          if (!ativo) return;

          console.error(
            "Erro ao verificar cadastro:",
            erroFirebase
          );

          setErro(
            mensagemErroFirebase(erroFirebase)
          );

          setEstado("login");
        }
      },
      (erroFirebase) => {
        if (!ativo) return;

        console.error(
          "Erro ao verificar autenticação:",
          erroFirebase
        );

        setErro(
          mensagemErroFirebase(erroFirebase)
        );

        setEstado("login");
      }
    );

    return () => {
      ativo = false;
      cancelarInscricao();
    };
  }, [navigate]);

  // ===================================================
  // ENTRAR
  // ===================================================

  async function entrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      estado === "entrando" ||
      estado === "verificando"
    ) {
      return;
    }

    setErro("");
    setMensagem("");

    const emailTratado = email.trim().toLowerCase();

    if (!emailTratado || !senha) {
      setErro("Informe seu e-mail e sua senha.");
      return;
    }

    setEstado("entrando");

    try {
      const credencial =
        await signInWithEmailAndPassword(
          auth,
          emailTratado,
          senha
        );

      const usuario = credencial.user;

      // Administrador utiliza um portal separado.

      if (isAdmin(usuario.uid)) {
        navigate("/admin/dashboard", {
          replace: true,
        });

        return;
      }

      // Verificar se existe uma empresa
      // vinculada ao UID da conta.

      const referencia = doc(
        db,
        "restaurantes",
        usuario.uid
      );

      const documento = await getDoc(referencia);

      if (!documento.exists()) {
        setErro(
          "Sua conta foi encontrada, mas não existe um estabelecimento vinculado a ela. Entre em contato com a administração."
        );

        await signOut(auth);

        setEstado("login");
        return;
      }

      const dados = documento.data();

      if (dados.uid !== usuario.uid) {
        setErro(
          "O cadastro da empresa não corresponde à conta utilizada."
        );

        await signOut(auth);

        setEstado("login");
        return;
      }

      const status = dados.status as StatusParceiro;

      // =====================================
      // PENDENTE OU REJEITADO
      // =====================================

      if (
        status === "pendente" ||
        status === "rejeitado"
      ) {
        navigate("/parceiro/solicitacao", {
          replace: true,
        });

        return;
      }

      // =====================================
      // APROVADO
      // =====================================

      if (status === "aprovado") {
        navigate("/parceiro/dashboard", {
          replace: true,
        });

        return;
      }

      setErro(
        "A situação do cadastro não foi reconhecida. Entre em contato com a administração."
      );

      await signOut(auth);
      setEstado("login");
    } catch (erroFirebase) {
      console.error(
        "Erro no login do parceiro:",
        erroFirebase
      );

      setErro(
        mensagemErroFirebase(erroFirebase)
      );

      setEstado("login");
    }
  }

  // ===================================================
  // RECUPERAR SENHA
  // ===================================================

  async function recuperarSenha(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErro("");
    setMensagem("");

    const emailTratado = email.trim().toLowerCase();

    if (!emailTratado) {
      setErro(
        "Digite seu e-mail cadastrado para recuperar a senha."
      );

      return;
    }

    setEstado("recuperando");

    try {
      await sendPasswordResetEmail(
        auth,
        emailTratado
      );

      setMensagem(
        "Se existir uma conta vinculada a este e-mail, você receberá as instruções de recuperação. Confira também a pasta de spam."
      );

      setMostrarRecuperacao(false);
      setEstado("login");
    } catch (erroFirebase) {
      console.error(
        "Erro ao solicitar recuperação:",
        erroFirebase
      );

      setErro(
        mensagemErroFirebase(erroFirebase)
      );

      setEstado("login");
    }
  }

  // ===================================================
  // ESTILOS
  // ===================================================

  const classeInput =
    "mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-4 text-sm text-[#19352b] outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100";

  const carregando =
    estado === "entrando" ||
    estado === "recuperando" ||
    estado === "verificando";

  // ===================================================
  // VERIFICANDO SESSÃO
  // ===================================================

  if (estado === "verificando") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f6ef] px-4">
        <div className="rounded-3xl bg-white p-10 text-center shadow-lg">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-100 border-t-green-700" />

          <h1 className="mt-6 text-xl font-black text-[#19352b]">
            Verificando sua conta...
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Consultando a situação do estabelecimento.
          </p>
        </div>
      </main>
    );
  }

  // ===================================================
  // INTERFACE
  // ===================================================

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

          <Link
            to="/cardapio"
            className="rounded-xl border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
          >
            ← Voltar ao cardápio
          </Link>

        </div>
      </header>

      {/* ==================================== */}
      {/* CONTEÚDO                             */}
      {/* ==================================== */}

      <div className="mx-auto max-w-5xl px-4 py-10 md:py-14">

        {/* ================================== */}
        {/* HERO                               */}
        {/* ================================== */}

        <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#10251d] via-[#143627] to-[#0e2019] p-6 text-white shadow-xl md:p-10">

          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />

          <div className="relative">

            <span className="inline-flex rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-xs font-black tracking-wider text-amber-300">
              🔐 ACESSO DO PARCEIRO
            </span>

            <h2 className="mt-6 text-3xl font-black uppercase leading-tight md:text-5xl">
              ENTRE NA SUA

              <span className="block text-amber-400">
                CONTA AQUI!
              </span>
            </h2>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-gray-200 md:text-base">
              Acompanhe sua solicitação de parceria,
              acesse seu estabelecimento e organize
              seus pedidos em um único lugar.
            </p>

          </div>

        </section>

        {/* ================================== */}
        {/* FORMULÁRIO                         */}
        {/* ================================== */}

        <section className="mx-auto mt-8 max-w-2xl overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-lg">

          <div className="bg-[#19352b] px-6 py-6 text-white md:px-8">

            <h3 className="text-2xl font-black">
              {mostrarRecuperacao
                ? "🔑 Recuperar senha"
                : "🏪 Login do estabelecimento"}
            </h3>

            <p className="mt-2 text-sm text-gray-200">
              {mostrarRecuperacao
                ? "Informe seu e-mail para receber as instruções de recuperação."
                : "Utilize o e-mail e a senha cadastrados para sua empresa."}
            </p>

          </div>

          <div className="p-6 md:p-8">

            {/* ERRO */}

            {erro && (
              <div
                role="alert"
                className="mb-6 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-800"
              >
                ⚠️ {erro}
              </div>
            )}

            {/* SUCESSO */}

            {mensagem && (
              <div
                role="status"
                className="mb-6 rounded-2xl border border-green-300 bg-green-50 p-4 text-sm font-semibold leading-6 text-green-800"
              >
                ✅ {mensagem}
              </div>
            )}

            <form
              onSubmit={
                mostrarRecuperacao
                  ? recuperarSenha
                  : entrar
              }
              className="space-y-6"
            >

              {/* E-MAIL */}

              <div>

                <label
                  htmlFor="parceiro-email"
                  className="block text-sm font-black"
                >
                  E-mail de acesso *
                </label>

                <input
                  id="parceiro-email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={carregando}
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setErro("");
                  }}
                  placeholder="contato@restaurante.com.br"
                  className={classeInput}
                />

              </div>

              {/* SENHA */}

              {!mostrarRecuperacao && (
                <div>

                  <label
                    htmlFor="parceiro-senha"
                    className="block text-sm font-black"
                  >
                    Senha *
                  </label>

                  <div className="relative">

                    <input
                      id="parceiro-senha"
                      type={
                        mostrarSenha
                          ? "text"
                          : "password"
                      }
                      autoComplete="current-password"
                      required
                      disabled={carregando}
                      value={senha}
                      onChange={(event) => {
                        setSenha(event.target.value);
                        setErro("");
                      }}
                      placeholder="Digite sua senha"
                      className={`${classeInput} pr-24`}
                    />

                    <button
                      type="button"
                      disabled={carregando}
                      onClick={() =>
                        setMostrarSenha(
                          (atual) => !atual
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-[35%] rounded-lg px-2 py-1 text-xs font-black text-green-800 transition hover:bg-green-50"
                    >
                      {mostrarSenha
                        ? "Ocultar"
                        : "Mostrar"}
                    </button>

                  </div>

                  <div className="mt-4 text-right">

                    <button
                      type="button"
                      disabled={carregando}
                      onClick={() => {
                        setMostrarRecuperacao(true);
                        setErro("");
                        setMensagem("");
                        setSenha("");
                      }}
                      className="text-sm font-bold text-green-800 underline underline-offset-4 transition hover:text-green-600"
                    >
                      Esqueceu sua senha?
                    </button>

                  </div>

                </div>
              )}

              {/* BOTÃO PRINCIPAL */}

              <button
                type="submit"
                disabled={carregando}
                className="w-full rounded-2xl border-b-[5px] border-amber-700 bg-gradient-to-b from-yellow-200 via-amber-400 to-yellow-500 px-6 py-5 text-base font-black uppercase text-black shadow-[0_8px_25px_rgba(251,191,36,0.25)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {estado === "entrando"
                  ? "⏳ Verificando seu acesso..."
                  : estado === "recuperando"
                  ? "⏳ Enviando instruções..."
                  : mostrarRecuperacao
                  ? "📧 Recuperar minha senha"
                  : "🔐 Entrar no meu estabelecimento →"}
              </button>

              {/* VOLTAR AO LOGIN */}

              {mostrarRecuperacao && (

                <button
                  type="button"
                  disabled={carregando}
                  onClick={() => {
                    setMostrarRecuperacao(false);
                    setErro("");
                    setMensagem("");
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold transition hover:bg-gray-50"
                >
                  ← Voltar ao login
                </button>

              )}

            </form>

          </div>

        </section>

        {/* ================================== */}
        {/* ORIENTAÇÕES                        */}
        {/* ================================== */}

        <section className="mx-auto mt-8 grid max-w-2xl gap-4 sm:grid-cols-2">

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">

            <span className="text-3xl">
              ⏳
            </span>

            <h4 className="mt-3 font-black text-amber-900">
              Aguardando aprovação?
            </h4>

            <p className="mt-2 text-sm leading-6 text-amber-800">
              Entre normalmente com sua conta.
              Você será direcionado para acompanhar
              a análise do cadastro.
            </p>

          </div>

          <div className="rounded-2xl border border-green-200 bg-green-50 p-5">

            <span className="text-3xl">
              ✅
            </span>

            <h4 className="mt-3 font-black text-green-900">
              Empresa aprovada?
            </h4>

            <p className="mt-2 text-sm leading-6 text-green-800">
              Após a aprovação, o acesso ao painel
              demonstrativo será liberado.
              Pedidos reais ainda dependem
              de integração e regras de segurança.
            </p>

          </div>

        </section>

        {/* ================================== */}
        {/* NOVO CADASTRO                      */}
        {/* ================================== */}

        <section className="mx-auto mt-8 max-w-2xl rounded-3xl border border-gray-100 bg-white p-6 text-center shadow-sm md:p-8">

          <h3 className="text-xl font-black">
            Ainda não possui cadastro?
          </h3>

          <p className="mt-3 text-sm leading-6 text-gray-500">
            Cadastre seu estabelecimento e envie
            uma solicitação de parceria
            com o Império Chalés.
          </p>

          <Link
            to="/parceiro/cadastro"
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#19352b] px-6 py-4 text-sm font-black text-white transition hover:bg-green-800 sm:w-auto"
          >
            🏪 Cadastrar meu estabelecimento →
          </Link>

        </section>

      </div>

    </main>
  );
}

export default ParceiroLogin;