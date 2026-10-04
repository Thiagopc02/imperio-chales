import { useEffect, useMemo, useState } from "react";

/* =========================================================
   CARREGA AUTOMATICAMENTE TODAS AS FOTOS DOS CHALÉS

   Aceita nomes como:
   Chale01.png
   Chale02.png
   Chale26(1).png
   Chale29.png
   Chales30.png
   Chales31.png

   Assim NÃO precisamos importar foto por foto.
========================================================= */

const modulosFotos = import.meta.glob("./atrativos/Chale*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

/* =========================================================
   PEGA O NÚMERO DA FOTO PARA ORGANIZAR
========================================================= */

function pegarNumeroFoto(caminho: string) {
  const nomeArquivo = caminho.split("/").pop() ?? "";

  const resultado = nomeArquivo.match(/Chales?(\d+)/i);

  if (!resultado) {
    return 9999;
  }

  return Number(resultado[1]);
}

/* =========================================================
   CRIA A LISTA DE FOTOS AUTOMATICAMENTE
========================================================= */

const fotos = Object.entries(modulosFotos)
  .sort(([caminhoA], [caminhoB]) => {
    const numeroA = pegarNumeroFoto(caminhoA);
    const numeroB = pegarNumeroFoto(caminhoB);

    if (numeroA !== numeroB) {
      return numeroA - numeroB;
    }

    return caminhoA.localeCompare(caminhoB);
  })
  .map(([, imagem]) => imagem);

/* =========================================================
   COMPONENTE
========================================================= */

export function HeroGallery() {
  const [fotoAtual, setFotoAtual] = useState(0);

  /* =========================================================
     QUANTIDADE TOTAL
  ========================================================= */

  const totalFotos = fotos.length;

  /* =========================================================
     CARROSSEL AUTOMÁTICO
  ========================================================= */

  useEffect(() => {
    if (totalFotos <= 1) {
      return;
    }

    const intervalo = window.setInterval(() => {
      setFotoAtual((atual) =>
        atual === totalFotos - 1 ? 0 : atual + 1
      );
    }, 5000);

    return () => {
      window.clearInterval(intervalo);
    };
  }, [totalFotos]);

  /* =========================================================
     GARANTE ÍNDICE VÁLIDO
  ========================================================= */

  useEffect(() => {
    if (fotoAtual >= totalFotos && totalFotos > 0) {
      setFotoAtual(0);
    }
  }, [fotoAtual, totalFotos]);

  /* =========================================================
     FOTO ANTERIOR
  ========================================================= */

  const fotoAnterior = () => {
    if (totalFotos === 0) {
      return;
    }

    setFotoAtual((atual) =>
      atual === 0 ? totalFotos - 1 : atual - 1
    );
  };

  /* =========================================================
     PRÓXIMA FOTO
  ========================================================= */

  const proximaFoto = () => {
    if (totalFotos === 0) {
      return;
    }

    setFotoAtual((atual) =>
      atual === totalFotos - 1 ? 0 : atual + 1
    );
  };

  /* =========================================================
     INDICADORES DINÂMICOS

     Em vez de colocar 31 bolinhas na tela,
     mostramos apenas 7 próximas da foto atual.
  ========================================================= */

  const indicadoresVisiveis = useMemo(() => {
    if (totalFotos <= 7) {
      return Array.from(
        { length: totalFotos },
        (_, index) => index
      );
    }

    const quantidade = 7;
    const metade = Math.floor(quantidade / 2);

    let inicio = fotoAtual - metade;

    if (inicio < 0) {
      inicio = 0;
    }

    if (inicio + quantidade > totalFotos) {
      inicio = totalFotos - quantidade;
    }

    return Array.from(
      { length: quantidade },
      (_, index) => inicio + index
    );
  }, [fotoAtual, totalFotos]);

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div
      className="
        relative
        z-20

        mx-auto
        w-full
        max-w-[1500px]

        px-4

        sm:px-5
        md:px-6
      "
    >
      {/* =====================================================
          LOGO IMPÉRIO CHALÉS
      ====================================================== */}

      <div
        className="
          flex
          flex-col

          items-center
          justify-center

          pb-8
          pt-10

          text-center

          sm:pb-10
          sm:pt-12
        "
      >
        <img
          src="/centro.png"
          alt="Império Chalés - Vila do Sossego"
          draggable={false}
          className="
            w-[300px]
            max-w-[85vw]

            object-contain

            select-none

            sm:w-[360px]
            md:w-[420px]
          "
        />

        <p
          className="
            mt-5

            text-xs
            font-medium
            tracking-[0.01em]

            text-white/55

            sm:text-sm
          "
        >
          Conforto, natureza e momentos inesquecíveis em Alto Paraíso.
        </p>
      </div>

      {/* =====================================================
          GALERIA PRINCIPAL
      ====================================================== */}

      <div
        className="
          group
          relative

          mx-auto

          h-[330px]
          w-full

          overflow-hidden

          rounded-[26px]

          border
          border-[#d4af37]/30

          bg-black

          shadow-[0_24px_80px_rgba(0,0,0,0.48)]

          sm:h-[430px]
          md:h-[520px]
          lg:h-[620px]
        "
      >
        {/* =================================================
            CASO NENHUMA FOTO SEJA ENCONTRADA
        ================================================== */}

        {totalFotos === 0 && (
          <div
            className="
              absolute
              inset-0

              flex
              items-center
              justify-center

              text-center
            "
          >
            <div>
              <div className="text-4xl">📸</div>

              <p
                className="
                  mt-4
                  text-sm
                  text-white/50
                "
              >
                Nenhuma foto dos chalés foi encontrada.
              </p>
            </div>
          </div>
        )}

        {/* =================================================
            FOTOS
        ================================================== */}

        {fotos.map((foto, index) => (
          <img
            key={`${foto}-${index}`}
            src={foto}
            alt={`Império Chalés - foto ${index + 1}`}
            draggable={false}
            loading={index === 0 ? "eager" : "lazy"}
            className={`
              absolute
              inset-0

              h-full
              w-full

              object-cover
              object-center

              select-none

              transition-all
              duration-1000
              ease-in-out

              ${
                fotoAtual === index
                  ? "scale-100 opacity-100"
                  : "pointer-events-none scale-[1.025] opacity-0"
              }
            `}
          />
        ))}

        {/* =================================================
            SOMBRA SUAVE
        ================================================== */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none

            absolute
            inset-0

            bg-gradient-to-t

            from-black/25
            via-transparent
            to-black/10
          "
        />

        {/* =================================================
            CONTADOR
        ================================================== */}

        {totalFotos > 0 && (
          <div
            className="
              absolute

              right-4
              top-4

              z-30

              rounded-full

              border
              border-white/15

              bg-black/65

              px-4
              py-2

              text-[9px]
              font-black
              tracking-[0.14em]
              text-white

              backdrop-blur-md

              sm:right-5
              sm:top-5
              sm:text-[10px]
            "
          >
            {String(fotoAtual + 1).padStart(2, "0")}
            {" / "}
            {String(totalFotos).padStart(2, "0")}
          </div>
        )}

        {/* =================================================
            SETA ESQUERDA
        ================================================== */}

        {totalFotos > 1 && (
          <button
            type="button"
            onClick={fotoAnterior}
            aria-label="Foto anterior"
            className="
              absolute

              left-4
              top-1/2

              z-40

              flex
              h-11
              w-11

              -translate-y-1/2

              items-center
              justify-center

              rounded-full

              border
              border-white/20

              bg-black/50

              text-xl
              font-light
              text-white

              backdrop-blur-md

              transition-all
              duration-300

              hover:scale-110
              hover:border-[#d4af37]
              hover:bg-[#d4af37]
              hover:text-black

              sm:h-12
              sm:w-12
            "
          >
            ‹
          </button>
        )}

        {/* =================================================
            SETA DIREITA
        ================================================== */}

        {totalFotos > 1 && (
          <button
            type="button"
            onClick={proximaFoto}
            aria-label="Próxima foto"
            className="
              absolute

              right-4
              top-1/2

              z-40

              flex
              h-11
              w-11

              -translate-y-1/2

              items-center
              justify-center

              rounded-full

              border
              border-white/20

              bg-black/50

              text-xl
              font-light
              text-white

              backdrop-blur-md

              transition-all
              duration-300

              hover:scale-110
              hover:border-[#d4af37]
              hover:bg-[#d4af37]
              hover:text-black

              sm:h-12
              sm:w-12
            "
          >
            ›
          </button>
        )}

        {/* =================================================
            INDICADORES

            MOSTRA SOMENTE 7 POR VEZ PARA NÃO POLUIR A TELA
        ================================================== */}

        {totalFotos > 1 && (
          <div
            className="
              absolute

              bottom-4
              left-1/2

              z-40

              flex

              -translate-x-1/2

              items-center
              justify-center

              gap-1.5

              rounded-full

              border
              border-white/10

              bg-black/40

              px-3
              py-2

              backdrop-blur-md

              sm:bottom-5
            "
          >
            {indicadoresVisiveis.map((index) => (
              <button
                key={index}
                type="button"
                onClick={() => setFotoAtual(index)}
                aria-label={`Ir para foto ${index + 1}`}
                className={`
                  h-[6px]

                  shrink-0

                  rounded-full

                  transition-all
                  duration-300

                  ${
                    index === fotoAtual
                      ? "w-7 bg-[#d4af37]"
                      : "w-[6px] bg-white/45 hover:bg-white/80"
                  }
                `}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}