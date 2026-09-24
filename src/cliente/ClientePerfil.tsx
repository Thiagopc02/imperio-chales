
import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  onAuthStateChanged,
  signOut,
  type User,
} from "firebase/auth";

import {
  doc,
  onSnapshot,
  type Timestamp,
} from "firebase/firestore";

import { auth, db } from "../firebase/config";

// =====================================================
// TIPOS
// =====================================================

interface PerfilCliente {
  uid: string;
  nomeCompleto: string;
  cpf: string;
  celular: string;
  email: string;
  tipo: "cliente";
  criadoEm: Timestamp | null;
}

type EstadoPerfil =
  | "carregando"
  | "pronto"
  | "sem_perfil"
  | "erro";

// =====================================================
// FORMATAÇÕES
// =====================================================

function formatarCelular(
  valor: string
): string {
  const numeros = valor.replace(/\D/g, "");

  if (numeros.length !== 11) {
    return "Não informado";
  }

  return `(${numeros.slice(0, 2)}) ${numeros.slice(
    2,
    7
  )}-${numeros.slice(7)}`;
}

// Não exibimos o CPF completo no perfil.
//
// Apenas os três últimos dígitos são mostrados.

function mascararCPF(
  valor: string
): string {
  const numeros = valor.replace(/\D/g, "");

  if (numeros.length !== 11) {
    return "Não informado";
  }

  return `***.***.***-${numeros.slice(-2)}`;
}

function formatarData(
  valor: Timestamp | null
): string {
  if (!valor) {
    return "Não disponível";
  }

  return valor.toDate().toLocaleDateString(
    "pt-BR",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
}

// =====================================================
// CONVERTER PERFIL
// =====================================================

function converterPerfil(
  uid: string,
  dados: Record<string, unknown>
): PerfilCliente | null {
  if (
    dados.uid !== uid ||
    dados.tipo !== "cliente" ||
    typeof dados.nomeCompleto !== "string" ||
    typeof dados.email !== "string"
  ) {
    return null;
  }

  const criadoEm =
    dados.criadoEm &&
    typeof dados.criadoEm === "object" &&
    "toDate" in dados.criadoEm &&
    typeof dados.criadoEm.toDate === "function"
      ? (dados.criadoEm as Timestamp)
      : null;

  return {
    uid,

    nomeCompleto:
      dados.nomeCompleto,

    cpf:
      typeof dados.cpf === "string"
        ? dados.cpf
        : "",

    celular:
      typeof dados.celular === "string"
        ? dados.celular
        : "",

    email:
      dados.email,

    tipo: "cliente",

    criadoEm,
  };
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function ClientePerfil() {
  const navigate = useNavigate();

  const [perfil, setPerfil] =
    useState<PerfilCliente | null>(null);

  const [estado, setEstado] =
    useState<EstadoPerfil>("carregando");

  const [erro, setErro] =
    useState("");

  const [saindo, setSaindo] =
    useState(false);

  // ===================================================
  // CONSULTAR PERFIL
  // ===================================================

  useEffect(() => {
    let ativo = true;

    let cancelarPerfil:
      | (() => void)
      | undefined;

    const cancelarAuth = onAuthStateChanged(
      auth,

      (usuario: User | null) => {
        // Cancela a leitura da conta anterior,
        // caso o usuário tenha mudado.

        if (cancelarPerfil) {
          cancelarPerfil();
          cancelarPerfil = undefined;
        }

        setPerfil(null);
        setEstado("carregando");

        if (!usuario) {
          navigate("/cliente/login", {
            replace: true,
            state: {
              from: "/cliente/perfil",
            },
          });

          return;
        }

        const uid = usuario.uid;

        const referencia = doc(
          db,
          "clientes",
          uid
        );

        cancelarPerfil = onSnapshot(
          referencia,

          (documento) => {
            if (
              !ativo ||
              auth.currentUser?.uid !== uid
            ) {
              return;
            }

            if (!documento.exists()) {
              setPerfil(null);
              setEstado("sem_perfil");
              return;
            }

            const dados = documento.data();

            const perfilConvertido =
              converterPerfil(
                uid,
                dados
              );

            if (
              !perfilConvertido ||
              perfilConvertido.email !== usuario.email
            ) {
              setPerfil(null);
              setEstado("sem_perfil");
              return;
            }

            setPerfil(perfilConvertido);
            setEstado("pronto");
            setErro("");
          },

          (erroFirebase) => {
            if (!ativo) {
              return;
            }

            console.error(
              "Erro ao carregar perfil do cliente:",
              erroFirebase
            );

            setPerfil(null);

            setErro(
              "Não foi possível carregar seu perfil. Verifique sua conexão e tente novamente."
            );

            setEstado("erro");
          }
        );
      },

      (erroAuth) => {
        if (!ativo) {
          return;
        }

        console.error(
          "Erro na autenticação do perfil:",
          erroAuth
        );

        setEstado("erro");

        setErro(
          "Não foi possível verificar sua autenticação."
        );
      }
    );

    return () => {
      ativo = false;

      cancelarAuth();

      if (cancelarPerfil) {
        cancelarPerfil();
      }
    };
  }, [navigate]);

  // ===================================================
  // SAIR DA CONTA
  // ===================================================

  async function sairDaConta(): Promise<void> {
    if (saindo) {
      return;
    }

    setSaindo(true);
    setErro("");

    try {
      await signOut(auth);

      navigate("/cliente/login", {
        replace: true,
      });

    } catch (erroLogout) {
      console.error(
        "Erro ao sair da conta:",
        erroLogout
      );

      setErro(
        "Não foi possível sair da conta. Tente novamente."
      );

      setSaindo(false);
    }
  }

  // ===================================================
  // TELA DE CARREGAMENTO
  // ===================================================

  if (estado === "carregando") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f6ef] px-4 text-[#19352b]">

        <div className="rounded-3xl bg-white p-8 text-center shadow-md">

          <div className="text-4xl">
            ⏳
          </div>

          <h1 className="mt-4 text-xl font-black">
            Carregando seu perfil...
          </h1>

        </div>

      </main>
    );
  }

  // ===================================================
  // PERFIL INEXISTENTE
  // ===================================================

  if (estado === "sem_perfil") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f6ef] px-4 text-[#19352b]">

        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-md">

          <h1 className="text-xl font-black">
            ⚠️ Perfil não encontrado
          </h1>

          <p className="mt-4 text-sm leading-7 text-gray-600">
            Não encontramos um perfil de cliente
            válido associado à sua conta.
          </p>

          <Link
            to="/cardapio"
            className="mt-6 block rounded-xl bg-[#19352b] px-5 py-4 text-sm font-black text-white"
          >
            Voltar ao cardápio
          </Link>

        </div>

      </main>
    );
  }

  // ===================================================
  // ERRO
  // ===================================================

  if (estado === "erro") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f6ef] px-4 text-[#19352b]">

        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-md">

          <h1 className="text-xl font-black">
            ⚠️ Não foi possível abrir seu perfil
          </h1>

          <p className="mt-4 text-sm leading-7 text-gray-600">
            {erro}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 w-full rounded-xl bg-[#19352b] px-5 py-4 text-sm font-black text-white"
          >
            Tentar novamente
          </button>

        </div>

      </main>
    );
  }

  // ===================================================
  // GARANTIA DE PERFIL
  // ===================================================

  if (!perfil) {
    return null;
  }

  // ===================================================
  // INTERFACE DO PERFIL
  // ===================================================

  return (
    <main className="min-h-screen bg-[#f8f6ef] px-4 py-8 text-[#19352b] sm:py-12">

      <div className="mx-auto w-full max-w-3xl">

        {/* =========================================== */}
        {/* CABEÇALHO                                  */}
        {/* =========================================== */}

        <header className="mb-8 text-center">

          <Link to="/cardapio">
            <img
              src="/logo-imperio.png"
              alt="Império Chalés"
              className="mx-auto h-20 w-20 object-contain"
            />
          </Link>

          <p className="mt-4 text-xs font-black uppercase tracking-[0.25em] text-amber-700">
            SABORES DA CHAPADA
          </p>

          <h1 className="mt-3 text-3xl font-black sm:text-4xl">
            Minha conta
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-600">
            Sua área exclusiva de hóspede.
          </p>

        </header>

        {/* =========================================== */}
        {/* BEM-VINDO                                  */}
        {/* =========================================== */}

        <section className="rounded-3xl bg-[#19352b] p-6 text-white shadow-lg sm:p-8">

          <div className="flex flex-wrap items-center gap-4">

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/15 text-3xl">
              👤
            </div>

            <div className="min-w-0 flex-1">

              <p className="text-xs font-black uppercase tracking-wider text-amber-300">
                Bem-vindo!
              </p>

              <h2 className="mt-2 break-words text-2xl font-black">
                {perfil.nomeCompleto}
              </h2>

              <p className="mt-2 text-xs leading-6 text-gray-300">
                Sua conta está conectada.
              </p>

            </div>

          </div>

        </section>

        {/* =========================================== */}
        {/* IDENTIFICAÇÃO                              */}
        {/* =========================================== */}

        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">

          <h2 className="text-xl font-black">
            🪪 Minha identificação
          </h2>

          <p className="mt-3 text-sm leading-6 text-gray-500">
            Seu ID é permanente e identifica
            sua conta no sistema.
          </p>

          <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">

            <p className="text-xs font-black uppercase tracking-wider text-gray-500">
              ID do cliente
            </p>

            <p className="mt-2 break-all font-mono text-xs font-bold text-[#19352b]">
              {perfil.uid}
            </p>

          </div>

          <p className="mt-3 text-xs leading-6 text-gray-500">
            Este identificador será associado às
            suas consultas. Ele não funciona
            como senha ou comprovante de hospedagem.
          </p>

        </section>

        {/* =========================================== */}
        {/* DADOS PESSOAIS                             */}
        {/* =========================================== */}

        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">

          <h2 className="text-xl font-black">
            👤 Meus dados pessoais
          </h2>

          <div className="mt-6 space-y-5">

            {/* NOME */}

            <div className="border-b border-gray-100 pb-4">

              <p className="text-xs font-bold text-gray-500">
                Nome completo
              </p>

              <p className="mt-2 break-words text-sm font-black">
                {perfil.nomeCompleto}
              </p>

            </div>

            {/* CPF */}

            <div className="border-b border-gray-100 pb-4">

              <p className="text-xs font-bold text-gray-500">
                CPF
              </p>

              <p className="mt-2 text-sm font-black">
                {mascararCPF(perfil.cpf)}
              </p>

              <p className="mt-2 text-xs leading-6 text-gray-500">
                Seu CPF não é enviado aos restaurantes.
              </p>

            </div>

            {/* CELULAR */}

            <div className="border-b border-gray-100 pb-4">

              <p className="text-xs font-bold text-gray-500">
                Celular
              </p>

              <p className="mt-2 text-sm font-black">
                {formatarCelular(perfil.celular)}
              </p>

            </div>

            {/* EMAIL */}

            <div className="border-b border-gray-100 pb-4">

              <p className="text-xs font-bold text-gray-500">
                E-mail
              </p>

              <p className="mt-2 break-all text-sm font-black">
                {perfil.email}
              </p>

            </div>

            {/* CADASTRADO EM */}

            <div>

              <p className="text-xs font-bold text-gray-500">
                Cliente desde
              </p>

              <p className="mt-2 text-sm font-black">
                {formatarData(perfil.criadoEm)}
              </p>

            </div>

          </div>

        </section>

        {/* =========================================== */}
        {/* ESTADIA                                    */}
        {/* =========================================== */}

        <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 sm:p-8">

          <h2 className="text-xl font-black text-amber-950">
            🏡 Minha estadia
          </h2>

          <p className="mt-4 text-sm leading-7 text-amber-900">
            O número do chalé será informado
            sempre que você realizar uma nova
            consulta pelo cardápio.
          </p>

          <p className="mt-3 text-sm leading-7 text-amber-900">
            Assim, você poderá continuar utilizando
            a mesma conta mesmo que volte futuramente
            e fique hospedado em outro chalé.
          </p>

        </section>

        {/* =========================================== */}
        {/* CONSULTAS                                 */}
        {/* =========================================== */}

        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">

          <h2 className="text-xl font-black">
            📋 Minhas consultas
          </h2>

          <p className="mt-4 text-sm leading-7 text-gray-600">
            Estamos preparando o histórico de consultas
            vinculado ao seu ID de cliente.
          </p>

          <p className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs leading-6 text-blue-900">
            Uma consulta não representa uma compra,
            pagamento ou entrega confirmada.
          </p>

        </section>

        {/* =========================================== */}
        {/* AÇÕES                                     */}
        {/* =========================================== */}

        <div className="mt-8 grid gap-3 sm:grid-cols-2">

          <Link
            to="/cardapio"
            className="flex items-center justify-center rounded-xl bg-[#19352b] px-5 py-4 text-center text-sm font-black text-white transition hover:bg-[#28533e]"
          >
            🍽️ Acessar cardápio
          </Link>

          <button
            type="button"
            onClick={sairDaConta}
            disabled={saindo}
            className="rounded-xl border border-red-200 bg-white px-5 py-4 text-sm font-black text-red-700 transition hover:bg-red-50 disabled:opacity-50"
          >
            {saindo
              ? "Saindo..."
              : "🚪 Sair da minha conta"}
          </button>

        </div>

        {/* ERRO AO SAIR */}

        {erro && (

          <p
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800"
          >
            ⚠️ {erro}
          </p>

        )}

        {/* =========================================== */}
        {/* RODAPÉ                                     */}
        {/* =========================================== */}

        <p className="mt-8 text-center text-xs leading-6 text-gray-500">
          Império Chalés • Sabores da Chapada
        </p>

      </div>

    </main>
  );
}

export default ClientePerfil;