import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";

import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type Timestamp,
} from "firebase/firestore";

import { auth, db } from "../firebase/config";
import { isAdmin } from "../firebase/admin";
// =====================================================
// TIPOS
// =====================================================

type StatusRestaurante =
  | "pendente"
  | "aprovado"
  | "rejeitado";

type FiltroRestaurante =
  | "todos"
  | "pendente"
  | "aprovado"
  | "rejeitado";

type CategoriaPublica =
  | "Hambúrgueres"
  | "Pizzarias"
  | "Jantinhas e Espetinhos"
  | "Almoço e Comida Caseira"
  | "Gastronomia Especial"
  | "Cafeterias e Sobremesas";

type ModalidadePublica =
  | "entrega_propria"
  | "retirada_anfitriao";

interface Restaurante {
  id: string;
  uid: string;
  nomeEmpresa: string;
  nomeResponsavel: string;
  email: string;
  telefone: string;
  documento: string;
  cep: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  complemento: string;
  modalidadeEntrega: string;
  descricao: string;
  logoUrl: string;
  status: StatusRestaurante;
  criadoEm: Timestamp | null;
}

interface RestaurantePublicado {
  id: string;
  nome: string;
  categoria: string;
  descricao: string;
  modalidadeEntrega: string;
  ativo: boolean;
  logo: string;
  telefone: string;
  whatsapp: string;
}

interface FormularioPublicacao {
  categoria: CategoriaPublica | "";
  descricao: string;
  modalidadeEntrega: ModalidadePublica | "";
  whatsapp: string;
  horarioFuncionamento: string;
}

// =====================================================
// CONSTANTES
// =====================================================

const CATEGORIAS: CategoriaPublica[] = [
  "Hambúrgueres",
  "Pizzarias",
  "Jantinhas e Espetinhos",
  "Almoço e Comida Caseira",
  "Gastronomia Especial",
  "Cafeterias e Sobremesas",
];

const FORMULARIO_VAZIO: FormularioPublicacao = {
  categoria: "",
  descricao: "",
  modalidadeEntrega: "",
  whatsapp: "",
  horarioFuncionamento: "",
};

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function formatarData(
  data: Timestamp | null
): string {
  if (!data?.toDate) {
    return "Data não informada";
  }

  return data.toDate().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarModalidade(
  valor: string
): string {
  switch (valor) {
    case "entrega_propria":
      return "🛵 Entrega própria";

    case "somente_retirada":
      return "📦 Somente retirada";

    case "retirada_anfitriao":
      return "🛍️ Retirada sob consulta";

    case "ambas":
      return "✅ Entrega própria e retirada";

    default:
      return "Não informada";
  }
}

function formatarStatus(
  status: StatusRestaurante
): string {
  switch (status) {
    case "pendente":
      return "⏳ Aguardando aprovação";

    case "aprovado":
      return "✅ Aprovado";

    case "rejeitado":
      return "❌ Rejeitado";
  }
}

function classeStatus(
  status: StatusRestaurante
): string {
  switch (status) {
    case "pendente":
      return "border-amber-200 bg-amber-100 text-amber-800";

    case "aprovado":
      return "border-green-200 bg-green-100 text-green-800";

    case "rejeitado":
      return "border-red-200 bg-red-100 text-red-800";
  }
}

function somenteNumeros(
  valor: string
): string {
  return valor.replace(/\D/g, "");
}

function obterErro(
  erro: unknown
): string {
  if (erro instanceof Error) {
    const codigo =
      "code" in erro
        ? String(erro.code)
        : "";

    if (codigo === "permission-denied") {
      return (
        "O Firebase negou a operação. Confira a conta " +
        "administrativa e as regras publicadas."
      );
    }

    return erro.message;
  }

  return "Não foi possível concluir a operação.";
}

// =====================================================
// COMPONENTE
// =====================================================

export function AdminRestaurantes() {
  // ---------------------------------------------------
  // DADOS
  // ---------------------------------------------------

  const [restaurantes, setRestaurantes] =
    useState<Restaurante[]>([]);

  const [publicados, setPublicados] =
    useState<RestaurantePublicado[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [carregandoPublicos, setCarregandoPublicos] =
    useState(true);

  const [erro, setErro] = useState("");

  const [mensagem, setMensagem] = useState("");

  // ---------------------------------------------------
  // FILTROS
  // ---------------------------------------------------

  const [filtro, setFiltro] =
    useState<FiltroRestaurante>("todos");

  const [busca, setBusca] = useState("");

  // ---------------------------------------------------
  // AÇÕES
  // ---------------------------------------------------

  const [processandoId, setProcessandoId] =
    useState<string | null>(null);

  const [detalhesAbertos, setDetalhesAbertos] =
    useState<string | null>(null);

  const [publicacaoAberta, setPublicacaoAberta] =
    useState<string | null>(null);

  const [formulario, setFormulario] =
    useState<FormularioPublicacao>(
      FORMULARIO_VAZIO
    );

  // ===================================================
  // CONSULTAR CADASTROS PRIVADOS
  // ===================================================

  useEffect(() => {
    const usuario = auth.currentUser;

    if (!usuario || !isAdmin(usuario.uid)) {
      setErro(
        "Sessão administrativa não autorizada."
      );

      setCarregando(false);
      return;
    }

    const referencia = collection(
      db,
      "restaurantes"
    );

    const cancelar = onSnapshot(
      referencia,

      (resultado) => {
        const lista: Restaurante[] =
          resultado.docs.map((documento) => {
            const dados = documento.data();

            const status: StatusRestaurante =
              dados.status === "aprovado" ||
              dados.status === "rejeitado"
                ? dados.status
                : "pendente";

            return {
              id: documento.id,

              uid:
                typeof dados.uid === "string"
                  ? dados.uid
                  : documento.id,

              nomeEmpresa:
                dados.nomeEmpresa ?? "",

              nomeResponsavel:
                dados.nomeResponsavel ?? "",

              email:
                dados.email ?? "",

              telefone:
                dados.telefone ?? "",

              documento:
                dados.documento ?? "",

              cep:
                dados.cep ?? "",

              endereco:
                dados.endereco ?? "",

              numero:
                dados.numero ?? "",

              bairro:
                dados.bairro ?? "",

              cidade:
                dados.cidade ?? "",

              complemento:
                dados.complemento ?? "",

              modalidadeEntrega:
                dados.modalidadeEntrega ?? "",

              descricao:
                dados.descricao ?? "",

              logoUrl:
                dados.logoUrl ?? "",

              status,

              criadoEm:
                dados.criadoEm ?? null,
            };
          });

        lista.sort((a, b) => {
          const dataA =
            a.criadoEm?.toMillis() ?? 0;

          const dataB =
            b.criadoEm?.toMillis() ?? 0;

          return dataB - dataA;
        });

        setRestaurantes(lista);
        setCarregando(false);
        setErro("");
      },

      (erroFirebase) => {
        console.error(
          "Erro ao consultar restaurantes:",
          erroFirebase
        );

        setErro(obterErro(erroFirebase));
        setCarregando(false);
      }
    );

    return () => cancelar();
  }, []);

  // ===================================================
  // CONSULTAR VITRINE PÚBLICA
  // ===================================================

  useEffect(() => {
    const referencia = collection(
      db,
      "catalogoPublico"
    );

    const cancelar = onSnapshot(
      referencia,

      (resultado) => {
        const lista: RestaurantePublicado[] =
          resultado.docs.map((documento) => {
            const dados = documento.data();

            return {
              id: documento.id,
              nome: dados.nome ?? "",
              categoria: dados.categoria ?? "",
              descricao: dados.descricao ?? "",
              modalidadeEntrega:
                dados.modalidadeEntrega ?? "",
              ativo: dados.ativo === true,
              logo: dados.logo ?? "",
              telefone: dados.telefone ?? "",
              whatsapp: dados.whatsapp ?? "",
            };
          });

        setPublicados(lista);
        setCarregandoPublicos(false);
      },

      (erroFirebase) => {
        console.error(
          "Erro ao consultar catálogo público:",
          erroFirebase
        );

        setErro(obterErro(erroFirebase));
        setCarregandoPublicos(false);
      }
    );

    return () => cancelar();
  }, []);

  // ===================================================
  // ÍNDICE DOS RESTAURANTES PUBLICADOS
  // ===================================================

  const mapaPublicados = useMemo(() => {
    return new Map(
      publicados.map((restaurante) => [
        restaurante.id,
        restaurante,
      ])
    );
  }, [publicados]);

  // ===================================================
  // INDICADORES
  // ===================================================

  const total = restaurantes.length;

  const pendentes = restaurantes.filter(
    (restaurante) =>
      restaurante.status === "pendente"
  ).length;

  const aprovados = restaurantes.filter(
    (restaurante) =>
      restaurante.status === "aprovado"
  ).length;

  const rejeitados = restaurantes.filter(
    (restaurante) =>
      restaurante.status === "rejeitado"
  ).length;

  const totalPublicados = publicados.filter(
    (restaurante) =>
      restaurante.ativo
  ).length;

  // ===================================================
  // FILTROS
  // ===================================================

  const restaurantesFiltrados = restaurantes.filter(
    (restaurante) => {
      const correspondeFiltro =
        filtro === "todos" ||
        restaurante.status === filtro;

      const termo = busca
        .trim()
        .toLocaleLowerCase("pt-BR");

      const correspondeBusca =
        !termo ||
        [
          restaurante.nomeEmpresa,
          restaurante.nomeResponsavel,
          restaurante.email,
        ]
          .join(" ")
          .toLocaleLowerCase("pt-BR")
          .includes(termo);

      return correspondeFiltro && correspondeBusca;
    }
  );

  // ===================================================
  // VALIDAR SESSÃO ADMINISTRATIVA
  // ===================================================

  function verificarAdministrador(): boolean {
    const usuario = auth.currentUser;

    if (!usuario || !isAdmin(usuario.uid)) {
      setErro(
        "Faça login com a conta administrativa."
      );

      return false;
    }

    return true;
  }

  // ===================================================
  // APROVAR OU REJEITAR EMPRESA
  // ===================================================

  async function alterarStatus(
    restaurante: Restaurante,
    novoStatus: "aprovado" | "rejeitado"
  ) {
    if (processandoId !== null) return;

    setErro("");
    setMensagem("");

    if (restaurante.status !== "pendente") {
      setErro(
        "Esta solicitação já foi analisada."
      );
      return;
    }

    if (!verificarAdministrador()) return;

    const acao =
      novoStatus === "aprovado"
        ? "APROVAR"
        : "REJEITAR";

    const confirmou = window.confirm(
      `Deseja ${acao} a empresa "${restaurante.nomeEmpresa}"?\n\n` +
      "Esta ação altera o cadastro privado. " +
      "Ela não publica automaticamente o restaurante."
    );

    if (!confirmou) return;

    setProcessandoId(restaurante.id);

    try {
      await updateDoc(
        doc(
          db,
          "restaurantes",
          restaurante.id
        ),
        {
          status: novoStatus,

          analisadoEm:
            serverTimestamp(),

          analisadoPor:
            auth.currentUser!.uid,
        }
      );

      setMensagem(
        novoStatus === "aprovado"
          ? `Empresa "${restaurante.nomeEmpresa}" aprovada. Agora você pode preparar sua publicação.`
          : `Solicitação de "${restaurante.nomeEmpresa}" rejeitada.`
      );
    } catch (erroFirebase) {
      console.error(
        "Erro ao alterar status:",
        erroFirebase
      );

      setErro(obterErro(erroFirebase));
    } finally {
      setProcessandoId(null);
    }
  }

  // ===================================================
  // ABRIR FORMULÁRIO DE PUBLICAÇÃO
  // ===================================================

  function abrirPublicacao(
    restaurante: Restaurante
  ) {
    if (processandoId !== null) return;

    if (restaurante.status !== "aprovado") {
      setErro(
        "Apenas restaurantes aprovados podem ser publicados."
      );
      return;
    }

    const publicado = mapaPublicados.get(
      restaurante.id
    );

    let modalidade:
      ModalidadePublica | "" = "";

    if (
      publicado?.modalidadeEntrega ===
        "entrega_propria" ||
      publicado?.modalidadeEntrega ===
        "retirada_anfitriao"
    ) {
      modalidade =
        publicado.modalidadeEntrega;
    } else if (
      restaurante.modalidadeEntrega ===
      "entrega_propria"
    ) {
      modalidade = "entrega_propria";
    }

    setFormulario({
      categoria:
        CATEGORIAS.includes(
          publicado?.categoria as CategoriaPublica
        )
          ? publicado!.categoria as CategoriaPublica
          : "",

      descricao:
        publicado?.descricao ??
        restaurante.descricao,

      modalidadeEntrega: modalidade,

      whatsapp:
        publicado?.whatsapp ??
        restaurante.telefone,

      horarioFuncionamento: "",
    });

    setPublicacaoAberta(restaurante.id);

    setErro("");
    setMensagem("");
  }

  // ===================================================
  // PUBLICAR RESTAURANTE
  // ===================================================

  async function publicarRestaurante(
    restaurante: Restaurante
  ) {
    if (processandoId !== null) return;

    setErro("");
    setMensagem("");

    if (!verificarAdministrador()) return;

    if (restaurante.status !== "aprovado") {
      setErro(
        "A empresa precisa estar aprovada."
      );
      return;
    }

    const categoria =
      formulario.categoria;

    const descricao =
      formulario.descricao.trim();

    const modalidade =
      formulario.modalidadeEntrega;

    const whatsapp =
      somenteNumeros(
        formulario.whatsapp
      );

    const nome =
      restaurante.nomeEmpresa.trim();

    if (!CATEGORIAS.includes(
      categoria as CategoriaPublica
    )) {
      setErro(
        "Selecione a categoria do estabelecimento."
      );
      return;
    }

    if (!modalidade) {
      setErro(
        "Escolha a modalidade de atendimento."
      );
      return;
    }

    if (
      nome.length < 3 ||
      nome.length > 100
    ) {
      setErro(
        "O nome comercial deve ter de 3 a 100 caracteres."
      );
      return;
    }

    if (
      descricao.length > 1000
    ) {
      setErro(
        "A descrição pode ter até 1000 caracteres."
      );
      return;
    }

    if (
      whatsapp.length < 10 ||
      whatsapp.length > 13
    ) {
      setErro(
        "Informe um WhatsApp comercial válido, com DDD."
      );
      return;
    }

    const confirmou = window.confirm(
      `Publicar "${nome}" no Sabores da Chapada?\n\n` +
      "Apenas os dados comerciais definidos neste " +
      "formulário serão enviados à vitrine pública. " +
      "Os pratos serão publicados separadamente."
    );

    if (!confirmou) return;

    setProcessandoId(restaurante.id);

    try {
      const referenciaPrivada = doc(
        db,
        "restaurantes",
        restaurante.id
      );

      const referenciaPublica = doc(
        db,
        "catalogoPublico",
        restaurante.id
      );

      // Transação: conferimos novamente o cadastro
      // privado antes de criar a vitrine pública.

      await runTransaction(
        db,
        async (transacao) => {
          const cadastro = await transacao.get(
            referenciaPrivada
          );

          if (!cadastro.exists()) {
            throw new Error(
              "O cadastro do restaurante não foi encontrado."
            );
          }

          if (
            cadastro.data().status !==
            "aprovado"
          ) {
            throw new Error(
              "O restaurante deixou de estar aprovado. Publicação cancelada."
            );
          }

          // Permitimos somente dados comerciais.
          // Não copiamos o documento privado inteiro.

          transacao.set(
            referenciaPublica,
            {
              nome,
              categoria,
              descricao,
              modalidadeEntrega: modalidade,
              ativo: true,

              logo:
                typeof cadastro.data().logoUrl ===
                  "string"
                  ? cadastro.data().logoUrl
                  : "",

              // Não publicamos o endereço pessoal
              // do responsável ou outros dados
              // privados do cadastro.

              whatsapp,
              telefone: whatsapp,

              horarioFuncionamento:
                formulario.horarioFuncionamento.trim(),

              diasFuncionamento: [],
              formasPagamento: [],
            }
          );
        }
      );

      setPublicacaoAberta(null);

      setMensagem(
        `"${nome}" foi publicado em catalogoPublico. ` +
        "Agora precisamos publicar seus pratos aprovados."
      );
    } catch (erroFirebase) {
      console.error(
        "Erro ao publicar restaurante:",
        erroFirebase
      );

      setErro(obterErro(erroFirebase));
    } finally {
      setProcessandoId(null);
    }
  }

  // ===================================================
  // RETIRAR RESTAURANTE DO CATÁLOGO
  // ===================================================

  async function retirarPublicacao(
    restaurante: Restaurante
  ) {
    if (processandoId !== null) return;

    setErro("");
    setMensagem("");

    if (!verificarAdministrador()) return;

    const confirmou = window.confirm(
      `Retirar "${restaurante.nomeEmpresa}" do catálogo?\n\n` +
      "O restaurante e seus pratos públicos serão " +
      "excluídos da vitrine. O cadastro privado e " +
      "os pratos originais permanecerão no Firebase."
    );

    if (!confirmou) return;

    setProcessandoId(restaurante.id);

    try {
      const referenciaPublica = doc(
        db,
        "catalogoPublico",
        restaurante.id
      );

      const referenciaPratosPublicos = collection(
        db,
        "catalogoPublico",
        restaurante.id,
        "pratos"
      );

      const resultado = await getDocs(
        referenciaPratosPublicos
      );

      // Para manter a retirada atômica,
      // não efetuamos exclusões parciais
      // se o total ultrapassar o limite
      // desta operação em lote.

      if (resultado.size > 400) {
        throw new Error(
          "Este restaurante possui muitos pratos públicos. " +
          "A retirada precisa ser realizada por uma rotina " +
          "administrativa no servidor."
        );
      }

      const lote = writeBatch(db);

      resultado.docs.forEach((prato) => {
        lote.delete(prato.ref);
      });

      lote.delete(referenciaPublica);

      await lote.commit();

      setPublicacaoAberta(null);

      setMensagem(
        `"${restaurante.nomeEmpresa}" foi retirado do catálogo, ` +
        "junto com seus pratos públicos."
      );
    } catch (erroFirebase) {
      console.error(
        "Erro ao retirar publicação:",
        erroFirebase
      );

      setErro(obterErro(erroFirebase));
    } finally {
      setProcessandoId(null);
    }
  }

  // ===================================================
  // ESTILOS
  // ===================================================

  const classeInput =
    "mt-2 w-full rounded-xl border border-gray-200 " +
    "bg-white px-4 py-3 text-sm outline-none " +
    "focus:border-green-600 focus:ring-2 focus:ring-green-100";

  const classeFiltro =
    "rounded-full border px-4 py-2 text-sm font-bold transition";

  // ===================================================
  // INTERFACE
  // ===================================================

  return (
    <main className="min-h-screen bg-[#f8f6ef] text-[#19352b]">

      {/* ============================================= */}
      {/* CABEÇALHO                                     */}
      {/* ============================================= */}

      <header className="bg-[#101813] px-4 py-5 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">

          <div className="flex items-center gap-3">
            <img
              src="/logo-imperio.png"
              alt="Império Chalés"
              className="h-12 w-12 rounded-full object-contain"
            />

            <div>
              <h1 className="text-lg font-black">
                Império Chalés
              </h1>

              <p className="text-xs font-bold tracking-widest text-amber-300">
                RESTAURANTES PARCEIROS
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/pratos"
              className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm font-bold text-amber-300"
            >
              🍽️ Aprovar pratos
            </Link>

            <Link
              to="/admin/dashboard"
              className="rounded-xl border border-white/20 px-4 py-3 text-sm font-bold text-white"
            >
              ← Dashboard
            </Link>
          </div>

        </div>
      </header>

      {/* ============================================= */}
      {/* CONTEÚDO                                      */}
      {/* ============================================= */}

      <div className="mx-auto max-w-7xl px-4 py-10">

        <section className="flex flex-wrap items-center justify-between gap-5">

          <div>
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-amber-700">
              CENTRAL ADMINISTRATIVA
            </span>

            <h2 className="mt-3 text-3xl font-black md:text-4xl">
              Restaurantes parceiros
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-500">
              Analise solicitações, gerencie os estabelecimentos
              e escolha quais empresas serão publicadas
              no Sabores da Chapada.
            </p>
          </div>

          <Link
            to="/parceiro/cadastro"
            className="rounded-2xl border-b-4 border-amber-600 bg-amber-400 px-5 py-4 text-center text-sm font-black text-black shadow-md transition hover:bg-amber-300"
          >
            ➕ Abrir cadastro de parceiros
          </Link>

        </section>

        {/* =========================================== */}
        {/* AVISO                                         */}
        {/* =========================================== */}

        <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm leading-7 text-blue-900">

          <p className="font-black">
            🔗 Central conectada ao Firestore
          </p>

          <p className="mt-2">
            Os cadastros completos permanecem na coleção
            privada <strong>restaurantes</strong>.
            A publicação cria um documento separado em
            <strong> catalogoPublico</strong>, contendo
            somente os dados comerciais selecionados.
          </p>

          <p className="mt-2">
            ⚠️ Publicar a empresa não publica automaticamente
            seus pratos. Essa integração será realizada
            na central de aprovação de pratos.
          </p>

        </div>

        {/* =========================================== */}
        {/* MENSAGENS                                     */}
        {/* =========================================== */}

        {erro && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-300 bg-red-50 p-5 text-sm font-bold text-red-800"
          >
            ⚠️ {erro}
          </div>
        )}

        {mensagem && (
          <div
            role="status"
            className="mt-6 rounded-2xl border border-green-300 bg-green-50 p-5 text-sm font-bold text-green-800"
          >
            ✅ {mensagem}
          </div>
        )}

        {/* =========================================== */}
        {/* INDICADORES                                   */}
        {/* =========================================== */}

        <section className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-5">

          {[
            {
              titulo: "Total de cadastros",
              valor: total,
              icone: "🏪",
              cor: "text-[#19352b]",
            },
            {
              titulo: "Pendentes",
              valor: pendentes,
              icone: "⏳",
              cor: "text-amber-700",
            },
            {
              titulo: "Aprovados",
              valor: aprovados,
              icone: "✅",
              cor: "text-green-700",
            },
            {
              titulo: "Rejeitados",
              valor: rejeitados,
              icone: "❌",
              cor: "text-red-700",
            },
            {
              titulo: "Publicados",
              valor: totalPublicados,
              icone: "🌐",
              cor: "text-blue-700",
            },
          ].map((item) => (
            <article
              key={item.titulo}
              className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:p-6"
            >
              <span className="text-2xl">
                {item.icone}
              </span>

              <h3 className="mt-4 text-xs font-semibold text-gray-500">
                {item.titulo}
              </h3>

              <p
                className={`mt-3 text-3xl font-black ${item.cor}`}
              >
                {carregando ||
                (item.titulo === "Publicados" &&
                  carregandoPublicos)
                  ? "—"
                  : item.valor}
              </p>
            </article>
          ))}

        </section>

        {/* =========================================== */}
        {/* FILTROS                                       */}
        {/* =========================================== */}

        <section className="mt-12 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div>
              <h3 className="text-xl font-black">
                🔎 Localizar estabelecimentos
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Filtre por situação ou pesquise
                pelo nome e e-mail da empresa.
              </p>
            </div>

            <span className="rounded-full bg-[#f8f6ef] px-4 py-2 text-xs font-bold">
              {restaurantesFiltrados.length} resultado(s)
            </span>

          </div>

          <input
            type="search"
            value={busca}
            onChange={(event) =>
              setBusca(event.target.value)
            }
            placeholder="Nome da empresa, responsável ou e-mail..."
            className={classeInput}
          />

          <div className="mt-5 flex flex-wrap gap-2">

            {[
              {
                valor: "todos",
                titulo: `Todos (${total})`,
              },
              {
                valor: "pendente",
                titulo: `⏳ Pendentes (${pendentes})`,
              },
              {
                valor: "aprovado",
                titulo: `✅ Aprovados (${aprovados})`,
              },
              {
                valor: "rejeitado",
                titulo: `❌ Rejeitados (${rejeitados})`,
              },
            ].map((opcao) => (
              <button
                key={opcao.valor}
                type="button"
                onClick={() =>
                  setFiltro(
                    opcao.valor as FiltroRestaurante
                  )
                }
                aria-pressed={
                  filtro === opcao.valor
                }
                className={`${classeFiltro} ${
                  filtro === opcao.valor
                    ? "border-[#19352b] bg-[#19352b] text-white"
                    : "border-gray-200 bg-white hover:border-green-500"
                }`}
              >
                {opcao.titulo}
              </button>
            ))}

          </div>

        </section>

        {/* =========================================== */}
        {/* LISTA DE RESTAURANTES                         */}
        {/* =========================================== */}

        <section className="mt-12">

          <div className="mb-6">
            <h3 className="text-2xl font-black">
              Estabelecimentos cadastrados
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Dados consultados diretamente do Firebase.
            </p>
          </div>

          {carregando && (
            <div className="rounded-3xl bg-white p-12 text-center">
              ⏳ Consultando restaurantes...
            </div>
          )}

          {!carregando &&
            !erro &&
            restaurantesFiltrados.length === 0 && (
              <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center">

                <h4 className="text-xl font-black">
                  Nenhum restaurante encontrado
                </h4>

                <p className="mt-3 text-sm text-gray-500">
                  Ajuste os filtros ou aguarde
                  novos cadastros.
                </p>

              </div>
            )}

          {!carregando &&
            restaurantesFiltrados.length > 0 && (
              <div className="grid gap-6 lg:grid-cols-2">

                {restaurantesFiltrados.map(
                  (restaurante) => {
                    const publicado =
                      mapaPublicados.get(
                        restaurante.id
                      );

                    const estaPublicado =
                      publicado?.ativo === true;

                    const pendente =
                      restaurante.status ===
                      "pendente";

                    const processando =
                      processandoId ===
                      restaurante.id;

                    const detalhesVisiveis =
                      detalhesAbertos ===
                      restaurante.id;

                    const formularioAberto =
                      publicacaoAberta ===
                      restaurante.id;

                    return (
                      <article
                        key={restaurante.id}
                        className={`overflow-hidden rounded-3xl border-2 bg-white shadow-sm ${
                          pendente
                            ? "border-amber-300"
                            : restaurante.status ===
                                "aprovado"
                              ? "border-green-200"
                              : "border-red-200"
                        }`}
                      >

                        {/* CABEÇALHO */}

                        <div className="bg-gradient-to-r from-[#10251d] to-[#19352b] p-6 text-white">

                          <div className="flex items-start gap-4">

                            {restaurante.logoUrl ? (
                              <img
                                src={
                                  restaurante.logoUrl
                                }
                                alt={`Logo de ${restaurante.nomeEmpresa}`}
                                className="h-20 w-20 shrink-0 rounded-2xl bg-white p-2 object-contain"
                              />
                            ) : (
                              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-4xl">
                                🏪
                              </div>
                            )}

                            <div className="min-w-0 flex-1">

                              <div className="flex flex-wrap gap-2">

                                <span
                                  className={`rounded-full border px-3 py-1 text-xs font-black ${classeStatus(
                                    restaurante.status
                                  )}`}
                                >
                                  {formatarStatus(
                                    restaurante.status
                                  )}
                                </span>

                                {estaPublicado && (
                                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-900">
                                    🌐 Publicado
                                  </span>
                                )}

                              </div>

                              <h4 className="mt-3 break-words text-xl font-black">
                                {restaurante.nomeEmpresa}
                              </h4>

                              <p className="mt-2 break-all text-xs text-gray-300">
                                ID: {restaurante.id}
                              </p>

                            </div>

                          </div>

                        </div>

                        {/* CONTEÚDO */}

                        <div className="p-5 md:p-6">

                          <div className="space-y-4 text-sm">

                            <div>
                              <p className="text-xs font-bold uppercase text-gray-400">
                                Responsável
                              </p>

                              <p className="mt-1 font-semibold">
                                👤 {restaurante.nomeResponsavel}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-bold uppercase text-gray-400">
                                E-mail
                              </p>

                              <p className="mt-1 break-all font-semibold">
                                📧 {restaurante.email}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-bold uppercase text-gray-400">
                                WhatsApp cadastrado
                              </p>

                              <p className="mt-1 font-semibold">
                                📱 {restaurante.telefone}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-bold uppercase text-gray-400">
                                Atendimento
                              </p>

                              <p className="mt-1 font-semibold">
                                {formatarModalidade(
                                  restaurante.modalidadeEntrega
                                )}
                              </p>
                            </div>

                          </div>

                          {/* DATA */}

                          <div className="mt-6 rounded-2xl bg-[#f8f6ef] p-4">

                            <p className="text-xs font-bold uppercase text-gray-400">
                              Solicitação recebida em
                            </p>

                            <p className="mt-2 text-sm font-bold">
                              🗓️ {formatarData(
                                restaurante.criadoEm
                              )}
                            </p>

                          </div>

                          {/* DETALHES */}

                          <button
                            type="button"
                            onClick={() =>
                              setDetalhesAbertos(
                                detalhesVisiveis
                                  ? null
                                  : restaurante.id
                              )
                            }
                            aria-expanded={
                              detalhesVisiveis
                            }
                            className="mt-5 w-full rounded-xl border border-gray-200 px-5 py-4 text-sm font-bold"
                          >
                            {detalhesVisiveis
                              ? "▲ Ocultar dados completos"
                              : "▼ Ver dados completos"}
                          </button>

                          {detalhesVisiveis && (
                            <div className="mt-4 space-y-4 rounded-2xl bg-[#f8f6ef] p-5 text-sm">

                              <div>
                                <p className="font-bold">
                                  📍 Endereço cadastrado
                                </p>

                                <p className="mt-2 leading-6 text-gray-600">
                                  {restaurante.endereco},{" "}
                                  {restaurante.numero}

                                  {restaurante.complemento
                                    ? ` — ${restaurante.complemento}`
                                    : ""}

                                  <br />

                                  {restaurante.bairro}

                                  <br />

                                  {restaurante.cidade}

                                  <br />

                                  CEP: {restaurante.cep}
                                </p>
                              </div>

                              <div className="border-t pt-4">
                                <p className="font-bold">
                                  🪪 CPF/CNPJ
                                </p>

                                <p className="mt-2">
                                  {restaurante.documento ||
                                    "Não informado"}
                                </p>
                              </div>

                              <div className="border-t pt-4">
                                <p className="font-bold">
                                  📝 Descrição
                                </p>

                                <p className="mt-2 whitespace-pre-wrap">
                                  {restaurante.descricao ||
                                    "Não informada"}
                                </p>
                              </div>

                              <div className="border-t pt-4">
                                <p className="font-bold">
                                  🔐 UID
                                </p>

                                <p className="mt-2 break-all text-xs">
                                  {restaurante.uid}
                                </p>
                              </div>

                            </div>
                          )}

                          {/* ============================= */}
                          {/* APROVAR / REJEITAR             */}
                          {/* ============================= */}

                          {pendente && (
                            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">

                              <p className="font-black text-amber-900">
                                ⏳ Aguardando análise
                              </p>

                              <p className="mt-2 text-sm text-amber-800">
                                Confira o cadastro antes
                                de tomar uma decisão.
                              </p>

                              <div className="mt-5 grid gap-3 sm:grid-cols-2">

                                <button
                                  type="button"
                                  disabled={
                                    processandoId !== null
                                  }
                                  onClick={() =>
                                    alterarStatus(
                                      restaurante,
                                      "aprovado"
                                    )
                                  }
                                  className="rounded-xl bg-green-700 px-5 py-4 text-sm font-black text-white disabled:opacity-50"
                                >
                                  {processando
                                    ? "⏳ Processando..."
                                    : "✅ Aprovar empresa"}
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    processandoId !== null
                                  }
                                  onClick={() =>
                                    alterarStatus(
                                      restaurante,
                                      "rejeitado"
                                    )
                                  }
                                  className="rounded-xl border border-red-200 bg-white px-5 py-4 text-sm font-black text-red-700 disabled:opacity-50"
                                >
                                  ❌ Rejeitar
                                </button>

                              </div>

                            </div>
                          )}

                          {/* ============================= */}
                          {/* PUBLICAÇÃO                    */}
                          {/* ============================= */}

                          {restaurante.status ===
                            "aprovado" && (
                            <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">

                              <p className="font-black text-green-900">
                                ✅ Cadastro aprovado
                              </p>

                              <p className="mt-2 text-sm leading-6 text-green-800">
                                O parceiro pode acessar
                                as rotas protegidas.
                                A presença no catálogo
                                é controlada separadamente.
                              </p>

                              {estaPublicado ? (
                                <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm font-bold text-blue-900">
                                  🌐 Este restaurante possui
                                  um documento na vitrine pública.
                                </div>
                              ) : (
                                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
                                  ⏳ Ainda não publicado
                                  no catálogo dos hóspedes.
                                </div>
                              )}

                              <button
                                type="button"
                                disabled={
                                  processandoId !== null ||
                                  carregandoPublicos
                                }
                                onClick={() => {
                                  if (formularioAberto) {
                                    setPublicacaoAberta(
                                      null
                                    );
                                  } else {
                                    abrirPublicacao(
                                      restaurante
                                    );
                                  }
                                }}
                                className="mt-5 w-full rounded-xl bg-[#19352b] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
                              >
                                {formularioAberto
                                  ? "▲ Fechar publicação"
                                  : estaPublicado
                                    ? "✏️ Editar publicação"
                                    : "🌐 Preparar publicação"}
                              </button>

                              {/* FORMULÁRIO */}

                              {formularioAberto && (
                                <div className="mt-5 rounded-2xl border border-green-200 bg-white p-5">

                                  <h5 className="text-lg font-black">
                                    🌐 Dados comerciais públicos
                                  </h5>

                                  <p className="mt-2 text-sm leading-6 text-gray-600">
                                    Confira os dados que
                                    poderão aparecer
                                    para os hóspedes.
                                    Informações privadas,
                                    como CPF/CNPJ,
                                    responsável e comissão,
                                    não serão publicadas.
                                  </p>

                                  {/* NOME */}

                                  <div className="mt-5">
                                    <label className="text-sm font-bold">
                                      Nome comercial
                                    </label>

                                    <div className="mt-2 rounded-xl bg-[#f8f6ef] p-4 text-sm font-bold">
                                      {restaurante.nomeEmpresa}
                                    </div>
                                  </div>

                                  {/* CATEGORIA */}

                                  <div className="mt-5">

                                    <label
                                      htmlFor={`categoria-${restaurante.id}`}
                                      className="text-sm font-bold"
                                    >
                                      Categoria *
                                    </label>

                                    <select
                                      id={`categoria-${restaurante.id}`}
                                      value={
                                        formulario.categoria
                                      }
                                      onChange={(event) =>
                                        setFormulario(
                                          (anterior) => ({
                                            ...anterior,

                                            categoria:
                                              event.target.value as
                                                CategoriaPublica | "",
                                          })
                                        )
                                      }
                                      className={classeInput}
                                    >

                                      <option value="">
                                        Selecione a categoria
                                      </option>

                                      {CATEGORIAS.map(
                                        (categoria) => (
                                          <option
                                            key={categoria}
                                            value={categoria}
                                          >
                                            {categoria}
                                          </option>
                                        )
                                      )}

                                    </select>

                                  </div>

                                  {/* DESCRIÇÃO */}

                                  <div className="mt-5">

                                    <label
                                      htmlFor={`descricao-${restaurante.id}`}
                                      className="text-sm font-bold"
                                    >
                                      Descrição comercial
                                    </label>

                                    <textarea
                                      id={`descricao-${restaurante.id}`}
                                      rows={5}
                                      maxLength={1000}
                                      value={
                                        formulario.descricao
                                      }
                                      onChange={(event) =>
                                        setFormulario(
                                          (anterior) => ({
                                            ...anterior,

                                            descricao:
                                              event.target.value,
                                          })
                                        )
                                      }
                                      className={classeInput}
                                    />

                                    <p className="mt-2 text-xs text-gray-500">
                                      {formulario.descricao.length}/1000 caracteres
                                    </p>

                                  </div>

                                  {/* ENTREGA */}

                                  <div className="mt-5">

                                    <label
                                      htmlFor={`modalidade-${restaurante.id}`}
                                      className="text-sm font-bold"
                                    >
                                      Modalidade de atendimento *
                                    </label>

                                    <select
                                      id={`modalidade-${restaurante.id}`}
                                      value={
                                        formulario.modalidadeEntrega
                                      }
                                      onChange={(event) =>
                                        setFormulario(
                                          (anterior) => ({
                                            ...anterior,

                                            modalidadeEntrega:
                                              event.target.value as
                                                ModalidadePublica | "",
                                          })
                                        )
                                      }
                                      className={classeInput}
                                    >

                                      <option value="">
                                        Selecione a modalidade
                                      </option>

                                      <option value="entrega_propria">
                                        🚚 Entrega própria
                                      </option>

                                      <option value="retirada_anfitriao">
                                        🛍️ Retirada sob consulta
                                      </option>

                                    </select>

                                    <p className="mt-2 text-xs leading-5 text-amber-800">
                                      Modalidade original:
                                      {" "}
                                      {formatarModalidade(
                                        restaurante.modalidadeEntrega
                                      )}.
                                      Confira antes de selecionar.
                                    </p>

                                  </div>

                                  {/* WHATSAPP */}

                                  <div className="mt-5">

                                    <label
                                      htmlFor={`whatsapp-${restaurante.id}`}
                                      className="text-sm font-bold"
                                    >
                                      WhatsApp comercial *
                                    </label>

                                    <input
                                      id={`whatsapp-${restaurante.id}`}
                                      value={
                                        formulario.whatsapp
                                      }
                                      onChange={(event) =>
                                        setFormulario(
                                          (anterior) => ({
                                            ...anterior,

                                            whatsapp:
                                              event.target.value,
                                          })
                                        )
                                      }
                                      placeholder="5562999999999"
                                      className={classeInput}
                                    />

                                    <p className="mt-2 text-xs text-gray-500">
                                      Utilize o contato comercial
                                      autorizado pelo estabelecimento.
                                    </p>

                                  </div>

                                  {/* HORÁRIO */}

                                  <div className="mt-5">

                                    <label
                                      htmlFor={`horario-${restaurante.id}`}
                                      className="text-sm font-bold"
                                    >
                                      Horário de funcionamento
                                    </label>

                                    <input
                                      id={`horario-${restaurante.id}`}
                                      value={
                                        formulario.horarioFuncionamento
                                      }
                                      onChange={(event) =>
                                        setFormulario(
                                          (anterior) => ({
                                            ...anterior,

                                            horarioFuncionamento:
                                              event.target.value,
                                          })
                                        )
                                      }
                                      placeholder="Ex.: Das 11h às 22h"
                                      className={classeInput}
                                    />

                                    <p className="mt-2 text-xs text-gray-500">
                                      Informe apenas um horário
                                      confirmado pelo restaurante.
                                    </p>

                                  </div>

                                  {/* LOGO */}

                                  <div className="mt-5">

                                    <p className="text-sm font-bold">
                                      Logomarca
                                    </p>

                                    {restaurante.logoUrl ? (
                                      <img
                                        src={
                                          restaurante.logoUrl
                                        }
                                        alt={`Logo de ${restaurante.nomeEmpresa}`}
                                        className="mt-3 h-28 w-28 rounded-2xl border bg-white object-contain p-2"
                                      />
                                    ) : (
                                      <p className="mt-2 text-xs text-amber-800">
                                        Nenhuma logo cadastrada.
                                      </p>
                                    )}

                                  </div>

                                  <button
                                    type="button"
                                    disabled={
                                      processandoId !== null
                                    }
                                    onClick={() =>
                                      publicarRestaurante(
                                        restaurante
                                      )
                                    }
                                    className="mt-6 w-full rounded-xl bg-[#9af000] px-5 py-4 text-sm font-black uppercase text-[#19352b] disabled:opacity-50"
                                  >
                                    {processando
                                      ? "⏳ Salvando..."
                                      : estaPublicado
                                        ? "💾 Salvar alterações públicas"
                                        : "🌐 Publicar restaurante"}
                                  </button>

                                </div>
                              )}

                              {/* RETIRAR PUBLICAÇÃO */}

                              {estaPublicado && (
                                <button
                                  type="button"
                                  disabled={
                                    processandoId !== null
                                  }
                                  onClick={() =>
                                    retirarPublicacao(
                                      restaurante
                                    )
                                  }
                                  className="mt-4 w-full rounded-xl border border-red-200 bg-white px-5 py-4 text-sm font-black text-red-700 disabled:opacity-50"
                                >
                                  🗑️ Retirar restaurante do catálogo
                                </button>
                              )}

                            </div>
                          )}

                          {/* REJEITADO */}

                          {restaurante.status ===
                            "rejeitado" && (
                            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">

                              <p className="font-black text-red-800">
                                ❌ Solicitação rejeitada
                              </p>

                              <p className="mt-2 text-sm text-red-700">
                                O cadastro permanece no
                                Firestore para consulta
                                administrativa.
                              </p>

                            </div>
                          )}

                        </div>

                      </article>
                    );
                  }
                )}

              </div>
            )}

        </section>

      </div>

    </main>
  );
}

export default AdminRestaurantes;