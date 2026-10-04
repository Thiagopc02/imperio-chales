import {
  useEffect,
  useRef,
  useState,
  type TouchEvent,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "./firebase/config";

import {
  CatalogoHeader,
} from "./components/catalogo/CatalogoHeader";

import {
  CatalogoConteudo,
} from "./components/catalogo/CatalogoConteudo";

import {
  CatalogoApresentacao,
} from "./components/catalogo/CatalogoApresentacao";

import {
  EspacoParceiro,
} from "./components/catalogo/EspacoParceiro";

import {
  ExperienciasEscolhidas,
} from "./components/ExperienciasEscolhidas";

import restauranteEmoji from "./components/catalogo/restaurante-emoji.png";

/* =========================================================
   TIPOS
========================================================= */

interface ClienteAutenticado {
  uid: string;
  nomeCompleto: string;
  email: string;
}

/* =========================================================
   IMAGENS DO CARROSSEL
========================================================= */

const slides = [
  {
    id: 1,

    desktop: "/Carrossel-01.png",

    mobile: "/Carrossel-cll-01.png",

    titulo:
      "Código de indicação IMPERIO",

    destino: "codigo",
  },

  {
    id: 2,

    desktop: "/Carrossel-02.png",

    mobile: "/Carrossel-cll-02.png",

    titulo:
      "Restaurantes com entrega própria",

    destino: "categorias",
  },

  {
    id: 3,

    desktop: "/Carrossel-03.png",

    mobile: "/Carrossel-cll-03.png",

    titulo:
      "Restaurantes com retirada sob consulta",

    destino: "retirada",
  },
];

/* =========================================================
   COMPONENTE PRINCIPAL
========================================================= */

export function Cardapio() {
  const navigate = useNavigate();

  /* =======================================================
     CARROSSEL
  ======================================================= */

  const [
    slideAtual,
    setSlideAtual,
  ] = useState(0);

  const [
    pausado,
    setPausado,
  ] = useState(false);

  const toqueInicial =
    useRef<number | null>(null);

  /* =======================================================
     AUTENTICAÇÃO
  ======================================================= */

  const [
    cliente,
    setCliente,
  ] =
    useState<ClienteAutenticado | null>(
      null
    );

  const [
    verificandoCliente,
    setVerificandoCliente,
  ] = useState(true);

  const [
    menuAberto,
    setMenuAberto,
  ] = useState(false);

  const [
    saindo,
    setSaindo,
  ] = useState(false);

  const [
    erroConta,
    setErroConta,
  ] = useState("");

  /* =======================================================
     VERIFICAR SESSÃO DO CLIENTE
  ======================================================= */

  useEffect(() => {
    let ativo = true;
    let versao = 0;

    const cancelar =
      onAuthStateChanged(
        auth,

        async (usuario) => {
          const minhaVersao =
            ++versao;

          if (!ativo) {
            return;
          }

          setVerificandoCliente(
            true
          );

          setCliente(null);

          setMenuAberto(false);

          setErroConta("");

          /* ===============================================
             VISITANTE SEM LOGIN
          =============================================== */

          if (!usuario) {
            setVerificandoCliente(
              false
            );

            return;
          }

          try {
            /* =============================================
               VALIDAR PERFIL PRIVADO DO CLIENTE
            ============================================== */

            const referencia = doc(
              db,
              "clientes",
              usuario.uid
            );

            const resultado =
              await getDoc(
                referencia
              );

            if (
              !ativo ||
              minhaVersao !==
                versao ||
              auth.currentUser?.uid !==
                usuario.uid
            ) {
              return;
            }

            if (
              !resultado.exists()
            ) {
              setCliente(null);

              return;
            }

            const dados =
              resultado.data();

            const perfilValido =
              dados.uid ===
                usuario.uid &&
              dados.tipo ===
                "cliente" &&
              typeof dados.nomeCompleto ===
                "string" &&
              dados.nomeCompleto
                .trim()
                .length >= 3 &&
              typeof dados.email ===
                "string" &&
              dados.email ===
                usuario.email;

            if (!perfilValido) {
              setCliente(null);

              return;
            }

            setCliente({
              uid: usuario.uid,

              nomeCompleto:
                dados.nomeCompleto.trim(),

              email:
                dados.email,
            });
          } catch (erro) {
            console.error(
              "Erro ao verificar perfil do cliente:",
              erro
            );

            if (
              ativo &&
              minhaVersao === versao
            ) {
              setCliente(null);

              setErroConta(
                "Não foi possível verificar sua conta. O cardápio continua disponível."
              );
            }
          } finally {
            if (
              ativo &&
              minhaVersao === versao
            ) {
              setVerificandoCliente(
                false
              );
            }
          }
        }
      );

    return () => {
      ativo = false;

      versao++;

      cancelar();
    };
  }, []);

  /* =======================================================
     STATUS DO CLIENTE
  ======================================================= */

  const clienteLogado =
    cliente !== null;

  /* =======================================================
     TEMA PRINCIPAL
  ======================================================= */

  const fundoPrincipal =
    clienteLogado
      ? "bg-[#171717] text-white"
      : "bg-black text-white";

  /* =======================================================
     CARROSSEL AUTOMÁTICO
  ======================================================= */

  useEffect(() => {
    if (pausado) {
      return;
    }

    const intervalo =
      window.setInterval(() => {
        setSlideAtual(
          (anterior) =>
            (anterior + 1) %
            slides.length
        );
      }, 6000);

    return () => {
      window.clearInterval(
        intervalo
      );
    };
  }, [pausado]);

  /* =======================================================
     NAVEGAR PARA UMA SEÇÃO
  ======================================================= */

  function navegarParaSecao(
    id: string
  ) {
    const secao =
      document.getElementById(
        id
      );

    if (secao) {
      secao.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      return;
    }

    document
      .getElementById(
        "categorias"
      )
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  /* =======================================================
     CONTROLES DO CARROSSEL
  ======================================================= */

  function selecionarSlide(
    index: number
  ) {
    setSlideAtual(index);
  }

  function proximoSlide() {
    setSlideAtual(
      (anterior) =>
        (anterior + 1) %
        slides.length
    );
  }

  function slideAnterior() {
    setSlideAtual(
      (anterior) =>
        (anterior -
          1 +
          slides.length) %
        slides.length
    );
  }

  /* =======================================================
     CONTROLES TOUCH
  ======================================================= */

  function iniciarToque(
    evento: TouchEvent<HTMLDivElement>
  ) {
    toqueInicial.current =
      evento.touches[0].clientX;

    setPausado(true);
  }

  function finalizarToque(
    evento: TouchEvent<HTMLDivElement>
  ) {
    if (
      toqueInicial.current ===
      null
    ) {
      setPausado(false);

      return;
    }

    const toqueFinal =
      evento.changedTouches[0]
        .clientX;

    const diferenca =
      toqueInicial.current -
      toqueFinal;

    if (
      Math.abs(diferenca) >
      50
    ) {
      if (diferenca > 0) {
        proximoSlide();
      } else {
        slideAnterior();
      }
    }

    toqueInicial.current =
      null;

    setPausado(false);
  }

  /* =======================================================
     SAIR DA CONTA
  ======================================================= */

  async function sairDaConta() {
    if (
      saindo ||
      !cliente
    ) {
      return;
    }

    setSaindo(true);

    setErroConta("");

    try {
      await signOut(auth);

      setCliente(null);

      setMenuAberto(false);

      navigate(
        "/cardapio",
        {
          replace: true,
        }
      );
    } catch (erro) {
      console.error(
        "Erro ao sair da conta:",
        erro
      );

      setErroConta(
        "Não foi possível sair da conta. Tente novamente."
      );
    } finally {
      setSaindo(false);
    }
  }

  /* =======================================================
     INTERFACE
  ======================================================= */

  return (
    <main
      className={`
        min-h-screen
        w-full

        overflow-x-hidden

        transition-colors
        duration-300

        ${fundoPrincipal}
      `}
    >
      {/* ===================================================
          CABEÇALHO
      =================================================== */}

      <CatalogoHeader
        cliente={cliente}
        verificandoCliente={
          verificandoCliente
        }
        menuAberto={
          menuAberto
        }
        saindo={saindo}
        erroConta={erroConta}
        onToggleMenu={() =>
          setMenuAberto(
            (anterior) =>
              !anterior
          )
        }
        onFecharMenu={() =>
          setMenuAberto(false)
        }
        onSair={
          sairDaConta
        }
        onVerRestaurantes={() =>
          navegarParaSecao(
            "categorias"
          )
        }
      />

      {/* ===================================================
          HERO / CARROSSEL
      =================================================== */}

      <section
        className="
          relative

          w-full

          overflow-hidden

          bg-black

          pb-8
          pt-4

          text-white

          sm:pb-10
          sm:pt-5

          md:pb-12
          md:pt-6

          xl:pb-14
        "
      >
        {/* LUZ DOURADA */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none

            absolute
            left-1/2
            top-0

            h-[260px]
            w-[90vw]
            max-w-[900px]

            -translate-x-1/2
            -translate-y-1/2

            rounded-full

            bg-[#d4af37]/[0.06]

            blur-[130px]
          "
        />

        <div
          className="
            relative
            z-10

            mx-auto

            w-full
            max-w-[1180px]

            px-3

            sm:px-5
            md:px-6
            lg:px-8
          "
          aria-label="Carrossel Sabores da Chapada"
          aria-roledescription="carrossel"
          onMouseEnter={() =>
            setPausado(true)
          }
          onMouseLeave={() =>
            setPausado(false)
          }
          onFocusCapture={() =>
            setPausado(true)
          }
          onBlurCapture={(
            evento
          ) => {
            if (
              !evento.currentTarget.contains(
                evento.relatedTarget
              )
            ) {
              setPausado(false);
            }
          }}
        >
          {/* =================================================
              CARROSSEL
          ================================================= */}

          <div
            className="
              relative

              mx-auto

              w-full

              overflow-hidden

              rounded-[18px]

              border
              border-white/10

              bg-black

              shadow-[0_25px_80px_rgba(0,0,0,0.65)]

              sm:rounded-[22px]

              md:rounded-[26px]

              lg:rounded-[30px]
            "
            onTouchStart={
              iniciarToque
            }
            onTouchEnd={
              finalizarToque
            }
            onTouchCancel={() => {
              toqueInicial.current =
                null;

              setPausado(
                false
              );
            }}
          >
            <div
              className="
                relative

                mx-auto

                aspect-[9/16]
                w-full

                max-h-[78svh]

                sm:aspect-[16/9]
                sm:max-h-none
              "
            >
              {slides.map(
                (
                  slide,
                  index
                ) => (
                  <div
                    key={
                      slide.id
                    }
                    aria-hidden={
                      slideAtual !==
                      index
                    }
                    className={`
                      absolute
                      inset-0

                      transition-all
                      duration-700
                      ease-out

                      ${
                        slideAtual ===
                        index
                          ? "z-10 scale-100 opacity-100"
                          : "pointer-events-none z-0 scale-[1.01] opacity-0"
                      }
                    `}
                  >
                    <picture
                      className="
                        block
                        h-full
                        w-full
                      "
                    >
                      <source
                        media="(max-width: 639px)"
                        srcSet={
                          slide.mobile
                        }
                      />

                      <img
                        src={
                          slide.desktop
                        }
                        alt={
                          slide.titulo
                        }
                        draggable={
                          false
                        }
                        loading={
                          index === 0
                            ? "eager"
                            : "lazy"
                        }
                        className="
                          block

                          h-full
                          w-full

                          object-contain
                          object-center

                          select-none
                        "
                      />
                    </picture>
                  </div>
                )
              )}
            </div>
          </div>

          {/* =================================================
              CONTROLES
          ================================================= */}

          <div
            className="
              mt-5

              flex
              w-full

              items-center
              justify-center

              gap-3

              sm:mt-6
              sm:gap-4

              md:mt-7
              md:gap-5
            "
          >
            {/* ANTERIOR */}

            <button
              type="button"
              onClick={
                slideAnterior
              }
              aria-label="Imagem anterior"
              className="
                flex
                h-10
                w-10

                shrink-0

                items-center
                justify-center

                rounded-full

                border
                border-white/20

                bg-gradient-to-br
                from-[#252525]
                to-[#070707]

                text-xl
                text-white

                shadow-[0_8px_20px_rgba(0,0,0,0.40)]

                transition-all
                duration-300

                hover:-translate-y-1
                hover:border-[#d4af37]
                hover:text-[#f1c93d]

                sm:h-11
                sm:w-11

                md:h-12
                md:w-12
                md:text-2xl
              "
            >
              ‹
            </button>

            {/* INDICADORES */}

            <div
              className="
                flex
                items-center
                justify-center
                gap-2

                sm:gap-2.5
              "
            >
              {slides.map(
                (
                  slide,
                  index
                ) => (
                  <button
                    key={
                      slide.id
                    }
                    type="button"
                    onClick={() =>
                      selecionarSlide(
                        index
                      )
                    }
                    aria-label={`Exibir imagem ${
                      index + 1
                    }`}
                    aria-current={
                      slideAtual ===
                      index
                        ? "true"
                        : undefined
                    }
                    className={`
                      h-[9px]
                      rounded-full

                      transition-all
                      duration-300

                      sm:h-[10px]

                      ${
                        slideAtual ===
                        index
                          ? `
                            w-8
                            bg-[#d4af37]
                            shadow-[0_0_12px_rgba(212,175,55,0.45)]

                            sm:w-9
                          `
                          : `
                            w-[9px]
                            bg-white/30

                            hover:bg-white/65

                            sm:w-[10px]
                          `
                      }
                    `}
                  />
                )
              )}
            </div>

            {/* PRÓXIMA */}

            <button
              type="button"
              onClick={
                proximoSlide
              }
              aria-label="Próxima imagem"
              className="
                flex
                h-10
                w-10

                shrink-0

                items-center
                justify-center

                rounded-full

                border
                border-white/20

                bg-gradient-to-br
                from-[#252525]
                to-[#070707]

                text-xl
                text-white

                shadow-[0_8px_20px_rgba(0,0,0,0.40)]

                transition-all
                duration-300

                hover:-translate-y-1
                hover:border-[#d4af37]
                hover:text-[#f1c93d]

                sm:h-11
                sm:w-11

                md:h-12
                md:w-12
                md:text-2xl
              "
            >
              ›
            </button>
          </div>

          {/* =================================================
              BOTÃO VER RESTAURANTES
          ================================================= */}

          <div
            className="
              mt-6

              flex
              w-full

              items-center
              justify-center

              sm:mt-7

              md:mt-8
            "
          >
            <button
              type="button"
              onClick={() =>
                navegarParaSecao(
                  "categorias"
                )
              }
              className="
                group
                relative

                w-[92%]
                max-w-[370px]

                overflow-hidden

                rounded-[20px]

                p-[2px]

                transition-all
                duration-300

                hover:-translate-y-1
                hover:scale-[1.018]

                focus:outline-none

                sm:max-w-[400px]

                md:max-w-[430px]
              "
              style={{
                boxShadow:
                  "0 0 12px rgba(212,175,55,0.28), 0 0 35px rgba(212,175,55,0.20)",
              }}
            >
              {/* BORDA DOURADA ANIMADA */}

              <span
                aria-hidden="true"
                className="
                  pointer-events-none

                  absolute

                  left-1/2
                  top-1/2

                  h-[600%]
                  w-[180%]

                  -translate-x-1/2
                  -translate-y-1/2

                  animate-[spin_3s_linear_infinite]

                  bg-[conic-gradient(from_0deg,transparent_0deg,transparent_50deg,#725400_78deg,#d4af37_100deg,#fff0a0_120deg,#ffd447_140deg,#8b6a0a_160deg,transparent_190deg,transparent_360deg)]
                "
              />

              {/* PARTE INTERNA */}

              <span
                className="
                  relative
                  z-10

                  flex

                  min-h-[66px]
                  w-full

                  items-center
                  justify-center

                  gap-2.5

                  overflow-hidden

                  rounded-[18px]

                  border
                  border-white/[0.06]

                  bg-gradient-to-br
                  from-[#171717]
                  via-[#070707]
                  to-black

                  px-3
                  py-2

                  shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]

                  sm:min-h-[72px]
                  sm:gap-4
                  sm:px-5

                  md:min-h-[78px]
                "
              >
                {/* BRILHO */}

                <span
                  aria-hidden="true"
                  className="
                    pointer-events-none

                    absolute

                    -left-20
                    top-1/2

                    h-24
                    w-24

                    -translate-y-1/2

                    rounded-full

                    bg-[#d4af37]/20

                    blur-[32px]

                    transition-all
                    duration-700

                    group-hover:left-[90%]
                  "
                />

                {/* ÍCONE */}

                <img
                  src={
                    restauranteEmoji
                  }
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  className="
                    relative
                    z-20

                    h-[58px]
                    w-[58px]

                    shrink-0

                    object-contain

                    drop-shadow-[0_0_11px_rgba(255,215,80,0.58)]

                    transition-all
                    duration-300

                    group-hover:-rotate-3
                    group-hover:scale-110

                    min-[380px]:h-[64px]
                    min-[380px]:w-[64px]

                    sm:h-[72px]
                    sm:w-[72px]

                    md:h-[78px]
                    md:w-[78px]
                  "
                />

                {/* TEXTO */}

                <span
                  className="
                    relative
                    z-20

                    whitespace-nowrap

                    text-[12px]
                    font-black

                    uppercase

                    tracking-[0.04em]

                    text-white

                    drop-shadow-[0_2px_4px_rgba(0,0,0,1)]

                    min-[360px]:text-[13px]

                    sm:text-[14px]
                    sm:tracking-[0.06em]

                    md:text-[15px]
                  "
                >
                  Ver Restaurantes
                </span>

                {/* SETA */}

                <span
                  className="
                    relative
                    z-20

                    ml-1
                    shrink-0

                    text-base

                    text-[#f1c93d]

                    transition-transform
                    duration-300

                    group-hover:translate-x-1.5

                    sm:text-lg
                  "
                >
                  →
                </span>
              </span>
            </button>
          </div>

          {/* MOBILE */}

          <p
            className="
              mt-4

              text-center
              text-[10px]

              text-white/35

              sm:hidden
            "
          >
            Deslize a imagem para ver mais
          </p>
        </div>
      </section>

      {/* ===================================================
          ÁREA DO CLIENTE OU PARCEIRO
      =================================================== */}

      {clienteLogado ? (
        <ExperienciasEscolhidas
          onExplorar={() =>
            navegarParaSecao(
              "categorias"
            )
          }
        />
      ) : (
        <EspacoParceiro />
      )}

      {/* ===================================================
          APRESENTAÇÃO DO CATÁLOGO
      =================================================== */}

      <CatalogoApresentacao />

      {/* ===================================================
          CONTEÚDO DO CATÁLOGO
      =================================================== */}

      <CatalogoConteudo
        temaCliente={
          clienteLogado
        }
      />

      {/* ===================================================
          RODAPÉ
      =================================================== */}

      <footer
        className="
          border-t
          border-white/10

          bg-[#050505]

          px-4
          py-10

          text-center
          text-white

          sm:px-6
          sm:py-12
        "
      >
        <div
          className="
            mx-auto
            max-w-4xl
          "
        >
          {/* LOGO */}

          <img
            src="/logo-imperio.png"
            alt="Império Chalés"
            draggable={false}
            className="
              mx-auto
              mb-5

              h-14
              w-14

              rounded-full

              object-contain

              sm:h-16
              sm:w-16
            "
          />

          {/* NOME */}

          <h2
            className="
              text-lg
              font-bold

              sm:text-xl
            "
          >
            Império Chalés – Vila do
            Sossego
          </h2>

          {/* LOCAL */}

          <p
            className="
              mt-3

              text-xs

              text-amber-300

              sm:text-sm
            "
          >
            Sabores da Chapada • Alto
            Paraíso de Goiás
          </p>

          {/* LINHA */}

          <div
            className="
              mx-auto
              my-6

              h-px
              max-w-md

              bg-white/10
            "
          />

          {/* AVISO */}

          <p
            className="
              mx-auto
              max-w-2xl

              text-[11px]
              leading-6

              text-gray-400

              sm:text-xs
            "
          >
            Este site é um catálogo
            informativo. Pedidos e
            pagamentos são realizados
            diretamente com os
            estabelecimentos parceiros.
            Retiradas pelo anfitrião
            dependem de consulta,
            disponibilidade e confirmação
            prévia.
          </p>

          {/* VOLTAR */}

          <Link
            to="/"
            className="
              mt-7

              inline-flex

              items-center
              justify-center

              rounded-full

              border
              border-white/20

              px-5
              py-3

              text-xs
              font-semibold

              text-white

              transition-all
              duration-300

              hover:border-[#d4af37]
              hover:bg-white/10
              hover:text-[#d4af37]

              sm:mt-8
              sm:px-6
              sm:text-sm
            "
          >
            ← Voltar ao site dos chalés
          </Link>

          {/* COPYRIGHT */}

          <p
            className="
              mt-7

              text-[10px]

              text-gray-500

              sm:mt-8
              sm:text-xs
            "
          >
            © {new Date().getFullYear()} Império Chalés – Vila do Sossego
          </p>
        </div>
      </footer>
    </main>
  );
}

export default Cardapio;