
import {
  useEffect,
  useRef,
  useState,
  type TouchEvent,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import { auth, db } from "./firebase/config";

import { CatalogoConteudo } from "./components/CatalogoConteudo";

import { ExperienciasEscolhidas } from "./components/ExperienciasEscolhidas";

// =====================================================
// TIPOS
// =====================================================

interface ClienteAutenticado {
  uid: string;
  nomeCompleto: string;
  email: string;
}

// =====================================================
// IMAGENS DO CARROSSEL
// =====================================================

const slides = [
  {
    id: 1,
    desktop: "/Carrossel-01.png",
    mobile: "/Carrossel-cll-01.png",
    titulo: "Código de indicação IMPERIO",
    destino: "codigo",
    botao: "Ver código IMPERIO",
  },
  {
    id: 2,
    desktop: "/Carrossel-02.png",
    mobile: "/Carrossel-cll-02.png",
    titulo: "Restaurantes com entrega própria",
    destino: "categorias",
    botao: "Ver restaurantes",
  },
  {
    id: 3,
    desktop: "/Carrossel-03.png",
    mobile: "/Carrossel-cll-03.png",
    titulo: "Restaurantes com retirada sob consulta",
    destino: "retirada",
    botao: "Como funciona a retirada",
  },
];

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function Cardapio() {
  const navigate = useNavigate();

  // ===================================================
  // CARROSSEL
  // ===================================================

  const [slideAtual, setSlideAtual] = useState(0);

  const [copiado, setCopiado] = useState(false);

  const [pausado, setPausado] = useState(false);

  const toqueInicial = useRef<number | null>(null);

  // ===================================================
  // AUTENTICAÇÃO DO CLIENTE
  // ===================================================

  const [cliente, setCliente] =
    useState<ClienteAutenticado | null>(null);

  const [verificandoCliente, setVerificandoCliente] =
    useState(true);

  const [menuAberto, setMenuAberto] =
    useState(false);

  const [saindo, setSaindo] =
    useState(false);

  const [erroConta, setErroConta] =
    useState("");

  // ===================================================
  // VERIFICAR SESSÃO E PERFIL DO HÓSPEDE
  // ===================================================

  useEffect(() => {
    let ativo = true;

    let versao = 0;

    const cancelar = onAuthStateChanged(
      auth,

      async (usuario) => {
        const minhaVersao = ++versao;

        if (!ativo) {
          return;
        }

        setVerificandoCliente(true);
        setCliente(null);
        setMenuAberto(false);
        setErroConta("");

        // Sem sessão: visitante comum.

        if (!usuario) {
          setVerificandoCliente(false);
          return;
        }

        try {
          // Uma conta do Authentication não é,
          // necessariamente, uma conta de cliente.
          //
          // Precisamos verificar o documento privado.

          const referencia = doc(
            db,
            "clientes",
            usuario.uid
          );

          const resultado = await getDoc(referencia);

          if (
            !ativo ||
            minhaVersao !== versao ||
            auth.currentUser?.uid !== usuario.uid
          ) {
            return;
          }

          if (!resultado.exists()) {
            setCliente(null);
            return;
          }

          const dados = resultado.data();

          const perfilValido =
            dados.uid === usuario.uid &&
            dados.tipo === "cliente" &&
            typeof dados.nomeCompleto === "string" &&
            dados.nomeCompleto.trim().length >= 3 &&
            typeof dados.email === "string" &&
            dados.email === usuario.email;

          if (!perfilValido) {
            setCliente(null);
            return;
          }

          setCliente({
            uid: usuario.uid,
            nomeCompleto: dados.nomeCompleto.trim(),
            email: dados.email,
          });

        } catch (erro) {
          console.error(
            "Erro ao verificar perfil do cliente:",
            erro
          );

          if (
            ativo &&
            minhaVersao === versao
          ) {
            setCliente(null);

            setErroConta(
              "Não foi possível verificar sua conta. O cardápio continua disponível."
            );
          }

        } finally {
          if (
            ativo &&
            minhaVersao === versao
          ) {
            setVerificandoCliente(false);
          }
        }
      }
    );

    return () => {
      ativo = false;
      versao++;
      cancelar();
    };
  }, []);

  // ===================================================
  // PRIMEIRO NOME
  // ===================================================

  const primeiroNome = cliente
    ? cliente.nomeCompleto.split(/\s+/)[0]
    : "";

  const clienteLogado = cliente !== null;

  // ===================================================
  // TEMA
  // ===================================================

  const fundoPrincipal = clienteLogado
    ? "bg-[#171717] text-white"
    : "bg-[#faf8f2] text-[#19352b]";

  const fundoCabecalho = clienteLogado
    ? "bg-[#080808]"
    : "bg-[#081510]";

  const fundoParceiros = clienteLogado
    ? "border-white/15 bg-gradient-to-br from-[#111111] via-[#242424] to-[#111111]"
    : "border-amber-400/20 bg-gradient-to-br from-[#10251d] via-[#19352b] to-[#10251d]";

  // ===================================================
  // CARROSSEL AUTOMÁTICO
  // ===================================================

  useEffect(() => {
    if (pausado) {
      return;
    }

    const intervalo = window.setInterval(() => {
      setSlideAtual(
        (anterior) => (anterior + 1) % slides.length
      );
    }, 6000);

    return () => {
      window.clearInterval(intervalo);
    };
  }, [pausado]);

  // ===================================================
  // COPIAR CÓDIGO DE INDICAÇÃO
  // ===================================================

  async function copiarCodigo() {
    try {
      await navigator.clipboard.writeText("IMPERIO");

      setCopiado(true);

    } catch {
      setCopiado(false);

      alert(
        "Não foi possível copiar automaticamente. Copie o código IMPERIO."
      );
    }
  }

  // ===================================================
  // NAVEGAR PARA UMA SEÇÃO
  // ===================================================

  function navegarParaSecao(id: string) {
    const secao = document.getElementById(id);

    if (secao) {
      secao.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      return;
    }

    document
      .getElementById("categorias")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  // ===================================================
  // CONTROLES DO CARROSSEL
  // ===================================================

  function selecionarSlide(index: number) {
    setSlideAtual(index);
  }

  function proximoSlide() {
    setSlideAtual(
      (anterior) => (anterior + 1) % slides.length
    );
  }

  function slideAnterior() {
    setSlideAtual(
      (anterior) =>
        (anterior - 1 + slides.length) % slides.length
    );
  }

  // ===================================================
  // CONTROLES DE TOQUE NO CELULAR
  // ===================================================

  function iniciarToque(
    evento: TouchEvent<HTMLDivElement>
  ) {
    toqueInicial.current =
      evento.touches[0].clientX;

    setPausado(true);
  }

  function finalizarToque(
    evento: TouchEvent<HTMLDivElement>
  ) {
    if (toqueInicial.current === null) {
      setPausado(false);
      return;
    }

    const toqueFinal =
      evento.changedTouches[0].clientX;

    const diferenca =
      toqueInicial.current - toqueFinal;

    if (Math.abs(diferenca) > 50) {
      if (diferenca > 0) {
        proximoSlide();
      } else {
        slideAnterior();
      }
    }

    toqueInicial.current = null;

    setPausado(false);
  }

  // ===================================================
  // SAIR DA CONTA
  // ===================================================

  async function sairDaConta() {
    if (saindo || !cliente) {
      return;
    }

    setSaindo(true);
    setErroConta("");

    try {
      await signOut(auth);

      setCliente(null);
      setMenuAberto(false);

      navigate("/cardapio", {
        replace: true,
      });

    } catch (erro) {
      console.error(
        "Erro ao sair da conta:",
        erro
      );

      setErroConta(
        "Não foi possível sair da conta. Tente novamente."
      );

    } finally {
      setSaindo(false);
    }
  }

  // ===================================================
  // INTERFACE
  // ===================================================

  return (
    <main
      className={`min-h-screen overflow-x-hidden transition-colors duration-300 ${fundoPrincipal}`}
    >

      {/* ==================================== */}
      {/* CABEÇALHO                           */}
      {/* ==================================== */}

      <header
        className={`${fundoCabecalho} text-white transition-colors duration-300`}
      >

        {/* ================================== */}
        {/* BARRA SUPERIOR                     */}
        {/* ================================== */}

        <nav className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-3 py-4 sm:px-6 sm:py-5">

          {/* LOGO */}

          <Link
            to="/"
            className="flex min-w-0 items-center gap-2 transition hover:opacity-90 sm:gap-3"
          >

            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10 shadow-md sm:h-12 sm:w-12">

              <img
                src="/logo-imperio.png"
                alt="Logo Império Chalés"
                className="h-full w-full object-contain"
              />

            </div>

            <div className="min-w-0">

              <p className="text-[11px] font-bold tracking-wide text-white sm:text-base">
                IMPÉRIO CHALÉS
              </p>

              <p
                className={`text-[8px] tracking-[0.12em] sm:text-xs ${
                  clienteLogado
                    ? "text-gray-300"
                    : "text-amber-300"
                }`}
              >
                VILA DO SOSSEGO
              </p>

            </div>

          </Link>

          {/* ACESSO DO CLIENTE */}

          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">

            {verificandoCliente ? (

              <span className="rounded-full border border-white/15 px-3 py-2 text-xs text-gray-300">
                Verificando conta...
              </span>

            ) : clienteLogado ? (

              <Link
                to="/cliente/perfil"
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/20 sm:px-4 sm:py-3"
              >
                <span aria-hidden="true">👤</span>

                <span className="max-w-28 truncate sm:max-w-40">
                  Olá, {primeiroNome}
                </span>

                <span className="hidden text-green-300 sm:inline">
                  ✓
                </span>
              </Link>

            ) : (

              <Link
                to="/cliente/login"
                state={{
                  from: "/cardapio",
                }}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/20 sm:px-4 sm:py-3"
              >
                👤 Entrar
              </Link>

            )}

            <Link
              to="/"
              className="rounded-full border border-white/20 bg-white/5 px-3 py-2 text-[10px] font-semibold text-white transition hover:bg-white/10 sm:px-5 sm:py-3 sm:text-sm"
            >
              ← Voltar ao site
            </Link>

          </div>

        </nav>

        {/* ================================== */}
        {/* ÁREA EXCLUSIVA DO CLIENTE          */}
        {/* ================================== */}

        {clienteLogado && (

          <section className="mx-auto w-full max-w-7xl px-3 pb-5 sm:px-6">

            <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#202020] shadow-lg">

              {/* IDENTIFICAÇÃO */}

              <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">

                <div className="flex min-w-0 items-center gap-3">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/20 bg-[#383838] text-2xl">
                    👤
                  </div>

                  <div className="min-w-0">

                    <p className="text-[11px] text-gray-300">
                      Bem-vindo de volta!
                    </p>

                    <h2 className="mt-1 truncate text-lg font-black text-white sm:text-xl">
                      {cliente.nomeCompleto}
                    </h2>

                    <p className="mt-1 text-[11px] text-gray-400">
                      Sua conta de hóspede está conectada
                    </p>

                  </div>

                </div>

                <span className="rounded-full border border-green-400/30 bg-green-400/10 px-3 py-2 text-[11px] font-black text-green-300">
                  ✓ Conectado
                </span>

              </div>

              {/* BOTÃO DO MENU */}

              <div className="border-t border-white/10 p-3 sm:px-5">

                <button
                  type="button"
                  onClick={() =>
                    setMenuAberto(
                      (anterior) => !anterior
                    )
                  }
                  aria-expanded={menuAberto}
                  aria-controls="menu-cliente-cardapio"
                  className="flex w-full items-center justify-between rounded-xl bg-[#303030] px-4 py-3 text-left text-sm font-black text-white transition hover:bg-[#404040]"
                >

                  <span>
                    ☰ Minha conta e opções
                  </span>

                  <span aria-hidden="true">
                    {menuAberto ? "−" : "+"}
                  </span>

                </button>

                {/* MENU EXPANSÍVEL */}

                {menuAberto && (

                  <div
                    id="menu-cliente-cardapio"
                    className="mt-3 grid gap-2 sm:grid-cols-2"
                  >

                    {/* MEU PERFIL */}

                    <Link
                      to="/cliente/perfil"
                      className="flex min-h-12 items-center gap-3 rounded-xl border border-white/10 bg-[#303030] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#404040]"
                    >
                      <span aria-hidden="true">👤</span>
                      Meu perfil
                    </Link>

                    {/* RESTAURANTES */}

                    <button
                      type="button"
                      onClick={() => {
                        setMenuAberto(false);

                        navegarParaSecao("categorias");
                      }}
                      className="flex min-h-12 items-center gap-3 rounded-xl border border-white/10 bg-[#303030] px-4 py-3 text-left text-sm font-bold text-white transition hover:bg-[#404040]"
                    >
                      <span aria-hidden="true">🍽️</span>
                      Ver restaurantes
                    </button>

                    {/* CONSULTAS */}

                    <Link
                      to="/cliente/perfil"
                      className="flex min-h-12 items-center gap-3 rounded-xl border border-white/10 bg-[#303030] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#404040]"
                    >
                      <span aria-hidden="true">📋</span>
                      Minhas consultas
                    </Link>

                    {/* SAIR */}

                    <button
                      type="button"
                      onClick={sairDaConta}
                      disabled={saindo}
                      className="flex min-h-12 items-center gap-3 rounded-xl border border-red-400/20 bg-[#3a2525] px-4 py-3 text-left text-sm font-bold text-red-200 transition hover:bg-[#503030] disabled:opacity-50"
                    >
                      <span aria-hidden="true">🚪</span>

                      {saindo
                        ? "Saindo..."
                        : "Sair da conta"}
                    </button>

                  </div>

                )}

              </div>

            </div>

          </section>

        )}

        {/* ERRO DA CONTA */}

        {erroConta && (

          <div
            role="alert"
            className="mx-auto mb-5 w-[calc(100%-24px)] max-w-7xl rounded-xl border border-red-300/30 bg-red-950/50 p-4 text-sm text-red-100"
          >
            ⚠️ {erroConta}
          </div>

        )}

        {/* ================================== */}
        {/* CARROSSEL RESPONSIVO               */}
        {/* ================================== */}

        <section
          className="mx-auto w-full max-w-7xl px-3 pb-8 sm:px-6 sm:pb-12"
          aria-label="Carrossel Sabores da Chapada"
          aria-roledescription="carrossel"
          onMouseEnter={() => setPausado(true)}
          onMouseLeave={() => setPausado(false)}
          onFocusCapture={() => setPausado(true)}
          onBlurCapture={(evento) => {
            if (
              !evento.currentTarget.contains(
                evento.relatedTarget
              )
            ) {
              setPausado(false);
            }
          }}
        >

          {/* IMAGENS */}

          <div
            className={`relative overflow-hidden rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:rounded-[30px] ${
              clienteLogado
                ? "bg-[#171717]"
                : "bg-[#101813]"
            }`}
            onTouchStart={iniciarToque}
            onTouchEnd={finalizarToque}
            onTouchCancel={() => {
              toqueInicial.current = null;
              setPausado(false);
            }}
          >

            <div className="relative aspect-[9/16] w-full sm:aspect-video">

              {slides.map((slide, index) => (

                <div
                  key={slide.id}
                  aria-hidden={slideAtual !== index}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    slideAtual === index
                      ? "z-10 opacity-100"
                      : "pointer-events-none z-0 opacity-0"
                  }`}
                >

                  <picture className="block h-full w-full">

                    <source
                      media="(max-width: 639px)"
                      srcSet={slide.mobile}
                    />

                    <img
                      src={slide.desktop}
                      alt={slide.titulo}
                      className="block h-full w-full object-contain"
                      loading={
                        index === 0
                          ? "eager"
                          : "lazy"
                      }
                    />

                  </picture>

                </div>

              ))}

            </div>

          </div>

          {/* CONTROLES */}

          <div className="mt-5 flex items-center justify-center gap-5 sm:mt-7">

            <button
              type="button"
              onClick={slideAnterior}
              aria-label="Imagem anterior"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-2xl text-white transition hover:bg-white/20"
            >
              ‹
            </button>

            <div className="flex items-center gap-3">

              {slides.map((slide, index) => (

                <button
                  key={slide.id}
                  type="button"
                  onClick={() =>
                    selecionarSlide(index)
                  }
                  aria-label={`Exibir imagem ${index + 1}`}
                  aria-current={
                    slideAtual === index
                      ? "true"
                      : undefined
                  }
                  className={`h-3 rounded-full transition-all ${
                    slideAtual === index
                      ? clienteLogado
                        ? "w-10 bg-white"
                        : "w-10 bg-amber-400"
                      : "w-3 bg-white/30 hover:bg-white/50"
                  }`}
                />

              ))}

            </div>

            <button
              type="button"
              onClick={proximoSlide}
              aria-label="Próxima imagem"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-2xl text-white transition hover:bg-white/20"
            >
              ›
            </button>

          </div>

          {/* BOTÕES ABAIXO DO CARROSSEL */}

          <div className="mx-auto mt-7 flex w-full max-w-lg flex-col gap-3 sm:flex-row sm:justify-center">

            <button
              type="button"
              onClick={() => {
                navegarParaSecao(
                  slides[slideAtual].destino
                );
              }}
              className={`min-h-12 flex-1 rounded-full px-6 py-3 text-sm font-bold transition ${
                clienteLogado
                  ? "bg-white text-black hover:bg-gray-200"
                  : "bg-amber-400 text-[#19352b] hover:bg-amber-300"
              }`}
            >
              {slides[slideAtual].botao}
            </button>

            <button
              type="button"
              onClick={copiarCodigo}
              className="min-h-12 flex-1 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              {copiado
                ? "✓ Código copiado!"
                : "Copiar código IMPERIO"}
            </button>

          </div>

          <p className="mt-5 text-center text-xs text-gray-400 sm:hidden">
            Deslize para o lado para conhecer nossas opções.
          </p>

        </section>

      </header>

      {/* EXPERIÊNCIAS PARA CLIENTES; PARCERIAS PARA VISITANTES */}
      {clienteLogado ? (
        <ExperienciasEscolhidas
          onExplorar={() => navegarParaSecao("categorias")}
        />
      ) : (
        <section
        aria-labelledby="titulo-espaco-parceiro"
        className="relative mx-auto w-full max-w-7xl px-3 pb-10 pt-8 sm:px-6 sm:pb-14 sm:pt-10"
      >

        <div
          className={`relative overflow-hidden rounded-[28px] border p-5 text-white shadow-xl sm:p-8 lg:p-10 ${fundoParceiros}`}
        >

          <div
            className={`pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full blur-3xl ${
              clienteLogado
                ? "bg-white/5"
                : "bg-amber-400/10"
            }`}
          />

          <div
            className={`pointer-events-none absolute -bottom-20 left-0 h-48 w-48 rounded-full blur-3xl ${
              clienteLogado
                ? "bg-gray-400/5"
                : "bg-green-400/10"
            }`}
          />

          <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1fr_auto] lg:gap-10">

            {/* APRESENTAÇÃO */}

            <div className="min-w-0">

              <span
                className={`inline-flex max-w-full items-center rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-wider sm:px-4 sm:text-xs ${
                  clienteLogado
                    ? "border-white/20 bg-white/10 text-white"
                    : "border-amber-400/40 bg-amber-400/10 text-amber-300"
                }`}
              >
                🏪 Sabores da Chapada • Parceiros
              </span>

              <h2
                id="titulo-espaco-parceiro"
                className="mt-5 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl"
              >
                Seu estabelecimento

                <span
                  className={`block ${
                    clienteLogado
                      ? "text-gray-300"
                      : "text-amber-400"
                  }`}
                >
                  aqui!
                </span>
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-200 sm:text-base">
                Faça parte da nossa rede gastronômica.
                Cadastre sua empresa para solicitar uma
                parceria com o Império Chalés.
              </p>

              <p
                className={`mt-3 max-w-2xl text-sm leading-6 ${
                  clienteLogado
                    ? "text-gray-300"
                    : "text-amber-100"
                }`}
              >
                Já possui cadastro? Entre na sua conta
                para acompanhar a aprovação e acessar
                o Portal do Parceiro.
              </p>

              {/* INFORMAÇÕES */}

              <div className="mt-6 flex flex-wrap gap-2">

                {[
                  "✅ Cadastro online",
                  "⏳ Acompanhe a aprovação",
                  "📋 Portal exclusivo",
                ].map((texto) => (

                  <span
                    key={texto}
                    className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[11px] font-semibold text-gray-100"
                  >
                    {texto}
                  </span>

                ))}

              </div>

            </div>

            {/* BOTÕES */}

            <div className="flex w-full flex-col gap-4 lg:w-80">

              <Link
                to="/parceiro/login"
                className={`flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl border-b-[5px] px-5 py-4 text-center text-sm font-black shadow-lg transition hover:-translate-y-0.5 sm:text-base ${
                  clienteLogado
                    ? "border-gray-500 bg-white text-black hover:bg-gray-200"
                    : "border-amber-700 bg-gradient-to-b from-yellow-200 via-amber-400 to-yellow-500 text-black hover:brightness-105"
                }`}
              >
                🔐 Sou parceiro — Entrar →
              </Link>

              <Link
                to="/parceiro/cadastro"
                className="flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-5 py-4 text-center text-sm font-bold text-white transition hover:bg-white/15 sm:text-base"
              >
                🏪 Cadastrar meu estabelecimento →
              </Link>

              <p className="text-center text-xs leading-5 text-gray-300">
                O acesso ao painel depende da aprovação
                do cadastro pela administração.
              </p>

            </div>

          </div>

        </div>

        </section>
      )}

      {/* ==================================== */}
      {/* CONTEÚDO DO CATÁLOGO                 */}
      {/* ==================================== */}

      {/*
        Nesta etapa, preservamos completamente
        o componente CatalogoConteudo.

        Ele ainda possui estilos internos próprios.

        O tema preto/cinza completo dos cartões,
        filtros e carrinho será ajustado
        diretamente naquele arquivo.
      */}

<CatalogoConteudo temaCliente={clienteLogado} />

      {/* ==================================== */}
      {/* RODAPÉ                              */}
      {/* ==================================== */}

      <footer
        className={`border-t px-6 py-12 text-center text-white transition-colors ${
          clienteLogado
            ? "border-white/10 bg-[#080808]"
            : "border-white/10 bg-[#081510]"
        }`}
      >

        <div className="mx-auto max-w-4xl">

          <img
            src="/logo-imperio.png"
            alt="Império Chalés"
            className="mx-auto mb-5 h-16 w-16 rounded-full object-contain"
          />

          <h2 className="text-xl font-bold">
            Império Chalés – Vila do Sossego
          </h2>

          <p
            className={`mt-3 text-sm ${
              clienteLogado
                ? "text-gray-300"
                : "text-amber-300"
            }`}
          >
            Sabores da Chapada • Alto Paraíso de Goiás
          </p>

          <div className="mx-auto my-6 h-px max-w-md bg-white/10" />

          <p className="mx-auto max-w-2xl text-xs leading-6 text-gray-400">
            Este site é um catálogo informativo.
            Pedidos e pagamentos são realizados
            diretamente com os estabelecimentos
            parceiros. Retiradas pelo anfitrião
            dependem de consulta, disponibilidade
            e confirmação prévia.
          </p>

          <Link
            to="/"
            className="mt-8 inline-block rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            ← Voltar ao site dos chalés
          </Link>

          <p className="mt-8 text-xs text-gray-500">
            © Império Chalés – Vila do Sossego
          </p>

        </div>

      </footer>

    </main>
  );
}

export default Cardapio;