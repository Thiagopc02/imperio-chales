
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";

import {
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  doc,
  where,
  type Timestamp,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase/config";

// =====================================================
// TIPOS
// =====================================================

type StatusConsulta =
  | "consulta_pendente"
  | "confirmado"
  | "indisponivel";

interface ItemConsulta {
  pratoId: string;
  nome: string;
  descricao: string;
  imagemUrl: string;
  imagem: string;
  precoUnitario: number;
  quantidade: number;
  subtotal: number;
  observacao: string;
}

interface ConsultaCardapio {
  id: string;

  restauranteId: string;
  restauranteNome: string;
  restauranteWhatsapp: string;
  modalidadeEntrega: string;
  atendimento: string;
  atendimentoDescricao: string;
  pagamento: string;
  pagamentoDescricao: string;
  taxaEntrega: number | null;
  totalEstimado: number | null;

  status: StatusConsulta;
  origem: string;

  subtotal: number;
  totalItens: number;

  itens: ItemConsulta[];

  criadoEm: Timestamp | null;
  atualizadoEm: Timestamp | null;
}

type FiltroConsulta =
  | "todas"
  | "consulta_pendente"
  | "confirmado"
  | "indisponivel";

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function texto(valor: unknown): string {
  return typeof valor === "string"
    ? valor
    : "";
}

function numero(valor: unknown): number {
  return typeof valor === "number" &&
    Number.isFinite(valor)
    ? valor
    : 0;
}

function referenciaCurta(id: string): string {
  const semPrefixo = id.replace(/^consulta_/, "");
  return semPrefixo.slice(0, 8).toUpperCase();
}

function descricaoAtendimento(consulta: ConsultaCardapio): string {
  if (consulta.atendimentoDescricao) return consulta.atendimentoDescricao;
  switch (consulta.atendimento) {
    case "entrega": return "Entrega no chalé";
    case "retirada_restaurante": return "Retirada no restaurante";
    case "retirada_anfitriao": return "Retirada sob consulta ao anfitrião";
    default: return "Não informado (consulta anterior)";
  }
}

function descricaoPagamento(consulta: ConsultaCardapio): string {
  if (consulta.pagamentoDescricao) return consulta.pagamentoDescricao;
  switch (consulta.pagamento) {
    case "pix": return "PIX";
    case "credito": return "Cartão de crédito";
    case "debito": return "Cartão de débito";
    case "dinheiro": return "Dinheiro";
    default: return "Não informado (consulta anterior)";
  }
}

function dinheiro(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function formatarData(
  valor: Timestamp | null
): string {
  if (!valor) {
    return "Data não disponível";
  }

  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(valor.toDate());
  } catch {
    return "Data não disponível";
  }
}

function lerItem(valor: unknown): ItemConsulta {
  const dados =
    typeof valor === "object" &&
    valor !== null &&
    !Array.isArray(valor)
      ? (valor as Record<string, unknown>)
      : {};

  return {
    pratoId: texto(dados.pratoId),

    nome:
      texto(dados.nome) ||
      "Prato sem nome",

    descricao: texto(dados.descricao),

    imagemUrl:
      texto(dados.imagemUrl) ||
      texto(dados.imagem),

    imagem:
      texto(dados.imagem) ||
      texto(dados.imagemUrl),

    precoUnitario:
      numero(dados.precoUnitario),

    quantidade:
      numero(dados.quantidade),

    subtotal:
      numero(dados.subtotal),

    observacao:
      texto(dados.observacao),
  };
}

function mensagemErroFirebase(
  erro: unknown
): string {
  if (
    typeof erro === "object" &&
    erro !== null &&
    "code" in erro
  ) {
    const codigo = String(
      (erro as { code: unknown }).code
    );

    if (
      codigo === "permission-denied"
    ) {
      return (
        "O Firebase bloqueou o acesso. " +
        "Confira se você entrou com a conta do parceiro aprovado " +
        "e se as regras de consultasCardapio foram publicadas."
      );
    }

    if (
      codigo === "failed-precondition"
    ) {
      return (
        "O Firestore solicitou uma configuração adicional " +
        "para esta consulta. Verifique a mensagem no console."
      );
    }
  }

  return (
    "Não foi possível consultar os dados. " +
    "Confira sua conexão e tente novamente."
  );
}

// =====================================================
// CONFIGURAÇÃO DOS STATUS
// =====================================================

function tituloStatus(
  status: StatusConsulta
): string {
  switch (status) {
    case "consulta_pendente":
      return "Aguardando resposta";

    case "confirmado":
      return "Disponibilidade confirmada";

    case "indisponivel":
      return "Itens indisponíveis";

    default:
      return "Situação desconhecida";
  }
}

function corStatus(
  status: StatusConsulta
): string {
  switch (status) {
    case "consulta_pendente":
      return (
        "border-amber-200 " +
        "bg-amber-50 text-amber-900"
      );

    case "confirmado":
      return (
        "border-green-200 " +
        "bg-green-50 text-green-800"
      );

    case "indisponivel":
      return (
        "border-red-200 " +
        "bg-red-50 text-red-800"
      );

    default:
      return (
        "border-gray-200 " +
        "bg-gray-50 text-gray-700"
      );
  }
}

// =====================================================
// COMPONENTE
// =====================================================

export function ParceiroPedidos() {
  // ===================================================
  // AUTENTICAÇÃO
  // ===================================================

  const [usuario, setUsuario] =
    useState<User | null>(null);

  const [verificandoLogin, setVerificandoLogin] =
    useState(true);

  // ===================================================
  // CONSULTAS
  // ===================================================

  const [consultas, setConsultas] =
    useState<ConsultaCardapio[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [erroConsulta, setErroConsulta] =
    useState("");

  const [sucesso, setSucesso] =
    useState("");

  const [filtro, setFiltro] =
    useState<FiltroConsulta>("todas");

  const [busca, setBusca] =
    useState("");

  const [salvandoId, setSalvandoId] =
    useState<string | null>(null);

  // ===================================================
  // VERIFICAR USUÁRIO LOGADO
  // ===================================================

  useEffect(() => {
    const cancelar = onAuthStateChanged(
      auth,

      (usuarioAtual) => {
        setUsuario(usuarioAtual);

        setVerificandoLogin(false);
      }
    );

    return () => cancelar();
  }, []);

  // ===================================================
  // CONSULTAR SOLICITAÇÕES EM TEMPO REAL
  // ===================================================

  useEffect(() => {
    if (verificandoLogin) {
      return;
    }

    if (!usuario) {
      setConsultas([]);
      setCarregando(false);
      setErroConsulta("");

      return;
    }

    setCarregando(true);
    setErroConsulta("");

    // IMPORTANTE:
    //
    // Cada parceiro consulta exclusivamente
    // as solicitações destinadas ao próprio UID.
    //
    // A regra correspondente no Firestore
    // também verifica esse vínculo.
    //
    // Não utilizar uma consulta sem o filtro
    // restauranteId para o portal do parceiro.

    const consultaFirebase = query(
      collection(
        db,
        "consultasCardapio"
      ),

      where(
        "restauranteId",
        "==",
        usuario.uid
      )
    );

    const cancelar = onSnapshot(
      consultaFirebase,

      (resultado) => {
        const lista: ConsultaCardapio[] =
          resultado.docs.map((documento) => {
            const dados = documento.data();

            const statusOriginal =
              texto(dados.status);

            const status: StatusConsulta =
              statusOriginal === "confirmado"
                ? "confirmado"
                : statusOriginal === "indisponivel"
                  ? "indisponivel"
                  : "consulta_pendente";

            const itens = Array.isArray(
              dados.itens
            )
              ? dados.itens.map(lerItem)
              : [];

            return {
              id: documento.id,

              restauranteId:
                texto(dados.restauranteId),

              restauranteNome:
                texto(dados.restauranteNome),

              restauranteWhatsapp:
                texto(dados.restauranteWhatsapp),

              modalidadeEntrega:
                texto(dados.modalidadeEntrega),

              atendimento:
                texto(dados.atendimento),

              atendimentoDescricao:
                texto(dados.atendimentoDescricao),

              pagamento:
                texto(dados.pagamento),

              pagamentoDescricao:
                texto(dados.pagamentoDescricao),

              taxaEntrega:
                typeof dados.taxaEntrega === "number" &&
                Number.isFinite(dados.taxaEntrega)
                  ? dados.taxaEntrega
                  : null,

              totalEstimado:
                typeof dados.totalEstimado === "number" &&
                Number.isFinite(dados.totalEstimado)
                  ? dados.totalEstimado
                  : null,

              status,

              origem:
                texto(dados.origem),

              subtotal:
                numero(dados.subtotal),

              totalItens:
                numero(dados.totalItens),

              itens,

              criadoEm:
                dados.criadoEm ?? null,

              atualizadoEm:
                dados.atualizadoEm ?? null,
            };
          });

        // Ordenação feita no navegador para
        // evitar exigir um índice composto
        // do Firestore nesta etapa.

        lista.sort((primeira, segunda) => {
          const dataPrimeira =
            primeira.criadoEm?.toMillis() ?? 0;

          const dataSegunda =
            segunda.criadoEm?.toMillis() ?? 0;

          return dataSegunda - dataPrimeira;
        });

        setConsultas(lista);

        setCarregando(false);
        setErroConsulta("");
      },

      (erro) => {
        console.error(
          "Erro ao consultar solicitações:",
          erro
        );

        setErroConsulta(
          mensagemErroFirebase(erro)
        );

        setCarregando(false);
      }
    );

    return () => cancelar();
  }, [
    usuario?.uid,
    verificandoLogin,
  ]);

  // ===================================================
  // INDICADORES
  // ===================================================

  const pendentes = consultas.filter(
    (consulta) =>
      consulta.status ===
      "consulta_pendente"
  ).length;

  const confirmadas = consultas.filter(
    (consulta) =>
      consulta.status === "confirmado"
  ).length;

  const indisponiveis = consultas.filter(
    (consulta) =>
      consulta.status === "indisponivel"
  ).length;

  const totalConsultas =
    consultas.length;

  // ===================================================
  // FILTRAR CONSULTAS
  // ===================================================

  const consultasFiltradas = useMemo(() => {
    const termo = busca
      .trim()
      .toLocaleLowerCase("pt-BR");

    return consultas.filter((consulta) => {
      const filtroCorreto =
        filtro === "todas" ||
        consulta.status === filtro;

      const textoPesquisavel = [
        consulta.id,
        consulta.restauranteNome,

        ...consulta.itens.map(
          (item) => item.nome
        ),
      ]
        .join(" ")
        .toLocaleLowerCase("pt-BR");

      const buscaCorreta =
        !termo ||
        textoPesquisavel.includes(termo);

      return filtroCorreto &&
        buscaCorreta;
    });
  }, [
    consultas,
    filtro,
    busca,
  ]);

  // ===================================================
  // ATUALIZAR STATUS
  // ===================================================

  async function responderConsulta(
    consulta: ConsultaCardapio,
    novoStatus:
      | "confirmado"
      | "indisponivel"
  ) {
    if (!usuario) {
      setErroConsulta(
        "Entre na sua conta de parceiro para responder."
      );

      return;
    }

    if (
      consulta.restauranteId !== usuario.uid
    ) {
      setErroConsulta(
        "Você não tem permissão para responder a esta consulta."
      );

      return;
    }

    if (
      consulta.status !==
      "consulta_pendente"
    ) {
      setErroConsulta(
        "Esta consulta já foi respondida."
      );

      return;
    }

    if (salvandoId) {
      return;
    }

    const acao =
      novoStatus === "confirmado"
        ? "confirmar a disponibilidade dos itens"
        : "informar que os itens estão indisponíveis";

    const confirmou = window.confirm(
      `Deseja ${acao} para a consulta ${consulta.id}?`
    );

    if (!confirmou) {
      return;
    }

    setErroConsulta("");
    setSucesso("");
    setSalvandoId(consulta.id);

    try {
      await updateDoc(
        doc(
          db,
          "consultasCardapio",
          consulta.id
        ),

        {
          status: novoStatus,

          atualizadoEm:
            serverTimestamp(),
        }
      );

      setSucesso(
        novoStatus === "confirmado"
          ? "Disponibilidade confirmada no Firebase. Isso ainda não comprova pagamento nem venda realizada."
          : "Indisponibilidade registrada no Firebase."
      );

    } catch (erro) {
      console.error(
        "Erro ao responder consulta:",
        erro
      );

      setErroConsulta(
        mensagemErroFirebase(erro)
      );

    } finally {
      setSalvandoId(null);
    }
  }

  // ===================================================
  // INTERFACE
  // ===================================================

  return (
    <main className="min-h-screen bg-[#f8f6ef] text-[#19352b]">

      {/* =========================================== */}
      {/* CABEÇALHO                                   */}
      {/* =========================================== */}

      <header className="bg-[#101813] px-4 py-5 text-white">

        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">

          <div className="flex items-center gap-3">

            <img
              src="/logo-imperio.png"
              alt="Império Chalés"
              className="h-12 w-12 rounded-full object-contain"
            />

            <div>

              <h1 className="text-lg font-extrabold">
                Portal do Parceiro
              </h1>

              <p className="text-xs font-bold tracking-widest text-amber-300">
                CENTRAL DE CONSULTAS
              </p>

            </div>

          </div>

          <Link
            to="/parceiro/dashboard"
            className="rounded-xl border border-white/30 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
          >
            ← Voltar ao painel
          </Link>

        </div>

      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">

        {/* ========================================= */}
        {/* DESTAQUE                                  */}
        {/* ========================================= */}

        <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#10251d] via-[#143b2b] to-[#10251d] p-6 text-white shadow-xl md:p-10">

          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />

          <div className="relative">

            <span className="inline-flex rounded-full border border-amber-400/50 bg-amber-400/10 px-4 py-2 text-xs font-extrabold tracking-wider text-amber-300">

              📋 CENTRAL DE CONSULTAS

            </span>

            <h2 className="mt-7 text-4xl font-black uppercase leading-tight md:text-6xl">

              MINHAS

              <span className="block text-amber-400">
                CONSULTAS
              </span>

            </h2>

            <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-white md:text-xl">

              Acompanhe as solicitações recebidas
              pelo Sabores da Chapada e responda
              à disponibilidade dos pratos do seu
              restaurante.

            </p>

            <div className="mt-7 rounded-2xl border border-blue-300/30 bg-blue-500/10 p-4 text-sm leading-7 text-blue-100">

              ℹ️ Os valores exibidos são estimativas
              baseadas nos pratos publicados.

              A confirmação de disponibilidade não
              significa que o cliente pagou ou que
              a venda foi concluída.

            </div>

          </div>

        </section>

        {/* ========================================= */}
        {/* AUTENTICAÇÃO                              */}
        {/* ========================================= */}

        {!verificandoLogin && !usuario && (

          <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">

            <h3 className="text-xl font-black text-amber-950">
              🔒 Acesse sua conta de parceiro
            </h3>

            <p className="mt-3 text-sm leading-7 text-amber-900">

              Entre com a conta cadastrada para
              consultar as solicitações do seu
              restaurante.

            </p>

            <Link
              to="/parceiro/login"
              className="mt-5 inline-flex rounded-xl bg-[#19352b] px-6 py-4 text-sm font-black text-white"
            >
              Entrar como parceiro
            </Link>

          </section>

        )}

        {/* ========================================= */}
        {/* INDICADORES                               */}
        {/* ========================================= */}

        <section className="mt-9 grid grid-cols-2 gap-3 lg:grid-cols-4">

          {[
            {
              icone: "📋",
              titulo: "Total de consultas",
              valor: totalConsultas,
              cor: "text-blue-700",
            },

            {
              icone: "⏳",
              titulo: "Aguardando resposta",
              valor: pendentes,
              cor: "text-amber-600",
            },

            {
              icone: "✅",
              titulo: "Disponibilidade confirmada",
              valor: confirmadas,
              cor: "text-green-700",
            },

            {
              icone: "❌",
              titulo: "Indisponíveis",
              valor: indisponiveis,
              cor: "text-red-600",
            },

          ].map((item) => (

            <article
              key={item.titulo}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >

              <span className="text-3xl">
                {item.icone}
              </span>

              <p className="mt-4 text-sm font-bold text-gray-600">
                {item.titulo}
              </p>

              <p className={`mt-3 text-3xl font-black ${item.cor}`}>

                {verificandoLogin || carregando
                  ? "—"
                  : item.valor}

              </p>

              <p className="mt-2 text-xs text-gray-400">

                Dados do Firebase

              </p>

            </article>

          ))}

        </section>

        {/* ========================================= */}
        {/* ALERTAS                                   */}
        {/* ========================================= */}

        {sucesso && (

          <div
            role="status"
            className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-5 text-sm font-bold leading-7 text-green-900"
          >

            ✅ {sucesso}

          </div>

        )}

        {erroConsulta && (

          <div
            role="alert"
            className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold leading-7 text-red-800"
          >

            ⚠️ {erroConsulta}

          </div>

        )}

        {/* ========================================= */}
        {/* LISTAGEM                                  */}
        {/* ========================================= */}

        <section className="mt-10">

          <span className="text-xs font-extrabold uppercase tracking-[0.25em] text-amber-700">
            ORGANIZAÇÃO DO ATENDIMENTO
          </span>

          <h3 className="mt-3 text-3xl font-black">
            Solicitações recebidas
          </h3>

          <p className="mt-3 text-sm leading-6 text-gray-500">

            Apenas consultas destinadas ao seu
            restaurante serão exibidas aqui.

          </p>

          {/* BUSCA */}

          <input
            type="search"
            value={busca}
            onChange={(event) =>
              setBusca(event.target.value)
            }
            placeholder="🔎 Buscar prato ou referência..."
            className="mt-7 w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm outline-none focus:border-amber-400"
          />

          {/* FILTROS */}

          <div className="mt-5 flex flex-wrap gap-2">

            {[
              {
                valor: "todas",
                titulo: "Todas",
              },

              {
                valor: "consulta_pendente",
                titulo: "⏳ Pendentes",
              },

              {
                valor: "confirmado",
                titulo: "✅ Confirmadas",
              },

              {
                valor: "indisponivel",
                titulo: "❌ Indisponíveis",
              },

            ].map((item) => (

              <button
                key={item.valor}
                type="button"
                onClick={() =>
                  setFiltro(
                    item.valor as FiltroConsulta
                  )
                }
                aria-pressed={
                  filtro === item.valor
                }
                className={`rounded-full border px-4 py-3 text-xs font-black transition ${
                  filtro === item.valor
                    ? "border-[#19352b] bg-[#19352b] text-white"
                    : "border-gray-200 bg-white text-gray-600"
                }`}
              >

                {item.titulo}

              </button>

            ))}

          </div>

          {/* CARREGAMENTO */}

          {(verificandoLogin || carregando) &&
            usuario && (

            <div className="mt-7 rounded-2xl border border-blue-200 bg-blue-50 p-6 text-center text-sm font-bold text-blue-900">

              ⏳ Carregando consultas...

            </div>

          )}

          {/* CONSULTAS */}

          {!verificandoLogin &&
            usuario &&
            !carregando &&
            !erroConsulta &&
            consultasFiltradas.length === 0 && (

            <div className="mt-7 rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center">

              <div className="text-5xl">
                📋
              </div>

              <h4 className="mt-5 text-xl font-black">
                Nenhuma consulta encontrada
              </h4>

              <p className="mt-3 text-sm leading-7 text-gray-500">

                As consultas destinadas ao seu
                restaurante aparecerão aqui
                automaticamente quando forem
                registradas.

              </p>

            </div>

          )}

          {!verificandoLogin &&
            usuario &&
            !carregando &&
            consultasFiltradas.length > 0 && (

            <div className="mt-7 grid gap-6 lg:grid-cols-2">

              {consultasFiltradas.map(
                (consulta) => (

                <article
                  key={consulta.id}
                  className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm"
                >

                  {/* CABEÇALHO */}

                  <div className="bg-[#101813] p-5 text-white">

                    <div className="flex flex-wrap items-center justify-between gap-3">

                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">

                        SABORES DA CHAPADA

                      </span>

                      <span
                        className={`rounded-full border px-3 py-2 text-xs font-black ${corStatus(consulta.status)}`}
                      >

                        {tituloStatus(consulta.status)}

                      </span>

                    </div>

                    <h4 className="mt-4 break-all text-lg font-black">

                      Consulta #{referenciaCurta(consulta.id)}

                    </h4>

                    <p className="mt-2 text-xs text-gray-300">

                      📅 {formatarData(consulta.criadoEm)}

                    </p>

                    <p className="mt-2 text-xs text-gray-300">

                      Restaurante: {consulta.restauranteNome}

                    </p>

                  </div>

                  {/* INFORMAÇÕES */}

                  <div className="p-5">

                    <div className="flex flex-wrap items-center justify-between gap-3">

                      <span className="text-sm font-bold text-gray-500">

                        {consulta.totalItens} item(ns)

                      </span>

                      <strong className="text-2xl font-black text-green-900">

                        {dinheiro(consulta.totalEstimado ?? consulta.subtotal)}

                      </strong>

                    </div>

                    <p className="mt-2 text-xs text-gray-500">

                      Total estimado quando informado. Valor final
                      sujeito à confirmação do restaurante.

                    </p>

                    {/* ITENS */}

                    <div className="mt-6 space-y-4">

                      {consulta.itens.map(
                        (item, indice) => (

                        <div
                          key={`${item.pratoId}-${indice}`}
                          className="rounded-2xl border border-gray-200 bg-[#faf8f2] p-4"
                        >

                          <div className="flex items-start gap-4">

                            {item.imagemUrl ? (

                              <img
                                src={item.imagemUrl}
                                alt={`Imagem ilustrativa de ${item.nome}`}
                                className="h-20 w-20 shrink-0 rounded-xl bg-white object-cover"
                              />

                            ) : (

                              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-white text-2xl">

                                🍽️

                              </div>

                            )}

                            <div className="min-w-0 flex-1">

                              <h5 className="break-words font-black">

                                {item.nome}

                              </h5>

                              <p className="mt-2 text-sm text-gray-600">

                                {item.quantidade}x{" "}
                                {dinheiro(item.precoUnitario)}

                              </p>

                              <p className="mt-2 font-black text-green-900">

                                {dinheiro(item.subtotal)}

                              </p>

                            </div>

                          </div>

                          {/* OBSERVAÇÃO */}

                          {item.observacao && (

                            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">

                              <strong>
                                📝 Observação do cliente
                              </strong>

                              <p className="mt-2 whitespace-pre-wrap">

                                {item.observacao}

                              </p>

                            </div>

                          )}

                        </div>

                      ))}

                    </div>

                    {/* ATENDIMENTO, PAGAMENTO E VALORES */}

                    <section className="mt-6 rounded-2xl border border-pink-200 bg-pink-50/50 p-4 sm:p-5">
                      <h5 className="text-base font-black text-[#19352b]">
                        🚚 Atendimento e pagamento
                      </h5>

                      <div className="mt-4 space-y-3 text-sm">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <span className="font-bold text-gray-600">Modalidade escolhida</span>
                          <strong className="text-right text-[#19352b]">
                            {descricaoAtendimento(consulta)}
                          </strong>
                        </div>

                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <span className="font-bold text-gray-600">Preferência de pagamento</span>
                          <strong className="text-right text-[#19352b]">
                            {descricaoPagamento(consulta)}
                          </strong>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2 border-t border-pink-200 pt-4 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span>Subtotal dos pratos</span>
                          <strong>{dinheiro(consulta.subtotal)}</strong>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span>Taxa de entrega</span>
                          <strong>
                            {consulta.taxaEntrega === null
                              ? "Não informada"
                              : dinheiro(consulta.taxaEntrega)}
                          </strong>
                        </div>

                        <div className="flex items-center justify-between gap-2 border-t border-pink-200 pt-3 text-base font-black">
                          <span>Total estimado</span>
                          <span className="text-green-900">
                            {consulta.totalEstimado === null
                              ? "Não informado"
                              : dinheiro(consulta.totalEstimado)}
                          </span>
                        </div>
                      </div>

                      <p className="mt-4 text-xs leading-6 text-gray-600">
                        O pagamento é combinado diretamente entre o cliente e o
                        restaurante. Confirme a modalidade, a taxa, o preço final
                        e a forma de pagamento antes de concluir o atendimento.
                      </p>

                      {consulta.atendimento === "retirada_anfitriao" && (
                        <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs font-bold text-amber-900">
                          ⚠️ Retirada pelo anfitrião somente após confirmação prévia.
                        </p>
                      )}
                    </section>

                    {/* REFERÊNCIA COMPLETA */}

                    <div className="mt-6 rounded-xl bg-gray-50 p-4">

                      <p className="text-xs font-bold text-gray-500">

                        REFERÊNCIA DA CONSULTA

                      </p>

                      <p className="mt-2 break-all font-mono text-xs">

                        {consulta.id}

                      </p>

                    </div>

                    {/* AÇÕES */}

                    {consulta.status ===
                      "consulta_pendente" && (

                      <div className="mt-6 space-y-3">

                        <button
                          type="button"
                          disabled={
                            salvandoId !== null
                          }
                          onClick={() =>
                            responderConsulta(
                              consulta,
                              "confirmado"
                            )
                          }
                          className="w-full rounded-xl bg-green-600 px-5 py-4 text-sm font-black text-white transition hover:bg-green-700 disabled:opacity-40"
                        >

                          {salvandoId === consulta.id
                            ? "⏳ Salvando..."
                            : "✅ Confirmar disponibilidade"}

                        </button>

                        <button
                          type="button"
                          disabled={
                            salvandoId !== null
                          }
                          onClick={() =>
                            responderConsulta(
                              consulta,
                              "indisponivel"
                            )
                          }
                          className="w-full rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:opacity-40"
                        >

                          ❌ Informar indisponibilidade

                        </button>

                      </div>

                    )}

                    {/* STATUS RESPONDIDO */}

                    {consulta.status !==
                      "consulta_pendente" && (

                      <div
                        className={`mt-6 rounded-xl border p-4 text-sm font-bold ${corStatus(consulta.status)}`}
                      >

                        {consulta.status ===
                          "confirmado"
                          ? "✅ O restaurante confirmou a disponibilidade desta consulta. Ainda é necessário acertar o pedido e o pagamento com o cliente."
                          : "❌ O restaurante informou que os itens desta consulta estão indisponíveis."}

                        <p className="mt-2 text-xs font-normal">

                          Atualizado em:{" "}
                          {formatarData(
                            consulta.atualizadoEm
                          )}

                        </p>

                      </div>

                    )}

                  </div>

                </article>

              ))}

            </div>

          )}

        </section>

        {/* ========================================= */}
        {/* AVISO FINAL                               */}
        {/* ========================================= */}

        <div className="mt-12 rounded-2xl border border-blue-200 bg-blue-50 p-6 text-sm leading-7 text-blue-900">

          ℹ️ Esta central acompanha consultas
          registradas no Sabores da Chapada.

          O envio da mensagem pelo WhatsApp,
          o pagamento e a conclusão da venda
          não são verificados automaticamente
          nesta etapa.

        </div>

      </div>

    </main>
  );
}

export default ParceiroPedidos;