import { useEffect, useState } from "react";

/* =========================================================
   IMAGENS - VALE DA LUA
========================================================= */

import valeDaLua01 from "./hero/atrativos/vale-da-lua01.png";
import valeDaLua02 from "./hero/atrativos/vale-da-lua02.png";
import valeDaLua03 from "./hero/atrativos/vale-da-lua03.png";
import valeDaLua04 from "./hero/atrativos/vale-da-lua04.png";
import valeDaLua05 from "./hero/atrativos/vale-da-lua05.png";

/* =========================================================
   IMAGENS - CACHOEIRA SANTA BÁRBARA
========================================================= */

import santaBarbara01 from "./hero/atrativos/santa-barbara01.png";
import santaBarbara02 from "./hero/atrativos/santa-barbara02.png";
import santaBarbara03 from "./hero/atrativos/santa-barbara03.png";
import santaBarbara04 from "./hero/atrativos/santa-barbara04.png";
import santaBarbara05 from "./hero/atrativos/santa-barbara05.png";

/* =========================================================
   IMAGENS - CATARATA DOS COUROS
========================================================= */

import couros01 from "./hero/atrativos/couros01.png";
import couros02 from "./hero/atrativos/couros02.png";
import couros03 from "./hero/atrativos/couros03.png";
import couros04 from "./hero/atrativos/couros04.png";
import couros05 from "./hero/atrativos/couros05.png";

/* =========================================================
   TIPOS
========================================================= */

type Atrativo = {
  id: number;
  selo: string;
  emoji: string;

  nome: string;
  subtitulo: string;
  descricao: string;

  localizacao: string;
  distancia: string;
  tempo: string;
  dificuldade: string;

  entrada: string;
  horario: string;

  destaque: string;

  dicas: string[];

  imagens: string[];

  mapsUrl: string;
  instagramUrl?: string;
  telefone?: string;
};

/* =========================================================
   WHATSAPP IMPÉRIO CHALÉS
========================================================= */

const whatsappImperio =
  "https://wa.me/556299691620?text=Olá!%20Estou%20vendo%20os%20atrativos%20no%20site%20da%20Império%20Chalés%20e%20gostaria%20de%20mais%20informações.";

/* =========================================================
   ATRATIVOS DA HOME
========================================================= */

const atrativos: Atrativo[] = [
  {
    id: 1,

    selo: "Mais procurado",
    emoji: "🌙",

    nome: "Vale da Lua",

    subtitulo: "Formações rochosas únicas",

    descricao:
      "Um dos atrativos mais famosos da Chapada dos Veadeiros. O Vale da Lua possui formações rochosas esculpidas pelas águas durante milhares de anos, criando piscinas naturais, corredores e paisagens que lembram a superfície lunar.",

    localizacao:
      "GO-239, km 29 - Zona Rural, Alto Paraíso de Goiás - GO",

    distancia: "GO-239 • km 29",

    tempo: "2 a 3 horas",

    dificuldade: "Fácil a moderada",

    entrada: "R$ 50",

    horario: "08h às 16h",

    destaque: "Paisagem única e piscinas naturais",

    telefone: "(62) 99656-0459",

    dicas: [
      "Utilize calçados adequados para caminhar sobre as pedras.",
      "Leve água e proteção solar.",
      "Tenha atenção redobrada em períodos de chuva.",
      "Evite áreas com correnteza forte.",
      "Chegar mais cedo ajuda a aproveitar o passeio com tranquilidade.",
    ],

    imagens: [
      valeDaLua01,
      valeDaLua02,
      valeDaLua03,
      valeDaLua04,
      valeDaLua05,
    ],

    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Vale+da+Lua+Chapada+dos+Veadeiros",

    instagramUrl:
      "https://www.instagram.com/valedaluaofficial/",
  },

  {
    id: 2,

    selo: "Águas cristalinas",
    emoji: "💎",

    nome: "Cachoeira Santa Bárbara",

    subtitulo: "Azul-turquesa inesquecível",

    descricao:
      "Uma das cachoeiras mais desejadas da Chapada dos Veadeiros. Localizada na região de Cavalcante, a Cachoeira Santa Bárbara é famosa pela impressionante transparência e tonalidade azul-turquesa de suas águas, cercadas pela natureza preservada do território Kalunga.",

    localizacao:
      "Quilombo Kalunga - Cavalcante - GO, 73790-000",

    distancia: "Cavalcante • GO",

    tempo: "Meio período",

    dificuldade: "Moderada",

    entrada: "R$ 55",

    horario: "Funcionamento até 17h",

    destaque:
      "Águas cristalinas e cenário inesquecível",

    telefone: "(62) 99819-8670",

    dicas: [
      "Planeje a visita com antecedência.",
      "O acesso ocorre pela região de Cavalcante e território Kalunga.",
      "Consulte as regras locais antes de iniciar o passeio.",
      "Leve água, protetor solar e calçado confortável.",
      "Reserve tempo suficiente para deslocamento e visitação.",
      "Valores e condições de acesso podem sofrer alterações.",
    ],

    imagens: [
      santaBarbara01,
      santaBarbara02,
      santaBarbara03,
      santaBarbara04,
      santaBarbara05,
    ],

    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Cachoeira+Santa+Barbara+Cavalcante+GO",

    instagramUrl:
      "https://www.instagram.com/cachoeira_santa_barbara/",
  },

  {
    id: 3,

    selo: "Aventura FREE",
    emoji: "🌊",

    nome: "Catarata dos Couros",

    subtitulo: "Grandes quedas d'água e cânions",

    descricao:
      "A Catarata dos Couros é um dos grandes espetáculos naturais da Chapada dos Veadeiros. O complexo reúne enormes quedas d'água, corredeiras, piscinas naturais, paredões e mirantes em meio ao Cerrado.",

    localizacao:
      "P6CR+JW - São Jorge, Alto Paraíso de Goiás - GO, 73770-000",

    distancia:
      "Região de Alto Paraíso • acesso com trecho em estrada de terra",

    tempo: "Meio período a dia inteiro",

    dificuldade: "Moderada",

    entrada: "FREE",

    horario: "Aberto • fecha às 17h",

    destaque:
      "Cachoeiras, cânions e grandes quedas d'água",

    dicas: [
      "Reserve várias horas para conhecer o complexo com tranquilidade.",
      "O acesso inclui trechos de estrada de terra.",
      "Use calçado adequado para trilhas e terrenos irregulares.",
      "Leve bastante água, alimentação e proteção solar.",
      "Evite áreas próximas às corredeiras em períodos de chuva forte.",
      "Um guia local pode tornar a visita mais segura e completa.",
    ],

    imagens: [
      couros01,
      couros02,
      couros03,
      couros04,
      couros05,
    ],

    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Catarata+dos+Couros+Alto+Paraiso+de+Goias",
  },
];

/* =========================================================
   COMPONENTE PRINCIPAL
========================================================= */

export function AtrativosChapada() {
  const [selecionado, setSelecionado] =
    useState<Atrativo | null>(null);

  const [fotoAtual, setFotoAtual] =
    useState(0);

  /* =========================================================
     RESETA FOTO AO TROCAR ATRATIVO
  ========================================================= */

  useEffect(() => {
    setFotoAtual(0);
  }, [selecionado]);

  /* =========================================================
     CARROSSEL AUTOMÁTICO
  ========================================================= */

  useEffect(() => {
    if (!selecionado) return;

    if (selecionado.imagens.length <= 1) {
      return;
    }

    const intervalo = window.setInterval(() => {
      setFotoAtual((atual) =>
        atual === selecionado.imagens.length - 1
          ? 0
          : atual + 1
      );
    }, 4500);

    return () => {
      window.clearInterval(intervalo);
    };
  }, [selecionado]);

  /* =========================================================
     FOTO ANTERIOR
  ========================================================= */

  const fotoAnterior = () => {
    if (
      !selecionado ||
      selecionado.imagens.length === 0
    ) {
      return;
    }

    setFotoAtual((atual) =>
      atual === 0
        ? selecionado.imagens.length - 1
        : atual - 1
    );
  };

  /* =========================================================
     PRÓXIMA FOTO
  ========================================================= */

  const proximaFoto = () => {
    if (
      !selecionado ||
      selecionado.imagens.length === 0
    ) {
      return;
    }

    setFotoAtual((atual) =>
      atual === selecionado.imagens.length - 1
        ? 0
        : atual + 1
    );
  };

  /* =========================================================
     VOLTAR
  ========================================================= */

  const voltar = () => {
    setSelecionado(null);
    setFotoAtual(0);
  };

  return (
    <section
      id="atrativos"
      className="
        relative
        overflow-hidden

        bg-black

        px-4
        py-20

        text-white

        sm:px-6
        sm:py-24

        lg:px-8
        lg:py-28
      "
    >
      {/* =====================================================
          LUZES DE FUNDO
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none

          absolute
          -left-40
          top-1/3

          h-[500px]
          w-[500px]

          rounded-full

          bg-white/[0.025]

          blur-[170px]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none

          absolute
          -right-40
          bottom-10

          h-[520px]
          w-[520px]

          rounded-full

          bg-[#d4af37]/[0.035]

          blur-[180px]
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
        {/* =====================================================
            TÍTULO
        ====================================================== */}

        <div
          className="
            mx-auto
            mb-12
            max-w-3xl

            text-center

            sm:mb-14
          "
        >
          <p
            className="
              text-[10px]
              font-black
              uppercase
              tracking-[0.35em]

              text-[#e5bf24]

              sm:text-xs
            "
          >
            Atrativos da Chapada
          </p>

          <h2
            className="
              mt-5

              text-3xl
              font-black
              leading-tight

              text-white

              sm:text-4xl
              md:text-5xl
            "
          >
            Onde você quer conhecer?
          </h2>

          <p
            className="
              mx-auto
              mt-4
              max-w-2xl

              text-sm
              leading-7

              text-white/55

              sm:text-base
            "
          >
            Conheça alguns dos lugares mais incríveis
            da Chapada dos Veadeiros.
          </p>
        </div>

        {/* =====================================================
            LISTA DOS 3 ATRATIVOS
        ====================================================== */}

        {!selecionado && (
          <>
            <div
              className="
                grid
                grid-cols-1
                gap-4

                sm:grid-cols-2

                lg:grid-cols-3
                lg:gap-5
              "
            >
              {atrativos.map((atrativo) => (
                <button
                  key={atrativo.id}
                  type="button"
                  onClick={() =>
                    setSelecionado(atrativo)
                  }
                  className="
                    group
                    relative

                    min-h-[230px]

                    overflow-hidden

                    rounded-[26px]

                    border
                    border-white/15

                    bg-gradient-to-br
                    from-[#303030]
                    via-[#171717]
                    to-[#050505]

                    p-6

                    text-left

                    shadow-[0_15px_40px_rgba(0,0,0,0.45)]

                    transition-all
                    duration-300

                    hover:-translate-y-2

                    hover:border-[#d4af37]/65

                    hover:shadow-[0_20px_55px_rgba(212,175,55,0.12)]
                  "
                >
                  {/* LUZ */}

                  <div
                    aria-hidden="true"
                    className="
                      pointer-events-none

                      absolute
                      -right-16
                      -top-20

                      h-48
                      w-48

                      rounded-full

                      bg-white/[0.08]

                      blur-[60px]

                      transition-all
                      duration-300

                      group-hover:bg-white/[0.13]
                    "
                  />

                  {/* SELO + SETA */}

                  <div
                    className="
                      relative
                      z-10

                      flex
                      items-center
                      justify-between

                      gap-3
                    "
                  >
                    <div
                      className="
                        inline-flex
                        items-center

                        gap-2

                        rounded-full

                        border
                        border-[#d4af37]/35

                        bg-black/45

                        px-3
                        py-1.5

                        text-[10px]
                        font-black
                        uppercase

                        tracking-[0.12em]

                        text-[#f0c93d]

                        shadow-[0_6px_18px_rgba(0,0,0,0.35)]
                      "
                    >
                      <span className="text-sm">
                        {atrativo.emoji}
                      </span>

                      <span>
                        {atrativo.selo}
                      </span>
                    </div>

                    <div
                      className="
                        flex

                        h-10
                        w-10

                        items-center
                        justify-center

                        rounded-full

                        border
                        border-white/15

                        bg-black/45

                        text-base
                        text-white/70

                        transition-all
                        duration-300

                        group-hover:border-[#d4af37]
                        group-hover:bg-[#d4af37]
                        group-hover:text-black
                      "
                    >
                      →
                    </div>
                  </div>

                  {/* NOME */}

                  <div
                    className="
                      relative
                      z-10

                      mt-9
                    "
                  >
                    <h3
                      className="
                        text-[28px]
                        font-black
                        leading-tight

                        text-white

                        sm:text-[30px]
                      "
                      style={{
                        textShadow:
                          "0 2px 0 rgba(0,0,0,1), 0 5px 12px rgba(0,0,0,0.75)",
                      }}
                    >
                      {atrativo.nome}
                    </h3>

                    <p
                      className="
                        mt-3

                        text-sm
                        leading-6

                        text-white/55

                        sm:text-[15px]
                      "
                    >
                      {atrativo.subtitulo}
                    </p>
                  </div>

                  {/* PREÇO */}

                  <div
                    className="
                      relative
                      z-10

                      mt-6
                    "
                  >
                    <div
                      className={`
                        inline-flex
                        items-center

                        rounded-2xl

                        border

                        px-5
                        py-2.5

                        ${
                          atrativo.entrada === "FREE"
                            ? `
                              border-emerald-400/50
                              bg-emerald-400/10
                            `
                            : `
                              border-[#d4af37]/50
                              bg-[#d4af37]/10
                            `
                        }
                      `}
                    >
                      <span
                        className={`
                          text-[22px]
                          font-black
                          uppercase
                          leading-none

                          sm:text-[24px]

                          ${
                            atrativo.entrada === "FREE"
                              ? "text-emerald-300"
                              : "text-[#ffd447]"
                          }
                        `}
                        style={{
                          WebkitTextStroke:
                            "1px rgba(0,0,0,0.85)",

                          textShadow:
                            "0 2px 6px rgba(0,0,0,0.80), 0 0 12px rgba(0,0,0,0.50)",
                        }}
                      >
                        {atrativo.entrada}
                      </span>
                    </div>
                  </div>

                  {/* LINHA DOURADA */}

                  <div
                    aria-hidden="true"
                    className="
                      absolute

                      bottom-0
                      left-0
                      right-0

                      h-px

                      bg-gradient-to-r

                      from-transparent
                      via-[#d4af37]/50
                      to-transparent
                    "
                  />
                </button>
              ))}
            </div>

            {/* =================================================
                VER TODOS
            ================================================== */}

            <div
              className="
                mt-10

                flex
                justify-center
              "
            >
              <a
                href="/atrativos"
                className="
                  group

                  inline-flex

                  items-center
                  justify-center

                  gap-3

                  rounded-2xl

                  border
                  border-[#d4af37]/45

                  bg-gradient-to-r
                  from-[#161616]
                  via-[#242424]
                  to-[#161616]

                  px-8
                  py-4

                  text-xs
                  font-black
                  uppercase

                  tracking-[0.12em]

                  text-[#e6bf32]

                  shadow-[0_12px_35px_rgba(0,0,0,0.45)]

                  transition-all
                  duration-300

                  hover:-translate-y-1

                  hover:border-[#d4af37]

                  hover:shadow-[0_0_30px_rgba(212,175,55,0.20)]
                "
              >
                Ver todos os atrativos

                <span
                  className="
                    transition-transform
                    duration-300

                    group-hover:translate-x-1
                  "
                >
                  →
                </span>
              </a>
            </div>
          </>
        )}

        {/* =====================================================
            ATRATIVO SELECIONADO
        ====================================================== */}

        {selecionado && (
          <div
            className="
              overflow-hidden

              rounded-[28px]

              border
              border-white/15

              bg-gradient-to-br
              from-[#1c1c1c]
              via-[#101010]
              to-black

              shadow-[0_35px_100px_rgba(0,0,0,0.75)]
            "
          >
            <div
              className="
                grid

                lg:grid-cols-[1.08fr_0.92fr]
              "
            >
              {/* =================================================
                  GALERIA
              ================================================= */}

              <div
                className="
                  relative

                  min-h-[340px]

                  overflow-hidden

                  bg-black

                  sm:min-h-[480px]
                  lg:min-h-[650px]
                "
              >
                {selecionado.imagens.map(
                  (imagem, index) => (
                    <img
                      key={`${selecionado.id}-${index}`}
                      src={imagem}
                      alt={`${selecionado.nome} - foto ${
                        index + 1
                      }`}
                      draggable={false}
                      className={`
                        absolute
                        inset-0

                        h-full
                        w-full

                        object-cover
                        object-center

                        transition-all
                        duration-700

                        ${
                          index === fotoAtual
                            ? "scale-100 opacity-100"
                            : "pointer-events-none scale-[1.04] opacity-0"
                        }
                      `}
                    />
                  )
                )}

                {/* SOMBRA */}

                <div
                  aria-hidden="true"
                  className="
                    pointer-events-none

                    absolute
                    inset-0

                    bg-gradient-to-t

                    from-black/90
                    via-black/10
                    to-black/20
                  "
                />

                {/* CONTADOR */}

                <div
                  className="
                    absolute

                    right-5
                    top-5

                    z-30

                    rounded-full

                    border
                    border-white/15

                    bg-black/70

                    px-3
                    py-1.5

                    text-[9px]
                    font-black

                    tracking-[0.15em]

                    backdrop-blur-md
                  "
                >
                  {String(
                    fotoAtual + 1
                  ).padStart(2, "0")}
                  {" / "}
                  {String(
                    selecionado.imagens.length
                  ).padStart(2, "0")}
                </div>

                {/* SETAS */}

                <button
                  type="button"
                  onClick={fotoAnterior}
                  aria-label="Foto anterior"
                  className="
                    absolute

                    left-4
                    top-1/2

                    z-30

                    flex

                    h-11
                    w-11

                    -translate-y-1/2

                    items-center
                    justify-center

                    rounded-full

                    border
                    border-white/20

                    bg-black/60

                    text-xl

                    backdrop-blur-md

                    transition-all
                    duration-300

                    hover:border-[#d4af37]
                    hover:bg-[#d4af37]
                    hover:text-black
                  "
                >
                  ‹
                </button>

                <button
                  type="button"
                  onClick={proximaFoto}
                  aria-label="Próxima foto"
                  className="
                    absolute

                    right-4
                    top-1/2

                    z-30

                    flex

                    h-11
                    w-11

                    -translate-y-1/2

                    items-center
                    justify-center

                    rounded-full

                    border
                    border-white/20

                    bg-black/60

                    text-xl

                    backdrop-blur-md

                    transition-all
                    duration-300

                    hover:border-[#d4af37]
                    hover:bg-[#d4af37]
                    hover:text-black
                  "
                >
                  ›
                </button>

                {/* INDICADORES */}

                <div
                  className="
                    absolute

                    bottom-5
                    left-1/2

                    z-30

                    flex

                    -translate-x-1/2

                    gap-1.5
                  "
                >
                  {selecionado.imagens.map(
                    (_, index) => (
                      <button
                        key={index}
                        type="button"
                        aria-label={`Ver foto ${
                          index + 1
                        }`}
                        onClick={() =>
                          setFotoAtual(index)
                        }
                        className={`
                          h-1.5

                          rounded-full

                          transition-all
                          duration-300

                          ${
                            fotoAtual === index
                              ? "w-7 bg-[#d4af37]"
                              : "w-1.5 bg-white/40"
                          }
                        `}
                      />
                    )
                  )}
                </div>

                {/* NOME */}

                <div
                  className="
                    absolute

                    bottom-10
                    left-6
                    right-6

                    z-20

                    sm:left-8
                    sm:right-8
                  "
                >
                  <p
                    className="
                      text-[10px]
                      font-black
                      uppercase

                      tracking-[0.28em]

                      text-[#d4af37]
                    "
                  >
                    Chapada dos Veadeiros
                  </p>

                  <h3
                    className="
                      mt-3

                      text-3xl
                      font-black

                      sm:text-4xl
                      lg:text-5xl
                    "
                  >
                    {selecionado.nome}
                  </h3>

                  <p
                    className="
                      mt-2

                      text-sm

                      text-white/65

                      sm:text-base
                    "
                  >
                    {selecionado.subtitulo}
                  </p>
                </div>
              </div>

              {/* =================================================
                  INFORMAÇÕES
              ================================================= */}

              <div
                className="
                  flex
                  flex-col

                  justify-center

                  bg-gradient-to-br
                  from-[#181818]
                  via-[#0e0e0e]
                  to-black

                  p-6

                  sm:p-8
                  lg:p-10
                "
              >
                {/* DESTAQUE */}

                <div
                  className="
                    w-fit

                    rounded-full

                    border
                    border-[#d4af37]/30

                    bg-black/45

                    px-4
                    py-2

                    text-[9px]
                    font-black
                    uppercase

                    tracking-[0.18em]

                    text-[#d4af37]
                  "
                >
                  {selecionado.destaque}
                </div>

                {/* DESCRIÇÃO */}

                <p
                  className="
                    mt-6

                    text-sm
                    leading-7

                    text-white/65

                    sm:text-base
                    sm:leading-8
                  "
                >
                  {selecionado.descricao}
                </p>

                {/* LOCALIZAÇÃO */}

                <div
                  className="
                    mt-6

                    rounded-2xl

                    border
                    border-white/10

                    bg-black/45

                    p-4
                  "
                >
                  <p
                    className="
                      text-[9px]
                      font-black
                      uppercase

                      tracking-[0.2em]

                      text-white/35
                    "
                  >
                    📍 Localização
                  </p>

                  <p
                    className="
                      mt-2

                      text-sm
                      font-semibold
                      leading-6

                      text-white/80
                    "
                  >
                    {selecionado.localizacao}
                  </p>
                </div>

                {/* =================================================
                    INFO BOXES
                ================================================= */}

                <div
                  className="
                    mt-4

                    grid
                    grid-cols-2

                    gap-3
                  "
                >
                  <InfoBox
                    icone="🗺️"
                    titulo="Distância"
                    valor={selecionado.distancia}
                  />

                  <InfoBox
                    icone="⏱️"
                    titulo="Tempo de visita"
                    valor={selecionado.tempo}
                  />

                  <InfoBox
                    icone="🥾"
                    titulo="Dificuldade"
                    valor={selecionado.dificuldade}
                  />

                  <InfoBox
                    icone="🎟️"
                    titulo="Entrada"
                    valor={selecionado.entrada}
                  />

                  <InfoBox
                    icone="🕐"
                    titulo="Horário"
                    valor={selecionado.horario}
                  />

                  <InfoBox
                    icone="✨"
                    titulo="Destaque"
                    valor={selecionado.destaque}
                  />
                </div>

                {/* TELEFONE */}

                {selecionado.telefone && (
                  <div
                    className="
                      mt-3

                      rounded-2xl

                      border
                      border-white/10

                      bg-black/45

                      p-4
                    "
                  >
                    <p
                      className="
                        text-[9px]
                        font-black
                        uppercase

                        tracking-[0.18em]

                        text-white/30
                      "
                    >
                      ☎️ Contato
                    </p>

                    <p
                      className="
                        mt-2

                        text-sm
                        font-bold

                        text-white/80
                      "
                    >
                      {selecionado.telefone}
                    </p>
                  </div>
                )}

                {/* =================================================
                    DICAS
                ================================================= */}

                <div
                  className="
                    mt-6

                    rounded-2xl

                    border
                    border-white/10

                    bg-gradient-to-br
                    from-[#242424]
                    to-[#101010]

                    p-5
                  "
                >
                  <h4
                    className="
                      text-[10px]
                      font-black
                      uppercase

                      tracking-[0.22em]

                      text-[#d4af37]
                    "
                  >
                    Antes de ir
                  </h4>

                  <div
                    className="
                      mt-4
                      space-y-2
                    "
                  >
                    {selecionado.dicas.map(
                      (dica, index) => (
                        <div
                          key={index}
                          className="
                            flex

                            gap-2

                            text-xs
                            leading-5

                            text-white/55

                            sm:text-sm
                          "
                        >
                          <span className="text-[#d4af37]">
                            •
                          </span>

                          <span>
                            {dica}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* =================================================
                    BOTÕES DE AÇÃO
                ================================================= */}

                <div
                  className="
                    mt-6

                    grid
                    grid-cols-1

                    gap-3

                    sm:grid-cols-2
                  "
                >
                  {/* GOOGLE MAPS */}

                  <a
                    href={selecionado.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      group

                      flex

                      min-h-[62px]

                      items-center
                      justify-center

                      gap-3

                      rounded-2xl

                      border
                      border-[#d4af37]/60

                      bg-[#d4af37]

                      px-4
                      py-3

                      text-center

                      text-[10px]
                      font-black
                      uppercase

                      tracking-[0.06em]

                      text-black

                      shadow-[0_8px_25px_rgba(212,175,55,0.15)]

                      transition-all
                      duration-300

                      hover:-translate-y-1

                      hover:bg-[#e8c842]
                    "
                  >
                    <span
                      className="
                        flex

                        h-10
                        w-10

                        shrink-0

                        items-center
                        justify-center

                        rounded-xl

                        bg-black/10

                        text-xl
                      "
                    >
                      📍
                    </span>

                    <span>
                      Abrir no Google Maps
                    </span>
                  </a>

                  {/* INSTAGRAM */}

                  {selecionado.instagramUrl && (
                    <a
                      href={selecionado.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="
                        group

                        flex

                        min-h-[62px]

                        items-center
                        justify-center

                        gap-3

                        rounded-2xl

                        border
                        border-white/15

                        bg-gradient-to-br
                        from-[#292929]
                        via-[#171717]
                        to-[#0b0b0b]

                        px-4
                        py-3

                        text-center

                        text-[10px]
                        font-black
                        uppercase

                        tracking-[0.06em]

                        text-white

                        shadow-[0_10px_25px_rgba(0,0,0,0.30)]

                        transition-all
                        duration-300

                        hover:-translate-y-1

                        hover:border-[#ff2a7f]/60

                        hover:shadow-[0_0_28px_rgba(255,42,127,0.14)]
                      "
                    >
                      <img
                        src="/instagram-3d.png"
                        alt=""
                        aria-hidden="true"
                        draggable={false}
                        className="
                          h-11
                          w-11

                          shrink-0

                          object-contain

                          drop-shadow-[0_4px_10px_rgba(255,0,110,0.30)]

                          transition-transform
                          duration-300

                          group-hover:scale-110
                        "
                      />

                      <span>
                        Instagram oficial
                      </span>
                    </a>
                  )}
                </div>

                {/* =================================================
                    WHATSAPP IMPÉRIO CHALÉS
                ================================================= */}

                <a
                  href={whatsappImperio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    group

                    mt-3

                    flex
                    min-h-[64px]
                    w-full

                    items-center
                    justify-center

                    gap-3

                    rounded-2xl

                    border
                    border-[#25D366]/35

                    bg-gradient-to-r
                    from-[#101a13]
                    via-[#15281b]
                    to-[#101a13]

                    px-5
                    py-3

                    text-center

                    text-[10px]
                    font-black
                    uppercase

                    tracking-[0.07em]

                    text-white

                    shadow-[0_10px_30px_rgba(0,0,0,0.35)]

                    transition-all
                    duration-300

                    hover:-translate-y-1

                    hover:border-[#25D366]/75

                    hover:shadow-[0_0_30px_rgba(37,211,102,0.16)]
                  "
                >
                  <img
                    src="/whatsapp.png"
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    className="
                      h-12
                      w-12

                      shrink-0

                      object-contain

                      drop-shadow-[0_5px_12px_rgba(37,211,102,0.30)]

                      transition-transform
                      duration-300

                      group-hover:scale-110
                    "
                  />

                  <span>
                    Falar com a Império Chalés
                  </span>
                </a>

                {/* =================================================
                    VOLTAR
                ================================================= */}

                <button
                  type="button"
                  onClick={voltar}
                  className="
                    mt-3

                    flex
                    w-full

                    items-center
                    justify-center

                    rounded-2xl

                    border
                    border-white/10

                    bg-black/25

                    px-5
                    py-4

                    text-[10px]
                    font-black
                    uppercase

                    tracking-[0.08em]

                    text-white/65

                    transition-all
                    duration-300

                    hover:border-white/25

                    hover:bg-white/[0.05]

                    hover:text-white
                  "
                >
                  ← Voltar aos atrativos
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* =========================================================
   INFO BOX
========================================================= */

function InfoBox({
  icone,
  titulo,
  valor,
}: {
  icone: string;
  titulo: string;
  valor: string;
}) {
  return (
    <div
      className="
        rounded-2xl

        border
        border-white/10

        bg-gradient-to-br
        from-[#262626]
        via-[#181818]
        to-[#0b0b0b]

        p-4

        shadow-[0_8px_20px_rgba(0,0,0,0.25)]
      "
    >
      <div className="text-base">
        {icone}
      </div>

      <p
        className="
          mt-3

          text-[8px]
          font-black
          uppercase

          tracking-[0.18em]

          text-white/35

          sm:text-[9px]
        "
      >
        {titulo}
      </p>

      <p
        className="
          mt-1

          text-xs
          font-bold

          leading-5

          text-white/85

          sm:text-sm
        "
      >
        {valor}
      </p>
    </div>
  );
}