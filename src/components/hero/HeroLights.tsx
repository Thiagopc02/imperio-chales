export function HeroLights() {
  return (
    <>
      {/* =====================================================
          LUZ DOURADA
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute

          -left-44
          bottom-28

          h-[420px]
          w-[420px]

          rounded-full

          bg-[#d4af37]/[0.035]

          blur-[150px]
        "
      />

      {/* =====================================================
          LUZ VERDE
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute

          -right-44
          bottom-40

          h-[520px]
          w-[520px]

          rounded-full

          bg-[#12382a]/[0.08]

          blur-[170px]
        "
      />
    </>
  );
}