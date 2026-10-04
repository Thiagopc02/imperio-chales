import type {
  RestaurantePublico,
} from "./catalogoTypes";

import entregaIcon from "./entrega.png";
import restauranteIcon from "./restaurante-emoji.png";

type RestauranteCardProps = {
  restaurante: RestaurantePublico;

  onAbrir: (
    restaurante: RestaurantePublico
  ) => void;
};

export function RestauranteCard({
  restaurante,
  onAbrir,
}: RestauranteCardProps) {
  const temEntrega =
    restaurante.modalidadeEntrega ===
    "entrega_propria";

  return (
    <article
      id={`restaurante-${restaurante.id}`}
      className="
        group
        relative

        overflow-hidden

        rounded-[28px]

        border
        border-white/10

        bg-gradient-to-br
        from-[#2b2b2b]
        via-[#151515]
        to-[#050505]

        text-white

        shadow-[0_22px_55px_rgba(0,0,0,0.55)]

        transition-all
        duration-500

        hover:-translate-y-2
        hover:scale-[1.01]

        hover:border-white/20

        hover:shadow-[0_28px_75px_rgba(0,0,0,0.68)]
      "
    >
      {/* =====================================================
          LUZ SUPERIOR
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none

          absolute
          -right-16
          -top-16

          h-52
          w-52

          rounded-full

          bg-white/[0.07]

          blur-[70px]

          transition-all
          duration-500

          group-hover:bg-white/[0.12]
        "
      />

      {/* =====================================================
          CAPA / ÍCONE 3D
      ====================================================== */}

      {restaurante.imagemCapa ? (
        <div
          className="
            relative

            h-[185px]

            overflow-hidden

            bg-black

            sm:h-[200px]
          "
        >
          <img
            src={restaurante.imagemCapa}
            alt={restaurante.nome}
            draggable={false}
            className="
              h-full
              w-full

              object-cover

              transition-transform
              duration-700

              group-hover:scale-[1.06]
            "
          />

          <div
            aria-hidden="true"
            className="
              absolute
              inset-0

              bg-gradient-to-t
              from-black/90
              via-black/15
              to-black/10
            "
          />
        </div>
      ) : (
        <div
          className="
            relative

            flex
            h-[155px]

            items-center
            justify-center

            overflow-hidden

            border-b
            border-white/[0.05]

            bg-gradient-to-br
            from-[#262626]
            via-[#141414]
            to-[#070707]
          "
        >
          {/* GLOW */}

          <div
            aria-hidden="true"
            className="
              pointer-events-none

              absolute

              h-28
              w-28

              rounded-full

              bg-[#ffd447]/10

              blur-[40px]
            "
          />

          <img
            src={restauranteIcon}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="
              relative
              z-10

              h-[105px]
              w-[105px]

              object-contain

              drop-shadow-[0_18px_24px_rgba(0,0,0,0.60)]

              transition-all
              duration-500

              group-hover:-translate-y-2
              group-hover:scale-110

              sm:h-[118px]
              sm:w-[118px]
            "
          />
        </div>
      )}

      {/* =====================================================
          CONTEÚDO
      ====================================================== */}

      <div
        className="
          relative
          z-10

          p-5

          sm:p-6
        "
      >
        {/* =================================================
            CABEÇALHO
        ================================================= */}

        <div
          className="
            flex

            items-start

            gap-4
          "
        >
          {/* LOGO */}

          <div
            className="
              flex

              h-16
              w-16

              shrink-0

              items-center
              justify-center

              overflow-hidden

              rounded-[18px]

              border
              border-white/15

              bg-black/55

              shadow-[0_10px_30px_rgba(0,0,0,0.45)]
            "
          >
            {restaurante.logoUrl ? (
              <img
                src={restaurante.logoUrl}
                alt={`Logo ${restaurante.nome}`}
                draggable={false}
                className="
                  h-full
                  w-full

                  object-cover
                "
              />
            ) : (
              <img
                src={restauranteIcon}
                alt=""
                aria-hidden="true"
                draggable={false}
                className="
                  h-12
                  w-12

                  object-contain

                  drop-shadow-[0_8px_14px_rgba(0,0,0,0.45)]
                "
              />
            )}
          </div>

          {/* TEXTO */}

          <div
            className="
              min-w-0
              flex-1
            "
          >
            <div
              className="
                inline-flex

                max-w-full

                rounded-full

                border
                border-[#ffd447]/35

                bg-[#ffd447]/10

                px-3
                py-1.5

                text-[8px]
                font-black

                uppercase

                tracking-[0.12em]

                text-[#ffd447]

                sm:text-[9px]
              "
            >
              {restaurante.categoria ||
                "Gastronomia"}
            </div>

            <h3
              className="
                mt-3

                text-[20px]
                font-black

                uppercase

                leading-[1.02]

                tracking-[-0.025em]

                text-white

                sm:text-[22px]
              "
              style={{
                fontFamily:
                  "'Arial Black', 'Montserrat', sans-serif",

                textShadow:
                  "0 2px 0 rgba(0,0,0,1), 0 6px 16px rgba(0,0,0,0.45)",
              }}
            >
              {restaurante.nome}
            </h3>
          </div>
        </div>

        {/* =================================================
            DESCRIÇÃO
        ================================================= */}

        <p
          className="
            mt-5

            line-clamp-3

            min-h-[54px]

            text-[12px]
            leading-6

            text-white/48

            sm:text-[13px]
          "
        >
          {restaurante.descricao ||
            "Conheça os pratos e opções disponíveis deste parceiro."}
        </p>

        {/* =================================================
            INFORMAÇÕES
        ================================================= */}

        <div
          className="
            mt-5

            flex
            flex-wrap

            gap-3
          "
        >
          {/* ENTREGA */}

          {temEntrega && (
            <div
              className="
                flex

                items-center

                gap-2.5

                rounded-2xl

                border
                border-emerald-400/20

                bg-gradient-to-r
                from-emerald-400/10
                to-emerald-400/[0.04]

                px-3
                py-2

                shadow-[0_8px_22px_rgba(0,0,0,0.25)]
              "
            >
              <img
                src={entregaIcon}
                alt=""
                aria-hidden="true"
                draggable={false}
                className="
                  h-9
                  w-9

                  object-contain

                  drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)]
                "
              />

              <div>
                <p
                  className="
                    text-[7px]
                    font-black

                    uppercase

                    tracking-[0.14em]

                    text-emerald-400/65
                  "
                >
                  Entrega
                </p>

                <p
                  className="
                    mt-0.5

                    text-[10px]
                    font-black

                    uppercase

                    text-emerald-300
                  "
                >
                  Entrega própria
                </p>
              </div>
            </div>
          )}

          {/* RETIRADA */}

          {restaurante.aceitaRetirada && (
            <span
              className="
                inline-flex

                items-center

                rounded-2xl

                border
                border-[#ffd447]/20

                bg-[#ffd447]/10

                px-3
                py-2

                text-[10px]
                font-black

                uppercase

                text-[#ffd447]
              "
            >
              Retirada disponível
            </span>
          )}

          {/* HORÁRIO */}

          {restaurante.horarioFuncionamento && (
            <span
              className="
                inline-flex

                items-center

                rounded-2xl

                border
                border-white/10

                bg-white/[0.04]

                px-3
                py-2

                text-[10px]
                font-bold

                text-white/55
              "
            >
              {restaurante.horarioFuncionamento}
            </span>
          )}
        </div>

        {/* =================================================
            BOTÃO AZUL
        ================================================= */}

        <button
          type="button"
          onClick={() =>
            onAbrir(restaurante)
          }
          className="
            group/botao

            relative

            mt-6

            flex
            w-full

            items-center
            justify-between

            overflow-hidden

            rounded-[18px]

            border
            border-[#54baff]/80

            bg-gradient-to-r
            from-[#0377d9]
            via-[#0797ff]
            to-[#036fcb]

            px-5
            py-4

            shadow-[0_10px_30px_rgba(0,140,255,0.26),inset_0_1px_0_rgba(255,255,255,0.35)]

            transition-all
            duration-300

            hover:-translate-y-1

            hover:border-[#8fd2ff]

            hover:shadow-[0_14px_38px_rgba(0,150,255,0.38)]
          "
        >
          {/* BRILHO ANIMADO */}

          <span
            aria-hidden="true"
            className="
              pointer-events-none

              absolute
              -left-20
              top-0

              h-full
              w-16

              skew-x-[-20deg]

              bg-white/15

              blur-[4px]

              transition-all
              duration-700

              group-hover/botao:left-[110%]
            "
          />

          <span
            className="
              relative
              z-10

              flex

              items-center

              gap-3
            "
          >
            <img
              src={restauranteIcon}
              alt=""
              aria-hidden="true"
              draggable={false}
              className="
                h-10
                w-10

                object-contain

                drop-shadow-[0_5px_8px_rgba(0,0,0,0.45)]

                transition-transform
                duration-300

                group-hover/botao:scale-110
              "
            />

            <span
              className="
                text-[12px]
                font-black

                uppercase

                tracking-[0.035em]

                text-white

                sm:text-[13px]
              "
              style={{
                WebkitTextStroke:
                  "0.7px rgba(0,0,0,0.95)",

                textShadow:
                  "0 2px 0 rgba(0,0,0,1), 0 4px 7px rgba(0,0,0,0.65)",
              }}
            >
              Ver pratos e cardápio
            </span>
          </span>

          <span
            className="
              relative
              z-10

              ml-3

              text-xl
              font-black

              text-white

              drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]

              transition-transform
              duration-300

              group-hover/botao:translate-x-1.5
            "
          >
            →
          </span>
        </button>
      </div>

      {/* =====================================================
          LINHA 3D INFERIOR
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none

          absolute
          bottom-0
          left-[8%]
          right-[8%]

          h-px

          bg-gradient-to-r
          from-transparent
          via-white/20
          to-transparent
        "
      />
    </article>
  );
}

export default RestauranteCard;