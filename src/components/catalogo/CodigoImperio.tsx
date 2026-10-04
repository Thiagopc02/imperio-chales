interface CodigoImperioProps {
  copiado: boolean;
  onCopiar: () => void;
}

export function CodigoImperio({
  copiado,
  onCopiar,
}: CodigoImperioProps) {
  return (
    <section
      id="codigo"
      className="
        relative

        mb-14

        scroll-mt-8

        overflow-hidden

        rounded-[28px]

        border
        border-[#d4af37]/25

        bg-gradient-to-br
        from-[#303030]
        via-[#161616]
        to-[#050505]

        p-6

        text-white

        shadow-[0_25px_70px_rgba(0,0,0,0.55)]

        md:p-10
      "
    >
      {/* LUZ */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none

          absolute
          -right-24
          -top-24

          h-[300px]
          w-[300px]

          rounded-full

          bg-[#d4af37]/10

          blur-[100px]
        "
      />

      <div
        className="
          relative
          z-10

          grid

          items-center

          gap-8

          md:grid-cols-2
        "
      >
        {/* TEXTO */}

        <div>
          <span
            className="
              text-[10px]
              font-black

              uppercase

              tracking-[0.3em]

              text-[#e6bf32]
            "
          >
            Seu código exclusivo
          </span>

          <h2
            className="
              mt-4

              text-3xl
              font-black

              leading-tight

              md:text-4xl
            "
          >
            Um toque de Império
            <span className="block text-[#e6bf32]">
              na sua experiência.
            </span>
          </h2>

          <p
            className="
              mt-5

              max-w-lg

              text-sm
              leading-7

              text-white/60
            "
          >
            Informe nosso código ao restaurante
            parceiro para identificar que você
            conheceu o estabelecimento através
            do Império Chalés.
          </p>

          <p
            className="
              mt-5

              text-xs

              text-white/35
            "
          >
            Código de indicação. Benefícios,
            disponibilidade e condições são
            definidos diretamente pelo estabelecimento.
          </p>
        </div>

        {/* CÓDIGO */}

        <div
          className="
            rounded-[24px]

            border
            border-[#d4af37]/35

            bg-black/45

            p-6

            text-center

            shadow-[inset_0_0_30px_rgba(212,175,55,0.035)]

            backdrop-blur-md
          "
        >
          <p
            className="
              text-[10px]
              font-black

              uppercase

              tracking-[0.24em]

              text-[#d4af37]
            "
          >
            Código de indicação
          </p>

          <strong
            className="
              mt-5
              block

              text-4xl
              font-black

              tracking-[0.22em]

              text-white

              sm:text-5xl
            "
            style={{
              textShadow:
                "0 3px 0 #000, 0 8px 20px rgba(0,0,0,0.65)",
            }}
          >
            IMPERIO
          </strong>

          <button
            type="button"
            onClick={onCopiar}
            className="
              mt-7

              flex
              w-full

              items-center
              justify-center

              gap-2

              rounded-2xl

              border
              border-[#d4af37]

              bg-gradient-to-r
              from-[#c69f22]
              via-[#f0cc49]
              to-[#c69f22]

              px-5
              py-4

              text-sm
              font-black

              uppercase

              text-black

              shadow-[0_10px_30px_rgba(212,175,55,0.15)]

              transition-all
              duration-300

              hover:-translate-y-1
              hover:brightness-110
            "
          >
            {copiado ? (
              <>✓ Código copiado!</>
            ) : (
              <>📋 Copiar código</>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}