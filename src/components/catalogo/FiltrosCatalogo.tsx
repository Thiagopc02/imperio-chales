/* =========================================================
   FILTROS DO CATÁLOGO
========================================================= */

import todosIcon from "./todos.png";
import hamburguerIcon from "./hambúrguer.png";
import pizzaIcon from "./pizza.png";
import jantinhaIcon from "./jantinha.png";
import almocoIcon from "./almoco.png";
import gastroIcon from "./gastro.png";
import sobremesaIcon from "./sobremesa.png";

/* =========================================================
   TIPOS
========================================================= */

interface FiltrosCatalogoProps {
  busca: string;
  categoria: string;
  quantidadeResultados: number;

  onBuscaChange: (valor: string) => void;
  onCategoriaChange: (categoria: string) => void;
}

/* =========================================================
   CATEGORIAS
========================================================= */

const categorias = [
  {
    nome: "Todos",
    imagem: todosIcon,
  },

  {
    nome: "Hambúrgueres",
    imagem: hamburguerIcon,
  },

  {
    nome: "Pizzarias",
    imagem: pizzaIcon,
  },

  {
    nome: "Jantinhas e Espetinhos",
    imagem: jantinhaIcon,
  },

  {
    nome: "Almoço e Comida Caseira",
    imagem: almocoIcon,
  },

  {
    nome: "Gastronomia Especial",
    imagem: gastroIcon,
  },

  {
    nome: "Cafeterias e Sobremesas",
    imagem: sobremesaIcon,
  },
];

/* =========================================================
   COMPONENTE
========================================================= */

export function FiltrosCatalogo({
  busca,
  categoria,
  quantidadeResultados,
  onBuscaChange,
  onCategoriaChange,
}: FiltrosCatalogoProps) {
  return (
    <section
      id="categorias"
      className="
        relative
        mb-14
        pt-10

        sm:mb-16
        sm:pt-14

        lg:pt-16
      "
    >
      {/* =====================================================
          LUZ DE FUNDO
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-1/2
          top-[35%]

          h-[350px]
          w-[80%]

          -translate-x-1/2
          -translate-y-1/2

          rounded-full

          bg-white/[0.018]

          blur-[120px]
        "
      />

      {/* =====================================================
          CABEÇALHO
      ====================================================== */}

      <div
        className="
          relative
          z-10

          mx-auto

          mb-8
          max-w-4xl

          text-center

          sm:mb-10
        "
      >
        {/* PEQUENO TEXTO */}

        <p
          className="
            text-[9px]
            font-black

            uppercase

            tracking-[0.28em]

            text-[#ffd447]

            sm:text-[10px]
          "
          style={{
            textShadow:
              "0 0 10px rgba(255,212,71,0.28)",
          }}
        >
          ESCOLHA SUA EXPERIÊNCIA
        </p>

        {/* TÍTULO */}

        <h2
          className="
            mt-3

            text-[30px]
            font-black

            uppercase

            leading-[0.95]

            tracking-[-0.045em]

            text-white

            sm:text-[40px]

            md:text-[48px]

            lg:text-[54px]
          "
          style={{
            fontFamily:
              "'Arial Black', 'Montserrat', 'Segoe UI', sans-serif",

            textShadow:
              "0 3px 0 rgba(0,0,0,1), 0 9px 24px rgba(0,0,0,0.55)",
          }}
        >
          ESCOLHA ONDE
          <span
            className="
              ml-2
              text-[#ffd447]
            "
            style={{
              textShadow:
                "0 0 8px rgba(255,212,71,0.5), 0 0 18px rgba(255,212,71,0.22)",
            }}
          >
            VAI COMER
          </span>
        </h2>

        {/* SUBTÍTULO */}

        <p
          className="
            mx-auto

            mt-4

            max-w-xl

            text-[12px]
            leading-6

            text-white/50

            sm:text-sm
          "
        >
          Escolha uma categoria ou encontre seu restaurante
          preferido.
        </p>
      </div>

      {/* =====================================================
          BUSCA
      ====================================================== */}

      <div
        className="
          relative
          z-10

          mx-auto
          mb-7

          w-full
        "
      >
        <div
          className="
            group
            relative

            overflow-hidden

            rounded-[20px]

            border
            border-white/15

            bg-gradient-to-r
            from-[#252525]
            via-[#141414]
            to-[#080808]

            transition-all
            duration-300

            focus-within:border-[#ffd447]/60

            focus-within:shadow-[0_0_25px_rgba(255,212,71,0.10)]
          "
        >
          {/* BRILHO */}

          <div
            aria-hidden="true"
            className="
              pointer-events-none

              absolute
              left-0
              top-1/2

              h-20
              w-20

              -translate-y-1/2

              rounded-full

              bg-[#ffd447]/[0.05]

              blur-[30px]
            "
          />

          {/* ÍCONE PESQUISA */}

          <div
            className="
              pointer-events-none

              absolute
              left-5
              top-1/2

              z-10

              -translate-y-1/2

              text-lg

              sm:left-6
              sm:text-xl
            "
          >
            🔎
          </div>

          {/* INPUT */}

          <input
            type="search"
            value={busca}
            onChange={(evento) =>
              onBuscaChange(evento.target.value)
            }
            placeholder="Buscar restaurantes ou especialidades..."
            aria-label="Buscar restaurantes"
            className="
              relative
              z-10

              h-[58px]
              w-full

              bg-transparent

              pl-14
              pr-5

              text-[12px]
              font-medium

              text-white

              outline-none

              placeholder:text-white/30

              sm:h-[64px]
              sm:pl-16
              sm:text-sm
            "
          />
        </div>
      </div>

      {/* =====================================================
          CARDS DAS CATEGORIAS
      ====================================================== */}

      <div
        className="
          relative
          z-10

          grid

          grid-cols-2

          gap-3

          sm:grid-cols-3
          sm:gap-4

          lg:grid-cols-4
        "
      >
        {categorias.map((item) => {
          const ativo =
            categoria === item.nome;

          return (
            <button
              key={item.nome}
              type="button"
              onClick={() =>
                onCategoriaChange(item.nome)
              }
              className={`
                group
                relative

                flex
                min-h-[150px]

                flex-col

                items-center
                justify-center

                overflow-hidden

                rounded-[24px]

                border

                px-3
                py-5

                text-center

                transition-all
                duration-300

                sm:min-h-[170px]

                ${
                  ativo
                    ? `
                      border-[#ffd447]/80

                      bg-gradient-to-br
                      from-[#332b10]
                      via-[#17140b]
                      to-[#080808]

                      shadow-[0_0_28px_rgba(255,212,71,0.12)]
                    `
                    : `
                      border-white/12

                      bg-gradient-to-br
                      from-[#292929]
                      via-[#171717]
                      to-[#090909]

                      hover:-translate-y-1

                      hover:border-white/25

                      hover:from-[#333333]
                      hover:to-[#0b0b0b]
                    `
                }
              `}
            >
              {/* BRILHO ATRÁS DO ÍCONE */}

              <div
                aria-hidden="true"
                className={`
                  pointer-events-none

                  absolute
                  left-1/2
                  top-[42%]

                  h-24
                  w-24

                  -translate-x-1/2
                  -translate-y-1/2

                  rounded-full

                  blur-[35px]

                  transition-all
                  duration-300

                  ${
                    ativo
                      ? "bg-[#ffd447]/15"
                      : "bg-white/[0.025] group-hover:bg-white/[0.06]"
                  }
                `}
              />

              {/* ÍCONE 3D */}

              <img
                src={item.imagem}
                alt=""
                aria-hidden="true"
                draggable={false}
                className="
                  relative
                  z-10

                  h-[78px]
                  w-[78px]

                  object-contain

                  drop-shadow-[0_12px_16px_rgba(0,0,0,0.55)]

                  transition-all
                  duration-300

                  group-hover:-translate-y-1
                  group-hover:scale-110

                  sm:h-[92px]
                  sm:w-[92px]

                  lg:h-[100px]
                  lg:w-[100px]
                "
              />

              {/* NOME */}

              <span
                className={`
                  relative
                  z-10

                  mt-2

                  text-[11px]
                  font-black

                  uppercase

                  leading-tight

                  tracking-[-0.01em]

                  sm:text-[12px]

                  ${
                    ativo
                      ? "text-[#ffd447]"
                      : "text-white"
                  }
                `}
                style={{
                  fontFamily:
                    "'Arial Black', 'Montserrat', sans-serif",

                  textShadow:
                    "0 2px 4px rgba(0,0,0,0.85)",
                }}
              >
                {item.nome}
              </span>

              {/* LINHA INFERIOR */}

              <div
                aria-hidden="true"
                className={`
                  absolute

                  bottom-0
                  left-[15%]
                  right-[15%]

                  h-px

                  bg-gradient-to-r

                  from-transparent

                  ${
                    ativo
                      ? "via-[#ffd447]/80"
                      : "via-white/15"
                  }

                  to-transparent
                `}
              />
            </button>
          );
        })}
      </div>

      {/* =====================================================
          RESULTADO
      ====================================================== */}

      <div
        className="
          relative
          z-10

          mt-6

          flex
          flex-col

          gap-2

          text-[11px]

          text-white/40

          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:text-xs
        "
      >
        <p>
          Categoria:{" "}
          <strong className="text-[#ffd447]">
            {categoria}
          </strong>
        </p>

        <p>
          <strong className="text-white">
            {quantidadeResultados}
          </strong>{" "}
          {quantidadeResultados === 1
            ? "estabelecimento disponível"
            : "estabelecimentos disponíveis"}
        </p>
      </div>
    </section>
  );
}

export default FiltrosCatalogo;