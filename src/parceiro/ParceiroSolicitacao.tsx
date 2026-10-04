import {
  useEffect,
  useState,
} from "react";

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

import {
  auth,
  db,
} from "../firebase/config";

import {
  isAdmin,
} from "../firebase/admin";

/* =========================================================
   TIPOS
========================================================= */

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

/* =========================================================
   COMPONENTE
========================================================= */

export function ParceiroSolicitacao() {
  const navigate =
    useNavigate();

  const [
    estado,
    setEstado,
  ] =
    useState<EstadoSolicitacao>(
      "carregando"
    );

  const [
    usuario,
    setUsuario,
  ] =
    useState<User | null>(
      null
    );

  const [
    empresa,
    setEmpresa,
  ] =
    useState<Empresa | null>(
      null
    );

  /* =======================================================
     CONSULTAR SITUAÇÃO
  ======================================================= */

  useEffect(() => {
    let cancelarEmpresa:
      | (() => void)
      | null = null;

    const cancelarAutenticacao =
      onAuthStateChanged(
        auth,

        (
          usuarioAtual
        ) => {
          if (
            cancelarEmpresa
          ) {
            cancelarEmpresa();

            cancelarEmpresa =
              null;
          }

          setUsuario(
            usuarioAtual
          );

          setEmpresa(
            null
          );

          setEstado(
            "carregando"
          );

          /* SEM LOGIN */

          if (
            !usuarioAtual
          ) {
            setEstado(
              "sem_login"
            );

            return;
          }

          /* ADMIN */

          if (
            isAdmin(
              usuarioAtual.uid
            )
          ) {
            setEstado(
              "sem_cadastro"
            );

            return;
          }

          /* DOCUMENTO */

          const referencia =
            doc(
              db,

              "restaurantes",

              usuarioAtual.uid
            );

          cancelarEmpresa =
            onSnapshot(
              referencia,

              (
                resultado
              ) => {
                if (
                  !resultado.exists()
                ) {
                  setEstado(
                    "sem_cadastro"
                  );

                  return;
                }

                const dados =
                  resultado.data();

                if (
                  dados.uid !==
                  usuarioAtual.uid
                ) {
                  setEstado(
                    "erro"
                  );

                  return;
                }

                setEmpresa({
                  nomeEmpresa:
                    typeof dados.nomeEmpresa ===
                    "string"
                      ? dados.nomeEmpresa
                      : "Estabelecimento",

                  nomeResponsavel:
                    typeof dados.nomeResponsavel ===
                    "string"
                      ? dados.nomeResponsavel
                      : "",

                  email:
                    typeof dados.email ===
                    "string"
                      ? dados.email
                      : "",

                  status:
                    typeof dados.status ===
                    "string"
                      ? dados.status
                      : "",
                });

                if (
                  dados.status ===
                  "aprovado"
                ) {
                  setEstado(
                    "aprovado"
                  );

                  return;
                }

                if (
                  dados.status ===
                  "rejeitado"
                ) {
                  setEstado(
                    "rejeitado"
                  );

                  return;
                }

                if (
                  dados.status ===
                  "pendente"
                ) {
                  setEstado(
                    "pendente"
                  );

                  return;
                }

                setEstado(
                  "erro"
                );
              },

              (
                erroFirebase
              ) => {
                console.error(
                  "Erro ao consultar solicitação:",
                  erroFirebase
                );

                setEstado(
                  "erro"
                );
              }
            );
        },

        (
          erroFirebase
        ) => {
          console.error(
            "Erro ao verificar autenticação:",
            erroFirebase
          );

          setEstado(
            "erro"
          );
        }
      );

    return () => {
      cancelarAutenticacao();

      if (
        cancelarEmpresa
      ) {
        cancelarEmpresa();
      }
    };
  }, []);

  /* =======================================================
     REDIRECIONAR APÓS APROVAÇÃO
  ======================================================= */

  useEffect(() => {
    if (
      estado ===
      "aprovado"
    ) {
      navigate(
        "/parceiro/dashboard",
        {
          replace:
            true,
        }
      );
    }
  }, [
    estado,
    navigate,
  ]);

  /* =======================================================
     CARREGAMENTO
  ======================================================= */

  if (
    estado ===
      "carregando" ||
    estado ===
      "aprovado"
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
            text-center
          "
        >
          <img
            src="/coroa.png"
            alt="Império"
            draggable={false}
            className="
              mx-auto

              h-16
              w-16

              object-contain

              opacity-80
            "
          />

          <div
            className="
              mx-auto
              mt-7

              h-10
              w-10

              animate-spin

              rounded-full

              border-[3px]
              border-white/10
              border-t-red-500
            "
          />

          <p
            className="
              mt-6

              text-[10px]
              font-black

              uppercase

              tracking-[0.20em]

              text-white/45
            "
          >
            {estado ===
            "aprovado"
              ? "ABRINDO SEU PAINEL..."
              : "CONSULTANDO SOLICITAÇÃO..."}
          </p>
        </div>
      </main>
    );
  }

  /* =======================================================
     SEM LOGIN
  ======================================================= */

  if (
    estado ===
    "sem_login"
  ) {
    return (
      <Navigate
        to="/parceiro/cadastro"
        replace
      />
    );
  }

  /* =======================================================
     ADMIN
  ======================================================= */

  if (
    usuario &&
    isAdmin(
      usuario.uid
    )
  ) {
    return (
      <Navigate
        to="/admin/dashboard"
        replace
      />
    );
  }

  /* =======================================================
     SEM CADASTRO
  ======================================================= */

  if (
    estado ===
    "sem_cadastro"
  ) {
    return (
      <Navigate
        to="/parceiro/cadastro"
        replace
      />
    );
  }

  /* =======================================================
     ERRO
  ======================================================= */

  if (
    estado ===
    "erro"
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
        <section
          role="alert"
          className="
            w-full
            max-w-md

            rounded-[26px]

            border
            border-red-500/25

            bg-[#0c0c0c]

            p-7

            text-center
          "
        >
          <div
            className="
              mx-auto

              flex
              h-16
              w-16

              items-center
              justify-center

              rounded-2xl

              border
              border-red-500/30

              bg-red-500/10

              text-3xl
            "
          >
            ⚠️
          </div>

          <p
            className="
              mt-6

              text-[9px]
              font-black

              uppercase

              tracking-[0.20em]

              text-red-500
            "
          >
            ERRO DE CONEXÃO
          </p>

          <h1
            className="
              mt-2

              text-2xl
              font-black

              uppercase
            "
          >
            NÃO FOI POSSÍVEL
            CONSULTAR
          </h1>

          <p
            className="
              mt-4

              text-xs
              leading-6

              text-white/40
            "
          >
            Não conseguimos
            consultar sua
            solicitação neste
            momento.
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="
              mt-7

              w-full

              rounded-xl

              bg-red-500

              px-5
              py-4

              text-[10px]
              font-black

              uppercase

              text-white

              transition

              hover:bg-red-600
            "
          >
            TENTAR NOVAMENTE
          </button>
        </section>
      </main>
    );
  }

  /* =======================================================
     STATUS
  ======================================================= */

  const rejeitado =
    estado ===
    "rejeitado";

  /* =======================================================
     INTERFACE
  ======================================================= */

  return (
    <main
      className="
        min-h-screen

        bg-black

        text-white
      "
      style={{
        fontFamily:
          "'Arial Black', 'Montserrat', Arial, sans-serif",
      }}
    >
      {/* =================================================
          CABEÇALHO
      ================================================= */}

      <header
        className="
          border-b
          border-white/10

          bg-black

          px-4
          py-4
        "
      >
        <div
          className="
            mx-auto

            flex
            max-w-5xl

            items-center
            justify-between

            gap-4
          "
        >
          <div
            className="
              flex
              items-center

              gap-3
            "
          >
            <img
              src="/coroa.png"
              alt="Império"
              draggable={false}
              className="
                h-9
                w-9

                object-contain
              "
            />

            <div>
              <p
                className="
                  text-[10px]
                  font-black

                  uppercase
                "
              >
                Portal do Parceiro
              </p>

              <p
                className="
                  mt-1

                  text-[7px]
                  font-black

                  uppercase

                  tracking-[0.20em]

                  text-red-500
                "
              >
                Acompanhamento
              </p>
            </div>
          </div>

          <Link
            to="/cardapio"
            className="
              rounded-xl

              border
              border-white/15

              bg-[#111]

              px-4
              py-3

              text-[9px]
              font-black

              uppercase

              text-white

              transition

              hover:border-red-500/50
            "
          >
            ← CARDÁPIO
          </Link>
        </div>
      </header>

      {/* =================================================
          CONTEÚDO
      ================================================= */}

      <div
        className="
          mx-auto

          max-w-5xl

          px-4
          py-12
        "
      >
        {/* =================================================
            TÍTULO
        ================================================= */}

        <div
          className="
            text-center
          "
        >
          <p
            className={`
              text-[9px]
              font-black

              uppercase

              tracking-[0.25em]

              ${
                rejeitado
                  ? "text-red-500"
                  : "text-[#ffd429]"
              }
            `}
          >
            STATUS DO CADASTRO
          </p>

          <h1
            className="
              mt-4

              text-4xl
              font-black

              uppercase

              leading-none

              sm:text-5xl
              md:text-6xl
            "
          >
            SUA{" "}

            <span
              className={
                rejeitado
                  ? "text-red-500"
                  : "text-[#ffd429]"
              }
            >
              SOLICITAÇÃO
            </span>
          </h1>
        </div>

        {/* =================================================
            STATUS PRINCIPAL
        ================================================= */}

        <section
          className={`
            relative

            mx-auto
            mt-10

            max-w-3xl

            overflow-hidden

            rounded-[28px]

            border

            bg-[#0c0c0c]

            p-6

            text-center

            sm:p-10

            ${
              rejeitado
                ? "border-red-500/25"
                : "border-[#ffd429]/25"
            }
          `}
        >
          {/* LUZ */}

          <div
            aria-hidden="true"
            className={`
              pointer-events-none

              absolute
              left-1/2
              top-0

              h-32
              w-64

              -translate-x-1/2

              rounded-full

              blur-[80px]

              ${
                rejeitado
                  ? "bg-red-500/10"
                  : "bg-[#ffd429]/10"
              }
            `}
          />

          {/* ÍCONE */}

          <div
            className={`
              relative
              z-10

              mx-auto

              flex
              h-20
              w-20

              items-center
              justify-center

              rounded-[22px]

              border

              text-4xl

              ${
                rejeitado
                  ? "border-red-500/25 bg-red-500/10"
                  : "border-[#ffd429]/25 bg-[#ffd429]/10"
              }
            `}
          >
            {rejeitado
              ? "✕"
              : "⏳"}
          </div>

          {/* STATUS */}

          <p
            className={`
              relative
              z-10

              mt-6

              text-[9px]
              font-black

              uppercase

              tracking-[0.20em]

              ${
                rejeitado
                  ? "text-red-500"
                  : "text-[#ffd429]"
              }
            `}
          >
            {rejeitado
              ? "SOLICITAÇÃO NÃO APROVADA"
              : "SOLICITAÇÃO EM ANÁLISE"}
          </p>

          <h2
            className="
              relative
              z-10

              mt-3

              text-2xl
              font-black

              uppercase

              sm:text-3xl
            "
          >
            {rejeitado
              ? "CADASTRO NÃO APROVADO"
              : "AGUARDANDO APROVAÇÃO"}
          </h2>

          <p
            className="
              relative
              z-10

              mx-auto
              mt-4

              max-w-xl

              text-xs
              leading-6

              text-white/40

              sm:text-sm
            "
          >
            {rejeitado
              ? "Sua solicitação foi analisada pela administração. O acesso ao painel do parceiro permanece bloqueado."
              : "Seu cadastro foi recebido e está aguardando a análise da administração do Império Chalés."}
          </p>

          {/* =================================================
              EMPRESA
          ================================================= */}

          <div
            className="
              relative
              z-10

              mt-8

              rounded-2xl

              border
              border-white/10

              bg-black

              p-5

              text-left
            "
          >
            <p
              className="
                text-[8px]
                font-black

                uppercase

                tracking-[0.16em]

                text-white/30
              "
            >
              ESTABELECIMENTO
            </p>

            <h3
              className="
                mt-2

                break-words

                text-xl
                font-black

                uppercase

                text-white

                sm:text-2xl
              "
            >
              {empresa?.nomeEmpresa ??
                "Estabelecimento"}
            </h3>

            {empresa?.nomeResponsavel && (
              <p
                className="
                  mt-3

                  text-xs

                  text-white/40
                "
              >
                Responsável:{" "}

                <strong
                  className="
                    text-white/70
                  "
                >
                  {
                    empresa.nomeResponsavel
                  }
                </strong>
              </p>
            )}

            {empresa?.email && (
              <p
                className="
                  mt-2

                  break-all

                  text-xs

                  text-white/35
                "
              >
                {empresa.email}
              </p>
            )}
          </div>
        </section>

        {/* =================================================
            PROGRESSO MINIMALISTA
        ================================================= */}

        {!rejeitado && (
          <section
            className="
              mx-auto
              mt-6

              max-w-3xl

              rounded-2xl

              border
              border-white/10

              bg-[#080808]

              p-5
            "
          >
            <div
              className="
                flex

                items-center

                gap-3
              "
            >
              {/* CONCLUÍDO */}

              <div
                className="
                  flex
                  h-9
                  w-9

                  shrink-0

                  items-center
                  justify-center

                  rounded-full

                  bg-[#00ef78]

                  text-xs
                  font-black

                  text-black
                "
              >
                ✓
              </div>

              <div
                className="
                  h-[2px]
                  flex-1

                  bg-gradient-to-r

                  from-[#00ef78]
                  to-[#ffd429]
                "
              />

              {/* ATUAL */}

              <div
                className="
                  flex
                  h-9
                  w-9

                  shrink-0

                  animate-pulse

                  items-center
                  justify-center

                  rounded-full

                  border
                  border-[#ffd429]

                  bg-[#ffd429]/10

                  text-xs
                  font-black

                  text-[#ffd429]

                  motion-reduce:animate-none
                "
              >
                2
              </div>

              <div
                className="
                  h-[2px]
                  flex-1

                  bg-white/10
                "
              />

              {/* FUTURO */}

              <div
                className="
                  flex
                  h-9
                  w-9

                  shrink-0

                  items-center
                  justify-center

                  rounded-full

                  border
                  border-white/10

                  bg-[#111]

                  text-xs
                  font-black

                  text-white/20
                "
              >
                3
              </div>
            </div>

            <div
              className="
                mt-4

                grid
                grid-cols-3

                text-center

                text-[7px]
                font-black

                uppercase

                tracking-[0.12em]
              "
            >
              <span
                className="
                  text-[#00ef78]
                "
              >
                CADASTRO
              </span>

              <span
                className="
                  text-[#ffd429]
                "
              >
                ANÁLISE
              </span>

              <span
                className="
                  text-white/20
                "
              >
                LIBERAÇÃO
              </span>
            </div>
          </section>
        )}

        {/* =================================================
            REJEITADO
        ================================================= */}

        {rejeitado && (
          <section
            className="
              mx-auto
              mt-6

              max-w-3xl

              rounded-2xl

              border
              border-red-500/20

              bg-red-500/[0.06]

              p-5
            "
          >
            <p
              className="
                text-[9px]
                font-black

                uppercase

                tracking-[0.16em]

                text-red-500
              "
            >
              ACESSO BLOQUEADO
            </p>

            <p
              className="
                mt-3

                text-xs
                leading-6

                text-white/40
              "
            >
              Entre em contato
              com a administração
              caso precise de mais
              informações sobre a
              análise.
            </p>
          </section>
        )}

        {/* =================================================
            INFORMAÇÃO
        ================================================= */}

        {!rejeitado && (
          <p
            className="
              mx-auto
              mt-6

              max-w-2xl

              text-center

              text-xs
              leading-6

              text-white/30
            "
          >
            Não é necessário
            enviar outro cadastro.
            Esta página acompanha
            automaticamente a
            situação registrada no
            sistema.
          </p>
        )}

        {/* =================================================
            BOTÃO
        ================================================= */}

        <div
          className="
            mx-auto
            mt-8

            max-w-3xl

            border-t
            border-white/10

            pt-6

            text-center
          "
        >
          <Link
            to="/cardapio"
            className="
              inline-flex

              items-center
              justify-center

              rounded-xl

              border
              border-white/15

              bg-[#111]

              px-6
              py-4

              text-[9px]
              font-black

              uppercase

              text-white

              transition

              hover:border-red-500/40
            "
          >
            ← VOLTAR AO CARDÁPIO
          </Link>
        </div>
      </div>

      {/* =================================================
          RODAPÉ
      ================================================= */}

      <footer
        className="
          mt-8

          border-t
          border-white/10

          px-4
          py-10

          text-center
        "
      >
        <img
          src="/coroa.png"
          alt=""
          draggable={false}
          className="
            mx-auto

            h-8
            w-8

            object-contain

            opacity-30
          "
        />

        <p
          className="
            mt-3

            text-[7px]
            font-black

            uppercase

            tracking-[0.18em]

            text-white/15
          "
        >
          IMPÉRIO CHALÉS • PORTAL DO PARCEIRO
        </p>
      </footer>
    </main>
  );
}

export default ParceiroSolicitacao;