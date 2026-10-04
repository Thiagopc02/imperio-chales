import type {
  RestaurantePublico,
} from "./catalogoTypes";

import {
  RestauranteCard,
} from "./RestauranteCard";

type SecaoEntregaProps = {
  restaurantes: RestaurantePublico[];

  onAbrirRestaurante: (
    restaurante: RestaurantePublico
  ) => void;
};

export function SecaoEntrega({
  restaurantes,
  onAbrirRestaurante,
}: SecaoEntregaProps) {
  return (
    <section
      id="entrega"
      className="
        mb-14

        scroll-mt-8
      "
    >
      {/* =====================================================
          TÍTULO
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
            border-emerald-400/20

            bg-emerald-400/10

            text-2xl
          "
        >
          🚚
        </div>

        <div>
          <p
            className="
              text-[10px]
              font-black

              uppercase

              tracking-[0.25em]

              text-emerald-400
            "
          >
            Entrega direta
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
            Receba no seu chalé
          </h2>
        </div>
      </div>

      {/* =====================================================
          EXPLICAÇÃO
      ====================================================== */}

      <div
        className="
          mt-5

          rounded-2xl

          border
          border-emerald-400/15

          bg-gradient-to-r
          from-[#102019]
          via-[#17251e]
          to-[#0d1712]

          p-4

          text-sm
          leading-6

          text-white/60
        "
      >
        <strong className="text-emerald-300">
          Como funciona?
        </strong>{" "}

        Escolha o restaurante, conheça os pratos
        e prepare sua consulta. O estabelecimento
        confirma disponibilidade, preço final,
        pagamento e entrega.
      </div>

      {/* =====================================================
          RESTAURANTES
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
            border-white/15

            bg-gradient-to-br
            from-[#202020]
            via-[#121212]
            to-[#070707]

            px-6
            py-12

            text-center
          "
        >
          <div className="text-3xl">
            🤝
          </div>

          <h3
            className="
              mt-4

              text-xl
              font-black

              text-white
            "
          >
            Nossos parceiros gastronômicos
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
            Em breve você conhecerá os
            estabelecimentos parceiros do
            Império Chalés.
          </p>
        </div>
      )}
    </section>
  );
}