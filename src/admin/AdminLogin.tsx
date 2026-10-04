import {
  useState,
  type FormEvent,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  auth,
} from "../firebase/config";

/* =========================================================
   CONTAS AUTORIZADAS
========================================================= */

const ADMIN_EMAILS = [
  "proprietario123@gmail.com",
  "imperioilimitada3015@gmail.com",
];

/* =========================================================
   COMPONENTE
========================================================= */

export function AdminLogin() {
  const navigate =
    useNavigate();

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

  const [
    mostrarSenha,
    setMostrarSenha,
  ] = useState(false);

  /* =======================================================
     ESTADOS
  ======================================================= */

  const [
    carregando,
    setCarregando,
  ] = useState(false);

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    sucesso,
    setSucesso,
  ] = useState("");

  /* =======================================================
     VERIFICAR ADMINISTRADOR
  ======================================================= */

  function emailEhAdministrador(
    emailUsuario: string | null
  ): boolean {
    if (!emailUsuario) {
      return false;
    }

    const emailNormalizado =
      emailUsuario
        .trim()
        .toLowerCase();

    return ADMIN_EMAILS.includes(
      emailNormalizado
    );
  }

  /* =======================================================
     MENSAGENS FIREBASE
  ======================================================= */

  function mensagemErro(
    codigo: string
  ): string {
    switch (codigo) {
      case "auth/invalid-email":
        return "O e-mail informado é inválido.";

      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "E-mail ou senha incorretos.";

      case "auth/user-disabled":
        return "Esta conta está desativada.";

      case "auth/too-many-requests":
        return "Muitas tentativas. Aguarde alguns minutos.";

      case "auth/network-request-failed":
        return "Falha de conexão. Verifique sua internet.";

      case "auth/operation-not-allowed":
        return "O acesso por e-mail e senha não está disponível.";

      default:
        return "Não foi possível realizar o login.";
    }
  }

  /* =======================================================
     LOGIN
  ======================================================= */

  async function entrar(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (carregando) {
      return;
    }

    setErro("");
    setSucesso("");

    const emailLimpo =
      email
        .trim()
        .toLowerCase();

    if (
      !emailLimpo ||
      !senha
    ) {
      setErro(
        "Informe o e-mail e a senha."
      );

      return;
    }

    setCarregando(true);

    try {
      /* ===============================================
         AUTENTICAÇÃO FIREBASE
      =============================================== */

      const resultado =
        await signInWithEmailAndPassword(
          auth,
          emailLimpo,
          senha
        );

      const usuario =
        resultado.user;

      /* ===============================================
         AUTORIZAÇÃO ADMINISTRATIVA
      =============================================== */

      if (
        !emailEhAdministrador(
          usuario.email
        )
      ) {
        await signOut(auth);

        setErro(
          "Esta conta não possui autorização administrativa."
        );

        return;
      }

      /* ===============================================
         SUCESSO
      =============================================== */

      setSucesso(
        "Acesso autorizado."
      );

      setSenha("");

      navigate(
        "/admin/dashboard",
        {
          replace: true,
        }
      );
    } catch (
      error: unknown
    ) {
      console.error(
        "Falha no login administrativo.",
        error
      );

      const codigo =
        typeof error ===
          "object" &&
        error !== null &&
        "code" in error &&
        typeof error.code ===
          "string"
          ? error.code
          : "";

      setErro(
        mensagemErro(codigo)
      );
    } finally {
      setCarregando(false);
    }
  }

  /* =======================================================
     INTERFACE
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
      "
      style={{
        fontFamily:
          "'Arial Black', 'Montserrat', Arial, sans-serif",
      }}
    >
      {/* ===================================================
          ILUMINAÇÃO DE FUNDO
      =================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none

          absolute
          left-1/2
          top-1/2

          h-[430px]
          w-[430px]

          -translate-x-1/2
          -translate-y-1/2

          rounded-full

          bg-[#d4af37]/[0.07]

          blur-[130px]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none

          absolute
          -bottom-32
          -right-32

          h-[350px]
          w-[350px]

          rounded-full

          bg-[#d4af37]/[0.035]

          blur-[120px]
        "
      />

      {/* ===================================================
          CONTAINER
      =================================================== */}

      <div
        className="
          relative
          z-10

          w-full
          max-w-[430px]
        "
      >
        {/* =================================================
            CARD
        ================================================= */}

        <section
          className="
            relative

            overflow-hidden

            rounded-[28px]

            border
            border-white/15

            bg-gradient-to-br
            from-[#171717]
            via-[#0b0b0b]
            to-black

            px-6
            py-8

            shadow-[0_30px_90px_rgba(0,0,0,0.80)]

            sm:px-8
            sm:py-10
          "
        >
          {/* LUZ DOURADA */}

          <div
            aria-hidden="true"
            className="
              pointer-events-none

              absolute
              left-1/2
              top-0

              h-40
              w-64

              -translate-x-1/2
              -translate-y-1/2

              rounded-full

              bg-[#ffd429]/10

              blur-[70px]
            "
          />

          {/* =================================================
              COROA
          ================================================= */}

          <Link
            to="/"
            className="
              relative
              z-10

              mx-auto

              flex
              w-fit

              items-center
              justify-center
            "
          >
            <img
              src="/coroa.png"
              alt="Império Chalés"
              draggable={false}
              className="
                h-[72px]
                w-[72px]

                object-contain

                drop-shadow-[0_0_16px_rgba(255,212,41,0.25)]

                sm:h-[82px]
                sm:w-[82px]
              "
            />
          </Link>

          {/* =================================================
              ÍCONE ADMIN
          ================================================= */}

          <div
            className="
              relative
              z-10

              mx-auto
              mt-4

              flex
              h-[88px]
              w-[88px]

              items-center
              justify-center

              rounded-[22px]

              border
              border-[#ffd429]/20

              bg-gradient-to-br
              from-[#282310]
              via-[#16130b]
              to-black

              shadow-[0_0_30px_rgba(255,212,41,0.10)]
            "
          >
            <span
              className="
                text-[42px]

                drop-shadow-[0_0_12px_rgba(255,212,41,0.45)]
              "
            >
              🔐
            </span>
          </div>

          {/* =================================================
              TÍTULO
          ================================================= */}

          <div
            className="
              relative
              z-10

              mt-5

              text-center
            "
          >
            <p
              className="
                text-[8px]
                font-black

                uppercase

                tracking-[0.22em]

                text-[#ffd429]/70
              "
            >
              ACESSO RESTRITO
            </p>

            <h1
              className="
                mt-2

                text-[31px]
                font-black

                uppercase

                leading-none

                tracking-[-0.035em]

                text-[#ffd429]

                sm:text-[36px]
              "
              style={{
                textShadow:
                  "0 0 10px rgba(255,212,41,0.35), 0 3px 0 #000",
              }}
            >
              LOGIN ADMIN
            </h1>
          </div>

          {/* =================================================
              ERRO
          ================================================= */}

          {erro && (
            <div
              role="alert"
              className="
                relative
                z-10

                mt-6

                rounded-xl

                border
                border-red-500/30

                bg-red-500/10

                px-4
                py-3
              "
            >
              <p
                className="
                  text-center

                  text-[10px]
                  font-black

                  uppercase

                  leading-5

                  text-red-400
                "
              >
                ⚠️ {erro}
              </p>
            </div>
          )}

          {/* =================================================
              SUCESSO
          ================================================= */}

          {sucesso && (
            <div
              role="status"
              className="
                relative
                z-10

                mt-6

                rounded-xl

                border
                border-emerald-500/30

                bg-emerald-500/10

                px-4
                py-3
              "
            >
              <p
                className="
                  text-center

                  text-[10px]
                  font-black

                  uppercase

                  text-emerald-400
                "
              >
                ✓ {sucesso}
              </p>
            </div>
          )}

          {/* =================================================
              FORMULÁRIO
          ================================================= */}

          <form
            onSubmit={
              entrar
            }
            className="
              relative
              z-10

              mt-7
            "
          >
            {/* ===============================================
                EMAIL
            =============================================== */}

            <div>
              <label
                htmlFor="email"
                className="
                  block

                  text-[12px]
                  font-black

                  uppercase

                  tracking-[0.10em]

                  text-white
                "
              >
                EMAIL
              </label>

              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(
                  event
                ) => {
                  setEmail(
                    event.target
                      .value
                  );

                  setErro("");
                  setSucesso("");
                }}
                placeholder="Digite seu e-mail"
                autoComplete="username"
                disabled={
                  carregando
                }
                className="
                  mt-3

                  w-full

                  rounded-[14px]

                  border
                  border-white/15

                  bg-[#e9f0ff]

                  px-5
                  py-[15px]

                  text-[12px]
                  font-black

                  text-black

                  outline-none

                  transition-all

                  placeholder:text-black/35

                  focus:border-[#ffd429]

                  focus:ring-2
                  focus:ring-[#ffd429]/15

                  disabled:opacity-60
                "
              />
            </div>

            {/* ===============================================
                SENHA
            =============================================== */}

            <div
              className="
                mt-6
              "
            >
              <label
                htmlFor="senha"
                className="
                  block

                  text-[12px]
                  font-black

                  uppercase

                  tracking-[0.10em]

                  text-white
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
                  id="senha"
                  type={
                    mostrarSenha
                      ? "text"
                      : "password"
                  }
                  required
                  value={senha}
                  onChange={(
                    event
                  ) => {
                    setSenha(
                      event.target
                        .value
                    );

                    setErro("");
                    setSucesso("");
                  }}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  disabled={
                    carregando
                  }
                  className="
                    w-full

                    rounded-[14px]

                    border
                    border-white/15

                    bg-[#e9f0ff]

                    px-5
                    py-[15px]

                    pr-24

                    text-[12px]
                    font-black

                    text-black

                    outline-none

                    transition-all

                    placeholder:text-black/35

                    focus:border-[#ffd429]

                    focus:ring-2
                    focus:ring-[#ffd429]/15

                    disabled:opacity-60
                  "
                />

                <button
                  type="button"
                  onClick={() =>
                    setMostrarSenha(
                      (
                        estadoAtual
                      ) =>
                        !estadoAtual
                    )
                  }
                  disabled={
                    carregando
                  }
                  aria-label={
                    mostrarSenha
                      ? "Ocultar senha"
                      : "Mostrar senha"
                  }
                  className="
                    absolute
                    right-3
                    top-1/2

                    -translate-y-1/2

                    rounded-lg

                    px-2
                    py-2

                    text-[8px]
                    font-black

                    uppercase

                    text-black/50

                    transition

                    hover:text-black
                  "
                >
                  {mostrarSenha
                    ? "OCULTAR"
                    : "MOSTRAR"}
                </button>
              </div>
            </div>

            {/* ===============================================
                ENTRAR
            =============================================== */}

            <button
              type="submit"
              disabled={
                carregando
              }
              className="
                group

                mt-8

                flex
                w-full

                items-center
                justify-center

                gap-3

                rounded-[14px]

                border
                border-[#ffd429]

                bg-gradient-to-r
                from-[#ffc400]
                via-[#ffd429]
                to-[#ffb800]

                px-5
                py-[17px]

                text-[11px]
                font-black

                uppercase

                tracking-[0.06em]

                text-black

                shadow-[0_0_30px_rgba(255,212,41,0.22)]

                transition-all
                duration-300

                hover:-translate-y-1

                hover:shadow-[0_0_40px_rgba(255,212,41,0.38)]

                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {carregando ? (
                <>
                  <span
                    aria-hidden="true"
                    className="
                      h-4
                      w-4

                      animate-spin

                      rounded-full

                      border-2
                      border-black/20
                      border-t-black
                    "
                  />

                  VERIFICANDO...
                </>
              ) : (
                <>
                  <span
                    aria-hidden="true"
                    className="
                      text-base
                    "
                  >
                    🔐
                  </span>

                  ENTRAR NO PAINEL

                  <span
                    className="
                      transition-transform

                      group-hover:translate-x-1
                    "
                  >
                    →
                  </span>
                </>
              )}
            </button>
          </form>

          {/* =================================================
              LINHA
          ================================================= */}

          <div
            className="
              relative
              z-10

              my-7

              h-px
              w-full

              bg-white/10
            "
          />

          {/* =================================================
              SEGURANÇA
          ================================================= */}

          <div
            className="
              relative
              z-10

              flex

              items-center
              justify-center

              gap-2
            "
          >
            <span
              className="
                text-xs
              "
            >
              🔒
            </span>

            <p
              className="
                text-[8px]
                font-black

                uppercase

                tracking-[0.14em]

                text-white/30
              "
            >
              ACESSO ADMINISTRATIVO
            </p>
          </div>
        </section>

        {/* =================================================
            VOLTAR
        ================================================= */}

        <Link
          to="/"
          className="
            mt-7

            flex
            items-center
            justify-center

            text-[10px]
            font-black

            uppercase

            tracking-[0.08em]

            text-white

            transition

            hover:text-[#ffd429]
          "
        >
          ← VOLTAR AO SITE
        </Link>

        {/* =================================================
            RODAPÉ
        ================================================= */}

        <p
          className="
            mt-8

            text-center

            text-[7px]
            font-black

            uppercase

            tracking-[0.18em]

            text-white/15
          "
        >
          IMPÉRIO CHALÉS • CENTRAL ADMINISTRATIVA
        </p>
      </div>
    </main>
  );
}

export default AdminLogin;