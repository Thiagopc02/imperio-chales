export function Header() {
  const whatsappNumber = "5562996916206";

  const whatsappMessage = encodeURIComponent(
    "Olá! Vim pelo site do Império Chalés e gostaria de saber mais sobre as hospedagens."
  );

  return (
    <header
      className="
        fixed
        left-0
        top-0
        z-[100]
        w-full
        bg-black
      "
    >
      {/* =====================================================
          BORDA DOURADA ANIMADA
      ====================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="header-gold-border absolute inset-0" />
      </div>

      {/* =====================================================
          CONTEÚDO
      ====================================================== */}

      <div
        className="
          relative
          z-10

          mx-auto

          flex
          h-[72px]
          w-full
          max-w-7xl

          items-center
          justify-between

          gap-2

          px-2.5

          sm:h-20
          sm:gap-3
          sm:px-4

          md:gap-4
          md:px-6

          lg:px-8
        "
      >
        {/* =================================================
            COROA
        ================================================== */}

        <a
          href="/"
          aria-label="Ir para a página inicial"
          className="
            flex
            shrink-0
            items-center
            justify-center
          "
        >
          <img
            src="/coroa.png"
            alt="Coroa Império Chalés"
            draggable={false}
            className="
              h-9
              w-auto
              object-contain

              drop-shadow-[0_4px_14px_rgba(255,255,255,0.10)]

              sm:h-11
              md:h-13
              lg:h-14
            "
          />
        </a>

        {/* =================================================
            BOTÕES
        ================================================== */}

        <div
          className="
            flex
            min-w-0
            flex-1

            items-center
            justify-end

            gap-2

            sm:gap-3
            md:gap-4
          "
        >
          {/* =================================================
              CARDÁPIO
          ================================================== */}

          <a
            href="/cardapio"
            aria-label="Abrir cardápio"
            className="
              group

              flex
              min-w-0

              items-center
              justify-center

              gap-2

              rounded-[13px]

              border
              border-white/90

              bg-white

              px-2
              py-2

              text-[9px]
              font-black
              uppercase

              tracking-[0.02em]

              text-black

              shadow-[0_8px_24px_rgba(255,255,255,0.08)]

              transition-all
              duration-300

              hover:-translate-y-0.5
              hover:bg-[#f5f5f5]
              hover:shadow-[0_12px_30px_rgba(255,255,255,0.15)]

              sm:gap-2.5
              sm:rounded-[14px]
              sm:px-3
              sm:py-2.5
              sm:text-[11px]

              md:gap-3
              md:px-4
              md:text-[12px]

              lg:px-5
              lg:text-sm
            "
          >
            {/* ÍCONE */}

            <span
              className="
                flex

                h-8
                w-8

                shrink-0

                items-center
                justify-center

                overflow-hidden

                rounded-[9px]

                border
                border-black/10

                bg-[#f2f2f2]

                shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_5px_12px_rgba(0,0,0,0.14)]

                transition
                duration-300

                group-hover:scale-[1.06]

                sm:h-9
                sm:w-9

                md:h-10
                md:w-10
              "
            >
              <img
                src="/cardapio.png"
                alt=""
                aria-hidden="true"
                draggable={false}
                className="
                  h-[84%]
                  w-[84%]
                  object-contain
                  select-none
                "
              />
            </span>

            {/* TEXTO MOBILE */}

            <span className="whitespace-nowrap sm:hidden">
              Cardápio
            </span>

            {/* TEXTO TABLET/DESKTOP */}

            <span className="hidden whitespace-nowrap sm:inline">
              Ver cardápio
            </span>
          </a>

          {/* =================================================
              WHATSAPP
          ================================================== */}

          <a
            href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Entrar em contato pelo WhatsApp"
            className="
              group

              flex
              min-w-0

              items-center
              justify-center

              gap-2

              rounded-[13px]

              border
              border-white/90

              bg-white

              px-2
              py-2

              text-[9px]
              font-black
              uppercase

              tracking-[0.02em]

              text-black

              shadow-[0_8px_24px_rgba(255,255,255,0.08)]

              transition-all
              duration-300

              hover:-translate-y-0.5
              hover:bg-[#f5f5f5]
              hover:shadow-[0_12px_30px_rgba(255,255,255,0.15)]

              sm:gap-2.5
              sm:rounded-[14px]
              sm:px-3
              sm:py-2.5
              sm:text-[11px]

              md:gap-3
              md:px-4
              md:text-[12px]

              lg:px-5
              lg:text-sm
            "
          >
            {/* ÍCONE */}

            <span
              className="
                flex

                h-8
                w-8

                shrink-0

                items-center
                justify-center

                overflow-hidden

                rounded-[9px]

                border
                border-black/10

                bg-[#f2f2f2]

                shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_5px_12px_rgba(0,0,0,0.14)]

                transition
                duration-300

                group-hover:scale-[1.06]

                sm:h-9
                sm:w-9

                md:h-10
                md:w-10
              "
            >
              <img
                src="/whatsapp.png"
                alt=""
                aria-hidden="true"
                draggable={false}
                className="
                  h-[84%]
                  w-[84%]
                  object-contain
                  select-none
                "
              />
            </span>

            {/* TEXTO MOBILE */}

            <span className="whitespace-nowrap sm:hidden">
              WhatsApp
            </span>

            {/* TEXTO TABLET */}

            <span className="hidden whitespace-nowrap sm:inline lg:hidden">
              Falar no WhatsApp
            </span>

            {/* TEXTO DESKTOP */}

            <span className="hidden whitespace-nowrap lg:inline">
              Entrar em contato pelo WhatsApp
            </span>
          </a>
        </div>
      </div>

      {/* =====================================================
          ESTILOS DA BORDA DOURADA
      ====================================================== */}

      <style>{`
        .header-gold-border {
          border-bottom: 1px solid rgba(212, 175, 55, 0.16);
        }

        .header-gold-border::before {
          content: "";
          position: absolute;
          inset: -2px;

          background: linear-gradient(
            90deg,
            transparent 0%,
            transparent 35%,
            rgba(212, 175, 55, 0.10) 42%,
            rgba(255, 226, 128, 1) 50%,
            rgba(212, 175, 55, 0.25) 58%,
            transparent 66%,
            transparent 100%
          );

          background-size: 250% 100%;

          animation: headerGoldRun 4s linear infinite;

          -webkit-mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);

          -webkit-mask-composite: xor;

          mask-composite: exclude;

          padding: 1px;
        }

        .header-gold-border::after {
          content: "";

          position: absolute;

          bottom: 0;
          left: -180px;

          width: 180px;
          height: 1px;

          background: linear-gradient(
            90deg,
            transparent,
            rgba(212, 175, 55, 0.30),
            rgba(255, 235, 160, 1),
            rgba(212, 175, 55, 0.30),
            transparent
          );

          filter:
            drop-shadow(
              0 0 7px rgba(212, 175, 55, 0.9)
            );

          animation: headerGoldBeam 3s linear infinite;
        }

        @keyframes headerGoldRun {
          from {
            background-position: 200% 0;
          }

          to {
            background-position: -50% 0;
          }
        }

        @keyframes headerGoldBeam {
          from {
            left: -180px;
          }

          to {
            left: 100%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .header-gold-border::before,
          .header-gold-border::after {
            animation: none;
          }
        }
      `}</style>
    </header>
  );
}

export default Header;