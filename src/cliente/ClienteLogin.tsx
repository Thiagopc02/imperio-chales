
import { useEffect, useState, type FormEvent } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  type User,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import { auth, db } from "../firebase/config";

// ======================================================
// TIPOS
// ======================================================

type PerfilCliente = {
  uid: string;
  nomeCompleto: string;
  email: string;
  tipo: "cliente";
};

// ======================================================
// TRATAMENTO DE ERROS
// ======================================================

function codigoErro(erro: unknown): string {
  if (
    erro !== null &&
    typeof erro === "object" &&
    "code" in erro &&
    typeof erro.code === "string"
  ) {
    return erro.code;
  }

  return "";
}

function mensagemErroLogin(erro: unknown): string {
  switch (codigoErro(erro)) {
    case "auth/invalid-email":
      return "Informe um e-mail válido.";

    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "E-mail ou senha incorretos.";

    case "auth/user-disabled":
      return "Esta conta está desativada. Entre em contato com o atendimento.";

    case "auth/too-many-requests":
      return "Muitas tentativas de acesso. Aguarde alguns minutos.";

    case "auth/network-request-failed":
      return "Falha de conexão. Verifique sua internet.";

    case "permission-denied":
    case "firestore/permission-denied":
      return "Não foi possível verificar seu perfil. Confira as permissões do Firebase.";

    default:
      return "Não foi possível entrar na sua conta. Tente novamente.";
  }
}

// ======================================================
// CONSULTAR PERFIL PRIVADO DO CLIENTE
// ======================================================

async function buscarPerfilCliente(
  usuario: User
): Promise<PerfilCliente | null> {
  const referencia = doc(
    db,
    "clientes",
    usuario.uid
  );

  const resultado = await getDoc(referencia);

  if (!resultado.exists()) {
    return null;
  }

  const dados = resultado.data();

  // Confirma o vínculo entre o documento e
  // o usuário autenticado.

  if (
    dados.uid !== usuario.uid ||
    dados.tipo !== "cliente" ||
    typeof dados.nomeCompleto !== "string" ||
    typeof dados.email !== "string"
  ) {
    return null;
  }

  return {
    uid: usuario.uid,
    nomeCompleto: dados.nomeCompleto,
    email: dados.email,
    tipo: "cliente",
  };
}

// ======================================================
// DESTINO SEGURO APÓS LOGIN
// ======================================================

// Aceita somente caminhos internos conhecidos.
//
// Evita redirecionamentos externos ou para áreas
// administrativas após o login do cliente.

function destinoPermitido(
  valor: unknown
): string {
  if (typeof valor !== "string") {
    return "/cliente/perfil";
  }

  const permitido =
    valor === "/cardapio" ||
    valor === "/cliente/perfil" ||
    valor.startsWith("/cardapio?");

  return permitido
    ? valor
    : "/cliente/perfil";
}

// ======================================================
// COMPONENTE PRINCIPAL
// ======================================================

export function ClienteLogin() {
  const navigate = useNavigate();

  const location = useLocation();

  // ====================================================
  // CAMPOS
  // ====================================================

  const [email, setEmail] = useState("");

  const [senha, setSenha] = useState("");

  // ====================================================
  // INTERFACE
  // ====================================================

  const [mostrarSenha, setMostrarSenha] =
    useState(false);

  const [carregando, setCarregando] =
    useState(false);

  const [verificandoSessao, setVerificandoSessao] =
    useState(true);

  const [erro, setErro] = useState("");

  const [aviso, setAviso] = useState("");

  const [
    recuperacaoAberta,
    setRecuperacaoAberta,
  ] = useState(false);

  // ====================================================
  // DESTINO APÓS O LOGIN
  // ====================================================

  const estadoNavegacao = location.state as
    | {
        from?: string;
      }
    | null;

  const destino = destinoPermitido(
    estadoNavegacao?.from
  );

  // ====================================================
  // VERIFICAR SESSÃO ATUAL
  // ====================================================

  useEffect(() => {
    let ativo = true;

    const cancelar = onAuthStateChanged(
      auth,

      async (usuario) => {
        if (!ativo) {
          return;
        }

        if (!usuario) {
          setVerificandoSessao(false);
          return;
        }

        try {
          const perfil =
            await buscarPerfilCliente(usuario);

          if (!ativo) {
            return;
          }

          if (perfil) {
            navigate(destino, {
              replace: true,
            });

            return;
          }

          // Existe uma sessão Firebase, mas não
          // encontramos um perfil de cliente.
          //
          // Não desconectamos automaticamente,
          // pois pode ser uma sessão legítima
          // da administração ou do parceiro.

          setAviso(
            "Há uma sessão de outra área do sistema neste navegador. Para entrar como cliente, utilize uma janela separada ou saia da conta atual."
          );

        } catch (erroSessao) {
          if (!ativo) {
            return;
          }

          console.error(
            "Erro ao verificar sessão:",
            erroSessao
          );

          setErro(
            "Não foi possível verificar sua sessão. Tente novamente."
          );

        } finally {
          if (ativo) {
            setVerificandoSessao(false);
          }
        }
      }
    );

    return () => {
      ativo = false;
      cancelar();
    };
  }, [navigate, destino]);

  // ====================================================
  // REALIZAR LOGIN
  // ====================================================

  async function entrar(
    evento: FormEvent<HTMLFormElement>
  ): Promise<void> {
    evento.preventDefault();

    if (carregando) {
      return;
    }

    setErro("");
    setAviso("");

    const emailLimpo =
      email.trim().toLowerCase();

    if (!emailLimpo || !senha) {
      setErro(
        "Informe seu e-mail e sua senha."
      );

      return;
    }

    setCarregando(true);

    try {
      // ------------------------------------------------
      // 1. AUTENTICAR NO FIREBASE
      // ------------------------------------------------

      const credencial =
        await signInWithEmailAndPassword(
          auth,
          emailLimpo,
          senha
        );

      // ------------------------------------------------
      // 2. VERIFICAR PERFIL DO CLIENTE
      // ------------------------------------------------

      const perfil =
        await buscarPerfilCliente(
          credencial.user
        );

      if (!perfil) {
        // Pode ser:
        //
        // - conta administrativa;
        // - conta de restaurante;
        // - cadastro de cliente incompleto.
        //
        // Não apagamos nem modificamos a conta.

        setErro(
          "Esta conta não possui um perfil de cliente concluído. Se você acabou de se cadastrar, seu perfil pode estar pendente. Entre em contato com o atendimento."
        );

        return;
      }

      // ------------------------------------------------
      // 3. LOGIN CONCLUÍDO
      // ------------------------------------------------

      navigate(destino, {
        replace: true,
      });

    } catch (erroLogin) {
      console.error(
        "Erro no login do cliente:",
        erroLogin
      );

      setErro(
        mensagemErroLogin(erroLogin)
      );

    } finally {
      setCarregando(false);
    }
  }

  // ====================================================
  // RECUPERAÇÃO DE SENHA
  // ====================================================

  async function recuperarSenha(
    evento: FormEvent<HTMLFormElement>
  ): Promise<void> {
    evento.preventDefault();

    if (carregando) {
      return;
    }

    setErro("");
    setAviso("");

    const emailLimpo =
      email.trim().toLowerCase();

    if (!emailLimpo) {
      setErro(
        "Informe seu e-mail para recuperar a senha."
      );

      return;
    }

    setCarregando(true);

    try {
      await sendPasswordResetEmail(
        auth,
        emailLimpo
      );

      // Mensagem genérica para não informar
      // se o e-mail possui conta no sistema.

      setAviso(
        "Se este e-mail estiver cadastrado, você receberá instruções para redefinir sua senha. Confira também a caixa de spam."
      );

      setRecuperacaoAberta(false);

    } catch (erroRecuperacao) {
      console.error(
        "Erro ao solicitar recuperação:",
        erroRecuperacao
      );

      // Mantém mensagem genérica na recuperação,
      // sem revelar existência de contas.

      setAviso(
        "Se este e-mail estiver cadastrado, você receberá instruções para redefinir sua senha. Confira também a caixa de spam."
      );

      setRecuperacaoAberta(false);

    } finally {
      setCarregando(false);
    }
  }

  // ====================================================
  // CARREGANDO SESSÃO
  // ====================================================

  if (verificandoSessao) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f6ef] px-4">

        <div className="rounded-2xl bg-white p-8 text-center text-[#19352b] shadow-md">

          <p className="text-lg font-black">
            ⏳ Verificando sua conta...
          </p>

          <p className="mt-3 text-sm text-gray-500">
            Aguarde um instante.
          </p>

        </div>

      </main>
    );
  }

  // ====================================================
  // INTERFACE PRINCIPAL
  // ====================================================

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f6ef] px-4 py-10 text-[#19352b]">

      <div className="w-full max-w-md">

        {/* =========================================== */}
        {/* LOGOMARCA                                  */}
        {/* =========================================== */}

        <div className="mb-7 text-center">

          <Link to="/cardapio">
            <img
              src="/logo-imperio.png"
              alt="Império Chalés"
              className="mx-auto h-20 w-20 object-contain"
            />
          </Link>

          <p className="mt-4 text-xs font-black uppercase tracking-[0.25em] text-amber-700">
            SABORES DA CHAPADA
          </p>

          <h1 className="mt-3 text-3xl font-black">
            {recuperacaoAberta
              ? "Recuperar minha senha"
              : "Entrar na minha conta"}
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-600">
            {recuperacaoAberta
              ? "Informe seu e-mail para receber as instruções de recuperação."
              : "Acesse sua conta para continuar suas consultas e utilizar o cardápio."}
          </p>

        </div>

        {/* =========================================== */}
        {/* FORMULÁRIO                                 */}
        {/* =========================================== */}

        <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-xl sm:p-8">

          {/* ERROS */}

          {erro && (

            <div
              role="alert"
              className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-800"
            >
              ⚠️ {erro}
            </div>

          )}

          {/* AVISOS */}

          {aviso && (

            <div
              role="status"
              className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900"
            >
              ℹ️ {aviso}
            </div>

          )}

          {/* ========================================= */}
          {/* RECUPERAÇÃO DE SENHA                      */}
          {/* ========================================= */}

          {recuperacaoAberta ? (

            <form onSubmit={recuperarSenha}>

              <label
                htmlFor="recuperarEmail"
                className="block text-sm font-bold"
              >
                E-mail cadastrado *
              </label>

              <input
                id="recuperarEmail"
                type="email"
                autoComplete="email"
                required
                maxLength={150}
                value={email}
                onChange={(evento) =>
                  setEmail(evento.target.value)
                }
                placeholder="seuemail@exemplo.com"
                disabled={carregando}
                className="mt-2 w-full rounded-xl border border-gray-200 p-4 text-sm outline-none focus:border-amber-400 disabled:bg-gray-100"
              />

              <button
                type="submit"
                disabled={carregando}
                className="mt-6 w-full rounded-xl bg-[#19352b] px-6 py-4 text-sm font-black text-white transition hover:bg-[#28533e] disabled:opacity-50"
              >
                {carregando
                  ? "Enviando..."
                  : "Enviar recuperação →"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setRecuperacaoAberta(false);
                  setErro("");
                  setAviso("");
                }}
                disabled={carregando}
                className="mt-4 w-full rounded-xl border border-gray-200 px-5 py-3 text-sm font-bold"
              >
                ← Voltar ao login
              </button>

            </form>

          ) : (

            /* ======================================= */
            /* LOGIN                                  */
            /* ======================================= */

            <form onSubmit={entrar}>

              {/* E-MAIL */}

              <div>

                <label
                  htmlFor="clienteEmailLogin"
                  className="block text-sm font-bold"
                >
                  E-mail *
                </label>

                <input
                  id="clienteEmailLogin"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={150}
                  value={email}
                  onChange={(evento) =>
                    setEmail(evento.target.value)
                  }
                  placeholder="seuemail@exemplo.com"
                  disabled={carregando}
                  className="mt-2 w-full rounded-xl border border-gray-200 p-4 text-sm outline-none focus:border-amber-400 disabled:bg-gray-100"
                />

              </div>

              {/* SENHA */}

              <div className="mt-5">

                <label
                  htmlFor="clienteSenhaLogin"
                  className="block text-sm font-bold"
                >
                  Senha *
                </label>

                <div className="relative mt-2">

                  <input
                    id="clienteSenhaLogin"
                    type={
                      mostrarSenha
                        ? "text"
                        : "password"
                    }
                    autoComplete="current-password"
                    required
                    value={senha}
                    onChange={(evento) =>
                      setSenha(evento.target.value)
                    }
                    placeholder="Digite sua senha"
                    disabled={carregando}
                    className="w-full rounded-xl border border-gray-200 p-4 pr-20 text-sm outline-none focus:border-amber-400 disabled:bg-gray-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setMostrarSenha(
                        (anterior) => !anterior
                      )
                    }
                    disabled={carregando}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-black"
                  >
                    {mostrarSenha
                      ? "Ocultar"
                      : "Mostrar"}
                  </button>

                </div>

              </div>

              {/* RECUPERAR SENHA */}

              <div className="mt-3 text-right">

                <button
                  type="button"
                  onClick={() => {
                    setRecuperacaoAberta(true);
                    setErro("");
                    setAviso("");
                  }}
                  className="text-xs font-black text-amber-800 underline underline-offset-4"
                >
                  Esqueci minha senha
                </button>

              </div>

              {/* ENTRAR */}

              <button
                type="submit"
                disabled={carregando}
                className="mt-7 w-full rounded-xl bg-[#19352b] px-6 py-4 text-sm font-black text-white transition hover:bg-[#28533e] disabled:opacity-50"
              >
                {carregando
                  ? "Entrando..."
                  : "Entrar na minha conta →"}
              </button>

              {/* CADASTRO */}

              <div className="mt-7 border-t border-gray-100 pt-6 text-center">

                <p className="text-sm text-gray-600">
                  É sua primeira vez aqui?
                </p>

                <Link
                  to="/cliente/cadastro"
                  className="mt-3 inline-block text-sm font-black underline underline-offset-4"
                >
                  Criar minha conta
                </Link>

              </div>

            </form>

          )}

        </section>

        {/* VOLTAR AO CARDÁPIO */}

        <Link
          to="/cardapio"
          className="mt-7 block text-center text-sm font-bold text-gray-600 transition hover:text-[#19352b]"
        >
          ← Voltar ao cardápio
        </Link>

      </div>

    </main>
  );
}

export default ClienteLogin;