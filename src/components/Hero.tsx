import { useEffect, useState } from "react";

export function Hero() {
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

  /* =========================================================
      VELOCIDADE DOS VÍDEOS
  ========================================================= */

  const definirVelocidade = (
    video: HTMLVideoElement,
    velocidade: number
  ) => {
    video.defaultPlaybackRate = velocidade;
    video.playbackRate = velocidade;
  };

  return (
    <section
      id="inicio"
      className="
        relative
        overflow-hidden
        bg-black
        pb-20
        text-white

        sm:pb-24
      "
    >
      {/* =====================================================
          ESPAÇO ABAIXO DO HEADER
      ====================================================== */}

      <div
        className="
          h-[72px]
          bg-black

          sm:h-20
          md:h-24
          lg:h-28
          xl:h-32
        "
      />

      {/* =====================================================
          CENÁRIO PRINCIPAL
      ====================================================== */}

      <div
        className="
          relative
          z-20
          w-full
          overflow-hidden
          bg-black
        "
      >
        <div
          className="
            relative
            mx-auto

            h-[310px]
            w-full
            max-w-[1920px]

            overflow-hidden
            bg-black

            sm:h-[300px]
            md:h-[330px]
            lg:h-[360px]
            xl:h-[390px]
            2xl:h-[420px]
          "
        >
          {/* =================================================
              MOBILE
              Apenas chalé + pai e mãe
          ================================================== */}

          <div
            className="
              absolute
              inset-0

              flex
              items-center
              justify-center

              sm:hidden
            "
          >
            {/* CHALÉ */}

            <video
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              onLoadedMetadata={(event) =>
                definirVelocidade(event.currentTarget, 0.55)
              }
              onCanPlay={(event) =>
                definirVelocidade(event.currentTarget, 0.55)
              }
              onPlay={(event) =>
                definirVelocidade(event.currentTarget, 0.55)
              }
              className="
                pointer-events-none
                absolute

                left-[-3%]
                top-1/2

                z-10

                h-[92%]
                w-[68%]

                -translate-y-1/2

                object-contain
                object-left
              "
            >
              <source src="/noite-dia.mp4" type="video/mp4" />
            </video>

            {/* FADE */}

            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute

                inset-y-0
                left-[44%]

                z-20

                w-[24%]

                bg-gradient-to-r
                from-transparent
                via-black/20
                to-black
              "
            />

            {/* PAI E MÃE */}

            <img
              src="/booking-airbnb.png"
              alt=""
              aria-hidden="true"
              draggable={false}
              className="
                pointer-events-none
                absolute

                bottom-[5%]
                right-[1%]

                z-30

                w-[50%]
                max-w-none

                object-contain
                select-none
              "
            />

            {/* FADE INFERIOR */}

            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute

                inset-x-0
                bottom-0

                z-40

                h-[15%]

                bg-gradient-to-t
                from-black
                to-transparent
              "
            />
          </div>

          {/* =================================================
              TABLET / DESKTOP
          ================================================== */}

          <div className="hidden sm:block">
            {/* =================================================
                QUADRO
            ================================================== */}

            <img
              src="/barco.png"
              alt=""
              aria-hidden="true"
              draggable={false}
              className="
                pointer-events-none
                absolute

                left-[29%]
                top-[4%]

                z-[18]

                w-[clamp(55px,7vw,115px)]

                object-contain
                opacity-[0.95]
                select-none

                md:left-[30%]
                md:top-[4%]

                lg:left-[31%]
                lg:top-[5%]

                xl:left-[31.5%]

                2xl:left-[32%]
              "
            />

            {/* =================================================
                CHALÉ
            ================================================== */}

            <video
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              onLoadedMetadata={(event) =>
                definirVelocidade(event.currentTarget, 0.55)
              }
              onCanPlay={(event) =>
                definirVelocidade(event.currentTarget, 0.55)
              }
              onPlay={(event) =>
                definirVelocidade(event.currentTarget, 0.55)
              }
              className="
                absolute

                left-0
                top-1/2

                z-20

                h-[92%]
                w-[clamp(280px,38vw,680px)]

                -translate-y-1/2

                object-contain
                object-left
              "
            >
              <source src="/noite-dia.mp4" type="video/mp4" />
            </video>

            {/* FADE DO CHALÉ */}

            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute

                inset-y-0
                left-[26%]

                z-30

                w-[20%]

                bg-gradient-to-r
                from-transparent
                via-black/15
                to-black
              "
            />

            {/* =================================================
                PAI E MÃE
            ================================================== */}

            <img
              src="/booking-airbnb.png"
              alt=""
              aria-hidden="true"
              draggable={false}
              className="
                pointer-events-none
                absolute

                bottom-[2%]
                left-[19%]

                z-50

                w-[clamp(145px,18vw,320px)]
                max-w-none

                object-contain
                select-none

                md:left-[20%]
                lg:left-[21%]
                xl:left-[21.5%]
                2xl:left-[22%]
              "
            />

            {/* =================================================
                CRIANÇAS
            ================================================== */}

            <video
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              onLoadedMetadata={(event) =>
                definirVelocidade(event.currentTarget, 0.6)
              }
              onCanPlay={(event) =>
                definirVelocidade(event.currentTarget, 0.6)
              }
              onPlay={(event) =>
                definirVelocidade(event.currentTarget, 0.6)
              }
              className="
                absolute

                left-[42%]
                bottom-[7%]

                z-40

                h-auto
                w-[clamp(95px,11vw,185px)]

                object-contain
                object-center

                md:left-[41%]
                lg:left-[40%]
                xl:left-[39.5%]
                2xl:left-[39%]
              "
            >
              <source
                src="/mini-booairbnb.mp4"
                type="video/mp4"
              />
            </video>

            {/* =================================================
                PORTA
            ================================================== */}

            <div
              className="
                pointer-events-none
                absolute

                left-[53%]
                bottom-[4%]

                z-[16]

                w-[clamp(115px,13vw,225px)]

                select-none

                md:left-[54%]

                lg:left-[55%]
                lg:bottom-[5%]
                lg:w-[clamp(125px,12vw,220px)]

                xl:left-[56%]
                xl:w-[clamp(135px,11vw,220px)]

                2xl:left-[56%]
                2xl:w-[220px]
              "
            >
              <div
                aria-hidden="true"
                className="
                  pointer-events-none
                  absolute

                  bottom-[3%]
                  left-1/2

                  -z-10

                  h-[45%]
                  w-[80%]

                  -translate-x-1/2

                  rounded-full

                  bg-black/90
                  blur-[18px]
                "
              />

              <video
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                onLoadedMetadata={(event) =>
                  definirVelocidade(event.currentTarget, 0.52)
                }
                onCanPlay={(event) =>
                  definirVelocidade(event.currentTarget, 0.52)
                }
                onPlay={(event) =>
                  definirVelocidade(event.currentTarget, 0.52)
                }
                className="
                  relative
                  z-10

                  block
                  h-auto
                  w-full

                  object-contain
                  object-center

                  opacity-[0.96]
                "
                style={{
                  filter:
                    "brightness(0.92) saturate(1.02) contrast(1.04)",
                }}
              >
                <source
                  src="/porta-amarelo.mp4"
                  type="video/mp4"
                />
              </video>
            </div>

            {/* =================================================
                LAREIRA
            ================================================== */}

            <div
              className="
                pointer-events-none
                absolute

                right-[4%]
                bottom-[8%]

                z-[12]

                w-[clamp(145px,19vw,315px)]

                md:right-[5%]
                md:bottom-[9%]

                lg:right-[6%]
                lg:bottom-[10%]

                xl:right-[7%]

                2xl:right-[8%]
                2xl:bottom-[11%]
              "
            >
              <video
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                onLoadedMetadata={(event) =>
                  definirVelocidade(event.currentTarget, 0.78)
                }
                onCanPlay={(event) =>
                  definirVelocidade(event.currentTarget, 0.78)
                }
                onPlay={(event) =>
                  definirVelocidade(event.currentTarget, 0.78)
                }
                className="
                  block
                  h-auto
                  w-full

                  object-contain
                  object-center
                "
                style={{
                  filter:
                    "brightness(1.18) saturate(1.08) contrast(1.03)",
                }}
              >
                <source
                  src="/lareira.mp4"
                  type="video/mp4"
                />
              </video>
            </div>

            {/* =================================================
                JANELA / TEMPORAL
            ================================================== */}

            <div
              className="
                pointer-events-none
                absolute

                left-[69%]
                bottom-[37%]

                z-[14]

                w-[clamp(55px,5.8vw,108px)]

                select-none

                md:left-[69.5%]
                md:bottom-[38%]

                lg:left-[70%]
                lg:bottom-[39%]

                xl:bottom-[40%]

                2xl:left-[70.5%]
                2xl:w-[108px]
              "
            >
              <video
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                onLoadedMetadata={(event) =>
                  definirVelocidade(event.currentTarget, 0.72)
                }
                onCanPlay={(event) =>
                  definirVelocidade(event.currentTarget, 0.72)
                }
                onPlay={(event) =>
                  definirVelocidade(event.currentTarget, 0.72)
                }
                className="
                  relative
                  z-10

                  block
                  h-auto
                  w-full

                  object-contain

                  opacity-[0.92]
                "
                style={{
                  filter:
                    "brightness(0.88) saturate(0.95) contrast(1.08)",
                }}
              >
                <source
                  src="/temporal.mp4"
                  type="video/mp4"
                />
              </video>
            </div>
          </div>

          {/* =================================================
              FADES DO CENÁRIO
          ================================================== */}

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute

              inset-x-0
              top-0

              z-[60]

              h-[7%]

              bg-gradient-to-b
              from-black/70
              to-transparent
            "
          />

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute

              inset-x-0
              bottom-0

              z-[60]

              h-[9%]

              bg-gradient-to-t
              from-black
              to-transparent
            "
          />
        </div>
      </div>

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

      {/* =====================================================
          LUZ DOURADA
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute

          -left-44
          bottom-28

          h-[420px]
          w-[420px]

          rounded-full

          bg-[#d4af37]/[0.035]

          blur-[150px]
        "
      />

      {/* =====================================================
          LUZ VERDE
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute

          -right-44
          bottom-40

          h-[520px]
          w-[520px]

          rounded-full

          bg-[#12382a]/[0.08]

          blur-[170px]
        "
      />
    </section>
  );
}