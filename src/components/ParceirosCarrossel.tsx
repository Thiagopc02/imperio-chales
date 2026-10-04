import {
  useEffect,
  useState,
} from "react";

import {
  collection,
  onSnapshot,
} from "firebase/firestore";

import { db } from "../firebase/config";

/* =========================================================
   TIPO
========================================================= */

interface ParceiroCarrossel {
  id: string;
  nome: string;
  categoria: string;
  logoUrl: string;
  ativo: boolean;
}

/* =========================================================
   AUXILIAR
========================================================= */

function texto(valor: unknown): string {
  return typeof valor === "string"
    ? valor
    : "";
}

/* =========================================================
   COMPONENTE
========================================================= */

export function ParceirosCarrossel() {
  const [
    parceiros,
    setParceiros,
  ] = useState<ParceiroCarrossel[]>([]);

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    pausado,
    setPausado,
  ] = useState(false);

  const [
    movimentoReduzido,
    setMovimentoReduzido,
  ] = useState(false);

  /* =======================================================
     BUSCAR PARCEIROS NO FIREBASE
  ======================================================= */

  useEffect(() => {
    const cancelar = onSnapshot(
      collection(
        db,
        "catalogoPublico"
      ),

      (resultado) => {
        const lista =
          resultado.docs
            .map((documento) => {
              const dados =
                documento.data();

              return {
                id:
                  documento.id,

                nome:
                  texto(
                    dados.nome
                  ) ||
                  "Estabelecimento",

                categoria:
                  texto(
                    dados.categoria
                  ) ||
                  "Gastronomia",

                logoUrl:
                  texto(
                    dados.logoUrl
                  ) ||
                  texto(
                    dados.logo
                  ),

                ativo:
                  dados.ativo ===
                  true,
              };
            })
            .filter(
              (parceiro) =>
                parceiro.ativo
            );

        setParceiros(lista);
        setCarregando(false);
      },

      (erro) => {
        console.error(
          "Erro ao carregar parceiros:",
          erro
        );

        setParceiros([]);
        setCarregando(false);
      }
    );

    return () =>
      cancelar();
  }, []);

  /* =======================================================
     REDUÇÃO DE MOVIMENTO
  ======================================================= */

  useEffect(() => {
    const consulta =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      );

    const atualizar = () => {
      setMovimentoReduzido(
        consulta.matches
      );
    };

    atualizar();

    consulta.addEventListener(
      "change",
      atualizar
    );

    return () => {
      consulta.removeEventListener(
        "change",
        atualizar
      );
    };
  }, []);

  /* =======================================================
     CARREGANDO
  ======================================================= */

  if (carregando) {
    return (
      <section
        className="
          mb-14
          w-full
          py-8
        "
      >
        <p
          className="
            text-center
            text-xs
            font-black
            uppercase
            tracking-[0.18em]
            text-white/35
          "
        >
          Carregando parceiros...
        </p>
      </section>
    );
  }

  /* =======================================================
     SEM PARCEIROS
  ======================================================= */

  if (parceiros.length === 0) {
    return (
      <section
        className="
          mb-14
          w-full
          px-4
        "
      >
        <div
          className="
            mx-auto
            max-w-6xl

            rounded-[26px]

            border
            border-white/10

            bg-gradient-to-br
            from-[#202020]
            via-[#101010]
            to-[#050505]

            px-5
            py-10

            text-center
          "
        >
          <h2
            className="
              text-2xl
              font-black
              uppercase
              text-white
            "
          >
            VEJA OS ESTABELECIMENTOS{" "}
            <span className="text-[#ffd447]">
              PARCEIROS
            </span>
          </h2>

          <p
            className="
              mt-3
              text-sm
              text-white/40
            "
          >
            Novos parceiros estarão
            disponíveis em breve.
          </p>
        </div>
      </section>
    );
  }

  /* =======================================================
     REPETIÇÕES PARA LOOP CONTÍNUO
  ======================================================= */

  /*
    Mesmo com apenas 1 restaurante,
    repetimos várias vezes para preencher
    o trilho inteiro.

    Conforme novos parceiros entrarem,
    todos passam automaticamente.
  */

  const repeticoes =
    parceiros.length === 1
      ? 8
      : parceiros.length === 2
        ? 5
        : parceiros.length === 3
          ? 4
          : 3;

  const listaAnimada =
    Array.from({
      length: repeticoes,
    }).flatMap(() => parceiros);

  /* =======================================================
     CARD
  ======================================================= */

  function criarCard(
    parceiro: ParceiroCarrossel,
    indice: number
  ) {
    return (
      <a
        key={`${parceiro.id}-${indice}`}
        href={`#restaurante-${parceiro.id}`}
        className="
          group
          relative

          flex
          w-[215px]
          shrink-0

          items-center

          gap-4

          overflow-hidden

          rounded-[22px]

          border
          border-white/10

          bg-gradient-to-br
          from-[#272727]
          via-[#151515]
          to-[#070707]

          px-4
          py-4

          shadow-[0_15px_35px_rgba(0,0,0,0.42)]

          transition-all
          duration-300

          hover:-translate-y-1
          hover:border-[#ffd447]/70

          hover:shadow-[0_16px_40px_rgba(255,212,71,0.12)]

          sm:w-[255px]
          sm:px-5

          lg:w-[280px]
        "
      >
        {/* BRILHO */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none

            absolute
            right-0
            top-1/2

            h-24
            w-24

            -translate-y-1/2

            rounded-full

            bg-[#ffd447]/[0.05]

            blur-[35px]

            transition-all
            duration-300

            group-hover:bg-[#ffd447]/[0.12]
          "
        />

        {/* LOGO */}

        <div
          className="
            relative
            z-10

            flex
            h-[68px]
            w-[68px]

            shrink-0

            items-center
            justify-center

            overflow-hidden

            rounded-[17px]

            border
            border-white/10

            bg-black/45

            sm:h-[76px]
            sm:w-[76px]
          "
        >
          {parceiro.logoUrl ? (
            <img
              src={
                parceiro.logoUrl
              }
              alt={
                parceiro.nome
              }
              loading="lazy"
              draggable={false}
              className="
                h-full
                w-full

                object-contain

                p-1.5
              "
            />
          ) : (
            <span className="text-3xl">
              🍽️
            </span>
          )}
        </div>

        {/* INFORMAÇÕES */}

        <div
          className="
            relative
            z-10

            min-w-0
            flex-1
          "
        >
          <p
            className="
              text-[8px]
              font-black

              uppercase
              tracking-[0.13em]

              text-[#ffd447]

              sm:text-[9px]
            "
          >
            {parceiro.categoria}
          </p>

          <h3
            className="
              mt-1.5

              line-clamp-2

              text-[15px]
              font-black

              uppercase

              leading-[1.05]

              text-white

              sm:text-[17px]
            "
            style={{
              fontFamily:
                "'Arial Black', 'Montserrat', sans-serif",
            }}
          >
            {parceiro.nome}
          </h3>

          <p
            className="
              mt-2

              text-[9px]
              font-bold

              uppercase
              tracking-[0.06em]

              text-white/40

              transition-colors
              duration-300

              group-hover:text-white/70
            "
          >
            Ver cardápio →
          </p>
        </div>
      </a>
    );
  }

  /* =======================================================
     INTERFACE
  ======================================================= */

  return (
    <section
      className="
        relative

        mb-14

        w-full

        overflow-hidden

        sm:mb-16
      "
    >
      {/* =====================================================
          TÍTULO
      ====================================================== */}

      <div
        className="
          mx-auto

          mb-7

          max-w-6xl

          px-4

          text-center

          sm:mb-9
          sm:px-6
        "
      >
        <p
          className="
            text-[9px]
            font-black

            uppercase

            tracking-[0.25em]

            text-[#ffd447]
          "
        >
          SABORES DA CHAPADA
        </p>

        <h2
          className="
            mt-3

            text-[27px]
            font-black

            uppercase

            leading-[0.95]

            tracking-[-0.04em]

            text-white

            sm:text-[36px]

            md:text-[42px]
          "
          style={{
            fontFamily:
              "'Arial Black', 'Montserrat', sans-serif",
          }}
        >
          VEJA OS ESTABELECIMENTOS
          <span
            className="
              block
              text-[#ffd447]
            "
            style={{
              textShadow:
                "0 0 12px rgba(255,212,71,0.40)",
            }}
          >
            PARCEIROS
          </span>
        </h2>
      </div>

      {/* =====================================================
          CARROSSEL
      ====================================================== */}

      <div
        className="
          relative

          w-full

          overflow-hidden

          border-y
          border-white/[0.06]

          bg-gradient-to-r
          from-black
          via-[#101010]
          to-black

          py-5

          sm:py-6
        "
        onMouseEnter={() =>
          setPausado(true)
        }
        onMouseLeave={() =>
          setPausado(false)
        }
        onFocusCapture={() =>
          setPausado(true)
        }
        onBlurCapture={(
          evento
        ) => {
          if (
            !evento.currentTarget.contains(
              evento.relatedTarget
            )
          ) {
            setPausado(false);
          }
        }}
      >
        {/* SOMBRA ESQUERDA */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none

            absolute
            bottom-0
            left-0
            top-0

            z-20

            w-12

            bg-gradient-to-r
            from-black
            to-transparent

            sm:w-24

            lg:w-32
          "
        />

        {/* SOMBRA DIREITA */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none

            absolute
            bottom-0
            right-0
            top-0

            z-20

            w-12

            bg-gradient-to-l
            from-black
            to-transparent

            sm:w-24

            lg:w-32
          "
        />

        {/* LUZ CENTRAL */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none

            absolute
            left-1/2
            top-1/2

            h-[170px]
            w-[55%]

            -translate-x-1/2
            -translate-y-1/2

            rounded-full

            bg-[#ffd447]/[0.025]

            blur-[90px]
          "
        />

        {/* TRILHO */}

        <div
          className={`
            parceiros-track

            relative
            z-10

            flex
            w-max

            gap-4

            px-4

            sm:gap-5

            ${
              !movimentoReduzido
                ? "parceiros-track-animado"
                : ""
            }
          `}
          style={{
            animationPlayState:
              pausado
                ? "paused"
                : "running",
          }}
        >
          {listaAnimada.map(
            (
              parceiro,
              indice
            ) =>
              criarCard(
                parceiro,
                indice
              )
          )}
        </div>
      </div>

      {/* =====================================================
          ANIMAÇÃO
      ====================================================== */}

      <style>
        {`
          @keyframes parceirosInfinito {
            0% {
              transform: translateX(0);
            }

            100% {
              transform: translateX(-50%);
            }
          }

          .parceiros-track-animado {
            animation:
              parceirosInfinito
              32s
              linear
              infinite;

            will-change: transform;
          }

          @media (max-width: 640px) {
            .parceiros-track-animado {
              animation-duration: 24s;
            }
          }

          @media (min-width: 1440px) {
            .parceiros-track-animado {
              animation-duration: 38s;
            }
          }

          @media (
            prefers-reduced-motion:
            reduce
          ) {
            .parceiros-track-animado {
              animation: none;
            }
          }
        `}
      </style>
    </section>
  );
}

export default ParceirosCarrossel;