export function Footer() {
  const instagramUrl =
    "https://www.instagram.com/imperiochales3015rev";

  const whatsappUrl =
    "https://wa.me/556299691620";

  return (
    <footer
      className="
        relative
        overflow-hidden

        border-t
        border-[#d4af37]/20

        bg-black

        px-4
        py-12

        text-white

        sm:px-6
        sm:py-14
      "
    >
      {/* =====================================================
          LUZ DECORATIVA
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none

          absolute
          left-1/2
          top-0

          h-[180px]
          w-[500px]

          -translate-x-1/2
          -translate-y-1/2

          rounded-full

          bg-[#d4af37]/10

          blur-[100px]
        "
      />

      {/* =====================================================
          CONTEÚDO PRINCIPAL
      ====================================================== */}

      <div
        className="
          relative
          z-10

          mx-auto

          flex
          w-full
          max-w-6xl

          flex-col

          items-center
          justify-between

          gap-8

          md:flex-row
        "
      >
        {/* =================================================
            MARCA
        ================================================== */}

        <div
          className="
            flex
            flex-col

            items-center

            text-center

            md:items-start
            md:text-left
          "
        >
          <img
            src="/centro.png"
            alt="Império Chalés"
            draggable={false}
            className="
              w-[95px]

              object-contain

              drop-shadow-[0_0_14px_rgba(255,255,255,0.14)]

              select-none
            "
          />

          <p
            className="
              mt-4

              text-sm
              font-black

              text-white
            "
          >
            Império Chalés
          </p>

          <p
            className="
              mt-1

              text-xs

              text-white/45
            "
          >
            Vila do Sossego • Alto Paraíso de Goiás
          </p>
        </div>

        {/* =================================================
            BOTÕES
        ================================================== */}

        <div
          className="
            flex
            w-full

            flex-col

            gap-3

            sm:w-auto
            sm:flex-row
          "
        >
          {/* =================================================
              INSTAGRAM
          ================================================== */}

          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Abrir Instagram da Império Chalés"
            className="
              group
              relative

              flex

              min-h-[62px]

              items-center
              justify-center

              gap-3

              overflow-hidden

              rounded-2xl

              border
              border-white/25

              bg-white

              px-5
              py-3

              text-xs
              font-black
              uppercase

              tracking-[0.05em]

              text-black

              shadow-[0_10px_30px_rgba(0,0,0,0.40)]

              transition-all
              duration-300

              hover:-translate-y-1
              hover:scale-[1.02]

              hover:border-[#ff2a7f]/60

              hover:shadow-[0_0_28px_rgba(255,42,127,0.25)]
            "
          >
            {/* BRILHO */}

            <span
              aria-hidden="true"
              className="
                pointer-events-none

                absolute
                -left-[35%]
                -top-[120%]

                h-[320%]
                w-[28%]

                rotate-[22deg]

                bg-white/50

                blur-lg

                transition-all
                duration-700

                group-hover:left-[125%]
              "
            />

            {/* LOGO INSTAGRAM */}

            <img
              src="/instagram-3d.png"
              alt=""
              aria-hidden="true"
              draggable={false}
              className="
                relative
                z-10

                h-11
                w-11

                shrink-0

                object-contain

                drop-shadow-[0_5px_10px_rgba(255,0,110,0.30)]

                transition-all
                duration-300

                group-hover:-rotate-6
                group-hover:scale-110
              "
            />

            <span
              className="
                relative
                z-10
              "
            >
              Siga nosso Instagram
            </span>
          </a>

          {/* =================================================
              WHATSAPP
          ================================================== */}

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Falar com a Império Chalés pelo WhatsApp"
            className="
              group
              relative

              flex

              min-h-[62px]

              items-center
              justify-center

              gap-3

              overflow-hidden

              rounded-2xl

              border
              border-white/25

              bg-white

              px-5
              py-3

              text-xs
              font-black
              uppercase

              tracking-[0.05em]

              text-black

              shadow-[0_10px_30px_rgba(0,0,0,0.40)]

              transition-all
              duration-300

              hover:-translate-y-1
              hover:scale-[1.02]

              hover:border-[#25D366]/60

              hover:shadow-[0_0_28px_rgba(37,211,102,0.25)]
            "
          >
            {/* BRILHO */}

            <span
              aria-hidden="true"
              className="
                pointer-events-none

                absolute
                -left-[35%]
                -top-[120%]

                h-[320%]
                w-[28%]

                rotate-[22deg]

                bg-white/50

                blur-lg

                transition-all
                duration-700

                group-hover:left-[125%]
              "
            />

            {/* LOGO WHATSAPP */}

            <img
              src="/whatsapp.png"
              alt=""
              aria-hidden="true"
              draggable={false}
              className="
                relative
                z-10

                h-11
                w-11

                shrink-0

                object-contain

                drop-shadow-[0_5px_10px_rgba(37,211,102,0.30)]

                transition-all
                duration-300

                group-hover:rotate-6
                group-hover:scale-110
              "
            />

            <span
              className="
                relative
                z-10
              "
            >
              Falar no WhatsApp
            </span>
          </a>
        </div>
      </div>

      {/* =====================================================
          LINHA INFERIOR
      ====================================================== */}

      <div
        className="
          relative
          z-10

          mx-auto
          mt-10

          max-w-6xl

          border-t
          border-white/10

          pt-6

          text-center
        "
      >
        <p
          className="
            text-[10px]

            uppercase

            tracking-[0.14em]

            text-white/35
          "
        >
          © {new Date().getFullYear()} Império Chalés • Vila do Sossego
        </p>
      </div>
    </footer>
  );
}