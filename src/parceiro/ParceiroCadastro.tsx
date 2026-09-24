import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import { Link } from "react-router-dom";

import {
  createUserWithEmailAndPassword,
  type User,
} from "firebase/auth";

import {
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { auth, db } from "../firebase/config";

// =====================================================
// TIPOS
// =====================================================

type ModalidadeEntrega =
  | ""
  | "entrega_propria"
  | "somente_retirada"
  | "ambas";

type EstadoEnvio =
  | "formulario"
  | "enviando"
  | "sucesso"
  | "conta_sem_cadastro";

interface DadosCadastro {
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
  modalidadeEntrega: ModalidadeEntrega;
  descricao: string;
  senha: string;
  confirmarSenha: string;
  aceitouTermos: boolean;
}

// =====================================================
// ESTADO INICIAL
// =====================================================

const dadosIniciais: DadosCadastro = {
  nomeEmpresa: "",
  nomeResponsavel: "",
  email: "",
  telefone: "",
  documento: "",
  cep: "",
  endereco: "",
  numero: "",
  bairro: "",
  cidade: "",
  complemento: "",
  modalidadeEntrega: "",
  descricao: "",
  senha: "",
  confirmarSenha: "",
  aceitouTermos: false,
};

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function somenteNumeros(valor: string): string {
  return valor.replace(/\D/g, "");
}

function formatarTelefone(valor: string): string {
  const numeros = somenteNumeros(valor).slice(0, 11);

  if (numeros.length <= 2) {
    return numeros.length > 0 ? `(${numeros}` : "";
  }

  if (numeros.length <= 6) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  }

  if (numeros.length <= 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(
      2,
      6
    )}-${numeros.slice(6)}`;
  }

  return `(${numeros.slice(0, 2)}) ${numeros.slice(
    2,
    7
  )}-${numeros.slice(7)}`;
}

function formatarCep(valor: string): string {
  const numeros = somenteNumeros(valor).slice(0, 8);

  if (numeros.length <= 5) {
    return numeros;
  }

  return `${numeros.slice(0, 5)}-${numeros.slice(5)}`;
}

function formatarDocumento(valor: string): string {
  return somenteNumeros(valor).slice(0, 14);
}

function mensagemErroFirebase(erro: unknown): string {
  const codigo =
    typeof erro === "object" &&
    erro !== null &&
    "code" in erro
      ? String(erro.code)
      : "";

  switch (codigo) {
    case "auth/email-already-in-use":
      return "Este e-mail já possui uma conta. Utilize a página de login.";

    case "auth/invalid-email":
      return "O e-mail informado é inválido.";

    case "auth/weak-password":
      return "A senha é considerada fraca pelo Firebase. Escolha uma senha mais forte.";

    case "auth/operation-not-allowed":
      return "O cadastro por e-mail e senha não está habilitado no Firebase Authentication.";

    case "auth/network-request-failed":
      return "Falha de conexão. Confira sua internet e tente novamente.";

    case "permission-denied":
    case "firestore/permission-denied":
      return "O Firestore não autorizou o cadastro. Precisamos conferir as regras de segurança e os campos enviados.";

    case "unavailable":
    case "firestore/unavailable":
      return "O Firestore está temporariamente indisponível.";

    default:
      return "Não foi possível concluir a operação. Confira a conexão e as configurações do Firebase.";
  }
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function ParceiroCadastro() {
  // ===================================================
  // ESTADOS DO FORMULÁRIO
  // ===================================================

  const [dados, setDados] =
    useState<DadosCadastro>(dadosIniciais);

  const [mostrarSenha, setMostrarSenha] =
    useState(false);

  const [mostrarConfirmacao, setMostrarConfirmacao] =
    useState(false);

  const [logoArquivo, setLogoArquivo] =
    useState<File | null>(null);

  const [logoPreview, setLogoPreview] =
    useState<string | null>(null);

  const [erro, setErro] = useState("");

  const [estadoEnvio, setEstadoEnvio] =
    useState<EstadoEnvio>("formulario");

  const [emailCadastrado, setEmailCadastrado] =
    useState("");

  const [empresaCadastrada, setEmpresaCadastrada] =
    useState("");

  const [uidCriado, setUidCriado] =
    useState("");

  // ===================================================
  // LIMPEZA DA PRÉVIA DA LOGOMARCA
  // ===================================================

  useEffect(() => {
    return () => {
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  // ===================================================
  // ATUALIZAR CAMPOS
  // ===================================================

  function atualizarCampo(
    campo: keyof DadosCadastro,
    valor: string | boolean
  ) {
    setDados((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));

    setErro("");
  }

  // ===================================================
  // SELECIONAR LOGOMARCA
  // ===================================================

  function selecionarLogo(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const arquivo = event.target.files?.[0];

    if (!arquivo) return;

    const tiposPermitidos = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!tiposPermitidos.includes(arquivo.type)) {
      setErro(
        "A logomarca deve estar no formato JPG, PNG ou WEBP."
      );

      event.target.value = "";
      return;
    }

    if (arquivo.size > 2 * 1024 * 1024) {
      setErro(
        "A logomarca deve ter no máximo 2 MB."
      );

      event.target.value = "";
      return;
    }

    setLogoArquivo(arquivo);
    setLogoPreview(URL.createObjectURL(arquivo));
    setErro("");
  }

  function removerLogo() {
    setLogoArquivo(null);
    setLogoPreview(null);

    const input = document.getElementById(
      "logo"
    ) as HTMLInputElement | null;

    if (input) {
      input.value = "";
    }
  }

  // ===================================================
  // VALIDAÇÃO
  // ===================================================

  function validarDados(): string | null {
    if (dados.nomeEmpresa.trim().length < 3) {
      return "Informe o nome completo do estabelecimento.";
    }

    if (dados.nomeResponsavel.trim().length < 3) {
      return "Informe o nome do responsável pela empresa.";
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        dados.email.trim()
      )
    ) {
      return "Informe um e-mail válido.";
    }

    if (
      ![10, 11].includes(
        somenteNumeros(dados.telefone).length
      )
    ) {
      return "Informe um WhatsApp válido com DDD.";
    }

    if (
      dados.documento &&
      ![11, 14].includes(
        somenteNumeros(dados.documento).length
      )
    ) {
      return "O CPF deve ter 11 números ou o CNPJ deve ter 14 números.";
    }

    if (somenteNumeros(dados.cep).length !== 8) {
      return "Informe um CEP com 8 números.";
    }

    if (
      !dados.endereco.trim() ||
      !dados.numero.trim() ||
      !dados.bairro.trim() ||
      !dados.cidade.trim()
    ) {
      return "Preencha o endereço completo do estabelecimento.";
    }

    if (!dados.modalidadeEntrega) {
      return "Selecione a modalidade de entrega.";
    }

    if (dados.senha.length < 8) {
      return "A senha deve ter pelo menos 8 caracteres.";
    }

    if (dados.senha !== dados.confirmarSenha) {
      return "As senhas não coincidem.";
    }

    if (!dados.aceitouTermos) {
      return "Confirme as informações e a solicitação de parceria.";
    }

    return null;
  }

  // ===================================================
  // GRAVAR EMPRESA NO FIRESTORE
  // ===================================================

  async function salvarEmpresa(usuario: User) {
    const restauranteRef = doc(
      db,
      "restaurantes",
      usuario.uid
    );

    /*
      O documento utiliza o UID do responsável.

      O status inicial é sempre "pendente".

      A senha não é armazenada no Firestore.

      O envio da logomarca para o Storage
      será implementado separadamente.
    */

    await setDoc(restauranteRef, {
      uid: usuario.uid,

      nomeEmpresa: dados.nomeEmpresa.trim(),

      nomeResponsavel: dados.nomeResponsavel.trim(),

      email:
        usuario.email ??
        dados.email.trim().toLowerCase(),

      telefone: dados.telefone.trim(),

      documento: somenteNumeros(dados.documento),

      cep: somenteNumeros(dados.cep),

      endereco: dados.endereco.trim(),

      numero: dados.numero.trim(),

      bairro: dados.bairro.trim(),

      cidade: dados.cidade.trim(),

      complemento: dados.complemento.trim(),

      modalidadeEntrega: dados.modalidadeEntrega,

      descricao: dados.descricao.trim(),

      logoUrl: "",

      status: "pendente",

      criadoEm: serverTimestamp(),
    });
  }

  // ===================================================
  // CRIAR CONTA E ENVIAR CADASTRO
  // ===================================================

  async function cadastrarEmpresa(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      estadoEnvio === "enviando" ||
      estadoEnvio === "sucesso" ||
      estadoEnvio === "conta_sem_cadastro"
    ) {
      return;
    }

    setErro("");

    const erroValidacao = validarDados();

    if (erroValidacao) {
      setErro(erroValidacao);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    /*
      Não criamos outra conta enquanto
      existe uma sessão ativa no Firebase.
    */

    if (auth.currentUser) {
      setErro(
        "Já existe uma conta conectada neste navegador. Para cadastrar outra empresa, saia da conta atual ou utilize uma janela anônima sem nenhuma sessão aberta."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    setEstadoEnvio("enviando");

    let contaCriada: User | null = null;

    try {
      // 1. CRIAR USUÁRIO NO AUTHENTICATION

      const credencial =
        await createUserWithEmailAndPassword(
          auth,
          dados.email.trim().toLowerCase(),
          dados.senha
        );

      contaCriada = credencial.user;

      setUidCriado(contaCriada.uid);

      // 2. GRAVAR EMPRESA NO FIRESTORE

      await salvarEmpresa(contaCriada);

      // 3. GUARDAR DADOS PARA A TELA DE CONFIRMAÇÃO

      setEmpresaCadastrada(
        dados.nomeEmpresa.trim()
      );

      setEmailCadastrado(
        contaCriada.email ??
        dados.email.trim().toLowerCase()
      );

      // 4. LIMPAR A SENHA DO ESTADO

      setDados((anterior) => ({
        ...anterior,
        senha: "",
        confirmarSenha: "",
      }));

      // 5. EXIBIR CONFIRMAÇÃO

      setEstadoEnvio("sucesso");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (erroFirebase) {
      /*
        Se o Authentication criar o usuário,
        mas a gravação no Firestore falhar,
        não tentaremos criar a mesma conta
        novamente automaticamente.
      */

      if (contaCriada) {
        setEstadoEnvio("conta_sem_cadastro");

        setEmailCadastrado(
          contaCriada.email ??
          dados.email.trim().toLowerCase()
        );

        setErro(
          "A conta de acesso foi criada, mas não conseguimos confirmar o registro da empresa no Firestore. Não tente criar outra conta com o mesmo e-mail. Detalhe: " +
            mensagemErroFirebase(erroFirebase)
        );
      } else {
        setEstadoEnvio("formulario");

        setErro(
          mensagemErroFirebase(erroFirebase)
        );
      }

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }

  // ===================================================
  // ESTILOS
  // ===================================================

  const classeInput =
    "mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-[#19352b] outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-gray-100";

  const classeLabel =
    "block text-sm font-bold text-[#19352b]";

  const enviando =
    estadoEnvio === "enviando";

  // ===================================================
  // INTERFACE PRINCIPAL
  // ===================================================

  return (
    <main className="min-h-screen bg-[#f8f6ef] text-[#19352b]">

      {/* ============================================= */}
      {/* CABEÇALHO                                     */}
      {/* ============================================= */}

      <header className="bg-[#101813] px-4 py-5 text-white">

        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">

          {/* IDENTIDADE DO PORTAL */}

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

          {/* ========================================= */}
          {/* BOTÕES DO CABEÇALHO                       */}
          {/* ========================================= */}

          <nav
            aria-label="Navegação do parceiro"
            className="flex w-full flex-wrap items-center gap-3 sm:w-auto"
          >

            {/* FAZER LOGIN */}

            <Link
              to="/parceiro/login"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-b-4 border-amber-700 bg-gradient-to-b from-yellow-200 via-amber-400 to-yellow-500 px-5 py-3 text-center text-sm font-black uppercase text-black shadow-[0_5px_15px_rgba(251,191,36,0.25)] transition hover:-translate-y-0.5 hover:brightness-105 sm:flex-none"
            >
              🔐 FAZER LOGIN →
            </Link>

            {/* VOLTAR AO CARDÁPIO */}

            <Link
              to="/cardapio"
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/20 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-white/10 sm:flex-none"
            >
              ← Voltar ao cardápio
            </Link>

          </nav>

        </div>

      </header>

      {/* ============================================= */}
      {/* CONTEÚDO                                      */}
      {/* ============================================= */}

      <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">

        {/* =========================================== */}
        {/* APRESENTAÇÃO                                */}
        {/* =========================================== */}

        <section className="relative mb-8 overflow-hidden rounded-[32px] bg-gradient-to-br from-[#10251d] via-[#143627] to-[#0e2019] p-6 text-white shadow-xl md:p-10">

          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />

          <div className="relative">

            <span className="inline-flex rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-xs font-extrabold tracking-wider text-amber-300">
              🏪 SEJA UM PARCEIRO
            </span>

            <h2 className="mt-6 text-3xl font-black uppercase leading-tight md:text-5xl">
              CADASTRE SUA

              <span className="block text-amber-400">
                EMPRESA AQUI!
              </span>
            </h2>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-gray-200 md:text-base">
              Faça parte do Sabores da Chapada.
              Preencha os dados do seu estabelecimento
              para solicitar uma parceria com o
              Império Chalés.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">

              {[
                {
                  icone: "📝",
                  titulo: "Cadastro",
                },
                {
                  icone: "🔎",
                  titulo: "Análise",
                },
                {
                  icone: "✅",
                  titulo: "Aprovação",
                },
              ].map((item, indice) => (

                <div
                  key={item.titulo}
                  className="rounded-2xl border border-white/10 bg-white/10 p-4"
                >

                  <span className="text-2xl">
                    {item.icone}
                  </span>

                  <p className="mt-3 text-xs font-bold text-amber-300">
                    PASSO {indice + 1}
                  </p>

                  <p className="mt-1 font-extrabold">
                    {item.titulo}
                  </p>

                </div>

              ))}

            </div>

          </div>

        </section>

        {/* =========================================== */}
        {/* CADASTRO CONCLUÍDO                          */}
        {/* =========================================== */}

        {estadoEnvio === "sucesso" && (

          <section
            role="status"
            className="overflow-hidden rounded-[28px] border border-green-300 bg-white shadow-lg"
          >

            <div className="bg-gradient-to-r from-[#10251d] to-[#19352b] p-6 text-white md:p-8">

              <span className="inline-flex rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-xs font-black text-amber-300">
                ✅ CADASTRO RECEBIDO
              </span>

              <h3 className="mt-5 text-3xl font-black md:text-4xl">
                Sua empresa já está cadastrada!
              </h3>

              <p className="mt-3 text-sm leading-7 text-gray-200">
                Agora precisamos analisar as informações
                antes de liberar o acesso ao estabelecimento.
              </p>

            </div>

            <div className="p-6 md:p-8">

              {/* STATUS */}

              <div className="rounded-3xl border-2 border-amber-300 bg-amber-50 p-6 text-center md:p-8">

                <span className="text-5xl">
                  ⏳
                </span>

                <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-amber-700">
                  SITUAÇÃO DA EMPRESA
                </p>

                <h4 className="mt-3 text-3xl font-black uppercase text-amber-800 md:text-4xl">
                  SOLICITAÇÃO PENDENTE!
                </h4>

                <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-amber-900">
                  O Império Chalés recebeu sua solicitação.
                  Aguarde a análise e a aprovação da
                  administração antes de começar a
                  atender pedidos.
                </p>

              </div>

              {/* DADOS DA EMPRESA */}

              <div className="mt-6 space-y-3 rounded-2xl bg-[#f8f6ef] p-5">

                <p className="text-sm">
                  <strong>🏪 Empresa:</strong>{" "}
                  {empresaCadastrada}
                </p>

                <p className="break-all text-sm">
                  <strong>📧 E-mail de acesso:</strong>{" "}
                  {emailCadastrado}
                </p>

                <p className="text-sm">
                  <strong>📋 Situação:</strong>{" "}

                  <span className="font-black text-amber-700">
                    Pendente de aprovação
                  </span>
                </p>

              </div>

              {/* PRÓXIMOS PASSOS */}

              <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">

                <h4 className="text-lg font-black text-blue-900">
                  🔎 O que acontece agora?
                </h4>

                <p className="mt-3 text-sm leading-7 text-blue-900">
                  Nossa administração irá conferir os
                  dados do estabelecimento.

                  Você poderá acompanhar a situação
                  em uma página exclusiva.

                  Se a aprovação ocorrer enquanto
                  sua conta estiver conectada,
                  o portal poderá identificar
                  a alteração automaticamente.
                </p>

                <p className="mt-3 text-sm font-semibold leading-6 text-blue-900">
                  Não é necessário realizar outro cadastro.
                </p>

              </div>

              {/* ACOMPANHAMENTO */}

              <Link
                to="/parceiro/solicitacao"
                className="mt-7 flex w-full items-center justify-center rounded-2xl border-b-[5px] border-amber-700 bg-gradient-to-b from-yellow-200 via-amber-400 to-yellow-500 px-6 py-5 text-center text-sm font-black uppercase text-black shadow-lg transition hover:-translate-y-0.5 hover:brightness-105 md:text-base"
              >
                ⏳ ACOMPANHAR MINHA SOLICITAÇÃO →
              </Link>

              <p className="mt-4 text-center text-xs leading-5 text-gray-500">
                🔒 O acesso aos pedidos só será liberado
                após a aprovação administrativa.
              </p>

            </div>

          </section>

        )}

        {/* =========================================== */}
        {/* CONTA CRIADA, MAS CADASTRO NÃO CONFIRMADO   */}
        {/* =========================================== */}

        {estadoEnvio === "conta_sem_cadastro" && (

          <section
            role="alert"
            className="rounded-[28px] border border-red-300 bg-red-50 p-6 md:p-8"
          >

            <h3 className="text-2xl font-black text-red-800">
              ⚠️ Precisamos verificar seu cadastro
            </h3>

            <p className="mt-4 text-sm leading-7 text-red-900">
              Sua conta de acesso foi criada, mas
              o registro da empresa não foi confirmado
              no banco de dados.
            </p>

            <p className="mt-3 text-sm leading-7 text-red-900">
              Não tente realizar outro cadastro com
              o mesmo e-mail.

              Informe a situação à administração
              para que ela possa conferir o registro.
            </p>

            <div className="mt-5 rounded-xl bg-white p-4 text-sm">

              <p className="break-all">
                <strong>E-mail:</strong>{" "}
                {emailCadastrado}
              </p>

              {uidCriado && (
                <p className="mt-2 break-all">
                  <strong>Identificador da conta:</strong>{" "}
                  {uidCriado}
                </p>
              )}

            </div>

            {erro && (
              <p className="mt-4 text-sm leading-6 text-red-800">
                {erro}
              </p>
            )}

            <Link
              to="/cardapio"
              className="mt-6 inline-flex rounded-xl bg-[#19352b] px-5 py-3 text-sm font-bold text-white"
            >
              ← Voltar ao cardápio
            </Link>

          </section>

        )}

        {/* =========================================== */}
        {/* FORMULÁRIO DE CADASTRO                      */}
        {/* =========================================== */}

        {(estadoEnvio === "formulario" ||
          estadoEnvio === "enviando") && (

          <>

            {/* ERROS */}

            {erro && (

              <div
                role="alert"
                className="mb-8 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-800"
              >
                ⚠️ {erro}
              </div>

            )}

            <form
              onSubmit={cadastrarEmpresa}
              className="space-y-7"
            >

              {/* ===================================== */}
              {/* DADOS DO ESTABELECIMENTO              */}
              {/* ===================================== */}

              <section className="overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-sm">

                <div className="bg-[#19352b] px-6 py-5 text-white md:px-8">

                  <h3 className="text-xl font-black">
                    🏪 Dados do estabelecimento
                  </h3>

                  <p className="mt-2 text-sm text-gray-200">
                    Informe os dados principais da empresa.
                  </p>

                </div>

                <div className="grid gap-5 p-6 md:grid-cols-2 md:p-8">

                  {/* NOME DA EMPRESA */}

                  <div className="md:col-span-2">

                    <label
                      htmlFor="nomeEmpresa"
                      className={classeLabel}
                    >
                      Nome do estabelecimento *
                    </label>

                    <input
                      id="nomeEmpresa"
                      required
                      maxLength={100}
                      disabled={enviando}
                      value={dados.nomeEmpresa}
                      onChange={(event) =>
                        atualizarCampo(
                          "nomeEmpresa",
                          event.target.value
                        )
                      }
                      placeholder="Ex.: Restaurante da Chapada"
                      className={classeInput}
                    />

                  </div>

                  {/* RESPONSÁVEL */}

                  <div>

                    <label
                      htmlFor="nomeResponsavel"
                      className={classeLabel}
                    >
                      Nome do responsável *
                    </label>

                    <input
                      id="nomeResponsavel"
                      required
                      maxLength={100}
                      disabled={enviando}
                      value={dados.nomeResponsavel}
                      onChange={(event) =>
                        atualizarCampo(
                          "nomeResponsavel",
                          event.target.value
                        )
                      }
                      placeholder="Nome completo"
                      className={classeInput}
                    />

                  </div>

                  {/* WHATSAPP */}

                  <div>

                    <label
                      htmlFor="telefone"
                      className={classeLabel}
                    >
                      WhatsApp comercial *
                    </label>

                    <input
                      id="telefone"
                      required
                      type="tel"
                      inputMode="tel"
                      disabled={enviando}
                      value={dados.telefone}
                      onChange={(event) =>
                        atualizarCampo(
                          "telefone",
                          formatarTelefone(
                            event.target.value
                          )
                        )
                      }
                      placeholder="(62) 99999-9999"
                      className={classeInput}
                    />

                  </div>

                  {/* E-MAIL */}

                  <div>

                    <label
                      htmlFor="email"
                      className={classeLabel}
                    >
                      E-mail de acesso *
                    </label>

                    <input
                      id="email"
                      required
                      type="email"
                      maxLength={150}
                      autoComplete="email"
                      disabled={enviando}
                      value={dados.email}
                      onChange={(event) =>
                        atualizarCampo(
                          "email",
                          event.target.value
                        )
                      }
                      placeholder="contato@restaurante.com.br"
                      className={classeInput}
                    />

                  </div>

                  {/* DOCUMENTO */}

                  <div>

                    <label
                      htmlFor="documento"
                      className={classeLabel}
                    >
                      CPF ou CNPJ
                    </label>

                    <input
                      id="documento"
                      inputMode="numeric"
                      disabled={enviando}
                      value={dados.documento}
                      onChange={(event) =>
                        atualizarCampo(
                          "documento",
                          formatarDocumento(
                            event.target.value
                          )
                        )
                      }
                      placeholder="Somente números"
                      className={classeInput}
                    />

                    <p className="mt-2 text-xs text-gray-400">
                      O documento será conferido durante
                      a análise.
                    </p>

                  </div>

                  {/* LOGOMARCA */}

                  <div className="md:col-span-2">

                    <label className={classeLabel}>
                      Logomarca da empresa
                    </label>

                    <div className="mt-3 flex flex-col gap-5 rounded-2xl border-2 border-dashed border-gray-200 bg-[#f8f6ef] p-5 sm:flex-row sm:items-center">

                      <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm">

                        {logoPreview ? (

                          <img
                            src={logoPreview}
                            alt="Prévia da logomarca"
                            className="h-full w-full object-contain p-2"
                          />

                        ) : (

                          <div className="text-center">

                            <span className="text-4xl">
                              🖼️
                            </span>

                            <p className="mt-1 text-xs text-gray-400">
                              Sem logo
                            </p>

                          </div>

                        )}

                      </div>

                      <div className="flex-1">

                        <label
                          htmlFor="logo"
                          className="inline-flex cursor-pointer rounded-xl bg-[#19352b] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#28533e]"
                        >
                          📷 Selecionar logomarca
                        </label>

                        <input
                          id="logo"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          disabled={enviando}
                          onChange={selecionarLogo}
                          className="sr-only"
                        />

                        <p className="mt-3 text-xs leading-5 text-gray-500">
                          JPG, PNG ou WEBP. Máximo de 2 MB.
                        </p>

                        <p className="mt-2 text-xs leading-5 text-amber-700">
                          ⚠️ A imagem será apenas visualizada
                          nesta etapa.

                          O envio da logomarca será ativado
                          após configurarmos o Firebase Storage.
                        </p>

                        {logoArquivo && (

                          <div className="mt-3 flex flex-wrap items-center gap-3">

                            <span className="break-all text-xs font-semibold text-green-700">
                              ✅ {logoArquivo.name}
                            </span>

                            <button
                              type="button"
                              disabled={enviando}
                              onClick={removerLogo}
                              className="text-xs font-bold text-red-600 underline"
                            >
                              Remover
                            </button>

                          </div>

                        )}

                      </div>

                    </div>

                  </div>

                </div>

              </section>

              {/* ===================================== */}
              {/* ENDEREÇO                              */}
              {/* ===================================== */}

              <section className="overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-sm">

                <div className="bg-[#19352b] px-6 py-5 text-white md:px-8">

                  <h3 className="text-xl font-black">
                    📍 Endereço do estabelecimento
                  </h3>

                  <p className="mt-2 text-sm text-gray-200">
                    Precisamos localizar corretamente sua empresa.
                  </p>

                </div>

                <div className="grid gap-5 p-6 md:grid-cols-2 md:p-8">

                  {/* CEP */}

                  <div>

                    <label
                      htmlFor="cep"
                      className={classeLabel}
                    >
                      CEP *
                    </label>

                    <input
                      id="cep"
                      required
                      inputMode="numeric"
                      disabled={enviando}
                      value={dados.cep}
                      onChange={(event) =>
                        atualizarCampo(
                          "cep",
                          formatarCep(event.target.value)
                        )
                      }
                      placeholder="00000-000"
                      className={classeInput}
                    />

                    <p className="mt-2 text-xs text-gray-400">
                      Digite o CEP manualmente.
                      A consulta automática será adicionada posteriormente.
                    </p>

                  </div>

                  {/* CIDADE */}

                  <div>

                    <label
                      htmlFor="cidade"
                      className={classeLabel}
                    >
                      Cidade *
                    </label>

                    <input
                      id="cidade"
                      required
                      maxLength={100}
                      disabled={enviando}
                      value={dados.cidade}
                      onChange={(event) =>
                        atualizarCampo(
                          "cidade",
                          event.target.value
                        )
                      }
                      placeholder="Ex.: Alto Paraíso de Goiás"
                      className={classeInput}
                    />

                  </div>

                  {/* RUA */}

                  <div>

                    <label
                      htmlFor="endereco"
                      className={classeLabel}
                    >
                      Rua ou avenida *
                    </label>

                    <input
                      id="endereco"
                      required
                      maxLength={150}
                      disabled={enviando}
                      value={dados.endereco}
                      onChange={(event) =>
                        atualizarCampo(
                          "endereco",
                          event.target.value
                        )
                      }
                      placeholder="Nome da rua"
                      className={classeInput}
                    />

                  </div>

                  {/* NÚMERO */}

                  <div>

                    <label
                      htmlFor="numero"
                      className={classeLabel}
                    >
                      Número *
                    </label>

                    <input
                      id="numero"
                      required
                      maxLength={20}
                      disabled={enviando}
                      value={dados.numero}
                      onChange={(event) =>
                        atualizarCampo(
                          "numero",
                          event.target.value
                        )
                      }
                      placeholder="Número ou S/N"
                      className={classeInput}
                    />

                  </div>

                  {/* BAIRRO */}

                  <div>

                    <label
                      htmlFor="bairro"
                      className={classeLabel}
                    >
                      Bairro *
                    </label>

                    <input
                      id="bairro"
                      required
                      maxLength={100}
                      disabled={enviando}
                      value={dados.bairro}
                      onChange={(event) =>
                        atualizarCampo(
                          "bairro",
                          event.target.value
                        )
                      }
                      placeholder="Bairro"
                      className={classeInput}
                    />

                  </div>

                  {/* COMPLEMENTO */}

                  <div>

                    <label
                      htmlFor="complemento"
                      className={classeLabel}
                    >
                      Complemento
                    </label>

                    <input
                      id="complemento"
                      maxLength={150}
                      disabled={enviando}
                      value={dados.complemento}
                      onChange={(event) =>
                        atualizarCampo(
                          "complemento",
                          event.target.value
                        )
                      }
                      placeholder="Sala, loja, referência..."
                      className={classeInput}
                    />

                  </div>

                </div>

              </section>

              {/* ===================================== */}
              {/* FUNCIONAMENTO E ENTREGAS              */}
              {/* ===================================== */}

              <section className="overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-sm">

                <div className="bg-[#19352b] px-6 py-5 text-white md:px-8">

                  <h3 className="text-xl font-black">
                    🛵 Funcionamento e entregas
                  </h3>

                  <p className="mt-2 text-sm text-gray-200">
                    Informe como você atende seus clientes.
                  </p>

                </div>

                <div className="space-y-6 p-6 md:p-8">

                  {/* MODALIDADE */}

                  <div>

                    <p className={classeLabel}>
                      Modalidade de atendimento *
                    </p>

                    <div className="mt-3 grid gap-3 md:grid-cols-3">

                      {[
                        {
                          valor: "entrega_propria",
                          titulo: "Entrega própria",
                          descricao:
                            "Meu estabelecimento possui entregador.",
                          icone: "🛵",
                        },
                        {
                          valor: "somente_retirada",
                          titulo: "Somente retirada",
                          descricao:
                            "Os pedidos precisam ser retirados.",
                          icone: "📦",
                        },
                        {
                          valor: "ambas",
                          titulo: "Entrega e retirada",
                          descricao:
                            "Ofereço as duas modalidades.",
                          icone: "✅",
                        },
                      ].map((opcao) => {

                        const selecionado =
                          dados.modalidadeEntrega ===
                          opcao.valor;

                        return (

                          <button
                            key={opcao.valor}
                            type="button"
                            disabled={enviando}
                            onClick={() =>
                              atualizarCampo(
                                "modalidadeEntrega",
                                opcao.valor
                              )
                            }
                            aria-pressed={selecionado}
                            className={`rounded-2xl border-2 p-5 text-left transition disabled:cursor-not-allowed ${
                              selecionado
                                ? "border-green-700 bg-green-50 shadow-sm"
                                : "border-gray-100 bg-[#f8f6ef] hover:border-green-300"
                            }`}
                          >

                            <span className="text-3xl">
                              {opcao.icone}
                            </span>

                            <p className="mt-3 font-black">
                              {opcao.titulo}
                            </p>

                            <p className="mt-2 text-xs leading-5 text-gray-500">
                              {opcao.descricao}
                            </p>

                          </button>

                        );
                      })}

                    </div>

                  </div>

                  {/* DESCRIÇÃO */}

                  <div>

                    <label
                      htmlFor="descricao"
                      className={classeLabel}
                    >
                      Apresente seu estabelecimento
                    </label>

                    <textarea
                      id="descricao"
                      maxLength={600}
                      rows={4}
                      disabled={enviando}
                      value={dados.descricao}
                      onChange={(event) =>
                        atualizarCampo(
                          "descricao",
                          event.target.value
                        )
                      }
                      placeholder="Conte um pouco sobre seus produtos e serviços..."
                      className={classeInput}
                    />

                  </div>

                  {/* AVISO */}

                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">

                    ⚠️ <strong>Importante:</strong>{" "}
                    quando não houver entregador,
                    a retirada pelo Império Chalés
                    dependerá de consulta e confirmação.

                    A taxa deverá ser informada
                    ao cliente antecipadamente.

                  </div>

                </div>

              </section>

              {/* ===================================== */}
              {/* DADOS DE ACESSO                       */}
              {/* ===================================== */}

              <section className="overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-sm">

                <div className="bg-[#19352b] px-6 py-5 text-white md:px-8">

                  <h3 className="text-xl font-black">
                    🔐 Dados de acesso
                  </h3>

                  <p className="mt-2 text-sm text-gray-200">
                    Crie uma senha para sua conta.
                    O acesso operacional dependerá
                    da aprovação administrativa.
                  </p>

                </div>

                <div className="grid gap-5 p-6 md:grid-cols-2 md:p-8">

                  {/* SENHA */}

                  <div>

                    <label
                      htmlFor="senha"
                      className={classeLabel}
                    >
                      Senha *
                    </label>

                    <div className="relative">

                      <input
                        id="senha"
                        required
                        type={
                          mostrarSenha
                            ? "text"
                            : "password"
                        }
                        autoComplete="new-password"
                        minLength={8}
                        disabled={enviando}
                        value={dados.senha}
                        onChange={(event) =>
                          atualizarCampo(
                            "senha",
                            event.target.value
                          )
                        }
                        placeholder="Mínimo de 8 caracteres"
                        className={`${classeInput} pr-20`}
                      />

                      <button
                        type="button"
                        disabled={enviando}
                        onClick={() =>
                          setMostrarSenha(
                            (atual) => !atual
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-[35%] text-xs font-bold text-green-800"
                      >
                        {mostrarSenha
                          ? "Ocultar"
                          : "Mostrar"}
                      </button>

                    </div>

                  </div>

                  {/* CONFIRMAR SENHA */}

                  <div>

                    <label
                      htmlFor="confirmarSenha"
                      className={classeLabel}
                    >
                      Confirmar senha *
                    </label>

                    <div className="relative">

                      <input
                        id="confirmarSenha"
                        required
                        type={
                          mostrarConfirmacao
                            ? "text"
                            : "password"
                        }
                        autoComplete="new-password"
                        minLength={8}
                        disabled={enviando}
                        value={dados.confirmarSenha}
                        onChange={(event) =>
                          atualizarCampo(
                            "confirmarSenha",
                            event.target.value
                          )
                        }
                        placeholder="Repita sua senha"
                        className={`${classeInput} pr-20`}
                      />

                      <button
                        type="button"
                        disabled={enviando}
                        onClick={() =>
                          setMostrarConfirmacao(
                            (atual) => !atual
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-[35%] text-xs font-bold text-green-800"
                      >
                        {mostrarConfirmacao
                          ? "Ocultar"
                          : "Mostrar"}
                      </button>

                    </div>

                  </div>

                  {/* ACEITE */}

                  <div className="md:col-span-2">

                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gray-200 bg-[#f8f6ef] p-4">

                      <input
                        type="checkbox"
                        required
                        disabled={enviando}
                        checked={dados.aceitouTermos}
                        onChange={(event) =>
                          atualizarCampo(
                            "aceitouTermos",
                            event.target.checked
                          )
                        }
                        className="mt-1 h-5 w-5 accent-green-700"
                      />

                      <span className="text-sm leading-6 text-gray-700">

                        Confirmo que os dados informados
                        são verdadeiros e desejo solicitar
                        o cadastro do meu estabelecimento.

                        Estou ciente de que a parceria
                        depende da aprovação do
                        Império Chalés.

                      </span>

                    </label>

                  </div>

                </div>

              </section>

              {/* ===================================== */}
              {/* FINALIZAÇÃO                           */}
              {/* ===================================== */}

              <section className="rounded-[28px] bg-gradient-to-r from-[#10251d] to-[#19352b] p-6 text-white shadow-xl md:p-8">

                <h3 className="text-2xl font-black">
                  🚀 Pronto para começar?
                </h3>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-200">
                  Revise os dados e envie sua solicitação.

                  A empresa ficará com status pendente,
                  aguardando análise administrativa.
                </p>

                <button
                  type="submit"
                  disabled={enviando}
                  className="mt-6 w-full rounded-2xl border-b-[5px] border-amber-700 bg-gradient-to-b from-yellow-200 via-amber-400 to-yellow-500 px-6 py-5 text-base font-black uppercase text-black shadow-[0_8px_25px_rgba(251,191,36,0.25)] transition hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto md:px-10"
                >
                  {enviando
                    ? "⏳ Criando conta e enviando cadastro..."
                    : "✅ Enviar solicitação de parceria"}
                </button>

                <p className="mt-4 text-xs leading-5 text-gray-300">
                  A senha será tratada pelo Firebase
                  Authentication e não será armazenada
                  no documento da empresa.
                </p>

              </section>

            </form>

          </>

        )}

        {/* =========================================== */}
        {/* RODAPÉ COM LOGIN                            */}
        {/* =========================================== */}

        <div className="mt-10 rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-sm md:p-8">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-3xl">
            🔐
          </div>

          <h3 className="mt-4 text-xl font-black text-[#19352b]">
            Já cadastrou seu estabelecimento?
          </h3>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-gray-600">
            Entre com seu e-mail e senha para acompanhar
            a análise do cadastro ou acessar o Portal do
            Parceiro, caso sua empresa já tenha sido aprovada.
          </p>

          <Link
            to="/parceiro/login"
            className="mt-6 inline-flex w-full items-center justify-center rounded-2xl border-b-4 border-amber-700 bg-gradient-to-b from-yellow-200 via-amber-400 to-yellow-500 px-6 py-4 text-sm font-black uppercase text-black shadow-lg transition hover:-translate-y-0.5 hover:brightness-105 sm:w-auto"
          >
            🔐 ENTRAR NA MINHA CONTA →
          </Link>

          <div className="mt-6 border-t border-gray-100 pt-5">

            <Link
              to="/cardapio"
              className="text-sm font-semibold text-gray-500 transition hover:text-[#19352b]"
            >
              ← Voltar ao cardápio
            </Link>

          </div>

        </div>

      </div>

    </main>
  );
}

export default ParceiroCadastro;