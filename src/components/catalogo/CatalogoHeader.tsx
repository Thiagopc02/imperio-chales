import { Link } from "react-router-dom";

import perfilImg from "./perfil.png";

/* =========================================================
   TIPOS
========================================================= */

type ClienteHeader = {
  uid: string;
  nomeCompleto: string;
  email: string;
};

type CatalogoHeaderProps = {
  cliente: ClienteHeader | null;

  verificandoCliente: boolean;

  menuAberto: boolean;

  saindo: boolean;

  erroConta: string;

  onToggleMenu: () => void;

  onFecharMenu: () => void;

  onSair: () => void;

  onVerRestaurantes: () => void;
};

/* =========================================================
   COMPONENTE
========================================================= */

export function CatalogoHeader({
  cliente,
  verificandoCliente,
  menuAberto,
  saindo,
  erroConta,
  onToggleMenu,
  onFecharMenu,
  onSair,
  onVerRestaurantes,
}: CatalogoHeaderProps) {
  const clienteLogado = cliente !== null;

  const primeiroNome = cliente
    ? cliente.nomeCompleto.split(/\s+/)[0]
    : "";

  return (
    <>
      {/* =====================================================
          CABEÇALHO PRINCIPAL
      ====================================================== */}

      <header
        className="
          relative
          z-[100]

          border-b
          border-[#d4af37]/25

          bg-black

          text-white

          shadow-[0_12px_35px_rgba(0,0,0,0.45)]
        "
      >
        <nav
          className="
            mx-auto

            flex
            min-h-[86px]
            w-full
            max-w-7xl

            items-center
            justify-between

            gap-3

            px-4
            py-3

            sm:px-6

            lg:min-h-[92px]
          "
        >
          {/* =================================================
              LOGO
          ================================================= */}

          <Link
            to="/"
            aria-label="Voltar para a página inicial"
            className="
              group

              flex
              shrink-0

              items-center

              transition-all
              duration-300

              hover:scale-[1.04]
            "
          >
            <img
              src="/coroa.png"
              alt="Império Chalés"
              draggable={false}
              className="
                h-[48px]
                w-auto

                object-contain

                drop-shadow-[0_0_10px_rgba(255,255,255,0.18)]

                sm:h-[54px]
                md:h-[58px]
              "
            />
          </Link>

          {/* =================================================
              AÇÕES
          ================================================= */}

          <div
            className="
              flex

              min-w-0

              items-center
              justify-end

              gap-2

              sm:gap-3
            "
          >
            {/* ===============================================
                VERIFICANDO CONTA
            ================================================ */}

            {verificandoCliente ? (
              <div
                className="
                  flex

                  min-h-[52px]

                  items-center
                  justify-center

                  rounded-2xl

                  border
                  border-white/15

                  bg-gradient-to-br
                  from-[#272727]
                  via-[#151515]
                  to-[#080808]

                  px-4

                  text-[10px]
                  font-black

                  uppercase

                  tracking-[0.08em]

                  text-white/60

                  sm:px-5
                  sm:text-xs
                "
              >
                Verificando...
              </div>
            ) : clienteLogado ? (
              /* =============================================
                  CLIENTE LOGADO
              ============================================== */

              <div className="relative">
                <button
                  type="button"
                  onClick={onToggleMenu}
                  aria-expanded={menuAberto}
                  aria-controls="catalogo-menu-cliente"
                  className="
                    group

                    flex

                    min-h-[54px]

                    items-center
                    justify-center

                    gap-2

                    rounded-2xl

                    border
                    border-white/90

                    bg-white

                    px-3
                    py-2

                    text-[10px]
                    font-black

                    uppercase

                    tracking-[0.04em]

                    text-black

                    shadow-[0_7px_20px_rgba(0,0,0,0.30)]

                    transition-all
                    duration-300

                    hover:-translate-y-1
                    hover:scale-[1.02]

                    sm:gap-3
                    sm:px-5
                    sm:text-xs
                  "
                >
                  {/* IMAGEM 3D */}

                  <span
                    className="
                      flex

                      h-9
                      w-9

                      shrink-0

                      items-center
                      justify-center

                      overflow-hidden

                      sm:h-10
                      sm:w-10
                    "
                  >
                    <img
                      src={perfilImg}
                      alt=""
                      aria-hidden="true"
                      draggable={false}
                      className="
                        h-full
                        w-full

                        object-contain

                        drop-shadow-[0_4px_8px_rgba(88,28,135,0.45)]

                        transition-transform
                        duration-300

                        group-hover:scale-110
                      "
                    />
                  </span>

                  <span
                    className="
                      hidden

                      max-w-[130px]

                      truncate

                      sm:block
                    "
                  >
                    Olá, {primeiroNome}
                  </span>

                  <span className="sm:hidden">
                    Conta
                  </span>

                  <span
                    className="
                      text-[9px]
                      text-emerald-600
                    "
                  >
                    ●
                  </span>
                </button>

                {/* ===========================================
                    MENU DA CONTA
                ============================================ */}

                {menuAberto && (
                  <div
                    id="catalogo-menu-cliente"
                    className="
                      absolute

                      right-0
                      top-[calc(100%+12px)]

                      z-[200]

                      w-[260px]

                      overflow-hidden

                      rounded-[20px]

                      border
                      border-white/15

                      bg-gradient-to-br
                      from-[#262626]
                      via-[#151515]
                      to-[#050505]

                      p-3

                      shadow-[0_25px_70px_rgba(0,0,0,0.75)]

                      backdrop-blur-xl
                    "
                  >
                    {/* CLIENTE */}

                    <div
                      className="
                        mb-3

                        rounded-xl

                        border
                        border-white/10

                        bg-white/[0.04]

                        p-3
                      "
                    >
                      <p
                        className="
                          text-[9px]
                          font-black

                          uppercase

                          tracking-[0.12em]

                          text-[#d4af37]
                        "
                      >
                        Conta conectada
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
                        {cliente.nomeCompleto}
                      </p>

                      <p
                        className="
                          mt-1

                          truncate

                          text-[10px]

                          text-white/40
                        "
                      >
                        {cliente.email}
                      </p>
                    </div>

                    {/* MEU PERFIL */}

                    <Link
                      to="/cliente/perfil"
                      onClick={onFecharMenu}
                      className="
                        flex

                        min-h-11

                        items-center

                        gap-3

                        rounded-xl

                        px-3
                        py-2

                        text-xs
                        font-bold

                        text-white/80

                        transition-all
                        duration-200

                        hover:bg-white/[0.08]
                        hover:text-white
                      "
                    >
                      <img
                        src={perfilImg}
                        alt=""
                        aria-hidden="true"
                        className="
                          h-6
                          w-6
                          object-contain
                        "
                      />

                      Meu perfil
                    </Link>

                    {/* RESTAURANTES */}

                    <button
                      type="button"
                      onClick={() => {
                        onFecharMenu();
                        onVerRestaurantes();
                      }}
                      className="
                        flex
                        min-h-11
                        w-full

                        items-center

                        gap-3

                        rounded-xl

                        px-3
                        py-2

                        text-left
                        text-xs
                        font-bold

                        text-white/80

                        transition-all
                        duration-200

                        hover:bg-white/[0.08]
                        hover:text-white
                      "
                    >
                      <span>🍽️</span>

                      Ver restaurantes
                    </button>

                    {/* CONSULTAS */}

                    <Link
                      to="/cliente/perfil"
                      onClick={onFecharMenu}
                      className="
                        flex

                        min-h-11

                        items-center

                        gap-3

                        rounded-xl

                        px-3
                        py-2

                        text-xs
                        font-bold

                        text-white/80

                        transition-all
                        duration-200

                        hover:bg-white/[0.08]
                        hover:text-white
                      "
                    >
                      <span>📋</span>

                      Minhas consultas
                    </Link>

                    {/* SAIR */}

                    <button
                      type="button"
                      onClick={onSair}
                      disabled={saindo}
                      className="
                        mt-1

                        flex
                        min-h-11
                        w-full

                        items-center

                        gap-3

                        rounded-xl

                        border-t
                        border-white/10

                        px-3
                        py-2

                        text-left
                        text-xs
                        font-bold

                        text-red-300

                        transition-all
                        duration-200

                        hover:bg-red-500/10

                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                    >
                      <span>🚪</span>

                      {saindo
                        ? "Saindo..."
                        : "Sair da conta"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* =============================================
                  ENTRAR
              ============================================== */

              <Link
                to="/cliente/login"
                state={{
                  from: "/cardapio",
                }}
                className="
                  group

                  flex

                  min-h-[54px]

                  items-center
                  justify-center

                  gap-2

                  rounded-2xl

                  border
                  border-white/90

                  bg-white

                  px-3
                  py-2

                  text-[10px]
                  font-black

                  uppercase

                  tracking-[0.04em]

                  text-black

                  shadow-[0_7px_20px_rgba(0,0,0,0.30)]

                  transition-all
                  duration-300

                  hover:-translate-y-1
                  hover:scale-[1.02]

                  sm:gap-3
                  sm:px-5
                  sm:text-xs
                "
              >
                <img
                  src={perfilImg}
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  className="
                    h-9
                    w-9

                    object-contain

                    drop-shadow-[0_4px_8px_rgba(88,28,135,0.40)]

                    transition-transform
                    duration-300

                    group-hover:scale-110

                    sm:h-10
                    sm:w-10
                  "
                />

                <span>Entrar</span>
              </Link>
            )}

            {/* ===============================================
                VOLTAR AO SITE
            ================================================ */}

            <Link
              to="/"
              className="
                group

                flex

                min-h-[54px]

                items-center
                justify-center

                rounded-2xl

                border
                border-white/90

                bg-white

                px-3
                py-2

                text-[9px]
                font-black

                uppercase

                tracking-[0.04em]

                text-black

                shadow-[0_7px_20px_rgba(0,0,0,0.30)]

                transition-all
                duration-300

                hover:-translate-y-1
                hover:scale-[1.02]

                sm:px-5
                sm:text-xs
              "
            >
              <span
                className="
                  mr-1

                  transition-transform
                  duration-300

                  group-hover:-translate-x-1
                "
              >
                ←
              </span>

              <span className="hidden sm:inline">
                Voltar ao site
              </span>

              <span className="sm:hidden">
                Voltar
              </span>
            </Link>
          </div>
        </nav>
      </header>

      {/* =====================================================
          ERRO DE CONTA
      ====================================================== */}

      {erroConta && (
        <div
          role="alert"
          className="
            relative
            z-[90]

            mx-auto
            mt-3

            w-[calc(100%-32px)]
            max-w-7xl

            rounded-xl

            border
            border-red-400/25

            bg-red-950/70

            p-4

            text-sm
            font-semibold

            text-red-100
          "
        >
          ⚠️ {erroConta}
        </div>
      )}
    </>
  );
}

export default CatalogoHeader;