import guerreiroBooking from "./gerreiro01.png";
import guerreiroAirbnb from "./gerreiro02.png";

import bookingIcon from "./b.png";
import airbnbIcon from "./a1.png";

export function ReservationButtons() {
  /* =========================================================
      LINKS DE RESERVA
  ========================================================= */

  const bookingUrl =
    "https://www.booking.com/hotel/br/imperio-chales-vila-so-sossego.pt-br.html";

  const airbnbUrl =
    "https://www.airbnb.com.br/rooms/1686557956117616858?source_impression_id=p3_1790425927_P3ygxOFL8bkSRYNg";

  return (
    <div
      className="
        relative
        z-40

        mx-auto
        mt-[120px]

        flex
        w-full
        max-w-3xl

        items-center
        justify-center

        gap-4
        px-4

        overflow-visible

        sm:mt-[150px]
        sm:gap-6
        sm:px-6
      "
    >
      {/* =====================================================
          BOOKING
      ====================================================== */}

      <div
        className="
          group
          relative
          flex-1
          overflow-visible
        "
      >
        {/* PERSONAGEM BOOKING */}

        <img
          src={guerreiroBooking}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="
            pointer-events-none
            absolute

            bottom-[54px]
            left-1/2

            z-[70]

            w-[135px]
            max-w-none

            -translate-x-1/2

            object-contain
            select-none

            drop-shadow-[0_20px_32px_rgba(0,132,255,0.50)]

            transition-all
            duration-300

            group-hover:-translate-y-2
            group-hover:scale-[1.04]

            sm:bottom-[58px]
            sm:w-[175px]

            md:w-[195px]
            lg:w-[210px]
          "
        />

        {/* NEON AZUL PRINCIPAL */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute

            left-1/2
            top-1/2

            h-[90%]
            w-[94%]

            -translate-x-1/2
            -translate-y-1/2

            rounded-[30px]

            bg-[#008cff]/75

            blur-[32px]

            opacity-90

            transition-all
            duration-300

            group-hover:w-full
            group-hover:bg-[#00a2ff]
            group-hover:opacity-100
            group-hover:blur-[38px]
          "
        />

        {/* NEON AZUL INFERIOR */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute

            -bottom-5
            left-1/2

            h-[34px]
            w-[76%]

            -translate-x-1/2

            rounded-full

            bg-[#008cff]/80

            blur-[26px]

            transition-all
            duration-300

            group-hover:w-[90%]
            group-hover:bg-[#00a2ff]
          "
        />

        {/* BOTÃO BOOKING */}

        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Abrir página da Império Chalés na Booking"
          className="
            relative
            z-20

            flex
            min-h-[62px]
            w-full

            items-center
            justify-center

            gap-3

            overflow-hidden

            rounded-[18px]

            border
            border-white/90

            bg-gradient-to-br
            from-[#0864c9]
            via-[#087ee8]
            to-[#0092ff]

            px-4
            py-3

            text-center
            text-[11px]
            font-black
            uppercase
            tracking-[0.06em]
            text-white

            transition-all
            duration-300

            hover:-translate-y-1.5
            hover:scale-[1.018]

            hover:border-white

            sm:min-h-[68px]
            sm:text-sm
          "
          style={{
            boxShadow:
              "0 0 8px rgba(255,255,255,0.38), 0 0 22px rgba(0,140,255,0.72), 0 16px 38px rgba(0,0,0,0.60)",
          }}
        >
          {/* LINHA LUMINOSA */}

          <span
            aria-hidden="true"
            className="
              pointer-events-none
              absolute

              inset-x-5
              top-0

              h-px

              bg-gradient-to-r
              from-transparent
              via-white
              to-transparent
            "
          />

          {/* REFLEXO */}

          <span
            aria-hidden="true"
            className="
              pointer-events-none
              absolute

              -left-[35%]
              -top-[100%]

              h-[300%]
              w-[30%]

              rotate-[22deg]

              bg-white/15

              blur-lg

              transition-all
              duration-700

              group-hover:left-[120%]
            "
          />

          {/* ÍCONE 3D BOOKING */}

          <span
            className="
              relative
              z-10

              flex
              h-10
              w-10
              shrink-0

              items-center
              justify-center

              transition-all
              duration-300

              group-hover:-rotate-3
              group-hover:scale-110

              sm:h-11
              sm:w-11
            "
          >
            <img
              src={bookingIcon}
              alt="Booking"
              draggable={false}
              className="
                h-[34px]
                w-[34px]

                object-contain
                select-none

                drop-shadow-[0_3px_7px_rgba(0,0,0,0.28)]

                sm:h-[38px]
                sm:w-[38px]
              "
            />
          </span>

          <span className="relative z-10">
            Vamos para Booking
          </span>
        </a>
      </div>

      {/* =====================================================
          AIRBNB
      ====================================================== */}

      <div
        className="
          group
          relative
          flex-1
          overflow-visible
        "
      >
        {/* PERSONAGEM AIRBNB */}

        <img
          src={guerreiroAirbnb}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="
            pointer-events-none
            absolute

            bottom-[54px]
            left-1/2

            z-[70]

            w-[140px]
            max-w-none

            -translate-x-1/2

            object-contain
            select-none

            drop-shadow-[0_20px_32px_rgba(255,63,113,0.50)]

            transition-all
            duration-300

            group-hover:-translate-y-2
            group-hover:scale-[1.04]

            sm:bottom-[58px]
            sm:w-[180px]

            md:w-[200px]
            lg:w-[215px]
          "
        />

        {/* NEON ROSA PRINCIPAL */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute

            left-1/2
            top-1/2

            h-[90%]
            w-[94%]

            -translate-x-1/2
            -translate-y-1/2

            rounded-[30px]

            bg-[#ff3f71]/75

            blur-[32px]

            opacity-90

            transition-all
            duration-300

            group-hover:w-full
            group-hover:bg-[#ff5b83]
            group-hover:opacity-100
            group-hover:blur-[38px]
          "
        />

        {/* NEON ROSA INFERIOR */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute

            -bottom-5
            left-1/2

            h-[34px]
            w-[76%]

            -translate-x-1/2

            rounded-full

            bg-[#ff3f71]/80

            blur-[26px]

            transition-all
            duration-300

            group-hover:w-[90%]
            group-hover:bg-[#ff5b83]
          "
        />

        {/* BOTÃO AIRBNB */}

        <a
          href={airbnbUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Abrir página da Império Chalés no Airbnb"
          className="
            relative
            z-20

            flex
            min-h-[62px]
            w-full

            items-center
            justify-center

            gap-3

            overflow-hidden

            rounded-[18px]

            border
            border-white/90

            bg-gradient-to-br
            from-[#e84668]
            via-[#f24f70]
            to-[#ff6381]

            px-4
            py-3

            text-center
            text-[11px]
            font-black
            uppercase
            tracking-[0.06em]
            text-white

            transition-all
            duration-300

            hover:-translate-y-1.5
            hover:scale-[1.018]

            hover:border-white

            sm:min-h-[68px]
            sm:text-sm
          "
          style={{
            boxShadow:
              "0 0 8px rgba(255,255,255,0.38), 0 0 22px rgba(255,63,113,0.70), 0 16px 38px rgba(0,0,0,0.60)",
          }}
        >
          {/* LINHA LUMINOSA */}

          <span
            aria-hidden="true"
            className="
              pointer-events-none
              absolute

              inset-x-5
              top-0

              h-px

              bg-gradient-to-r
              from-transparent
              via-white
              to-transparent
            "
          />

          {/* REFLEXO */}

          <span
            aria-hidden="true"
            className="
              pointer-events-none
              absolute

              -left-[35%]
              -top-[100%]

              h-[300%]
              w-[30%]

              rotate-[22deg]

              bg-white/15

              blur-lg

              transition-all
              duration-700

              group-hover:left-[120%]
            "
          />

          {/* ÍCONE 3D AIRBNB */}

          <span
            className="
              relative
              z-10

              flex
              h-10
              w-10
              shrink-0

              items-center
              justify-center

              transition-all
              duration-300

              group-hover:rotate-3
              group-hover:scale-110

              sm:h-11
              sm:w-11
            "
          >
            <img
              src={airbnbIcon}
              alt="Airbnb"
              draggable={false}
              className="
                h-[34px]
                w-[34px]

                object-contain
                select-none

                drop-shadow-[0_3px_7px_rgba(0,0,0,0.28)]

                sm:h-[38px]
                sm:w-[38px]
              "
            />
          </span>

          <span className="relative z-10">
            Vamos para Airbnb
          </span>
        </a>
      </div>
    </div>
  );
}