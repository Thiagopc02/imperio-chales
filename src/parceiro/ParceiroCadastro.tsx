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

import estabelecimentoIcon from "../components/catalogo/estabelecimento.png";
import parceiroIcon from "../components/catalogo/parceiro-icone.png";
import entregaIcon from "../components/catalogo/entrega.png";

/* =========================================================
   TIPOS
========================================================= */

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

/* =========================================================
   ESTADO INICIAL
========================================================= */

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

/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

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

/* =========================================================
   PEÇAS VISUAIS
========================================================= */

function TituloSecao({
  etiqueta,
  titulo,
  descricao,
}: {
  etiqueta: string;
  titulo: string;
  descricao: string;
}) {
  return (
    <div className="border-b border-white/10 px-5 py-5 sm:px-7">
      <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#ff3030]">
        {etiqueta}
      </p>

      <h3
        className="
          mt-2
          text-xl
          font-black
          uppercase
          tracking-[-0.025em]
          text-white
          sm:text-2xl
        "
        style={{
          fontFamily: "'Arial Black', 'Montserrat', sans-serif",
          textShadow: "0 2px 0 #000",
        }}
      >
        {titulo}
      </h3>

      <p className="mt-2 max-w-2xl text-xs leading-6 text-white/40 sm:text-sm">
        {descricao}
      </p>
    </div>
  );
}

/* =========================================================
   COMPONENTE PRINCIPAL
========================================================= */

export function ParceiroCadastro() {
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

  /* =======================================================
     LIMPEZA DA PRÉVIA
  ======================================================= */

  useEffect(() => {
    return () => {
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  /* =======================================================
     ATUALIZAR CAMPOS
  ======================================================= */

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

  /* =======================================================
     LOGOMARCA
  ======================================================= */

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

    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }

    setLogoArquivo(arquivo);
    setLogoPreview(URL.createObjectURL(arquivo));
    setErro("");
  }

  function removerLogo() {
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }

    setLogoArquivo(null);
    setLogoPreview(null);

    const input = document.getElementById(
      "logo"
    ) as HTMLInputElement | null;

    if (input) {
      input.value = "";
    }
  }

  /* =======================================================
     VALIDAÇÃO
  ======================================================= */

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

    if (
      somenteNumeros(dados.cep).length !== 8
    ) {
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

  /* =======================================================
     GRAVAR EMPRESA
  ======================================================= */

  async function salvarEmpresa(usuario: User) {
    const restauranteRef = doc(
      db,
      "restaurantes",
      usuario.uid
    );

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

  /* =======================================================
     CADASTRAR
  ======================================================= */

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
      const credencial =
        await createUserWithEmailAndPassword(
          auth,
          dados.email.trim().toLowerCase(),
          dados.senha
        );

      contaCriada = credencial.user;

      setUidCriado(contaCriada.uid);

      await salvarEmpresa(contaCriada);

      setEmpresaCadastrada(
        dados.nomeEmpresa.trim()
      );

      setEmailCadastrado(
        contaCriada.email ??
          dados.email.trim().toLowerCase()
      );

      setDados((anterior) => ({
        ...anterior,
        senha: "",
        confirmarSenha: "",
      }));

      setEstadoEnvio("sucesso");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (erroFirebase) {
      if (contaCriada) {
        setEstadoEnvio(
          "conta_sem_cadastro"
        );

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
          mensagemErroFirebase(
            erroFirebase
          )
        );
      }

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }

  /* =======================================================
     ESTILOS
  ======================================================= */

  const classeInput = `
    mt-2
    w-full
    rounded-[16px]
    border
    border-white/10
    bg-white/[0.055]
    px-4
    py-4
    text-sm
    font-semibold
    text-white
    outline-none
    transition-all
    duration-300
    placeholder:text-white/25
    focus:border-[#ff3030]/70
    focus:bg-white/[0.075]
    focus:ring-4
    focus:ring-[#ff3030]/[0.06]
    disabled:cursor-not-allowed
    disabled:opacity-50
  `;

  const classeLabel = `
    block
    text-[11px]
    font-black
    uppercase
    tracking-[0.08em]
    text-white
    sm:text-xs
  `;

  const enviando =
    estadoEnvio === "enviando";

  /* =======================================================
     INTERFACE
  ======================================================= */

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* LUZES DE FUNDO */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -left-40
          top-28
          h-[460px]
          w-[460px]
          rounded-full
          bg-red-600/[0.055]
          blur-[160px]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -right-44
          top-[900px]
          h-[520px]
          w-[520px]
          rounded-full
          bg-[#d4af37]/[0.035]
          blur-[180px]
        "
      />

      {/* ===================================================
          CABEÇALHO
      =================================================== */}

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
            max-w-6xl
            flex-wrap
            items-center
            justify-between
            gap-3
          "
        >
          <Link
            to="/cardapio"
            className="flex items-center gap-3"
          >
            <img
              src="/coroa.png"
              alt="Império Chalés"
              className="
                h-11
                w-11
                object-contain
                drop-shadow-[0_0_12px_rgba(255,255,255,.15)]
              "
            />

            <div>
              <p
                className="
                  text-sm
                  font-black
                  uppercase
                  tracking-[0.04em]
                  text-white
                "
              >
                Portal do Parceiro
              </p>

              <p
                className="
                  mt-0.5
                  text-[9px]
                  font-black
                  uppercase
                  tracking-[0.18em]
                  text-[#ff3030]
                "
              >
                Sabores da Chapada
              </p>
            </div>
          </Link>

          <nav className="flex flex-1 justify-end gap-2 sm:flex-none">
            <Link
              to="/parceiro/login"
              className="
                inline-flex
                min-h-[46px]
                items-center
                justify-center
                rounded-xl
                border
                border-red-500/35
                bg-red-500/[0.09]
                px-4
                text-[11px]
                font-black
                uppercase
                tracking-[0.04em]
                text-red-300
                transition
                hover:bg-red-500/15
              "
            >
              Fazer login →
            </Link>

            <Link
              to="/cardapio"
              className="
                hidden
                min-h-[46px]
                items-center
                justify-center
                rounded-xl
                border
                border-white/10
                px-4
                text-[11px]
                font-black
                uppercase
                text-white
                transition
                hover:bg-white/[0.06]
                sm:inline-flex
              "
            >
              ← Cardápio
            </Link>
          </nav>
        </div>
      </header>

      {/* ===================================================
          CONTEÚDO
      =================================================== */}

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* =================================================
            HERO
        ================================================= */}

        <section
          className="
            relative
            mb-8
            overflow-hidden
            rounded-[30px]
            border
            border-white/10
            bg-gradient-to-br
            from-[#1d1d1d]
            via-[#0d0d0d]
            to-black
            p-6
            shadow-[0_25px_80px_rgba(0,0,0,.65)]
            sm:p-8
            lg:p-10
          "
        >
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              -right-16
              -top-20
              h-72
              w-72
              rounded-full
              bg-red-500/[0.10]
              blur-[100px]
            "
          />

          <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1fr_320px]">
            <div>
              <div
                className="
                  inline-flex
                  rounded-full
                  border
                  border-red-500/30
                  bg-red-500/[0.07]
                  px-4
                  py-2
                  text-[9px]
                  font-black
                  uppercase
                  tracking-[0.20em]
                  text-[#ff3030]
                "
              >
                Cadastro de parceiro
              </div>

              <h1
                className="
                  mt-5
                  max-w-3xl
                  text-[38px]
                  font-black
                  uppercase
                  leading-[0.92]
                  tracking-[-0.045em]
                  text-white
                  sm:text-[52px]
                  lg:text-[64px]
                "
                style={{
                  fontFamily:
                    "'Arial Black', 'Montserrat', sans-serif",
                  textShadow:
                    "0 3px 0 #000, 0 10px 30px rgba(0,0,0,.55)",
                }}
              >
                Cadastre seu
                <span
                  className="
                    block
                    text-[#ff3030]
                    drop-shadow-[0_0_16px_rgba(255,48,48,.28)]
                  "
                >
                  estabelecimento
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/45 sm:text-base">
                Preencha os dados abaixo para solicitar sua parceria com o Império Chalés.
              </p>
            </div>

            <div className="flex items-center justify-center">
              <img
                src={estabelecimentoIcon}
                alt=""
                aria-hidden="true"
                draggable={false}
                className="
                  h-[210px]
                  w-[210px]
                  object-contain
                  drop-shadow-[0_18px_35px_rgba(255,0,0,.20)]
                  sm:h-[240px]
                  sm:w-[240px]
                "
              />
            </div>
          </div>

          {/* PASSOS */}

          <div className="relative z-10 mt-8 grid gap-3 sm:grid-cols-3">
            {[
              {
                numero: "01",
                titulo: "CADASTRO",
                texto: "Envie seus dados.",
              },
              {
                numero: "02",
                titulo: "ANÁLISE",
                texto: "Nossa equipe confere.",
              },
              {
                numero: "03",
                titulo: "APROVAÇÃO",
                texto: "Acesso liberado.",
              },
            ].map((passo) => (
              <div
                key={passo.numero}
                className="
                  rounded-[20px]
                  border
                  border-white/10
                  bg-white/[0.04]
                  p-4
                "
              >
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#ff3030]">
                  Passo {passo.numero}
                </p>

                <p className="mt-2 text-sm font-black uppercase text-white">
                  {passo.titulo}
                </p>

                <p className="mt-1 text-xs text-white/35">
                  {passo.texto}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* =================================================
            SUCESSO
        ================================================= */}

        {estadoEnvio === "sucesso" && (
          <section
            role="status"
            className="
              overflow-hidden
              rounded-[30px]
              border
              border-[#16f06d]/25
              bg-[#080808]
              shadow-[0_25px_80px_rgba(0,0,0,.65)]
            "
          >
            <div className="p-6 sm:p-8">
              <div className="flex justify-center">
                <img
                  src={parceiroIcon}
                  alt=""
                  className="h-24 w-24 object-contain"
                />
              </div>

              <p className="mt-5 text-center text-[10px] font-black uppercase tracking-[0.20em] text-[#16f06d]">
                Cadastro recebido
              </p>

              <h2
                className="
                  mt-3
                  text-center
                  text-3xl
                  font-black
                  uppercase
                  text-white
                  sm:text-4xl
                "
                style={{
                  fontFamily:
                    "'Arial Black', 'Montserrat', sans-serif",
                }}
              >
                Solicitação
                <span className="block text-[#16f06d]">
                  enviada!
                </span>
              </h2>

              <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-7 text-white/45">
                Sua empresa foi registrada e agora aguarda análise administrativa.
              </p>

              <div className="mx-auto mt-7 max-w-2xl rounded-[22px] border border-white/10 bg-white/[0.04] p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-black/40 p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/30">
                      Empresa
                    </p>
                    <p className="mt-2 break-words text-sm font-black uppercase text-white">
                      {empresaCadastrada}
                    </p>
                  </div>

                  <div className="rounded-xl bg-black/40 p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/30">
                      E-mail
                    </p>
                    <p className="mt-2 break-all text-sm font-black text-white">
                      {emailCadastrado}
                    </p>
                  </div>
                </div>
              </div>

              <Link
                to="/parceiro/solicitacao"
                className="
                  mx-auto
                  mt-7
                  flex
                  min-h-[62px]
                  max-w-2xl
                  items-center
                  justify-center
                  rounded-[18px]
                  bg-[#16f06d]
                  px-5
                  text-center
                  text-sm
                  font-black
                  uppercase
                  text-black
                  shadow-[0_12px_30px_rgba(22,240,109,.18)]
                  transition
                  hover:-translate-y-1
                "
              >
                Acompanhar minha solicitação →
              </Link>
            </div>
          </section>
        )}

        {/* =================================================
            CONTA CRIADA, FIRESTORE NÃO CONFIRMADO
        ================================================= */}

        {estadoEnvio === "conta_sem_cadastro" && (
          <section
            role="alert"
            className="
              rounded-[28px]
              border
              border-red-500/30
              bg-red-500/[0.06]
              p-6
              sm:p-8
            "
          >
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-400">
              Atenção
            </p>

            <h2 className="mt-3 text-2xl font-black uppercase text-white">
              Precisamos verificar seu cadastro
            </h2>

            <p className="mt-4 text-sm leading-7 text-white/55">
              Sua conta de acesso foi criada, mas o registro da empresa não foi confirmado no banco de dados.
            </p>

            <p className="mt-3 text-sm leading-7 text-white/55">
              Não tente realizar outro cadastro com o mesmo e-mail.
            </p>

            <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-4 text-sm">
              <p className="break-all">
                <strong>E-mail:</strong>{" "}
                {emailCadastrado}
              </p>

              {uidCriado && (
                <p className="mt-2 break-all text-white/55">
                  <strong>Identificador:</strong>{" "}
                  {uidCriado}
                </p>
              )}
            </div>

            {erro && (
              <p className="mt-4 text-sm leading-6 text-red-300">
                {erro}
              </p>
            )}

            <Link
              to="/cardapio"
              className="
                mt-6
                inline-flex
                rounded-xl
                border
                border-white/15
                px-5
                py-3
                text-sm
                font-black
                uppercase
                text-white
              "
            >
              ← Voltar ao cardápio
            </Link>
          </section>
        )}

        {/* =================================================
            FORMULÁRIO
        ================================================= */}

        {(estadoEnvio === "formulario" ||
          estadoEnvio === "enviando") && (
          <>
            {erro && (
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
                  font-bold
                  leading-6
                  text-red-300
                "
              >
                ⚠️ {erro}
              </div>
            )}

            <form
              onSubmit={cadastrarEmpresa}
              className="space-y-6"
            >
              {/* ===========================================
                  DADOS DO ESTABELECIMENTO
              =========================================== */}

              <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[#090909] shadow-[0_20px_60px_rgba(0,0,0,.50)]">
                <TituloSecao
                  etiqueta="Dados principais"
                  titulo="Dados do estabelecimento"
                  descricao="Informe os dados utilizados para identificar e analisar sua empresa."
                />

                <div className="grid gap-5 p-5 sm:p-7 md:grid-cols-2">
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

                    <p className="mt-2 text-xs text-white/25">
                      O documento será conferido durante a análise.
                    </p>
                  </div>

                  {/* LOGOMARCA */}

                  <div className="md:col-span-2">
                    <label className={classeLabel}>
                      Logomarca da empresa
                    </label>

                    <div
                      className="
                        mt-3
                        flex
                        flex-col
                        gap-5
                        rounded-[20px]
                        border
                        border-dashed
                        border-white/10
                        bg-white/[0.025]
                        p-5
                        sm:flex-row
                        sm:items-center
                      "
                    >
                      <div
                        className="
                          flex
                          h-28
                          w-28
                          shrink-0
                          items-center
                          justify-center
                          overflow-hidden
                          rounded-[20px]
                          border
                          border-white/10
                          bg-black
                        "
                      >
                        {logoPreview ? (
                          <img
                            src={logoPreview}
                            alt="Prévia da logomarca"
                            className="h-full w-full object-contain p-2"
                          />
                        ) : (
                          <img
                            src={estabelecimentoIcon}
                            alt=""
                            aria-hidden="true"
                            className="h-20 w-20 object-contain opacity-75"
                          />
                        )}
                      </div>

                      <div className="flex-1">
                        <label
                          htmlFor="logo"
                          className="
                            inline-flex
                            cursor-pointer
                            rounded-xl
                            bg-[#ff3030]
                            px-5
                            py-3
                            text-xs
                            font-black
                            uppercase
                            text-white
                            transition
                            hover:bg-red-500
                          "
                        >
                          Selecionar logomarca
                        </label>

                        <input
                          id="logo"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          disabled={enviando}
                          onChange={selecionarLogo}
                          className="sr-only"
                        />

                        <p className="mt-3 text-xs leading-5 text-white/30">
                          JPG, PNG ou WEBP. Máximo de 2 MB.
                        </p>

                        <p className="mt-2 text-xs leading-5 text-[#d4af37]/70">
                          A imagem será exibida apenas como prévia nesta etapa.
                        </p>

                        {logoArquivo && (
                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            <span className="break-all text-xs font-bold text-[#16f06d]">
                              ✓ {logoArquivo.name}
                            </span>

                            <button
                              type="button"
                              disabled={enviando}
                              onClick={removerLogo}
                              className="text-xs font-black uppercase text-red-400 underline"
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

              {/* ===========================================
                  ENDEREÇO
              =========================================== */}

              <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[#090909] shadow-[0_20px_60px_rgba(0,0,0,.50)]">
                <TituloSecao
                  etiqueta="Localização"
                  titulo="Endereço do estabelecimento"
                  descricao="Preencha o endereço completo para identificarmos corretamente sua empresa."
                />

                <div className="grid gap-5 p-5 sm:p-7 md:grid-cols-2">
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
                          formatarCep(
                            event.target.value
                          )
                        )
                      }
                      placeholder="00000-000"
                      className={classeInput}
                    />
                  </div>

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

              {/* ===========================================
                  FUNCIONAMENTO E ENTREGAS
              =========================================== */}

              <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[#090909] shadow-[0_20px_60px_rgba(0,0,0,.50)]">
                <TituloSecao
                  etiqueta="Atendimento"
                  titulo="Funcionamento e entregas"
                  descricao="Escolha como o estabelecimento atende seus clientes."
                />

                <div className="space-y-6 p-5 sm:p-7">
                  <div>
                    <p className={classeLabel}>
                      Modalidade de atendimento *
                    </p>

                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      {[
                        {
                          valor:
                            "entrega_propria",
                          titulo:
                            "Entrega própria",
                          descricao:
                            "Meu estabelecimento possui entregador.",
                          imagem:
                            entregaIcon,
                        },
                        {
                          valor:
                            "somente_retirada",
                          titulo:
                            "Somente retirada",
                          descricao:
                            "Os pedidos precisam ser retirados.",
                          imagem:
                            estabelecimentoIcon,
                        },
                        {
                          valor: "ambas",
                          titulo:
                            "Entrega e retirada",
                          descricao:
                            "Ofereço as duas modalidades.",
                          imagem:
                            parceiroIcon,
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
                            aria-pressed={
                              selecionado
                            }
                            className={`
                              group
                              rounded-[20px]
                              border
                              p-5
                              text-left
                              transition-all
                              duration-300
                              disabled:cursor-not-allowed

                              ${
                                selecionado
                                  ? "border-[#ff3030]/70 bg-red-500/[0.08] shadow-[0_0_24px_rgba(255,48,48,.09)]"
                                  : "border-white/10 bg-white/[0.035] hover:border-white/20"
                              }
                            `}
                          >
                            <img
                              src={opcao.imagem}
                              alt=""
                              aria-hidden="true"
                              className="
                                h-16
                                w-16
                                object-contain
                                transition-transform
                                duration-300
                                group-hover:scale-110
                              "
                            />

                            <p className="mt-3 text-sm font-black uppercase text-white">
                              {opcao.titulo}
                            </p>

                            <p className="mt-2 text-xs leading-5 text-white/35">
                              {opcao.descricao}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

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
                      className={`${classeInput} resize-y`}
                    />
                  </div>

                  <div
                    className="
                      rounded-[18px]
                      border
                      border-[#d4af37]/25
                      bg-[#d4af37]/[0.05]
                      p-4
                      text-xs
                      leading-6
                      text-white/55
                    "
                  >
                    <strong className="text-[#f1cf53]">
                      Importante:
                    </strong>{" "}
                    quando não houver entregador, a retirada pelo Império Chalés dependerá de consulta e confirmação. A taxa deverá ser informada ao cliente antecipadamente.
                  </div>
                </div>
              </section>

              {/* ===========================================
                  DADOS DE ACESSO
              =========================================== */}

              <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[#090909] shadow-[0_20px_60px_rgba(0,0,0,.50)]">
                <TituloSecao
                  etiqueta="Segurança"
                  titulo="Dados de acesso"
                  descricao="Crie a senha que será utilizada no Portal do Parceiro após a aprovação."
                />

                <div className="grid gap-5 p-5 sm:p-7 md:grid-cols-2">
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
                        className={`${classeInput} pr-24`}
                      />

                      <button
                        type="button"
                        disabled={enviando}
                        onClick={() =>
                          setMostrarSenha(
                            (atual) => !atual
                          )
                        }
                        className="
                          absolute
                          right-3
                          top-[50%]
                          -translate-y-[18%]
                          rounded-lg
                          px-2
                          py-1
                          text-[10px]
                          font-black
                          uppercase
                          text-[#ff3030]
                        "
                      >
                        {mostrarSenha
                          ? "Ocultar"
                          : "Mostrar"}
                      </button>
                    </div>
                  </div>

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
                        value={
                          dados.confirmarSenha
                        }
                        onChange={(event) =>
                          atualizarCampo(
                            "confirmarSenha",
                            event.target.value
                          )
                        }
                        placeholder="Repita sua senha"
                        className={`${classeInput} pr-24`}
                      />

                      <button
                        type="button"
                        disabled={enviando}
                        onClick={() =>
                          setMostrarConfirmacao(
                            (atual) => !atual
                          )
                        }
                        className="
                          absolute
                          right-3
                          top-[50%]
                          -translate-y-[18%]
                          rounded-lg
                          px-2
                          py-1
                          text-[10px]
                          font-black
                          uppercase
                          text-[#ff3030]
                        "
                      >
                        {mostrarConfirmacao
                          ? "Ocultar"
                          : "Mostrar"}
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label
                      className="
                        flex
                        cursor-pointer
                        items-start
                        gap-3
                        rounded-[18px]
                        border
                        border-white/10
                        bg-white/[0.035]
                        p-4
                      "
                    >
                      <input
                        type="checkbox"
                        required
                        disabled={enviando}
                        checked={
                          dados.aceitouTermos
                        }
                        onChange={(event) =>
                          atualizarCampo(
                            "aceitouTermos",
                            event.target.checked
                          )
                        }
                        className="
                          mt-0.5
                          h-5
                          w-5
                          shrink-0
                          accent-[#ff3030]
                        "
                      />

                      <span className="text-xs leading-6 text-white/50 sm:text-sm">
                        Confirmo que os dados informados são verdadeiros e desejo solicitar o cadastro do meu estabelecimento. Estou ciente de que a parceria depende da aprovação do Império Chalés.
                      </span>
                    </label>
                  </div>
                </div>
              </section>

              {/* ===========================================
                  ENVIO
              =========================================== */}

              <section
                className="
                  relative
                  overflow-hidden
                  rounded-[28px]
                  border
                  border-red-500/25
                  bg-gradient-to-br
                  from-[#1a0b0b]
                  via-[#0c0808]
                  to-black
                  p-6
                  sm:p-8
                "
              >
                <div
                  aria-hidden="true"
                  className="
                    pointer-events-none
                    absolute
                    -right-16
                    -top-20
                    h-56
                    w-56
                    rounded-full
                    bg-red-500/[0.10]
                    blur-[80px]
                  "
                />

                <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ff3030]">
                    Finalizar cadastro
                  </p>

                  <h2
                    className="
                      mt-3
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
                    Pronto para começar?
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">
                    Revise as informações e envie sua solicitação para análise.
                  </p>

                  <button
                    type="submit"
                    disabled={enviando}
                    className="
                      mt-6
                      flex
                      min-h-[64px]
                      w-full
                      items-center
                      justify-center
                      gap-3
                      rounded-[18px]
                      bg-[#ff3030]
                      px-6
                      text-sm
                      font-black
                      uppercase
                      text-white
                      shadow-[0_12px_35px_rgba(255,48,48,.18)]
                      transition-all
                      duration-300
                      hover:-translate-y-1
                      hover:bg-red-500
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                      sm:w-auto
                      sm:min-w-[360px]
                    "
                  >
                    {enviando
                      ? "Enviando solicitação..."
                      : "Enviar solicitação de parceria →"}
                  </button>

                  <p className="mt-4 text-[11px] leading-5 text-white/25">
                    Sua senha é tratada pelo Firebase Authentication e não é armazenada no documento da empresa.
                  </p>
                </div>
              </section>
            </form>

            {/* =============================================
                LOGIN EXISTENTE
            ============================================= */}

            <section
              className="
                mt-6
                rounded-[28px]
                border
                border-white/10
                bg-[#090909]
                p-6
                text-center
                sm:p-8
              "
            >
              <img
                src={parceiroIcon}
                alt=""
                aria-hidden="true"
                className="mx-auto h-20 w-20 object-contain"
              />

              <h2
                className="
                  mt-4
                  text-xl
                  font-black
                  uppercase
                  text-white
                  sm:text-2xl
                "
                style={{
                  fontFamily:
                    "'Arial Black', 'Montserrat', sans-serif",
                }}
              >
                Já cadastrou seu estabelecimento?
              </h2>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/40">
                Entre com seu e-mail e senha para acompanhar a análise ou acessar o Portal do Parceiro.
              </p>

              <Link
                to="/parceiro/login"
                className="
                  mt-6
                  inline-flex
                  min-h-[56px]
                  items-center
                  justify-center
                  rounded-[16px]
                  border
                  border-red-500/30
                  bg-red-500/[0.08]
                  px-6
                  text-sm
                  font-black
                  uppercase
                  text-red-300
                  transition
                  hover:-translate-y-1
                  hover:bg-red-500/15
                "
              >
                Entrar na minha conta →
              </Link>

              <div className="mt-7 border-t border-white/10 pt-6">
                <Link
                  to="/cardapio"
                  className="
                    text-xs
                    font-black
                    uppercase
                    tracking-[0.05em]
                    text-white
                    transition
                    hover:text-[#ff3030]
                  "
                >
                  ← Voltar ao cardápio
                </Link>
              </div>
            </section>
          </>
        )}

        {/* =================================================
            RODAPÉ
        ================================================= */}

        <footer className="mt-10 border-t border-white/10 py-8 text-center">
          <img
            src="/coroa.png"
            alt=""
            aria-hidden="true"
            className="mx-auto h-10 w-10 object-contain opacity-70"
          />

          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.16em] text-white/25">
            Império Chalés • Portal do Parceiro
          </p>
        </footer>
      </div>
    </main>
  );
}

export default ParceiroCadastro;
