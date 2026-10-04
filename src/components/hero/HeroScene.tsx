export function HeroScene() {
  /* =========================================================
      CONTROLE DE VELOCIDADE DOS VÍDEOS
  ========================================================= */

  const definirVelocidade = (
    video: HTMLVideoElement,
    velocidade: number
  ) => {
    video.defaultPlaybackRate = velocidade;
    video.playbackRate = velocidade;
  };

  return (
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
        {/* =====================================================
            MOBILE
            Apenas chalé + pai e mãe
        ====================================================== */}

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
          {/* =================================================
              CHALÉ MOBILE
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

          {/* =================================================
              FADE MOBILE
          ================================================== */}

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

          {/* =================================================
              PAI E MÃE MOBILE
          ================================================== */}

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

          {/* =================================================
              FADE INFERIOR MOBILE
          ================================================== */}

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

        {/* =====================================================
            TABLET / DESKTOP
        ====================================================== */}

        <div className="hidden sm:block">
          {/* =================================================
              QUADRO / BARCO
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

          {/* =================================================
              FADE DO CHALÉ
          ================================================== */}

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
            {/* sombra atrás da porta */}

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

        {/* =====================================================
            FADES GERAIS DO CENÁRIO
        ====================================================== */}

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
  );
}