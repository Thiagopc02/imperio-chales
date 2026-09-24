import { useEffect, useRef, useState } from "react";
import type { Restaurante } from "../restaurantes";
import { restaurantes } from "../restaurantes";

export function ParceirosCarrossel() {
  const parceiros = restaurantes.filter(
    (restaurante) => restaurante.ativo
  );

  const trilhoRef = useRef<HTMLDivElement>(null);
  const [pausado, setPausado] = useState(false);
  const [movimentoReduzido, setMovimentoReduzido] = useState(false);

  useEffect(() => {
    const consulta = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    const atualizar = () => {
      setMovimentoReduzido(consulta.matches);
    };

    atualizar();

    consulta.addEventListener("change", atualizar);

    return () => {
      consulta.removeEventListener("change", atualizar);
    };
  }, []);

  // Não exibimos estabelecimentos fictícios.
  if (parceiros.length === 0) {
    return (
      <section className="mx-auto mb-14 max-w-6xl px-4">
        <div className="rounded-3xl border border-amber-200 bg-white px-6 py-10 text-center shadow-sm">
          <span className="text-3xl">🤝</span>

          <h2 className="mt-4 text-2xl font-bold text-[#19352b]">
            Nossos parceiros gastronômicos
          </h2>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-gray-500">
            Em breve você conhecerá os estabelecimentos
            parceiros do Império Chalés.
          </p>
        </div>
      </section>
    );
  }

  const duplicar = parceiros.length > 1;

  function criarCartao(
    restaurante: Restaurante,
    indice: number,
    duplicado: boolean
  ) {
    return (
      <a
        key={`${restaurante.id}-${indice}-${duplicado}`}
        href={`#restaurante-${restaurante.id}`}
        aria-hidden={duplicado ? true : undefined}
        tabIndex={duplicado ? -1 : 0}
        className="flex w-[220px] shrink-0 flex-col items-center justify-center rounded-2xl border border-[#e8e2d5] bg-white p-5 text-center shadow-sm transition hover:border-amber-300 hover:shadow-lg sm:w-[260px]"
      >
        {restaurante.logo ? (
          <img
            src={restaurante.logo}
            alt={duplicado ? "" : restaurante.nome}
            className="h-20 w-20 rounded-full object-contain"
            loading="lazy"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#19352b] text-3xl text-white">
            🍽️
          </div>
        )}

        <h3 className="mt-4 text-base font-bold text-[#19352b]">
          {restaurante.nome}
        </h3>

        <p className="mt-2 text-xs text-gray-500">
          {restaurante.categoria}
        </p>

        <span className="mt-4 text-xs font-semibold text-[#ad8746]">
          Conhecer restaurante →
        </span>
      </a>
    );
  }

  return (
    <section className="mx-auto mb-14 max-w-6xl px-4">
      <div className="mb-7 text-center">
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#ad8746]">
          PARCERIAS IMPÉRIO
        </span>

        <h2 className="mt-3 text-3xl font-bold text-[#19352b]">
          Nossos parceiros gastronômicos
        </h2>

        <p className="mt-3 text-sm text-gray-500">
          Conheça os estabelecimentos disponíveis em nosso catálogo.
        </p>
      </div>

      <div
        className="overflow-hidden rounded-3xl"
        onMouseEnter={() => setPausado(true)}
        onMouseLeave={() => setPausado(false)}
        onFocusCapture={() => setPausado(true)}
        onBlurCapture={(event) => {
          if (
            !event.currentTarget.contains(event.relatedTarget)
          ) {
            setPausado(false);
          }
        }}
      >
        <div
          ref={trilhoRef}
          className={`flex w-max gap-4 py-3 ${
            duplicar && !movimentoReduzido
              ? "animate-parceiros"
              : ""
          }`}
          style={{
            animationPlayState: pausado ? "paused" : "running",
          }}
        >
          {parceiros.map((restaurante, indice) =>
            criarCartao(restaurante, indice, false)
          )}

          {duplicar &&
            !movimentoReduzido &&
            parceiros.map((restaurante, indice) =>
              criarCartao(restaurante, indice, true)
            )}
        </div>
      </div>

      <style>{`
        @keyframes parceiros-infinito {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(calc(-50% - 8px));
          }
        }

        .animate-parceiros {
          animation: parceiros-infinito 30s linear infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-parceiros {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}

export default ParceirosCarrossel;