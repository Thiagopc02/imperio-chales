
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  doc,
  onSnapshot,
} from "firebase/firestore";

import { auth, db } from "../firebase/config";
import { TreinamentoParceiro } from "./TreinamentoParceiro";

// =====================================================
// TIPOS
// =====================================================

type Chale = "01" | "02" | "03";

type StatusPedido =
  | "novo"
  | "preparacao"
  | "pronto"
  | "recusado";

type StatusRestaurante =
  | "pendente"
  | "aprovado"
  | "rejeitado";

interface ItemPedido {
  produtoId: string;
  nome: string;
  quantidade: number;
  imagemUrl: string;
}

interface Pedido {
  id: string;
  chale: Chale;
  itens: ItemPedido[];
  horario: string;
  status: StatusPedido;
  minutosPreparo: number | null;
  entregadorDisponivel: boolean | null;
  confirmadoEm: number | null;
  prontoEm: number | null;
  recusadoEm: number | null;
  motivoRecusa: string | null;
}

interface RestauranteParceiro {
  uid: string;
  nomeEmpresa: string;
  email: string;
  nomeResponsavel: string;
  telefone: string;
  logoUrl: string;
  status: StatusRestaurante;
}

// =====================================================
// PEDIDOS FICTÍCIOS
// =====================================================

const pedidosIniciais: Pedido[] = [
  {
    id: "DEMO-001",
    chale: "02",
    horario: "19:30",
    status: "novo",
    minutosPreparo: null,
    entregadorDisponivel: null,
    confirmadoEm: null,
    prontoEm: null,
    recusadoEm: null,
    motivoRecusa: null,
    itens: [
      {
        produtoId: "demo-hamburguer",
        nome: "Hambúrguer artesanal",
        quantidade: 2,
        imagemUrl: "/produtos/hamburguer.jpg",
      },
      {
        produtoId: "demo-batata",
        nome: "Batata frita",
        quantidade: 1,
        imagemUrl: "/produtos/batata.jpg",
      },
    ],
  },
];

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function formatarHora(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ImagemProduto({
  nome,
  imagemUrl,
}: {
  nome: string;
  imagemUrl: string;
}) {
  const [falhou, setFalhou] = useState(false);

  if (!imagemUrl || falhou) {
    return (
      <div
        role="img"
        aria-label={`Foto de ${nome} não cadastrada`}
        className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white text-center"
      >
        <span className="text-2xl">📷</span>

        <span className="mt-1 text-[10px] text-gray-500">
          Sem foto
        </span>
      </div>
    );
  }

  return (
    <img
      src={imagemUrl}
      alt={nome}
      loading="lazy"
      onError={() => setFalhou(true)}
      className="h-20 w-20 shrink-0 rounded-xl border border-gray-200 bg-white object-cover"
    />
  );
}

function LogoRestaurante({
  nome,
  logoUrl,
}: {
  nome: string;
  logoUrl: string;
}) {
  const [imagemFalhou, setImagemFalhou] = useState(false);

  useEffect(() => {
    setImagemFalhou(false);
  }, [logoUrl]);

  return (
    <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white p-2 shadow-lg sm:h-28 sm:w-28">
      {logoUrl && !imagemFalhou ? (
        <img
          src={logoUrl}
          alt={`Logomarca de ${nome}`}
          onError={() => setImagemFalhou(true)}
          className="h-full w-full object-contain"
        />
      ) : (
        <div className="text-center text-[#19352b]">
          <span className="text-4xl">🏪</span>

          <p className="mt-1 text-[10px] font-bold">
            Sua empresa
          </p>
        </div>
      )}
    </div>
  );
}

// =====================================================
// DASHBOARD
// =====================================================

export function ParceiroDashboard() {
  const navigate = useNavigate();

  // ===================================================
  // DADOS DO ESTABELECIMENTO
  // ===================================================

  const [restaurante, setRestaurante] =
    useState<RestauranteParceiro | null>(null);

  const [carregandoEmpresa, setCarregandoEmpresa] =
    useState(true);

  const [erroEmpresa, setErroEmpresa] = useState("");

  const [uidParceiro, setUidParceiro] =
    useState<string | null>(null);

  // ===================================================
  // SAIR DA CONTA
  // ===================================================

  const [saindo, setSaindo] = useState(false);

  const [erroSaida, setErroSaida] = useState("");

  // ===================================================
  // TREINAMENTO
  // ===================================================

  const [treinamentoAberto, setTreinamentoAberto] =
    useState(false);

  const [treinamentoConcluido, setTreinamentoConcluido] =
    useState(false);

  const [
    mostrarCardTreinamento,
    setMostrarCardTreinamento,
  ] = useState(false);

  const [
    preferenciasCarregadas,
    setPreferenciasCarregadas,
  ] = useState(false);

  // ===================================================
  // PEDIDOS DEMONSTRATIVOS
  // ===================================================

  const [pedidos, setPedidos] =
    useState<Pedido[]>(pedidosIniciais);

  const [
    pedidoSelecionado,
    setPedidoSelecionado,
  ] = useState<string | null>(null);

  const [
    pedidoParaRecusar,
    setPedidoParaRecusar,
  ] = useState<string | null>(null);

  const [minutos, setMinutos] = useState("30");

  const [entregador, setEntregador] = useState("");

  const [motivoRecusa, setMotivoRecusa] = useState("");

  const [
    aceitandoPedidos,
    setAceitandoPedidos,
  ] = useState(true);

  const [
    mostrarRecusados,
    setMostrarRecusados,
  ] = useState(false);

  const [agora, setAgora] = useState(Date.now());

  // ===================================================
  // PEDIDOS REAIS AINDA NÃO INTEGRADOS
  // ===================================================

  const pedidosReaisIntegrados = false;

  // ===================================================
  // CONSULTAR RESTAURANTE AUTENTICADO
  // ===================================================

  useEffect(() => {
    let cancelarConsulta:
      | (() => void)
      | undefined;

    const cancelarAutenticacao = onAuthStateChanged(
      auth,
      (usuario) => {
        cancelarConsulta?.();

        cancelarConsulta = undefined;

        if (!usuario) {
          setRestaurante(null);
          setUidParceiro(null);
          setCarregandoEmpresa(false);

          navigate("/parceiro/login", {
            replace: true,
          });

          return;
        }

        setUidParceiro(usuario.uid);
        setCarregandoEmpresa(true);
        setErroEmpresa("");

        const referencia = doc(
          db,
          "restaurantes",
          usuario.uid
        );

        cancelarConsulta = onSnapshot(
          referencia,
          (documento) => {
            if (!documento.exists()) {
              setRestaurante(null);
              setCarregandoEmpresa(false);

              navigate("/parceiro/solicitacao", {
                replace: true,
              });

              return;
            }

            const dados = documento.data();

            if (
              dados.uid !== usuario.uid ||
              dados.status !== "aprovado"
            ) {
              setRestaurante(null);
              setCarregandoEmpresa(false);

              navigate("/parceiro/solicitacao", {
                replace: true,
              });

              return;
            }

            setRestaurante({
              uid: usuario.uid,
              nomeEmpresa:
                typeof dados.nomeEmpresa === "string"
                  ? dados.nomeEmpresa
                  : "Estabelecimento",
              email:
                typeof dados.email === "string"
                  ? dados.email
                  : usuario.email ?? "",
              nomeResponsavel:
                typeof dados.nomeResponsavel === "string"
                  ? dados.nomeResponsavel
                  : "",
              telefone:
                typeof dados.telefone === "string"
                  ? dados.telefone
                  : "",
              logoUrl:
                typeof dados.logoUrl === "string"
                  ? dados.logoUrl
                  : "",
              status: "aprovado",
            });

            setCarregandoEmpresa(false);
            setErroEmpresa("");
          },
          (error) => {
            console.error(
              "Erro ao consultar estabelecimento:",
              error
            );

            setRestaurante(null);
            setCarregandoEmpresa(false);

            setErroEmpresa(
              "Não foi possível consultar os dados do estabelecimento. Verifique sua conexão e as permissões do Firestore."
            );
          }
        );
      }
    );

    return () => {
      cancelarConsulta?.();
      cancelarAutenticacao();
    };
  }, [navigate]);

  // ===================================================
  // PREFERÊNCIAS DO TREINAMENTO POR USUÁRIO
  // ===================================================

  const chaveTreinamento = uidParceiro
    ? `imperio_parceiro_treinamento_${uidParceiro}`
    : null;

  const chaveOcultarCard = uidParceiro
    ? `imperio_parceiro_ocultar_treinamento_${uidParceiro}`
    : null;

  useEffect(() => {
    if (!uidParceiro || !chaveTreinamento || !chaveOcultarCard) {
      return;
    }

    setPreferenciasCarregadas(false);

    try {
      const concluido =
        window.localStorage.getItem(chaveTreinamento) ===
        "concluido";

      const cardOculto =
        window.localStorage.getItem(chaveOcultarCard) ===
        "sim";

      setTreinamentoConcluido(concluido);

      setMostrarCardTreinamento(
        concluido && !cardOculto
      );

      setTreinamentoAberto(!concluido);
    } catch {
      setTreinamentoConcluido(false);
      setMostrarCardTreinamento(false);
      setTreinamentoAberto(true);
    }

    setPreferenciasCarregadas(true);
  }, [
    uidParceiro,
    chaveTreinamento,
    chaveOcultarCard,
  ]);

  // ===================================================
  // RELÓGIO
  // ===================================================

  useEffect(() => {
    const intervalo = window.setInterval(() => {
      setAgora(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalo);
    };
  }, []);

  // ===================================================
  // INDICADORES DEMONSTRATIVOS
  // ===================================================

  const novos = pedidos.filter(
    (pedido) => pedido.status === "novo"
  ).length;

  const emPreparo = pedidos.filter(
    (pedido) => pedido.status === "preparacao"
  ).length;

  const prontos = pedidos.filter(
    (pedido) => pedido.status === "pronto"
  ).length;

  const recusados = pedidos.filter(
    (pedido) => pedido.status === "recusado"
  ).length;

  const pedidosVisiveis = pedidos.filter((pedido) =>
    mostrarRecusados
      ? pedido.status === "recusado"
      : pedido.status !== "recusado"
  );

  // ===================================================
  // SAIR DA CONTA
  // ===================================================

  async function sairDaConta() {
    if (saindo) return;

    setSaindo(true);
    setErroSaida("");

    try {
      await signOut(auth);

      navigate("/parceiro/login", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Erro ao encerrar sessão:",
        error
      );

      setErroSaida(
        "Não foi possível sair da conta. Tente novamente."
      );

      setSaindo(false);
    }
  }

  // ===================================================
  // TREINAMENTO
  // ===================================================

  function concluirTreinamento() {
    let cardOculto = false;

    try {
      if (chaveTreinamento) {
        window.localStorage.setItem(
          chaveTreinamento,
          "concluido"
        );
      }

      if (chaveOcultarCard) {
        cardOculto =
          window.localStorage.getItem(
            chaveOcultarCard
          ) === "sim";
      }
    } catch {
      // Mantém a conclusão nesta sessão.
    }

    setTreinamentoConcluido(true);
    setTreinamentoAberto(false);
    setMostrarCardTreinamento(!cardOculto);
  }

  function refazerTreinamento() {
    setTreinamentoAberto(true);
  }

  function ocultarCardTreinamento() {
    try {
      if (chaveOcultarCard) {
        window.localStorage.setItem(
          chaveOcultarCard,
          "sim"
        );
      }
    } catch {
      // Oculta o card nesta sessão.
    }

    setMostrarCardTreinamento(false);
  }

  // ===================================================
  // FORMULÁRIOS DOS PEDIDOS FICTÍCIOS
  // ===================================================

  function alternarConfirmacao(id: string) {
    setPedidoParaRecusar(null);
    setMotivoRecusa("");

    setPedidoSelecionado((anterior) =>
      anterior === id ? null : id
    );

    setMinutos("30");
    setEntregador("");
  }

  function alternarRecusa(id: string) {
    setPedidoSelecionado(null);

    setPedidoParaRecusar((anterior) =>
      anterior === id ? null : id
    );

    setMotivoRecusa("");
  }

  // ===================================================
  // CONFIRMAR PEDIDO DEMONSTRATIVO
  // ===================================================

  function confirmarPedido(id: string) {
    const pedidoAtual = pedidos.find(
      (pedido) => pedido.id === id
    );

    if (
      !pedidoAtual ||
      pedidoAtual.status !== "novo"
    ) {
      alert(
        "Este pedido não está disponível para aceitação."
      );

      return;
    }

    const tempo = Number(minutos);

    if (![15, 30, 45, 60].includes(tempo)) {
      alert(
        "Selecione um tempo de preparo válido."
      );

      return;
    }

    if (
      entregador !== "sim" &&
      entregador !== "nao"
    ) {
      alert(
        "Informe a disponibilidade do entregador."
      );

      return;
    }

    const momento = Date.now();

    setPedidos((anteriores) =>
      anteriores.map((pedido) =>
        pedido.id === id &&
        pedido.status === "novo"
          ? {
              ...pedido,
              status: "preparacao",
              minutosPreparo: tempo,
              entregadorDisponivel:
                entregador === "sim",
              confirmadoEm: momento,
            }
          : pedido
      )
    );

    setPedidoSelecionado(null);
    setMinutos("30");
    setEntregador("");
  }

  // ===================================================
  // RECUSAR SOMENTE ANTES DO ACEITE
  // ===================================================

  function recusarPedido(id: string) {
    const motivo = motivoRecusa.trim();

    if (motivo.length < 5) {
      alert("Informe o motivo da recusa.");
      return;
    }

    const pedidoAtual = pedidos.find(
      (pedido) => pedido.id === id
    );

    if (
      !pedidoAtual ||
      pedidoAtual.status !== "novo"
    ) {
      alert(
        "Este pedido não pode mais ser recusado."
      );

      return;
    }

    const confirmou = window.confirm(
      "Deseja recusar esta solicitação demonstrativa?"
    );

    if (!confirmou) return;

    const momento = Date.now();

    setPedidos((anteriores) =>
      anteriores.map((pedido) =>
        pedido.id === id &&
        pedido.status === "novo"
          ? {
              ...pedido,
              status: "recusado",
              recusadoEm: momento,
              motivoRecusa: motivo,
            }
          : pedido
      )
    );

    setPedidoParaRecusar(null);
    setMotivoRecusa("");
  }

  // ===================================================
  // MARCAR PEDIDO DEMONSTRATIVO COMO PRONTO
  // ===================================================

  function marcarPronto(id: string) {
    const momento = Date.now();

    setPedidos((anteriores) =>
      anteriores.map((pedido) =>
        pedido.id === id &&
        pedido.status === "preparacao"
          ? {
              ...pedido,
              status: "pronto",
              prontoEm: momento,
            }
          : pedido
      )
    );
  }

  // ===================================================
  // INTERVENÇÃO ADMINISTRATIVA
  // ===================================================

  function solicitarIntervencao(id: string) {
    alert(
      `Pedido ${id}: a solicitação de intervenção ainda não está conectada. Nenhuma mensagem foi enviada.`
    );
  }

  // ===================================================
  // INTERFACE
  // ===================================================

  return (
    <main className="min-h-screen bg-[#f8f6ef] text-[#19352b]">

      {/* ============================================= */}
      {/* TREINAMENTO                                  */}
      {/* ============================================= */}

      {preferenciasCarregadas &&
        restaurante?.status === "aprovado" && (
          <TreinamentoParceiro
            aberto={treinamentoAberto}
            onConcluir={concluirTreinamento}
          />
        )}

      {/* ============================================= */}
      {/* CABEÇALHO                                    */}
      {/* ============================================= */}

      <header className="bg-[#101813] px-4 py-5 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5">

          <div className="flex items-center gap-3">

            <img
              src="/logo-imperio.png"
              alt="Império Chalés"
              className="h-12 w-12 rounded-full object-contain"
            />

            <div>
              <h1 className="text-lg font-black">
                Portal do Parceiro
              </h1>

              <p className="text-xs font-bold tracking-widest text-amber-300">
                SABORES DA CHAPADA
              </p>
            </div>

          </div>

          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">

            <Link
              to="/parceiro/pedidos"
              className="group inline-flex flex-1 items-center justify-center rounded-2xl border-b-[6px] border-amber-700 bg-gradient-to-b from-yellow-200 via-amber-400 to-yellow-500 px-5 py-3 text-center text-sm font-black uppercase tracking-wide text-black shadow-[0_7px_25px_rgba(251,191,36,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_35px_rgba(251,191,36,0.7)] active:translate-y-1 active:border-b-0 motion-safe:animate-bounce motion-reduce:animate-none sm:flex-none"
            >
              📋 IR PARA MEUS PEDIDOS

              <span className="ml-2 transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>

            <span className="rounded-full border border-amber-400/40 px-4 py-2 text-xs font-bold text-amber-300">
              AMBIENTE DEMONSTRATIVO
            </span>

            <button
              type="button"
              onClick={sairDaConta}
              disabled={saindo}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-red-800 bg-red-600 px-6 py-3 text-sm font-black uppercase tracking-wide text-white shadow-[0_5px_0_#991b1b] transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-[0_7px_0_#7f1d1d] active:translate-y-1 active:shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-wait disabled:opacity-60"
            >
              {saindo
                ? "⏳ SAINDO..."
                : "🚪 SAIR DA CONTA"}
            </button>

            {erroSaida && (
              <p
                role="alert"
                className="w-full text-sm font-semibold text-red-300"
              >
                ⚠️ {erroSaida}
              </p>
            )}

          </div>

        </div>
      </header>

      {/* ============================================= */}
      {/* CONTEÚDO                                     */}
      {/* ============================================= */}

      <div className="mx-auto max-w-6xl px-4 py-8">

        {/* APRESENTAÇÃO */}

        <section className="mb-6">

          <span className="text-xs font-bold uppercase tracking-[0.3em] text-amber-700">
            PAINEL DO ESTABELECIMENTO
          </span>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">

            <div>
              <h2 className="text-3xl font-bold md:text-4xl">
                Minha cozinha 🍽️
              </h2>

              <p className="mt-3 text-sm text-gray-500">
                Receba solicitações, confirme o preparo
                e acompanhe os pedidos.
              </p>
            </div>

            {treinamentoConcluido && (
              <span className="rounded-full bg-green-100 px-4 py-2 text-xs font-bold text-green-800">
                🎓 Treinamento concluído
              </span>
            )}

          </div>

        </section>

        {/* ============================================= */}
        {/* ERRO DE CONSULTA                              */}
        {/* ============================================= */}

        {erroEmpresa && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-red-300 bg-red-50 p-5 text-sm font-semibold text-red-800"
          >
            ⚠️ {erroEmpresa}
          </div>
        )}

        {/* ============================================= */}
        {/* HERO PRINCIPAL                                */}
        {/* ============================================= */}

        <section className="relative mb-8 overflow-hidden rounded-[32px] bg-gradient-to-r from-[#10251d] via-[#123528] to-[#0c271f] p-6 text-white shadow-xl md:p-8">

          <div className="pointer-events-none absolute -right-20 -top-10 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="pointer-events-none absolute -left-10 bottom-0 h-56 w-56 rounded-full bg-amber-400/10 blur-3xl" />

          <div className="relative z-10">

            {/* ======================================= */}
            {/* IDENTIFICAÇÃO REAL DO RESTAURANTE       */}
            {/* ======================================= */}

            <div className="mb-8 rounded-[26px] border border-amber-300/30 bg-white/10 p-4 backdrop-blur-sm md:p-6">

              {carregandoEmpresa ? (
                <div
                  role="status"
                  className="flex items-center gap-4"
                >
                  <div className="h-24 w-24 animate-pulse rounded-2xl bg-white/20" />

                  <div className="flex-1">
                    <p className="text-sm font-bold text-amber-300">
                      🏪 IDENTIFICANDO SUA EMPRESA
                    </p>

                    <p className="mt-2 text-sm text-gray-200">
                      Consultando os dados do seu estabelecimento no Firebase...
                    </p>
                  </div>
                </div>
              ) : restaurante ? (
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

                  <LogoRestaurante
                    nome={restaurante.nomeEmpresa}
                    logoUrl={restaurante.logoUrl}
                  />

                  <div className="min-w-0 flex-1">

                    <span className="inline-flex rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-300">
                      🏪 MEU ESTABELECIMENTO
                    </span>

                    <h3 className="mt-3 break-words text-2xl font-black leading-tight text-white md:text-3xl">
                      {restaurante.nomeEmpresa}
                    </h3>

                    <p className="mt-3 break-all text-sm font-medium text-gray-200">
                      ✉️ {restaurante.email}
                    </p>

                    {restaurante.nomeResponsavel && (
                      <p className="mt-2 text-sm text-gray-200">
                        👤 Responsável:{" "}
                        <strong>
                          {restaurante.nomeResponsavel}
                        </strong>
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-2">

                      <span className="rounded-full bg-green-500 px-4 py-2 text-xs font-black text-white shadow-lg">
                        ✅ CADASTRO APROVADO
                      </span>

                      <span className="rounded-full border border-blue-300/30 bg-blue-500/20 px-4 py-2 text-xs font-bold text-blue-100">
                        🧪 PEDIDOS EM DEMONSTRAÇÃO
                      </span>

                    </div>

                  </div>

                </div>
              ) : (
                <div className="rounded-xl border border-red-300/30 bg-red-500/10 p-4">

                  <h3 className="font-black text-white">
                    ⚠️ Não foi possível identificar sua empresa
                  </h3>

                  <p className="mt-2 text-sm text-gray-200">
                    Os dados do estabelecimento precisam ser carregados antes de liberar a identificação do painel.
                  </p>

                  <Link
                    to="/parceiro/solicitacao"
                    className="mt-4 inline-flex rounded-xl bg-white px-4 py-3 text-sm font-black text-[#19352b]"
                  >
                    Consultar minha solicitação →
                  </Link>

                </div>
              )}

            </div>
            {/* ======================================= */}
            {/* GERENCIAMENTO DE PRATOS                 */}
            {/* ======================================= */}

            {restaurante?.status === "aprovado" && (
              <div className="mb-8">
                <Link
                  to="/parceiro/pratos"
                  className="group flex w-full flex-col items-center justify-center gap-3 rounded-[24px] border-b-[6px] border-lime-700 bg-[#A3FF12] px-5 py-5 text-center text-[#10251d] shadow-[0_8px_30px_rgba(163,255,18,0.35)] transition-all duration-200 hover:-translate-y-1 hover:bg-[#B9FF47] hover:shadow-[0_12px_40px_rgba(163,255,18,0.5)] active:translate-y-1 active:border-b-0 sm:flex-row sm:justify-between sm:px-8"
                >
                  <div className="flex flex-col items-center gap-3 sm:flex-row sm:text-left">
                    <span
                      aria-hidden="true"
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#10251d] text-3xl shadow-md"
                    >
                      🍽️
                    </span>

                    <div>
                      <p className="text-lg font-black uppercase tracking-wide sm:text-xl">
                        GERENCIAR MEUS PRATOS
                      </p>

                      <p className="mt-1 text-xs font-bold text-[#19352b] sm:text-sm">
                        Cadastre pratos, preços e descrições
                        do seu estabelecimento.
                      </p>
                    </div>
                  </div>

                  <span
                    aria-hidden="true"
                    className="text-3xl font-black transition-transform group-hover:translate-x-2"
                  >
                    →
                  </span>
                </Link>

                <p className="mt-3 text-center text-xs leading-5 text-gray-300">
                  🧪 O cadastro de pratos está em fase
                  demonstrativa. As informações ainda
                  não são salvas no Firebase.
                </p>
              </div>
            )}
            
            {/* ======================================= */}
            {/* CENTRAL DE PEDIDOS                      */}
            {/* ======================================= */}

            <div className="flex flex-wrap items-center justify-between gap-3">

              <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-xs font-bold tracking-wider text-amber-300">
                🏪 SUA CENTRAL DE PEDIDOS
              </span>

              <span className="rounded-full bg-blue-500/20 px-4 py-2 text-xs font-bold text-blue-100">
                AGUARDANDO INTEGRAÇÃO
              </span>

            </div>

            <div className="mt-8 max-w-4xl">

              <h3 className="text-4xl font-black uppercase leading-tight md:text-6xl">
                CONFIRME SEUS

                <span className="block text-amber-400">
                  PEDIDOS AQUI!
                </span>
              </h3>

              <p className="mt-6 text-lg font-semibold text-gray-100 md:text-2xl">
                Prepare-se para atender seu primeiro cliente
                dentro do Império Chalés!
              </p>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-200 md:text-base">
                Quando ativarmos a integração, os pedidos
                reais aparecerão nesta central, com número,
                chalé de origem, produtos, horário,
                tempo de preparo e informações de entrega.
              </p>

            </div>

            {!pedidosReaisIntegrados && (
              <div className="mt-8 rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">

                <div className="flex items-start gap-4">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/20 text-2xl">
                    🔔
                  </div>

                  <div>

                    <h4 className="text-xl font-extrabold">
                      Seus primeiros pedidos aparecerão aqui
                    </h4>

                    <p className="mt-2 text-sm text-gray-200">
                      Nenhum pedido real está sendo consultado
                      nesta versão demonstrativa.
                    </p>

                  </div>

                </div>

              </div>
            )}

            <Link
              to="/parceiro/pedidos"
              className="mt-8 inline-flex w-full items-center justify-center rounded-2xl border border-blue-300 bg-blue-600 px-6 py-4 text-center text-sm font-extrabold text-white shadow-[0_0_30px_rgba(59,130,246,0.35)] transition hover:bg-blue-700 sm:w-auto"
            >
              📋 VER TODOS OS PEDIDOS →
            </Link>

            <p className="mt-3 text-xs leading-5 text-blue-100">
              🧪 A página de pedidos está disponível
              para visualização, mas ainda não recebe
              pedidos reais.
            </p>

          </div>

        </section>

        {/* ============================================= */}
        {/* CARDS INFORMATIVOS                            */}
        {/* ============================================= */}

        <section className="mb-8 grid gap-4 md:grid-cols-3">

          <article className="rounded-[26px] border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-100 p-6 shadow-sm">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-3xl shadow-lg">
              📋
            </div>

            <h3 className="mt-5 text-xl font-black text-blue-950">
              Pedidos organizados
            </h3>

            <p className="mt-3 text-sm leading-7 text-blue-900">
              Acompanhe cada solicitação, o chalé de origem
              e o andamento do preparo em uma única central.
            </p>

            <div className="mt-5 h-1.5 rounded-full bg-blue-600" />

          </article>

          <article className="rounded-[26px] border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-100 p-6 shadow-sm">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-3xl shadow-lg">
              ⏱️
            </div>

            <h3 className="mt-5 text-xl font-black text-amber-950">
              Controle do preparo
            </h3>

            <p className="mt-3 text-sm leading-7 text-amber-900">
              Informe o prazo e acompanhe os horários
              para manter os pedidos organizados.
            </p>

            <div className="mt-5 h-1.5 rounded-full bg-amber-500" />

          </article>

          <article className="rounded-[26px] border border-green-200 bg-gradient-to-br from-green-50 to-emerald-100 p-6 shadow-sm">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-700 text-3xl shadow-lg">
              ✅
            </div>

            <h3 className="mt-5 text-xl font-black text-green-950">
              Atendimento completo
            </h3>

            <p className="mt-3 text-sm leading-7 text-green-900">
              Confirme quando o pedido estiver pronto.
              A entrega ou retirada será registrada separadamente.
            </p>

            <div className="mt-5 h-1.5 rounded-full bg-green-700" />

          </article>

        </section>

        {/* ============================================= */}
        {/* AVISOS                                        */}
        {/* ============================================= */}

        <section className="mb-8 space-y-3">

          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900">

            <p className="font-bold">
              ⚠️ Atenção às confirmações
            </p>

            <p className="mt-1">
              Após aceitar um pedido, o estabelecimento
              assume o compromisso de prepará-lo.
              O cancelamento não fica disponível
              diretamente no painel.

              Em caso de imprevisto, solicite
              intervenção da administração.
            </p>

          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">

            🧪 <strong>Modo demonstrativo:</strong>{" "}
            os pedidos desta página são fictícios.
            Nenhuma ação é salva no Firebase
            ou enviada aos hóspedes.

          </div>

        </section>

        {/* ============================================= */}
        {/* CARD DO TREINAMENTO                           */}
        {/* ============================================= */}

        {treinamentoConcluido &&
          mostrarCardTreinamento && (
            <section className="mb-8 rounded-3xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-5 shadow-sm md:p-6">

              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                <div className="flex items-start gap-4">

                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-700 text-3xl shadow-md">
                    🎓
                  </div>

                  <div>

                    <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-extrabold text-green-800">
                      ✅ CONCLUÍDO
                    </span>

                    <h3 className="mt-2 text-xl font-black text-[#19352b]">
                      Seu treinamento
                    </h3>

                    <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600">
                      Você já concluiu a apresentação
                      do Portal do Parceiro.
                      Se quiser, poderá praticar novamente.
                    </p>

                  </div>

                </div>

                <div className="flex flex-col gap-2 sm:flex-row">

                  <button
                    type="button"
                    onClick={refazerTreinamento}
                    className="rounded-xl border border-green-300 bg-white px-5 py-3 text-sm font-bold text-green-800 transition hover:bg-green-100"
                  >
                    🔄 Refazer treinamento
                  </button>

                  <button
                    type="button"
                    onClick={ocultarCardTreinamento}
                    className="rounded-xl px-5 py-3 text-sm font-semibold text-gray-500 transition hover:bg-white/70 hover:text-gray-800"
                  >
                    Não mostrar novamente
                  </button>

                </div>

              </div>

            </section>
          )}

        {/* ============================================= */}
        {/* ATENDIMENTO                                   */}
        {/* ============================================= */}

        <section className="mb-8 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div>

              <h3 className="text-xl font-bold">
                Atendimento do restaurante
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Controle demonstrativo de disponibilidade.
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                setAceitandoPedidos((atual) => !atual)
              }
              aria-pressed={aceitandoPedidos}
              className={`rounded-xl px-5 py-3 text-sm font-bold text-white transition ${
                aceitandoPedidos
                  ? "bg-green-700 hover:bg-green-800"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {aceitandoPedidos
                ? "🟢 Aceitando novos pedidos"
                : "🔴 Novos pedidos pausados"}
            </button>

          </div>

          <div
            className={`mt-5 rounded-xl p-4 text-sm ${
              aceitandoPedidos
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-700"
            }`}
          >
            {aceitandoPedidos
              ? "✅ Atendimento demonstrativo aberto."
              : "⛔ Novas solicitações pausadas. Pedidos recebidos anteriormente continuam disponíveis."}
          </div>

          <p className="mt-4 text-xs leading-5 text-gray-500">
            Na versão conectada, o sistema também
            consultará os horários de funcionamento.
          </p>

        </section>

        {/* ============================================= */}
        {/* INDICADORES DEMONSTRATIVOS                    */}
        {/* ============================================= */}

        <section className="mb-10">

          <div className="mb-4">

            <h3 className="text-2xl font-bold">
              Simulação de atendimento
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Os números abaixo são exclusivamente
              do pedido fictício DEMO-001.
            </p>

          </div>

          <div className="grid grid-cols-3 gap-2 md:gap-4">

            {[
              {
                titulo: "Novos",
                valor: novos,
                icone: "❗",
                cor: "text-red-600",
              },
              {
                titulo: "Em preparo",
                valor: emPreparo,
                icone: "⏳",
                cor: "text-amber-600",
              },
              {
                titulo: "Prontos",
                valor: prontos,
                icone: "✅",
                cor: "text-green-700",
              },
            ].map((item) => (
              <article
                key={item.titulo}
                className="rounded-2xl border border-gray-100 bg-white p-3 text-center shadow-sm md:p-6"
              >

                <span className="text-2xl">
                  {item.icone}
                </span>

                <p className="mt-2 text-xs text-gray-500 md:text-sm">
                  {item.titulo}
                </p>

                <p
                  className={`mt-2 text-2xl font-bold ${item.cor}`}
                >
                  {item.valor}
                </p>

              </article>
            ))}

          </div>

        </section>

        {/* ============================================= */}
        {/* LABORATÓRIO DE TREINAMENTO                    */}
        {/* ============================================= */}

        <section
          id="pedidos-demonstrativos"
          className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#10251d] via-[#143627] to-[#0e2019] p-6 text-white shadow-xl md:p-8"
        >

          <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="pointer-events-none absolute -left-10 top-0 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />

          <div className="relative z-10">

            <div className="flex flex-wrap items-end justify-between gap-4">

              <div className="max-w-3xl">

                <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-xs font-bold tracking-wider text-amber-300">
                  🧪 LABORATÓRIO DE TREINAMENTO
                </span>

                <h3 className="mt-5 text-3xl font-black uppercase leading-tight md:text-5xl">
                  PRATIQUE COM UM

                  <span className="block text-amber-400">
                    PEDIDO DEMONSTRATIVO
                  </span>
                </h3>

                <p className="mt-4 text-sm leading-7 text-gray-200 md:text-base">
                  Treine o fluxo completo: analisar,
                  aceitar, definir tempo, informar entrega,
                  preparar e concluir o pedido.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setMostrarRecusados((atual) => !atual)
                }
                className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                  mostrarRecusados
                    ? "border-red-300 bg-red-100 text-red-700"
                    : "border-white/20 bg-white/10 text-white hover:bg-white/15"
                }`}
              >
                {mostrarRecusados
                  ? "← Voltar aos pedidos"
                  : `Recusados (${recusados})`}
              </button>

            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm leading-6 text-gray-100">
              💡 <strong>Dica:</strong> use este pedido
              fictício para treinar sua equipe.
              Ele não envia nada ao hóspede
              e não altera o sistema real.
            </div>

            <div
              className={`mt-8 grid gap-5 ${
                pedidosVisiveis.length > 1
                  ? "lg:grid-cols-2"
                  : "mx-auto max-w-3xl"
              }`}
            >

              {pedidosVisiveis.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/20 bg-white/10 p-8 text-center text-sm text-gray-200 lg:col-span-2">
                  Nenhum pedido nesta categoria.
                </div>
              )}

              {pedidosVisiveis.map((pedido) => {
                const selecionado =
                  pedidoSelecionado === pedido.id;

                const recusando =
                  pedidoParaRecusar === pedido.id;

                const prazoFinal =
                  pedido.confirmadoEm !== null &&
                  pedido.minutosPreparo !== null
                    ? pedido.confirmadoEm +
                      pedido.minutosPreparo * 60_000
                    : null;

                const restantes =
                  prazoFinal !== null
                    ? Math.ceil(
                        (prazoFinal - agora) / 60_000
                      )
                    : null;

                const quasePronto =
                  pedido.status === "preparacao" &&
                  restantes !== null &&
                  restantes > 0 &&
                  restantes <= 15;

                const atrasado =
                  pedido.status === "preparacao" &&
                  restantes !== null &&
                  restantes <= 0;

                const borda =
                  pedido.status === "novo" || atrasado
                    ? "border-red-500"
                    : quasePronto
                    ? "border-amber-500"
                    : pedido.status === "pronto"
                    ? "border-green-500"
                    : pedido.status === "recusado"
                    ? "border-gray-300"
                    : "border-blue-200";

                return (
                  <article
                    key={pedido.id}
                    className={`rounded-3xl border-2 bg-white p-5 text-[#19352b] shadow-md md:p-6 ${borda}`}
                  >

                    {/* IDENTIFICAÇÃO */}

                    <div className="flex flex-wrap items-center justify-between gap-3">

                      <span className="text-xs font-bold text-gray-500">
                        {pedido.id}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          pedido.status === "novo"
                            ? "bg-red-100 text-red-700"
                            : pedido.status === "preparacao"
                            ? "bg-amber-100 text-amber-800"
                            : pedido.status === "pronto"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {pedido.status === "novo"
                          ? "❗ Novo pedido"
                          : pedido.status === "preparacao"
                          ? "⏳ Em preparação"
                          : pedido.status === "pronto"
                          ? "✅ Pronto"
                          : "🚫 Recusado"}
                      </span>

                    </div>

                    <h4 className="mt-5 text-2xl font-bold">
                      🏡 Chalé {pedido.chale}
                    </h4>

                    <p className="mt-2 text-sm text-gray-500">
                      Solicitação demonstrativa:{" "}
                      {pedido.horario}
                    </p>

                    {/* PRODUTOS COM FOTOS */}

                    <div className="mt-5 rounded-2xl bg-[#f8f6ef] p-4">

                      <h5 className="mb-4 text-sm font-bold">
                        🍽️ Itens solicitados
                      </h5>

                      <div className="space-y-3">

                        {pedido.itens.map((item) => (
                          <div
                            key={item.produtoId}
                            className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3"
                          >

                            <ImagemProduto
                              nome={item.nome}
                              imagemUrl={item.imagemUrl}
                            />

                            <div className="min-w-0 flex-1">

                              <p className="break-words text-sm font-bold">
                                {item.nome}
                              </p>

                              <p className="mt-1 text-sm text-gray-500">
                                Quantidade:{" "}
                                {item.quantidade}
                              </p>

                            </div>

                            <span className="rounded-lg bg-[#f8f6ef] px-2 py-1 text-xs font-bold">
                              {item.quantidade}×
                            </span>

                          </div>
                        ))}

                      </div>

                    </div>

                    {/* PEDIDO NOVO */}

                    {pedido.status === "novo" && (
                      <div className="mt-5 space-y-3">

                        <button
                          type="button"
                          onClick={() =>
                            alternarConfirmacao(pedido.id)
                          }
                          className="w-full rounded-xl bg-green-700 p-4 font-bold text-white transition hover:bg-green-800"
                        >
                          {selecionado
                            ? "Fechar opções"
                            : "✓ Aceitar pedido"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            alternarRecusa(pedido.id)
                          }
                          className="w-full rounded-xl border border-red-200 bg-white p-3 text-sm font-bold text-red-700 transition hover:bg-red-50"
                        >
                          {recusando
                            ? "Fechar recusa"
                            : "Recusar solicitação"}
                        </button>

                        {/* FORMULÁRIO DE ACEITAÇÃO */}

                        {selecionado && (
                          <div className="space-y-5 rounded-2xl border border-green-200 bg-green-50 p-4">

                            <div>

                              <label
                                htmlFor={`tempo-${pedido.id}`}
                                className="mb-2 block text-sm font-bold"
                              >
                                ⏱️ Tempo de preparo
                              </label>

                              <select
                                id={`tempo-${pedido.id}`}
                                value={minutos}
                                onChange={(event) =>
                                  setMinutos(
                                    event.target.value
                                  )
                                }
                                className="w-full rounded-xl border border-gray-300 bg-white p-3"
                              >
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

                            <div>

                              <p className="mb-2 text-sm font-bold">
                                🛵 Possui entregador disponível?
                              </p>

                              <div className="grid grid-cols-2 gap-2">

                                <button
                                  type="button"
                                  aria-pressed={
                                    entregador === "sim"
                                  }
                                  onClick={() =>
                                    setEntregador("sim")
                                  }
                                  className={`rounded-xl border p-3 text-sm font-bold ${
                                    entregador === "sim"
                                      ? "border-green-700 bg-green-700 text-white"
                                      : "border-gray-300 bg-white"
                                  }`}
                                >
                                  Sim
                                </button>

                                <button
                                  type="button"
                                  aria-pressed={
                                    entregador === "nao"
                                  }
                                  onClick={() =>
                                    setEntregador("nao")
                                  }
                                  className={`rounded-xl border p-3 text-sm font-bold ${
                                    entregador === "nao"
                                      ? "border-red-600 bg-red-600 text-white"
                                      : "border-gray-300 bg-white"
                                  }`}
                                >
                                  Não
                                </button>

                              </div>

                            </div>

                            {entregador === "nao" && (
                              <p className="rounded-xl bg-amber-100 p-3 text-xs leading-5 text-amber-900">
                                ⚠️ A retirada dependerá
                                de confirmação da administração.
                                Não prometa entrega antes disso.
                              </p>
                            )}

                            <button
                              type="button"
                              disabled={!entregador}
                              onClick={() =>
                                confirmarPedido(pedido.id)
                              }
                              className="w-full rounded-xl bg-[#19352b] p-4 font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                            >
                              ✓ Confirmar e iniciar preparo
                            </button>

                          </div>
                        )}

                        {/* FORMULÁRIO DE RECUSA */}

                        {recusando && (
                          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">

                            <label
                              htmlFor={`recusa-${pedido.id}`}
                              className="block text-sm font-bold text-red-800"
                            >
                              Motivo da recusa
                            </label>

                            <textarea
                              id={`recusa-${pedido.id}`}
                              value={motivoRecusa}
                              onChange={(event) =>
                                setMotivoRecusa(
                                  event.target.value
                                )
                              }
                              rows={3}
                              placeholder="Explique o motivo..."
                              className="mt-3 w-full rounded-xl border border-red-200 bg-white p-3"
                            />

                            <button
                              type="button"
                              disabled={
                                motivoRecusa.trim().length < 5
                              }
                              onClick={() =>
                                recusarPedido(pedido.id)
                              }
                              className="mt-3 w-full rounded-xl bg-red-600 p-3 font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                            >
                              Confirmar recusa
                            </button>

                          </div>
                        )}

                      </div>
                    )}

                    {/* EM PREPARAÇÃO */}

                    {pedido.status === "preparacao" && (
                      <div className="mt-5 space-y-4">

                        <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-900">

                          <p className="font-bold">
                            ✅ Pedido aceito
                          </p>

                          <p className="mt-2">
                            Preparo:{" "}
                            {pedido.minutosPreparo} minutos
                          </p>

                          <p className="mt-1">
                            Aceito às:{" "}
                            {pedido.confirmadoEm !== null
                              ? formatarHora(
                                  pedido.confirmadoEm
                                )
                              : "Não registrado"}
                          </p>

                          <p className="mt-1">
                            Previsão:{" "}
                            {prazoFinal !== null
                              ? formatarHora(prazoFinal)
                              : "Não informada"}
                          </p>

                          <p className="mt-1">
                            {pedido.entregadorDisponivel
                              ? "🛵 Entregador disponível"
                              : "📦 Retirada necessária"}
                          </p>

                        </div>

                        {quasePronto && (
                          <p className="animate-pulse rounded-xl bg-amber-100 p-4 text-sm font-bold text-amber-900 motion-reduce:animate-none">
                            ⚠️ Faltam aproximadamente{" "}
                            {restantes} minutos!
                          </p>
                        )}

                        {atrasado && (
                          <p className="rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">
                            🚨 O prazo previsto terminou.
                            Verifique o andamento do pedido.
                          </p>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            marcarPronto(pedido.id)
                          }
                          className="w-full rounded-xl bg-blue-700 p-4 font-bold text-white transition hover:bg-blue-800"
                        >
                          ✓ Marcar pedido como pronto
                        </button>

                      </div>
                    )}

                    {/* PRONTO */}

                    {pedido.status === "pronto" && (
                      <div className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-800">

                        <p className="font-bold">
                          ✅ Pedido pronto!
                        </p>

                        <p className="mt-2">
                          Horário:{" "}
                          {pedido.prontoEm !== null
                            ? formatarHora(pedido.prontoEm)
                            : "Não registrado"}
                        </p>

                        <p className="mt-2">
                          A entrega ou retirada
                          ainda precisa ser confirmada
                          separadamente.
                        </p>

                      </div>
                    )}

                    {/* RECUSADO */}

                    {pedido.status === "recusado" && (
                      <div className="mt-5 rounded-xl bg-gray-100 p-4 text-sm text-gray-700">

                        <p className="font-bold">
                          🚫 Solicitação recusada
                        </p>

                        <p className="mt-2">
                          <strong>Motivo:</strong>{" "}
                          {pedido.motivoRecusa}
                        </p>

                        {pedido.recusadoEm !== null && (
                          <p className="mt-2">
                            <strong>Horário:</strong>{" "}
                            {formatarHora(
                              pedido.recusadoEm
                            )}
                          </p>
                        )}

                      </div>
                    )}

                    {/* INTERVENÇÃO ADMINISTRATIVA */}

                    {(pedido.status === "preparacao" ||
                      pedido.status === "pronto") && (
                      <button
                        type="button"
                        onClick={() =>
                          solicitarIntervencao(pedido.id)
                        }
                        className="mt-5 w-full rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
                      >
                        ⚠️ Solicitar intervenção administrativa
                      </button>
                    )}

                  </article>
                );
              })}

            </div>

            {/* BLOCO FINAL */}

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm md:p-6">

              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                <div className="max-w-3xl">

                  <h4 className="text-2xl font-black uppercase text-white">
                    Treine agora e prepare sua equipe
                  </h4>

                  <p className="mt-3 text-sm leading-7 text-gray-200 md:text-base">
                    Esta área foi criada para que o parceiro
                    pratique sem medo. Aqui você aprende
                    o fluxo completo antes da entrada
                    dos pedidos reais.
                  </p>

                </div>

                <div className="rounded-2xl bg-amber-400 px-5 py-4 text-center text-[#19352b] shadow-lg">

                  <p className="text-sm font-bold uppercase">
                    Objetivo do treino
                  </p>

                  <p className="mt-1 text-lg font-black">
                    Ganhar agilidade no primeiro atendimento
                  </p>

                </div>

              </div>

            </div>

          </div>

        </section>

      </div>

      {/* ============================================= */}
      {/* BOTÃO AZUL FLUTUANTE                          */}
      {/* Celular: bolinha azul com ícone.               */}
      {/* Computador: botão com texto completo.          */}
      {/* ============================================= */}

      {treinamentoConcluido && (
        <div className="pointer-events-none fixed bottom-5 right-5 z-50">
          <Link
            to="/parceiro/pedidos"
            aria-label="Ver todos os pedidos"
            title="Ver todos os pedidos"
            className="pointer-events-auto inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-white bg-blue-500 text-2xl font-black text-white shadow-[0_0_30px_rgba(37,99,235,0.7)] transition hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 motion-safe:animate-pulse motion-reduce:animate-none sm:h-auto sm:w-auto sm:px-6 sm:py-4 sm:text-sm"
          >
            {/* Ícone exibido somente no celular */}
            <span
              className="sm:hidden"
              aria-hidden="true"
            >
              📋
            </span>

            {/* Texto exibido em telas maiores */}
            <span
              className="hidden sm:inline"
              aria-hidden="true"
            >
              📋 Ver todos os pedidos →
            </span>
          </Link>
        </div>
      )}
    </main>
  );
}

export default ParceiroDashboard;