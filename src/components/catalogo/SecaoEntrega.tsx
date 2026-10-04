import type {
  RestaurantePublico,
} from "./catalogoTypes";

import {
  RestauranteCard,
} from "./RestauranteCard";

import entregaIcon from "./entrega.png";

/* =========================================================
   TIPOS
========================================================= */

type SecaoEntregaProps = {
  restaurantes: RestaurantePublico[];

  onAbrirRestaurante: (
    restaurante: RestaurantePublico
  ) => void;
};

/* =========================================================
   COMPONENTE
========================================================= */

export function SecaoEntrega({
  restaurantes,
  onAbrirRestaurante,
}: SecaoEntregaProps) {
  return (
    <section
      id="entrega"
      className="
        relative
        mb-16
        scroll-mt-8

        sm:mb-20
      "
    >
      {/* =====================================================
          LUZ DE FUNDO
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -left-24
          top-10

          h-[260px]
          w-[260px]

          rounded-full

          bg-emerald-400/[0.04]

          blur-[100px]
        "
      />

      {/* =====================================================
          CABEÇALHO DA SEÇÃO
      ====================================================== */}

      <div
        className="
          relative
          z-10

          flex
          flex-col

          items-start

          gap-5

          sm:flex-row
          sm:items-center
          sm:gap-7
        "
      >
        {/* =================================================
            ÍCONE 3D
        ================================================= */}

        <div
          className="
            relative

            flex
            h-[110px]
            w-[110px]

            shrink-0

            items-center
            justify-center

            sm:h-[125px]
            sm:w-[125px]

            lg:h-[140px]
            lg:w-[140px]
          "
        >
          {/* GLOW */}

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              inset-[20%]

              rounded-full

              bg-emerald-400/20

              blur-[28px]
            "
          />

          <img
            src={entregaIcon}
            alt="Entrega direta"
            draggable={false}
            className="
              relative
              z-10

              h-full
              w-full

              object-contain

              drop-shadow-[0_16px_24px_rgba(0,0,0,0.50)]

              transition-transform
              duration-500

              hover:-translate-y-2
              hover:scale-105
            "
          />
        </div>

        {/* =================================================
            TEXTO
        ================================================= */}

        <div
          className="
            max-w-3xl
          "
        >
          <p
            className="
              text-[9px]
              font-black

              uppercase

              tracking-[0.28em]

              text-emerald-400

              sm:text-[10px]
            "
          >
            ENTREGA DIRETA
          </p>

          <h2
            className="
              mt-2

              text-[32px]
              font-black

              uppercase

              leading-[0.92]

              tracking-[-0.045em]

              text-white

              sm:text-[42px]

              md:text-[50px]

              lg:text-[56px]
            "
            style={{
              fontFamily:
                "'Arial Black', 'Montserrat', 'Segoe UI', sans-serif",

              textShadow:
                "0 3px 0 rgba(0,0,0,1), 0 10px 30px rgba(0,0,0,0.45)",
            }}
          >
            RECEBA NO
            <span
              className="
                block

                text-emerald-400
              "
              style={{
                textShadow:
                  "0 0 10px rgba(52,211,153,0.35), 0 0 22px rgba(52,211,153,0.18)",
              }}
            >
              SEU CHALÉ
            </span>
          </h2>

          <p
            className="
              mt-4

              max-w-xl

              text-[12px]
              leading-6

              text-white/50

              sm:text-sm
              sm:leading-7
            "
          >
            Escolha seu restaurante e receba sua refeição
            durante a hospedagem.
          </p>
        </div>
      </div>

      {/* =====================================================
          LINHA DECORATIVA
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          relative
          z-10

          mt-7

          h-px
          w-full

          bg-gradient-to-r

          from-emerald-400/40
          via-white/10
          to-transparent
        "
      />

      {/* =====================================================
          RESTAURANTES
      ====================================================== */}

      {restaurantes.length > 0 ? (
        <div
          className="
            relative
            z-10

            mt-8

            grid
            grid-cols-1

            gap-5

            md:grid-cols-2

            xl:grid-cols-3
          "
        >
          {restaurantes.map(
            (restaurante) => (
              <RestauranteCard
                key={restaurante.id}
                restaurante={restaurante}
                onAbrir={
                  onAbrirRestaurante
                }
              />
            )
          )}
        </div>
      ) : (
        /* ===================================================
            SEM RESTAURANTES
        =================================================== */

        <div
          className="
            relative
            z-10

            mt-8

            overflow-hidden

            rounded-[28px]

            border
            border-white/10

            bg-gradient-to-br
            from-[#242424]
            via-[#131313]
            to-[#060606]

            px-6
            py-10

            text-center

            shadow-[0_20px_50px_rgba(0,0,0,0.35)]

            sm:px-8
            sm:py-12
          "
        >
          {/* LUZ */}

          <div
            aria-hidden="true"
            className="
              pointer-events-none

              absolute
              left-1/2
              top-1/2

              h-40
              w-40

              -translate-x-1/2
              -translate-y-1/2

              rounded-full

              bg-emerald-400/[0.05]

              blur-[65px]
            "
          />

          <img
            src={entregaIcon}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="
              relative
              z-10

              mx-auto

              h-[90px]
              w-[90px]

              object-contain

              opacity-90

              drop-shadow-[0_12px_20px_rgba(0,0,0,0.45)]
            "
          />

          <h3
            className="
              relative
              z-10

              mt-4

              text-[22px]
              font-black

              uppercase

              tracking-[-0.03em]

              text-white

              sm:text-[26px]
            "
            style={{
              fontFamily:
                "'Arial Black', 'Montserrat', sans-serif",
            }}
          >
            ENTREGAS EM BREVE
          </h3>

          <p
            className="
              relative
              z-10

              mx-auto

              mt-3

              max-w-lg

              text-xs
              leading-6

              text-white/45

              sm:text-sm
            "
          >
            Assim que novos parceiros com entrega estiverem
            disponíveis, eles aparecerão aqui automaticamente.
          </p>
        </div>
      )}
    </section>
  );
}

export default SecaoEntrega;