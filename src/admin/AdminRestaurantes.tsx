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

import { onAuthStateChanged } from "firebase/auth";

import { auth, db } from "../firebase/config";
import { isAdmin } from "../firebase/admin";

import estabelecimentoIcon from "../components/catalogo/estabelecimento.png";
import restauranteEmoji from "../components/catalogo/restaurante-emoji.png";

/* =========================================================
   TIPOS
========================================================= */

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

/* =========================================================
   CONSTANTES
========================================================= */

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

/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function formatarData(
  data: Timestamp | null
): string {
  if (!data?.toDate) {
    return "Data não informada";
  }

  return data.toDate().toLocaleString(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function formatarModalidade(
  valor: string
): string {
  switch (valor) {
    case "entrega_propria":
      return "Entrega própria";

    case "somente_retirada":
      return "Somente retirada";

    case "retirada_anfitriao":
      return "Retirada sob consulta";

    case "ambas":
      return "Entrega e retirada";

    default:
      return "Não informada";
  }
}

function formatarStatus(
  status: StatusRestaurante
): string {
  switch (status) {
    case "pendente":
      return "AGUARDANDO";

    case "aprovado":
      return "APROVADO";

    case "rejeitado":
      return "REJEITADO";
  }
}

function classeStatus(
  status: StatusRestaurante
): string {
  switch (status) {
    case "pendente":
      return `
        border-[#ffd429]/25
        bg-[#ffd429]/10
        text-[#ffd429]
      `;

    case "aprovado":
      return `
        border-emerald-400/25
        bg-emerald-400/10
        text-emerald-300
      `;

    case "rejeitado":
      return `
        border-red-500/25
        bg-red-500/10
        text-red-400
      `;
  }
}

function somenteNumeros(
  valor: string
): string {
  return valor.replace(
    /\D/g,
    ""
  );
}

function obterErro(
  erro: unknown
): string {
  if (erro instanceof Error) {
    const codigo =
      "code" in erro
        ? String(
            erro.code
          )
        : "";

    if (
      codigo ===
      "permission-denied"
    ) {
      return (
        "O Firebase negou a operação. Confira a conta " +
        "administrativa e as regras publicadas."
      );
    }

    return erro.message;
  }

  return "Não foi possível concluir a operação.";
}

/* =========================================================
   COMPONENTE
========================================================= */

export function AdminRestaurantes() {
  /* =======================================================
     DADOS
  ======================================================= */

  const [
    restaurantes,
    setRestaurantes,
  ] =
    useState<
      Restaurante[]
    >([]);

  const [
    publicados,
    setPublicados,
  ] =
    useState<
      RestaurantePublicado[]
    >([]);

  const [
    carregando,
    setCarregando,
  ] =
    useState(true);

  const [
    carregandoPublicos,
    setCarregandoPublicos,
  ] =
    useState(true);

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
     FILTROS
  ======================================================= */

  const [
    filtro,
    setFiltro,
  ] =
    useState<FiltroRestaurante>(
      "todos"
    );

  const [
    busca,
    setBusca,
  ] =
    useState("");

  /* =======================================================
     AÇÕES
  ======================================================= */

  const [
    processandoId,
    setProcessandoId,
  ] =
    useState<
      string | null
    >(null);

  const [
    detalhesAbertos,
    setDetalhesAbertos,
  ] =
    useState<
      string | null
    >(null);

  const [
    publicacaoAberta,
    setPublicacaoAberta,
  ] =
    useState<
      string | null
    >(null);

  const [
    formulario,
    setFormulario,
  ] =
    useState<FormularioPublicacao>(
      FORMULARIO_VAZIO
    );

  /* =======================================================
     CADASTROS PRIVADOS
  ======================================================= */

  useEffect(() => {
    let cancelarRestaurantes:
      | (() => void)
      | null = null;

    const cancelarAutenticacao =
      onAuthStateChanged(
        auth,

        (
          usuario
        ) => {
          if (!usuario) {
            setRestaurantes([]);
            setErro(
              "Sessão administrativa não autenticada."
            );
            setCarregando(
              false
            );
            return;
          }

          if (
            !isAdmin(
              usuario.uid,
              usuario.email
            )
          ) {
            setRestaurantes([]);
            setErro(
              "Sessão administrativa não autorizada."
            );
            setCarregando(
              false
            );
            return;
          }

          const referencia =
            collection(
              db,
              "restaurantes"
            );

          cancelarRestaurantes =
            onSnapshot(
              referencia,

              (
                resultado
              ) => {
                const lista:
                  Restaurante[] =
                  resultado.docs.map(
                    (
                      documento
                    ) => {
                      const dados =
                        documento.data();

                      const status:
                        StatusRestaurante =
                        dados.status ===
                          "aprovado" ||
                        dados.status ===
                          "rejeitado"
                          ? dados.status
                          : "pendente";

                      return {
                        id:
                          documento.id,

                        uid:
                          typeof dados.uid ===
                          "string"
                            ? dados.uid
                            : documento.id,

                        nomeEmpresa:
                          dados.nomeEmpresa ??
                          "",

                        nomeResponsavel:
                          dados.nomeResponsavel ??
                          "",

                        email:
                          dados.email ??
                          "",

                        telefone:
                          dados.telefone ??
                          "",

                        documento:
                          dados.documento ??
                          "",

                        cep:
                          dados.cep ??
                          "",

                        endereco:
                          dados.endereco ??
                          "",

                        numero:
                          dados.numero ??
                          "",

                        bairro:
                          dados.bairro ??
                          "",

                        cidade:
                          dados.cidade ??
                          "",

                        complemento:
                          dados.complemento ??
                          "",

                        modalidadeEntrega:
                          dados.modalidadeEntrega ??
                          "",

                        descricao:
                          dados.descricao ??
                          "",

                        logoUrl:
                          dados.logoUrl ??
                          "",

                        status,

                        criadoEm:
                          dados.criadoEm ??
                          null,
                      };
                    }
                  );

                lista.sort(
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

                setRestaurantes(
                  lista
                );

                setCarregando(
                  false
                );

                setErro("");
              },

              (
                erroFirebase
              ) => {
                console.error(
                  "Erro ao consultar restaurantes:",
                  erroFirebase
                );

                setErro(
                  obterErro(
                    erroFirebase
                  )
                );

                setCarregando(
                  false
                );
              }
            );
        },

        (
          erroAutenticacao
        ) => {
          console.error(
            "Erro ao verificar autenticação administrativa:",
            erroAutenticacao
          );

          setRestaurantes([]);

          setErro(
            "Não foi possível verificar a sessão administrativa."
          );

          setCarregando(
            false
          );
        }
      );

    return () => {
      cancelarAutenticacao();

      if (
        cancelarRestaurantes
      ) {
        cancelarRestaurantes();
      }
    };
  }, []);

  /* =======================================================
     VITRINE PÚBLICA
  ======================================================= */

  useEffect(() => {
    const referencia =
      collection(
        db,
        "catalogoPublico"
      );

    const cancelar =
      onSnapshot(
        referencia,

        (
          resultado
        ) => {
          const lista:
            RestaurantePublicado[] =
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
                    dados.nome ??
                    "",

                  categoria:
                    dados.categoria ??
                    "",

                  descricao:
                    dados.descricao ??
                    "",

                  modalidadeEntrega:
                    dados.modalidadeEntrega ??
                    "",

                  ativo:
                    dados.ativo ===
                    true,

                  logo:
                    dados.logo ??
                    "",

                  telefone:
                    dados.telefone ??
                    "",

                  whatsapp:
                    dados.whatsapp ??
                    "",
                };
              }
            );

          setPublicados(
            lista
          );

          setCarregandoPublicos(
            false
          );
        },

        (
          erroFirebase
        ) => {
          console.error(
            "Erro ao consultar catálogo público:",
            erroFirebase
          );

          setErro(
            obterErro(
              erroFirebase
            )
          );

          setCarregandoPublicos(
            false
          );
        }
      );

    return () =>
      cancelar();
  }, []);

  /* =======================================================
     MAPA PUBLICADOS
  ======================================================= */

  const mapaPublicados =
    useMemo(() => {
      return new Map(
        publicados.map(
          (
            restaurante
          ) => [
            restaurante.id,
            restaurante,
          ]
        )
      );
    }, [
      publicados,
    ]);

  /* =======================================================
     INDICADORES
  ======================================================= */

  const total =
    restaurantes.length;

  const pendentes =
    restaurantes.filter(
      (
        restaurante
      ) =>
        restaurante.status ===
        "pendente"
    ).length;

  const aprovados =
    restaurantes.filter(
      (
        restaurante
      ) =>
        restaurante.status ===
        "aprovado"
    ).length;

  const rejeitados =
    restaurantes.filter(
      (
        restaurante
      ) =>
        restaurante.status ===
        "rejeitado"
    ).length;

  const totalPublicados =
    publicados.filter(
      (
        restaurante
      ) =>
        restaurante.ativo
    ).length;

  /* =======================================================
     FILTROS
  ======================================================= */

  const restaurantesFiltrados =
    restaurantes.filter(
      (
        restaurante
      ) => {
        const correspondeFiltro =
          filtro ===
            "todos" ||
          restaurante.status ===
            filtro;

        const termo =
          busca
            .trim()
            .toLocaleLowerCase(
              "pt-BR"
            );

        const correspondeBusca =
          !termo ||
          [
            restaurante.nomeEmpresa,
            restaurante.nomeResponsavel,
            restaurante.email,
          ]
            .join(" ")
            .toLocaleLowerCase(
              "pt-BR"
            )
            .includes(
              termo
            );

        return (
          correspondeFiltro &&
          correspondeBusca
        );
      }
    );

  /* =======================================================
     ADMIN
  ======================================================= */

  function verificarAdministrador(): boolean {
    const usuario =
      auth.currentUser;

    if (
      !usuario ||
      !isAdmin(
        usuario.uid,
        usuario.email
      )
    ) {
      setErro(
        "Faça login com a conta administrativa."
      );

      return false;
    }

    return true;
  }

  /* =======================================================
     APROVAR / REJEITAR
  ======================================================= */

  async function alterarStatus(
    restaurante: Restaurante,
    novoStatus:
      | "aprovado"
      | "rejeitado"
  ) {
    if (
      processandoId !==
      null
    ) {
      return;
    }

    setErro("");
    setMensagem("");

    if (
      restaurante.status !==
      "pendente"
    ) {
      setErro(
        "Esta solicitação já foi analisada."
      );
      return;
    }

    if (
      !verificarAdministrador()
    ) {
      return;
    }

    const acao =
      novoStatus ===
      "aprovado"
        ? "APROVAR"
        : "REJEITAR";

    const confirmou =
      window.confirm(
        `Deseja ${acao} a empresa "${restaurante.nomeEmpresa}"?\n\n` +
          "Esta ação altera o cadastro privado. " +
          "Ela não publica automaticamente o restaurante."
      );

    if (!confirmou) {
      return;
    }

    setProcessandoId(
      restaurante.id
    );

    try {
      await updateDoc(
        doc(
          db,
          "restaurantes",
          restaurante.id
        ),
        {
          status:
            novoStatus,

          analisadoEm:
            serverTimestamp(),

          analisadoPor:
            auth.currentUser!
              .uid,
        }
      );

      setMensagem(
        novoStatus ===
          "aprovado"
          ? `Empresa "${restaurante.nomeEmpresa}" aprovada.`
          : `Solicitação de "${restaurante.nomeEmpresa}" rejeitada.`
      );
    } catch (
      erroFirebase
    ) {
      console.error(
        "Erro ao alterar status:",
        erroFirebase
      );

      setErro(
        obterErro(
          erroFirebase
        )
      );
    } finally {
      setProcessandoId(
        null
      );
    }
  }

  /* =======================================================
     ABRIR PUBLICAÇÃO
  ======================================================= */

  function abrirPublicacao(
    restaurante: Restaurante
  ) {
    if (
      processandoId !==
      null
    ) {
      return;
    }

    if (
      restaurante.status !==
      "aprovado"
    ) {
      setErro(
        "Apenas restaurantes aprovados podem ser publicados."
      );
      return;
    }

    const publicado =
      mapaPublicados.get(
        restaurante.id
      );

    let modalidade:
      ModalidadePublica | "" =
      "";

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
      modalidade =
        "entrega_propria";
    }

    setFormulario({
      categoria:
        CATEGORIAS.includes(
          publicado?.categoria as CategoriaPublica
        )
          ? (
              publicado!
                .categoria as CategoriaPublica
            )
          : "",

      descricao:
        publicado?.descricao ??
        restaurante.descricao,

      modalidadeEntrega:
        modalidade,

      whatsapp:
        publicado?.whatsapp ??
        restaurante.telefone,

      horarioFuncionamento:
        "",
    });

    setPublicacaoAberta(
      restaurante.id
    );

    setErro("");
    setMensagem("");
  }

  /* =======================================================
     PUBLICAR RESTAURANTE
  ======================================================= */

  async function publicarRestaurante(
    restaurante: Restaurante
  ) {
    if (
      processandoId !==
      null
    ) {
      return;
    }

    setErro("");
    setMensagem("");

    if (
      !verificarAdministrador()
    ) {
      return;
    }

    if (
      restaurante.status !==
      "aprovado"
    ) {
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

    if (
      !CATEGORIAS.includes(
        categoria as CategoriaPublica
      )
    ) {
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
      nome.length <
        3 ||
      nome.length >
        100
    ) {
      setErro(
        "O nome comercial deve ter de 3 a 100 caracteres."
      );
      return;
    }

    if (
      descricao.length >
      1000
    ) {
      setErro(
        "A descrição pode ter até 1000 caracteres."
      );
      return;
    }

    if (
      whatsapp.length <
        10 ||
      whatsapp.length >
        13
    ) {
      setErro(
        "Informe um WhatsApp comercial válido, com DDD."
      );
      return;
    }

    const confirmou =
      window.confirm(
        `Publicar "${nome}" no Sabores da Chapada?\n\n` +
          "Apenas os dados comerciais definidos neste " +
          "formulário serão enviados à vitrine pública."
      );

    if (!confirmou) {
      return;
    }

    setProcessandoId(
      restaurante.id
    );

    try {
      const referenciaPrivada =
        doc(
          db,
          "restaurantes",
          restaurante.id
        );

      const referenciaPublica =
        doc(
          db,
          "catalogoPublico",
          restaurante.id
        );

      await runTransaction(
        db,

        async (
          transacao
        ) => {
          const cadastro =
            await transacao.get(
              referenciaPrivada
            );

          if (
            !cadastro.exists()
          ) {
            throw new Error(
              "O cadastro do restaurante não foi encontrado."
            );
          }

          if (
            cadastro.data()
              .status !==
            "aprovado"
          ) {
            throw new Error(
              "O restaurante deixou de estar aprovado."
            );
          }

          transacao.set(
            referenciaPublica,
            {
              nome,
              categoria,
              descricao,
              modalidadeEntrega:
                modalidade,

              ativo:
                true,

              logo:
                typeof cadastro.data()
                  .logoUrl ===
                "string"
                  ? cadastro.data()
                      .logoUrl
                  : "",

              whatsapp,

              telefone:
                whatsapp,

              horarioFuncionamento:
                formulario
                  .horarioFuncionamento
                  .trim(),

              diasFuncionamento:
                [],

              formasPagamento:
                [],
            }
          );
        }
      );

      setPublicacaoAberta(
        null
      );

      setMensagem(
        `"${nome}" foi publicado no catálogo.`
      );
    } catch (
      erroFirebase
    ) {
      console.error(
        "Erro ao publicar restaurante:",
        erroFirebase
      );

      setErro(
        obterErro(
          erroFirebase
        )
      );
    } finally {
      setProcessandoId(
        null
      );
    }
  }

  /* =======================================================
     RETIRAR PUBLICAÇÃO
  ======================================================= */

  async function retirarPublicacao(
    restaurante: Restaurante
  ) {
    if (
      processandoId !==
      null
    ) {
      return;
    }

    setErro("");
    setMensagem("");

    if (
      !verificarAdministrador()
    ) {
      return;
    }

    const confirmou =
      window.confirm(
        `Retirar "${restaurante.nomeEmpresa}" do catálogo?\n\n` +
          "O restaurante e seus pratos públicos serão excluídos da vitrine."
      );

    if (!confirmou) {
      return;
    }

    setProcessandoId(
      restaurante.id
    );

    try {
      const referenciaPublica =
        doc(
          db,
          "catalogoPublico",
          restaurante.id
        );

      const referenciaPratosPublicos =
        collection(
          db,
          "catalogoPublico",
          restaurante.id,
          "pratos"
        );

      const resultado =
        await getDocs(
          referenciaPratosPublicos
        );

      if (
        resultado.size >
        400
      ) {
        throw new Error(
          "Este restaurante possui muitos pratos públicos para esta operação."
        );
      }

      const lote =
        writeBatch(db);

      resultado.docs.forEach(
        (
          prato
        ) => {
          lote.delete(
            prato.ref
          );
        }
      );

      lote.delete(
        referenciaPublica
      );

      await lote.commit();

      setPublicacaoAberta(
        null
      );

      setMensagem(
        `"${restaurante.nomeEmpresa}" foi retirado do catálogo.`
      );
    } catch (
      erroFirebase
    ) {
      console.error(
        "Erro ao retirar publicação:",
        erroFirebase
      );

      setErro(
        obterErro(
          erroFirebase
        )
      );
    } finally {
      setProcessandoId(
        null
      );
    }
  }

  /* =======================================================
     ESTILOS
  ======================================================= */

  const classeInput = `
    mt-2
    w-full
    rounded-xl
    border
    border-white/10
    bg-[#101010]
    px-4
    py-3
    text-sm
    text-white
    outline-none
    placeholder:text-white/20
    focus:border-[#ffd429]/60
  `;

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
            max-w-7xl
            items-center
            justify-between
            gap-4
          "
        >
          <div className="flex items-center gap-3">
            <img
              src="/coroa.png"
              alt="Império Chalés"
              className="h-10 w-10 object-contain"
            />

            <div className="hidden sm:block">
              <p className="text-[11px] font-black uppercase">
                Central Administrativa
              </p>

              <p className="mt-1 text-[7px] font-black uppercase tracking-[0.18em] text-[#ffd429]">
                Restaurantes parceiros
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              to="/admin/pratos"
              className="
                rounded-xl
                border
                border-[#ffd429]/25
                bg-[#ffd429]/10
                px-4
                py-3
                text-[9px]
                font-black
                uppercase
                text-[#ffd429]
              "
            >
              PRATOS
            </Link>

            <Link
              to="/admin/dashboard"
              className="
                rounded-xl
                border
                border-white/10
                bg-white/[0.04]
                px-4
                py-3
                text-[9px]
                font-black
                uppercase
                text-white
              "
            >
              ← PAINEL
            </Link>
          </div>
        </div>
      </header>

      {/* ===================================================
          CONTEÚDO
      =================================================== */}

      <div
        className="
          mx-auto
          max-w-7xl
          px-4
          py-10
          sm:px-6
          lg:px-8
        "
      >
        {/* =================================================
            TÍTULO
        ================================================= */}

        <section className="text-center">
          <p className="text-[8px] font-black uppercase tracking-[0.22em] text-[#ffd429]">
            ESTABELECIMENTOS
          </p>

          <h1
            className="
              mt-3
              text-4xl
              font-black
              uppercase
              leading-none
              sm:text-5xl
              md:text-6xl
            "
          >
            RESTAURANTES{" "}
            <span className="text-[#ffd429]">
              PARCEIROS
            </span>
          </h1>
        </section>

        {/* =================================================
            INDICADORES
        ================================================= */}

        <section
          className="
            mt-8
            grid
            grid-cols-2
            gap-3
            lg:grid-cols-5
          "
        >
          {[
            {
              titulo: "TOTAL",
              valor: total,
              cor: "text-white",
            },
            {
              titulo: "PENDENTES",
              valor: pendentes,
              cor: "text-[#ffd429]",
            },
            {
              titulo: "APROVADOS",
              valor: aprovados,
              cor: "text-emerald-400",
            },
            {
              titulo: "REJEITADOS",
              valor: rejeitados,
              cor: "text-red-400",
            },
            {
              titulo: "PUBLICADOS",
              valor: totalPublicados,
              cor: "text-sky-400",
            },
          ].map(
            (
              item
            ) => (
              <article
                key={
                  item.titulo
                }
                className="
                  rounded-[20px]
                  border
                  border-white/10
                  bg-white/[0.035]
                  p-5
                  text-center
                "
              >
                <p
                  className={`
                    text-3xl
                    font-black
                    ${item.cor}
                  `}
                >
                  {carregando ||
                  (item.titulo ===
                    "PUBLICADOS" &&
                    carregandoPublicos)
                    ? "—"
                    : item.valor}
                </p>

                <p className="mt-2 text-[8px] font-black uppercase tracking-[0.12em] text-white/30">
                  {item.titulo}
                </p>
              </article>
            )
          )}
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
              text-xs
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
              border-emerald-400/25
              bg-emerald-400/10
              p-4
              text-xs
              font-bold
              text-emerald-300
            "
          >
            {mensagem}
          </div>
        )}

        {/* =================================================
            BUSCA
        ================================================= */}

        <section
          className="
            mt-8
            rounded-[24px]
            border
            border-white/10
            bg-[#080808]
            p-5
          "
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <input
              type="search"
              value={busca}
              onChange={(
                event
              ) =>
                setBusca(
                  event.target.value
                )
              }
              placeholder="Buscar estabelecimento..."
              className="
                min-w-0
                flex-1
                rounded-xl
                border
                border-white/10
                bg-[#111]
                px-5
                py-4
                text-sm
                text-white
                outline-none
                placeholder:text-white/25
                focus:border-[#ffd429]/60
              "
            />

            <div className="flex flex-wrap gap-2">
              {[
                {
                  valor: "todos",
                  titulo: "TODOS",
                },
                {
                  valor: "pendente",
                  titulo: "PENDENTES",
                },
                {
                  valor: "aprovado",
                  titulo: "APROVADOS",
                },
                {
                  valor: "rejeitado",
                  titulo: "REJEITADOS",
                },
              ].map(
                (
                  opcao
                ) => (
                  <button
                    key={
                      opcao.valor
                    }
                    type="button"
                    onClick={() =>
                      setFiltro(
                        opcao.valor as FiltroRestaurante
                      )
                    }
                    className={`
                      rounded-full
                      border
                      px-4
                      py-2
                      text-[8px]
                      font-black
                      uppercase
                      transition
                      ${
                        filtro ===
                        opcao.valor
                          ? "border-[#ffd429] bg-[#ffd429] text-black"
                          : "border-white/10 bg-white/[0.03] text-white/45"
                      }
                    `}
                  >
                    {opcao.titulo}
                  </button>
                )
              )}
            </div>
          </div>
        </section>

        {/* =================================================
            LISTA
        ================================================= */}

        <section className="mt-8">
          {carregando && (
            <div className="rounded-[24px] border border-white/10 bg-[#0a0a0a] p-10 text-center text-xs text-white/35">
              CARREGANDO ESTABELECIMENTOS...
            </div>
          )}

          {!carregando &&
            !erro &&
            restaurantesFiltrados.length ===
              0 && (
              <div className="rounded-[24px] border border-dashed border-white/10 p-10 text-center text-xs text-white/35">
                NENHUM ESTABELECIMENTO ENCONTRADO.
              </div>
            )}

          {!carregando &&
            restaurantesFiltrados.length >
              0 && (
              <div className="grid gap-5 lg:grid-cols-2">
                {restaurantesFiltrados.map(
                  (
                    restaurante
                  ) => {
                    const publicado =
                      mapaPublicados.get(
                        restaurante.id
                      );

                    const estaPublicado =
                      publicado?.ativo ===
                      true;

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
                        key={
                          restaurante.id
                        }
                        className="
                          overflow-hidden
                          rounded-[26px]
                          border
                          border-white/10
                          bg-gradient-to-br
                          from-[#151515]
                          via-[#0b0b0b]
                          to-black
                          shadow-[0_20px_50px_rgba(0,0,0,.45)]
                        "
                      >
                        {/* CABEÇALHO */}

                        <div className="border-b border-white/10 p-5">
                          <div className="flex items-start gap-4">
                            <div
                              className="
                                flex
                                h-20
                                w-20
                                shrink-0
                                items-center
                                justify-center
                                overflow-hidden
                                rounded-[18px]
                                border
                                border-white/10
                                bg-black
                              "
                            >
                              {restaurante.logoUrl ? (
                                <img
                                  src={
                                    restaurante.logoUrl
                                  }
                                  alt={
                                    restaurante.nomeEmpresa
                                  }
                                  className="h-full w-full object-contain p-2"
                                />
                              ) : (
                                <img
                                  src={
                                    estabelecimentoIcon
                                  }
                                  alt=""
                                  className="h-16 w-16 object-contain"
                                />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap gap-2">
                                <span
                                  className={`
                                    rounded-full
                                    border
                                    px-3
                                    py-1.5
                                    text-[7px]
                                    font-black
                                    uppercase
                                    ${classeStatus(
                                      restaurante.status
                                    )}
                                  `}
                                >
                                  {formatarStatus(
                                    restaurante.status
                                  )}
                                </span>

                                {estaPublicado && (
                                  <span
                                    className="
                                      rounded-full
                                      border
                                      border-sky-400/25
                                      bg-sky-400/10
                                      px-3
                                      py-1.5
                                      text-[7px]
                                      font-black
                                      uppercase
                                      text-sky-300
                                    "
                                  >
                                    PUBLICADO
                                  </span>
                                )}
                              </div>

                              <h2 className="mt-3 break-words text-xl font-black uppercase text-white">
                                {restaurante.nomeEmpresa}
                              </h2>

                              <p className="mt-2 break-all text-[9px] text-white/30">
                                {restaurante.email}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* RESUMO */}

                        <div className="p-5">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                              <p className="text-[7px] font-black uppercase text-white/25">
                                RESPONSÁVEL
                              </p>

                              <p className="mt-2 text-xs font-black text-white">
                                {restaurante.nomeResponsavel ||
                                  "Não informado"}
                              </p>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                              <p className="text-[7px] font-black uppercase text-white/25">
                                ATENDIMENTO
                              </p>

                              <p className="mt-2 text-xs font-black text-white">
                                {formatarModalidade(
                                  restaurante.modalidadeEntrega
                                )}
                              </p>
                            </div>
                          </div>

                          <p className="mt-4 text-[9px] text-white/25">
                            Cadastro:{" "}
                            {formatarData(
                              restaurante.criadoEm
                            )}
                          </p>

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
                            className="
                              mt-4
                              w-full
                              rounded-xl
                              border
                              border-white/10
                              bg-white/[0.03]
                              px-4
                              py-3
                              text-[9px]
                              font-black
                              uppercase
                              text-white/60
                            "
                          >
                            {detalhesVisiveis
                              ? "OCULTAR DADOS"
                              : "VER DADOS COMPLETOS"}
                          </button>

                          {detalhesVisiveis && (
                            <div
                              className="
                                mt-4
                                space-y-4
                                rounded-[18px]
                                border
                                border-white/10
                                bg-black/50
                                p-4
                                text-xs
                                leading-6
                                text-white/45
                              "
                            >
                              <div>
                                <p className="font-black uppercase text-white/70">
                                  ENDEREÇO
                                </p>

                                <p className="mt-1">
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

                              <div className="border-t border-white/10 pt-4">
                                <p className="font-black uppercase text-white/70">
                                  CPF/CNPJ
                                </p>

                                <p className="mt-1">
                                  {restaurante.documento ||
                                    "Não informado"}
                                </p>
                              </div>

                              <div className="border-t border-white/10 pt-4">
                                <p className="font-black uppercase text-white/70">
                                  DESCRIÇÃO
                                </p>

                                <p className="mt-1 whitespace-pre-wrap">
                                  {restaurante.descricao ||
                                    "Não informada"}
                                </p>
                              </div>

                              <div className="border-t border-white/10 pt-4">
                                <p className="font-black uppercase text-white/70">
                                  UID
                                </p>

                                <p className="mt-1 break-all font-mono text-[9px]">
                                  {restaurante.uid}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* PENDENTE */}

                          {pendente && (
                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                              <button
                                type="button"
                                disabled={
                                  processandoId !==
                                  null
                                }
                                onClick={() =>
                                  alterarStatus(
                                    restaurante,
                                    "aprovado"
                                  )
                                }
                                className="
                                  rounded-xl
                                  bg-emerald-400
                                  px-5
                                  py-4
                                  text-[10px]
                                  font-black
                                  uppercase
                                  text-black
                                  disabled:opacity-40
                                "
                              >
                                {processando
                                  ? "PROCESSANDO..."
                                  : "APROVAR"}
                              </button>

                              <button
                                type="button"
                                disabled={
                                  processandoId !==
                                  null
                                }
                                onClick={() =>
                                  alterarStatus(
                                    restaurante,
                                    "rejeitado"
                                  )
                                }
                                className="
                                  rounded-xl
                                  border
                                  border-red-500/30
                                  bg-red-500/10
                                  px-5
                                  py-4
                                  text-[10px]
                                  font-black
                                  uppercase
                                  text-red-400
                                  disabled:opacity-40
                                "
                              >
                                REJEITAR
                              </button>
                            </div>
                          )}

                          {/* APROVADO */}

                          {restaurante.status ===
                            "aprovado" && (
                            <div className="mt-5">
                              <button
                                type="button"
                                disabled={
                                  processandoId !==
                                    null ||
                                  carregandoPublicos
                                }
                                onClick={() => {
                                  if (
                                    formularioAberto
                                  ) {
                                    setPublicacaoAberta(
                                      null
                                    );
                                  } else {
                                    abrirPublicacao(
                                      restaurante
                                    );
                                  }
                                }}
                                className="
                                  w-full
                                  rounded-xl
                                  bg-[#ffd429]
                                  px-5
                                  py-4
                                  text-[10px]
                                  font-black
                                  uppercase
                                  text-black
                                  disabled:opacity-40
                                "
                              >
                                {formularioAberto
                                  ? "FECHAR PUBLICAÇÃO"
                                  : estaPublicado
                                  ? "EDITAR PUBLICAÇÃO"
                                  : "PUBLICAR NO CATÁLOGO"}
                              </button>

                              {/* FORMULÁRIO */}

                              {formularioAberto && (
                                <div
                                  className="
                                    mt-4
                                    rounded-[20px]
                                    border
                                    border-[#ffd429]/20
                                    bg-[#0d0d0d]
                                    p-5
                                  "
                                >
                                  <p className="text-[8px] font-black uppercase tracking-[0.16em] text-[#ffd429]">
                                    DADOS PÚBLICOS
                                  </p>

                                  <h3 className="mt-2 text-lg font-black uppercase text-white">
                                    {restaurante.nomeEmpresa}
                                  </h3>

                                  <div className="mt-5">
                                    <label
                                      htmlFor={`categoria-${restaurante.id}`}
                                      className="text-[9px] font-black uppercase text-white/55"
                                    >
                                      CATEGORIA
                                    </label>

                                    <select
                                      id={`categoria-${restaurante.id}`}
                                      value={
                                        formulario.categoria
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        setFormulario(
                                          (
                                            anterior
                                          ) => ({
                                            ...anterior,
                                            categoria:
                                              event.target.value as
                                                | CategoriaPublica
                                                | "",
                                          })
                                        )
                                      }
                                      className={
                                        classeInput
                                      }
                                    >
                                      <option value="">
                                        Selecione
                                      </option>

                                      {CATEGORIAS.map(
                                        (
                                          categoria
                                        ) => (
                                          <option
                                            key={
                                              categoria
                                            }
                                            value={
                                              categoria
                                            }
                                          >
                                            {categoria}
                                          </option>
                                        )
                                      )}
                                    </select>
                                  </div>

                                  <div className="mt-4">
                                    <label
                                      htmlFor={`descricao-${restaurante.id}`}
                                      className="text-[9px] font-black uppercase text-white/55"
                                    >
                                      DESCRIÇÃO
                                    </label>

                                    <textarea
                                      id={`descricao-${restaurante.id}`}
                                      rows={4}
                                      maxLength={
                                        1000
                                      }
                                      value={
                                        formulario.descricao
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        setFormulario(
                                          (
                                            anterior
                                          ) => ({
                                            ...anterior,
                                            descricao:
                                              event.target.value,
                                          })
                                        )
                                      }
                                      className={
                                        classeInput
                                      }
                                    />
                                  </div>

                                  <div className="mt-4">
                                    <label
                                      htmlFor={`modalidade-${restaurante.id}`}
                                      className="text-[9px] font-black uppercase text-white/55"
                                    >
                                      ATENDIMENTO
                                    </label>

                                    <select
                                      id={`modalidade-${restaurante.id}`}
                                      value={
                                        formulario.modalidadeEntrega
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        setFormulario(
                                          (
                                            anterior
                                          ) => ({
                                            ...anterior,
                                            modalidadeEntrega:
                                              event.target.value as
                                                | ModalidadePublica
                                                | "",
                                          })
                                        )
                                      }
                                      className={
                                        classeInput
                                      }
                                    >
                                      <option value="">
                                        Selecione
                                      </option>

                                      <option value="entrega_propria">
                                        Entrega própria
                                      </option>

                                      <option value="retirada_anfitriao">
                                        Retirada sob consulta
                                      </option>
                                    </select>
                                  </div>

                                  <div className="mt-4">
                                    <label
                                      htmlFor={`whatsapp-${restaurante.id}`}
                                      className="text-[9px] font-black uppercase text-white/55"
                                    >
                                      WHATSAPP
                                    </label>

                                    <input
                                      id={`whatsapp-${restaurante.id}`}
                                      value={
                                        formulario.whatsapp
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        setFormulario(
                                          (
                                            anterior
                                          ) => ({
                                            ...anterior,
                                            whatsapp:
                                              event.target.value,
                                          })
                                        )
                                      }
                                      placeholder="5562999999999"
                                      className={
                                        classeInput
                                      }
                                    />
                                  </div>

                                  <div className="mt-4">
                                    <label
                                      htmlFor={`horario-${restaurante.id}`}
                                      className="text-[9px] font-black uppercase text-white/55"
                                    >
                                      HORÁRIO
                                    </label>

                                    <input
                                      id={`horario-${restaurante.id}`}
                                      value={
                                        formulario.horarioFuncionamento
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        setFormulario(
                                          (
                                            anterior
                                          ) => ({
                                            ...anterior,
                                            horarioFuncionamento:
                                              event.target.value,
                                          })
                                        )
                                      }
                                      placeholder="Ex.: 11h às 22h"
                                      className={
                                        classeInput
                                      }
                                    />
                                  </div>

                                  {restaurante.logoUrl && (
                                    <img
                                      src={
                                        restaurante.logoUrl
                                      }
                                      alt={
                                        restaurante.nomeEmpresa
                                      }
                                      className="
                                        mt-5
                                        h-24
                                        w-24
                                        rounded-xl
                                        border
                                        border-white/10
                                        bg-black
                                        object-contain
                                        p-2
                                      "
                                    />
                                  )}

                                  <button
                                    type="button"
                                    disabled={
                                      processandoId !==
                                      null
                                    }
                                    onClick={() =>
                                      publicarRestaurante(
                                        restaurante
                                      )
                                    }
                                    className="
                                      mt-5
                                      w-full
                                      rounded-xl
                                      bg-emerald-400
                                      px-5
                                      py-4
                                      text-[10px]
                                      font-black
                                      uppercase
                                      text-black
                                      disabled:opacity-40
                                    "
                                  >
                                    {processando
                                      ? "SALVANDO..."
                                      : estaPublicado
                                      ? "SALVAR PUBLICAÇÃO"
                                      : "PUBLICAR RESTAURANTE"}
                                  </button>
                                </div>
                              )}

                              {estaPublicado && (
                                <button
                                  type="button"
                                  disabled={
                                    processandoId !==
                                    null
                                  }
                                  onClick={() =>
                                    retirarPublicacao(
                                      restaurante
                                    )
                                  }
                                  className="
                                    mt-3
                                    w-full
                                    rounded-xl
                                    border
                                    border-red-500/25
                                    bg-red-500/[0.06]
                                    px-5
                                    py-3
                                    text-[9px]
                                    font-black
                                    uppercase
                                    text-red-400
                                    disabled:opacity-40
                                  "
                                >
                                  RETIRAR DO CATÁLOGO
                                </button>
                              )}
                            </div>
                          )}

                          {/* REJEITADO */}

                          {restaurante.status ===
                            "rejeitado" && (
                            <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/[0.05] p-4">
                              <p className="text-[9px] font-black uppercase text-red-400">
                                SOLICITAÇÃO REJEITADA
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

        {/* =================================================
            RODAPÉ
        ================================================= */}

        <footer className="mt-12 border-t border-white/10 py-10 text-center">
          <img
            src="/coroa.png"
            alt=""
            className="mx-auto h-9 w-9 object-contain opacity-40"
          />

          <p className="mt-3 text-[7px] font-black uppercase tracking-[0.18em] text-white/15">
            IMPÉRIO CHALÉS • CENTRAL ADMINISTRATIVA
          </p>
        </footer>
      </div>
    </main>
  );
}

export default AdminRestaurantes;
