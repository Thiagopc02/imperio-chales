import {
  Link,
} from "react-router-dom";

import perfilIcon from "./perfil.png";

/* =========================================================
   TIPOS
========================================================= */

export type PedidoResumoCliente = {
  id: string;

  restaurante?: string;

  status?: string;

  total?: number;

  data?: string;
};

export type DadosPainelCliente = {
  uid: string;

  nomeCompleto: string;

  email: string;

  telefone?: string;

  fotoUrl?: string;

  ultimosPedidos?: PedidoResumoCliente[];
};

type PainelClienteProps = {
  cliente: DadosPainelCliente;

  onExplorar?: () => void;
};

/* =========================================================
   AUXILIARES
========================================================= */

function primeiroNome(
  nomeCompleto: string
): string {
  const nome =
    nomeCompleto
      .trim()
      .split(/\s+/)[0];

  return (
    nome ||
    "Cliente"
  );
}

function dinheiro(
  valor: number
): string {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  ).format(valor);
}

/* =========================================================
   STATUS
========================================================= */

function estiloStatus(
  status?: string
) {
  const valor =
    status
      ?.trim()
      .toLowerCase() || "";

  if (
    valor.includes("entreg") ||
    valor.includes("conclu")
  ) {
    return {
      texto:
        status || "Entregue",

      classes:
        "border-[#1aff75]/25 bg-[#1aff75]/10 text-[#55ff98]",
    };
  }

  if (
    valor.includes("cancel") ||
    valor.includes("rejeit")
  ) {
    return {
      texto:
        status || "Cancelado",

      classes:
        "border-red-500/25 bg-red-500/10 text-red-400",
    };
  }

  if (
    valor.includes("rota") ||
    valor.includes("prepar")
  ) {
    return {
      texto:
        status || "Em andamento",

      classes:
        "border-blue-400/25 bg-blue-400/10 text-blue-300",
    };
  }

  return {
    texto:
      status || "Em análise",

    classes:
      "border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f2ce49]",
  };
}

/* =========================================================
   COMPONENTE
========================================================= */

export function PainelCliente({
  cliente,
  onExplorar,
}: PainelClienteProps) {
  const nome =
    primeiroNome(
      cliente.nomeCompleto
    );

  const pedidos =
    cliente.ultimosPedidos || [];

  return (
    <section
      className="
        relative
        overflow-hidden
        bg-black
        px-4
        py-10

        sm:px-6
        sm:py-12

        lg:px-8
        lg:py-14
      "
    >
      {/* ===================================================
          LUZES DE FUNDO
      =================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-[15%]
          top-1/2
          h-[320px]
          w-[320px]
          -translate-y-1/2
          rounded-full
          bg-[#18ff72]/[0.055]
          blur-[130px]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          right-[5%]
          top-[35%]
          h-[280px]
          w-[280px]
          rounded-full
          bg-white/[0.035]
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
        {/* =================================================
            CARD PRINCIPAL
        ================================================= */}

        <div
          className="
            relative
            overflow-hidden

            rounded-[30px]

            border
            border-white/10

            bg-gradient-to-br
            from-[#202020]
            via-[#0f0f0f]
            to-[#030303]

            px-5
            py-6

            shadow-[0_25px_80px_rgba(0,0,0,0.55)]

            sm:px-7
            sm:py-8

            lg:px-9
            lg:py-9
          "
        >
          {/* GLOW VERDE */}

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              -left-20
              top-1/2
              h-64
              w-64
              -translate-y-1/2
              rounded-full
              bg-[#18ff72]/[0.05]
              blur-[95px]
            "
          />

          <div
            className="
              relative
              z-10

              grid
              gap-8

              lg:grid-cols-[1fr_1.1fr]
              lg:items-stretch
              lg:gap-10
            "
          >
            {/* =================================================
                PERFIL
            ================================================= */}

            <div
              className="
                flex
                min-w-0
                flex-col
              "
            >
              {/* ETIQUETA */}

              <div
                className="
                  inline-flex
                  w-fit
                  items-center
                  rounded-full
                  border
                  border-[#18ff72]/20
                  bg-[#18ff72]/[0.06]
                  px-4
                  py-2
                  text-[9px]
                  font-black
                  uppercase
                  tracking-[0.18em]
                  text-[#46ff8b]

                  sm:text-[10px]
                "
              >
                Área exclusiva do hóspede
              </div>

              {/* IDENTIFICAÇÃO */}

              <div
                className="
                  mt-6
                  flex
                  items-center
                  gap-4

                  sm:gap-5
                "
              >
                {/* FOTO */}

                <div
                  className="
                    relative
                    flex
                    h-[92px]
                    w-[92px]
                    shrink-0
                    items-center
                    justify-center
                    overflow-hidden
                    rounded-[26px]
                    border
                    border-white/10
                    bg-gradient-to-br
                    from-[#333333]
                    via-[#141414]
                    to-black
                    shadow-[0_14px_35px_rgba(0,0,0,0.45)]

                    sm:h-[110px]
                    sm:w-[110px]
                  "
                >
                  <img
                    src={
                      cliente.fotoUrl ||
                      perfilIcon
                    }
                    alt={`Perfil de ${cliente.nomeCompleto}`}
                    draggable={false}
                    className="
                      h-full
                      w-full
                      object-contain
                      p-2
                    "
                    onError={(
                      evento
                    ) => {
                      evento.currentTarget.src =
                        perfilIcon;
                    }}
                  />

                  <div
                    aria-hidden="true"
                    className="
                      pointer-events-none
                      absolute
                      inset-x-4
                      bottom-0
                      h-10
                      rounded-full
                      bg-[#18ff72]/10
                      blur-xl
                    "
                  />
                </div>

                {/* NOME */}

                <div
                  className="
                    min-w-0
                    flex-1
                  "
                >
                  <p
                    className="
                      text-[10px]
                      font-black
                      uppercase
                      tracking-[0.16em]
                      text-white/40
                    "
                  >
                    Bem-vindo de volta
                  </p>

                  <h2
                    className="
                      mt-1
                      truncate
                      text-[30px]
                      font-black
                      uppercase
                      leading-none
                      tracking-[-0.04em]
                      text-white

                      sm:text-[38px]
                    "
                    style={{
                      fontFamily:
                        "'Arial Black', 'Montserrat', sans-serif",

                      textShadow:
                        "0 3px 0 rgba(0,0,0,1)",
                    }}
                  >
                    Olá,{" "}
                    <span
                      className="
                        text-[#18ff72]
                      "
                    >
                      {nome}
                    </span>
                  </h2>
                </div>
              </div>

              {/* =================================================
                  INFORMAÇÕES
              ================================================= */}

              <div
                className="
                  mt-7
                  grid
                  gap-3

                  sm:grid-cols-2
                "
              >
                {/* EMAIL */}

                <div
                  className="
                    rounded-[18px]
                    border
                    border-white/[0.08]
                    bg-white/[0.035]
                    px-4
                    py-4
                  "
                >
                  <p
                    className="
                      text-[9px]
                      font-black
                      uppercase
                      tracking-[0.16em]
                      text-white/35
                    "
                  >
                    Email
                  </p>

                  <p
                    className="
                      mt-1
                      truncate
                      text-[12px]
                      font-bold
                      text-white

                      sm:text-[13px]
                    "
                  >
                    {cliente.email}
                  </p>
                </div>

                {/* TELEFONE */}

                <div
                  className="
                    rounded-[18px]
                    border
                    border-white/[0.08]
                    bg-white/[0.035]
                    px-4
                    py-4
                  "
                >
                  <p
                    className="
                      text-[9px]
                      font-black
                      uppercase
                      tracking-[0.16em]
                      text-white/35
                    "
                  >
                    Telefone
                  </p>

                  <p
                    className="
                      mt-1
                      text-[12px]
                      font-bold
                      text-white

                      sm:text-[13px]
                    "
                  >
                    {cliente.telefone ||
                      "Não informado"}
                  </p>
                </div>
              </div>

              {/* =================================================
                  AÇÕES
              ================================================= */}

              <div
                className="
                  mt-6
                  flex
                  flex-col
                  gap-3

                  sm:flex-row
                "
              >
                <Link
                  to="/cliente/perfil"
                  className="
                    flex
                    min-h-[52px]
                    flex-1
                    items-center
                    justify-center
                    gap-2
                    rounded-2xl
                    border
                    border-[#18ff72]/30
                    bg-[#18e96d]
                    px-5
                    py-3
                    text-[11px]
                    font-black
                    uppercase
                    tracking-[0.05em]
                    text-black
                    shadow-[0_0_24px_rgba(24,255,114,0.15)]
                    transition-all
                    duration-300

                    hover:-translate-y-1
                    hover:bg-[#25ff7d]
                    hover:shadow-[0_0_32px_rgba(24,255,114,0.25)]

                    sm:text-[12px]
                  "
                >
                  <img
                    src={perfilIcon}
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    className="
                      h-7
                      w-7
                      object-contain
                    "
                  />

                  Meu perfil
                </Link>

                <button
                  type="button"
                  onClick={
                    onExplorar
                  }
                  className="
                    flex
                    min-h-[52px]
                    flex-1
                    items-center
                    justify-center
                    gap-2
                    rounded-2xl
                    border
                    border-white/10
                    bg-gradient-to-r
                    from-[#333333]
                    via-[#202020]
                    to-[#101010]
                    px-5
                    py-3
                    text-[11px]
                    font-black
                    uppercase
                    tracking-[0.05em]
                    text-white
                    transition-all
                    duration-300

                    hover:-translate-y-1
                    hover:border-white/25
                    hover:bg-[#262626]

                    sm:text-[12px]
                  "
                >
                  Explorar cardápio

                  <span
                    className="
                      text-[#18ff72]
                    "
                  >
                    →
                  </span>
                </button>
              </div>
            </div>

            {/* =================================================
                ÚLTIMOS PEDIDOS
            ================================================= */}

            <div
              className="
                rounded-[26px]
                border
                border-white/[0.08]
                bg-black/35
                p-5

                sm:p-6
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-4
                "
              >
                <div>
                  <p
                    className="
                      text-[9px]
                      font-black
                      uppercase
                      tracking-[0.18em]
                      text-[#18ff72]
                    "
                  >
                    Histórico
                  </p>

                  <h3
                    className="
                      mt-1
                      text-xl
                      font-black
                      uppercase
                      tracking-[-0.02em]
                      text-white

                      sm:text-2xl
                    "
                    style={{
                      fontFamily:
                        "'Arial Black', 'Montserrat', sans-serif",
                    }}
                  >
                    Últimos pedidos
                  </h3>
                </div>

                <div
                  className="
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    border-white/10
                    bg-white/[0.04]
                    text-xl
                  "
                >
                  🧾
                </div>
              </div>

              {/* =================================================
                  LISTA
              ================================================= */}

              {pedidos.length >
              0 ? (
                <div
                  className="
                    mt-5
                    space-y-3
                  "
                >
                  {pedidos
                    .slice(
                      0,
                      3
                    )
                    .map(
                      (
                        pedido
                      ) => {
                        const status =
                          estiloStatus(
                            pedido.status
                          );

                        return (
                          <div
                            key={
                              pedido.id
                            }
                            className="
                              rounded-[18px]
                              border
                              border-white/[0.07]
                              bg-gradient-to-r
                              from-[#252525]
                              via-[#171717]
                              to-[#0a0a0a]
                              px-4
                              py-4
                            "
                          >
                            <div
                              className="
                                flex
                                items-start
                                justify-between
                                gap-3
                              "
                            >
                              <div
                                className="
                                  min-w-0
                                "
                              >
                                <p
                                  className="
                                    text-[9px]
                                    font-black
                                    uppercase
                                    tracking-[0.13em]
                                    text-white/35
                                  "
                                >
                                  Pedido
                                </p>

                                <p
                                  className="
                                    mt-1
                                    truncate
                                    text-sm
                                    font-black
                                    text-white
                                  "
                                >
                                  #
                                  {pedido.id.slice(
                                    0,
                                    8
                                  )}
                                </p>
                              </div>

                              <span
                                className={`
                                  rounded-full
                                  border
                                  px-3
                                  py-1
                                  text-[9px]
                                  font-black
                                  uppercase
                                  tracking-[0.05em]

                                  ${status.classes}
                                `}
                              >
                                {
                                  status.texto
                                }
                              </span>
                            </div>

                            <div
                              className="
                                mt-3
                                flex
                                items-end
                                justify-between
                                gap-4
                              "
                            >
                              <div
                                className="
                                  min-w-0
                                "
                              >
                                {pedido.restaurante && (
                                  <p
                                    className="
                                      truncate
                                      text-[11px]
                                      text-white/55
                                    "
                                  >
                                    {
                                      pedido.restaurante
                                    }
                                  </p>
                                )}

                                {pedido.data && (
                                  <p
                                    className="
                                      mt-1
                                      text-[10px]
                                      text-white/30
                                    "
                                  >
                                    {
                                      pedido.data
                                    }
                                  </p>
                                )}
                              </div>

                              {typeof pedido.total ===
                                "number" && (
                                <strong
                                  className="
                                    shrink-0
                                    text-sm
                                    font-black
                                    text-[#18ff72]
                                  "
                                >
                                  {dinheiro(
                                    pedido.total
                                  )}
                                </strong>
                              )}
                            </div>
                          </div>
                        );
                      }
                    )}
                </div>
              ) : (
                /* ===========================================
                   SEM PEDIDOS
                =========================================== */

                <div
                  className="
                    mt-5
                    flex
                    min-h-[180px]
                    flex-col
                    items-center
                    justify-center
                    rounded-[20px]
                    border
                    border-dashed
                    border-white/10
                    bg-white/[0.02]
                    px-5
                    py-8
                    text-center
                  "
                >
                  <div
                    className="
                      text-[32px]
                    "
                  >
                    🍽️
                  </div>

                  <p
                    className="
                      mt-3
                      text-sm
                      font-black
                      uppercase
                      text-white
                    "
                  >
                    Nenhum pedido ainda
                  </p>

                  <p
                    className="
                      mt-2
                      max-w-xs
                      text-[11px]
                      leading-5
                      text-white/40
                    "
                  >
                    Seus pedidos mais
                    recentes aparecerão
                    aqui.
                  </p>

                  {onExplorar && (
                    <button
                      type="button"
                      onClick={
                        onExplorar
                      }
                      className="
                        mt-5
                        rounded-xl
                        border
                        border-[#18ff72]/20
                        bg-[#18ff72]/[0.07]
                        px-4
                        py-2.5
                        text-[10px]
                        font-black
                        uppercase
                        tracking-[0.06em]
                        text-[#5dff9c]
                        transition-all
                        hover:bg-[#18ff72]/[0.12]
                      "
                    >
                      Ver restaurantes →
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PainelCliente;