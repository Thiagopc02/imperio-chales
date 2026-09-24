
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

import { Link } from "react-router-dom";

import {
  collection,
  collectionGroup,
  doc,
  getDocs,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  updateDoc,
  type Timestamp,
} from "firebase/firestore";

import { auth, db } from "../firebase/config";

import { ADMIN_UID } from "../firebase/admin";

import { uploadImagemPrato } from "../services/uploadImagemPrato";

// =====================================================
// TIPOS
// =====================================================

type StatusPrato =
  | "pendente"
  | "aprovado"
  | "rejeitado";

type FiltroPratos =
  | "todos"
  | StatusPrato;

type EtapaUpload =
  | "parado"
  | "enviando"
  | "salvando";

interface Restaurante {
  id: string;
  nomeEmpresa: string;
  email: string;
}

interface Prato {
  id: string;
  restauranteId: string;
  restauranteNome: string;
  restauranteEmail: string;
  nome: string;
  preco: number;
  pessoas: number;
  descricao: string;
  status: StatusPrato;
  imagemUrl: string;
  motivoRecusa: string;
  criadoEm?: Timestamp;
  atualizadoEm?: Timestamp;
}

// =====================================================
// CONFIGURAÇÕES
// =====================================================

const SUPABASE_URL = String(
  import.meta.env.VITE_SUPABASE_URL || ""
).replace(/\/$/, "");

const PREFIXO_IMAGENS =
  `${SUPABASE_URL}/storage/v1/object/public/imagens-pratos/`;

const TAMANHO_MAXIMO = 5 * 1024 * 1024;

const TIPOS_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function formatarData(data?: Timestamp): string {
  if (!data?.toDate) {
    return "Data indisponível";
  }

  return data.toDate().toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function obterMensagemErro(erro: unknown): string {
  if (erro instanceof Error) {
    const codigo =
      "code" in erro
        ? String(erro.code)
        : "";

    if (codigo === "permission-denied") {
      return (
        "O Firebase negou a operação. Confira " +
        "a conta administrativa e as regras do Firestore."
      );
    }

    if (codigo === "failed-precondition") {
      return (
        "Esta consulta precisa de uma configuração " +
        "adicional no Firestore. Confira o console."
      );
    }

    return erro.message;
  }

  return "Não foi possível concluir a operação.";
}

function imagemSupabaseValida(url: string): boolean {
  if (!SUPABASE_URL || !url.startsWith(PREFIXO_IMAGENS)) {
    return false;
  }

  try {
    const endereco = new URL(url);

    const projeto = new URL(SUPABASE_URL);

    return (
      endereco.origin === projeto.origin &&
      endereco.pathname.startsWith(
        "/storage/v1/object/public/imagens-pratos/"
      ) &&
      !endereco.search &&
      !endereco.hash &&
      !endereco.pathname.includes("..")
    );
  } catch {
    return false;
  }
}

function identificarStatus(status: StatusPrato) {
  if (status === "aprovado") {
    return {
      nome: "Aprovado",
      icone: "✅",
      classe: "bg-green-100 text-green-800",
      borda: "border-sky-400",
    };
  }

  if (status === "rejeitado") {
    return {
      nome: "Correção necessária",
      icone: "❌",
      classe: "bg-red-100 text-red-800",
      borda: "border-red-200",
    };
  }

  return {
    nome: "Aguardando aprovação",
    icone: "⏳",
    classe: "bg-amber-100 text-amber-900",
    borda: "border-amber-300",
  };
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function AdminPratos() {
  // ===================================================
  // DADOS
  // ===================================================

  const [restaurantes, setRestaurantes] =
    useState<Restaurante[]>([]);

  const [pratos, setPratos] =
    useState<Prato[]>([]);

  const [idsPublicados, setIdsPublicados] =
    useState<Set<string>>(new Set());

  const [carregando, setCarregando] =
    useState(true);

  const [erroConsulta, setErroConsulta] =
    useState("");

  // ===================================================
  // FILTROS
  // ===================================================

  const [busca, setBusca] =
    useState("");

  const [filtro, setFiltro] =
    useState<FiltroPratos>("todos");

  // ===================================================
  // GERENCIAMENTO
  // ===================================================

  const [pratoSelecionado, setPratoSelecionado] =
    useState<Prato | null>(null);

  const [motivoRecusa, setMotivoRecusa] =
    useState("");

  const [mostrarCorrecao, setMostrarCorrecao] =
    useState(false);

  const [mostrarTrocaImagem, setMostrarTrocaImagem] =
    useState(false);

  const [salvando, setSalvando] =
    useState(false);

  const [erroAcao, setErroAcao] =
    useState("");

  const [mensagem, setMensagem] =
    useState("");

  // ===================================================
  // UPLOAD
  // ===================================================

  const inputArquivoRef =
    useRef<HTMLInputElement>(null);

  const [arquivoImagem, setArquivoImagem] =
    useState<File | null>(null);

  const [previewImagem, setPreviewImagem] =
    useState("");

  const [arrastando, setArrastando] =
    useState(false);

  const [etapaUpload, setEtapaUpload] =
    useState<EtapaUpload>("parado");

  const [imagemCarregou, setImagemCarregou] =
    useState(false);

  const [imagemFalhou, setImagemFalhou] =
    useState(false);

  // ===================================================
  // IDENTIFICAR ADMINISTRADOR
  // ===================================================

  function verificarAdministrador(): boolean {
    if (auth.currentUser?.uid !== ADMIN_UID) {
      setErroAcao(
        "Sua sessão administrativa não está autorizada."
      );

      return false;
    }

    return true;
  }

  // ===================================================
  // CONSULTAR RESTAURANTES
  // ===================================================

  useEffect(() => {
    let ativo = true;

    async function carregarRestaurantes() {
      try {
        const resultado = await getDocs(
          collection(db, "restaurantes")
        );

        if (!ativo) return;

        const lista = resultado.docs.map((documento) => {
          const dados = documento.data();

          return {
            id: documento.id,

            nomeEmpresa:
              typeof dados.nomeEmpresa === "string"
                ? dados.nomeEmpresa
                : "Restaurante sem nome",

            email:
              typeof dados.email === "string"
                ? dados.email
                : "",
          };
        });

        setRestaurantes(lista);
      } catch (erro) {
        console.error(
          "Erro ao consultar restaurantes:",
          erro
        );

        if (ativo) {
          setErroConsulta(obterMensagemErro(erro));
        }
      }
    }

    void carregarRestaurantes();

    return () => {
      ativo = false;
    };
  }, []);

  // ===================================================
  // MONITORAR PRATOS PRIVADOS E PÚBLICOS
  // ===================================================

  useEffect(() => {
    setCarregando(true);

    const cancelar = onSnapshot(
      collectionGroup(db, "pratos"),

      (resultado) => {
        const lista: Prato[] = [];

        const publicados = new Set<string>();

        resultado.docs.forEach((documento) => {
          const caminhoPai =
            documento.ref.parent.parent;

          const tipoColecao =
            caminhoPai?.parent.id;

          // -----------------------------------
          // IDENTIFICAR CÓPIAS PÚBLICAS
          // -----------------------------------

          if (tipoColecao === "catalogoPublico") {
            if (caminhoPai) {
              publicados.add(
                `${caminhoPai.id}/${documento.id}`
              );
            }

            return;
          }

          // -----------------------------------
          // IGNORAR OUTRAS COLEÇÕES
          // -----------------------------------

          if (tipoColecao !== "restaurantes") {
            return;
          }

          const dados = documento.data();

          lista.push({
            id: documento.id,

            restauranteId:
              caminhoPai?.id ?? "",

            restauranteNome: "",

            restauranteEmail: "",

            nome:
              typeof dados.nome === "string"
                ? dados.nome
                : "Prato sem nome",

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
          });
        });

        lista.sort((a, b) => {
          const dataA =
            a.criadoEm?.toMillis() ?? 0;

          const dataB =
            b.criadoEm?.toMillis() ?? 0;

          return dataB - dataA;
        });

        setPratos(lista);

        setIdsPublicados(publicados);

        setCarregando(false);

        setErroConsulta("");
      },

      (erro) => {
        console.error(
          "Erro ao consultar pratos:",
          erro
        );

        setErroConsulta(
          obterMensagemErro(erro)
        );

        setCarregando(false);
      }
    );

    return () => cancelar();
  }, []);

  // ===================================================
  // VINCULAR RESTAURANTES
  // ===================================================

  const pratosComRestaurantes = useMemo(() => {
    const mapa = new Map(
      restaurantes.map((restaurante) => [
        restaurante.id,
        restaurante,
      ])
    );

    return pratos.map((prato) => {
      const restaurante = mapa.get(
        prato.restauranteId
      );

      return {
        ...prato,

        restauranteNome:
          restaurante?.nomeEmpresa ??
          "Restaurante não identificado",

        restauranteEmail:
          restaurante?.email ?? "",
      };
    });
  }, [pratos, restaurantes]);

  // ===================================================
  // ATUALIZAR PRATO SELECIONADO
  // ===================================================

  useEffect(() => {
    if (!pratoSelecionado) return;

    const atualizado = pratosComRestaurantes.find(
      (prato) =>
        prato.id === pratoSelecionado.id &&
        prato.restauranteId ===
          pratoSelecionado.restauranteId
    );

    if (!atualizado) {
      setPratoSelecionado(null);
      return;
    }

    setPratoSelecionado(atualizado);
  }, [
    pratosComRestaurantes,
    pratoSelecionado?.id,
    pratoSelecionado?.restauranteId,
  ]);

  // ===================================================
  // INDICADORES
  // ===================================================

  const totalPendentes = pratos.filter(
    (prato) => prato.status === "pendente"
  ).length;

  const totalAprovados = pratos.filter(
    (prato) => prato.status === "aprovado"
  ).length;

  const totalRejeitados = pratos.filter(
    (prato) => prato.status === "rejeitado"
  ).length;

  const totalPublicados = pratos.filter(
    (prato) =>
      idsPublicados.has(
        `${prato.restauranteId}/${prato.id}`
      )
  ).length;

  // ===================================================
  // LISTAGEM FILTRADA
  // ===================================================

  const pratosFiltrados = useMemo(() => {
    const termo = busca
      .trim()
      .toLocaleLowerCase("pt-BR");

    return pratosComRestaurantes.filter((prato) => {
      const correspondeFiltro =
        filtro === "todos" ||
        prato.status === filtro;

      const correspondeBusca =
        !termo ||
        [
          prato.nome,
          prato.restauranteNome,
          prato.restauranteEmail,
        ]
          .join(" ")
          .toLocaleLowerCase("pt-BR")
          .includes(termo);

      return correspondeFiltro && correspondeBusca;
    });
  }, [
    pratosComRestaurantes,
    busca,
    filtro,
  ]);

  // ===================================================
  // REFERÊNCIAS FIRESTORE
  // ===================================================

  function referenciaPrato(prato: Prato) {
    return doc(
      db,
      "restaurantes",
      prato.restauranteId,
      "pratos",
      prato.id
    );
  }

  function referenciaPublica(prato: Prato) {
    return doc(
      db,
      "catalogoPublico",
      prato.restauranteId,
      "pratos",
      prato.id
    );
  }

  function estaPublicado(prato: Prato): boolean {
    return idsPublicados.has(
      `${prato.restauranteId}/${prato.id}`
    );
  }

  // ===================================================
  // ABRIR GERENCIAMENTO
  // ===================================================

  function abrirAnalise(prato: Prato) {
    if (salvando) return;

    limparImagemTemporaria();

    setPratoSelecionado(prato);

    setMotivoRecusa(prato.motivoRecusa);

    setMostrarCorrecao(false);

    setMostrarTrocaImagem(false);

    setErroAcao("");

    setMensagem("");

    setImagemCarregou(false);

    setImagemFalhou(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function fecharAnalise() {
    if (salvando) return;

    limparImagemTemporaria();

    setPratoSelecionado(null);

    setMotivoRecusa("");

    setMostrarCorrecao(false);

    setMostrarTrocaImagem(false);

    setErroAcao("");
  }

  // ===================================================
  // LIMPAR IMAGEM TEMPORÁRIA
  // ===================================================

  function limparImagemTemporaria() {
    setArquivoImagem(null);

    setPreviewImagem("");

    setArrastando(false);

    setEtapaUpload("parado");

    if (inputArquivoRef.current) {
      inputArquivoRef.current.value = "";
    }
  }

  // ===================================================
  // CRIAR PRÉVIA DA IMAGEM
  // ===================================================

  useEffect(() => {
    if (!arquivoImagem) {
      setPreviewImagem("");
      return;
    }

    const url = URL.createObjectURL(
      arquivoImagem
    );

    setPreviewImagem(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [arquivoImagem]);

  // ===================================================
  // VALIDAR ARQUIVO
  // ===================================================

  function selecionarImagem(arquivo?: File) {
    if (salvando || !arquivo) return;

    setErroAcao("");

    setMensagem("");

    const extensaoValida =
      /\.(png|jpg|jpeg|webp)$/i.test(
        arquivo.name
      );

    if (
      !extensaoValida ||
      !TIPOS_PERMITIDOS.includes(arquivo.type)
    ) {
      setErroAcao(
        "Selecione uma imagem JPG, PNG ou WEBP."
      );

      return;
    }

    if (arquivo.size === 0) {
      setErroAcao(
        "O arquivo selecionado está vazio."
      );

      return;
    }

    if (arquivo.size > TAMANHO_MAXIMO) {
      setErroAcao(
        "A imagem deve ter no máximo 5 MB."
      );

      return;
    }

    setArquivoImagem(arquivo);
  }

  function alterarArquivo(
    event: ChangeEvent<HTMLInputElement>
  ) {
    selecionarImagem(
      event.target.files?.[0]
    );
  }

  function arrastarSobreArea(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    event.stopPropagation();

    if (!salvando) {
      setArrastando(true);
    }
  }

  function sairAreaArrasto(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    event.stopPropagation();

    setArrastando(false);
  }

  function soltarImagem(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    event.stopPropagation();

    setArrastando(false);

    selecionarImagem(
      event.dataTransfer.files[0]
    );
  }

  // ===================================================
  // VERIFICAR IMAGEM
  // ===================================================

  async function verificarImagem(
    url: string
  ): Promise<boolean> {
    if (!imagemSupabaseValida(url)) {
      return false;
    }

    try {
      const resposta = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });

      if (!resposta.ok) {
        return false;
      }

      const tipo =
        resposta.headers.get("content-type") ?? "";

      return tipo.startsWith("image/");
    } catch {
      return false;
    }
  }

  // ===================================================
  // ENVIAR IMAGEM AO SUPABASE
  // ===================================================

  async function enviarImagem() {
    const prato = pratoSelecionado;

    const arquivo = arquivoImagem;

    if (
      !prato ||
      !arquivo ||
      salvando
    ) {
      return;
    }

    if (!verificarAdministrador()) {
      return;
    }

    if (estaPublicado(prato)) {
      setErroAcao(
        "Retire o prato do cardápio antes de trocar a imagem."
      );

      return;
    }

    if (prato.status === "aprovado") {
      setErroAcao(
        "Para trocar a imagem de um prato já aprovado, " +
        "solicite uma nova revisão antes de enviar " +
        "o arquivo. Isso evita alterar uma versão aprovada " +
        "sem uma nova análise."
      );

      return;
    }

    const confirmou = window.confirm(
      `Enviar a imagem para "${prato.nome}"?\n\n` +
      "Ela será armazenada no Supabase, e sua URL " +
      "será registrada no Firestore."
    );

    if (!confirmou) return;

    setSalvando(true);

    setEtapaUpload("enviando");

    setErroAcao("");

    setMensagem("");

    let urlEnviada = "";

    try {
      const resultado = await uploadImagemPrato({
        arquivo,
        restauranteId: prato.restauranteId,
        pratoId: prato.id,
      });

      urlEnviada = resultado.imagemUrl;

      if (!imagemSupabaseValida(urlEnviada)) {
        throw new Error(
          "O servidor retornou uma URL inválida."
        );
      }

      setEtapaUpload("salvando");

      await updateDoc(
        referenciaPrato(prato),
        {
          imagemUrl: urlEnviada,
          atualizadoEm: serverTimestamp(),
        }
      );

      limparImagemTemporaria();

      setImagemCarregou(false);

      setImagemFalhou(false);

      setMensagem(
        "Imagem enviada ao Supabase e vinculada " +
        "ao prato no Firestore."
      );
    } catch (erro) {
      console.error(
        "Erro no envio da imagem:",
        erro
      );

      if (urlEnviada) {
        setErroAcao(
          "O arquivo foi enviado ao Supabase, mas " +
          "não conseguimos confirmar o vínculo " +
          "no Firebase. Detalhes: " +
          obterMensagemErro(erro)
        );
      } else {
        setErroAcao(
          obterMensagemErro(erro)
        );
      }
    } finally {
      setSalvando(false);

      setEtapaUpload("parado");
    }
  }

  // ===================================================
  // APROVAR PRATO
  // ===================================================

  async function aprovarPrato() {
    const prato = pratoSelecionado;

    if (!prato || salvando) return;

    if (!verificarAdministrador()) {
      return;
    }

    setErroAcao("");

    setMensagem("");

    if (prato.status === "aprovado") {
      setErroAcao(
        "Este prato já está aprovado."
      );

      return;
    }

    if (estaPublicado(prato)) {
      setErroAcao(
        "Retire a publicação antes de realizar uma nova aprovação."
      );

      return;
    }

    if (arquivoImagem) {
      setErroAcao(
        "Envie a imagem selecionada ao Supabase " +
        "antes de aprovar."
      );

      return;
    }

    if (!imagemSupabaseValida(prato.imagemUrl)) {
      setErroAcao(
        "É necessário vincular uma imagem válida."
      );

      return;
    }

    setSalvando(true);

    try {
      const imagemDisponivel =
        await verificarImagem(prato.imagemUrl);

      if (!imagemDisponivel) {
        throw new Error(
          "A imagem não está acessível. " +
          "Confira o arquivo antes de aprovar."
        );
      }

      const confirmou = window.confirm(
        `Aprovar o prato "${prato.nome}"?`
      );

      if (!confirmou) return;

      await runTransaction(
        db,
        async (transacao) => {
          const referencia =
            referenciaPrato(prato);

          const documento =
            await transacao.get(referencia);

          if (!documento.exists()) {
            throw new Error(
              "O prato não foi encontrado."
            );
          }

          const dados = documento.data();

          if (dados.status === "aprovado") {
            throw new Error(
              "O prato já foi aprovado."
            );
          }

          if (
            dados.imagemUrl !==
            prato.imagemUrl
          ) {
            throw new Error(
              "A imagem foi alterada. Confira novamente."
            );
          }

          transacao.update(referencia, {
            status: "aprovado",
            motivoRecusa: "",
            analisadoEm: serverTimestamp(),
            analisadoPor: ADMIN_UID,
            atualizadoEm: serverTimestamp(),
          });
        }
      );

      limparImagemTemporaria();

      setMotivoRecusa("");

      setMostrarCorrecao(false);

      setMensagem(
        `Prato "${prato.nome}" aprovado. ` +
        "Agora ele poderá ser publicado separadamente."
      );
    } catch (erro) {
      console.error(
        "Erro ao aprovar prato:",
        erro
      );

      setErroAcao(
        obterMensagemErro(erro)
      );
    } finally {
      setSalvando(false);
    }
  }

  // ===================================================
  // PUBLICAR PRATO
  // ===================================================

  async function publicarPrato() {
    const prato = pratoSelecionado;

    if (!prato || salvando) return;

    if (!verificarAdministrador()) {
      return;
    }

    setErroAcao("");

    setMensagem("");

    if (prato.status !== "aprovado") {
      setErroAcao(
        "Apenas pratos aprovados podem ser publicados."
      );

      return;
    }

    if (estaPublicado(prato)) {
      setErroAcao(
        "Este prato já está publicado."
      );

      return;
    }

    if (!imagemSupabaseValida(prato.imagemUrl)) {
      setErroAcao(
        "A imagem precisa ser válida."
      );

      return;
    }

    setSalvando(true);

    try {
      const imagemDisponivel =
        await verificarImagem(prato.imagemUrl);

      if (!imagemDisponivel) {
        throw new Error(
          "A imagem não está acessível."
        );
      }

      const confirmou = window.confirm(
        `Publicar "${prato.nome}" no cardápio dos hóspedes?`
      );

      if (!confirmou) return;

      await runTransaction(
        db,
        async (transacao) => {
          const origem =
            await transacao.get(
              referenciaPrato(prato)
            );

          const restaurante =
            await transacao.get(
              doc(
                db,
                "restaurantes",
                prato.restauranteId
              )
            );

          const vitrine =
            await transacao.get(
              doc(
                db,
                "catalogoPublico",
                prato.restauranteId
              )
            );

          if (
            !origem.exists() ||
            origem.data().status !== "aprovado"
          ) {
            throw new Error(
              "O prato não está aprovado na versão atual."
            );
          }

          if (
            !restaurante.exists() ||
            restaurante.data().status !== "aprovado"
          ) {
            throw new Error(
              "O restaurante precisa estar aprovado."
            );
          }

          if (
            !vitrine.exists() ||
            vitrine.data().ativo !== true
          ) {
            throw new Error(
              "Publique primeiro o restaurante."
            );
          }

          const dados = origem.data();

          if (
            !imagemSupabaseValida(
              dados.imagemUrl ?? ""
            )
          ) {
            throw new Error(
              "A imagem do prato foi alterada."
            );
          }

          transacao.set(
            referenciaPublica(prato),
            {
              nome: dados.nome,
              descricao: dados.descricao,
              preco: dados.preco,
              pessoas: dados.pessoas,
              imagemUrl: dados.imagemUrl,
              status: "aprovado",
              disponivel: true,
            }
          );
        }
      );

      setMensagem(
        `Prato "${prato.nome}" publicado no cardápio!`
      );
    } catch (erro) {
      console.error(
        "Erro ao publicar prato:",
        erro
      );

      setErroAcao(
        obterMensagemErro(erro)
      );
    } finally {
      setSalvando(false);
    }
  }

  // ===================================================
  // RETIRAR PRATO DO CATÁLOGO
  // ===================================================

  async function retirarPrato() {
    const prato = pratoSelecionado;

    if (!prato || salvando) return;

    if (!verificarAdministrador()) {
      return;
    }

    const confirmou = window.confirm(
      `Retirar "${prato.nome}" do cardápio?\n\n` +
      "O registro original será preservado no Firebase."
    );

    if (!confirmou) return;

    setSalvando(true);

    setErroAcao("");

    setMensagem("");

    try {
      await runTransaction(
        db,
        async (transacao) => {
          const referencia =
            referenciaPublica(prato);

          const publico =
            await transacao.get(referencia);

          if (publico.exists()) {
            transacao.delete(referencia);
          }
        }
      );

      setMensagem(
        `Prato "${prato.nome}" retirado do cardápio.`
      );
    } catch (erro) {
      console.error(
        "Erro ao retirar prato:",
        erro
      );

      setErroAcao(
        obterMensagemErro(erro)
      );
    } finally {
      setSalvando(false);
    }
  }

  // ===================================================
  // SOLICITAR CORREÇÃO
  // ===================================================

  async function rejeitarPrato() {
    const prato = pratoSelecionado;

    if (!prato || salvando) return;

    if (!verificarAdministrador()) {
      return;
    }

    setErroAcao("");

    setMensagem("");

    const motivo = motivoRecusa.trim();

    if (
      motivo.length < 10 ||
      motivo.length > 1000
    ) {
      setErroAcao(
        "Informe um motivo entre 10 e 1000 caracteres."
      );

      return;
    }

    const confirmou = window.confirm(
      `Solicitar correções para "${prato.nome}"?`
    );

    if (!confirmou) return;

    setSalvando(true);

    try {
      await runTransaction(
        db,
        async (transacao) => {
          const referenciaOriginal =
            referenciaPrato(prato);

          const referenciaVitrine =
            referenciaPublica(prato);

          const original =
            await transacao.get(
              referenciaOriginal
            );

          const publico =
            await transacao.get(
              referenciaVitrine
            );

          if (!original.exists()) {
            throw new Error(
              "O prato não existe mais."
            );
          }

          transacao.update(
            referenciaOriginal,
            {
              status: "rejeitado",
              motivoRecusa: motivo,
              analisadoEm: serverTimestamp(),
              analisadoPor: ADMIN_UID,
              atualizadoEm: serverTimestamp(),
            }
          );

          if (publico.exists()) {
            transacao.delete(
              referenciaVitrine
            );
          }
        }
      );

      setMostrarCorrecao(false);

      setMotivoRecusa("");

      setMensagem(
        "Correção solicitada e eventual publicação retirada."
      );
    } catch (erro) {
      console.error(
        "Erro ao solicitar correção:",
        erro
      );

      setErroAcao(
        obterMensagemErro(erro)
      );
    } finally {
      setSalvando(false);
    }
  }

  // ===================================================
  // ESTILOS
  // ===================================================

  const classeInput =
    "mt-2 w-full rounded-xl border border-gray-200 " +
    "bg-white px-4 py-3 text-sm text-[#19352b] " +
    "outline-none focus:border-green-600 " +
    "focus:ring-2 focus:ring-green-100";

  // ===================================================
  // DADOS DO PRATO ABERTO
  // ===================================================

  const pratoPublicado =
    pratoSelecionado
      ? estaPublicado(pratoSelecionado)
      : false;

  const pratoAprovado =
    pratoSelecionado?.status === "aprovado";

  const pratoPendente =
    pratoSelecionado?.status === "pendente";

  const pratoRejeitado =
    pratoSelecionado?.status === "rejeitado";

  // ===================================================
  // INTERFACE
  // ===================================================

  return (
    <main className="min-h-screen bg-[#f8f6ef] text-[#19352b]">

      {/* =============================================== */}
      {/* CABEÇALHO                                       */}
      {/* =============================================== */}

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
                GESTÃO DE PRATOS
              </p>
            </div>

          </div>

          <div className="flex flex-wrap gap-2">

            <Link
              to="/admin/restaurantes"
              className="rounded-xl border border-amber-400/40 px-4 py-3 text-sm font-bold text-amber-300"
            >
              🏪 Restaurantes
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

      <div className="mx-auto max-w-7xl px-4 py-10">

        {/* ============================================= */}
        {/* APRESENTAÇÃO                                  */}
        {/* ============================================= */}

        <section className="rounded-[30px] bg-gradient-to-br from-[#10251d] via-[#19352b] to-[#123027] p-6 text-white shadow-xl md:p-10">

          <span className="inline-flex rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-xs font-black text-amber-300">
            🍽️ GESTÃO GASTRONÔMICA
          </span>

          <h2 className="mt-6 text-3xl font-black uppercase leading-tight md:text-5xl">
            CENTRAL DE

            <span className="block text-amber-400">
              PRATOS E PUBLICAÇÕES
            </span>
          </h2>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-gray-200">
            Analise solicitações, prepare imagens,
            aprove pratos e gerencie os produtos
            disponíveis no catálogo dos hóspedes.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">

            {[
              {
                titulo: "Pendentes",
                valor: totalPendentes,
                icone: "⏳",
                cor: "text-amber-200",
              },
              {
                titulo: "Aprovados",
                valor: totalAprovados,
                icone: "✅",
                cor: "text-green-200",
              },
              {
                titulo: "Correções",
                valor: totalRejeitados,
                icone: "❌",
                cor: "text-red-200",
              },
              {
                titulo: "Publicados",
                valor: totalPublicados,
                icone: "🌐",
                cor: "text-blue-200",
              },
            ].map((item) => (
              <div
                key={item.titulo}
                className="rounded-2xl border border-white/15 bg-white/10 p-4 md:p-5"
              >
                <p className={`text-xs font-bold ${item.cor}`}>
                  {item.icone} {item.titulo}
                </p>

                <p className="mt-3 text-3xl font-black md:text-4xl">
                  {carregando ? "—" : item.valor}
                </p>
              </div>
            ))}

          </div>

        </section>

        {/* ============================================= */}
        {/* AVISO                                         */}
        {/* ============================================= */}

        <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm leading-7 text-blue-900">

          <strong>
            🔒 Controle administrativo.
          </strong>

          <p className="mt-2">
            Os pratos são cadastrados pelos parceiros
            no Firestore. A administração revisa os dados,
            envia a imagem pelo Supabase e realiza
            a aprovação e a publicação separadamente.
          </p>

        </div>

        {/* ============================================= */}
        {/* MENSAGENS                                     */}
        {/* ============================================= */}

        {erroConsulta && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-800"
          >
            ⚠️ {erroConsulta}
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

        {/* ============================================= */}
        {/* FILTROS                                       */}
        {/* ============================================= */}

        <section className="mt-10 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm md:p-7">

          <h3 className="text-xl font-black">
            🔎 Localizar pratos
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            Pesquise pelo nome do prato, restaurante
            ou e-mail do estabelecimento.
          </p>

          <input
            type="search"
            value={busca}
            onChange={(event) =>
              setBusca(event.target.value)
            }
            placeholder="Nome do prato, restaurante ou e-mail..."
            className={classeInput}
          />

          <div className="mt-5 flex flex-wrap gap-2">

            {[
              {
                valor: "todos",
                titulo: `Todos (${pratos.length})`,
              },
              {
                valor: "pendente",
                titulo: `⏳ Pendentes (${totalPendentes})`,
              },
              {
                valor: "aprovado",
                titulo: `✅ Aprovados (${totalAprovados})`,
              },
              {
                valor: "rejeitado",
                titulo: `❌ Correções (${totalRejeitados})`,
              },
            ].map((opcao) => (
              <button
                key={opcao.valor}
                type="button"
                onClick={() =>
                  setFiltro(
                    opcao.valor as FiltroPratos
                  )
                }
                aria-pressed={
                  filtro === opcao.valor
                }
                className={`rounded-full border px-4 py-2 text-xs font-black transition ${
                  filtro === opcao.valor
                    ? "border-[#19352b] bg-[#19352b] text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {opcao.titulo}
              </button>
            ))}

          </div>

        </section>

        {/* ============================================= */}
        {/* PAINEL DO PRATO SELECIONADO                   */}
        {/* ============================================= */}

        {pratoSelecionado && (
          <section
            className={`mt-10 overflow-hidden rounded-[28px] border-2 bg-white shadow-xl ${
              pratoPublicado
                ? "border-sky-400 shadow-[0_0_20px_rgba(0,145,255,0.30)]"
                : pratoAprovado
                  ? "border-green-200"
                  : pratoRejeitado
                    ? "border-red-300"
                    : "border-amber-300"
            }`}
          >

            {/* ========================================= */}
            {/* CABEÇALHO DINÂMICO                        */}
            {/* ========================================= */}

            <div className="flex flex-wrap items-center justify-between gap-4 bg-[#080a0f] p-6 text-white md:p-8">

              <div>

                <span
                  className={`inline-flex rounded-full px-3 py-2 text-xs font-black ${
                    pratoPublicado
                      ? "bg-sky-100 text-sky-900"
                      : pratoAprovado
                        ? "bg-green-100 text-green-800"
                        : pratoRejeitado
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {pratoPublicado
                    ? "🌐 APROVADO E PUBLICADO"
                    : pratoAprovado
                      ? "✅ APROVADO — NÃO PUBLICADO"
                      : pratoRejeitado
                        ? "❌ CORREÇÃO NECESSÁRIA"
                        : "⏳ ANÁLISE ADMINISTRATIVA"}
                </span>

                <h3 className="mt-4 text-2xl font-black md:text-3xl">
                  {pratoSelecionado.nome}
                </h3>

                <p className="mt-2 text-sm text-amber-200">
                  🏪 {pratoSelecionado.restauranteNome}
                </p>

              </div>

              <button
                type="button"
                onClick={fecharAnalise}
                disabled={salvando}
                className="rounded-xl border border-white/20 px-4 py-3 text-sm font-bold text-white hover:bg-white/10 disabled:opacity-60"
              >
                ✕ Fechar
              </button>

            </div>

            <div className="space-y-6 p-5 md:p-8">

              {/* ======================================= */}
              {/* VISUAL DIFERENCIADO: PUBLICADO          */}
              {/* ======================================= */}

              {pratoPublicado && (
                <div className="rounded-2xl border border-sky-400 bg-[#f0f8ff] p-5 shadow-[0_0_30px_rgba(0,145,255,0.28)] md:p-7">

                  <div className="flex flex-wrap items-center justify-between gap-3">

                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-green-700">
                        Produto no catálogo
                      </p>

                      <h4 className="mt-2 text-2xl font-black text-green-950">
                        Seu prato está publicado!
                      </h4>
                    </div>

                    <span className="rounded-full bg-[#080a0f] px-4 py-2 text-xs font-black text-white shadow-[0_0_16px_rgba(0,145,255,0.65)]">
                      🌐 PUBLICADO
                    </span>

                  </div>

                  <p className="mt-4 text-sm leading-7 text-green-900">
                    A versão aprovada possui um documento
                    na vitrine pública do Sabores da Chapada.
                    Você pode consultar seus dados ou retirar
                    a publicação quando necessário.
                  </p>

                  <div className="mt-6 overflow-hidden rounded-2xl bg-white p-4 shadow-sm">

                    {pratoSelecionado.imagemUrl && (
                      <img
                        src={pratoSelecionado.imagemUrl}
                        alt={`Imagem ilustrativa de ${pratoSelecionado.nome}`}
                        className="mx-auto h-56 w-full rounded-xl object-contain md:h-80"
                      />
                    )}

                    <h5 className="mt-5 text-2xl font-black">
                      {pratoSelecionado.nome}
                    </h5>

                    <p className="mt-2 text-sm text-gray-500">
                      {pratoSelecionado.descricao}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3">

                      <div className="rounded-xl bg-lime-50 p-4">

                        <p className="text-xs font-bold text-green-800">
                          💰 Preço
                        </p>

                        <p className="mt-2 text-xl font-black text-green-900">
                          {formatarMoeda(
                            pratoSelecionado.preco
                          )}
                        </p>

                      </div>

                      <div className="rounded-xl bg-amber-50 p-4">

                        <p className="text-xs font-bold text-amber-900">
                          👥 Rendimento
                        </p>

                        <p className="mt-2 text-lg font-black text-amber-900">
                          {pratoSelecionado.pessoas}{" "}
                          {pratoSelecionado.pessoas === 1
                            ? "pessoa"
                            : "pessoas"}
                        </p>

                      </div>

                    </div>

                  </div>

                  <div className="mt-6 rounded-xl border border-green-200 bg-white p-4">

                    <p className="text-sm font-bold text-green-900">
                      ✅ Gerenciamento do produto
                    </p>

                    <p className="mt-2 text-xs leading-6 text-gray-600">
                      Para alterar os dados de um prato
                      publicado, retire-o da vitrine antes
                      de solicitar uma nova correção.
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={retirarPrato}
                    disabled={salvando}
                    className="mt-5 w-full rounded-xl border border-red-300 bg-[#080a0f] px-5 py-4 text-sm font-black text-white transition hover:bg-[#1b2230] disabled:opacity-50"
                  >
                    {salvando
                      ? "⏳ Processando..."
                      : "🗑️ Retirar do cardápio"}
                  </button>

                </div>
              )}

              {/* ======================================= */}
              {/* DADOS DOS NÃO PUBLICADOS                */}
              {/* ======================================= */}

              {!pratoPublicado && (
                <>

                  <div className="grid gap-4 sm:grid-cols-2">

                    <div className="rounded-xl bg-lime-50 p-4">

                      <p className="text-xs text-green-800">
                        💰 Preço
                      </p>

                      <p className="mt-2 text-2xl font-black text-green-900">
                        {formatarMoeda(
                          pratoSelecionado.preco
                        )}
                      </p>

                    </div>

                    <div className="rounded-xl bg-amber-50 p-4">

                      <p className="text-xs text-amber-900">
                        👥 Serve
                      </p>

                      <p className="mt-2 text-2xl font-black text-amber-900">
                        {pratoSelecionado.pessoas}{" "}
                        {pratoSelecionado.pessoas === 1
                          ? "pessoa"
                          : "pessoas"}
                      </p>

                    </div>

                  </div>

                  <div>

                    <h4 className="text-sm font-black">
                      📋 Descrição
                    </h4>

                    <p className="mt-2 whitespace-pre-wrap break-words rounded-xl bg-[#f8f6ef] p-5 text-sm leading-7 text-gray-700">
                      {pratoSelecionado.descricao}
                    </p>

                  </div>

                  {/* =================================== */}
                  {/* IMAGEM JÁ VINCULADA                 */}
                  {/* =================================== */}

                  {pratoSelecionado.imagemUrl && (
                    <div className="rounded-2xl border border-gray-200 bg-[#f8f6ef] p-5">

                      <h4 className="text-lg font-black">
                        🖼️ Imagem do prato
                      </h4>

                      <div className="mt-4 rounded-xl bg-white p-4">

                        <img
                          key={pratoSelecionado.imagemUrl}
                          src={pratoSelecionado.imagemUrl}
                          alt={`Imagem ilustrativa de ${pratoSelecionado.nome}`}
                          className="mx-auto max-h-80 w-full object-contain"
                          onLoad={() => {
                            setImagemCarregou(true);
                            setImagemFalhou(false);
                          }}
                          onError={() => {
                            setImagemCarregou(false);
                            setImagemFalhou(true);
                          }}
                        />

                      </div>

                      {imagemCarregou && (
                        <p className="mt-4 rounded-xl bg-green-100 p-3 text-sm font-bold text-green-800">
                          ✅ Imagem carregada.
                        </p>
                      )}

                      {imagemFalhou && (
                        <p className="mt-4 rounded-xl bg-red-100 p-3 text-sm font-bold text-red-800">
                          ⚠️ Não foi possível carregar a imagem.
                        </p>
                      )}

                      <p className="mt-4 break-all text-xs text-gray-500">
                        {pratoSelecionado.imagemUrl}
                      </p>

                    </div>
                  )}

                  {/* =================================== */}
                  {/* UPLOAD APENAS NA ANÁLISE             */}
                  {/* =================================== */}

                  {!pratoAprovado && (
                    <div className="rounded-2xl border border-gray-200 bg-[#f8f6ef] p-5">

                      <div className="flex flex-wrap items-center justify-between gap-3">

                        <div>

                          <h4 className="text-lg font-black">
                            📷 Preparar imagem ilustrativa
                          </h4>

                          <p className="mt-2 text-sm text-gray-600">
                            Arraste ou selecione uma imagem
                            para vincular ao prato.
                          </p>

                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setMostrarTrocaImagem(
                              !mostrarTrocaImagem
                            )
                          }
                          className="rounded-xl bg-[#19352b] px-4 py-3 text-sm font-bold text-white"
                        >
                          {mostrarTrocaImagem
                            ? "Fechar"
                            : "📷 Gerenciar imagem"}
                        </button>

                      </div>

                      {(mostrarTrocaImagem ||
                        !pratoSelecionado.imagemUrl) && (
                        <>

                          <div
                            onDragOver={arrastarSobreArea}
                            onDragLeave={sairAreaArrasto}
                            onDrop={soltarImagem}
                            className={`mt-5 rounded-2xl border-2 border-dashed p-6 text-center transition ${
                              arrastando
                                ? "border-lime-500 bg-lime-100"
                                : "border-lime-300 bg-white"
                            }`}
                          >

                            <input
                              ref={inputArquivoRef}
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              onChange={alterarArquivo}
                              disabled={salvando}
                              className="hidden"
                            />

                            {previewImagem ? (
                              <>

                                <img
                                  src={previewImagem}
                                  alt="Prévia da imagem"
                                  className="mx-auto max-h-64 w-full object-contain"
                                />

                                <p className="mt-3 break-all text-sm font-bold">
                                  {arquivoImagem?.name}
                                </p>

                              </>
                            ) : (
                              <>

                                <div className="text-4xl">
                                  🖼️
                                </div>

                                <p className="mt-3 font-black">
                                  Arraste sua imagem aqui
                                </p>

                                <p className="mt-2 text-xs text-gray-500">
                                  JPG, PNG ou WEBP — até 5 MB.
                                </p>

                              </>
                            )}

                            <div className="mt-5 flex flex-wrap justify-center gap-3">

                              <button
                                type="button"
                                onClick={() =>
                                  inputArquivoRef.current?.click()
                                }
                                disabled={salvando}
                                className="rounded-xl bg-[#9af000] px-5 py-3 text-sm font-black"
                              >
                                📷 Selecionar imagem
                              </button>

                              {arquivoImagem && (
                                <button
                                  type="button"
                                  onClick={limparImagemTemporaria}
                                  disabled={salvando}
                                  className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-700"
                                >
                                  Remover prévia
                                </button>
                              )}

                            </div>

                          </div>

                          <button
                            type="button"
                            onClick={enviarImagem}
                            disabled={
                              !arquivoImagem ||
                              salvando
                            }
                            className="mt-5 w-full rounded-xl bg-[#9af000] px-5 py-4 text-sm font-black uppercase text-[#10251d] disabled:opacity-50"
                          >
                            {etapaUpload === "enviando"
                              ? "⏳ Enviando..."
                              : etapaUpload === "salvando"
                                ? "⏳ Salvando no Firebase..."
                                : "☁️ Enviar imagem ao Supabase"}
                          </button>

                        </>
                      )}

                    </div>
                  )}

                  {/* =================================== */}
                  {/* APROVADO, AINDA NÃO PUBLICADO        */}
                  {/* =================================== */}

                  {pratoAprovado && (
                    <div className="rounded-2xl border border-green-200 bg-green-50 p-5">

                      <h4 className="text-lg font-black text-green-900">
                        ✅ Prato aprovado
                      </h4>

                      <p className="mt-2 text-sm leading-6 text-green-800">
                        O cadastro já foi analisado.
                        Agora falta disponibilizar
                        o prato no catálogo dos hóspedes.
                      </p>

                      <button
                        type="button"
                        onClick={publicarPrato}
                        disabled={salvando}
                        className="mt-5 w-full rounded-xl bg-[#9af000] px-5 py-4 text-sm font-black text-[#19352b] disabled:opacity-50"
                      >
                        {salvando
                          ? "⏳ Publicando..."
                          : "🌐 Publicar no cardápio"}
                      </button>

                    </div>
                  )}

                  {/* =================================== */}
                  {/* PENDENTE                            */}
                  {/* =================================== */}

                  {pratoPendente && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">

                      <h4 className="text-lg font-black text-amber-900">
                        ⏳ Aguardando sua análise
                      </h4>

                      <p className="mt-2 text-sm text-amber-800">
                        Confira o preço, o rendimento,
                        a descrição e a imagem antes
                        de aprovar.
                      </p>

                      <button
                        type="button"
                        onClick={aprovarPrato}
                        disabled={
                          salvando ||
                          !!arquivoImagem ||
                          !imagemSupabaseValida(
                            pratoSelecionado.imagemUrl
                          )
                        }
                        className="mt-5 w-full rounded-xl bg-green-700 px-5 py-4 text-sm font-black text-white disabled:opacity-50"
                      >
                        {salvando
                          ? "⏳ Processando..."
                          : "✅ Aprovar prato"}
                      </button>

                    </div>
                  )}

                  {/* =================================== */}
                  {/* REJEITADO                           */}
                  {/* =================================== */}

                  {pratoRejeitado && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5">

                      <h4 className="text-lg font-black text-red-900">
                        ❌ Aguardando correção do parceiro
                      </h4>

                      <p className="mt-2 text-sm text-red-800">
                        Motivo registrado:
                      </p>

                      <p className="mt-3 whitespace-pre-wrap rounded-xl bg-white p-4 text-sm text-red-900">
                        {pratoSelecionado.motivoRecusa ||
                          "Motivo não informado."}
                      </p>

                      <p className="mt-3 text-xs text-red-700">
                        Após corrigir o cadastro,
                        o parceiro deverá reenviar
                        o prato para análise.
                      </p>

                    </div>
                  )}

                  {/* =================================== */}
                  {/* SOLICITAR CORREÇÃO                   */}
                  {/* =================================== */}

                  {(pratoPendente || pratoAprovado) && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5">

                      <button
                        type="button"
                        onClick={() =>
                          setMostrarCorrecao(
                            !mostrarCorrecao
                          )
                        }
                        className="flex w-full items-center justify-between gap-3 text-left"
                      >

                        <span className="font-black text-red-900">
                          ❌ Solicitar correção
                        </span>

                        <span className="text-sm font-bold text-red-800">
                          {mostrarCorrecao ? "▲" : "▼"}
                        </span>

                      </button>

                      {mostrarCorrecao && (
                        <>

                          <p className="mt-4 text-sm leading-6 text-red-800">
                            Informe claramente o que o restaurante
                            precisa corrigir.
                          </p>

                          <label
                            htmlFor="motivoRecusa"
                            className="mt-4 block text-sm font-bold text-red-900"
                          >
                            Motivo da correção
                          </label>

                          <textarea
                            id="motivoRecusa"
                            value={motivoRecusa}
                            onChange={(event) =>
                              setMotivoRecusa(
                                event.target.value
                              )
                            }
                            maxLength={1000}
                            rows={4}
                            disabled={salvando}
                            className={classeInput}
                            placeholder="Descreva o que precisa ser corrigido..."
                          />

                          <p className="mt-2 text-xs text-red-700">
                            {motivoRecusa.length}/1000 caracteres
                          </p>

                          <button
                            type="button"
                            onClick={rejeitarPrato}
                            disabled={salvando}
                            className="mt-5 w-full rounded-xl bg-red-600 px-5 py-4 text-sm font-black text-white disabled:opacity-50"
                          >
                            {salvando
                              ? "⏳ Processando..."
                              : "❌ Recusar e solicitar correção"}
                          </button>

                        </>
                      )}

                    </div>
                  )}

                </>
              )}

              {/* ======================================= */}
              {/* MENSAGENS DA AÇÃO                       */}
              {/* ======================================= */}

              {erroAcao && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-800"
                >
                  ⚠️ {erroAcao}
                </div>
              )}

            </div>

          </section>
        )}

        {/* ============================================= */}
        {/* LISTA DOS PRATOS                              */}
        {/* ============================================= */}

        <section className="mt-12">

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

            <div>

              <h3 className="text-2xl font-black">
                🍽️ Pratos cadastrados
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Informações consultadas diretamente
                no Firestore.
              </p>

            </div>

            <span className="rounded-full bg-white px-4 py-2 text-xs font-black shadow-sm">
              {pratosFiltrados.length} resultado(s)
            </span>

          </div>

          {carregando && (
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
              ⏳ Consultando pratos...
            </div>
          )}

          {!carregando &&
            !erroConsulta &&
            pratosFiltrados.length === 0 && (
              <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">

                <div className="text-5xl">
                  🍽️
                </div>

                <h4 className="mt-5 text-xl font-black">
                  Nenhum prato encontrado
                </h4>

                <p className="mt-3 text-sm text-gray-500">
                  Nenhum registro corresponde
                  aos filtros selecionados.
                </p>

              </div>
            )}

          {!carregando &&
            pratosFiltrados.length > 0 && (
              <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">

                {pratosFiltrados.map((prato) => {
                  const status =
                    identificarStatus(prato.status);

                  const publicado =
                    estaPublicado(prato);

                  return (
                    <article
                      key={`${prato.restauranteId}-${prato.id}`}
                      className={`overflow-hidden rounded-[26px] border-2 bg-white shadow-sm ${
                        publicado
                          ? "border-sky-400 shadow-[0_0_24px_rgba(0,145,255,0.55)] hover:shadow-[0_0_36px_rgba(0,145,255,0.8)] transition-shadow duration-300"
                          : status.borda
                      }`}
                    >

                      {/* ============================= */}
                      {/* CABEÇALHO                     */}
                      {/* ============================= */}

                      <div className="bg-[#080a0f] p-5 text-white">

                        <div className="flex flex-wrap gap-2">

                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${status.classe}`}
                          >
                            {status.icone} {status.nome}
                          </span>

                          {publicado && (
                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-900">
                              🌐 Publicado
                            </span>
                          )}

                        </div>

                        <h4 className="mt-4 break-words text-xl font-black">
                          {prato.nome}
                        </h4>

                        <p className="mt-2 text-sm text-amber-200">
                          🏪 {prato.restauranteNome}
                        </p>

                      </div>

                      {/* ============================= */}
                      {/* IMAGEM EM DESTAQUE             */}
                      {/* ============================= */}

                      {prato.imagemUrl ? (
                        <div className="bg-[#f8f6ef] p-4">

                          <img
                            src={prato.imagemUrl}
                            alt={`Imagem ilustrativa de ${prato.nome}`}
                            className="mx-auto h-48 w-full rounded-xl object-contain"
                          />

                        </div>
                      ) : (
                        <div className="flex h-48 items-center justify-center bg-gray-100 text-5xl">
                          🍽️
                        </div>
                      )}

                      {/* ============================= */}
                      {/* INFORMAÇÕES                   */}
                      {/* ============================= */}

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

                            <p className="mt-2 text-lg font-black text-amber-900">
                              {prato.pessoas}{" "}
                              {prato.pessoas === 1
                                ? "pessoa"
                                : "pessoas"}
                            </p>

                          </div>

                        </div>

                        <p className="mt-5 whitespace-pre-wrap break-words text-sm leading-7 text-gray-600">
                          {prato.descricao}
                        </p>

                        {/* STATUS DIFERENCIADO */}

                        {publicado && (
                          <div className="mt-5 rounded-xl border border-sky-300 bg-sky-50 p-4">

                            <p className="text-sm font-black text-green-900">
                              🌐 Produto publicado
                            </p>

                            <p className="mt-2 text-xs leading-6 text-green-800">
                              O prato possui uma versão
                              no catálogo público.
                            </p>

                          </div>
                        )}

                        {!publicado &&
                          prato.status === "aprovado" && (
                            <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm font-bold text-amber-900">
                              ⏳ Aprovado, aguardando publicação.
                            </div>
                          )}

                        {prato.status === "rejeitado" && (
                          <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-800">
                            ❌ Correção solicitada.
                          </div>
                        )}

                        {prato.status === "pendente" && (
                          <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm font-bold text-amber-900">
                            ⏳ Aguardando revisão.
                          </div>
                        )}

                        <div className="mt-5 rounded-xl bg-[#f8f6ef] p-4 text-xs text-gray-600">

                          <p>
                            {prato.imagemUrl
                              ? "📷 Imagem vinculada."
                              : "📷 Imagem não cadastrada."}
                          </p>

                          <p className="mt-2">
                            Criado em:{" "}
                            {formatarData(prato.criadoEm)}
                          </p>

                        </div>

                        {/* BOTÃO DINÂMICO */}

                        <button
                          type="button"
                          onClick={() =>
                            abrirAnalise(prato)
                          }
                          disabled={salvando}
                          className={`mt-5 w-full rounded-xl px-5 py-4 text-sm font-black transition disabled:opacity-60 ${
                            publicado
                              ? "bg-[#080a0f] text-white ring-1 ring-sky-400 shadow-[0_0_16px_rgba(0,145,255,0.55)] hover:shadow-[0_0_24px_rgba(0,145,255,0.85)]"
                              : prato.status === "pendente"
                                ? "bg-amber-400 text-black hover:bg-amber-300"
                                : "bg-[#19352b] text-white hover:bg-[#28533e]"
                          }`}
                        >
                          {publicado
                            ? "🌐 Gerenciar produto →"
                            : prato.status === "pendente"
                              ? "🔎 Analisar prato →"
                              : prato.status === "aprovado"
                                ? "🌐 Preparar publicação →"
                                : "📋 Consultar correção →"}
                        </button>

                      </div>

                    </article>
                  );
                })}

              </div>
            )}

        </section>

      </div>

    </main>
  );
}

export default AdminPratos;