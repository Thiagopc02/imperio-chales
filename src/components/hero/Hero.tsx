import { HeroScene } from "./HeroScene";
import { HeroGallery } from "./HeroGallery";
import { ReservationButtons } from "./ReservationButtons";
import { HeroLights } from "./HeroLights";

export function Hero() {
  return (
    <section
      id="inicio"
      className="
        relative
        overflow-hidden
        bg-black
        pb-20
        text-white

        sm:pb-24
      "
    >
      {/* =====================================================
          ESPAÇO ABAIXO DO HEADER
      ====================================================== */}

      <div
        className="
          h-[72px]
          bg-black

          sm:h-20
          md:h-24
          lg:h-28
          xl:h-32
        "
      />

      {/* =====================================================
          CENÁRIO PRINCIPAL
      ====================================================== */}

      <HeroScene />

      {/* =====================================================
          LOGO + GALERIA DE FOTOS
      ====================================================== */}

      <HeroGallery />

      {/* =====================================================
          BOTÕES BOOKING E AIRBNB
      ====================================================== */}

      <ReservationButtons />

      {/* =====================================================
          LUZES DECORATIVAS
      ====================================================== */}

      <HeroLights />
    </section>
  );
}