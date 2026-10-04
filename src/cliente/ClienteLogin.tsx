import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

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

import {
  auth,
  db,
} from "../firebase/config";

import coroaIcon from "../../public/coroa.png";
import perfilIcon from "../components/catalogo/perfil.png";

/* =========================================================
   TIPOS
========================================================= */

type PerfilCliente = {
  uid: string;
  nomeCompleto: string;
  email: string;
  tipo: "cliente";
};

/* =========================================================
   TRATAMENTO DE ERROS
========================================================= */

function codigoErro(
  erro: unknown
): string {
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

function mensagemErroLogin(
  erro: unknown
): string {
  switch (codigoErro(erro)) {
    case "auth/invalid-email":
      return "Informe um e-mail válido.";

    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "E-mail ou senha incorretos.";

    case "auth/user-disabled":
      return "Esta conta está desativada.";

    case "auth/too-many-requests":
      return "Muitas tentativas de acesso. Aguarde alguns minutos.";

    case "auth/network-request-failed":
      return "Falha de conexão. Verifique sua internet.";

    case "permission-denied":
    case "firestore/permission-denied":
      return "Não foi possível verificar seu perfil.";

    default:
      return "Não foi possível entrar na sua conta. Tente novamente.";
  }
}

/* =========================================================
   CONSULTAR PERFIL DO CLIENTE
========================================================= */

async function buscarPerfilCliente(
  usuario: User
): Promise<PerfilCliente | null> {
  const referencia = doc(
    db,
    "clientes",
    usuario.uid
  );

  const resultado =
    await getDoc(referencia);

  if (!resultado.exists()) {
    return null;
  }

  const dados =
    resultado.data();

  if (
    dados.uid !== usuario.uid ||
    dados.tipo !== "cliente" ||
    typeof dados.nomeCompleto !==
      "string" ||
    typeof dados.email !==
      "string"
  ) {
    return null;
  }

  return {
    uid: usuario.uid,

    nomeCompleto:
      dados.nomeCompleto,

    email: dados.email,

    tipo: "cliente",
  };
}

/* =========================================================
   DESTINO APÓS LOGIN
========================================================= */

function destinoPermitido(
  valor: unknown
): string {
  if (
    typeof valor !== "string"
  ) {
    return "/cliente/perfil";
  }

  const permitido =
    valor === "/cardapio" ||
    valor ===
      "/cliente/perfil" ||
    valor.startsWith(
      "/cardapio?"
    );

  return permitido
    ? valor
    : "/cliente/perfil";
}

/* =========================================================
   COMPONENTE
========================================================= */

export function ClienteLogin() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  /* =======================================================
     CAMPOS
  ======================================================= */

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    senha,
    setSenha,
  ] = useState("");

  /* =======================================================
     INTERFACE
  ======================================================= */

  const [
    mostrarSenha,
    setMostrarSenha,
  ] = useState(false);

  const [
    carregando,
    setCarregando,
  ] = useState(false);

  const [
    verificandoSessao,
    setVerificandoSessao,
  ] = useState(true);

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    aviso,
    setAviso,
  ] = useState("");

  const [
    recuperacaoAberta,
    setRecuperacaoAberta,
  ] = useState(false);

  /* =======================================================
     DESTINO
  ======================================================= */

  const estadoNavegacao =
    location.state as
      | {
          from?: string;
        }
      | null;

  const destino =
    destinoPermitido(
      estadoNavegacao?.from
    );

  /* =======================================================
     VERIFICAR SESSÃO
  ======================================================= */

  useEffect(() => {
    let ativo = true;

    const cancelar =
      onAuthStateChanged(
        auth,

        async (
          usuario
        ) => {
          if (!ativo) {
            return;
          }

          if (!usuario) {
            setVerificandoSessao(
              false
            );

            return;
          }

          try {
            const perfil =
              await buscarPerfilCliente(
                usuario
              );

            if (!ativo) {
              return;
            }

            if (perfil) {
              navigate(
                destino,
                {
                  replace:
                    true,
                }
              );

              return;
            }

            setAviso(
              "Já existe outra sessão ativa neste navegador."
            );
          } catch (
            erroSessao
          ) {
            if (!ativo) {
              return;
            }

            console.error(
              "Erro ao verificar sessão:",
              erroSessao
            );

            setErro(
              "Não foi possível verificar sua sessão."
            );
          } finally {
            if (ativo) {
              setVerificandoSessao(
                false
              );
            }
          }
        }
      );

    return () => {
      ativo = false;

      cancelar();
    };
  }, [
    navigate,
    destino,
  ]);

  /* =======================================================
     LOGIN
  ======================================================= */

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
      email
        .trim()
        .toLowerCase();

    if (
      !emailLimpo ||
      !senha
    ) {
      setErro(
        "Informe seu e-mail e sua senha."
      );

      return;
    }

    setCarregando(true);

    try {
      const credencial =
        await signInWithEmailAndPassword(
          auth,
          emailLimpo,
          senha
        );

      const perfil =
        await buscarPerfilCliente(
          credencial.user
        );

      if (!perfil) {
        setErro(
          "Esta conta não possui perfil de cliente."
        );

        return;
      }

      navigate(
        destino,
        {
          replace: true,
        }
      );
    } catch (
      erroLogin
    ) {
      console.error(
        "Erro no login do cliente:",
        erroLogin
      );

      setErro(
        mensagemErroLogin(
          erroLogin
        )
      );
    } finally {
      setCarregando(false);
    }
  }

  /* =======================================================
     RECUPERAR SENHA
  ======================================================= */

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
      email
        .trim()
        .toLowerCase();

    if (!emailLimpo) {
      setErro(
        "Informe seu e-mail."
      );

      return;
    }

    setCarregando(true);

    try {
      await sendPasswordResetEmail(
        auth,
        emailLimpo
      );

      setAviso(
        "Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação."
      );

      setRecuperacaoAberta(
        false
      );
    } catch (
      erroRecuperacao
    ) {
      console.error(
        "Erro ao solicitar recuperação:",
        erroRecuperacao
      );

      setAviso(
        "Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação."
      );

      setRecuperacaoAberta(
        false
      );
    } finally {
      setCarregando(false);
    }
  }

  /* =======================================================
     CARREGAMENTO
  ======================================================= */

  if (
    verificandoSessao
  ) {
    return (
      <main
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-black
          px-4
          text-white
        "
      >
        <div
          className="
            flex
            flex-col
            items-center
            rounded-[28px]
            border
            border-white/10
            bg-gradient-to-br
            from-[#202020]
            via-[#101010]
            to-black
            px-8
            py-10
            text-center
            shadow-[0_25px_70px_rgba(0,0,0,0.60)]
          "
        >
          <div
            className="
              h-10
              w-10
              animate-spin
              rounded-full
              border-4
              border-white/10
              border-t-[#18ff72]
            "
          />

          <p
            className="
              mt-5
              text-sm
              font-black
              uppercase
              tracking-[0.12em]
              text-white
            "
          >
            Verificando conta
          </p>
        </div>
      </main>
    );
  }

  /* =======================================================
     INTERFACE PRINCIPAL
  ======================================================= */

  return (
    <main
      className="
        relative
        flex
        min-h-screen
        items-center
        justify-center
        overflow-hidden
        bg-black
        px-4
        py-10
        text-white

        sm:px-6
        sm:py-14
      "
    >
      {/* LUZES */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-1/2
          top-1/2
          h-[500px]
          w-[500px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-[#18ff72]/[0.06]
          blur-[160px]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -bottom-40
          -right-40
          h-[420px]
          w-[420px]
          rounded-full
          bg-white/[0.035]
          blur-[140px]
        "
      />

      <div
        className="
          relative
          z-10
          w-full
          max-w-[500px]
        "
      >
        {/* CARD */}

        <section
          className="
            relative
            overflow-hidden
            rounded-[32px]
            border
            border-white/10
            bg-gradient-to-br
            from-[#242424]
            via-[#111111]
            to-[#020202]
            px-5
            py-7
            shadow-[0_30px_90px_rgba(0,0,0,0.75)]

            sm:px-8
            sm:py-9
          "
        >
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              left-1/2
              top-0
              h-60
              w-60
              -translate-x-1/2
              -translate-y-1/2
              rounded-full
              bg-[#18ff72]/10
              blur-[90px]
            "
          />

          <div
            className="
              relative
              z-10
            "
          >
            {/* COROA */}

            <Link
              to="/cardapio"
              className="
                mx-auto
                flex
                w-fit
                items-center
                justify-center
              "
            >
              <img
                src={coroaIcon}
                alt="Império Chalés"
                draggable={false}
                className="
                  h-[72px]
                  w-[120px]
                  object-contain
                  drop-shadow-[0_0_18px_rgba(255,255,255,0.16)]

                  sm:h-[82px]
                  sm:w-[140px]
                "
              />
            </Link>

            {/* PERFIL */}

            <div
              className="
                mx-auto
                mt-3
                flex
                h-[96px]
                w-[96px]
                items-center
                justify-center
                rounded-[26px]
                border
                border-white/10
                bg-gradient-to-br
                from-[#333333]
                via-[#171717]
                to-black
                shadow-[0_18px_40px_rgba(0,0,0,0.50)]

                sm:h-[110px]
                sm:w-[110px]
              "
            >
              <img
                src={perfilIcon}
                alt="Login cliente"
                draggable={false}
                className="
                  h-[78px]
                  w-[78px]
                  object-contain
                  drop-shadow-[0_10px_24px_rgba(123,54,255,0.40)]

                  sm:h-[90px]
                  sm:w-[90px]
                "
              />
            </div>

            {/* TÍTULO */}

            <h1
              className="
                mt-5
                text-center
                text-[34px]
                font-black
                uppercase
                leading-none
                tracking-[-0.04em]
                text-[#18ff72]

                sm:text-[42px]
                md:text-[48px]
              "
              style={{
                fontFamily:
                  "'Arial Black', 'Montserrat', sans-serif",

                textShadow:
                  "0 0 12px rgba(24,255,114,0.35), 0 3px 0 rgba(0,0,0,1)",
              }}
            >
              {recuperacaoAberta
                ? "RECUPERAR SENHA"
                : "LOGIN CLIENTE"}
            </h1>

            {/* ERRO */}

            {erro && (
              <div
                role="alert"
                className="
                  mt-6
                  rounded-2xl
                  border
                  border-red-400/30
                  bg-red-500/[0.08]
                  px-4
                  py-3
                  text-center
                  text-xs
                  font-bold
                  leading-5
                  text-red-300
                "
              >
                ⚠️{" "}
                {erro}
              </div>
            )}

            {/* AVISO */}

            {aviso && (
              <div
                role="status"
                className="
                  mt-6
                  rounded-2xl
                  border
                  border-[#18ff72]/20
                  bg-[#18ff72]/[0.06]
                  px-4
                  py-3
                  text-center
                  text-xs
                  font-bold
                  leading-5
                  text-[#8dffb9]
                "
              >
                {aviso}
              </div>
            )}

            {/* RECUPERAÇÃO */}

            {recuperacaoAberta ? (
              <form
                onSubmit={
                  recuperarSenha
                }
                className="
                  mt-8
                "
              >
                <label
                  htmlFor="recuperarEmail"
                  className="
                    block
                    text-[14px]
                    font-black
                    uppercase
                    tracking-[0.10em]
                    text-white

                    sm:text-[15px]
                  "
                >
                  EMAIL
                </label>

                <input
                  id="recuperarEmail"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={150}
                  value={email}
                  onChange={(
                    evento
                  ) =>
                    setEmail(
                      evento.target
                        .value
                    )
                  }
                  placeholder="SEUEMAIL@EXEMPLO.COM"
                  disabled={
                    carregando
                  }
                  className="
                    mt-3
                    w-full
                    rounded-2xl
                    border
                    border-white/10
                    bg-[#0b0b0b]
                    px-5
                    py-4
                    text-sm
                    font-bold
                    text-white
                    outline-none
                    transition-all
                    placeholder:text-white/20
                    focus:border-[#18ff72]
                    focus:shadow-[0_0_20px_rgba(24,255,114,0.12)]
                    disabled:opacity-50
                  "
                />

                <button
                  type="submit"
                  disabled={
                    carregando
                  }
                  className="
                    mt-6
                    w-full
                    rounded-2xl
                    border
                    border-[#18ff72]
                    bg-[#18e96d]
                    px-6
                    py-4
                    text-sm
                    font-black
                    uppercase
                    tracking-[0.06em]
                    text-black
                    shadow-[0_0_28px_rgba(24,255,114,0.20)]
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:bg-[#25ff7d]
                    hover:shadow-[0_0_38px_rgba(24,255,114,0.32)]
                    disabled:opacity-50
                  "
                >
                  {carregando
                    ? "ENVIANDO..."
                    : "ENVIAR RECUPERAÇÃO →"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRecuperacaoAberta(
                      false
                    );

                    setErro("");
                    setAviso("");
                  }}
                  disabled={
                    carregando
                  }
                  className="
                    mt-4
                    w-full
                    rounded-2xl
                    border
                    border-white/10
                    bg-white/[0.04]
                    px-5
                    py-4
                    text-[13px]
                    font-black
                    uppercase
                    tracking-[0.07em]
                    text-white
                    transition-all
                    hover:border-white/30
                    hover:bg-white/[0.08]
                  "
                >
                  ← VOLTAR AO LOGIN
                </button>
              </form>
            ) : (
              <form
                onSubmit={
                  entrar
                }
                className="
                  mt-8
                "
              >
                {/* EMAIL */}

                <div>
                  <label
                    htmlFor="clienteEmailLogin"
                    className="
                      block
                      text-[15px]
                      font-black
                      uppercase
                      tracking-[0.12em]
                      text-white

                      sm:text-[16px]
                    "
                  >
                    EMAIL
                  </label>

                  <input
                    id="clienteEmailLogin"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={150}
                    value={email}
                    onChange={(
                      evento
                    ) =>
                      setEmail(
                        evento
                          .target
                          .value
                      )
                    }
                    placeholder="SEUEMAIL@EXEMPLO.COM"
                    disabled={
                      carregando
                    }
                    className="
                      mt-3
                      w-full
                      rounded-2xl
                      border
                      border-white/10
                      bg-[#0b0b0b]
                      px-5
                      py-4
                      text-sm
                      font-bold
                      text-white
                      outline-none
                      transition-all
                      placeholder:text-white/20
                      focus:border-[#18ff72]
                      focus:shadow-[0_0_20px_rgba(24,255,114,0.12)]
                      disabled:opacity-50
                    "
                  />
                </div>

                {/* SENHA */}

                <div
                  className="
                    mt-6
                  "
                >
                  <label
                    htmlFor="clienteSenhaLogin"
                    className="
                      block
                      text-[15px]
                      font-black
                      uppercase
                      tracking-[0.12em]
                      text-white

                      sm:text-[16px]
                    "
                  >
                    SENHA
                  </label>

                  <div
                    className="
                      relative
                      mt-3
                    "
                  >
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
                      onChange={(
                        evento
                      ) =>
                        setSenha(
                          evento
                            .target
                            .value
                        )
                      }
                      placeholder="DIGITE SUA SENHA"
                      disabled={
                        carregando
                      }
                      className="
                        w-full
                        rounded-2xl
                        border
                        border-white/10
                        bg-[#0b0b0b]
                        px-5
                        py-4
                        pr-24
                        text-sm
                        font-bold
                        text-white
                        outline-none
                        transition-all
                        placeholder:text-white/20
                        focus:border-[#18ff72]
                        focus:shadow-[0_0_20px_rgba(24,255,114,0.12)]
                        disabled:opacity-50
                      "
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setMostrarSenha(
                          (
                            anterior
                          ) =>
                            !anterior
                        )
                      }
                      disabled={
                        carregando
                      }
                      className="
                        absolute
                        right-3
                        top-1/2
                        -translate-y-1/2
                        rounded-xl
                        border
                        border-white/10
                        bg-white/[0.05]
                        px-3
                        py-2
                        text-[9px]
                        font-black
                        uppercase
                        text-white/65
                        transition-colors
                        hover:text-white
                      "
                    >
                      {mostrarSenha
                        ? "OCULTAR"
                        : "MOSTRAR"}
                    </button>
                  </div>
                </div>

                {/* ESQUECI SENHA */}

                <div
                  className="
                    mt-5
                    text-right
                  "
                >
                  <button
                    type="button"
                    onClick={() => {
                      setRecuperacaoAberta(
                        true
                      );

                      setErro("");
                      setAviso("");
                    }}
                    className="
                      inline-flex
                      items-center
                      justify-end
                      gap-2
                      text-[12px]
                      font-black
                      uppercase
                      tracking-[0.06em]
                      text-red-500
                      transition-all
                      duration-300
                      hover:text-red-400
                      hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.50)]

                      sm:text-[13px]
                    "
                  >
                    <span
                      className="
                        text-[16px]
                      "
                    >
                      ⚠️
                    </span>

                    <span>
                      ESQUECI MINHA SENHA
                    </span>
                  </button>
                </div>

                {/* BOTÃO LOGIN */}

                <button
                  type="submit"
                  disabled={
                    carregando
                  }
                  className="
                    group
                    mt-7
                    flex
                    w-full
                    items-center
                    justify-center
                    gap-3
                    rounded-2xl
                    border
                    border-[#18ff72]
                    bg-[#18e96d]
                    px-6
                    py-4
                    text-[14px]
                    font-black
                    uppercase
                    tracking-[0.07em]
                    text-black
                    shadow-[0_0_28px_rgba(24,255,114,0.20)]
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:bg-[#25ff7d]
                    hover:shadow-[0_0_40px_rgba(24,255,114,0.34)]
                    disabled:opacity-50
                  "
                >
                  <img
                    src={
                      perfilIcon
                    }
                    alt=""
                    aria-hidden="true"
                    draggable={
                      false
                    }
                    className="
                      h-9
                      w-9
                      object-contain
                      drop-shadow-[0_6px_12px_rgba(0,0,0,0.30)]
                      transition-transform
                      group-hover:scale-110
                    "
                  />

                  <span>
                    {carregando
                      ? "ENTRANDO..."
                      : "ENTRAR"}
                  </span>

                  {!carregando && (
                    <span
                      className="
                        transition-transform
                        group-hover:translate-x-1
                      "
                    >
                      →
                    </span>
                  )}
                </button>

                {/* CRIAR CONTA */}

                <div
                  className="
                    mt-7
                    border-t
                    border-white/[0.09]
                    pt-6
                    text-center
                  "
                >
                  <Link
                    to="/cliente/cadastro"
                    className="
                      inline-flex
                      items-center
                      justify-center
                      gap-2
                      text-[13px]
                      font-black
                      uppercase
                      tracking-[0.07em]
                      text-white
                      transition-all
                      duration-300
                      hover:text-[#18ff72]
                      hover:drop-shadow-[0_0_8px_rgba(24,255,114,0.28)]

                      sm:text-[14px]
                    "
                  >
                    <span>
                      CRIAR MINHA CONTA
                    </span>

                    <span>
                      →
                    </span>
                  </Link>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* VOLTAR */}

        <Link
          to="/cardapio"
          className="
            mt-6
            flex
            items-center
            justify-center
            gap-2
            text-[13px]
            font-black
            uppercase
            tracking-[0.07em]
            text-white
            transition-all
            duration-300
            hover:text-[#18ff72]
            hover:drop-shadow-[0_0_8px_rgba(24,255,114,0.28)]

            sm:text-[14px]
          "
        >
          <span>
            ←
          </span>

          <span>
            VOLTAR AO CARDÁPIO
          </span>
        </Link>
      </div>
    </main>
  );
}

export default ClienteLogin;