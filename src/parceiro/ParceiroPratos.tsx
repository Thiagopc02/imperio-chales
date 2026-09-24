
import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import { Link, useNavigate } from "react-router-dom";

import {
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc,
  type Timestamp,
} from "firebase/firestore";

import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";

import { auth, db } from "../firebase/config";

// ==========================================
// TIPOS
// ==========================================

type StatusPrato =
  | "pendente"
  | "aprovado"
  | "rejeitado";

interface Prato {
  id: string;
  nome: string;
  preco: number;
  pessoas: number;
  descricao: string;
  status: StatusPrato;
  imagemUrl?: string;
  motivoRecusa?: string;
  criadoEm?: Timestamp;
  atualizadoEm?: Timestamp;
}

interface DadosFormulario {
  nome: string;
  preco: string;
  pessoas: string;
  descricao: string;
}

// ==========================================
// ESTADO INICIAL
// ==========================================

const formularioInicial: DadosFormulario = {
  nome: "",
  preco: "",
  pessoas: "",
  descricao: "",
};

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function converterPreco(valor: string): number {
  const texto = valor.trim();

  // Aceita:
  // 59
  // 59,90
  // 59.90
  // 1.259,90

  if (
    !/^\d+(?:,\d{1,2})?$/.test(texto) &&
    !/^\d+\.\d{1,2}$/.test(texto) &&
    !/^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(texto)
  ) {
    return NaN;
  }

  const normalizado = texto.includes(",")
    ? texto.replace(/\./g, "").replace(",", ".")
    : texto;

  return Number(normalizado);
}

function formatarData(data?: Timestamp): string {
  if (!data?.toDate) {
    return "Aguardando registro";
  }

  return data.toDate().toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function obterMensagemErro(erro: unknown): string {
  const codigo =
    typeof erro === "object" &&
    erro !== null &&
    "code" in erro
      ? String(erro.code)
      : "";

  if (codigo === "permission-denied") {
    return (
      "O Firebase não autorizou esta operação. " +
      "Confirme se o estabelecimento está aprovado " +
      "e se as regras do Firestore foram publicadas."
    );
  }

  if (codigo === "unavailable") {
    return (
      "Não foi possível conectar ao Firebase. " +
      "Verifique sua conexão e tente novamente."
    );
  }

  if (codigo === "unauthenticated") {
    return "Sua sessão expirou. Faça login novamente.";
  }

  return "Ocorreu um erro. Tente novamente.";
}

function informacoesStatus(status: StatusPrato) {
  switch (status) {
    case "aprovado":
      return {
        titulo: "Aprovado",
        icone: "✅",
        classe: "bg-green-100 text-green-800",
        explicacao:
          "Este prato foi aprovado pela administração.",
      };

    case "rejeitado":
      return {
        titulo: "Correção necessária",
        icone: "❌",
        classe: "bg-red-100 text-red-800",
        explicacao:
          "A administração solicitou alterações neste prato.",
      };

    default:
      return {
        titulo: "Aguardando aprovação",
        icone: "⏳",
        classe: "bg-amber-100 text-amber-900",
        explicacao:
          "Este prato aguarda a análise da administração.",
      };
  }
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export function ParceiroPratos() {
  const navigate = useNavigate();

  // ========================================
  // AUTENTICAÇÃO
  // ========================================

  const [usuario, setUsuario] = useState<User | null>(
    null
  );

  const [verificandoSessao, setVerificandoSessao] =
    useState(true);

  // ========================================
  // PRATOS DO FIRESTORE
  // ========================================

  const [pratos, setPratos] = useState<Prato[]>([]);

  const [carregandoPratos, setCarregandoPratos] =
    useState(true);

  // ========================================
  // FORMULÁRIO
  // ========================================

  const [formulario, setFormulario] =
    useState<DadosFormulario>(formularioInicial);

  const [editandoId, setEditandoId] = useState<
    string | null
  >(null);

  const [salvando, setSalvando] = useState(false);

  const [erro, setErro] = useState("");

  const [mensagem, setMensagem] = useState("");

  // ========================================
  // VERIFICAR AUTENTICAÇÃO
  // ========================================

  useEffect(() => {
    const cancelarAutenticacao = onAuthStateChanged(
      auth,
      (usuarioAtual) => {
        setUsuario(usuarioAtual);
        setVerificandoSessao(false);

        if (!usuarioAtual) {
          navigate("/parceiro/login", {
            replace: true,
          });
        }
      }
    );

    return () => cancelarAutenticacao();
  }, [navigate]);

  // ========================================
  // CONSULTAR PRATOS EM TEMPO REAL
  // ========================================

  useEffect(() => {
    if (!usuario) {
      setPratos([]);
      setCarregandoPratos(false);
      return;
    }

    setCarregandoPratos(true);

    const referenciaPratos = collection(
      db,
      "restaurantes",
      usuario.uid,
      "pratos"
    );

    const cancelarConsulta = onSnapshot(
      referenciaPratos,

      (resultado) => {
        const pratosEncontrados: Prato[] =
          resultado.docs.map((documento) => {
            const dados = documento.data();

            return {
              id: documento.id,

              nome:
                typeof dados.nome === "string"
                  ? dados.nome
                  : "",

              preco:
                typeof dados.preco === "number"
                  ? dados.preco
                  : 0,

              pessoas:
                typeof dados.pessoas === "number"
                  ? dados.pessoas
                  : 1,

              descricao:
                typeof dados.descricao === "string"
                  ? dados.descricao
                  : "",

              status:
                dados.status === "aprovado" ||
                dados.status === "rejeitado"
                  ? dados.status
                  : "pendente",

              imagemUrl:
                typeof dados.imagemUrl === "string"
                  ? dados.imagemUrl
                  : "",

              motivoRecusa:
                typeof dados.motivoRecusa === "string"
                  ? dados.motivoRecusa
                  : "",

              criadoEm: dados.criadoEm as
                | Timestamp
                | undefined,

              atualizadoEm: dados.atualizadoEm as
                | Timestamp
                | undefined,
            };
          });

        // Ordenação local para não exigir
        // índice adicional no Firestore.

        pratosEncontrados.sort((a, b) => {
          const dataA = a.criadoEm?.toMillis() ?? 0;
          const dataB = b.criadoEm?.toMillis() ?? 0;

          return dataB - dataA;
        });

        setPratos(pratosEncontrados);
        setCarregandoPratos(false);
      },

      (erroConsulta) => {
        console.error(
          "Erro ao consultar pratos:",
          erroConsulta
        );

        setErro(obterMensagemErro(erroConsulta));
        setCarregandoPratos(false);
      }
    );

    return () => cancelarConsulta();
  }, [usuario]);

  // ========================================
  // ATUALIZAR CAMPOS
  // ========================================

  function atualizarCampo(
    campo: keyof DadosFormulario,
    valor: string
  ) {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));

    setErro("");
    setMensagem("");
  }

  // ========================================
  // LIMPAR FORMULÁRIO
  // ========================================

  function limparFormulario() {
    setFormulario(formularioInicial);
    setEditandoId(null);
    setErro("");
  }

  // ========================================
  // SALVAR PRATO NO FIRESTORE
  // ========================================

  async function salvarPrato(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (salvando) return;

    setErro("");
    setMensagem("");

    const usuarioAtual = auth.currentUser;

    if (!usuarioAtual) {
      setErro(
        "Sua sessão não está disponível. Faça login novamente."
      );
      return;
    }

    const nomeLimpo = formulario.nome.trim();

    const descricaoLimpa =
      formulario.descricao.trim();

    const precoNumerico = converterPreco(
      formulario.preco
    );

    const pessoasNumerico = Number(
      formulario.pessoas
    );

    // ======================================
    // VALIDAÇÕES
    // ======================================

    if (
      nomeLimpo.length < 3 ||
      nomeLimpo.length > 120
    ) {
      setErro(
        "O nome do prato deve ter entre 3 e 120 caracteres."
      );
      return;
    }

    if (
      !Number.isFinite(precoNumerico) ||
      precoNumerico <= 0 ||
      precoNumerico > 100000
    ) {
      setErro(
        "Informe um preço válido maior que zero."
      );
      return;
    }

    if (
      !/^\d+$/.test(formulario.pessoas) ||
      !Number.isInteger(pessoasNumerico) ||
      pessoasNumerico < 1 ||
      pessoasNumerico > 100
    ) {
      setErro(
        "Informe um número inteiro entre 1 e 100 pessoas."
      );
      return;
    }

    if (
      descricaoLimpa.length < 10 ||
      descricaoLimpa.length > 1000
    ) {
      setErro(
        "A descrição deve ter entre 10 e 1000 caracteres."
      );
      return;
    }

    // ======================================
    // DADOS PERMITIDOS AO PARCEIRO
    // ======================================

    // Não enviamos:
    // imagemUrl
    // motivoRecusa
    // analisadoEm
    // analisadoPor
    //
    // Esses campos são administrados
    // exclusivamente pelo Império Chalés.

    const dadosPrato = {
      nome: nomeLimpo,
      preco: precoNumerico,
      pessoas: pessoasNumerico,
      descricao: descricaoLimpa,
      status: "pendente" as const,
    };

    setSalvando(true);

    try {
      if (editandoId) {
        // ==================================
        // ATUALIZAÇÃO
        // ==================================

        const referenciaPrato = doc(
          db,
          "restaurantes",
          usuarioAtual.uid,
          "pratos",
          editandoId
        );

        await updateDoc(referenciaPrato, {
          ...dadosPrato,
          atualizadoEm: serverTimestamp(),
        });

        setMensagem(
          "Prato atualizado e reenviado para análise! " +
          "A administração precisa aprovar novamente " +
          "as informações."
        );
      } else {
        // ==================================
        // NOVO PRATO
        // ==================================

        const referenciaPratos = collection(
          db,
          "restaurantes",
          usuarioAtual.uid,
          "pratos"
        );

        await addDoc(referenciaPratos, {
          ...dadosPrato,

          criadoEm: serverTimestamp(),

          atualizadoEm: serverTimestamp(),
        });

        setMensagem(
          "Prato enviado com sucesso! " +
          "Ele foi salvo no Firebase e está " +
          "aguardando aprovação da administração."
        );
      }

      limparFormulario();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (erroSalvar) {
      console.error(
        "Erro ao salvar o prato:",
        erroSalvar
      );

      setErro(obterMensagemErro(erroSalvar));
    } finally {
      setSalvando(false);
    }
  }

  // ========================================
  // EDITAR PRATO
  // ========================================

  function editarPrato(prato: Prato) {
    setEditandoId(prato.id);

    setFormulario({
      nome: prato.nome,

      preco: prato.preco
        .toFixed(2)
        .replace(".", ","),

      pessoas: String(prato.pessoas),

      descricao: prato.descricao,
    });

    setErro("");
    setMensagem("");

    document
      .getElementById("formulario-prato")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  // ========================================
  // CANCELAR EDIÇÃO
  // ========================================

  function cancelarEdicao() {
    limparFormulario();
    setMensagem("Edição cancelada.");
  }

  // ========================================
  // ESTATÍSTICAS
  // ========================================

  const totalPendentes = pratos.filter(
    (prato) => prato.status === "pendente"
  ).length;

  const totalAprovados = pratos.filter(
    (prato) => prato.status === "aprovado"
  ).length;

  const totalRejeitados = pratos.filter(
    (prato) => prato.status === "rejeitado"
  ).length;

  // ========================================
  // ESTILOS
  // ========================================

  const classeLabel =
    "block text-sm font-bold text-[#19352b]";

  const classeInput =
    "mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-[#19352b] outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100";

  // ========================================
  // TELA DE CARREGAMENTO
  // ========================================

  if (verificandoSessao) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f6ef] px-4">
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="text-4xl">🍽️</div>

          <p className="mt-4 font-bold text-[#19352b]">
            Verificando sua conta...
          </p>
        </div>
      </main>
    );
  }

  if (!usuario) {
    return null;
  }

  // ========================================
  // INTERFACE
  // ========================================

  return (
    <main className="min-h-screen bg-[#f8f6ef] text-[#19352b]">

      {/* ==================================== */}
      {/* CABEÇALHO                            */}
      {/* ==================================== */}

      <header className="bg-[#101813] px-4 py-5 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">

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
                MEUS PRATOS
              </p>
            </div>

          </div>

          <Link
            to="/parceiro/dashboard"
            className="rounded-xl border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
          >
            ← Voltar ao painel
          </Link>

        </div>
      </header>

      {/* ==================================== */}
      {/* CONTEÚDO                             */}
      {/* ==================================== */}

      <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">

        {/* ================================== */}
        {/* APRESENTAÇÃO                       */}
        {/* ================================== */}

        <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#10251d] via-[#143627] to-[#0e2019] p-6 text-white shadow-xl md:p-10">

          <span className="inline-flex rounded-full border border-lime-400/50 bg-lime-400/10 px-4 py-2 text-xs font-black tracking-wider text-lime-300">
            🍽️ CARDÁPIO DO ESTABELECIMENTO
          </span>

          <h2 className="mt-6 text-4xl font-black uppercase leading-tight md:text-6xl">
            MONTE SEU

            <span className="block text-lime-400">
              CARDÁPIO AQUI!
            </span>
          </h2>

          <p className="mt-5 max-w-3xl text-sm leading-7 text-gray-200 md:text-base">
            Cadastre seus pratos, informe os preços,
            descreva os ingredientes e indique
            quantas pessoas cada opção serve.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">

            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <span className="text-3xl">📝</span>

              <p className="mt-3 font-black">
                Descreva o prato
              </p>

              <p className="mt-2 text-xs leading-5 text-gray-200">
                Informe os ingredientes e acompanhamentos.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <span className="text-3xl">💰</span>

              <p className="mt-3 font-black">
                Defina o preço
              </p>

              <p className="mt-2 text-xs leading-5 text-gray-200">
                Cadastre o valor de venda do prato.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <span className="text-3xl">📷</span>

              <p className="mt-3 font-black">
                Imagem ilustrativa
              </p>

              <p className="mt-2 text-xs leading-5 text-gray-200">
                A equipe do Império preparará a imagem
                com base na descrição cadastrada.
              </p>
            </div>

          </div>

        </section>

        {/* ================================== */}
        {/* AVISO DE APROVAÇÃO                 */}
        {/* ================================== */}

        <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm leading-7 text-blue-900">
          🔗 <strong>Cadastro conectado ao Firebase.</strong>

          <p className="mt-2">
            Seus pratos são salvos no banco de dados,
            mas não aparecem automaticamente para
            os hóspedes. A equipe do Império Chalés
            revisará as informações, preparará
            a imagem ilustrativa e decidirá
            sobre a aprovação.
          </p>
        </div>

        {/* ================================== */}
        {/* MENSAGENS                          */}
        {/* ================================== */}

        {erro && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-800"
          >
            ⚠️ {erro}
          </div>
        )}

        {mensagem && (
          <div
            role="status"
            className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5 text-sm font-bold text-green-800"
          >
            ✅ {mensagem}
          </div>
        )}

        {/* ================================== */}
        {/* FORMULÁRIO                         */}
        {/* ================================== */}

        <section
          id="formulario-prato"
          className="mt-8 scroll-mt-6 overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-sm"
        >

          <div className="bg-[#19352b] px-6 py-6 text-white md:px-8">

            <h3 className="text-2xl font-black">
              {editandoId
                ? "✏️ Editar prato"
                : "➕ Adicionar novo prato"}
            </h3>

            <p className="mt-2 text-sm text-gray-200">
              {editandoId
                ? "Ao salvar as alterações, o prato voltará para análise."
                : "Preencha os dados para enviar o prato à administração."}
            </p>

          </div>

          <form
            onSubmit={salvarPrato}
            className="space-y-6 p-6 md:p-8"
          >

            {/* NOME */}

            <div>
              <label
                htmlFor="nomePrato"
                className={classeLabel}
              >
                Nome do prato *
              </label>

              <input
                id="nomePrato"
                required
                maxLength={120}
                value={formulario.nome}
                disabled={salvando}
                onChange={(event) =>
                  atualizarCampo(
                    "nome",
                    event.target.value
                  )
                }
                placeholder="Ex.: Frango caipira com arroz"
                className={classeInput}
              />
            </div>

            {/* PREÇO E PESSOAS */}

            <div className="grid gap-5 md:grid-cols-2">

              <div>
                <label
                  htmlFor="precoPrato"
                  className={classeLabel}
                >
                  💰 Preço do prato (R$) *
                </label>

                <input
                  id="precoPrato"
                  required
                  inputMode="decimal"
                  value={formulario.preco}
                  disabled={salvando}
                  onChange={(event) =>
                    atualizarCampo(
                      "preco",
                      event.target.value
                    )
                  }
                  placeholder="Ex.: 59,90"
                  className={classeInput}
                />

                <p className="mt-2 text-xs text-gray-500">
                  Informe o preço de venda.
                </p>
              </div>

              <div>
                <label
                  htmlFor="pessoasPrato"
                  className={classeLabel}
                >
                  👥 Serve quantas pessoas? *
                </label>

                <input
                  id="pessoasPrato"
                  required
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={100}
                  step={1}
                  value={formulario.pessoas}
                  disabled={salvando}
                  onChange={(event) =>
                    atualizarCampo(
                      "pessoas",
                      event.target.value
                    )
                  }
                  placeholder="Ex.: 2"
                  className={classeInput}
                />

                <p className="mt-2 text-xs text-gray-500">
                  Digite somente o número de pessoas.
                </p>
              </div>

            </div>

            {/* DESCRIÇÃO */}

            <div>
              <label
                htmlFor="descricaoPrato"
                className={classeLabel}
              >
                📋 Descrição do prato *
              </label>

              <textarea
                id="descricaoPrato"
                required
                maxLength={1000}
                rows={5}
                value={formulario.descricao}
                disabled={salvando}
                onChange={(event) =>
                  atualizarCampo(
                    "descricao",
                    event.target.value
                  )
                }
                placeholder="Descreva os ingredientes, acompanhamentos e detalhes do prato..."
                className={classeInput}
              />

              <div className="mt-2 flex justify-between gap-3 text-xs text-gray-500">

                <span>
                  Descreva o prato com detalhes.
                </span>

                <span>
                  {formulario.descricao.length}/1000
                </span>

              </div>
            </div>

            {/* IMAGEM */}

            <div className="rounded-2xl border border-dashed border-lime-300 bg-lime-50 p-5">

              <div className="flex items-start gap-4">

                <span className="text-3xl">
                  📷
                </span>

                <div>

                  <h4 className="font-black text-green-900">
                    Imagem do prato
                  </h4>

                  <p className="mt-2 text-sm leading-6 text-green-800">
                    Você não precisa enviar fotografias.
                    Nossa equipe preparará uma imagem
                    ilustrativa a partir da descrição
                    cadastrada e a adicionará ao catálogo
                    após a revisão.
                  </p>

                  <p className="mt-3 text-xs text-green-700">
                    A imagem será incluída manualmente
                    nos arquivos do site.
                  </p>

                </div>

              </div>

            </div>

            {/* BOTÕES */}

            <div className="flex flex-col gap-3 sm:flex-row">

              <button
                type="submit"
                disabled={salvando}
                className="flex-1 rounded-2xl border-b-4 border-lime-700 bg-lime-400 px-6 py-5 text-base font-black uppercase text-black shadow-lg transition hover:-translate-y-1 hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {salvando
                  ? "⏳ Salvando no Firebase..."
                  : editandoId
                    ? "✅ Salvar e reenviar para análise"
                    : "➕ Enviar prato para aprovação"}
              </button>

              {editandoId && (
                <button
                  type="button"
                  disabled={salvando}
                  onClick={cancelarEdicao}
                  className="rounded-2xl border border-gray-200 bg-white px-6 py-4 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancelar edição
                </button>
              )}

            </div>

          </form>

        </section>

        {/* ================================== */}
        {/* INDICADORES                        */}
        {/* ================================== */}

        <section className="mt-10 grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-bold text-amber-900">
              ⏳ Pendentes
            </p>

            <p className="mt-3 text-3xl font-black text-amber-800">
              {totalPendentes}
            </p>
          </div>

          <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
            <p className="text-sm font-bold text-green-900">
              ✅ Aprovados
            </p>

            <p className="mt-3 text-3xl font-black text-green-800">
              {totalAprovados}
            </p>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm font-bold text-red-900">
              ❌ Correção necessária
            </p>

            <p className="mt-3 text-3xl font-black text-red-800">
              {totalRejeitados}
            </p>
          </div>

        </section>

        {/* ================================== */}
        {/* LISTA DE PRATOS                    */}
        {/* ================================== */}

        <section className="mt-12">

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

            <div>

              <span className="text-xs font-black uppercase tracking-[0.3em] text-amber-700">
                ORGANIZAÇÃO DO CARDÁPIO
              </span>

              <h3 className="mt-3 text-3xl font-black">
                Meus pratos
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Os pratos desta lista são consultados
                diretamente no Firebase.
              </p>

            </div>

            <span className="rounded-full bg-lime-100 px-5 py-3 text-sm font-black text-green-900">
              🍽️ {pratos.length} prato(s)
            </span>

          </div>

          {/* CARREGAMENTO */}

          {carregandoPratos && (
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
              <div className="text-4xl">⏳</div>

              <p className="mt-4 font-bold">
                Carregando seus pratos...
              </p>
            </div>
          )}

          {/* LISTA VAZIA */}

          {!carregandoPratos && pratos.length === 0 && (
            <div className="rounded-[28px] border-2 border-dashed border-gray-200 bg-white p-8 text-center shadow-sm md:p-12">

              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-lime-100 text-4xl">
                🍽️
              </div>

              <h4 className="mt-6 text-2xl font-black">
                Seu cardápio começa aqui!
              </h4>

              <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-gray-500">
                Nenhum prato cadastrado neste
                estabelecimento. Preencha o formulário
                acima para enviar o primeiro prato
                à administração.
              </p>

              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById("formulario-prato")
                    ?.scrollIntoView({
                      behavior: "smooth",
                    })
                }
                className="mt-6 rounded-xl bg-[#19352b] px-6 py-4 text-sm font-black text-white transition hover:bg-[#28533e]"
              >
                ➕ Cadastrar meu primeiro prato
              </button>

            </div>
          )}

          {/* PRATOS CADASTRADOS */}

          {!carregandoPratos && pratos.length > 0 && (
            <div className="grid gap-5 md:grid-cols-2">

              {pratos.map((prato) => {
                const status = informacoesStatus(
                  prato.status
                );

                return (
                  <article
                    key={prato.id}
                    className="overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-sm"
                  >

                    {/* CABEÇALHO */}

                    <div className="bg-[#19352b] p-5 text-white">

                      <div className="flex items-start gap-4">

                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/10 text-4xl">

                          {prato.imagemUrl ? (
                            <img
                              src={prato.imagemUrl}
                              alt={`Imagem ilustrativa de ${prato.nome}`}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <span>🍽️</span>
                          )}

                        </div>

                        <div className="min-w-0 flex-1">

                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${status.classe}`}
                          >
                            {status.icone} {status.titulo}
                          </span>

                          <h4 className="mt-3 break-words text-xl font-black">
                            {prato.nome}
                          </h4>

                        </div>

                      </div>

                    </div>

                    {/* INFORMAÇÕES */}

                    <div className="p-5">

                      <div className="grid grid-cols-2 gap-3">

                        <div className="rounded-xl bg-lime-50 p-4">

                          <p className="text-xs text-green-800">
                            💰 Preço
                          </p>

                          <p className="mt-2 text-xl font-black text-green-900">
                            {formatarMoeda(prato.preco)}
                          </p>

                        </div>

                        <div className="rounded-xl bg-amber-50 p-4">

                          <p className="text-xs text-amber-900">
                            👥 Serve
                          </p>

                          <p className="mt-2 text-xl font-black text-amber-900">
                            {prato.pessoas}{" "}
                            {prato.pessoas === 1
                              ? "pessoa"
                              : "pessoas"}
                          </p>

                        </div>

                      </div>

                      {/* DESCRIÇÃO */}

                      <div className="mt-5">

                        <h5 className="text-sm font-black">
                          Descrição
                        </h5>

                        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-gray-600">
                          {prato.descricao}
                        </p>

                      </div>

                      {/* STATUS */}

                      <div className="mt-5 rounded-xl border border-gray-100 bg-[#f8f6ef] p-4">

                        <p className="text-sm font-black">
                          {status.icone} {status.titulo}
                        </p>

                        <p className="mt-2 text-xs leading-6 text-gray-600">
                          {status.explicacao}
                        </p>

                        {prato.status === "aprovado" && (
                          <p className="mt-2 text-xs font-bold text-green-800">
                            Aprovado pela administração.
                            A publicação pública será
                            ativada após a integração
                            com o catálogo.
                          </p>
                        )}

                      </div>

                      {/* MOTIVO DA RECUSA */}

                      {prato.status === "rejeitado" &&
                        prato.motivoRecusa && (
                          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">

                            <p className="text-sm font-black text-red-800">
                              ⚠️ O que precisa ser corrigido?
                            </p>

                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-red-900">
                              {prato.motivoRecusa}
                            </p>

                          </div>
                        )}

                      {/* IMAGEM */}

                      <div className="mt-5 rounded-xl border border-dashed border-gray-200 bg-[#f8f6ef] p-4 text-xs text-gray-600">

                        {prato.imagemUrl
                          ? "📷 Imagem ilustrativa adicionada pela administração."
                          : "📷 Imagem ilustrativa aguardando preparação pela equipe do Império Chalés."}

                      </div>

                      {/* DATA */}

                      <div className="mt-4 text-xs text-gray-400">
                        Cadastrado em:{" "}
                        {formatarData(prato.criadoEm)}
                      </div>

                      {/* AÇÕES */}

                      <div className="mt-6">

                        <button
                          type="button"
                          onClick={() =>
                            editarPrato(prato)
                          }
                          className="w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm font-black text-blue-800 transition hover:bg-blue-100"
                        >
                          {prato.status === "rejeitado"
                            ? "✏️ Corrigir e reenviar prato"
                            : "✏️ Editar prato"}
                        </button>

                        <p className="mt-3 text-center text-xs leading-5 text-gray-500">
                          Para solicitar a exclusão
                          deste prato, entre em contato
                          com a administração.
                        </p>

                      </div>

                    </div>

                  </article>
                );
              })}

            </div>
          )}

        </section>

        {/* ================================== */}
        {/* AVISO FINAL                        */}
        {/* ================================== */}

        <div className="mt-12 rounded-3xl bg-[#19352b] p-6 text-white md:p-8">

          <h3 className="text-2xl font-black">
            🚀 Seu cardápio está tomando forma!
          </h3>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-200">
            Seus pratos ficam registrados no Firebase.
            A administração revisará cada solicitação,
            preparará a imagem ilustrativa e poderá
            aprovar o prato ou solicitar correções.
          </p>

          <p className="mt-3 text-sm leading-7 text-gray-200">
            Os produtos ainda não são publicados
            automaticamente no catálogo dos hóspedes.
            Essa integração será realizada na
            próxima etapa.
          </p>

        </div>

      </div>

    </main>
  );
}

export default ParceiroPratos;