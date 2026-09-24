
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  onSnapshot,
} from "firebase/firestore";

import { db } from "../firebase/config";

import "../styles/experiencias-escolhidas.css";

interface Experiencia {
  id: string;
  restauranteId: string;
  restauranteNome: string;
  nome: string;
  descricao: string;
  imagemUrl: string;
  preco: number;
  pessoas: number;
}

interface ExperienciasEscolhidasProps {
  onExplorar: () => void;
}

function moeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

export function ExperienciasEscolhidas({
  onExplorar,
}: ExperienciasEscolhidasProps) {
  const [experiencias, setExperiencias] = useState<
    Experiencia[]
  >([]);

  const [carregando, setCarregando] = useState(true);

  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    let versao = 0;

    const cancelar = onSnapshot(
      collection(db, "catalogoPublico"),

      async (resultado) => {
        const minhaVersao = ++versao;

        setCarregando(true);
        setErro("");

        try {
          const restaurantes = resultado.docs
            .filter(
              (documento) =>
                documento.data().ativo === true
            )
            .sort((a, b) =>
              String(a.data().nome || "").localeCompare(
                String(b.data().nome || ""),
                "pt-BR"
              )
            );

          const resultados = await Promise.all(
            restaurantes.map(async (restaurante) => {
              const pratos = await getDocs(
                collection(
                  db,
                  "catalogoPublico",
                  restaurante.id,
                  "pratos"
                )
              );

              return pratos.docs
                .filter((prato) => {
                  const dados = prato.data();

                  return (
                    dados.status === "aprovado" &&
                    dados.disponivel === true &&
                    typeof dados.preco === "number" &&
                    dados.preco > 0
                  );
                })
                .map((prato): Experiencia => {
                  const dados = prato.data();

                  return {
                    id: prato.id,
                    restauranteId: restaurante.id,
                    restauranteNome: String(
                      restaurante.data().nome ||
                        "Restaurante parceiro"
                    ),
                    nome: String(dados.nome || "Prato"),
                    descricao: String(
                      dados.descricao || ""
                    ),
                    imagemUrl: String(
                      dados.imagemUrl || ""
                    ),
                    preco: dados.preco,
                    pessoas:
                      typeof dados.pessoas === "number"
                        ? dados.pessoas
                        : 1,
                  };
                });
            })
          );

          if (!ativo || minhaVersao !== versao) {
            return;
          }

          const lista = resultados
            .flat()
            .sort((a, b) => {
              const restaurante = a.restauranteNome.localeCompare(
                b.restauranteNome,
                "pt-BR"
              );

              if (restaurante !== 0) {
                return restaurante;
              }

              return a.nome.localeCompare(
                b.nome,
                "pt-BR"
              );
            })
            .slice(0, 3);

          setExperiencias(lista);
          setErro("");
        } catch (falha) {
          console.error(
            "Erro ao carregar experiências:",
            falha
          );

          if (ativo && minhaVersao === versao) {
            setExperiencias([]);
            setErro(
              "Não foi possível carregar os destaques agora."
            );
          }
        } finally {
          if (ativo && minhaVersao === versao) {
            setCarregando(false);
          }
        }
      },

      (falha) => {
        console.error(
          "Erro ao consultar catálogo:",
          falha
        );

        if (ativo) {
          setExperiencias([]);
          setCarregando(false);
          setErro(
            "Não foi possível carregar os destaques agora."
          );
        }
      }
    );

    return () => {
      ativo = false;
      versao++;
      cancelar();
    };
  }, []);

  return (
    <section
      aria-labelledby="titulo-experiencias"
      className="experiencias-magicas mx-auto w-full max-w-7xl px-3 pb-12 pt-8 text-white sm:px-6 sm:pb-16"
    >
      <div className="experiencias-magicas-fundo rounded-[30px] border border-[#9a783d]/40 px-4 py-9 sm:px-8 sm:py-12">
        <div className="relative z-10 text-center">
          <span className="inline-flex rounded-full border border-[#b99452]/50 bg-[#bc9652]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#edce8f]">
            ✨ Seleção especial para hóspedes
          </span>

          <h2
            id="titulo-experiencias"
            className="mt-5 text-3xl font-black leading-tight text-white sm:text-4xl"
          >
            Experiências mais escolhidas
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-gray-300">
            Conheça alguns destaques disponíveis
            nos cardápios dos nossos parceiros.
          </p>

          <p className="mt-2 text-xs text-[#bba77f]">
            Seleção do catálogo. Ainda não é um
            ranking de pedidos ou vendas.
          </p>
        </div>

        {carregando ? (
          <p className="relative z-10 mt-10 text-center text-sm text-gray-300">
            ✨ Preparando suas experiências...
          </p>
        ) : erro ? (
          <div
            role="alert"
            className="relative z-10 mx-auto mt-9 max-w-lg rounded-2xl border border-white/15 bg-white/5 p-5 text-center text-sm text-gray-200"
          >
            {erro}
          </div>
        ) : experiencias.length === 0 ? (
          <div className="relative z-10 mx-auto mt-9 max-w-lg rounded-2xl border border-white/15 bg-white/5 p-6 text-center">
            <p className="text-3xl">🍽️</p>

            <h3 className="mt-3 text-lg font-black">
              Novas experiências em breve
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-300">
              Estamos preparando os destaques.
              Enquanto isso, explore os restaurantes.
            </p>

            <button
              type="button"
              onClick={onExplorar}
              className="mt-5 rounded-xl bg-[#e6c47a] px-6 py-3 text-sm font-black text-[#171717]"
            >
              Ver restaurantes →
            </button>
          </div>
        ) : (
          <div className="relative z-10 mt-10 grid gap-7 md:grid-cols-3">
            {experiencias.map((experiencia, indice) => (
              <article
                key={`${experiencia.restauranteId}-${experiencia.id}`}
                className="experiencia-carta group flex flex-col overflow-hidden rounded-[26px] border border-[#a48448]/60 bg-[#222222]"
                style={{
                  animationDelay: `${indice * 0.55}s`,
                }}
              >
                <div className="relative h-52 overflow-hidden bg-[#303030]">
                  {experiencia.imagemUrl ? (
                    <img
                      src={experiencia.imagemUrl}
                      alt={`Imagem ilustrativa de ${experiencia.nome}`}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-6xl">
                      🍽️
                    </div>
                  )}

                  <div className="absolute left-3 top-3 rounded-full border border-[#d5b16a]/50 bg-black/80 px-3 py-2 text-[10px] font-black text-[#eac980]">
                    ✦ DESTAQUE {indice + 1}
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <p className="text-xs font-bold text-[#dbb96d]">
                    {experiencia.restauranteNome}
                  </p>

                  <h3 className="mt-2 text-xl font-black text-white">
                    {experiencia.nome}
                  </h3>

                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-300">
                    {experiencia.descricao ||
                      "Conheça esta experiência gastronômica."}
                  </p>

                  <p className="mt-3 text-xs text-gray-400">
                    Serve{" "}
                    {experiencia.pessoas}{" "}
                    {experiencia.pessoas === 1
                      ? "pessoa"
                      : "pessoas"}
                  </p>

                  <div className="mt-auto pt-6">
                    <p className="text-2xl font-black text-[#edcd82]">
                      {moeda(experiencia.preco)}
                    </p>

                    <button
                      type="button"
                      onClick={onExplorar}
                      className="experiencia-botao mt-5 w-full rounded-xl px-5 py-4 text-sm font-black text-[#171717]"
                    >
                      🍽️ Explorar cardápios →
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {experiencias.length > 0 && !carregando && (
          <p className="relative z-10 mt-8 text-center text-xs leading-6 text-gray-400">
            Valores e disponibilidade sujeitos
            à confirmação do restaurante.
            Nenhum pedido é criado ao abrir o cardápio.
          </p>
        )}
      </div>
    </section>
  );
}

export default ExperienciasEscolhidas;