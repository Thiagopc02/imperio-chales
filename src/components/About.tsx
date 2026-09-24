export function About() {
  return (
    <section
      id="sobre"
      className="relative overflow-hidden bg-[#0d0f0d] py-28 text-white"
    >

      {/* EFEITO DE FUNDO */}
      <div
        className="
          pointer-events-none
          absolute right-0 top-0
          h-[450px] w-[450px]
          rounded-full
          bg-[#174b37]/15
          blur-[140px]
        "
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2">

        {/* ESQUERDA */}
        <div>

          <div className="flex items-center gap-4">
            <span className="h-px w-10 bg-[#d4af37]" />

            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-[#d4af37]">
              Sobre o Império Chalés
            </span>
          </div>

          <h2 className="mt-6 text-4xl font-bold leading-tight md:text-5xl">
            Muito mais que uma hospedagem.
          </h2>

          <p className="mt-8 text-lg leading-8 text-white/65">
            O Império Chalés oferece uma experiência de tranquilidade e
            conforto em uma das regiões mais especiais de Goiás.
          </p>

          <p className="mt-5 text-lg leading-8 text-white/65">
            Estamos em Alto Paraíso de Goiás, na Chapada dos Veadeiros, com
            chalés aconchegantes, café da manhã incluso, Wi-Fi, chuveiro quente,
            estacionamento e área de camping.
          </p>

          <p className="mt-5 text-lg leading-8 text-white/65">
            Um espaço pensado para casais, famílias, amigos e viajantes que
            desejam descansar e aproveitar a natureza.
          </p>

          {/* CARDS */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2">

            <div className="rounded-2xl border border-[#d4af37]/15 bg-white/[0.025] p-6">
              <h3 className="text-xl font-bold text-[#d4af37]">
                Café da manhã
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/55">
                Comece o dia com mais tranquilidade e comodidade.
              </p>
            </div>

            <div className="rounded-2xl border border-[#d4af37]/15 bg-white/[0.025] p-6">
              <h3 className="text-xl font-bold text-[#d4af37]">
                Wi-Fi
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/55">
                Internet disponível durante a sua hospedagem.
              </p>
            </div>

            <div className="rounded-2xl border border-[#d4af37]/15 bg-white/[0.025] p-6">
              <h3 className="text-xl font-bold text-[#d4af37]">
                Camping
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/55">
                Espaço para quem deseja viver ainda mais perto da natureza.
              </p>
            </div>

            <div className="rounded-2xl border border-[#d4af37]/15 bg-white/[0.025] p-6">
              <h3 className="text-xl font-bold text-[#d4af37]">
                Alto Paraíso
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/55">
                No coração de uma das regiões mais incríveis do Brasil.
              </p>
            </div>

          </div>

        </div>

        {/* DIREITA */}
        <div className="relative">

          <div
            className="
              relative
              min-h-[520px]
              overflow-hidden
              rounded-[36px]
              border border-[#d4af37]/15
              bg-gradient-to-br
              from-[#183e2f]
              via-[#101712]
              to-[#080a09]
              p-10
              shadow-[0_30px_80px_rgba(0,0,0,0.45)]
            "
          >

            <div className="flex h-full min-h-[440px] flex-col justify-end">

              <span className="text-6xl">
                🌿
              </span>

              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.35em] text-[#d4af37]">
                Chapada dos Veadeiros
              </p>

              <h3 className="mt-5 max-w-lg text-4xl font-bold leading-tight">
                Natureza, sossego e conforto em um só lugar.
              </h3>

              <p className="mt-5 max-w-md leading-7 text-white/55">
                Em breve colocaremos aqui uma das melhores fotos reais do
                Império Chalés.
              </p>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}