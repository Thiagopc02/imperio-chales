
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  type User,
} from "firebase/auth";

import {
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { auth, db } from "../firebase/config";

// ======================================================
// TIPOS
// ======================================================

type DadosCadastro = {
  nomeCompleto: string;
  cpf: string;
  celular: string;
  email: string;
};

type CadastroPendente = {
  uid: string;
  dados: DadosCadastro;
};

// ======================================================
// FUNÇÕES DE FORMATAÇÃO
// ======================================================

function apenasNumeros(valor: string): string {
  return valor.replace(/\D/g, "");
}

function formatarCPF(valor: string): string {
  const numeros = apenasNumeros(valor).slice(0, 11);

  return numeros
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function formatarCelular(valor: string): string {
  const numeros = apenasNumeros(valor).slice(0, 11);

  if (numeros.length <= 2) {
    return numeros.length > 0
      ? `(${numeros}`
      : "";
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

// ======================================================
// VALIDAÇÃO DE CPF
// ======================================================

function cpfValido(valor: string): boolean {
  const cpf = apenasNumeros(valor);

  if (cpf.length !== 11) {
    return false;
  }

  // Rejeita sequências como 00000000000.
  if (/^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  let soma = 0;

  for (let i = 0; i < 9; i++) {
    soma += Number(cpf[i]) * (10 - i);
  }

  let primeiroDigito = (soma * 10) % 11;

  if (primeiroDigito === 10) {
    primeiroDigito = 0;
  }

  if (primeiroDigito !== Number(cpf[9])) {
    return false;
  }

  soma = 0;

  for (let i = 0; i < 10; i++) {
    soma += Number(cpf[i]) * (11 - i);
  }

  let segundoDigito = (soma * 10) % 11;

  if (segundoDigito === 10) {
    segundoDigito = 0;
  }

  return segundoDigito === Number(cpf[10]);
}

// ======================================================
// TRATAMENTO DOS ERROS DO FIREBASE
// ======================================================

function obterCodigoErro(erro: unknown): string {
  if (
    erro !== null &&
    typeof erro === "object" &&
    "code" in erro &&
    typeof erro.code === "string"
  ) {
    return erro.code;
  }

  return "";
}

function mensagemErro(erro: unknown): string {
  const codigo = obterCodigoErro(erro);

  switch (codigo) {
    case "auth/email-already-in-use":
      return (
        "Este e-mail já está cadastrado. " +
        "Entre na sua conta utilizando a página de login."
      );

    case "auth/invalid-email":
      return "O e-mail informado é inválido.";

    case "auth/weak-password":
      return "A senha é muito fraca. Escolha uma senha mais segura.";

    case "auth/operation-not-allowed":
      return (
        "O cadastro por e-mail e senha não está habilitado " +
        "no Firebase Authentication."
      );

    case "auth/network-request-failed":
      return (
        "Não foi possível conectar ao Firebase. " +
        "Verifique sua conexão com a internet."
      );

    case "auth/too-many-requests":
      return (
        "Muitas tentativas foram realizadas. " +
        "Aguarde alguns minutos antes de tentar novamente."
      );

    case "permission-denied":
    case "firestore/permission-denied":
      return (
        "O Firestore não permitiu salvar o perfil. " +
        "Precisamos conferir as regras da coleção clientes."
      );

    default:
      return (
        "Não foi possível concluir esta operação. " +
        "Confira os dados e tente novamente."
      );
  }
}

// ======================================================
// SALVAR PERFIL PRIVADO
// ======================================================

async function salvarPerfil(
  usuario: User,
  dados: DadosCadastro
): Promise<void> {
  // Confere se a sessão continua pertencendo
  // ao usuário cujo perfil será salvo.

  if (auth.currentUser?.uid !== usuario.uid) {
    throw new Error(
      "A sessão mudou durante o cadastro."
    );
  }

  await setDoc(
    doc(db, "clientes", usuario.uid),
    {
      uid: usuario.uid,

      nomeCompleto: dados.nomeCompleto,

      cpf: dados.cpf,

      celular: dados.celular,

      email: dados.email,

      tipo: "cliente",

      criadoEm: serverTimestamp(),

      atualizadoEm: serverTimestamp(),
    }
  );
}

// ======================================================
// COMPONENTE PRINCIPAL
// ======================================================

export function ClienteCadastro() {
  // ----------------------------------------------------
  // CAMPOS
  // ----------------------------------------------------

  const [nomeCompleto, setNomeCompleto] = useState("");

  const [cpf, setCpf] = useState("");

  const [celular, setCelular] = useState("");

  const [email, setEmail] = useState("");

  const [senha, setSenha] = useState("");

  const [confirmarSenha, setConfirmarSenha] =
    useState("");

  // ----------------------------------------------------
  // INTERFACE
  // ----------------------------------------------------

  const [mostrarSenha, setMostrarSenha] =
    useState(false);

  const [aceitouPrivacidade, setAceitouPrivacidade] =
    useState(false);

  const [carregando, setCarregando] =
    useState(false);

  const [erro, setErro] =
    useState("");

  const [aviso, setAviso] =
    useState("");

  const [cadastroConcluido, setCadastroConcluido] =
    useState(false);

  // Guarda temporariamente os dados em memória
  // se o Authentication criar a conta, mas o
  // Firestore não conseguir salvar o perfil.
  //
  // Não usamos localStorage para guardar CPF.

  const [
    cadastroPendente,
    setCadastroPendente,
  ] = useState<CadastroPendente | null>(null);

  // ====================================================
  // FINALIZAR CADASTRO APÓS SALVAR O PERFIL
  // ====================================================

  async function finalizarCadastro(
    usuario: User,
    dados: DadosCadastro
  ): Promise<void> {
    // Atualizar o nome no Authentication é
    // complementar. O perfil no Firestore
    // continua sendo a fonte dos dados cadastrais.

    try {
      await updateProfile(usuario, {
        displayName: dados.nomeCompleto,
      });
    } catch {
      // Uma falha aqui não desfaz o perfil já salvo.
    }

    try {
      await sendEmailVerification(usuario);

      setAviso(
        "Conta criada com sucesso! Enviamos um e-mail de verificação. Confira sua caixa de entrada."
      );
    } catch {
      setAviso(
        "Conta criada com sucesso! Não conseguimos enviar o e-mail de verificação agora. Você poderá solicitar outro posteriormente."
      );
    }

    setCadastroPendente(null);

    setCadastroConcluido(true);

    // Evita manter a senha preenchida depois
    // da criação da conta.

    setSenha("");
    setConfirmarSenha("");
  }

  // ====================================================
  // CADASTRAR CLIENTE
  // ====================================================

  async function cadastrar(
    evento: FormEvent<HTMLFormElement>
  ): Promise<void> {
    evento.preventDefault();

    if (
      carregando ||
      cadastroConcluido ||
      cadastroPendente !== null
    ) {
      return;
    }

    setErro("");
    setAviso("");

    const dados: DadosCadastro = {
      nomeCompleto: nomeCompleto.trim().replace(/\s+/g, " "),

      cpf: apenasNumeros(cpf),

      celular: apenasNumeros(celular),

      email: email.trim().toLowerCase(),
    };

    // --------------------------------------------------
    // VALIDAR NOME
    // --------------------------------------------------

    if (
      dados.nomeCompleto.length < 3 ||
      !dados.nomeCompleto.includes(" ")
    ) {
      setErro(
        "Informe seu nome completo, incluindo nome e sobrenome."
      );
      return;
    }

    // --------------------------------------------------
    // VALIDAR CPF
    // --------------------------------------------------

    if (!cpfValido(dados.cpf)) {
      setErro("Informe um CPF válido.");
      return;
    }

    // --------------------------------------------------
    // VALIDAR CELULAR
    // --------------------------------------------------

    if (
      dados.celular.length !== 11 ||
      dados.celular[2] !== "9"
    ) {
      setErro(
        "Informe um celular brasileiro válido com DDD e nove dígitos."
      );
      return;
    }

    // --------------------------------------------------
    // VALIDAR E-MAIL
    // --------------------------------------------------

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        dados.email
      )
    ) {
      setErro("Informe um endereço de e-mail válido.");
      return;
    }

    // --------------------------------------------------
    // VALIDAR SENHA
    // --------------------------------------------------

    if (senha.length < 8) {
      setErro(
        "A senha deve possuir pelo menos oito caracteres."
      );
      return;
    }

    if (senha !== confirmarSenha) {
      setErro(
        "A senha e a confirmação de senha não coincidem."
      );
      return;
    }

    // --------------------------------------------------
    // CONFIRMAÇÃO DE PRIVACIDADE
    // --------------------------------------------------

    if (!aceitouPrivacidade) {
      setErro(
        "Leia as informações de privacidade antes de continuar."
      );
      return;
    }

    setCarregando(true);

    let usuarioCriado: User | null = null;

    try {
      // ------------------------------------------------
      // 1. CRIAR CONTA NO AUTHENTICATION
      // ------------------------------------------------

      const credencial =
        await createUserWithEmailAndPassword(
          auth,
          dados.email,
          senha
        );

      usuarioCriado = credencial.user;

      // ------------------------------------------------
      // 2. GUARDAR ESTADO DE CRIAÇÃO
      // ------------------------------------------------

      // A conta já existe no Authentication.
      // Se o Firestore falhar, não repetiremos
      // createUserWithEmailAndPassword.

      setCadastroPendente({
        uid: usuarioCriado.uid,
        dados,
      });

      // ------------------------------------------------
      // 3. GRAVAR PERFIL NO FIRESTORE
      // ------------------------------------------------

      await salvarPerfil(
        usuarioCriado,
        dados
      );

      // ------------------------------------------------
      // 4. CONCLUIR CADASTRO
      // ------------------------------------------------

      await finalizarCadastro(
        usuarioCriado,
        dados
      );

    } catch (erroCadastro) {
      console.error(
        "Erro ao cadastrar cliente:",
        erroCadastro
      );

      if (usuarioCriado) {
        // O Authentication já criou o usuário.
        // Não fazemos novo cadastro.

        setErro(
          "Sua conta foi criada no Firebase Authentication, " +
          "mas o perfil ainda não foi concluído. " +
          "Clique em 'Concluir meu cadastro' para tentar " +
          "salvar os dados novamente."
        );

      } else {
        // A conta não foi criada.

        setErro(
          mensagemErro(erroCadastro)
        );
      }

    } finally {
      setCarregando(false);
    }
  }

  // ====================================================
  // RECUPERAR SALVAMENTO DO PERFIL
  // ====================================================

  async function concluirCadastroPendente(): Promise<void> {
    if (
      carregando ||
      !cadastroPendente
    ) {
      return;
    }

    setCarregando(true);

    setErro("");
    setAviso("");

    const usuario = auth.currentUser;

    try {
      if (
        !usuario ||
        usuario.uid !== cadastroPendente.uid
      ) {
        setErro(
          "A sessão da conta mudou. Entre novamente com o e-mail e a senha utilizados no cadastro. Não crie uma segunda conta."
        );
        return;
      }

      await salvarPerfil(
        usuario,
        cadastroPendente.dados
      );

      await finalizarCadastro(
        usuario,
        cadastroPendente.dados
      );

    } catch (erroRecuperacao) {
      console.error(
        "Erro ao concluir perfil:",
        erroRecuperacao
      );

      setErro(
        `Não foi possível concluir o perfil. ${mensagemErro(
          erroRecuperacao
        )}`
      );

    } finally {
      setCarregando(false);
    }
  }

  // ====================================================
  // INTERFACE
  // ====================================================

  return (
    <main className="min-h-screen bg-[#f8f6ef] px-4 py-8 text-[#19352b] sm:py-12">

      <div className="mx-auto w-full max-w-xl">

        {/* =========================================== */}
        {/* CABEÇALHO                                  */}
        {/* =========================================== */}

        <div className="mb-7 text-center">

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

          <h1 className="mt-3 text-3xl font-black">
            Criar minha conta
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-600">
            Cadastre-se uma única vez e utilize sua conta
            sempre que voltar aos Império Chalés.
          </p>

        </div>

        {/* =========================================== */}
        {/* CADASTRO CONCLUÍDO                         */}
        {/* =========================================== */}

        {cadastroConcluido ? (

          <section className="rounded-3xl border border-green-200 bg-white p-6 text-center shadow-xl sm:p-8">

            <div className="text-5xl">
              ✅
            </div>

            <h2 className="mt-5 text-2xl font-black text-green-800">
              Sua conta foi criada!
            </h2>

            <p className="mt-4 text-sm leading-7 text-gray-600">
              Seu cadastro foi salvo e sua conta está
              conectada neste navegador.
            </p>

            {aviso && (
              <p className="mt-4 rounded-xl bg-green-50 p-4 text-sm leading-6 text-green-900">
                {aviso}
              </p>
            )}

            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-xs leading-6 text-amber-900">
              O perfil completo e o carrinho com
              autenticação serão integrados nas
              próximas etapas. O número do chalé
              será informado a cada estadia.
            </div>

            <Link
              to="/cardapio"
              className="mt-6 block rounded-xl bg-[#19352b] px-6 py-4 text-sm font-black text-white"
            >
              Voltar ao cardápio →
            </Link>

          </section>

        ) : (

          /* ========================================= */
          /* FORMULÁRIO                               */
          /* ========================================= */

          <form
            onSubmit={cadastrar}
            className="rounded-3xl border border-gray-200 bg-white p-5 shadow-xl sm:p-8"
          >

            <div className="mb-6">

              <h2 className="text-xl font-black">
                👤 Dados pessoais
              </h2>

              <p className="mt-2 text-xs leading-6 text-gray-500">
                Os dados abaixo serão utilizados para
                criar e identificar sua conta.
              </p>

            </div>

            {/* ======================================= */}
            {/* ERROS                                  */}
            {/* ======================================= */}

            {erro && (

              <div
                role="alert"
                className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-800"
              >
                ⚠️ {erro}
              </div>

            )}

            {/* ======================================= */}
            {/* RECUPERAR CADASTRO                     */}
            {/* ======================================= */}

            {cadastroPendente && (

              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">

                <p className="text-sm font-black text-amber-950">
                  Sua conta já foi criada
                </p>

                <p className="mt-2 text-xs leading-6 text-amber-900">
                  Precisamos apenas concluir o
                  salvamento do seu perfil.
                  Não faça outro cadastro.
                </p>

                <button
                  type="button"
                  disabled={carregando}
                  onClick={concluirCadastroPendente}
                  className="mt-4 w-full rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-[#19352b] disabled:opacity-50"
                >
                  {carregando
                    ? "Concluindo..."
                    : "Concluir meu cadastro"}
                </button>

              </div>

            )}

            <div className="space-y-5">

              {/* ===================================== */}
              {/* NOME                                 */}
              {/* ===================================== */}

              <div>

                <label
                  htmlFor="clienteNome"
                  className="block text-sm font-bold"
                >
                  Nome completo *
                </label>

                <input
                  id="clienteNome"
                  type="text"
                  autoComplete="name"
                  required
                  maxLength={150}
                  value={nomeCompleto}
                  onChange={(evento) =>
                    setNomeCompleto(evento.target.value)
                  }
                  placeholder="Seu nome e sobrenome"
                  disabled={
                    carregando ||
                    cadastroPendente !== null
                  }
                  className="mt-2 w-full rounded-xl border border-gray-200 p-4 text-sm outline-none focus:border-amber-400 disabled:bg-gray-100"
                />

              </div>

              {/* ===================================== */}
              {/* CPF                                  */}
              {/* ===================================== */}

              <div>

                <label
                  htmlFor="clienteCPF"
                  className="block text-sm font-bold"
                >
                  CPF *
                </label>

                <input
                  id="clienteCPF"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  required
                  maxLength={14}
                  value={cpf}
                  onChange={(evento) =>
                    setCpf(
                      formatarCPF(evento.target.value)
                    )
                  }
                  placeholder="000.000.000-00"
                  disabled={
                    carregando ||
                    cadastroPendente !== null
                  }
                  className="mt-2 w-full rounded-xl border border-gray-200 p-4 text-sm outline-none focus:border-amber-400 disabled:bg-gray-100"
                />

                <p className="mt-2 text-xs text-gray-500">
                  Seu CPF não será enviado aos restaurantes.
                  O formato e os dígitos serão validados,
                  mas isso não comprova sua identidade.
                </p>

              </div>

              {/* ===================================== */}
              {/* CELULAR                              */}
              {/* ===================================== */}

              <div>

                <label
                  htmlFor="clienteCelular"
                  className="block text-sm font-bold"
                >
                  Celular com DDD *
                </label>

                <input
                  id="clienteCelular"
                  type="tel"
                  autoComplete="tel-national"
                  required
                  maxLength={15}
                  value={celular}
                  onChange={(evento) =>
                    setCelular(
                      formatarCelular(evento.target.value)
                    )
                  }
                  placeholder="(62) 99999-9999"
                  disabled={
                    carregando ||
                    cadastroPendente !== null
                  }
                  className="mt-2 w-full rounded-xl border border-gray-200 p-4 text-sm outline-none focus:border-amber-400 disabled:bg-gray-100"
                />

              </div>

              {/* ===================================== */}
              {/* EMAIL                                */}
              {/* ===================================== */}

              <div>

                <label
                  htmlFor="clienteEmail"
                  className="block text-sm font-bold"
                >
                  E-mail *
                </label>

                <input
                  id="clienteEmail"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={150}
                  value={email}
                  onChange={(evento) =>
                    setEmail(evento.target.value)
                  }
                  placeholder="seuemail@exemplo.com"
                  disabled={
                    carregando ||
                    cadastroPendente !== null
                  }
                  className="mt-2 w-full rounded-xl border border-gray-200 p-4 text-sm outline-none focus:border-amber-400 disabled:bg-gray-100"
                />

              </div>

              {/* ===================================== */}
              {/* SENHA                                */}
              {/* ===================================== */}

              <div>

                <label
                  htmlFor="clienteSenha"
                  className="block text-sm font-bold"
                >
                  Senha *
                </label>

                <div className="relative mt-2">

                  <input
                    id="clienteSenha"
                    type={
                      mostrarSenha
                        ? "text"
                        : "password"
                    }
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={senha}
                    onChange={(evento) =>
                      setSenha(evento.target.value)
                    }
                    placeholder="Mínimo de 8 caracteres"
                    disabled={
                      carregando ||
                      cadastroPendente !== null
                    }
                    className="w-full rounded-xl border border-gray-200 p-4 pr-20 text-sm outline-none focus:border-amber-400 disabled:bg-gray-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setMostrarSenha(
                        (anterior) => !anterior
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-black"
                  >
                    {mostrarSenha
                      ? "Ocultar"
                      : "Mostrar"}
                  </button>

                </div>

              </div>

              {/* ===================================== */}
              {/* CONFIRMAR SENHA                      */}
              {/* ===================================== */}

              <div>

                <label
                  htmlFor="clienteConfirmarSenha"
                  className="block text-sm font-bold"
                >
                  Confirmar senha *
                </label>

                <input
                  id="clienteConfirmarSenha"
                  type={
                    mostrarSenha
                      ? "text"
                      : "password"
                  }
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirmarSenha}
                  onChange={(evento) =>
                    setConfirmarSenha(
                      evento.target.value
                    )
                  }
                  placeholder="Repita sua senha"
                  disabled={
                    carregando ||
                    cadastroPendente !== null
                  }
                  className="mt-2 w-full rounded-xl border border-gray-200 p-4 text-sm outline-none focus:border-amber-400 disabled:bg-gray-100"
                />

              </div>

            </div>

            {/* ======================================= */}
            {/* CHALÉ                                  */}
            {/* ======================================= */}

            <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-4">

              <h3 className="text-sm font-black text-amber-950">
                🏡 Qual é o número do seu chalé?
              </h3>

              <p className="mt-2 text-xs leading-6 text-amber-900">
                Você informará o número do chalé
                quando fizer sua consulta. Assim,
                poderá utilizar esta mesma conta em
                futuras estadias, mesmo que fique em
                outra unidade.
              </p>

            </div>

            {/* ======================================= */}
            {/* PRIVACIDADE                            */}
            {/* ======================================= */}

            <div className="mt-7 rounded-2xl border border-gray-200 bg-gray-50 p-4">

              <h3 className="text-sm font-black">
                🔒 Privacidade dos seus dados
              </h3>

              <p className="mt-2 text-xs leading-6 text-gray-600">
                Nome, CPF, celular e e-mail serão
                utilizados para criar e manter sua
                conta de cliente. O CPF não será
                incluído nas consultas enviadas aos
                restaurantes. Quando você solicitar
                atendimento, o parceiro receberá
                apenas os dados necessários para
                identificar e atender sua consulta.
              </p>

              <p className="mt-2 text-xs leading-6 text-amber-800">
                Antes de liberar este cadastro para
                hóspedes reais, o estabelecimento
                precisa disponibilizar uma Política
                de Privacidade completa, informando
                as finalidades, a retenção dos dados
                e os canais de atendimento.
              </p>

            </div>

            <label className="mt-5 flex cursor-pointer items-start gap-3">

              <input
                type="checkbox"
                checked={aceitouPrivacidade}
                onChange={(evento) =>
                  setAceitouPrivacidade(
                    evento.target.checked
                  )
                }
                disabled={
                  carregando ||
                  cadastroPendente !== null
                }
                className="mt-1 h-4 w-4 accent-[#19352b]"
              />

              <span className="text-xs leading-6 text-gray-600">
                Li as informações sobre privacidade
                apresentadas acima.
              </span>

            </label>

            {/* ======================================= */}
            {/* CADASTRAR                              */}
            {/* ======================================= */}

            <button
              type="submit"
              disabled={
                carregando ||
                cadastroConcluido ||
                cadastroPendente !== null ||
                !aceitouPrivacidade
              }
              className="mt-7 w-full rounded-xl bg-[#19352b] px-6 py-4 text-sm font-black text-white transition hover:bg-[#28533e] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {carregando
                ? "Criando sua conta..."
                : "Criar minha conta →"}
            </button>

            {/* ======================================= */}
            {/* LOGIN                                  */}
            {/* ======================================= */}

            <div className="mt-7 border-t border-gray-100 pt-6 text-center">

              <p className="text-sm text-gray-600">
                Já possui uma conta?
              </p>

              <Link
                to="/cliente/login"
                className="mt-3 inline-block text-sm font-black underline underline-offset-4"
              >
                Entrar na minha conta
              </Link>

            </div>

          </form>

        )}

        {/* =========================================== */}
        {/* VOLTAR                                     */}
        {/* =========================================== */}

        <Link
          to="/cardapio"
          className="mt-7 block text-center text-sm font-bold text-gray-600"
        >
          ← Voltar ao cardápio
        </Link>

      </div>

    </main>
  );
}

export default ClienteCadastro;