export function CatalogoHero() {
  return (
    <section
      className="
        relative
        overflow-hidden

        bg-black

        px-4
        pb-10
        pt-16

        text-center
        text-white

        sm:px-6
        sm:pb-14
        sm:pt-20
      "
    >
      {/* LUZ DOURADA */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none

          absolute
          left-1/2
          top-0

          h-[280px]
          w-[650px]

          -translate-x-1/2
          -translate-y-1/2

          rounded-full

          bg-[#d4af37]/10

          blur-[130px]
        "
      />

      {/* LUZ CINZA */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none

          absolute
          -right-32
          top-1/2

          h-[300px]
          w-[300px]

          rounded-full

          bg-white/[0.04]

          blur-[120px]
        "
      />

      <div
        className="
          relative
          z-10

          mx-auto
          max-w-4xl
        "
      >
        {/* SELO */}

        <div
          className="
            mx-auto

            inline-flex

            items-center
            justify-center

            gap-2

            rounded-full

            border
            border-[#d4af37]/40

            bg-gradient-to-r
            from-[#151515]
            via-[#252525]
            to-[#151515]

            px-5
            py-2
          "
        >
          <span className="text-sm">
            🍽️
          </span>

          <span
            className="
              text-[10px]
              font-black

              uppercase

              tracking-[0.22em]

              text-[#f0c93d]
            "
          >
            Experiência gastronômica
          </span>
        </div>

        {/* TÍTULO */}

        <h1
          className="
            mt-6

            text-3xl
            font-black

            leading-tight

            sm:text-4xl

            md:text-5xl

            lg:text-6xl
          "
          style={{
            textShadow:
              "0 3px 0 rgba(0,0,0,1), 0 8px 25px rgba(0,0,0,0.75)",
          }}
        >
          Descubra os sabores
          <span
            className="
              block

              bg-gradient-to-r
              from-[#d4af37]
              via-[#ffe476]
              to-[#d4af37]

              bg-clip-text

              text-transparent
            "
          >
            da Chapada
          </span>
        </h1>

        {/* DESCRIÇÃO */}

        <p
          className="
            mx-auto
            mt-6

            max-w-2xl

            text-sm
            leading-7

            text-white/55

            sm:text-base
          "
        >
          Explore nossos restaurantes parceiros,
          conheça os pratos disponíveis e escolha
          sua próxima experiência gastronômica
          durante sua estadia.
        </p>

        {/* DETALHE */}

        <div
          className="
            mx-auto
            mt-8

            h-px
            w-40

            bg-gradient-to-r

            from-transparent
            via-[#d4af37]
            to-transparent
          "
        />
      </div>
    </section>
  );
}