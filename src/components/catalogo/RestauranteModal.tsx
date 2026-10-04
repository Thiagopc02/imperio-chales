import { Link } from "react-router-dom";

import type {
  PratoPublico,
  RestaurantePublico,
} from "./catalogoTypes";

import perfilIcon from "./perfil.png";
import restauranteIcon from "./restaurante-emoji.png";

/* =========================================================
   TIPOS
========================================================= */

type RestauranteModalProps = {
  restaurante: RestaurantePublico | null;
  pratos: PratoPublico[];
  carregandoPratos?: boolean;
  clienteLogado: boolean;
  onFechar: () => void;
  onAdicionarPrato: (
    prato: PratoPublico
  ) => void;
};

/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function formatarPreco(
  valor: number
) {
  return valor.toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
}

function obterDescricaoRestaurante(
  restaurante: RestaurantePublico
) {
  const descricaoAtual =
    restaurante.descricao?.trim() || "";

  const descricaoFicticia =
    "Estabelecimento fictício para testar o cadastro do Sabores da Chapada.";

  if (
    !descricaoAtual ||
    descricaoAtual === descricaoFicticia
  ) {
    return "Sabores preparados com carinho, ingredientes selecionados e opções especiais para tornar sua experiência gastronômica na Chapada ainda melhor.";
  }

  return descricaoAtual;
}

/* =========================================================
   COMPONENTE
========================================================= */

export function RestauranteModal({
  restaurante,
  pratos,
  carregandoPratos = false,
  clienteLogado,
  onFechar,
  onAdicionarPrato,
}: RestauranteModalProps) {
  if (!restaurante) {
    return null;
  }

  const descricaoRestaurante =
    obterDescricaoRestaurante(
      restaurante
    );

  return (
    <div
      className="
        fixed
        inset-0
        z-[200]

        flex
        items-center
        justify-center

        bg-black/80

        p-3

        backdrop-blur-md

        sm:p-5
      "
      role="dialog"
      aria-modal="true"
      aria-label={`Cardápio de ${restaurante.nome}`}
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onFechar();
        }
      }}
    >
      {/* ===================================================
          MODAL
      =================================================== */}

      <div
        className="
          relative

          flex

          max-h-[92vh]
          w-full
          max-w-5xl

          flex-col

          overflow-hidden

          rounded-[28px]

          border
          border-white/15

          bg-gradient-to-br
          from-[#222222]
          via-[#101010]
          to-black

          text-white

          shadow-[0_35px_120px_rgba(0,0,0,0.85)]
        "
      >
        {/* =================================================
            CABEÇALHO
        ================================================== */}

        <div
          className="
            relative
            shrink-0

            border-b
            border-white/10

            p-5

            sm:p-7
          "
        >
          <div
            aria-hidden="true"
            className="
              pointer-events-none

              absolute
              -right-24
              -top-24

              h-72
              w-72

              rounded-full

              bg-[#d4af37]/10

              blur-[100px]
            "
          />

          <div
            className="
              relative
              z-10

              flex
              items-start
              justify-between

              gap-5
            "
          >
            <div
              className="
                flex
                min-w-0
                items-center

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

                  rounded-2xl

                  border
                  border-white/15

                  bg-black/45

                  shadow-[0_10px_30px_rgba(0,0,0,0.40)]
                "
              >
                {restaurante.logoUrl ? (
                  <img
                    src={
                      restaurante.logoUrl
                    }
                    alt={
                      restaurante.nome
                    }
                    draggable={false}
                    className="
                      h-full
                      w-full
                      object-cover
                    "
                  />
                ) : (
                  <img
                    src={
                      restauranteIcon
                    }
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

              {/* TÍTULO */}

              <div className="min-w-0">
                <p
                  className="
                    text-[9px]
                    font-black
                    uppercase
                    tracking-[0.2em]
                    text-[#ffd447]
                  "
                >
                  {restaurante.categoria ||
                    "Gastronomia"}
                </p>

                <h2
                  className="
                    mt-1

                    text-xl
                    font-black
                    uppercase

                    leading-tight
                    tracking-[-0.03em]

                    text-white

                    sm:text-3xl
                  "
                  style={{
                    fontFamily:
                      "'Arial Black', 'Montserrat', sans-serif",
                    textShadow:
                      "0 2px 0 rgba(0,0,0,1), 0 7px 20px rgba(0,0,0,0.45)",
                  }}
                >
                  {restaurante.nome}
                </h2>
              </div>
            </div>

            {/* FECHAR */}

            <button
              type="button"
              onClick={onFechar}
              aria-label="Fechar cardápio"
              className="
                flex
                h-11
                w-11

                shrink-0

                items-center
                justify-center

                rounded-full

                border
                border-white/15

                bg-black/40

                text-xl
                text-white/70

                transition-all
                duration-300

                hover:border-[#d4af37]
                hover:bg-[#d4af37]
                hover:text-black
              "
            >
              ×
            </button>
          </div>

          {/* DESCRIÇÃO */}

          <p
            className="
              relative
              z-10

              mt-5
              max-w-3xl

              text-sm
              leading-6

              text-white/60
            "
          >
            {descricaoRestaurante}
          </p>
        </div>

        {/* =================================================
            CORPO
        ================================================== */}

        <div
          className="
            flex-1
            overflow-y-auto

            p-5

            sm:p-7
          "
        >
          {carregandoPratos ? (
            <div
              className="
                flex
                min-h-[300px]
                items-center
                justify-center
              "
            >
              <div className="text-center">
                <div
                  className="
                    mx-auto
                    h-10
                    w-10
                    animate-spin
                    rounded-full
                    border-4
                    border-white/10
                    border-t-[#d4af37]
                  "
                />

                <p
                  className="
                    mt-4
                    text-sm
                    text-white/45
                  "
                >
                  Carregando pratos...
                </p>
              </div>
            </div>
          ) : pratos.length > 0 ? (
            <div
              className="
                grid
                grid-cols-1
                gap-5

                md:grid-cols-2
              "
            >
              {pratos.map((prato) => (
                <article
                  key={prato.id}
                  className="
                    group/prato
                    relative

                    overflow-hidden

                    rounded-[24px]

                    border
                    border-white/10

                    bg-gradient-to-br
                    from-[#2b2b2b]
                    via-[#171717]
                    to-[#090909]

                    shadow-[0_16px_40px_rgba(0,0,0,0.32)]

                    transition-all
                    duration-300

                    hover:-translate-y-1
                    hover:border-white/20
                    hover:shadow-[0_22px_50px_rgba(0,0,0,0.45)]
                  "
                >
                  {/* IMAGEM DO PRATO */}

                  {prato.imagemUrl ? (
                    <div
                      className="
                        relative
                        h-[190px]
                        overflow-hidden
                        bg-black
                      "
                    >
                      <img
                        src={prato.imagemUrl}
                        alt={prato.nome}
                        draggable={false}
                        className="
                          h-full
                          w-full
                          object-cover
                          transition-transform
                          duration-500
                          group-hover/prato:scale-[1.04]
                        "
                      />

                      <div
                        aria-hidden="true"
                        className="
                          pointer-events-none
                          absolute
                          inset-0
                          bg-gradient-to-t
                          from-black/60
                          via-transparent
                          to-transparent
                        "
                      />
                    </div>
                  ) : (
                    <div
                      className="
                        relative
                        flex
                        h-[150px]
                        items-center
                        justify-center
                        overflow-hidden
                        bg-gradient-to-br
                        from-[#252525]
                        via-[#151515]
                        to-[#080808]
                      "
                    >
                      <div
                        aria-hidden="true"
                        className="
                          absolute
                          h-24
                          w-24
                          rounded-full
                          bg-[#ffd447]/10
                          blur-[35px]
                        "
                      />

                      <img
                        src={
                          restauranteIcon
                        }
                        alt=""
                        aria-hidden="true"
                        draggable={false}
                        className="
                          relative
                          z-10

                          h-24
                          w-24

                          object-contain

                          drop-shadow-[0_14px_22px_rgba(0,0,0,0.50)]
                        "
                      />
                    </div>
                  )}

                  {/* CONTEÚDO */}

                  <div className="p-5">
                    <div
                      className="
                        flex
                        items-start
                        justify-between
                        gap-4
                      "
                    >
                      <div>
                        <h3
                          className="
                            text-lg
                            font-black
                            uppercase
                            leading-tight
                            text-white
                          "
                          style={{
                            fontFamily:
                              "'Arial Black', 'Montserrat', sans-serif",
                            textShadow:
                              "0 2px 0 rgba(0,0,0,1)",
                          }}
                        >
                          {prato.nome}
                        </h3>

                        {prato.pessoas >
                          0 && (
                          <p
                            className="
                              mt-2
                              text-[10px]
                              font-bold
                              uppercase
                              tracking-[0.04em]
                              text-white/40
                            "
                          >
                            Serve aproximadamente{" "}
                            {prato.pessoas}{" "}
                            {prato.pessoas === 1
                              ? "pessoa"
                              : "pessoas"}
                          </p>
                        )}
                      </div>

                      <strong
                        className="
                          whitespace-nowrap
                          text-lg
                          font-black
                          text-[#ffd447]
                        "
                        style={{
                          textShadow:
                            "0 2px 0 rgba(0,0,0,1), 0 0 12px rgba(255,212,71,0.16)",
                        }}
                      >
                        R$ {formatarPreco(prato.preco)}
                      </strong>
                    </div>

                    {prato.descricao && (
                      <p
                        className="
                          mt-4
                          text-sm
                          leading-6
                          text-white/45
                        "
                      >
                        {prato.descricao}
                      </p>
                    )}

                    {/* =====================================
                        BOTÃO QUANDO LOGADO
                    ====================================== */}

                    {clienteLogado ? (
                      <button
                        type="button"
                        disabled={
                          !prato.disponivel
                        }
                        onClick={() =>
                          onAdicionarPrato(
                            prato
                          )
                        }
                        className="
                          group/adicionar
                          relative

                          mt-5

                          flex
                          w-full

                          items-center
                          justify-center

                          gap-3

                          overflow-hidden

                          rounded-[18px]

                          border
                          border-[#64c4ff]

                          bg-gradient-to-r
                          from-[#046dcc]
                          via-[#079cff]
                          to-[#046dcc]

                          px-4
                          py-3.5

                          shadow-[0_12px_30px_rgba(0,140,255,0.25)]

                          transition-all
                          duration-300

                          hover:-translate-y-0.5
                          hover:border-[#9cddff]
                          hover:shadow-[0_15px_35px_rgba(0,150,255,0.38)]

                          disabled:cursor-not-allowed
                          disabled:border-white/10
                          disabled:bg-none
                          disabled:bg-[#222]
                          disabled:shadow-none
                        "
                      >
                        <span
                          aria-hidden="true"
                          className="
                            pointer-events-none

                            absolute
                            -left-20
                            top-0

                            h-full
                            w-14

                            skew-x-[-20deg]

                            bg-white/15

                            blur-[3px]

                            transition-all
                            duration-700

                            group-hover/adicionar:left-[110%]
                          "
                        />

                        <span
                          className="
                            relative
                            z-10

                            text-[13px]
                            font-black
                            uppercase
                            tracking-[0.045em]
                            text-white

                            sm:text-[14px]
                          "
                          style={{
                            fontFamily:
                              "'Arial Black', 'Montserrat', sans-serif",
                            WebkitTextStroke:
                              "0.65px rgba(0,0,0,0.95)",
                            textShadow:
                              "0 2px 0 rgba(0,0,0,1), 0 4px 7px rgba(0,0,0,0.65)",
                          }}
                        >
                          {prato.disponivel
                            ? "ADICIONAR AO CARRINHO"
                            : "INDISPONÍVEL"}
                        </span>
                      </button>
                    ) : (
                      /* ===================================
                          BOTÃO QUANDO DESLOGADO
                      ==================================== */
                      <div
                        className="
                          mt-5

                          rounded-[20px]

                          border
                          border-[#21ff78]/15

                          bg-black/35

                          p-3

                          shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]
                        "
                      >
                        <p
                          className="
                            mb-4

                            text-center

                            text-[11px]
                            font-black

                            uppercase

                            leading-5
                            tracking-[0.08em]

                            text-white

                            sm:text-[12px]
                          "
                          style={{
                            fontFamily:
                              "'Arial Black', 'Montserrat', sans-serif",
                            textShadow:
                              "0 2px 0 rgba(0,0,0,1), 0 4px 8px rgba(0,0,0,0.45)",
                          }}
                        >
                          PARA ADICIONAR AO
                          CARRINHO É NECESSÁRIO
                          FAZER LOGIN
                        </p>

                        <Link
                          to="/cliente/login"
                          className="
                            group/login
                            relative

                            flex
                            min-h-[66px]
                            w-full

                            items-center

                            gap-3

                            overflow-hidden

                            rounded-[18px]

                            border
                            border-[#65ff9b]/70

                            bg-gradient-to-r
                            from-[#08c858]
                            via-[#13ef6d]
                            to-[#08cf59]

                            px-4
                            py-3

                            shadow-[0_12px_30px_rgba(20,240,110,0.24)]

                            transition-all
                            duration-300

                            hover:-translate-y-1
                            hover:scale-[1.01]
                            hover:shadow-[0_16px_38px_rgba(20,240,110,0.38)]
                          "
                        >
                          <span
                            aria-hidden="true"
                            className="
                              pointer-events-none

                              absolute
                              -left-20
                              top-0

                              h-full
                              w-14

                              skew-x-[-20deg]

                              bg-white/25

                              blur-[4px]

                              transition-all
                              duration-700

                              group-hover/login:left-[110%]
                            "
                          />

                          <div
                            className="
                              relative
                              z-10

                              flex
                              h-12
                              w-12

                              shrink-0

                              items-center
                              justify-center

                              rounded-[14px]

                              bg-black/10

                              shadow-[inset_0_1px_0_rgba(255,255,255,0.20)]
                            "
                          >
                            <img
                              src={perfilIcon}
                              alt=""
                              aria-hidden="true"
                              draggable={false}
                              className="
                                h-11
                                w-11

                                object-contain

                                drop-shadow-[0_6px_10px_rgba(0,0,0,0.38)]

                                transition-transform
                                duration-300

                                group-hover/login:scale-110
                              "
                            />
                          </div>

                          <div
                            className="
                              relative
                              z-10

                              min-w-0
                              flex-1

                              text-left
                            "
                          >
                            <p
                              className="
                                text-[8px]
                                font-black
                                uppercase
                                tracking-[0.16em]
                                text-black/60
                              "
                            >
                              Acesse sua conta
                            </p>

                            <p
                              className="
                                mt-0.5

                                text-[14px]
                                font-black
                                uppercase

                                leading-tight
                                tracking-[-0.015em]

                                text-white

                                sm:text-[15px]
                              "
                              style={{
                                fontFamily:
                                  "'Arial Black', 'Montserrat', sans-serif",
                                WebkitTextStroke:
                                  "0.8px rgba(0,0,0,0.95)",
                                textShadow:
                                  "0 2px 0 rgba(0,0,0,1), 0 4px 6px rgba(0,0,0,0.50)",
                              }}
                            >
                              ENTRAR PARA
                              ADICIONAR
                            </p>
                          </div>

                          <span
                            className="
                              relative
                              z-10

                              shrink-0

                              text-xl
                              font-black

                              text-white

                              drop-shadow-[0_2px_2px_rgba(0,0,0,1)]

                              transition-transform
                              duration-300

                              group-hover/login:translate-x-1
                            "
                          >
                            →
                          </span>
                        </Link>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div
              className="
                flex
                min-h-[300px]

                items-center
                justify-center

                rounded-[24px]

                border
                border-dashed
                border-white/15

                bg-gradient-to-br
                from-[#202020]
                via-[#111111]
                to-[#060606]

                p-8

                text-center
              "
            >
              <div>
                <img
                  src={
                    restauranteIcon
                  }
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  className="
                    mx-auto
                    h-24
                    w-24
                    object-contain
                    drop-shadow-[0_12px_20px_rgba(0,0,0,0.50)]
                  "
                />

                <h3
                  className="
                    mt-4
                    text-xl
                    font-black
                    uppercase
                    text-white
                  "
                  style={{
                    fontFamily:
                      "'Arial Black', 'Montserrat', sans-serif",
                  }}
                >
                  CARDÁPIO EM ATUALIZAÇÃO
                </h3>

                <p
                  className="
                    mt-2
                    text-sm
                    text-white/40
                  "
                >
                  Ainda não encontramos
                  pratos disponíveis neste
                  restaurante.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RestauranteModal;