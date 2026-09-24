import { useEffect, useState } from "react";

export function Hero() {
  // =====================================================
  // LINKS DE RESERVA
  // =====================================================

  const bookingUrl =
    "https://www.booking.com/Share-FHVMTMx";

  const airbnbUrl =
    "https://www.airbnb.com.br/rooms/1686557956117616858";

  // =====================================================
  // FOTOS DO CARROSSEL
  // =====================================================

  const fotos = [
    "/01.png",
    "/02.png",
    "/03.png",
    "/04.png",
    "/05.png",
    "/06.png",
    "/07.png",
    "/08.png",
    "/09.png",
    "/10.png",
  ];

  const [fotoAtual, setFotoAtual] = useState(0);

  useEffect(() => {
    const intervalo = window.setInterval(() => {
      setFotoAtual((atual) => (atual + 1) % fotos.length);
    }, 4500);

    return () => window.clearInterval(intervalo);
  }, [fotos.length]);

  const anterior = () => {
    setFotoAtual((atual) =>
      atual === 0 ? fotos.length - 1 : atual - 1
    );
  };

  const proxima = () => {
    setFotoAtual((atual) =>
      atual === fotos.length - 1 ? 0 : atual + 1
    );
  };

  // =====================================================
  // COMODIDADES
  // =====================================================

  const comodidades = [
    {
      icone: "☕",
      titulo: "Café da manhã",
      texto: "Gratuito",
    },
    {
      icone: "📶",
      titulo: "Wi-Fi",
      texto: "Internet disponível",
    },
    {
      icone: "❄️",
      titulo: "Ar-condicionado",
      texto: "Mais conforto",
    },
    {
      icone: "🚿",
      titulo: "Chuveiro quente",
      texto: "Banho confortável",
    },
    {
      icone: "🚗",
      titulo: "Estacionamento",
      texto: "Gratuito",
    },
    {
      icone: "🌿",
      titulo: "Natureza",
      texto: "Cercado pelo Cerrado",
    },
  ];

  return (
    <section
      id="inicio"
      className="
        relative
        min-h-screen
        overflow-hidden
        bg-black
        px-5
        pb-24
        pt-28
        text-white
        sm:px-6
      "
    >
      {/* =====================================================
          BRILHOS
      ====================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          -left-44
          top-20
          h-[520px]
          w-[520px]
          rounded-full
          bg-[#d4af37]/[0.06]
          blur-[160px]
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          -right-56
          bottom-20
          h-[650px]
          w-[650px]
          rounded-full
          bg-[#12382a]/10
          blur-[180px]
        "
      />

      {/* =====================================================
          HERO PRINCIPAL
      ====================================================== */}

      <div
        className="
          relative
          z-20
          mx-auto
          grid
          w-full
          max-w-7xl
          items-center
          gap-16
          lg:min-h-[860px]
          lg:grid-cols-[0.95fr_1.05fr]
        "
      >
        {/* =====================================================
            COLUNA ESQUERDA
        ====================================================== */}

        <div className="relative z-30 w-full max-w-3xl">
          {/* LOGO */}

          <img
            src="/imperio-sem-fundo.png"
            alt="Império Chalés - Vila do Sossego"
            className="
              w-full
              max-w-[570px]
              object-contain
              drop-shadow-[0_22px_35px_rgba(0,0,0,0.75)]
            "
          />

          {/* =================================================
              TEXTO
          ================================================== */}

          <div className="mt-3 max-w-2xl">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-9 bg-[#d4af37]" />

              <span
                className="
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.34em]
                  text-[#d4af37]
                "
              >
                Natureza • Conforto • Alto Paraíso
              </span>
            </div>

            <p
              className="
                text-base
                leading-8
                text-white/65
                sm:text-lg
                sm:leading-9
              "
            >
              No coração do Brasil, em meio à biodiversidade do Cerrado,
              o{" "}
              <strong className="font-semibold text-white">
                Império Chalés
              </strong>{" "}
              é um convite para desacelerar, respirar e contemplar a
              maestria incomparável da natureza.
            </p>

            <p className="mt-4 text-sm leading-7 text-white/45 sm:text-base">
              Em Alto Paraíso de Goiás, unimos tranquilidade, conforto e
              hospitalidade para tornar sua experiência na Chapada dos
              Veadeiros ainda mais especial.
            </p>
          </div>

          {/* =================================================
              COMODIDADES
          ================================================== */}

          <div className="mt-9">
            <div className="mb-5 flex flex-col gap-4">
              <p
                className="
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.3em]
                  text-white/35
                "
              >
                Tudo preparado para sua estadia
              </p>

              <a
                href="https://www.instagram.com/imperiochales3015rev?stkn=MW9tdGo0aG02Njk0cg%3D%3D&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Seguir Império Chalés no Instagram"
                className="
                  group
                  flex
                  w-full
                  items-center
                  justify-center
                  gap-4
                  rounded-2xl
                  border-2
                  border-white/15
                  bg-white/[0.04]
                  px-5
                  py-4
                  transition
                  duration-300
                  hover:-translate-y-0.5
                  hover:border-[#d4af37]/45
                  hover:bg-white/[0.06]
                  hover:shadow-[0_14px_35px_rgba(212,175,55,0.10)]
                "
              >
                <img
                  src="/instagram-logo.png"
                  alt="Instagram"
                  className="
                    h-10
                    w-10
                    shrink-0
                    rounded-xl
                    object-contain
                    transition
                    duration-300
                    group-hover:scale-110
                  "
                />

                <div className="leading-tight text-left">
                  <p
                    className="
                      text-[10px]
                      font-black
                      uppercase
                      tracking-[0.22em]
                      text-white/45
                    "
                  >
                    Siga a gente no Instagram
                  </p>

                  <p
                    className="
                      mt-1
                      text-base
                      font-black
                      text-white
                      transition
                      duration-300
                      group-hover:text-[#d4af37]
                      sm:text-lg
                    "
                  >
                    @imperiochales3015rev
                  </p>
                </div>
              </a>

              {/* RESERVA DIRETA COM DESCONTO NO PIX */}
              <a
                href="https://wa.me/5562996916206?text=Ol%C3%A1%21%20Vim%20pelo%20site%20do%20Imp%C3%A9rio%20Chal%C3%A9s%20e%20gostaria%20de%20fazer%20uma%20reserva%20diretamente%20com%20voc%C3%AAs%20aproveitando%20o%20desconto%20de%205%25%20no%20PIX."
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Reservar diretamente com 5% de desconto no PIX"
                className="
                  group
                  relative
                  mt-1
                  flex
                  w-full
                  items-center
                  justify-between
                  overflow-hidden
                  rounded-2xl
                  border-2
                  border-[#2997ff]/60
                  bg-gradient-to-r
                  from-[#0057b8]
                  via-[#0878df]
                  to-[#149cff]
                  px-5
                  py-4
                  shadow-[0_15px_45px_rgba(0,119,255,0.22)]
                  transition
                  duration-300
                  hover:-translate-y-1
                  hover:border-[#75c2ff]
                  hover:shadow-[0_20px_55px_rgba(0,140,255,0.34)]
                  sm:px-6
                  sm:py-5
                "
              >
                <div
                  className="
                    pointer-events-none
                    absolute
                    -left-32
                    top-0
                    h-full
                    w-24
                    rotate-12
                    bg-white/20
                    blur-xl
                    transition-all
                    duration-700
                    group-hover:left-[110%]
                  "
                />

                <div className="relative z-10 pr-3">
                  <p
                    className="
                      text-[9px]
                      font-black
                      uppercase
                      tracking-[0.24em]
                      text-white/75
                      sm:text-[10px]
                    "
                  >
                    Reserva direta com a gente
                  </p>

                  <p
                    className="
                      mt-1
                      text-lg
                      font-black
                      leading-tight
                      text-white
                      sm:text-xl
                    "
                    style={{
                      textShadow:
                        "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000",
                    }}
                  >
                    5% de desconto no PIX
                  </p>

                  <p className="mt-1 text-[10px] text-white/75 sm:text-xs">
                    Fale diretamente conosco pelo WhatsApp
                  </p>
                </div>

                <div
                  className="
                    relative
                    z-10
                    flex
                    h-16
                    w-16
                    shrink-0
                    flex-col
                    items-center
                    justify-center
                    rounded-full
                    border-2
                    border-white/45
                    bg-black/20
                    shadow-[0_0_25px_rgba(255,255,255,0.14)]
                    backdrop-blur-sm
                    sm:h-20
                    sm:w-20
                  "
                >
                  <span
                    className="
                      text-xl
                      font-black
                      text-white
                      sm:text-2xl
                    "
                    style={{
                      textShadow: "1px 1px 0 #000",
                    }}
                  >
                    5%
                  </span>

                  <span
                    className="
                      text-[7px]
                      font-bold
                      uppercase
                      tracking-wider
                      text-white/75
                    "
                  >
                    OFF PIX
                  </span>
                </div>
              </a>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {comodidades.map((item) => (
                <div
                  key={item.titulo}
                  className="
                    rounded-2xl
                    border
                    border-white/[0.09]
                    bg-white/[0.02]
                    p-4
                    transition
                    duration-300
                    hover:-translate-y-1
                    hover:border-[#d4af37]/30
                    hover:bg-white/[0.04]
                  "
                >
                  <span className="text-xl">
                    {item.icone}
                  </span>

                  <h3 className="mt-3 text-xs font-semibold text-white sm:text-sm">
                    {item.titulo}
                  </h3>

                  <p className="mt-1 text-[10px] text-white/35 sm:text-xs">
                    {item.texto}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* =================================================
              BOOKING E AIRBNB
          ================================================== */}

          <div className="mt-8">
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-white/[0.08]" />

              <p
                className="
                  whitespace-nowrap
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.28em]
                  text-[#d4af37]
                "
              >
                Encontre-nos também
              </p>

              <span className="h-px flex-1 bg-white/[0.08]" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* =============================================
                  BOOKING
              ============================================== */}

              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Reservar Império Chalés pelo Booking"
                className="
                  group
                  relative
                  min-h-[145px]
                  overflow-hidden
                  rounded-2xl
                  border
                  border-[#1677ff]/20
                  bg-gradient-to-br
                  from-[#061323]
                  via-[#07101a]
                  to-black
                  transition
                  duration-300
                  hover:-translate-y-1
                  hover:border-[#4da3ff]/55
                  hover:shadow-[0_18px_45px_rgba(0,100,255,0.16)]
                  sm:min-h-[165px]
                "
              >
                <div
                  className="
                    pointer-events-none
                    absolute
                    -right-10
                    top-1/2
                    h-40
                    w-40
                    -translate-y-1/2
                    rounded-full
                    bg-[#1677ff]/10
                    blur-[50px]
                  "
                />

                <div className="absolute bottom-4 left-4 z-20">
                  <p
                    className="
                      text-[8px]
                      font-semibold
                      uppercase
                      tracking-[0.25em]
                      text-[#71b7ff]
                    "
                  >
                    Reserve pela
                  </p>

                  <h3 className="mt-1 text-sm font-bold text-white sm:text-base">
                    Booking
                  </h3>

                  <p
                    className="
                      mt-1
                      text-[9px]
                      text-[#71b7ff]/70
                      opacity-0
                      transition
                      duration-300
                      group-hover:opacity-100
                    "
                  >
                    Abrir página de reserva ↗
                  </p>
                </div>

                <img
                  src="/booking-person.png"
                  alt="Booking"
                  className="
                    absolute
                    -right-5
                    -top-2
                    z-10
                    w-[125px]
                    object-contain
                    transition
                    duration-500
                    group-hover:-translate-y-1
                    group-hover:scale-105
                    sm:w-[150px]
                  "
                />
              </a>

              {/* =============================================
                  AIRBNB
              ============================================== */}

              <a
                href={airbnbUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Reservar Império Chalés pelo Airbnb"
                className="
                  group
                  relative
                  min-h-[145px]
                  overflow-hidden
                  rounded-2xl
                  border
                  border-[#ff5a5f]/20
                  bg-gradient-to-br
                  from-[#21090b]
                  via-[#110809]
                  to-black
                  transition
                  duration-300
                  hover:-translate-y-1
                  hover:border-[#ff777b]/55
                  hover:shadow-[0_18px_45px_rgba(255,90,95,0.14)]
                  sm:min-h-[165px]
                "
              >
                <div
                  className="
                    pointer-events-none
                    absolute
                    -right-10
                    top-1/2
                    h-40
                    w-40
                    -translate-y-1/2
                    rounded-full
                    bg-[#ff5a5f]/10
                    blur-[50px]
                  "
                />

                <div className="absolute bottom-4 left-4 z-20">
                  <p
                    className="
                      text-[8px]
                      font-semibold
                      uppercase
                      tracking-[0.25em]
                      text-[#ff9497]
                    "
                  >
                    Reserve pelo
                  </p>

                  <h3 className="mt-1 text-sm font-bold text-white sm:text-base">
                    Airbnb
                  </h3>

                  <p
                    className="
                      mt-1
                      text-[9px]
                      text-[#ff9497]/70
                      opacity-0
                      transition
                      duration-300
                      group-hover:opacity-100
                    "
                  >
                    Abrir página de reserva ↗
                  </p>
                </div>

                <img
                  src="/airbnb-person.png"
                  alt="Airbnb"
                  className="
                    absolute
                    -right-4
                    -top-1
                    z-10
                    w-[120px]
                    object-contain
                    transition
                    duration-500
                    group-hover:-translate-y-1
                    group-hover:scale-105
                    sm:w-[145px]
                  "
                />
              </a>
            </div>
          </div>
        </div>

        {/* =====================================================
            CENA DIREITA
        ====================================================== */}

        <div className="relative z-20 hidden min-h-[720px] lg:block">
          {/* FUNDO */}

          <div
            className="
              absolute
              bottom-0
              left-1/2
              h-[520px]
              w-full
              -translate-x-1/2
              rounded-[42px]
              border
              border-[#d4af37]/12
              bg-black
            "
          />

          {/* IMPÉRIO */}

          <div
            className="
              pointer-events-none
              absolute
              left-1/2
              top-[-15px]
              z-50
              w-[480px]
              -translate-x-1/2
              xl:w-[540px]
            "
          >
            <img
              src="/imperio-person.png"
              alt="Império Chalés"
              className="
                w-full
                object-contain
                animate-[imperioFlutuar_5s_ease-in-out_infinite]
              "
            />
          </div>

          {/* RAIO */}

          <div
            className="
              pointer-events-none
              absolute
              left-1/2
              top-[305px]
              z-20
              h-[310px]
              w-[245px]
              -translate-x-1/2
              opacity-80
            "
            style={{
              background:
                "linear-gradient(to bottom, rgba(195,245,255,0.65), rgba(92,210,255,0.38), rgba(66,190,255,0))",
              clipPath:
                "polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)",
              filter: "blur(2px)",
            }}
          />

          {/* BOOKING */}

          <div
            className="
              absolute
              left-1/2
              top-[405px]
              z-40
              w-[190px]
              -translate-x-1/2
            "
          >
            <img
              src="/booking-person.png"
              alt="Booking"
              className="
                w-full
                object-contain
                animate-[bookingAbducao_4s_ease-in-out_infinite]
              "
            />
          </div>

          {/* AIRBNB */}

          <div
            className="
              absolute
              bottom-[-18px]
              right-[-20px]
              z-50
              w-[245px]
            "
          >
            <img
              src="/airbnb-person.png"
              alt="Airbnb"
              className="
                w-full
                object-contain
                animate-[airbnbAjuda_3.6s_ease-in-out_infinite]
              "
            />
          </div>

          {/* TEXTO */}

          <div
            className="
              absolute
              bottom-9
              left-7
              z-40
              max-w-[250px]
            "
          >
            <p
              className="
                text-[9px]
                font-semibold
                uppercase
                tracking-[0.35em]
                text-[#d4af37]
              "
            >
              Escolha como reservar
            </p>

            <h2 className="mt-3 text-xl font-semibold leading-tight xl:text-2xl">
              Booking, Airbnb ou direto conosco.
            </h2>

            <p className="mt-3 text-xs text-white/45">
              Você escolhe a plataforma que preferir.
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          CARROSSEL DE FOTOS
      ====================================================== */}

      <div
        id="galeria"
        className="
          relative
          z-30
          mx-auto
          mt-20
          w-full
          max-w-7xl
        "
      >
        {/* TÍTULO */}

        <div className="mb-7 text-center">
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-[#d4af37]" />

            <p
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.38em]
                text-[#d4af37]
              "
            >
              Conheça o Império Chalés
            </p>

            <span className="h-px w-10 bg-[#d4af37]" />
          </div>

          <h2
            className="
              mt-4
              text-2xl
              font-semibold
              text-white
              sm:text-3xl
              md:text-4xl
            "
          >
            Um pouco do que espera por você
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/45">
            Explore nossos chalés, ambientes e detalhes antes mesmo de
            chegar a Alto Paraíso.
          </p>
        </div>

        {/* CARROSSEL */}

        <div
          className="
            relative
            overflow-hidden
            rounded-[26px]
            border
            border-[#d4af37]/15
            bg-[#050505]
            shadow-[0_30px_80px_rgba(0,0,0,0.65)]
            sm:rounded-[34px]
          "
        >
          <div
            className="
              relative
              h-[260px]
              w-full
              sm:h-[420px]
              lg:h-[570px]
            "
          >
            {fotos.map((foto, index) => (
              <img
                key={foto}
                src={foto}
                alt={`Império Chalés - foto ${index + 1}`}
                className={`
                  absolute
                  inset-0
                  h-full
                  w-full
                  object-cover
                  transition-all
                  duration-1000
                  ${
                    index === fotoAtual
                      ? "scale-100 opacity-100"
                      : "scale-[1.04] opacity-0"
                  }
                `}
              />
            ))}

            {/* DEGRADÊ */}

            <div
              className="
                pointer-events-none
                absolute
                inset-0
                bg-gradient-to-t
                from-black/45
                via-transparent
                to-black/15
              "
            />

            {/* CONTADOR */}

            <div
              className="
                absolute
                right-4
                top-4
                rounded-full
                border
                border-white/15
                bg-black/55
                px-3
                py-1.5
                text-[10px]
                font-semibold
                tracking-[0.15em]
                text-white
                backdrop-blur-md
                sm:right-6
                sm:top-6
              "
            >
              {String(fotoAtual + 1).padStart(2, "0")} / 10
            </div>

            {/* SETA ESQUERDA */}

            <button
              type="button"
              onClick={anterior}
              aria-label="Foto anterior"
              className="
                absolute
                left-3
                top-1/2
                flex
                h-10
                w-10
                -translate-y-1/2
                items-center
                justify-center
                rounded-full
                border
                border-white/20
                bg-black/55
                text-xl
                text-white
                backdrop-blur-md
                transition
                hover:border-[#d4af37]
                hover:text-[#d4af37]
                sm:left-6
                sm:h-12
                sm:w-12
              "
            >
              ‹
            </button>

            {/* SETA DIREITA */}

            <button
              type="button"
              onClick={proxima}
              aria-label="Próxima foto"
              className="
                absolute
                right-3
                top-1/2
                flex
                h-10
                w-10
                -translate-y-1/2
                items-center
                justify-center
                rounded-full
                border
                border-white/20
                bg-black/55
                text-xl
                text-white
                backdrop-blur-md
                transition
                hover:border-[#d4af37]
                hover:text-[#d4af37]
                sm:right-6
                sm:h-12
                sm:w-12
              "
            >
              ›
            </button>

            {/* INDICADORES */}

            <div
              className="
                absolute
                bottom-4
                left-1/2
                flex
                -translate-x-1/2
                gap-2
                sm:bottom-6
              "
            >
              {fotos.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Ver foto ${index + 1}`}
                  onClick={() => setFotoAtual(index)}
                  className={`
                    h-1.5
                    rounded-full
                    transition-all
                    duration-300
                    ${
                      fotoAtual === index
                        ? "w-7 bg-[#d4af37]"
                        : "w-1.5 bg-white/45 hover:bg-white"
                    }
                  `}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          CENA MOBILE
      ====================================================== */}

      <div
        className="
          relative
          z-30
          mx-auto
          mt-16
          max-w-[520px]
          lg:hidden
        "
      >
        <div
          className="
            relative
            min-h-[570px]
            overflow-hidden
            rounded-[32px]
            border
            border-[#d4af37]/15
            bg-black
          "
        >
          <img
            src="/imperio-person.png"
            alt="Império Chalés"
            className="
              absolute
              left-1/2
              top-[-10px]
              z-40
              w-[330px]
              max-w-[95%]
              -translate-x-1/2
              object-contain
              animate-[imperioFlutuar_5s_ease-in-out_infinite]
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              left-1/2
              top-[205px]
              h-[250px]
              w-[160px]
              -translate-x-1/2
            "
            style={{
              background:
                "linear-gradient(to bottom, rgba(180,240,255,0.5), rgba(80,200,255,0.18), transparent)",
              clipPath:
                "polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)",
            }}
          />

          <img
            src="/booking-person.png"
            alt="Booking"
            className="
              absolute
              left-[48%]
              top-[270px]
              z-30
              w-[145px]
              -translate-x-1/2
              object-contain
              animate-[bookingAbducao_4s_ease-in-out_infinite]
            "
          />

          <img
            src="/airbnb-person.png"
            alt="Airbnb"
            className="
              absolute
              bottom-[-5px]
              right-[-10px]
              z-40
              w-[170px]
              object-contain
              animate-[airbnbAjuda_3.6s_ease-in-out_infinite]
            "
          />

          <div
            className="
              absolute
              bottom-8
              left-6
              z-50
              max-w-[190px]
            "
          >
            <p className="text-[9px] uppercase tracking-[0.3em] text-[#d4af37]">
              Reserve como preferir
            </p>

            <p className="mt-2 text-lg font-semibold leading-tight">
              Booking, Airbnb ou direto conosco.
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          ANIMAÇÕES
      ====================================================== */}

      <style>{`
        @keyframes imperioFlutuar {
          0%, 100% {
            transform: translateY(0px);
          }

          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes bookingAbducao {
          0%, 100% {
            transform: translateY(15px) rotate(-3deg);
          }

          50% {
            transform: translateY(-25px) rotate(3deg);
          }
        }

        @keyframes airbnbAjuda {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }

          50% {
            transform: translateY(-12px) rotate(-3deg);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          [class*="imperioFlutuar"],
          [class*="bookingAbducao"],
          [class*="airbnbAjuda"] {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}