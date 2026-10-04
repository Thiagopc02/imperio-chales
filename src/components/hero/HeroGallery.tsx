import { useEffect, useState } from "react";

export function HeroGallery() {
  /* =========================================================
      FOTOS DO CARROSSEL
      public/01.png até public/10.png
  ========================================================= */

  const fotos = [
    "/01.png",
    "/02.png",
    "/03.png",
    "/04.png",
    "/05.png",
    "/06.png",
    "/07.png",
    "/08.png",
    "/09.png",
    "/10.png",
  ];

  const [fotoAtual, setFotoAtual] = useState(0);

  /* =========================================================
      TROCA AUTOMÁTICA DAS FOTOS
  ========================================================= */

  useEffect(() => {
    const intervalo = window.setInterval(() => {
      setFotoAtual((atual) => (atual + 1) % fotos.length);
    }, 4500);

    return () => window.clearInterval(intervalo);
  }, [fotos.length]);

  /* =========================================================
      CONTROLES DO CARROSSEL
  ========================================================= */

  const anterior = () => {
    setFotoAtual((atual) =>
      atual === 0 ? fotos.length - 1 : atual - 1
    );
  };

  const proxima = () => {
    setFotoAtual((atual) =>
      atual === fotos.length - 1 ? 0 : atual + 1
    );
  };

  return (
    <>
      {/* =====================================================
          SEPARADOR
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          relative
          z-30

          mx-auto
          mt-2

          h-px
          w-[94%]
          max-w-[1500px]

          bg-gradient-to-r
          from-transparent
          via-[#d4af37]/10
          to-transparent
        "
      />

      {/* =====================================================
          GALERIA
      ====================================================== */}

      <div
        id="galeria"
        className="
          relative
          z-30

          mx-auto
          mt-8

          w-full
          max-w-7xl

          px-3

          sm:mt-10
          sm:px-6

          lg:mt-12
        "
      >
        {/* =================================================
            LOGO CENTRAL
        ================================================== */}

        <div
          className="
            mb-7
            text-center

            sm:mb-8
          "
        >
          <img
            src="/centro.png"
            alt="Império Chalés - Vila do Sossego"
            draggable={false}
            className="
              mx-auto

              w-[78%]
              max-w-[330px]

              object-contain

              drop-shadow-[0_8px_22px_rgba(255,255,255,0.07)]

              select-none

              sm:w-[52%]
              sm:max-w-[460px]

              md:w-[48%]
              md:max-w-[520px]

              lg:w-[44%]
              lg:max-w-[560px]

              xl:w-[42%]
            "
          />

          <p
            className="
              mx-auto
              mt-3

              max-w-[310px]

              px-2

              text-center
              text-[12px]
              font-medium
              leading-[1.5]

              text-white/55

              sm:max-w-xl
              sm:text-sm

              md:max-w-2xl
              md:text-[15px]
            "
          >
            Conforto, natureza e momentos inesquecíveis em Alto Paraíso.
          </p>
        </div>

        {/* =================================================
            CARROSSEL DAS 10 FOTOS
        ================================================== */}

        <div
          className="
            relative

            overflow-hidden

            rounded-[20px]

            border
            border-[#d4af37]/20

            bg-[#050505]

            shadow-[0_30px_80px_rgba(0,0,0,0.65)]

            sm:rounded-[28px]
            lg:rounded-[34px]
          "
        >
          <div
            className="
              relative

              h-[280px]
              w-full

              sm:h-[420px]
              md:h-[500px]
              lg:h-[600px]
              xl:h-[650px]
            "
          >
            {/* =================================================
                AS 10 IMAGENS
            ================================================== */}

            {fotos.map((foto, index) => (
              <img
                key={foto}
                src={foto}
                alt={`Império Chalés - foto ${index + 1}`}
                draggable={false}
                className={`
                  absolute
                  inset-0

                  h-full
                  w-full

                  object-cover
                  object-center

                  select-none

                  transition-all
                  duration-1000
                  ease-out

                  ${
                    index === fotoAtual
                      ? "scale-100 opacity-100"
                      : "pointer-events-none scale-[1.035] opacity-0"
                  }
                `}
              />
            ))}

            {/* =================================================
                SOMBREAMENTO
            ================================================== */}

            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                inset-0
                z-10

                bg-gradient-to-t
                from-black/30
                via-transparent
                to-black/10
              "
            />

            {/* =================================================
                CONTADOR
            ================================================== */}

            <div
              className="
                absolute

                right-3
                top-3

                z-20

                rounded-full

                border
                border-white/15

                bg-black/65

                px-3
                py-1.5

                text-[9px]
                font-bold
                tracking-[0.15em]
                text-white

                backdrop-blur-md

                sm:right-6
                sm:top-6
                sm:text-[10px]
              "
            >
              {String(fotoAtual + 1).padStart(2, "0")} /{" "}
              {String(fotos.length).padStart(2, "0")}
            </div>

            {/* =================================================
                SETA ESQUERDA
            ================================================== */}

            <button
              type="button"
              onClick={anterior}
              aria-label="Foto anterior"
              className="
                absolute

                left-3
                top-1/2

                z-20

                flex

                h-10
                w-10

                -translate-y-1/2

                items-center
                justify-center

                rounded-full

                border
                border-white/20

                bg-black/60

                text-xl
                text-white

                backdrop-blur-md

                transition-all
                duration-300

                hover:border-[#d4af37]
                hover:bg-black/80
                hover:text-[#d4af37]

                sm:left-6
                sm:h-12
                sm:w-12
              "
            >
              ‹
            </button>

            {/* =================================================
                SETA DIREITA
            ================================================== */}

            <button
              type="button"
              onClick={proxima}
              aria-label="Próxima foto"
              className="
                absolute

                right-3
                top-1/2

                z-20

                flex

                h-10
                w-10

                -translate-y-1/2

                items-center
                justify-center

                rounded-full

                border
                border-white/20

                bg-black/60

                text-xl
                text-white

                backdrop-blur-md

                transition-all
                duration-300

                hover:border-[#d4af37]
                hover:bg-black/80
                hover:text-[#d4af37]

                sm:right-6
                sm:h-12
                sm:w-12
              "
            >
              ›
            </button>

            {/* =================================================
                INDICADORES
            ================================================== */}

            <div
              className="
                absolute

                bottom-4
                left-1/2

                z-20

                flex

                -translate-x-1/2

                items-center

                gap-1.5

                sm:bottom-6
                sm:gap-2
              "
            >
              {fotos.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Ver foto ${index + 1}`}
                  onClick={() => setFotoAtual(index)}
                  className={`
                    h-1.5

                    rounded-full

                    transition-all
                    duration-300

                    ${
                      fotoAtual === index
                        ? "w-7 bg-[#d4af37]"
                        : "w-1.5 bg-white/45 hover:bg-white"
                    }
                  `}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}