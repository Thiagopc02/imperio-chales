import type {
  PratoPublico,
  RestaurantePublico,
} from "./catalogoTypes";

type RestauranteModalProps = {
  restaurante: RestaurantePublico | null;

  pratos: PratoPublico[];

  carregandoPratos?: boolean;

  onFechar: () => void;

  onAdicionarPrato: (
    prato: PratoPublico
  ) => void;
};

export function RestauranteModal({
  restaurante,
  pratos,
  carregandoPratos = false,
  onFechar,
  onAdicionarPrato,
}: RestauranteModalProps) {
  if (!restaurante) {
    return null;
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[200]

        flex

        items-center
        justify-center

        bg-black/80

        p-3

        backdrop-blur-md

        sm:p-5
      "
      role="dialog"
      aria-modal="true"
      aria-label={`Cardápio de ${restaurante.nome}`}
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onFechar();
        }
      }}
    >
      <div
        className="
          relative

          flex

          max-h-[92vh]
          w-full
          max-w-5xl

          flex-col

          overflow-hidden

          rounded-[28px]

          border
          border-white/15

          bg-gradient-to-br
          from-[#222222]
          via-[#101010]
          to-black

          text-white

          shadow-[0_35px_120px_rgba(0,0,0,0.85)]
        "
      >
        {/* =====================================================
            CABEÇALHO
        ====================================================== */}

        <div
          className="
            relative

            shrink-0

            border-b
            border-white/10

            p-5

            sm:p-7
          "
        >
          <div
            aria-hidden="true"
            className="
              pointer-events-none

              absolute
              -right-24
              -top-24

              h-72
              w-72

              rounded-full

              bg-[#d4af37]/10

              blur-[100px]
            "
          />

          <div
            className="
              relative
              z-10

              flex

              items-start
              justify-between

              gap-5
            "
          >
            <div
              className="
                flex

                min-w-0

                items-center

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

                  bg-black/45
                "
              >
                {restaurante.logoUrl ? (
                  <img
                    src={restaurante.logoUrl}
                    alt={restaurante.nome}
                    className="
                      h-full
                      w-full

                      object-cover
                    "
                  />
                ) : (
                  <span className="text-2xl">
                    🍽️
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <p
                  className="
                    text-[9px]
                    font-black

                    uppercase

                    tracking-[0.2em]

                    text-[#d4af37]
                  "
                >
                  {restaurante.categoria}
                </p>

                <h2
                  className="
                    mt-1

                    truncate

                    text-2xl
                    font-black

                    sm:text-3xl
                  "
                >
                  {restaurante.nome}
                </h2>
              </div>
            </div>

            {/* FECHAR */}

            <button
              type="button"
              onClick={onFechar}
              aria-label="Fechar cardápio"
              className="
                flex

                h-11
                w-11

                shrink-0

                items-center
                justify-center

                rounded-full

                border
                border-white/15

                bg-black/40

                text-xl

                text-white/70

                transition-all
                duration-300

                hover:border-[#d4af37]
                hover:bg-[#d4af37]
                hover:text-black
              "
            >
              ×
            </button>
          </div>

          {restaurante.descricao && (
            <p
              className="
                relative
                z-10

                mt-5

                max-w-3xl

                text-sm
                leading-6

                text-white/50
              "
            >
              {restaurante.descricao}
            </p>
          )}
        </div>

        {/* =====================================================
            PRATOS
        ====================================================== */}

        <div
          className="
            flex-1

            overflow-y-auto

            p-5

            sm:p-7
          "
        >
          {carregandoPratos ? (
            <div
              className="
                flex

                min-h-[300px]

                items-center
                justify-center
              "
            >
              <div className="text-center">
                <div
                  className="
                    mx-auto

                    h-10
                    w-10

                    animate-spin

                    rounded-full

                    border-4
                    border-white/10
                    border-t-[#d4af37]
                  "
                />

                <p
                  className="
                    mt-4

                    text-sm

                    text-white/45
                  "
                >
                  Carregando pratos...
                </p>
              </div>
            </div>
          ) : pratos.length > 0 ? (
            <div
              className="
                grid
                grid-cols-1

                gap-4

                md:grid-cols-2
              "
            >
              {pratos.map((prato) => (
                <article
                  key={prato.id}
                  className="
                    overflow-hidden

                    rounded-[22px]

                    border
                    border-white/10

                    bg-gradient-to-br
                    from-[#2b2b2b]
                    via-[#171717]
                    to-[#090909]

                    transition-all
                    duration-300

                    hover:border-[#d4af37]/45
                  "
                >
                  {/* FOTO */}

                  {prato.imagemUrl && (
                    <div
                      className="
                        h-[190px]

                        overflow-hidden

                        bg-black
                      "
                    >
                      <img
                        src={prato.imagemUrl}
                        alt={prato.nome}
                        draggable={false}
                        className="
                          h-full
                          w-full

                          object-cover
                        "
                      />
                    </div>
                  )}

                  <div className="p-5">
                    <div
                      className="
                        flex

                        items-start
                        justify-between

                        gap-4
                      "
                    >
                      <div>
                        <h3
                          className="
                            text-lg
                            font-black

                            text-white
                          "
                        >
                          {prato.nome}
                        </h3>

                        {prato.pessoas > 0 && (
                          <p
                            className="
                              mt-1

                              text-xs

                              text-white/40
                            "
                          >
                            👥 Serve aproximadamente{" "}
                            {prato.pessoas}{" "}
                            {prato.pessoas === 1
                              ? "pessoa"
                              : "pessoas"}
                          </p>
                        )}
                      </div>

                      <strong
                        className="
                          whitespace-nowrap

                          text-lg
                          font-black

                          text-[#f0cb49]
                        "
                      >
                        R${" "}
                        {prato.preco.toLocaleString(
                          "pt-BR",
                          {
                            minimumFractionDigits:
                              2,
                            maximumFractionDigits:
                              2,
                          }
                        )}
                      </strong>
                    </div>

                    {prato.descricao && (
                      <p
                        className="
                          mt-4

                          text-sm
                          leading-6

                          text-white/45
                        "
                      >
                        {prato.descricao}
                      </p>
                    )}

                    <button
                      type="button"
                      disabled={
                        !prato.disponivel
                      }
                      onClick={() =>
                        onAdicionarPrato(
                          prato
                        )
                      }
                      className="
                        mt-5

                        flex
                        w-full

                        items-center
                        justify-center

                        gap-2

                        rounded-2xl

                        border
                        border-[#d4af37]/40

                        bg-gradient-to-r
                        from-[#cba425]
                        via-[#f0cf50]
                        to-[#cba425]

                        px-4
                        py-3

                        text-sm
                        font-black

                        text-black

                        transition-all
                        duration-300

                        hover:-translate-y-0.5
                        hover:brightness-110

                        disabled:cursor-not-allowed
                        disabled:border-white/10
                        disabled:bg-none
                        disabled:bg-[#222]
                        disabled:text-white/30
                      "
                    >
                      {prato.disponivel
                        ? "🛒 Adicionar"
                        : "Indisponível"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div
              className="
                flex

                min-h-[300px]

                items-center
                justify-center

                rounded-[24px]

                border
                border-dashed
                border-white/15

                bg-black/20

                p-8

                text-center
              "
            >
              <div>
                <div className="text-4xl">
                  🍽️
                </div>

                <h3
                  className="
                    mt-4

                    text-xl
                    font-black
                  "
                >
                  Cardápio em atualização
                </h3>

                <p
                  className="
                    mt-2

                    text-sm

                    text-white/40
                  "
                >
                  Ainda não encontramos pratos
                  disponíveis neste restaurante.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}