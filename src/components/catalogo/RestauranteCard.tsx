import type {
  RestaurantePublico,
} from "./catalogoTypes";

type RestauranteCardProps = {
  restaurante: RestaurantePublico;

  onAbrir: (
    restaurante: RestaurantePublico
  ) => void;
};

export function RestauranteCard({
  restaurante,
  onAbrir,
}: RestauranteCardProps) {
  return (
    <article
      className="
        group
        relative

        overflow-hidden

        rounded-[26px]

        border
        border-white/10

        bg-gradient-to-br
        from-[#303030]
        via-[#171717]
        to-[#070707]

        text-white

        shadow-[0_18px_50px_rgba(0,0,0,0.40)]

        transition-all
        duration-300

        hover:-translate-y-1.5

        hover:border-[#d4af37]/55

        hover:shadow-[0_22px_60px_rgba(212,175,55,0.10)]
      "
    >
      {/* =====================================================
          BRILHO
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none

          absolute
          -right-20
          -top-20

          h-48
          w-48

          rounded-full

          bg-white/[0.07]

          blur-[65px]

          transition-all
          duration-300

          group-hover:bg-[#d4af37]/10
        "
      />

      {/* =====================================================
          CAPA
      ====================================================== */}

      {restaurante.imagemCapa ? (
        <div
          className="
            relative

            h-[180px]

            overflow-hidden

            bg-black
          "
        >
          <img
            src={restaurante.imagemCapa}
            alt={restaurante.nome}
            draggable={false}
            className="
              h-full
              w-full

              object-cover

              transition-transform
              duration-500

              group-hover:scale-[1.04]
            "
          />

          <div
            aria-hidden="true"
            className="
              absolute
              inset-0

              bg-gradient-to-t
              from-black/85
              via-black/15
              to-transparent
            "
          />
        </div>
      ) : (
        <div
          className="
            flex
            h-[110px]

            items-center
            justify-center

            bg-gradient-to-br
            from-[#232323]
            to-[#090909]
          "
        >
          <span className="text-4xl">
            🍽️
          </span>
        </div>
      )}

      {/* =====================================================
          CONTEÚDO
      ====================================================== */}

      <div
        className="
          relative
          z-10

          p-5
        "
      >
        {/* CABEÇALHO */}

        <div
          className="
            flex

            items-start

            gap-4
          "
        >
          {/* LOGO */}

          <div
            className="
              flex

              h-16
              w-16

              shrink-0

              items-center
              justify-center

              overflow-hidden

              rounded-2xl

              border
              border-white/15

              bg-black/50

              shadow-[0_8px_25px_rgba(0,0,0,0.35)]
            "
          >
            {restaurante.logoUrl ? (
              <img
                src={restaurante.logoUrl}
                alt={`Logo ${restaurante.nome}`}
                draggable={false}
                className="
                  h-full
                  w-full

                  object-cover
                "
              />
            ) : (
              <span className="text-2xl">
                🍴
              </span>
            )}
          </div>

          {/* NOME */}

          <div
            className="
              min-w-0
              flex-1
            "
          >
            <div
              className="
                inline-flex

                max-w-full

                rounded-full

                border
                border-[#d4af37]/35

                bg-[#d4af37]/10

                px-3
                py-1

                text-[9px]
                font-black

                uppercase

                tracking-[0.1em]

                text-[#f1cb43]
              "
            >
              {restaurante.categoria ||
                "Gastronomia"}
            </div>

            <h3
              className="
                mt-3

                text-xl
                font-black

                leading-tight

                text-white
              "
            >
              {restaurante.nome}
            </h3>
          </div>
        </div>

        {/* DESCRIÇÃO */}

        <p
          className="
            mt-5

            line-clamp-3

            min-h-[60px]

            text-sm
            leading-6

            text-white/50
          "
        >
          {restaurante.descricao ||
            "Conheça os pratos e opções disponíveis deste parceiro."}
        </p>

        {/* INFORMAÇÕES */}

        <div
          className="
            mt-5

            flex
            flex-wrap

            gap-2
          "
        >
          {restaurante.modalidadeEntrega ===
            "entrega_propria" && (
            <span
              className="
                rounded-full

                border
                border-emerald-400/25

                bg-emerald-400/10

                px-3
                py-1.5

                text-[10px]
                font-bold

                text-emerald-300
              "
            >
              🚚 Entrega própria
            </span>
          )}

          {restaurante.aceitaRetirada && (
            <span
              className="
                rounded-full

                border
                border-[#d4af37]/25

                bg-[#d4af37]/10

                px-3
                py-1.5

                text-[10px]
                font-bold

                text-[#f0cb49]
              "
            >
              🛍️ Retirada
            </span>
          )}

          {restaurante.horarioFuncionamento && (
            <span
              className="
                rounded-full

                border
                border-white/10

                bg-white/[0.04]

                px-3
                py-1.5

                text-[10px]
                font-bold

                text-white/55
              "
            >
              🕐 {restaurante.horarioFuncionamento}
            </span>
          )}
        </div>

        {/* BOTÃO */}

        <button
          type="button"
          onClick={() =>
            onAbrir(restaurante)
          }
          className="
            mt-6

            flex
            w-full

            items-center
            justify-between

            rounded-2xl

            border
            border-[#d4af37]/30

            bg-gradient-to-r
            from-[#1d1d1d]
            via-[#292929]
            to-[#1d1d1d]

            px-5
            py-4

            text-sm
            font-black

            text-white

            transition-all
            duration-300

            hover:border-[#d4af37]

            hover:bg-[#d4af37]

            hover:text-[#f4cf4a]
          "
        >
          <span>
            🍽️ Ver pratos e cardápio
          </span>

          <span
            className="
              transition-transform
              duration-300

              group-hover:translate-x-1
            "
          >
            →
          </span>
        </button>
      </div>
    </article>
  );
}