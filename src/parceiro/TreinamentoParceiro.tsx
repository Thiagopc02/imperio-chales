import { useEffect, useState } from "react";

type Props = {
  aberto: boolean;
  onConcluir: () => void;
};

type Etapa = 0 | 1 | 2 | 3 | 4;

const nomesEtapas = [
  "Boas-vindas",
  "Conheça o pedido",
  "Aceite e prepare",
  "Pedido pronto",
  "Treinamento concluído",
];

export function TreinamentoParceiro({
  aberto,
  onConcluir,
}: Props) {
  const [etapa, setEtapa] = useState<Etapa>(0);
  const [tempo, setTempo] = useState("");
  const [entregador, setEntregador] = useState("");
  const [aceitou, setAceitou] = useState(false);
  const [pronto, setPronto] = useState(false);
  const [concordou, setConcordou] = useState(false);

  // Evita rolar o painel que está atrás da janela.
  useEffect(() => {
    if (!aberto) return;

    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = anterior;
    };
  }, [aberto]);

  // Reinicia apenas se o componente for aberto novamente.
  useEffect(() => {
    if (!aberto) return;

    setEtapa(0);
    setTempo("");
    setEntregador("");
    setAceitou(false);
    setPronto(false);
    setConcordou(false);
  }, [aberto]);

  if (!aberto) return null;

  function aceitarPedido() {
    if (!tempo || !entregador) return;

    setAceitou(true);
    setEtapa(3);
  }

  function finalizar() {
    if (!pronto || !concordou) return;
    onConcluir();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-treinamento"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#07140f]/90 p-3 backdrop-blur-sm md:p-6"
    >
      <div className="flex max-h-[95dvh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-blue-300 bg-white shadow-2xl">

        {/* CABEÇALHO FIXO */}

        <div className="shrink-0 bg-gradient-to-r from-blue-800 via-blue-600 to-cyan-500 p-5 text-white md:p-7">

          <div className="flex items-center justify-between gap-3">

            <span className="rounded-full border border-white/40 bg-white/10 px-3 py-1 text-xs font-bold">
              🎓 APRENDA AGORA
            </span>

            <span className="text-xs font-bold">
              {etapa + 1} de 5
            </span>

          </div>

          <div className="mt-5 flex gap-1.5">
            {nomesEtapas.map((nome, indice) => (
              <div
                key={nome}
                className={`h-1.5 flex-1 rounded-full ${
                  indice <= etapa
                    ? "bg-white"
                    : "bg-white/30"
                }`}
              />
            ))}
          </div>

          <h2
            id="titulo-treinamento"
            className="mt-5 text-2xl font-extrabold md:text-3xl"
          >
            {nomesEtapas[etapa]}
          </h2>

          <p className="mt-2 text-sm text-blue-50">
            Treinamento interativo do Portal do Parceiro.
          </p>

        </div>

        {/* ÁREA COM ROLAGEM PRÓPRIA */}

        <div className="min-h-0 flex-1 overflow-y-auto p-5 md:p-8">

          {/* ETAPA 1 */}

          {etapa === 0 && (
            <div className="space-y-6 text-center">

              <div className="text-6xl">👋</div>

              <h3 className="text-2xl font-bold text-[#19352b]">
                Bem-vindo ao Sabores da Chapada!
              </h3>

              <p className="text-sm leading-7 text-gray-600">
                Você aprenderá a receber os pedidos
                dos hóspedes, informar o tempo
                de preparo e atualizar o andamento.
              </p>

              <div className="rounded-2xl bg-blue-50 p-5 text-left text-sm leading-7 text-blue-900">
                ✅ Os pedidos deste treinamento são fictícios.
                Você pode praticar sem afetar clientes reais.
              </div>

              <button
                type="button"
                onClick={() => setEtapa(1)}
                className="w-full rounded-2xl bg-blue-600 p-4 font-bold text-white hover:bg-blue-700"
              >
                🚀 Começar treinamento
              </button>

            </div>
          )}

          {/* ETAPA 2 */}

          {etapa === 1 && (
            <div className="space-y-5">

              <p className="text-sm leading-7 text-gray-600">
                Quando um pedido chegar, confira
                o chalé de origem, os itens e
                suas respectivas quantidades.
              </p>

              <div className="rounded-2xl border-2 border-red-400 bg-white p-5">

                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-gray-500">
                    DEMO-001
                  </span>

                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                    ❗ Novo pedido
                  </span>
                </div>

                <h3 className="mt-4 text-xl font-bold">
                  🏡 Chalé 02
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Horário demonstrativo: 19h30
                </p>

                <div className="mt-5 space-y-3">

                  {[
                    {
                      nome: "Hambúrguer artesanal",
                      quantidade: 2,
                      imagem: "/produtos/hamburguer.jpg",
                    },
                    {
                      nome: "Batata frita",
                      quantidade: 1,
                      imagem: "/produtos/batata.jpg",
                    },
                  ].map((produto) => (
                    <div
                      key={produto.nome}
                      className="flex items-center gap-3 rounded-xl bg-[#f8f6ef] p-3"
                    >

                      <img
                        src={produto.imagem}
                        alt={produto.nome}
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                        className="h-16 w-16 shrink-0 rounded-lg bg-white object-cover"
                      />

                      <div className="min-w-0">
                        <p className="text-sm font-bold">
                          {produto.nome}
                        </p>

                        <p className="text-xs text-gray-500">
                          Quantidade: {produto.quantidade}
                        </p>
                      </div>

                    </div>
                  ))}

                </div>

              </div>

              <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                ⚠️ Caso não possa atender, recuse
                a solicitação antes de aceitá-la.
                Depois da aceitação, qualquer
                imprevisto deverá ser tratado
                com a administração.
              </div>

              <button
                type="button"
                onClick={() => setEtapa(2)}
                className="w-full rounded-2xl bg-blue-600 p-4 font-bold text-white hover:bg-blue-700"
              >
                Entendi, continuar →
              </button>

            </div>
          )}

          {/* ETAPA 3 */}

          {etapa === 2 && (
            <div className="space-y-5">

              <p className="text-sm leading-7 text-gray-600">
                Agora pratique a confirmação do pedido.
                Escolha o tempo de preparo e informe
                se há entregador disponível.
              </p>

              <div className="rounded-2xl border-2 border-red-400 p-5">

                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                  ❗ DEMO-001 — Novo pedido
                </span>

                <h3 className="mt-4 text-xl font-bold">
                  🏡 Chalé 02
                </h3>

                <div className="mt-5">

                  <label
                    htmlFor="treinamento-tempo"
                    className="mb-2 block text-sm font-bold"
                  >
                    ⏱️ Tempo de preparo
                  </label>

                  <select
                    id="treinamento-tempo"
                    value={tempo}
                    onChange={(event) =>
                      setTempo(event.target.value)
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white p-4"
                  >
                    <option value="">
                      Selecione o tempo
                    </option>

                    <option value="15">
                      15 minutos
                    </option>

                    <option value="30">
                      30 minutos
                    </option>

                    <option value="45">
                      45 minutos
                    </option>

                    <option value="60">
                      1 hora
                    </option>
                  </select>

                </div>

                <div className="mt-5">

                  <p className="mb-2 text-sm font-bold">
                    🛵 Possui entregador disponível?
                  </p>

                  <div className="grid grid-cols-2 gap-2">

                    <button
                      type="button"
                      aria-pressed={entregador === "sim"}
                      onClick={() => setEntregador("sim")}
                      className={`rounded-xl border p-4 font-bold ${
                        entregador === "sim"
                          ? "border-green-700 bg-green-700 text-white"
                          : "bg-white"
                      }`}
                    >
                      Sim
                    </button>

                    <button
                      type="button"
                      aria-pressed={entregador === "nao"}
                      onClick={() => setEntregador("nao")}
                      className={`rounded-xl border p-4 font-bold ${
                        entregador === "nao"
                          ? "border-red-600 bg-red-600 text-white"
                          : "bg-white"
                      }`}
                    >
                      Não
                    </button>

                  </div>

                </div>

                {entregador === "nao" && (
                  <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                    ⚠️ A retirada dependerá de confirmação
                    da administração. Não prometa entrega
                    sem essa confirmação.
                  </p>
                )}

                <button
                  type="button"
                  onClick={aceitarPedido}
                  disabled={!tempo || !entregador || aceitou}
                  className="mt-6 w-full rounded-xl bg-green-700 p-4 font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  ✓ Confirmar e iniciar preparo
                </button>

              </div>

            </div>
          )}

          {/* ETAPA 4 */}

          {etapa === 3 && (
            <div className="space-y-5">

              <div className="rounded-2xl bg-green-50 p-5 text-sm text-green-900">

                <p className="font-bold">
                  ✅ Pedido aceito!
                </p>

                <p className="mt-2">
                  Tempo informado: {tempo} minutos
                </p>

                <p className="mt-1">
                  {entregador === "sim"
                    ? "🛵 Entregador disponível"
                    : "📦 Retirada necessária"}
                </p>

              </div>

              <p className="text-sm leading-7 text-gray-600">
                Na operação real, o sistema acompanhará
                o prazo informado. Quando a refeição
                estiver pronta, confirme no painel.
              </p>

              <div className="rounded-2xl border-2 border-amber-400 p-5">

                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                  ⏳ Em preparação
                </span>

                <h3 className="mt-4 text-xl font-bold">
                  DEMO-001 — Chalé 02
                </h3>

                <button
                  type="button"
                  onClick={() => {
                    setPronto(true);
                    setEtapa(4);
                  }}
                  className="mt-6 w-full rounded-xl bg-blue-600 p-4 font-bold text-white hover:bg-blue-700"
                >
                  ✓ Marcar pedido como pronto
                </button>

              </div>

            </div>
          )}

          {/* ETAPA 5 */}

          {etapa === 4 && (
            <div className="space-y-6 text-center">

              <div className="text-6xl">
                🎉
              </div>

              <h3 className="text-2xl font-extrabold text-green-800">
                Você aprendeu a operar os pedidos!
              </h3>

              <p className="text-sm leading-7 text-gray-600">
                O pedido demonstrativo foi marcado
                como pronto. Lembre-se de que
                a entrega precisa ser confirmada
                separadamente.
              </p>

              <div className="rounded-2xl bg-green-50 p-5 text-left text-sm leading-7 text-green-900">

                <p>✅ Pedido recebido e analisado.</p>

                <p>✅ Tempo de preparo informado.</p>

                <p>✅ Disponibilidade do entregador registrada.</p>

                <p>✅ Pedido marcado como pronto.</p>

              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-left text-sm">

                <input
                  type="checkbox"
                  checked={concordou}
                  onChange={(event) =>
                    setConcordou(event.target.checked)
                  }
                  className="mt-1 h-5 w-5 accent-blue-700"
                />

                <span>
                  Entendi que pedidos aceitos não
                  podem ser cancelados diretamente
                  pelo estabelecimento e que devo
                  atualizar corretamente o andamento.
                </span>

              </label>

              <button
                type="button"
                onClick={finalizar}
                disabled={!pronto || !concordou}
                className="w-full rounded-2xl bg-green-700 p-4 font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                ✅ Concluir treinamento
              </button>

            </div>
          )}

        </div>

        {/* RODAPÉ FIXO */}

        <div className="shrink-0 border-t border-gray-100 bg-white px-5 py-4">

          <p className="text-center text-xs text-gray-500">
            🔒 Treinamento demonstrativo.
            Nenhum pedido real será alterado.
          </p>

        </div>

      </div>
    </div>
  );
}

export default TreinamentoParceiro;