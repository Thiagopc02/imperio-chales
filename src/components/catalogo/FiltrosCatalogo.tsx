import {
  categorias,
} from "./catalogoConstants";

interface FiltrosCatalogoProps {
  busca: string;

  categoria: string;

  quantidadeResultados: number;

  onBuscaChange: (
    valor: string
  ) => void;

  onCategoriaChange: (
    categoria: string
  ) => void;
}

export function FiltrosCatalogo({
  busca,
  categoria,
  quantidadeResultados,
  onBuscaChange,
  onCategoriaChange,
}: FiltrosCatalogoProps) {
  return (
    <section
      id="categorias"
      className="
        mb-14
        scroll-mt-8
      "
    >
      {/* CABEÇALHO */}

      <div>
        <span
          className="
            text-[10px]
            font-black

            uppercase

            tracking-[0.3em]

            text-[#d4af37]
          "
        >
          Escolha sua experiência
        </span>

        <h2
          className="
            mt-3

            text-3xl
            font-black

            text-white

            md:text-4xl
          "
        >
          O que vamos comer hoje?
        </h2>

        <p
          className="
            mt-3

            text-sm

            text-white/45

            sm:text-base
          "
        >
          Escolha uma categoria ou encontre
          seu restaurante preferido.
        </p>
      </div>

      {/* BUSCA */}

      <div
        className="
          relative

          mt-8
        "
      >
        <div
          className="
            pointer-events-none

            absolute
            left-5
            top-1/2

            -translate-y-1/2

            text-lg
          "
        >
          🔎
        </div>

        <input
          type="search"
          value={busca}
          onChange={(event) =>
            onBuscaChange(
              event.target.value
            )
          }
          placeholder="Buscar restaurantes ou especialidades..."
          className="
            w-full

            rounded-2xl

            border
            border-white/15

            bg-gradient-to-r
            from-[#242424]
            via-[#171717]
            to-[#0c0c0c]

            py-5
            pl-14
            pr-6

            text-sm

            text-white

            outline-none

            placeholder:text-white/30

            shadow-[0_12px_30px_rgba(0,0,0,0.30)]

            transition-all
            duration-300

            focus:border-[#d4af37]/70

            focus:shadow-[0_0_30px_rgba(212,175,55,0.08)]
          "
        />
      </div>

      {/* CATEGORIAS */}

      <div
        className="
          mt-8

          grid
          grid-cols-2

          gap-3

          sm:grid-cols-3

          lg:grid-cols-4
        "
      >
        {categorias.map((item) => {
          const ativo =
            categoria === item.nome;

          return (
            <button
              key={item.nome}
              type="button"
              onClick={() =>
                onCategoriaChange(
                  item.nome
                )
              }
              aria-pressed={ativo}
              className={`
                group

                relative

                flex
                min-h-[125px]

                flex-col

                items-center
                justify-center

                overflow-hidden

                rounded-[22px]

                border

                p-4

                text-center

                shadow-[0_12px_30px_rgba(0,0,0,0.25)]

                transition-all
                duration-300

                hover:-translate-y-1

                ${
                  ativo
                    ? `
                      border-[#d4af37]/70

                      bg-gradient-to-br
                      from-[#3a331c]
                      via-[#1e1b12]
                      to-[#090909]
                    `
                    : `
                      border-white/10

                      bg-gradient-to-br
                      from-[#303030]
                      via-[#171717]
                      to-[#080808]

                      hover:border-white/25
                    `
                }
              `}
            >
              <span
                className="
                  relative
                  z-10

                  mb-3

                  text-3xl

                  transition-transform
                  duration-300

                  group-hover:scale-110
                "
              >
                {item.icone}
              </span>

              <span
                className={`
                  relative
                  z-10

                  text-sm
                  font-black

                  ${
                    ativo
                      ? "text-[#f0c93d]"
                      : "text-white"
                  }
                `}
              >
                {item.nome}
              </span>

              {ativo && (
                <div
                  aria-hidden="true"
                  className="
                    pointer-events-none

                    absolute
                    inset-0

                    bg-[#d4af37]/[0.035]
                  "
                />
              )}
            </button>
          );
        })}
      </div>

      {/* RESULTADOS */}

      <div
        className="
          mt-6

          flex
          flex-wrap

          items-center
          justify-between

          gap-3

          text-sm

          text-white/40
        "
      >
        <p>
          Categoria:{" "}
          <strong
            className="
              text-[#d4af37]
            "
          >
            {categoria}
          </strong>
        </p>

        <p>
          <strong className="text-white">
            {quantidadeResultados}
          </strong>{" "}
          {quantidadeResultados === 1
            ? "restaurante disponível"
            : "restaurantes disponíveis"}
        </p>
      </div>
    </section>
  );
}