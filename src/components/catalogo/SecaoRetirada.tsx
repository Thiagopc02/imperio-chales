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
        mb-16

        scroll-mt-8
      "
    >
      {/* =====================================================
          CABEÇALHO
      ====================================================== */}

      <div
        className="
          flex

          items-center

          gap-4
        "
      >
        <div
          className="
            flex

            h-12
            w-12

            shrink-0

            items-center
            justify-center

            rounded-2xl

            border
            border-[#d4af37]/25

            bg-[#d4af37]/10

            text-2xl
          "
        >
          🛍️
        </div>

        <div>
          <p
            className="
              text-[10px]
              font-black

              uppercase

              tracking-[0.25em]

              text-[#d4af37]
            "
          >
            Retirada sob consulta
          </p>

          <h2
            className="
              mt-1

              text-2xl
              font-black

              text-white

              sm:text-3xl
            "
          >
            Consulte o anfitrião
          </h2>
        </div>
      </div>

      {/* =====================================================
          AVISO
      ====================================================== */}

      <div
        className="
          mt-6

          overflow-hidden

          rounded-[24px]

          border
          border-[#d4af37]/30

          bg-gradient-to-br
          from-[#29261b]
          via-[#181713]
          to-[#0d0d0c]
        "
      >
        <div
          className="
            border-b
            border-[#d4af37]/15

            bg-[#d4af37]/10

            px-5
            py-4
          "
        >
          <p
            className="
              text-sm
              font-black

              text-[#f2cd47]
            "
          >
            ⚠️ Retirada mediante confirmação!
          </p>
        </div>

        <div
          className="
            p-5

            text-sm
            leading-7

            text-white/55
          "
        >
          Antes de realizar qualquer pedido ou
          pagamento, entre em contato com o
          anfitrião para verificar a
          disponibilidade da retirada.

          {/* HORÁRIOS */}

          <div
            className="
              mt-6

              grid
              grid-cols-1

              gap-3

              sm:grid-cols-2
            "
          >
            <div
              className="
                rounded-2xl

                border
                border-[#d4af37]/15

                bg-black/35

                p-5
              "
            >
              <div className="text-xl">
                ☀️
              </div>

              <p
                className="
                  mt-3

                  text-[10px]
                  font-black

                  uppercase

                  tracking-[0.16em]

                  text-white/40
                "
              >
                Almoço
              </p>

              <p
                className="
                  mt-1

                  text-lg
                  font-black

                  text-white
                "
              >
                11h às 13h
              </p>
            </div>

            <div
              className="
                rounded-2xl

                border
                border-white/10

                bg-gradient-to-br
                from-[#252525]
                to-[#0c0c0c]

                p-5
              "
            >
              <div className="text-xl">
                🌙
              </div>

              <p
                className="
                  mt-3

                  text-[10px]
                  font-black

                  uppercase

                  tracking-[0.16em]

                  text-white/40
                "
              >
                Noite
              </p>

              <p
                className="
                  mt-1

                  text-lg
                  font-black

                  text-white
                "
              >
                20h às 22h
              </p>
            </div>
          </div>

          <div
            className="
              mt-4

              rounded-xl

              bg-white/[0.035]

              px-4
              py-3

              text-xs
              leading-5

              text-white/40
            "
          >
            Esses horários são períodos para
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
        <div
          className="
            mt-7

            rounded-[26px]

            border
            border-dashed
            border-[#d4af37]/25

            bg-gradient-to-br
            from-[#252525]
            via-[#151515]
            to-[#080808]

            px-6
            py-12

            text-center
          "
        >
          <div className="text-3xl">
            🛍️
          </div>

          <h3
            className="
              mt-4

              text-xl
              font-black

              text-white
            "
          >
            Nenhuma opção encontrada
          </h3>

          <p
            className="
              mx-auto
              mt-3

              max-w-lg

              text-sm
              leading-6

              text-white/45
            "
          >
            Não encontramos restaurantes com
            retirada nos filtros selecionados.
          </p>
        </div>
      )}
    </section>
  );
}