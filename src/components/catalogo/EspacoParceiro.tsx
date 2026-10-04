import { Link } from "react-router-dom";

import parceiroIcone from "./parceiro-icone.png";
import estabelecimentoIcone from "./estabelecimento.png";

export function EspacoParceiro() {
  return (
    <section
      className="
        relative
        overflow-hidden

        px-3
        py-12

        sm:px-5
        sm:py-14

        md:px-6
        md:py-16

        lg:px-8
        lg:py-20
      "
      style={{
        background:
          "linear-gradient(to bottom, #000000 0%, #080808 10%, #5d5d5d 28%, #b8b8b8 50%, #5d5d5d 72%, #080808 90%, #000000 100%)",
      }}
    >
      {/* =====================================================
          LUZ SUAVE CENTRAL
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-1/2
          top-1/2

          h-[420px]
          w-[88%]

          -translate-x-1/2
          -translate-y-1/2

          rounded-full

          bg-white/[0.055]

          blur-[120px]
        "
      />

      <div
        className="
          relative
          z-10

          mx-auto
          w-full
          max-w-7xl
        "
      >
        {/* ===================================================
            CARD PRINCIPAL
        =================================================== */}

        <div
          className="
            relative
            overflow-hidden

            rounded-[24px]

            border
            border-white/10

            bg-gradient-to-br
            from-[#111111]
            via-[#090909]
            to-black

            px-4
            py-6

            shadow-[0_30px_75px_rgba(0,0,0,0.45)]

            sm:rounded-[26px]
            sm:px-6
            sm:py-8

            md:px-8
            md:py-10

            lg:rounded-[30px]
            lg:px-10
            lg:py-12
          "
        >
          {/* BRILHO INTERNO */}

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              left-[35%]
              top-1/2

              h-[240px]
              w-[240px]

              -translate-y-1/2

              rounded-full

              bg-white/[0.03]

              blur-[95px]
            "
          />

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              -bottom-24
              right-10

              h-[240px]
              w-[240px]

              rounded-full

              bg-[#00ff78]/[0.05]

              blur-[105px]
            "
          />

          {/* =================================================
              CONTEÚDO
          ================================================= */}

          <div
            className="
              relative
              z-10

              grid
              grid-cols-1

              items-center

              gap-8

              xl:grid-cols-[1.15fr_0.85fr]
              xl:gap-12
            "
          >
            {/* =================================================
                LADO ESQUERDO
            ================================================= */}

            <div
              className="
                min-w-0
                max-w-3xl
              "
            >
              {/* SELO */}

              <div
                className="
                  inline-flex
                  max-w-full

                  items-center

                  rounded-full

                  border
                  border-white/10

                  bg-[#0b0b0b]

                  px-3
                  py-2

                  text-[8px]
                  font-black

                  uppercase

                  tracking-[0.12em]

                  text-white/80

                  shadow-[0_8px_22px_rgba(0,0,0,0.28)]

                  min-[360px]:text-[9px]

                  sm:px-4
                  sm:text-[10px]
                  sm:tracking-[0.16em]
                "
              >
                Sabores da Chapada • Parceiros
              </div>

              {/* TÍTULO */}

              <h2
                className="
                  mt-5

                  max-w-full

                  font-black

                  uppercase

                  text-white

                  tracking-[-0.035em]

                  leading-[0.92]

                  text-[34px]

                  min-[360px]:text-[38px]

                  sm:text-[48px]

                  md:text-[56px]

                  lg:text-[64px]

                  xl:text-[68px]
                "
                style={{
                  fontFamily:
                    "'Arial Black', 'Montserrat', sans-serif",

                  textShadow:
                    "0 2px 0 rgba(0,0,0,0.90), 0 10px 30px rgba(0,0,0,0.40)",
                }}
              >
                Seu
                <br />

                estabelecimento
                <br />

                <span
                  className="
                    text-[#25f47c]
                  "
                  style={{
                    textShadow:
                      "0 0 18px rgba(37,244,124,0.20)",
                  }}
                >
                  aqui.
                </span>
              </h2>

              {/* FRASE */}

              <p
                className="
                  mt-5

                  max-w-2xl

                  text-[13px]
                  leading-6

                  text-white/70

                  sm:mt-6
                  sm:text-sm
                  sm:leading-7

                  md:text-base
                  md:leading-8
                "
              >
                Vem ser nosso parceiro e ganhar dinheiro
                sem ser cobrado por nada.
              </p>
            </div>

            {/* =================================================
                LADO DIREITO
            ================================================= */}

            <div
              className="
                flex
                w-full
                min-w-0

                flex-col

                gap-3

                sm:gap-4

                xl:max-w-[430px]
                xl:justify-self-end
              "
            >
              {/* =================================================
                  BOTÃO PARCEIRO
              ================================================= */}

              <Link
                to="/parceiro/login"
                className="
                  group

                  relative

                  flex
                  w-full

                  min-h-[82px]

                  items-center

                  gap-3

                  overflow-hidden

                  rounded-[20px]

                  border
                  border-white/15

                  bg-gradient-to-r
                  from-[#555555]
                  via-[#333333]
                  to-[#151515]

                  px-4
                  py-3

                  text-left
                  text-white

                  shadow-[0_12px_30px_rgba(0,0,0,0.34)]

                  transition-all
                  duration-300

                  hover:-translate-y-1

                  hover:border-white/30

                  hover:shadow-[0_18px_40px_rgba(0,0,0,0.45)]

                  sm:min-h-[92px]
                  sm:gap-4
                  sm:rounded-[24px]
                  sm:px-5
                  sm:py-4
                "
              >
                {/* LUZ */}

                <div
                  aria-hidden="true"
                  className="
                    pointer-events-none

                    absolute
                    -left-12
                    top-1/2

                    h-28
                    w-28

                    -translate-y-1/2

                    rounded-full

                    bg-white/[0.07]

                    blur-[38px]
                  "
                />

                {/* ÍCONE 3D PARCEIRO */}

                <div
                  className="
                    relative
                    z-10

                    flex

                    h-[56px]
                    w-[56px]

                    shrink-0

                    items-center
                    justify-center

                    rounded-[16px]

                    bg-white/[0.08]

                    shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]

                    sm:h-[68px]
                    sm:w-[68px]
                    sm:rounded-[18px]
                  "
                >
                  <img
                    src={parceiroIcone}
                    alt="Parceiro"
                    draggable={false}
                    className="
                      h-[48px]
                      w-[48px]

                      object-contain

                      drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)]

                      transition-all
                      duration-300

                      group-hover:-rotate-3
                      group-hover:scale-110

                      sm:h-[58px]
                      sm:w-[58px]
                    "
                  />
                </div>

                {/* TEXTO */}

                <div
                  className="
                    relative
                    z-10

                    min-w-0
                    flex-1
                  "
                >
                  <p
                    className="
                      text-[8px]
                      font-black

                      uppercase

                      tracking-[0.13em]

                      text-white/45

                      sm:text-[9px]
                      sm:tracking-[0.16em]
                    "
                  >
                    Já faz parte?
                  </p>

                  <p
                    className="
                      mt-1

                      break-words

                      text-[16px]
                      font-black

                      uppercase

                      leading-[1.08]

                      tracking-[-0.02em]

                      text-white

                      sm:text-[20px]
                    "
                  >
                    Sou parceiro
                  </p>
                </div>

                {/* SETA */}

                <span
                  className="
                    relative
                    z-10

                    shrink-0

                    text-lg

                    text-white/65

                    transition-transform
                    duration-300

                    group-hover:translate-x-1
                    group-hover:text-white

                    sm:text-xl
                  "
                >
                  →
                </span>
              </Link>

              {/* =================================================
                  BOTÃO ESTABELECIMENTO
              ================================================= */}

              <Link
                to="/parceiro/cadastro"
                className="
                  group

                  relative

                  flex
                  w-full

                  min-h-[88px]

                  items-center

                  gap-3

                  overflow-hidden

                  rounded-[20px]

                  border
                  border-[#25f47c]/70

                  bg-gradient-to-r
                  from-[#29ff83]
                  via-[#16ee70]
                  to-[#00c958]

                  px-4
                  py-3

                  text-left
                  text-black

                  shadow-[0_0_18px_rgba(37,244,124,0.28),0_18px_40px_rgba(0,0,0,0.35)]

                  transition-all
                  duration-300

                  hover:-translate-y-1

                  hover:scale-[1.01]

                  hover:shadow-[0_0_30px_rgba(37,244,124,0.42),0_22px_45px_rgba(0,0,0,0.40)]

                  sm:min-h-[94px]
                  sm:gap-4
                  sm:rounded-[24px]
                  sm:px-5
                  sm:py-4
                "
              >
                {/* BRILHO PASSANDO */}

                <div
                  aria-hidden="true"
                  className="
                    pointer-events-none

                    absolute

                    -left-28
                    top-0

                    h-full
                    w-24

                    rotate-[20deg]

                    bg-white/25

                    blur-xl

                    transition-all
                    duration-700

                    group-hover:left-[120%]
                  "
                />

                {/* ÍCONE 3D ESTABELECIMENTO */}

                <div
                  className="
                    relative
                    z-10

                    flex

                    h-[58px]
                    w-[58px]

                    shrink-0

                    items-center
                    justify-center

                    rounded-[16px]

                    bg-black/10

                    shadow-[inset_0_1px_0_rgba(255,255,255,0.24)]

                    sm:h-[70px]
                    sm:w-[70px]
                    sm:rounded-[18px]
                  "
                >
                  <img
                    src={estabelecimentoIcone}
                    alt="Estabelecimento"
                    draggable={false}
                    className="
                      h-[50px]
                      w-[50px]

                      object-contain

                      drop-shadow-[0_8px_16px_rgba(0,0,0,0.22)]

                      transition-all
                      duration-300

                      group-hover:rotate-2
                      group-hover:scale-110

                      sm:h-[62px]
                      sm:w-[62px]
                    "
                  />
                </div>

                {/* TEXTO */}

                <div
                  className="
                    relative
                    z-10

                    min-w-0
                    flex-1
                  "
                >
                  <p
                    className="
                      text-[8px]
                      font-black

                      uppercase

                      tracking-[0.13em]

                      text-black/50

                      sm:text-[9px]
                      sm:tracking-[0.16em]
                    "
                  >
                    Quero fazer parte
                  </p>

                  <p
                    className="
                      mt-1

                      break-words

                      text-[14px]
                      font-black

                      uppercase

                      leading-[1.08]

                      tracking-[-0.02em]

                      text-black

                      min-[360px]:text-[15px]

                      sm:text-[18px]

                      md:text-[19px]
                    "
                  >
                    Cadastrar meu
                    estabelecimento
                  </p>
                </div>

                {/* SETA */}

                <span
                  className="
                    relative
                    z-10

                    shrink-0

                    text-lg
                    font-black

                    text-black/65

                    transition-transform
                    duration-300

                    group-hover:translate-x-1
                    group-hover:text-black

                    sm:text-xl
                  "
                >
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EspacoParceiro;