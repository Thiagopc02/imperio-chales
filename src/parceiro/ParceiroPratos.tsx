import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  type Timestamp,
} from "firebase/firestore";

import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";

import {
  auth,
  db,
} from "../firebase/config";

import restauranteEmoji from "../components/catalogo/restaurante-emoji.png";

/* =========================================================
   TIPOS
========================================================= */

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

/* =========================================================
   ESTADO INICIAL
========================================================= */

const formularioInicial: DadosFormulario = {
  nome: "",
  preco: "",
  pessoas: "",
  descricao: "",
};

/* =========================================================
   FUNÇÕES
========================================================= */

function formatarMoeda(
  valor: number
): string {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  ).format(valor);
}

function converterPreco(
  valor: string
): number {
  const texto = valor.trim();

  if (
    !/^\d+(?:,\d{1,2})?$/.test(texto) &&
    !/^\d+\.\d{1,2}$/.test(texto) &&
    !/^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(texto)
  ) {
    return NaN;
  }

  const normalizado =
    texto.includes(",")
      ? texto
          .replace(/\./g, "")
          .replace(",", ".")
      : texto;

  return Number(normalizado);
}

function formatarData(
  data?: Timestamp
): string {
  if (!data?.toDate) {
    return "Aguardando registro";
  }

  return data
    .toDate()
    .toLocaleString(
      "pt-BR",
      {
        dateStyle: "short",
        timeStyle: "short",
      }
    );
}

function obterMensagemErro(
  erro: unknown
): string {
  const codigo =
    typeof erro === "object" &&
    erro !== null &&
    "code" in erro
      ? String(
          (
            erro as {
              code: unknown;
            }
          ).code
        )
      : "";

  if (
    codigo ===
    "permission-denied"
  ) {
    return (
      "O Firebase não autorizou esta operação. " +
      "Confirme se o estabelecimento está aprovado."
    );
  }

  if (
    codigo ===
    "unavailable"
  ) {
    return (
      "Não foi possível conectar ao Firebase. " +
      "Verifique sua conexão."
    );
  }

  if (
    codigo ===
    "unauthenticated"
  ) {
    return (
      "Sua sessão expirou. Faça login novamente."
    );
  }

  return "Ocorreu um erro. Tente novamente.";
}

function informacoesStatus(
  status: StatusPrato
) {
  switch (status) {
    case "aprovado":
      return {
        titulo: "APROVADO",
        classe:
          "border-[#00ef78]/30 bg-[#00ef78]/10 text-[#00ef78]",
      };

    case "rejeitado":
      return {
        titulo:
          "PRECISA DE CORREÇÃO",
        classe:
          "border-red-500/30 bg-red-500/10 text-red-400",
      };

    default:
      return {
        titulo:
          "EM ANÁLISE",
        classe:
          "border-[#ffd429]/30 bg-[#ffd429]/10 text-[#ffd429]",
      };
  }
}

/* =========================================================
   COMPONENTE
========================================================= */

export function ParceiroPratos() {
  const navigate =
    useNavigate();

  /* =======================================================
     AUTENTICAÇÃO
  ======================================================= */

  const [
    usuario,
    setUsuario,
  ] =
    useState<User | null>(
      null
    );

  const [
    verificandoSessao,
    setVerificandoSessao,
  ] =
    useState(true);

  /* =======================================================
     PRATOS
  ======================================================= */

  const [
    pratos,
    setPratos,
  ] =
    useState<Prato[]>([]);

  const [
    carregandoPratos,
    setCarregandoPratos,
  ] =
    useState(true);

  /* =======================================================
     FORMULÁRIO
  ======================================================= */

  const [
    formulario,
    setFormulario,
  ] =
    useState<DadosFormulario>(
      formularioInicial
    );

  const [
    editandoId,
    setEditandoId,
  ] =
    useState<
      string | null
    >(null);

  const [
    salvando,
    setSalvando,
  ] =
    useState(false);

  const [
    erro,
    setErro,
  ] =
    useState("");

  const [
    mensagem,
    setMensagem,
  ] =
    useState("");

  /* =======================================================
     AUTENTICAÇÃO
  ======================================================= */

  useEffect(() => {
    const cancelarAutenticacao =
      onAuthStateChanged(
        auth,

        (
          usuarioAtual
        ) => {
          setUsuario(
            usuarioAtual
          );

          setVerificandoSessao(
            false
          );

          if (
            !usuarioAtual
          ) {
            navigate(
              "/parceiro/login",
              {
                replace: true,
              }
            );
          }
        }
      );

    return () =>
      cancelarAutenticacao();
  }, [navigate]);

  /* =======================================================
     CONSULTAR PRATOS
  ======================================================= */

  useEffect(() => {
    if (!usuario) {
      setPratos([]);

      setCarregandoPratos(
        false
      );

      return;
    }

    setCarregandoPratos(
      true
    );

    const referenciaPratos =
      collection(
        db,
        "restaurantes",
        usuario.uid,
        "pratos"
      );

    const cancelarConsulta =
      onSnapshot(
        referenciaPratos,

        (
          resultado
        ) => {
          const pratosEncontrados:
            Prato[] =
            resultado.docs.map(
              (
                documento
              ) => {
                const dados =
                  documento.data();

                return {
                  id:
                    documento.id,

                  nome:
                    typeof dados.nome ===
                    "string"
                      ? dados.nome
                      : "",

                  preco:
                    typeof dados.preco ===
                    "number"
                      ? dados.preco
                      : 0,

                  pessoas:
                    typeof dados.pessoas ===
                    "number"
                      ? dados.pessoas
                      : 1,

                  descricao:
                    typeof dados.descricao ===
                    "string"
                      ? dados.descricao
                      : "",

                  status:
                    dados.status ===
                      "aprovado" ||
                    dados.status ===
                      "rejeitado"
                      ? dados.status
                      : "pendente",

                  imagemUrl:
                    typeof dados.imagemUrl ===
                    "string"
                      ? dados.imagemUrl
                      : "",

                  motivoRecusa:
                    typeof dados.motivoRecusa ===
                    "string"
                      ? dados.motivoRecusa
                      : "",

                  criadoEm:
                    dados.criadoEm as
                      | Timestamp
                      | undefined,

                  atualizadoEm:
                    dados.atualizadoEm as
                      | Timestamp
                      | undefined,
                };
              }
            );

          pratosEncontrados.sort(
            (
              a,
              b
            ) => {
              const dataA =
                a.criadoEm?.toMillis() ??
                0;

              const dataB =
                b.criadoEm?.toMillis() ??
                0;

              return (
                dataB -
                dataA
              );
            }
          );

          setPratos(
            pratosEncontrados
          );

          setCarregandoPratos(
            false
          );
        },

        (
          erroConsulta
        ) => {
          console.error(
            "Erro ao consultar pratos:",
            erroConsulta
          );

          setErro(
            obterMensagemErro(
              erroConsulta
            )
          );

          setCarregandoPratos(
            false
          );
        }
      );

    return () =>
      cancelarConsulta();
  }, [usuario]);

  /* =======================================================
     FORMULÁRIO
  ======================================================= */

  function atualizarCampo(
    campo:
      keyof DadosFormulario,

    valor: string
  ) {
    setFormulario(
      (
        anterior
      ) => ({
        ...anterior,

        [campo]:
          valor,
      })
    );

    setErro("");

    setMensagem("");
  }

  function limparFormulario() {
    setFormulario(
      formularioInicial
    );

    setEditandoId(
      null
    );

    setErro("");
  }

  /* =======================================================
     SALVAR
  ======================================================= */

  async function salvarPrato(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (salvando) {
      return;
    }

    setErro("");

    setMensagem("");

    const usuarioAtual =
      auth.currentUser;

    if (!usuarioAtual) {
      setErro(
        "Sua sessão não está disponível. Faça login novamente."
      );

      return;
    }

    const nomeLimpo =
      formulario.nome.trim();

    const descricaoLimpa =
      formulario.descricao.trim();

    const precoNumerico =
      converterPreco(
        formulario.preco
      );

    const pessoasNumerico =
      Number(
        formulario.pessoas
      );

    /* VALIDAR NOME */

    if (
      nomeLimpo.length <
        3 ||
      nomeLimpo.length >
        120
    ) {
      setErro(
        "O nome do prato deve ter entre 3 e 120 caracteres."
      );

      return;
    }

    /* VALIDAR PREÇO */

    if (
      !Number.isFinite(
        precoNumerico
      ) ||
      precoNumerico <=
        0 ||
      precoNumerico >
        100000
    ) {
      setErro(
        "Informe um preço válido maior que zero."
      );

      return;
    }

    /* VALIDAR PESSOAS */

    if (
      !/^\d+$/.test(
        formulario.pessoas
      ) ||
      !Number.isInteger(
        pessoasNumerico
      ) ||
      pessoasNumerico <
        1 ||
      pessoasNumerico >
        100
    ) {
      setErro(
        "Informe entre 1 e 100 pessoas."
      );

      return;
    }

    /* VALIDAR DESCRIÇÃO */

    if (
      descricaoLimpa.length <
        10 ||
      descricaoLimpa.length >
        1000
    ) {
      setErro(
        "A descrição deve ter entre 10 e 1000 caracteres."
      );

      return;
    }

    const dadosPrato = {
      nome:
        nomeLimpo,

      preco:
        precoNumerico,

      pessoas:
        pessoasNumerico,

      descricao:
        descricaoLimpa,

      status:
        "pendente" as const,
    };

    setSalvando(
      true
    );

    try {
      if (
        editandoId
      ) {
        const referenciaPrato =
          doc(
            db,

            "restaurantes",

            usuarioAtual.uid,

            "pratos",

            editandoId
          );

        await updateDoc(
          referenciaPrato,
          {
            ...dadosPrato,

            atualizadoEm:
              serverTimestamp(),
          }
        );

        setMensagem(
          "Prato atualizado e enviado novamente para análise."
        );
      } else {
        const referenciaPratos =
          collection(
            db,

            "restaurantes",

            usuarioAtual.uid,

            "pratos"
          );

        await addDoc(
          referenciaPratos,
          {
            ...dadosPrato,

            criadoEm:
              serverTimestamp(),

            atualizadoEm:
              serverTimestamp(),
          }
        );

        setMensagem(
          "Prato enviado para análise."
        );
      }

      limparFormulario();

      window.scrollTo({
        top: 0,

        behavior:
          "smooth",
      });
    } catch (
      erroSalvar
    ) {
      console.error(
        "Erro ao salvar prato:",
        erroSalvar
      );

      setErro(
        obterMensagemErro(
          erroSalvar
        )
      );
    } finally {
      setSalvando(
        false
      );
    }
  }

  /* =======================================================
     EDITAR
  ======================================================= */

  function editarPrato(
    prato: Prato
  ) {
    setEditandoId(
      prato.id
    );

    setFormulario({
      nome:
        prato.nome,

      preco:
        prato.preco
          .toFixed(2)
          .replace(
            ".",
            ","
          ),

      pessoas:
        String(
          prato.pessoas
        ),

      descricao:
        prato.descricao,
    });

    setErro("");

    setMensagem("");

    document
      .getElementById(
        "formulario-prato"
      )
      ?.scrollIntoView({
        behavior:
          "smooth",

        block:
          "start",
      });
  }

  function cancelarEdicao() {
    limparFormulario();

    setMensagem(
      "Edição cancelada."
    );
  }

  /* =======================================================
     ESTATÍSTICAS
  ======================================================= */

  const totalPendentes =
    pratos.filter(
      (
        prato
      ) =>
        prato.status ===
        "pendente"
    ).length;

  const totalAprovados =
    pratos.filter(
      (
        prato
      ) =>
        prato.status ===
        "aprovado"
    ).length;

  const totalRejeitados =
    pratos.filter(
      (
        prato
      ) =>
        prato.status ===
        "rejeitado"
    ).length;

  /* =======================================================
     ESTILOS
  ======================================================= */

  const classeLabel = `
    block

    text-[10px]
    font-black

    uppercase

    tracking-[0.14em]

    text-white/60
  `;

  const classeInput = `
    mt-2

    w-full

    rounded-xl

    border
    border-white/10

    bg-[#111111]

    px-4
    py-4

    text-sm
    font-semibold

    text-white

    outline-none

    transition

    placeholder:text-white/20

    focus:border-red-500/70

    disabled:opacity-50
  `;

  /* =======================================================
     CARREGAMENTO
  ======================================================= */

  if (
    verificandoSessao
  ) {
    return (
      <main
        className="
          flex
          min-h-screen

          items-center
          justify-center

          bg-black

          px-4
        "
      >
        <p
          className="
            text-sm
            font-black

            uppercase

            tracking-widest

            text-white/50
          "
        >
          Carregando...
        </p>
      </main>
    );
  }

  if (!usuario) {
    return null;
  }

  /* =======================================================
     INTERFACE
  ======================================================= */

  return (
    <main
      className="
        min-h-screen

        bg-black

        text-white
      "
      style={{
        fontFamily:
          "'Arial Black', 'Montserrat', Arial, sans-serif",
      }}
    >
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

          bg-black/95

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

            items-center
            justify-between

            gap-4
          "
        >
          <div
            className="
              flex
              items-center

              gap-3
            "
          >
            <img
              src="/coroa.png"
              alt="Império"
              draggable={false}
              className="
                h-9
                w-9

                object-contain
              "
            />

            <div>
              <p
                className="
                  text-[11px]
                  font-black

                  uppercase

                  text-white
                "
              >
                Portal do Parceiro
              </p>

              <p
                className="
                  mt-1

                  text-[7px]
                  font-black

                  uppercase

                  tracking-[0.20em]

                  text-red-500
                "
              >
                Meus pratos
              </p>
            </div>
          </div>

          <Link
            to="/parceiro/dashboard"
            className="
              rounded-xl

              border
              border-white/15

              bg-[#111]

              px-4
              py-3

              text-[9px]
              font-black

              uppercase

              text-white

              transition

              hover:border-red-500/50
            "
          >
            ← Painel
          </Link>
        </div>
      </header>

      {/* ===================================================
          CONTEÚDO
      =================================================== */}

      <div
        className="
          mx-auto

          max-w-6xl

          px-4
          py-8

          md:py-12
        "
      >
        {/* =================================================
            TÍTULO
        ================================================= */}

        <section>
          <p
            className="
              text-[9px]
              font-black

              uppercase

              tracking-[0.28em]

              text-red-500
            "
          >
            Cardápio
          </p>

          <h1
            className="
              mt-3

              text-4xl
              font-black

              uppercase

              leading-none

              text-white

              md:text-6xl
            "
          >
            MEUS{" "}
            <span
              className="
                text-red-500
              "
            >
              PRATOS
            </span>
          </h1>

          <p
            className="
              mt-4

              max-w-xl

              text-sm
              leading-6

              text-white/40
            "
          >
            Cadastre e atualize
            os pratos do seu
            estabelecimento.
          </p>
        </section>

        {/* =================================================
            RESUMO
        ================================================= */}

        <section
          className="
            mt-7

            grid
            grid-cols-3

            gap-3
          "
        >
          <div
            className="
              rounded-2xl

              border
              border-[#ffd429]/20

              bg-[#111]

              p-4

              text-center
            "
          >
            <p
              className="
                text-2xl
                font-black

                text-[#ffd429]
              "
            >
              {
                totalPendentes
              }
            </p>

            <p
              className="
                mt-1

                text-[8px]
                font-black

                uppercase

                text-white/35
              "
            >
              Em análise
            </p>
          </div>

          <div
            className="
              rounded-2xl

              border
              border-[#00ef78]/20

              bg-[#111]

              p-4

              text-center
            "
          >
            <p
              className="
                text-2xl
                font-black

                text-[#00ef78]
              "
            >
              {
                totalAprovados
              }
            </p>

            <p
              className="
                mt-1

                text-[8px]
                font-black

                uppercase

                text-white/35
              "
            >
              Aprovados
            </p>
          </div>

          <div
            className="
              rounded-2xl

              border
              border-red-500/20

              bg-[#111]

              p-4

              text-center
            "
          >
            <p
              className="
                text-2xl
                font-black

                text-red-500
              "
            >
              {
                totalRejeitados
              }
            </p>

            <p
              className="
                mt-1

                text-[8px]
                font-black

                uppercase

                text-white/35
              "
            >
              Correções
            </p>
          </div>
        </section>

        {/* =================================================
            MENSAGENS
        ================================================= */}

        {erro && (
          <div
            role="alert"
            className="
              mt-6

              rounded-xl

              border
              border-red-500/25

              bg-red-500/10

              p-4

              text-sm
              font-bold

              text-red-400
            "
          >
            {erro}
          </div>
        )}

        {mensagem && (
          <div
            role="status"
            className="
              mt-6

              rounded-xl

              border
              border-[#00ef78]/25

              bg-[#00ef78]/10

              p-4

              text-sm
              font-bold

              text-[#00ef78]
            "
          >
            {mensagem}
          </div>
        )}

        {/* =================================================
            FORMULÁRIO
        ================================================= */}

        <section
          id="formulario-prato"
          className="
            mt-8

            scroll-mt-24

            rounded-[24px]

            border
            border-white/10

            bg-[#0b0b0b]

            p-5

            sm:p-7
          "
        >
          <div
            className="
              flex
              flex-wrap

              items-end
              justify-between

              gap-3
            "
          >
            <div>
              <p
                className="
                  text-[8px]
                  font-black

                  uppercase

                  tracking-[0.20em]

                  text-red-500
                "
              >
                {
                  editandoId
                    ? "EDITANDO"
                    : "NOVO PRATO"
                }
              </p>

              <h2
                className="
                  mt-2

                  text-2xl
                  font-black

                  uppercase
                "
              >
                {editandoId
                  ? "EDITAR PRATO"
                  : "ADICIONAR PRATO"}
              </h2>
            </div>

            {editandoId && (
              <button
                type="button"
                onClick={
                  cancelarEdicao
                }
                disabled={
                  salvando
                }
                className="
                  text-[9px]
                  font-black

                  uppercase

                  text-white/40

                  hover:text-white
                "
              >
                Cancelar
              </button>
            )}
          </div>

          <form
            onSubmit={
              salvarPrato
            }
            className="
              mt-6

              space-y-5
            "
          >
            {/* NOME */}

            <div>
              <label
                htmlFor="nomePrato"
                className={
                  classeLabel
                }
              >
                NOME DO PRATO
              </label>

              <input
                id="nomePrato"
                required
                maxLength={
                  120
                }
                value={
                  formulario.nome
                }
                disabled={
                  salvando
                }
                onChange={(
                  event
                ) =>
                  atualizarCampo(
                    "nome",
                    event.target.value
                  )
                }
                placeholder="Ex.: Frango caipira com arroz"
                className={
                  classeInput
                }
              />
            </div>

            {/* PREÇO / PESSOAS */}

            <div
              className="
                grid
                gap-4

                sm:grid-cols-2
              "
            >
              <div>
                <label
                  htmlFor="precoPrato"
                  className={
                    classeLabel
                  }
                >
                  PREÇO
                </label>

                <input
                  id="precoPrato"
                  required
                  inputMode="decimal"
                  value={
                    formulario.preco
                  }
                  disabled={
                    salvando
                  }
                  onChange={(
                    event
                  ) =>
                    atualizarCampo(
                      "preco",
                      event.target.value
                    )
                  }
                  placeholder="59,90"
                  className={
                    classeInput
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="pessoasPrato"
                  className={
                    classeLabel
                  }
                >
                  SERVE QUANTAS PESSOAS?
                </label>

                <input
                  id="pessoasPrato"
                  required
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={100}
                  step={1}
                  value={
                    formulario.pessoas
                  }
                  disabled={
                    salvando
                  }
                  onChange={(
                    event
                  ) =>
                    atualizarCampo(
                      "pessoas",
                      event.target.value
                    )
                  }
                  placeholder="2"
                  className={
                    classeInput
                  }
                />
              </div>
            </div>

            {/* DESCRIÇÃO */}

            <div>
              <div
                className="
                  flex
                  items-center
                  justify-between
                "
              >
                <label
                  htmlFor="descricaoPrato"
                  className={
                    classeLabel
                  }
                >
                  DESCRIÇÃO
                </label>

                <span
                  className="
                    text-[9px]

                    text-white/25
                  "
                >
                  {
                    formulario
                      .descricao
                      .length
                  }
                  /1000
                </span>
              </div>

              <textarea
                id="descricaoPrato"
                required
                maxLength={
                  1000
                }
                rows={4}
                value={
                  formulario.descricao
                }
                disabled={
                  salvando
                }
                onChange={(
                  event
                ) =>
                  atualizarCampo(
                    "descricao",
                    event.target.value
                  )
                }
                placeholder="Ingredientes, acompanhamentos e detalhes..."
                className={
                  classeInput
                }
              />
            </div>

            {/* AVISO IMAGEM */}

            <p
              className="
                text-[10px]
                leading-5

                text-white/30
              "
            >
              A imagem do prato
              será adicionada pela
              administração após a
              análise.
            </p>

            {/* SALVAR */}

            <button
              type="submit"
              disabled={
                salvando
              }
              className="
                w-full

                rounded-xl

                bg-red-500

                px-6
                py-4

                text-xs
                font-black

                uppercase

                text-white

                shadow-[0_0_25px_rgba(239,68,68,0.20)]

                transition

                hover:bg-red-600

                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {salvando
                ? "SALVANDO..."
                : editandoId
                  ? "SALVAR ALTERAÇÕES"
                  : "ENVIAR PARA ANÁLISE"}
            </button>
          </form>
        </section>

        {/* =================================================
            LISTAGEM
        ================================================= */}

        <section
          className="
            mt-12
          "
        >
          <div
            className="
              flex
              items-end
              justify-between

              gap-4
            "
          >
            <div>
              <p
                className="
                  text-[8px]
                  font-black

                  uppercase

                  tracking-[0.20em]

                  text-red-500
                "
              >
                Cardápio
              </p>

              <h2
                className="
                  mt-2

                  text-2xl
                  font-black

                  uppercase
                "
              >
                PRATOS CADASTRADOS
              </h2>
            </div>

            <span
              className="
                text-xs
                font-black

                text-white/35
              "
            >
              {
                pratos.length
              }
            </span>
          </div>

          {/* CARREGANDO */}

          {carregandoPratos && (
            <div
              className="
                mt-6

                rounded-2xl

                border
                border-white/10

                bg-[#0d0d0d]

                p-8

                text-center

                text-sm
                font-bold

                text-white/40
              "
            >
              Carregando...
            </div>
          )}

          {/* VAZIO */}

          {!carregandoPratos &&
            pratos.length ===
              0 && (
              <div
                className="
                  mt-6

                  rounded-[24px]

                  border
                  border-dashed
                  border-white/15

                  bg-[#0a0a0a]

                  p-10

                  text-center
                "
              >
                <img
                  src={
                    restauranteEmoji
                  }
                  alt=""
                  draggable={
                    false
                  }
                  className="
                    mx-auto

                    h-24
                    w-24

                    object-contain

                    opacity-70
                  "
                />

                <h3
                  className="
                    mt-4

                    text-xl
                    font-black

                    uppercase
                  "
                >
                  NENHUM PRATO
                </h3>

                <p
                  className="
                    mt-2

                    text-xs

                    text-white/35
                  "
                >
                  Cadastre seu
                  primeiro prato
                  acima.
                </p>
              </div>
            )}

          {/* PRATOS */}

          {!carregandoPratos &&
            pratos.length >
              0 && (
              <div
                className="
                  mt-6

                  grid
                  gap-4

                  md:grid-cols-2
                "
              >
                {pratos.map(
                  (
                    prato
                  ) => {
                    const status =
                      informacoesStatus(
                        prato.status
                      );

                    return (
                      <article
                        key={
                          prato.id
                        }
                        className="
                          overflow-hidden

                          rounded-[22px]

                          border
                          border-white/10

                          bg-[#0c0c0c]
                        "
                      >
                        {/* CABEÇALHO */}

                        <div
                          className="
                            flex

                            items-center

                            gap-4

                            border-b
                            border-white/10

                            p-4
                          "
                        >
                          <div
                            className="
                              flex

                              h-20
                              w-20

                              shrink-0

                              items-center
                              justify-center

                              overflow-hidden

                              rounded-xl

                              bg-black
                            "
                          >
                            {prato.imagemUrl ? (
                              <img
                                src={
                                  prato.imagemUrl
                                }
                                alt={
                                  prato.nome
                                }
                                className="
                                  h-full
                                  w-full

                                  object-cover
                                "
                              />
                            ) : (
                              <img
                                src={
                                  restauranteEmoji
                                }
                                alt=""
                                draggable={
                                  false
                                }
                                className="
                                  h-16
                                  w-16

                                  object-contain
                                "
                              />
                            )}
                          </div>

                          <div
                            className="
                              min-w-0
                              flex-1
                            "
                          >
                            <span
                              className={`
                                inline-flex

                                rounded-full

                                border

                                px-3
                                py-1.5

                                text-[8px]
                                font-black

                                uppercase

                                ${status.classe}
                              `}
                            >
                              {
                                status.titulo
                              }
                            </span>

                            <h3
                              className="
                                mt-3

                                break-words

                                text-lg
                                font-black

                                uppercase

                                text-white
                              "
                            >
                              {
                                prato.nome
                              }
                            </h3>
                          </div>
                        </div>

                        {/* CONTEÚDO */}

                        <div
                          className="
                            p-4
                          "
                        >
                          <div
                            className="
                              flex
                              items-center
                              justify-between

                              gap-4

                              border-b
                              border-white/10

                              pb-4
                            "
                          >
                            <div>
                              <p
                                className="
                                  text-[8px]
                                  font-black

                                  uppercase

                                  text-white/30
                                "
                              >
                                PREÇO
                              </p>

                              <p
                                className="
                                  mt-1

                                  text-lg
                                  font-black

                                  text-[#00ef78]
                                "
                              >
                                {formatarMoeda(
                                  prato.preco
                                )}
                              </p>
                            </div>

                            <div
                              className="
                                text-right
                              "
                            >
                              <p
                                className="
                                  text-[8px]
                                  font-black

                                  uppercase

                                  text-white/30
                                "
                              >
                                SERVE
                              </p>

                              <p
                                className="
                                  mt-1

                                  text-sm
                                  font-black

                                  text-white
                                "
                              >
                                {
                                  prato.pessoas
                                }{" "}
                                {prato.pessoas ===
                                1
                                  ? "pessoa"
                                  : "pessoas"}
                              </p>
                            </div>
                          </div>

                          <p
                            className="
                              mt-4

                              whitespace-pre-wrap

                              text-xs
                              leading-6

                              text-white/45
                            "
                          >
                            {
                              prato.descricao
                            }
                          </p>

                          {/* RECUSA */}

                          {prato.status ===
                            "rejeitado" &&
                            prato.motivoRecusa && (
                              <div
                                className="
                                  mt-4

                                  rounded-xl

                                  border
                                  border-red-500/20

                                  bg-red-500/10

                                  p-3
                                "
                              >
                                <p
                                  className="
                                    text-[8px]
                                    font-black

                                    uppercase

                                    text-red-400
                                  "
                                >
                                  CORREÇÃO SOLICITADA
                                </p>

                                <p
                                  className="
                                    mt-2

                                    whitespace-pre-wrap

                                    text-xs
                                    leading-5

                                    text-red-300
                                  "
                                >
                                  {
                                    prato.motivoRecusa
                                  }
                                </p>
                              </div>
                            )}

                          {/* DATA */}

                          <p
                            className="
                              mt-4

                              text-[9px]

                              text-white/20
                            "
                          >
                            Cadastrado em{" "}
                            {formatarData(
                              prato.criadoEm
                            )}
                          </p>

                          {/* EDITAR */}

                          <button
                            type="button"
                            onClick={() =>
                              editarPrato(
                                prato
                              )
                            }
                            className="
                              mt-4

                              w-full

                              rounded-xl

                              border
                              border-white/10

                              bg-[#151515]

                              px-4
                              py-3

                              text-[9px]
                              font-black

                              uppercase

                              text-white

                              transition

                              hover:border-red-500/40
                              hover:text-red-400
                            "
                          >
                            {prato.status ===
                            "rejeitado"
                              ? "CORRIGIR PRATO"
                              : "EDITAR PRATO"}
                          </button>
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            )}
        </section>
      </div>

      {/* ===================================================
          RODAPÉ
      =================================================== */}

      <footer
        className="
          mt-12

          border-t
          border-white/10

          px-4
          py-10

          text-center
        "
      >
        <img
          src="/coroa.png"
          alt=""
          className="
            mx-auto

            h-8
            w-8

            object-contain

            opacity-40
          "
        />

        <p
          className="
            mt-3

            text-[8px]
            font-black

            uppercase

            tracking-[0.18em]

            text-white/20
          "
        >
          Império Chalés • Portal do Parceiro
        </p>
      </footer>
    </main>
  );
}

export default ParceiroPratos;