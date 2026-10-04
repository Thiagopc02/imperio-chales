import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase/config";

import {
  isAdmin,
} from "../firebase/admin";

import coroaIcon from "../../public/coroa.png";
import parceiroIcon from "../components/catalogo/parceiro-icone.png";

/* =========================================================
   TIPOS
========================================================= */

type EstadoPagina =
  | "verificando"
  | "login"
  | "entrando"
  | "recuperando";

type StatusParceiro =
  | "pendente"
  | "aprovado"
  | "rejeitado";

/* =========================================================
   ERROS FIREBASE
========================================================= */

function mensagemErroFirebase(
  erro: unknown
): string {
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
      return "E-mail ou senha incorretos.";

    case "auth/too-many-requests":
      return "Muitas tentativas de acesso. Aguarde alguns minutos.";

    case "auth/user-disabled":
      return "Esta conta foi desativada.";

    case "auth/network-request-failed":
      return "Falha de conexão. Verifique sua internet.";

    case "permission-denied":
    case "firestore/permission-denied":
      return "Não foi possível consultar seu estabelecimento.";

    default:
      return "Não foi possível concluir a operação. Tente novamente.";
  }
}

/* =========================================================
   COMPONENTE
========================================================= */

export function ParceiroLogin() {
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

  const [
    mostrarRecuperacao,
    setMostrarRecuperacao,
  ] = useState(false);

  /* =======================================================
     ESTADOS
  ======================================================= */

  const [
    estado,
    setEstado,
  ] =
    useState<EstadoPagina>(
      "verificando"
    );

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    mensagem,
    setMensagem,
  ] = useState("");

  /* =======================================================
     VERIFICAR SESSÃO
  ======================================================= */

  useEffect(() => {
    let ativo = true;

    const cancelarInscricao =
      onAuthStateChanged(
        auth,

        async (
          usuario
        ) => {
          if (!usuario) {
            if (ativo) {
              setEstado(
                "login"
              );
            }

            return;
          }

          if (
            isAdmin(
              usuario.uid
            )
          ) {
            navigate(
              "/admin/dashboard",
              {
                replace: true,
              }
            );

            return;
          }

          try {
            const referencia =
              doc(
                db,
                "restaurantes",
                usuario.uid
              );

            const documento =
              await getDoc(
                referencia
              );

            if (!ativo) {
              return;
            }

            if (
              !documento.exists()
            ) {
              setErro(
                "Sua conta existe, mas não encontramos o cadastro do estabelecimento."
              );

              setEstado(
                "login"
              );

              return;
            }

            const dados =
              documento.data();

            if (
              dados.uid !==
              usuario.uid
            ) {
              setErro(
                "Não foi possível confirmar o vínculo desta conta com o estabelecimento."
              );

              setEstado(
                "login"
              );

              return;
            }

            const status =
              dados.status as StatusParceiro;

            if (
              status ===
                "pendente" ||
              status ===
                "rejeitado"
            ) {
              navigate(
                "/parceiro/solicitacao",
                {
                  replace:
                    true,
                }
              );

              return;
            }

            if (
              status ===
              "aprovado"
            ) {
              navigate(
                "/parceiro/dashboard",
                {
                  replace:
                    true,
                }
              );

              return;
            }

            setErro(
              "A situação do estabelecimento não foi reconhecida."
            );

            setEstado(
              "login"
            );
          } catch (
            erroFirebase
          ) {
            if (!ativo) {
              return;
            }

            console.error(
              "Erro ao verificar cadastro:",
              erroFirebase
            );

            setErro(
              mensagemErroFirebase(
                erroFirebase
              )
            );

            setEstado(
              "login"
            );
          }
        },

        (
          erroFirebase
        ) => {
          if (!ativo) {
            return;
          }

          console.error(
            "Erro ao verificar autenticação:",
            erroFirebase
          );

          setErro(
            mensagemErroFirebase(
              erroFirebase
            )
          );

          setEstado(
            "login"
          );
        }
      );

    return () => {
      ativo = false;

      cancelarInscricao();
    };
  }, [navigate]);

  /* =======================================================
     LOGIN
  ======================================================= */

  async function entrar(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      estado ===
        "entrando" ||
      estado ===
        "verificando"
    ) {
      return;
    }

    setErro("");
    setMensagem("");

    const emailTratado =
      email
        .trim()
        .toLowerCase();

    if (
      !emailTratado ||
      !senha
    ) {
      setErro(
        "Informe seu e-mail e sua senha."
      );

      return;
    }

    setEstado(
      "entrando"
    );

    try {
      const credencial =
        await signInWithEmailAndPassword(
          auth,
          emailTratado,
          senha
        );

      const usuario =
        credencial.user;

      /* ADMIN */

      if (
        isAdmin(
          usuario.uid
        )
      ) {
        navigate(
          "/admin/dashboard",
          {
            replace: true,
          }
        );

        return;
      }

      /* RESTAURANTE */

      const referencia =
        doc(
          db,
          "restaurantes",
          usuario.uid
        );

      const documento =
        await getDoc(
          referencia
        );

      if (
        !documento.exists()
      ) {
        setErro(
          "Sua conta foi encontrada, mas não existe um estabelecimento vinculado a ela."
        );

        await signOut(
          auth
        );

        setEstado(
          "login"
        );

        return;
      }

      const dados =
        documento.data();

      if (
        dados.uid !==
        usuario.uid
      ) {
        setErro(
          "O cadastro do estabelecimento não corresponde à conta utilizada."
        );

        await signOut(
          auth
        );

        setEstado(
          "login"
        );

        return;
      }

      const status =
        dados.status as StatusParceiro;

      /* PENDENTE OU REJEITADO */

      if (
        status ===
          "pendente" ||
        status ===
          "rejeitado"
      ) {
        navigate(
          "/parceiro/solicitacao",
          {
            replace: true,
          }
        );

        return;
      }

      /* APROVADO */

      if (
        status ===
        "aprovado"
      ) {
        navigate(
          "/parceiro/dashboard",
          {
            replace: true,
          }
        );

        return;
      }

      setErro(
        "A situação do cadastro não foi reconhecida."
      );

      await signOut(
        auth
      );

      setEstado(
        "login"
      );
    } catch (
      erroFirebase
    ) {
      console.error(
        "Erro no login do parceiro:",
        erroFirebase
      );

      setErro(
        mensagemErroFirebase(
          erroFirebase
        )
      );

      setEstado(
        "login"
      );
    }
  }

  /* =======================================================
     RECUPERAÇÃO DE SENHA
  ======================================================= */

  async function recuperarSenha(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErro("");
    setMensagem("");

    const emailTratado =
      email
        .trim()
        .toLowerCase();

    if (
      !emailTratado
    ) {
      setErro(
        "Digite seu e-mail cadastrado."
      );

      return;
    }

    setEstado(
      "recuperando"
    );

    try {
      await sendPasswordResetEmail(
        auth,
        emailTratado
      );

      setMensagem(
        "Se este e-mail estiver cadastrado, enviaremos as instruções de recuperação."
      );

      setMostrarRecuperacao(
        false
      );

      setEstado(
        "login"
      );
    } catch (
      erroFirebase
    ) {
      console.error(
        "Erro ao solicitar recuperação:",
        erroFirebase
      );

      setErro(
        mensagemErroFirebase(
          erroFirebase
        )
      );

      setEstado(
        "login"
      );
    }
  }

  /* =======================================================
     CARREGANDO
  ======================================================= */

  const carregando =
    estado ===
      "entrando" ||
    estado ===
      "recuperando" ||
    estado ===
      "verificando";

  /* =======================================================
     VERIFICANDO CONTA
  ======================================================= */

  if (
    estado ===
    "verificando"
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
              border-t-[#ff2222]
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

        sm:px-6
        sm:py-14
      "
    >
      {/* =================================================
          LUZ VERMELHA CENTRAL
      ================================================= */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-1/2
          top-1/2
          h-[520px]
          w-[520px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-red-600/[0.07]
          blur-[165px]
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
          bg-red-600/[0.035]
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
        {/* =================================================
            CARD
        ================================================= */}

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
          {/* BRILHO SUPERIOR */}

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
              bg-red-500/10
              blur-[90px]
            "
          />

          <div
            className="
              relative
              z-10
            "
          >
            {/* =================================================
                COROA
            ================================================= */}

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
                src={
                  coroaIcon
                }
                alt="Império Chalés"
                draggable={
                  false
                }
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

            {/* =================================================
                ÍCONE PARCEIRO
            ================================================= */}

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
                src={
                  parceiroIcon
                }
                alt="Login parceiro"
                draggable={
                  false
                }
                className="
                  h-[78px]
                  w-[78px]
                  object-contain
                  drop-shadow-[0_10px_24px_rgba(255,0,0,0.40)]

                  sm:h-[90px]
                  sm:w-[90px]
                "
              />
            </div>

            {/* =================================================
                TÍTULO
            ================================================= */}

            <h1
              className="
                mt-5
                text-center
                text-[34px]
                font-black
                uppercase
                leading-none
                tracking-[-0.04em]
                text-[#ff2525]

                sm:text-[42px]
                md:text-[48px]
              "
              style={{
                fontFamily:
                  "'Arial Black', 'Montserrat', sans-serif",

                textShadow:
                  "0 0 14px rgba(255,35,35,0.45), 0 3px 0 rgba(0,0,0,1)",
              }}
            >
              {mostrarRecuperacao
                ? "RECUPERAR SENHA"
                : "LOGIN PARCEIRO"}
            </h1>

            {/* =================================================
                ERRO
            ================================================= */}

            {erro && (
              <div
                role="alert"
                className="
                  mt-6
                  rounded-2xl
                  border
                  border-red-500/35
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

            {/* =================================================
                SUCESSO
            ================================================= */}

            {mensagem && (
              <div
                role="status"
                className="
                  mt-6
                  rounded-2xl
                  border
                  border-red-400/20
                  bg-red-500/[0.06]
                  px-4
                  py-3
                  text-center
                  text-xs
                  font-bold
                  leading-5
                  text-red-200
                "
              >
                ✓{" "}
                {mensagem}
              </div>
            )}

            {/* =================================================
                FORMULÁRIO
            ================================================= */}

            <form
              onSubmit={
                mostrarRecuperacao
                  ? recuperarSenha
                  : entrar
              }
              className="
                mt-8
              "
            >
              {/* EMAIL */}

              <div>
                <label
                  htmlFor="parceiro-email"
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
                  id="parceiro-email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={
                    carregando
                  }
                  value={email}
                  onChange={(
                    event
                  ) => {
                    setEmail(
                      event.target
                        .value
                    );

                    setErro("");
                  }}
                  placeholder="SEUEMAIL@EXEMPLO.COM"
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

                    focus:border-red-500
                    focus:shadow-[0_0_20px_rgba(255,40,40,0.14)]

                    disabled:opacity-50
                  "
                />
              </div>

              {/* =================================================
                  SENHA
              ================================================= */}

              {!mostrarRecuperacao && (
                <div
                  className="
                    mt-6
                  "
                >
                  <label
                    htmlFor="parceiro-senha"
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
                      id="parceiro-senha"
                      type={
                        mostrarSenha
                          ? "text"
                          : "password"
                      }
                      autoComplete="current-password"
                      required
                      disabled={
                        carregando
                      }
                      value={senha}
                      onChange={(
                        event
                      ) => {
                        setSenha(
                          event
                            .target
                            .value
                        );

                        setErro("");
                      }}
                      placeholder="DIGITE SUA SENHA"
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

                        focus:border-red-500
                        focus:shadow-[0_0_20px_rgba(255,40,40,0.14)]

                        disabled:opacity-50
                      "
                    />

                    <button
                      type="button"
                      disabled={
                        carregando
                      }
                      onClick={() =>
                        setMostrarSenha(
                          (
                            atual
                          ) =>
                            !atual
                        )
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
                        transition-all

                        hover:border-red-500/40
                        hover:text-white
                      "
                    >
                      {mostrarSenha
                        ? "OCULTAR"
                        : "MOSTRAR"}
                    </button>
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
                      disabled={
                        carregando
                      }
                      onClick={() => {
                        setMostrarRecuperacao(
                          true
                        );

                        setErro("");
                        setMensagem("");
                        setSenha("");
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
                        hover:drop-shadow-[0_0_8px_rgba(255,50,50,0.55)]

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
                </div>
              )}

              {/* =================================================
                  BOTÃO PRINCIPAL
              ================================================= */}

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
                  border-red-500
                  bg-[#f22626]
                  px-6
                  py-4
                  text-[14px]
                  font-black
                  uppercase
                  tracking-[0.07em]
                  text-white
                  shadow-[0_0_28px_rgba(255,35,35,0.24)]
                  transition-all
                  duration-300

                  hover:-translate-y-1
                  hover:bg-[#ff3333]
                  hover:shadow-[0_0_42px_rgba(255,35,35,0.40)]

                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
                style={{
                  textShadow:
                    "0 2px 0 rgba(0,0,0,0.9)",
                }}
              >
                {!mostrarRecuperacao && (
                  <img
                    src={
                      parceiroIcon
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
                      drop-shadow-[0_6px_12px_rgba(0,0,0,0.40)]
                      transition-transform
                      group-hover:scale-110
                    "
                  />
                )}

                <span>
                  {estado ===
                  "entrando"
                    ? "ENTRANDO..."
                    : estado ===
                      "recuperando"
                    ? "ENVIANDO..."
                    : mostrarRecuperacao
                    ? "ENVIAR RECUPERAÇÃO"
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

              {/* =================================================
                  VOLTAR AO LOGIN
              ================================================= */}

              {mostrarRecuperacao && (
                <button
                  type="button"
                  disabled={
                    carregando
                  }
                  onClick={() => {
                    setMostrarRecuperacao(
                      false
                    );

                    setErro("");
                    setMensagem("");
                  }}
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
              )}

              {/* =================================================
                  CRIAR ESTABELECIMENTO
              ================================================= */}

              {!mostrarRecuperacao && (
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
                    to="/parceiro/cadastro"
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

                      hover:text-red-400
                      hover:drop-shadow-[0_0_8px_rgba(255,50,50,0.35)]

                      sm:text-[14px]
                    "
                  >
                    <span>
                      CADASTRAR MEU ESTABELECIMENTO
                    </span>

                    <span>
                      →
                    </span>
                  </Link>
                </div>
              )}
            </form>
          </div>
        </section>

        {/* =================================================
            VOLTAR AO CARDÁPIO
        ================================================= */}

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

            hover:text-red-400
            hover:drop-shadow-[0_0_8px_rgba(255,50,50,0.30)]

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

export default ParceiroLogin;