import expIcon from "./exp.png";

export function CatalogoApresentacao() {
  const texto = "USE O CÓDIGO IMPERIO CHALÉS";

  return (
    <section
      className="
        relative
        overflow-hidden
        bg-black
        px-4
        pb-10
        pt-14
        text-white

        sm:px-6
        sm:pb-12
        sm:pt-16

        lg:px-8
        lg:pb-14
        lg:pt-20
      "
    >
      {/* =====================================================
          LUZES DE FUNDO
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-1/2
          top-[32%]

          h-[320px]
          w-[320px]

          -translate-x-1/2
          -translate-y-1/2

          rounded-full

          bg-[#ffd447]/[0.08]

          blur-[120px]

          sm:h-[420px]
          sm:w-[420px]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-x-0
          top-0
          h-24
          bg-gradient-to-b
          from-[#2b2b2b]/25
          to-transparent
        "
      />

      {/* =====================================================
          CONTEÚDO PRINCIPAL
      ====================================================== */}

      <div
        className="
          relative
          z-10

          mx-auto
          max-w-5xl

          text-center
        "
      >
        {/* TAG SUPERIOR */}

        <div
          className="
            inline-flex
            items-center
            justify-center

            rounded-full

            border
            border-[#ffd447]/35

            bg-[#0d0d0d]

            px-4
            py-2

            text-[9px]
            font-black

            uppercase

            tracking-[0.22em]

            text-[#ffe27a]

            shadow-[0_0_16px_rgba(255,212,71,0.18)]

            sm:text-[10px]
          "
          style={{
            textShadow: "0 0 10px rgba(255,212,71,0.35)",
          }}
        >
          EXPERIÊNCIA GASTRONÔMICA
        </div>

        {/* ÍCONE 3D GRANDE */}

        <div
          className="
            relative
            mx-auto
            mt-7

            flex
            w-full
            justify-center

            sm:mt-8
          "
        >
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              left-1/2
              top-1/2

              h-[180px]
              w-[180px]

              -translate-x-1/2
              -translate-y-1/2

              rounded-full

              bg-[#ffd447]/[0.16]

              blur-[55px]

              sm:h-[220px]
              sm:w-[220px]
            "
          />

          <img
            src={expIcon}
            alt="Ícone de experiência gastronômica"
            draggable={false}
            className="
              catalogo-apresentacao-float
              relative
              z-10

              h-[150px]
              w-[150px]

              object-contain

              drop-shadow-[0_18px_35px_rgba(0,0,0,0.65)]

              sm:h-[180px]
              sm:w-[180px]

              md:h-[210px]
              md:w-[210px]

              lg:h-[230px]
              lg:w-[230px]
            "
          />
        </div>

        {/* TÍTULO */}

        <h2
          className="
            mt-5

            text-[31px]
            font-black

            uppercase

            leading-[0.92]

            tracking-[-0.05em]

            text-white

            sm:mt-6
            sm:text-[42px]

            md:text-[54px]

            lg:text-[66px]
          "
          style={{
            fontFamily:
              "'Arial Black', 'Montserrat', 'Segoe UI', sans-serif",
            textShadow:
              "0 3px 0 rgba(0,0,0,1), 0 0 12px rgba(255,212,71,0.12), 0 10px 30px rgba(0,0,0,0.45)",
          }}
        >
          DESCUBRA OS SABORES
          <span
            className="
              mt-2
              block
              text-[#ffd447]
            "
            style={{
              textShadow:
                "0 0 8px rgba(255,212,71,0.55), 0 0 18px rgba(255,212,71,0.28), 0 3px 0 rgba(0,0,0,0.95)",
            }}
          >
            DA CHAPADA
          </span>
        </h2>

        {/* FRASE */}

        <p
          className="
            mx-auto
            mt-5

            max-w-2xl

            text-[13px]
            leading-6

            text-white/62

            sm:text-sm
            sm:leading-7

            md:text-base
          "
        >
          Conheça nossos parceiros e encontre sua próxima
          experiência gastronômica.
        </p>
      </div>

      {/* =====================================================
          LETREIRO FINO
      ====================================================== */}

      <div
        className="
          relative
          z-10

          mx-auto
          mt-10

          w-full
          max-w-7xl

          overflow-hidden

          border-y
          border-white/10

          bg-[#080808]

          py-2

          sm:mt-12
          sm:py-2.5
        "
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

            w-16

            bg-gradient-to-r
            from-black
            to-transparent

            sm:w-24
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

            w-16

            bg-gradient-to-l
            from-black
            to-transparent

            sm:w-24
          "
        />

        <div className="imperio-marquee flex w-max">
          <div
            className="
              flex
              shrink-0
              items-center
              whitespace-nowrap
            "
          >
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={`grupo-a-${index}`}
                className="
                  flex
                  items-center
                "
              >
                <span
                  className="
                    px-5

                    text-[10px]
                    font-black

                    uppercase

                    tracking-[0.22em]

                    text-white/75

                    sm:px-7
                    sm:text-[11px]
                  "
                >
                  {texto}
                </span>

                <span
                  className="
                    text-[10px]
                    font-black
                    text-[#ffd447]

                    drop-shadow-[0_0_6px_rgba(255,212,71,0.55)]

                    sm:text-xs
                  "
                >
                  ✦
                </span>
              </div>
            ))}
          </div>

          <div
            aria-hidden="true"
            className="
              flex
              shrink-0
              items-center
              whitespace-nowrap
            "
          >
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={`grupo-b-${index}`}
                className="
                  flex
                  items-center
                "
              >
                <span
                  className="
                    px-5

                    text-[10px]
                    font-black

                    uppercase

                    tracking-[0.22em]

                    text-white/75

                    sm:px-7
                    sm:text-[11px]
                  "
                >
                  {texto}
                </span>

                <span
                  className="
                    text-[10px]
                    font-black
                    text-[#ffd447]

                    drop-shadow-[0_0_6px_rgba(255,212,71,0.55)]

                    sm:text-xs
                  "
                >
                  ✦
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* =====================================================
          ANIMAÇÕES
      ====================================================== */}

      <style>
        {`
          @keyframes imperioMarquee {
            from {
              transform: translateX(0);
            }

            to {
              transform: translateX(-50%);
            }
          }

          @keyframes catalogoFloat {
            0% {
              transform: translateY(0px) rotate(0deg);
            }

            50% {
              transform: translateY(-10px) rotate(-2deg);
            }

            100% {
              transform: translateY(0px) rotate(0deg);
            }
          }

          .imperio-marquee {
            animation: imperioMarquee 28s linear infinite;
            will-change: transform;
          }

          .imperio-marquee:hover {
            animation-play-state: paused;
          }

          .catalogo-apresentacao-float {
            animation: catalogoFloat 4.6s ease-in-out infinite;
            will-change: transform;
          }

          @media (max-width: 640px) {
            .imperio-marquee {
              animation-duration: 20s;
            }

            .catalogo-apresentacao-float {
              animation-duration: 4s;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .imperio-marquee,
            .catalogo-apresentacao-float {
              animation: none;
            }
          }
        `}
      </style>
    </section>
  );
}

export default CatalogoApresentacao;