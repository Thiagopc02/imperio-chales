import type {
  RestaurantePublico,
} from "./catalogoTypes";

import {
  RestauranteCard,
} from "./RestauranteCard";

type SecaoRetiradaProps = {
  restaurantes: RestaurantePublico[];

  onAbrirRestaurante: (
    restaurante: RestaurantePublico
  ) => void;
};

export function SecaoRetirada({
  restaurantes,
  onAbrirRestaurante,
}: SecaoRetiradaProps) {
  return (
    <section
      id="retirada"
      className="
        relative
        mb-16
        scroll-mt-24
      "
    >
      {/* =====================================================
          CABEÇALHO
      ====================================================== */}

      <div
        className="
          mb-7
          flex
          flex-col

          gap-4

          sm:flex-row
          sm:items-center
        "
      >
        {/* ÍCONE */}

        <div
          className="
            flex
            h-[72px]
            w-[72px]

            shrink-0

            items-center
            justify-center

            rounded-[22px]

            border
            border-[#d4af37]/25

            bg-gradient-to-br
            from-[#2a2514]
            via-[#17140c]
            to-black

            text-3xl

            shadow-[0_12px_35px_rgba(212,175,55,0.10)]
          "
        >
          🛍️
        </div>

        {/* TEXTO */}

        <div>
          <p
            className="
              text-[9px]
              font-black

              uppercase

              tracking-[0.30em]

              text-[#ffd447]

              sm:text-[10px]
            "
          >
            Retirada sob consulta
          </p>

          <h2
            className="
              mt-2

              text-[30px]
              font-black

              uppercase

              leading-[0.95]

              tracking-[-0.04em]

              text-white

              sm:text-[38px]

              lg:text-[44px]
            "
            style={{
              fontFamily:
                "'Arial Black', 'Montserrat', sans-serif",

              textShadow:
                "0 3px 0 rgba(0,0,0,1), 0 8px 20px rgba(0,0,0,0.45)",
            }}
          >
            Consulte o anfitrião
          </h2>

          <p
            className="
              mt-3

              max-w-2xl

              text-sm
              leading-6

              text-white/50

              sm:text-[15px]
            "
          >
            Algumas opções precisam de confirmação
            antes da retirada.
          </p>
        </div>
      </div>

      {/* =====================================================
          CARD PRINCIPAL
      ====================================================== */}

      <div
        className="
          relative

          overflow-hidden

          rounded-[28px]

          border
          border-[#d4af37]/25

          bg-gradient-to-br
          from-[#1d1b13]
          via-[#10100d]
          to-[#050505]

          shadow-[0_20px_60px_rgba(0,0,0,0.42)]
        "
      >
        {/* BRILHO */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none

            absolute
            -right-16
            -top-20

            h-60
            w-60

            rounded-full

            bg-[#d4af37]/10

            blur-[90px]
          "
        />

        {/* AVISO */}

        <div
          className="
            relative
            z-10

            border-b
            border-[#d4af37]/15

            bg-[#d4af37]/[0.08]

            px-5
            py-4

            sm:px-6
          "
        >
          <p
            className="
              flex
              items-center

              gap-2

              text-xs
              font-black

              uppercase

              tracking-[0.06em]

              text-[#ffd447]

              sm:text-sm
            "
          >
            <span>⚠️</span>

            Retirada mediante confirmação
          </p>
        </div>

        {/* CONTEÚDO */}

        <div
          className="
            relative
            z-10

            p-5

            sm:p-6
          "
        >
          <p
            className="
              max-w-3xl

              text-sm
              leading-7

              text-white/55
            "
          >
            Entre em contato com o anfitrião antes
            de realizar o pedido para confirmar se
            existe disponibilidade para retirada.
          </p>

          {/* =================================================
              HORÁRIOS
          ================================================== */}

          <div
            className="
              mt-6

              grid
              grid-cols-1

              gap-4

              sm:grid-cols-2
            "
          >
            {/* ALMOÇO */}

            <div
              className="
                group
                relative

                overflow-hidden

                rounded-[22px]

                border
                border-[#d4af37]/15

                bg-gradient-to-br
                from-[#18150d]
                via-[#100f0b]
                to-[#070707]

                p-5

                transition-all
                duration-300

                hover:-translate-y-1

                hover:border-[#d4af37]/40
              "
            >
              <div
                aria-hidden="true"
                className="
                  pointer-events-none

                  absolute
                  -right-10
                  -top-10

                  h-32
                  w-32

                  rounded-full

                  bg-[#ffcc33]/[0.06]

                  blur-[45px]
                "
              />

              <div
                className="
                  relative
                  z-10
                "
              >
                <div className="text-2xl">
                  ☀️
                </div>

                <p
                  className="
                    mt-4

                    text-[9px]
                    font-black

                    uppercase

                    tracking-[0.20em]

                    text-white/35
                  "
                >
                  Almoço
                </p>

                <p
                  className="
                    mt-2

                    text-[24px]
                    font-black

                    uppercase

                    tracking-[-0.03em]

                    text-white
                  "
                >
                  11h às 13h
                </p>
              </div>
            </div>

            {/* NOITE */}

            <div
              className="
                group
                relative

                overflow-hidden

                rounded-[22px]

                border
                border-white/10

                bg-gradient-to-br
                from-[#242424]
                via-[#151515]
                to-[#070707]

                p-5

                transition-all
                duration-300

                hover:-translate-y-1

                hover:border-white/20
              "
            >
              <div
                aria-hidden="true"
                className="
                  pointer-events-none

                  absolute
                  -right-10
                  -top-10

                  h-32
                  w-32

                  rounded-full

                  bg-white/[0.04]

                  blur-[45px]
                "
              />

              <div
                className="
                  relative
                  z-10
                "
              >
                <div className="text-2xl">
                  🌙
                </div>

                <p
                  className="
                    mt-4

                    text-[9px]
                    font-black

                    uppercase

                    tracking-[0.20em]

                    text-white/35
                  "
                >
                  Noite
                </p>

                <p
                  className="
                    mt-2

                    text-[24px]
                    font-black

                    uppercase

                    tracking-[-0.03em]

                    text-white
                  "
                >
                  20h às 22h
                </p>
              </div>
            </div>
          </div>

          {/* OBSERVAÇÃO */}

          <div
            className="
              mt-4

              rounded-2xl

              border
              border-white/[0.06]

              bg-white/[0.025]

              px-4
              py-3

              text-[11px]
              leading-5

              text-white/35

              sm:text-xs
            "
          >
            Os horários acima são períodos para
            consulta. A retirada depende de
            disponibilidade e confirmação prévia.
          </div>
        </div>
      </div>

      {/* =====================================================
          RESTAURANTES PARA RETIRADA
      ====================================================== */}

      {restaurantes.length > 0 ? (
        <div
          className="
            mt-7

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
                key={
                  restaurante.id
                }
                restaurante={
                  restaurante
                }
                onAbrir={
                  onAbrirRestaurante
                }
              />
            )
          )}
        </div>
      ) : (
        <div
          className="
            relative

            mt-7

            overflow-hidden

            rounded-[26px]

            border
            border-dashed
            border-[#d4af37]/20

            bg-gradient-to-br
            from-[#202020]
            via-[#101010]
            to-[#050505]

            px-6
            py-10

            text-center

            shadow-[0_18px_45px_rgba(0,0,0,0.30)]

            sm:py-12
          "
        >
          <div
            aria-hidden="true"
            className="
              pointer-events-none

              absolute
              left-1/2
              top-1/2

              h-36
              w-64

              -translate-x-1/2
              -translate-y-1/2

              rounded-full

              bg-[#d4af37]/[0.04]

              blur-[70px]
            "
          />

          <div
            className="
              relative
              z-10
            "
          >
            <div
              className="
                mx-auto

                flex
                h-14
                w-14

                items-center
                justify-center

                rounded-2xl

                border
                border-[#d4af37]/20

                bg-[#d4af37]/[0.06]

                text-2xl
              "
            >
              🛍️
            </div>

            <h3
              className="
                mt-5

                text-xl
                font-black

                uppercase

                tracking-[-0.02em]

                text-white
              "
            >
              Nenhuma opção disponível
            </h3>

            <p
              className="
                mx-auto
                mt-3

                max-w-lg

                text-sm
                leading-6

                text-white/40
              "
            >
              Ainda não temos restaurantes com
              retirada disponíveis nesta seleção.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default SecaoRetirada;