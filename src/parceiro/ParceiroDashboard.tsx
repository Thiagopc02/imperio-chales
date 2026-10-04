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

import parceiroIcon from "../components/catalogo/parceiro-icone.png";
import estabelecimentoIcon from "../components/catalogo/estabelecimento.png";
import entregaIcon from "../components/catalogo/entrega.png";
import restauranteIcon from "../components/catalogo/restaurante-emoji.png";
import gastroIcon from "../components/catalogo/gastro.png";

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
        className="
          flex
          h-20
          w-20
          shrink-0
          items-center
          justify-center
          overflow-hidden
          rounded-2xl
          border
          border-white/10
          bg-black/70
        "
      >
        <img
          src={restauranteIcon}
          alt=""
          className="h-14 w-14 object-contain opacity-80"
        />
      </div>
    );
  }

  return (
    <img
      src={imagemUrl}
      alt={nome}
      loading="lazy"
      onError={() => setFalhou(true)}
      className="
        h-20
        w-20
        shrink-0
        rounded-2xl
        border
        border-white/10
        bg-black
        object-cover
      "
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
  const [imagemFalhou, setImagemFalhou] =
    useState(false);

  useEffect(() => {
    setImagemFalhou(false);
  }, [logoUrl]);

  return (
    <div
      className="
        flex
        h-24
        w-24
        shrink-0
        items-center
        justify-center
        overflow-hidden
        rounded-[22px]
        border
        border-white/10
        bg-black/70
        p-2
        shadow-[0_15px_35px_rgba(0,0,0,.55)]
        sm:h-28
        sm:w-28
      "
    >
      {logoUrl && !imagemFalhou ? (
        <img
          src={logoUrl}
          alt={`Logomarca de ${nome}`}
          onError={() => setImagemFalhou(true)}
          className="h-full w-full object-contain"
        />
      ) : (
        <img
          src={estabelecimentoIcon}
          alt=""
          className="h-20 w-20 object-contain"
        />
      )}
    </div>
  );
}

function PainelNumero({
  titulo,
  valor,
  destaque,
}: {
  titulo: string;
  valor: number;
  destaque: "vermelho" | "dourado" | "verde";
}) {
  const classes =
    destaque === "vermelho"
      ? "text-[#ff3030]"
      : destaque === "verde"
      ? "text-[#16f06d]"
      : "text-[#f3c82f]";

  return (
    <article
      className="
        rounded-[22px]
        border
        border-white/10
        bg-white/[0.035]
        p-5
        text-center
        shadow-[0_15px_35px_rgba(0,0,0,.35)]
      "
    >
      <p
        className={`
          text-3xl
          font-black
          ${classes}
        `}
      >
        {valor}
      </p>

      <p className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/45">
        {titulo}
      </p>
    </article>
  );
}

// =====================================================
// DASHBOARD
// =====================================================

export function ParceiroDashboard() {
  const navigate = useNavigate();

  const [restaurante, setRestaurante] =
    useState<RestauranteParceiro | null>(null);

  const [carregandoEmpresa, setCarregandoEmpresa] =
    useState(true);

  const [erroEmpresa, setErroEmpresa] = useState("");

  const [uidParceiro, setUidParceiro] =
    useState<string | null>(null);

  const [saindo, setSaindo] = useState(false);
  const [erroSaida, setErroSaida] = useState("");

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

  const pedidosReaisIntegrados = false;

  // ===================================================
  // RESTAURANTE AUTENTICADO
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
  // TREINAMENTO
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

  useEffect(() => {
    const intervalo = window.setInterval(() => {
      setAgora(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalo);
    };
  }, []);

  // ===================================================
  // INDICADORES
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
  // SAIR
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
      // mantém nesta sessão
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
      // mantém nesta sessão
    }

    setMostrarCardTreinamento(false);
  }

  // ===================================================
  // PEDIDOS DEMONSTRATIVOS
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

  function solicitarIntervencao(id: string) {
    alert(
      `Pedido ${id}: a solicitação de intervenção ainda não está conectada. Nenhuma mensagem foi enviada.`
    );
  }

  // ===================================================
  // INTERFACE
  // ===================================================

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* FUNDO */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -left-52
          top-20
          h-[520px]
          w-[520px]
          rounded-full
          bg-red-600/[0.05]
          blur-[180px]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -right-40
          top-[760px]
          h-[520px]
          w-[520px]
          rounded-full
          bg-[#d4af37]/[0.04]
          blur-[190px]
        "
      />

      {/* TREINAMENTO */}

      {preferenciasCarregadas &&
        restaurante?.status === "aprovado" && (
          <TreinamentoParceiro
            aberto={treinamentoAberto}
            onConcluir={concluirTreinamento}
          />
        )}

      {/* CABEÇALHO */}

      <header
        className="
          sticky
          top-0
          z-50
          border-b
          border-white/10
          bg-black/90
          px-4
          py-4
          backdrop-blur-xl
        "
      >
        <div
          className="
            mx-auto
            flex
            max-w-7xl
            flex-wrap
            items-center
            justify-between
            gap-4
          "
        >
          <div className="flex items-center gap-3">
            <img
              src="/coroa.png"
              alt="Império Chalés"
              className="h-11 w-11 object-contain"
            />

            <div>
              <p className="text-sm font-black uppercase text-white">
                Portal do Parceiro
              </p>

              <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-[#ff3030]">
                Sabores da Chapada
              </p>
            </div>
          </div>

          <div className="flex flex-1 flex-wrap justify-end gap-2 sm:flex-none">
            <Link
              to="/parceiro/pedidos"
              className="
                inline-flex
                min-h-[44px]
                items-center
                justify-center
                rounded-xl
                bg-[#ff3030]
                px-4
                text-[11px]
                font-black
                uppercase
                text-white
                shadow-[0_8px_24px_rgba(255,48,48,.16)]
                transition
                hover:-translate-y-0.5
              "
            >
              Meus pedidos →
            </Link>

            <button
              type="button"
              onClick={sairDaConta}
              disabled={saindo}
              className="
                inline-flex
                min-h-[44px]
                items-center
                justify-center
                rounded-xl
                border
                border-white/10
                bg-white/[0.04]
                px-4
                text-[11px]
                font-black
                uppercase
                text-white
                transition
                hover:bg-white/[0.08]
                disabled:opacity-50
              "
            >
              {saindo
                ? "Saindo..."
                : "Sair"}
            </button>
          </div>

          {erroSaida && (
            <p
              role="alert"
              className="w-full text-right text-xs font-bold text-red-400"
            >
              {erroSaida}
            </p>
          )}
        </div>
      </header>

      {/* CONTEÚDO */}

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        {/* APRESENTAÇÃO */}

        <section className="mb-7">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#ff3030]">
            Painel do estabelecimento
          </p>

          <h1
            className="
              mt-3
              text-3xl
              font-black
              uppercase
              tracking-[-0.035em]
              text-white
              sm:text-4xl
              lg:text-5xl
            "
            style={{
              fontFamily:
                "'Arial Black', 'Montserrat', sans-serif",
            }}
          >
            Minha central
            <span className="text-[#ff3030]">
              {" "}
              de pedidos
            </span>
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/40">
            Acompanhe seu estabelecimento, seus pratos e o fluxo de atendimento em um só lugar.
          </p>
        </section>

        {/* ERROS */}

        {erroEmpresa && (
          <div
            role="alert"
            className="
              mb-6
              rounded-[20px]
              border
              border-red-500/30
              bg-red-500/[0.07]
              p-4
              text-sm
              font-semibold
              text-red-300
            "
          >
            {erroEmpresa}
          </div>
        )}

        {/* HERO ESTABELECIMENTO */}

        <section
          className="
            relative
            mb-7
            overflow-hidden
            rounded-[30px]
            border
            border-white/10
            bg-gradient-to-br
            from-[#1b1b1b]
            via-[#0c0c0c]
            to-black
            p-6
            shadow-[0_25px_80px_rgba(0,0,0,.65)]
            sm:p-8
          "
        >
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              -right-20
              -top-24
              h-72
              w-72
              rounded-full
              bg-red-500/[0.10]
              blur-[100px]
            "
          />

          {carregandoEmpresa ? (
            <div className="flex items-center gap-4">
              <div className="h-24 w-24 animate-pulse rounded-[22px] bg-white/[0.06]" />

              <div className="flex-1">
                <div className="h-4 w-44 animate-pulse rounded bg-white/[0.07]" />
                <div className="mt-3 h-7 max-w-sm animate-pulse rounded bg-white/[0.07]" />
              </div>
            </div>
          ) : restaurante ? (
            <div className="relative z-10 grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <LogoRestaurante
                  nome={restaurante.nomeEmpresa}
                  logoUrl={restaurante.logoUrl}
                />

                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#16f06d]">
                    Estabelecimento aprovado
                  </p>

                  <h2
                    className="
                      mt-2
                      break-words
                      text-2xl
                      font-black
                      uppercase
                      text-white
                      sm:text-3xl
                    "
                    style={{
                      fontFamily:
                        "'Arial Black', 'Montserrat', sans-serif",
                    }}
                  >
                    {restaurante.nomeEmpresa}
                  </h2>

                  <div className="mt-4 grid gap-2 text-xs text-white/45 sm:grid-cols-2">
                    <p className="break-all">
                      {restaurante.email}
                    </p>

                    {restaurante.telefone && (
                      <p>
                        {restaurante.telefone}
                      </p>
                    )}

                    {restaurante.nomeResponsavel && (
                      <p className="sm:col-span-2">
                        Responsável:{" "}
                        <strong className="text-white/70">
                          {restaurante.nomeResponsavel}
                        </strong>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <img
                src={parceiroIcon}
                alt=""
                className="
                  hidden
                  h-36
                  w-36
                  object-contain
                  drop-shadow-[0_18px_35px_rgba(255,48,48,.18)]
                  lg:block
                "
              />
            </div>
          ) : (
            <div>
              <p className="font-black uppercase text-red-300">
                Não foi possível identificar sua empresa
              </p>

              <Link
                to="/parceiro/solicitacao"
                className="mt-4 inline-flex rounded-xl bg-white px-4 py-3 text-sm font-black text-black"
              >
                Consultar solicitação →
              </Link>
            </div>
          )}
        </section>

        {/* AÇÕES PRINCIPAIS */}

        {restaurante?.status === "aprovado" && (
          <section className="mb-7 grid gap-4 md:grid-cols-3">
            <Link
              to="/parceiro/pedidos"
              className="
                group
                rounded-[26px]
                border
                border-red-500/25
                bg-gradient-to-br
                from-red-500/[0.10]
                via-[#111]
                to-black
                p-5
                transition
                hover:-translate-y-1
                hover:border-red-500/45
              "
            >
              <img
                src={entregaIcon}
                alt=""
                className="h-20 w-20 object-contain transition-transform group-hover:scale-110"
              />

              <p className="mt-4 text-[9px] font-black uppercase tracking-[0.18em] text-[#ff3030]">
                Atendimento
              </p>

              <h3 className="mt-2 text-xl font-black uppercase text-white">
                Meus pedidos
              </h3>

              <p className="mt-2 text-xs leading-5 text-white/35">
                Consulte e acompanhe os pedidos do estabelecimento.
              </p>
            </Link>

            <Link
              to="/parceiro/pratos"
              className="
                group
                rounded-[26px]
                border
                border-[#d4af37]/25
                bg-gradient-to-br
                from-[#d4af37]/[0.08]
                via-[#111]
                to-black
                p-5
                transition
                hover:-translate-y-1
                hover:border-[#d4af37]/45
              "
            >
              <img
                src={gastroIcon}
                alt=""
                className="h-20 w-20 object-contain transition-transform group-hover:scale-110"
              />

              <p className="mt-4 text-[9px] font-black uppercase tracking-[0.18em] text-[#f3c82f]">
                Cardápio
              </p>

              <h3 className="mt-2 text-xl font-black uppercase text-white">
                Meus pratos
              </h3>

              <p className="mt-2 text-xs leading-5 text-white/35">
                Cadastre pratos, preços e descrições.
              </p>
            </Link>

            <Link
              to="/cardapio"
              className="
                group
                rounded-[26px]
                border
                border-[#16f06d]/25
                bg-gradient-to-br
                from-[#16f06d]/[0.07]
                via-[#111]
                to-black
                p-5
                transition
                hover:-translate-y-1
                hover:border-[#16f06d]/45
              "
            >
              <img
                src={restauranteIcon}
                alt=""
                className="h-20 w-20 object-contain transition-transform group-hover:scale-110"
              />

              <p className="mt-4 text-[9px] font-black uppercase tracking-[0.18em] text-[#16f06d]">
                Visualização
              </p>

              <h3 className="mt-2 text-xl font-black uppercase text-white">
                Ver cardápio
              </h3>

              <p className="mt-2 text-xs leading-5 text-white/35">
                Veja como seu estabelecimento aparece para os hóspedes.
              </p>
            </Link>
          </section>
        )}

        {/* CENTRAL */}

        <section
          className="
            mb-7
            rounded-[30px]
            border
            border-white/10
            bg-[#090909]
            p-6
            shadow-[0_20px_60px_rgba(0,0,0,.45)]
            sm:p-8
          "
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.20em] text-[#ff3030]">
                Central operacional
              </p>

              <h2
                className="
                  mt-3
                  text-3xl
                  font-black
                  uppercase
                  leading-[0.98]
                  text-white
                  sm:text-4xl
                "
                style={{
                  fontFamily:
                    "'Arial Black', 'Montserrat', sans-serif",
                }}
              >
                Gerencie seus
                <span className="block text-[#ff3030]">
                  atendimentos
                </span>
              </h2>
            </div>

            <span className="inline-flex w-fit rounded-full border border-[#d4af37]/25 bg-[#d4af37]/[0.06] px-4 py-2 text-[9px] font-black uppercase tracking-[0.14em] text-[#f3c82f]">
              Ambiente demonstrativo
            </span>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <PainelNumero
              titulo="Novos"
              valor={novos}
              destaque="vermelho"
            />

            <PainelNumero
              titulo="Em preparo"
              valor={emPreparo}
              destaque="dourado"
            />

            <PainelNumero
              titulo="Prontos"
              valor={prontos}
              destaque="verde"
            />
          </div>

          {!pedidosReaisIntegrados && (
            <div className="mt-6 rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs leading-6 text-white/40">
                Esta tela ainda usa pedidos demonstrativos para treinamento. Nenhuma ação abaixo é enviada aos hóspedes.
              </p>
            </div>
          )}
        </section>

        {/* ATENDIMENTO */}

        <section
          className="
            mb-7
            rounded-[28px]
            border
            border-white/10
            bg-[#090909]
            p-5
            sm:p-6
          "
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#16f06d]">
                Disponibilidade
              </p>

              <h3 className="mt-2 text-xl font-black uppercase text-white">
                Atendimento do restaurante
              </h3>
            </div>

            <button
              type="button"
              onClick={() =>
                setAceitandoPedidos((atual) => !atual)
              }
              aria-pressed={aceitandoPedidos}
              className={`
                rounded-[16px]
                px-5
                py-3
                text-xs
                font-black
                uppercase
                transition
                ${
                  aceitandoPedidos
                    ? "bg-[#16f06d] text-black"
                    : "bg-[#ff3030] text-white"
                }
              `}
            >
              {aceitandoPedidos
                ? "Aceitando pedidos"
                : "Pedidos pausados"}
            </button>
          </div>

          <div
            className={`
              mt-5
              rounded-[18px]
              border
              p-4
              text-xs
              leading-6
              ${
                aceitandoPedidos
                  ? "border-[#16f06d]/20 bg-[#16f06d]/[0.05] text-[#9ff7c0]"
                  : "border-red-500/20 bg-red-500/[0.05] text-red-300"
              }
            `}
          >
            {aceitandoPedidos
              ? "Atendimento demonstrativo aberto."
              : "Novas solicitações estão pausadas. Pedidos já recebidos continuam disponíveis."}
          </div>
        </section>

        {/* TREINAMENTO CONCLUÍDO */}

        {treinamentoConcluido &&
          mostrarCardTreinamento && (
            <section
              className="
                mb-7
                rounded-[28px]
                border
                border-[#16f06d]/20
                bg-[#16f06d]/[0.035]
                p-5
                sm:p-6
              "
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={parceiroIcon}
                    alt=""
                    className="h-16 w-16 object-contain"
                  />

                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#16f06d]">
                      Treinamento concluído
                    </p>

                    <h3 className="mt-2 text-xl font-black uppercase text-white">
                      Seu treinamento
                    </h3>

                    <p className="mt-2 text-xs leading-6 text-white/35">
                      Você pode refazer o fluxo sempre que quiser.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={refazerTreinamento}
                    className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-xs font-black uppercase text-white"
                  >
                    Refazer
                  </button>

                  <button
                    type="button"
                    onClick={ocultarCardTreinamento}
                    className="rounded-xl px-4 py-3 text-xs font-black uppercase text-white/40"
                  >
                    Ocultar
                  </button>
                </div>
              </div>
            </section>
          )}

        {/* LABORATÓRIO */}

        <section
          id="pedidos-demonstrativos"
          className="
            relative
            overflow-hidden
            rounded-[30px]
            border
            border-white/10
            bg-gradient-to-br
            from-[#151515]
            via-[#090909]
            to-black
            p-6
            shadow-[0_25px_80px_rgba(0,0,0,.60)]
            sm:p-8
          "
        >
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              -right-24
              -top-20
              h-72
              w-72
              rounded-full
              bg-[#d4af37]/[0.06]
              blur-[110px]
            "
          />

          <div className="relative z-10">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.20em] text-[#f3c82f]">
                  Laboratório de treinamento
                </p>

                <h2
                  className="
                    mt-3
                    text-3xl
                    font-black
                    uppercase
                    leading-[0.96]
                    text-white
                    sm:text-4xl
                  "
                  style={{
                    fontFamily:
                      "'Arial Black', 'Montserrat', sans-serif",
                  }}
                >
                  Pratique com
                  <span className="block text-[#f3c82f]">
                    pedidos teste
                  </span>
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMostrarRecusados((atual) => !atual)
                }
                className="
                  rounded-xl
                  border
                  border-white/10
                  bg-white/[0.04]
                  px-4
                  py-3
                  text-xs
                  font-black
                  uppercase
                  text-white
                "
              >
                {mostrarRecusados
                  ? "Voltar aos pedidos"
                  : `Recusados (${recusados})`}
              </button>
            </div>

            <div className="mt-7">
              {pedidosVisiveis.length === 0 && (
                <div className="rounded-[22px] border border-dashed border-white/10 p-8 text-center text-sm text-white/35">
                  Nenhum pedido nesta categoria.
                </div>
              )}

              <div
                className={`grid gap-5 ${
                  pedidosVisiveis.length > 1
                    ? "lg:grid-cols-2"
                    : "mx-auto max-w-3xl"
                }`}
              >
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

                  return (
                    <article
                      key={pedido.id}
                      className="
                        overflow-hidden
                        rounded-[26px]
                        border
                        border-white/10
                        bg-[#0b0b0b]
                        shadow-[0_20px_55px_rgba(0,0,0,.45)]
                      "
                    >
                      <div className="border-b border-white/10 bg-white/[0.035] p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/30">
                            {pedido.id}
                          </span>

                          <span
                            className={`
                              rounded-full
                              px-3
                              py-1
                              text-[9px]
                              font-black
                              uppercase
                              ${
                                pedido.status === "novo"
                                  ? "bg-red-500/10 text-red-300"
                                  : pedido.status === "preparacao"
                                  ? "bg-[#d4af37]/10 text-[#f3c82f]"
                                  : pedido.status === "pronto"
                                  ? "bg-[#16f06d]/10 text-[#16f06d]"
                                  : "bg-white/[0.06] text-white/45"
                              }
                            `}
                          >
                            {pedido.status === "novo"
                              ? "Novo"
                              : pedido.status === "preparacao"
                              ? "Em preparação"
                              : pedido.status === "pronto"
                              ? "Pronto"
                              : "Recusado"}
                          </span>
                        </div>

                        <div className="mt-4 flex items-center gap-4">
                          <img
                            src={entregaIcon}
                            alt=""
                            className="h-16 w-16 object-contain"
                          />

                          <div>
                            <h3 className="text-xl font-black uppercase text-white">
                              Chalé {pedido.chale}
                            </h3>

                            <p className="mt-1 text-xs text-white/35">
                              Solicitação: {pedido.horario}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-5">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#f3c82f]">
                          Itens solicitados
                        </p>

                        <div className="mt-4 space-y-3">
                          {pedido.itens.map((item) => (
                            <div
                              key={item.produtoId}
                              className="
                                flex
                                items-center
                                gap-3
                                rounded-[18px]
                                border
                                border-white/10
                                bg-white/[0.03]
                                p-3
                              "
                            >
                              <ImagemProduto
                                nome={item.nome}
                                imagemUrl={item.imagemUrl}
                              />

                              <div className="min-w-0 flex-1">
                                <p className="break-words text-sm font-black text-white">
                                  {item.nome}
                                </p>

                                <p className="mt-1 text-xs text-white/30">
                                  Quantidade: {item.quantidade}
                                </p>
                              </div>

                              <span className="rounded-lg bg-white/[0.05] px-2 py-1 text-xs font-black text-white/60">
                                {item.quantidade}×
                              </span>
                            </div>
                          ))}
                        </div>

                        {pedido.status === "novo" && (
                          <div className="mt-5 space-y-3">
                            <button
                              type="button"
                              onClick={() =>
                                alternarConfirmacao(pedido.id)
                              }
                              className="
                                w-full
                                rounded-[16px]
                                bg-[#16f06d]
                                p-4
                                text-sm
                                font-black
                                uppercase
                                text-black
                              "
                            >
                              {selecionado
                                ? "Fechar opções"
                                : "Aceitar pedido"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                alternarRecusa(pedido.id)
                              }
                              className="
                                w-full
                                rounded-[16px]
                                border
                                border-red-500/25
                                bg-red-500/[0.05]
                                p-3
                                text-xs
                                font-black
                                uppercase
                                text-red-300
                              "
                            >
                              {recusando
                                ? "Fechar recusa"
                                : "Recusar solicitação"}
                            </button>

                            {selecionado && (
                              <div className="space-y-4 rounded-[18px] border border-[#16f06d]/20 bg-[#16f06d]/[0.04] p-4">
                                <div>
                                  <label
                                    htmlFor={`tempo-${pedido.id}`}
                                    className="mb-2 block text-xs font-black uppercase text-white"
                                  >
                                    Tempo de preparo
                                  </label>

                                  <select
                                    id={`tempo-${pedido.id}`}
                                    value={minutos}
                                    onChange={(event) =>
                                      setMinutos(
                                        event.target.value
                                      )
                                    }
                                    className="w-full rounded-xl border border-white/10 bg-[#111] p-3 text-sm text-white outline-none"
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
                                  <p className="mb-2 text-xs font-black uppercase text-white">
                                    Possui entregador?
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
                                      className={`
                                        rounded-xl
                                        border
                                        p-3
                                        text-xs
                                        font-black
                                        uppercase
                                        ${
                                          entregador === "sim"
                                            ? "border-[#16f06d] bg-[#16f06d] text-black"
                                            : "border-white/10 bg-white/[0.03] text-white"
                                        }
                                      `}
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
                                      className={`
                                        rounded-xl
                                        border
                                        p-3
                                        text-xs
                                        font-black
                                        uppercase
                                        ${
                                          entregador === "nao"
                                            ? "border-[#ff3030] bg-[#ff3030] text-white"
                                            : "border-white/10 bg-white/[0.03] text-white"
                                        }
                                      `}
                                    >
                                      Não
                                    </button>
                                  </div>
                                </div>

                                {entregador === "nao" && (
                                  <p className="rounded-xl border border-[#d4af37]/20 bg-[#d4af37]/[0.05] p-3 text-xs leading-5 text-[#f3c82f]">
                                    A retirada dependerá de confirmação da administração.
                                  </p>
                                )}

                                <button
                                  type="button"
                                  disabled={!entregador}
                                  onClick={() =>
                                    confirmarPedido(pedido.id)
                                  }
                                  className="
                                    w-full
                                    rounded-xl
                                    bg-white
                                    p-4
                                    text-xs
                                    font-black
                                    uppercase
                                    text-black
                                    disabled:opacity-30
                                  "
                                >
                                  Confirmar e iniciar preparo
                                </button>
                              </div>
                            )}

                            {recusando && (
                              <div className="rounded-[18px] border border-red-500/20 bg-red-500/[0.04] p-4">
                                <label
                                  htmlFor={`recusa-${pedido.id}`}
                                  className="block text-xs font-black uppercase text-red-300"
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
                                  className="mt-3 w-full rounded-xl border border-white/10 bg-[#111] p-3 text-sm text-white outline-none"
                                />

                                <button
                                  type="button"
                                  disabled={
                                    motivoRecusa.trim().length < 5
                                  }
                                  onClick={() =>
                                    recusarPedido(pedido.id)
                                  }
                                  className="mt-3 w-full rounded-xl bg-[#ff3030] p-3 text-xs font-black uppercase text-white disabled:opacity-30"
                                >
                                  Confirmar recusa
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {pedido.status === "preparacao" && (
                          <div className="mt-5 space-y-4">
                            <div className="rounded-[18px] border border-[#d4af37]/20 bg-[#d4af37]/[0.04] p-4 text-xs leading-6 text-white/55">
                              <p>
                                Preparo:{" "}
                                <strong className="text-white">
                                  {pedido.minutosPreparo} minutos
                                </strong>
                              </p>

                              <p>
                                Aceito às:{" "}
                                <strong className="text-white">
                                  {pedido.confirmadoEm !== null
                                    ? formatarHora(
                                        pedido.confirmadoEm
                                      )
                                    : "Não registrado"}
                                </strong>
                              </p>

                              <p>
                                Previsão:{" "}
                                <strong className="text-white">
                                  {prazoFinal !== null
                                    ? formatarHora(
                                        prazoFinal
                                      )
                                    : "Não informada"}
                                </strong>
                              </p>

                              <p className="mt-1">
                                {pedido.entregadorDisponivel
                                  ? "Entrega disponível"
                                  : "Retirada necessária"}
                              </p>
                            </div>

                            {quasePronto && (
                              <p className="rounded-xl bg-[#d4af37]/10 p-4 text-xs font-black uppercase text-[#f3c82f]">
                                Faltam aproximadamente{" "}
                                {restantes} minutos.
                              </p>
                            )}

                            {atrasado && (
                              <p className="rounded-xl bg-red-500/[0.07] p-4 text-xs font-black uppercase text-red-300">
                                O prazo previsto terminou.
                              </p>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                marcarPronto(pedido.id)
                              }
                              className="w-full rounded-xl bg-[#16f06d] p-4 text-xs font-black uppercase text-black"
                            >
                              Marcar como pronto
                            </button>
                          </div>
                        )}

                        {pedido.status === "pronto" && (
                          <div className="mt-5 rounded-[18px] border border-[#16f06d]/20 bg-[#16f06d]/[0.04] p-4 text-xs leading-6 text-[#a5f7c2]">
                            <p className="font-black uppercase">
                              Pedido pronto
                            </p>

                            <p className="mt-2">
                              Horário:{" "}
                              {pedido.prontoEm !== null
                                ? formatarHora(
                                    pedido.prontoEm
                                  )
                                : "Não registrado"}
                            </p>
                          </div>
                        )}

                        {pedido.status === "recusado" && (
                          <div className="mt-5 rounded-[18px] border border-white/10 bg-white/[0.03] p-4 text-xs leading-6 text-white/45">
                            <p className="font-black uppercase text-white">
                              Solicitação recusada
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

                        {(pedido.status === "preparacao" ||
                          pedido.status === "pronto") && (
                          <button
                            type="button"
                            onClick={() =>
                              solicitarIntervencao(pedido.id)
                            }
                            className="mt-5 w-full rounded-xl border border-[#d4af37]/20 bg-[#d4af37]/[0.04] p-3 text-xs font-black uppercase text-[#f3c82f]"
                          >
                            Solicitar intervenção administrativa
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="mt-7 rounded-[22px] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/30">
                Treinamento
              </p>

              <h3 className="mt-2 text-lg font-black uppercase text-white">
                Prepare sua equipe antes dos pedidos reais
              </h3>

              <p className="mt-2 max-w-3xl text-xs leading-6 text-white/35">
                Use este pedido demonstrativo para praticar aceite, preparo, recusa e conclusão.
              </p>
            </div>
          </div>
        </section>

        {/* RODAPÉ */}

        <footer className="mt-10 border-t border-white/10 py-8 text-center">
          <img
            src="/coroa.png"
            alt=""
            className="mx-auto h-10 w-10 object-contain opacity-65"
          />

          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.14em] text-white/20">
            Império Chalés • Portal do Parceiro
          </p>
        </footer>
      </div>

      {/* BOTÃO FLUTUANTE */}

      {treinamentoConcluido && (
        <div className="pointer-events-none fixed bottom-5 right-5 z-50">
          <Link
            to="/parceiro/pedidos"
            aria-label="Ver todos os pedidos"
            title="Ver todos os pedidos"
            className="
              pointer-events-auto
              inline-flex
              h-14
              w-14
              items-center
              justify-center
              rounded-full
              border
              border-red-500/35
              bg-[#ff3030]
              text-xl
              font-black
              text-white
              shadow-[0_0_28px_rgba(255,48,48,.40)]
              transition
              hover:scale-105
              sm:h-auto
              sm:w-auto
              sm:px-5
              sm:py-4
              sm:text-xs
              sm:uppercase
            "
          >
            <span className="sm:hidden">📋</span>
            <span className="hidden sm:inline">
              Ver pedidos →
            </span>
          </Link>
        </div>
      )}
    </main>
  );
}

export default ParceiroDashboard;
