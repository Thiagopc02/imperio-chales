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
          h-20
          w-full
          max-w-7xl
          items-center
          justify-end
          gap-2
          px-3
          sm:gap-3
          sm:px-5
          md:px-8
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
            items-center
            justify-center
            gap-2
            rounded-full
            border
            border-[#d4af37]
            bg-[#d4af37]
            px-4
            py-3
            text-[9px]
            font-black
            uppercase
            tracking-[0.08em]
            text-white
            shadow-[0_0_20px_rgba(212,175,55,0.18)]
            transition
            duration-300
            hover:-translate-y-0.5
            hover:bg-[#e7c34d]
            hover:shadow-[0_0_28px_rgba(212,175,55,0.32)]
            sm:px-5
            sm:text-xs
          "
          style={{
            WebkitTextStroke: "0.25px #000000",
            textShadow:
              "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000",
          }}
        >
          <span
            className="
              flex
              h-5
              w-5
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-black
              text-[12px]
            "
            style={{
              WebkitTextStroke: "0px transparent",
              textShadow: "none",
            }}
          >
            🍽️
          </span>

          <span className="hidden sm:inline">
            Ver cardápio
          </span>

          <span className="sm:hidden">
            Cardápio
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
            items-center
            justify-center
            gap-2
            rounded-full
            border
            border-[#25D366]
            bg-[#25D366]
            px-4
            py-3
            text-[9px]
            font-black
            uppercase
            tracking-[0.08em]
            text-white
            shadow-[0_0_20px_rgba(37,211,102,0.20)]
            transition
            duration-300
            hover:-translate-y-0.5
            hover:bg-[#20bd5a]
            hover:shadow-[0_0_28px_rgba(37,211,102,0.35)]
            sm:px-5
            sm:text-xs
          "
          style={{
            WebkitTextStroke: "0.25px #000000",
            textShadow:
              "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000",
          }}
        >
          <span
            className="
              flex
              h-5
              w-5
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-white
              text-[12px]
            "
            style={{
              WebkitTextStroke: "0px transparent",
              textShadow: "none",
            }}
          >
            💬
          </span>

          <span className="hidden sm:inline">
            Entrar em contato pelo WhatsApp
          </span>

          <span className="sm:hidden">
            WhatsApp
          </span>
        </a>
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

          animation:
            headerGoldRun 4s linear infinite;

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

          animation:
            headerGoldBeam 3s linear infinite;
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