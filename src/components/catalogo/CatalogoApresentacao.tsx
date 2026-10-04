export function CatalogoApresentacao() {
  const texto =
    "USE O CÓDIGO IMPERIO CHALÉS";

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
          LUZ DE FUNDO MUITO SUAVE
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-1/2
          top-1/2

          h-[300px]
          w-[70%]

          -translate-x-1/2
          -translate-y-1/2

          rounded-full

          bg-[#d4af37]/[0.025]

          blur-[120px]
        "
      />

      {/* =====================================================
          TÍTULO
      ====================================================== */}

      <div
        className="
          relative
          z-10

          mx-auto
          max-w-4xl

          text-center
        "
      >
        <div
          className="
            inline-flex
            items-center

            rounded-full

            border
            border-[#d4af37]/30

            bg-[#111111]

            px-4
            py-2

            text-[9px]
            font-black

            uppercase

            tracking-[0.20em]

            text-[#e7c43b]

            sm:text-[10px]
          "
        >
          🍽️ Experiência gastronômica
        </div>

        <h2
          className="
            mt-6

            text-[34px]
            font-black

            leading-[0.98]

            tracking-[-0.035em]

            text-white

            sm:text-[44px]

            md:text-[54px]

            lg:text-[62px]
          "
          style={{
            fontFamily:
              "'Arial Black', 'Montserrat', sans-serif",

            textShadow:
              "0 3px 0 rgba(0,0,0,1), 0 10px 30px rgba(0,0,0,0.40)",
          }}
        >
          Descubra os sabores
          <span
            className="
              block
              text-[#d4af37]
            "
          >
            da Chapada
          </span>
        </h2>

        <p
          className="
            mx-auto
            mt-5

            max-w-2xl

            text-[13px]
            leading-6

            text-white/55

            sm:text-sm
            sm:leading-7

            md:text-base
          "
        >
          Conheça nossos parceiros e encontre sua
          próxima experiência gastronômica.
        </p>
      </div>

      {/* =====================================================
          LETREIRO
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

          py-2.5

          sm:mt-12
          sm:py-3
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

            sm:w-28
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

            sm:w-28
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
            {Array.from({
              length: 8,
            }).map((_, index) => (
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

                    tracking-[0.20em]

                    text-white/70

                    sm:px-7
                    sm:text-[11px]
                  "
                >
                  {texto}
                </span>

                <span
                  className="
                    text-[10px]
                    text-[#d4af37]

                    sm:text-xs
                  "
                >
                  ✦
                </span>
              </div>
            ))}
          </div>

          {/* CÓPIA PARA LOOP PERFEITO */}

          <div
            aria-hidden="true"
            className="
              flex
              shrink-0

              items-center

              whitespace-nowrap
            "
          >
            {Array.from({
              length: 8,
            }).map((_, index) => (
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

                    tracking-[0.20em]

                    text-white/70

                    sm:px-7
                    sm:text-[11px]
                  "
                >
                  {texto}
                </span>

                <span
                  className="
                    text-[10px]
                    text-[#d4af37]

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
          ANIMAÇÃO
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

          .imperio-marquee {
            animation: imperioMarquee 28s linear infinite;
            will-change: transform;
          }

          .imperio-marquee:hover {
            animation-play-state: paused;
          }

          @media (max-width: 640px) {
            .imperio-marquee {
              animation-duration: 20s;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .imperio-marquee {
              animation: none;
            }
          }
        `}
      </style>
    </section>
  );
}

export default CatalogoApresentacao;