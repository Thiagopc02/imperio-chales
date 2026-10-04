
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

import { isAdmin } from "../firebase/admin";

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

  const [, setImagemCarregou] =
    useState(false);

  const [imagemFalhou, setImagemFalhou] =
    useState(false);

  // ===================================================
  // IDENTIFICAR ADMINISTRADOR
  // ===================================================

  function verificarAdministrador(): boolean {
    const usuarioAtual = auth.currentUser;

    if (
      !usuarioAtual ||
      !isAdmin(usuarioAtual.uid, usuarioAtual.email)
    ) {
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
            analisadoPor: auth.currentUser?.uid ?? "",
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
              analisadoPor: auth.currentUser?.uid ?? "",
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
    "mt-2 w-full rounded-xl border border-white/10 " +
    "bg-[#111111] px-4 py-3 text-sm text-white " +
    "outline-none placeholder:text-white/25 " +
    "focus:border-[#ffd429]/60 focus:ring-2 focus:ring-[#ffd429]/10";

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

  function classeStatusEscuro(
    status: StatusPrato
  ): string {
    if (status === "aprovado") {
      return "border-emerald-400/25 bg-emerald-400/10 text-emerald-300";
    }

    if (status === "rejeitado") {
      return "border-red-500/25 bg-red-500/10 text-red-400";
    }

    return "border-[#ffd429]/25 bg-[#ffd429]/10 text-[#ffd429]";
  }

  // ===================================================
  // INTERFACE
  // ===================================================

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
      {/* =================================================
          CABEÇALHO
      ================================================= */}

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
              draggable={false}
              className="h-10 w-10 object-contain"
            />

            <div className="hidden sm:block">
              <p className="text-[11px] font-black uppercase text-white">
                CENTRAL ADMINISTRATIVA
              </p>

              <p className="mt-1 text-[7px] font-black uppercase tracking-[0.18em] text-[#ffd429]">
                GESTÃO DE PRATOS
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              to="/admin/restaurantes"
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
              RESTAURANTES
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

      {/* =================================================
          CONTEÚDO
      ================================================= */}

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* =================================================
            TÍTULO
        ================================================= */}

        <section className="text-center">
          <p className="text-[8px] font-black uppercase tracking-[0.22em] text-[#ffd429]">
            CATÁLOGO
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
            GESTÃO DE{" "}
            <span className="text-[#ffd429]">
              PRATOS
            </span>
          </h1>
        </section>

        {/* =================================================
            INDICADORES
        ================================================= */}

        <section className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              titulo: "PENDENTES",
              valor: totalPendentes,
              cor: "text-[#ffd429]",
            },
            {
              titulo: "APROVADOS",
              valor: totalAprovados,
              cor: "text-emerald-400",
            },
            {
              titulo: "CORREÇÕES",
              valor: totalRejeitados,
              cor: "text-red-400",
            },
            {
              titulo: "PUBLICADOS",
              valor: totalPublicados,
              cor: "text-sky-400",
            },
          ].map((item) => (
            <article
              key={item.titulo}
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
                  md:text-4xl
                  ${item.cor}
                `}
              >
                {carregando ? "—" : item.valor}
              </p>

              <p className="mt-2 text-[8px] font-black uppercase tracking-[0.12em] text-white/30">
                {item.titulo}
              </p>
            </article>
          ))}
        </section>

        {/* =================================================
            MENSAGENS
        ================================================= */}

        {erroConsulta && (
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
            {erroConsulta}
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
            BUSCA E FILTROS
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
              onChange={(event) =>
                setBusca(event.target.value)
              }
              placeholder="Buscar prato ou restaurante..."
              className="
                min-w-0
                flex-1
                rounded-xl
                border
                border-white/10
                bg-[#111111]
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
                  titulo: "CORREÇÕES",
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
                      filtro === opcao.valor
                        ? "border-[#ffd429] bg-[#ffd429] text-black"
                        : "border-white/10 bg-white/[0.03] text-white/45"
                    }
                  `}
                >
                  {opcao.titulo}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* =================================================
            PAINEL DO PRATO SELECIONADO
        ================================================= */}

        {pratoSelecionado && (
          <section
            className="
              mt-8
              overflow-hidden
              rounded-[28px]
              border
              border-white/10
              bg-gradient-to-br
              from-[#151515]
              via-[#0b0b0b]
              to-black
              shadow-[0_25px_70px_rgba(0,0,0,.55)]
            "
          >
            {/* CABEÇALHO */}

            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 p-5 md:p-7">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`
                      rounded-full
                      border
                      px-3
                      py-1.5
                      text-[8px]
                      font-black
                      uppercase
                      ${
                        pratoPublicado
                          ? "border-sky-400/30 bg-sky-400/10 text-sky-300"
                          : classeStatusEscuro(pratoSelecionado.status)
                      }
                    `}
                  >
                    {pratoPublicado
                      ? "PUBLICADO"
                      : identificarStatus(
                          pratoSelecionado.status
                        ).nome}
                  </span>
                </div>

                <h2 className="mt-3 text-2xl font-black uppercase md:text-3xl">
                  {pratoSelecionado.nome}
                </h2>

                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.08em] text-[#ffd429]">
                  {pratoSelecionado.restauranteNome}
                </p>
              </div>

              <button
                type="button"
                onClick={fecharAnalise}
                disabled={salvando}
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
                  disabled:opacity-50
                "
              >
                FECHAR
              </button>
            </div>

            <div className="grid gap-6 p-5 md:p-7 lg:grid-cols-[0.9fr_1.1fr]">
              {/* ============================================
                  COLUNA VISUAL
              ============================================ */}

              <div>
                <div
                  className="
                    overflow-hidden
                    rounded-[20px]
                    border
                    border-white/10
                    bg-black
                  "
                >
                  {pratoSelecionado.imagemUrl ? (
                    <img
                      key={pratoSelecionado.imagemUrl}
                      src={pratoSelecionado.imagemUrl}
                      alt={`Imagem ilustrativa de ${pratoSelecionado.nome}`}
                      className="h-[280px] w-full object-contain p-4"
                      onLoad={() => {
                        setImagemCarregou(true);
                        setImagemFalhou(false);
                      }}
                      onError={() => {
                        setImagemCarregou(false);
                        setImagemFalhou(true);
                      }}
                    />
                  ) : (
                    <div className="flex h-[280px] items-center justify-center">
                      <span className="text-5xl opacity-30">
                        🍽️
                      </span>
                    </div>
                  )}
                </div>

                {imagemFalhou && (
                  <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-bold text-red-400">
                    Não foi possível carregar a imagem.
                  </p>
                )}

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-[7px] font-black uppercase text-white/25">
                      PREÇO
                    </p>

                    <p className="mt-2 text-xl font-black text-emerald-400">
                      {formatarMoeda(
                        pratoSelecionado.preco
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-[7px] font-black uppercase text-white/25">
                      SERVE
                    </p>

                    <p className="mt-2 text-sm font-black text-white">
                      {pratoSelecionado.pessoas}{" "}
                      {pratoSelecionado.pessoas === 1
                        ? "PESSOA"
                        : "PESSOAS"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.025] p-4">
                  <p className="text-[7px] font-black uppercase text-white/25">
                    DESCRIÇÃO
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-white/45">
                    {pratoSelecionado.descricao ||
                      "Sem descrição."}
                  </p>
                </div>
              </div>

              {/* ============================================
                  COLUNA DE AÇÕES
              ============================================ */}

              <div className="space-y-4">
                {/* PUBLICADO */}

                {pratoPublicado && (
                  <div className="rounded-[20px] border border-sky-400/20 bg-sky-400/[0.06] p-5">
                    <p className="text-[8px] font-black uppercase tracking-[0.14em] text-sky-300">
                      PRODUTO PUBLICADO
                    </p>

                    <h3 className="mt-2 text-lg font-black uppercase">
                      DISPONÍVEL NO CARDÁPIO
                    </h3>

                    <button
                      type="button"
                      onClick={retirarPrato}
                      disabled={salvando}
                      className="
                        mt-5
                        w-full
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
                      {salvando
                        ? "PROCESSANDO..."
                        : "RETIRAR DO CARDÁPIO"}
                    </button>
                  </div>
                )}

                {/* UPLOAD DE IMAGEM */}

                {!pratoPublicado &&
                  !pratoAprovado && (
                    <div className="rounded-[20px] border border-white/10 bg-white/[0.025] p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#ffd429]">
                            IMAGEM
                          </p>

                          <h3 className="mt-2 text-lg font-black uppercase">
                            FOTO DO PRATO
                          </h3>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setMostrarTrocaImagem(
                              !mostrarTrocaImagem
                            )
                          }
                          className="
                            rounded-xl
                            border
                            border-white/10
                            bg-white/[0.04]
                            px-4
                            py-3
                            text-[8px]
                            font-black
                            uppercase
                            text-white
                          "
                        >
                          {mostrarTrocaImagem
                            ? "FECHAR"
                            : "GERENCIAR"}
                        </button>
                      </div>

                      {(mostrarTrocaImagem ||
                        !pratoSelecionado.imagemUrl) && (
                        <>
                          <div
                            onDragOver={arrastarSobreArea}
                            onDragLeave={sairAreaArrasto}
                            onDrop={soltarImagem}
                            className={`
                              mt-4
                              rounded-[18px]
                              border
                              border-dashed
                              p-5
                              text-center
                              transition
                              ${
                                arrastando
                                  ? "border-[#ffd429] bg-[#ffd429]/10"
                                  : "border-white/15 bg-black/40"
                              }
                            `}
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
                                  className="mx-auto max-h-56 w-full object-contain"
                                />

                                <p className="mt-3 break-all text-[9px] text-white/35">
                                  {arquivoImagem?.name}
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="text-sm font-black uppercase text-white/60">
                                  ARRASTE A IMAGEM AQUI
                                </p>

                                <p className="mt-2 text-[9px] text-white/25">
                                  JPG, PNG OU WEBP • ATÉ 5 MB
                                </p>
                              </>
                            )}

                            <div className="mt-4 flex flex-wrap justify-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  inputArquivoRef.current?.click()
                                }
                                disabled={salvando}
                                className="
                                  rounded-xl
                                  bg-[#ffd429]
                                  px-5
                                  py-3
                                  text-[9px]
                                  font-black
                                  uppercase
                                  text-black
                                "
                              >
                                SELECIONAR
                              </button>

                              {arquivoImagem && (
                                <button
                                  type="button"
                                  onClick={limparImagemTemporaria}
                                  disabled={salvando}
                                  className="
                                    rounded-xl
                                    border
                                    border-white/10
                                    px-5
                                    py-3
                                    text-[9px]
                                    font-black
                                    uppercase
                                    text-white/50
                                  "
                                >
                                  REMOVER
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
                            className="
                              mt-4
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
                            {etapaUpload === "enviando"
                              ? "ENVIANDO..."
                              : etapaUpload === "salvando"
                              ? "SALVANDO..."
                              : "ENVIAR IMAGEM"}
                          </button>
                        </>
                      )}
                    </div>
                  )}

                {/* PENDENTE */}

                {pratoPendente &&
                  !pratoPublicado && (
                    <div className="rounded-[20px] border border-[#ffd429]/20 bg-[#ffd429]/[0.05] p-5">
                      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#ffd429]">
                        ANÁLISE
                      </p>

                      <h3 className="mt-2 text-lg font-black uppercase">
                        AGUARDANDO APROVAÇÃO
                      </h3>

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
                        {salvando
                          ? "PROCESSANDO..."
                          : "APROVAR PRATO"}
                      </button>
                    </div>
                  )}

                {/* APROVADO */}

                {pratoAprovado &&
                  !pratoPublicado && (
                    <div className="rounded-[20px] border border-emerald-400/20 bg-emerald-400/[0.05] p-5">
                      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-emerald-300">
                        APROVADO
                      </p>

                      <h3 className="mt-2 text-lg font-black uppercase">
                        PRONTO PARA PUBLICAR
                      </h3>

                      <button
                        type="button"
                        onClick={publicarPrato}
                        disabled={salvando}
                        className="
                          mt-5
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
                        {salvando
                          ? "PUBLICANDO..."
                          : "PUBLICAR NO CARDÁPIO"}
                      </button>
                    </div>
                  )}

                {/* REJEITADO */}

                {pratoRejeitado &&
                  !pratoPublicado && (
                    <div className="rounded-[20px] border border-red-500/20 bg-red-500/[0.05] p-5">
                      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-red-400">
                        CORREÇÃO SOLICITADA
                      </p>

                      <p className="mt-3 whitespace-pre-wrap text-xs leading-6 text-white/45">
                        {pratoSelecionado.motivoRecusa ||
                          "Motivo não informado."}
                      </p>
                    </div>
                  )}

                {/* SOLICITAR CORREÇÃO */}

                {!pratoPublicado &&
                  (pratoPendente ||
                    pratoAprovado) && (
                    <div className="rounded-[20px] border border-red-500/15 bg-red-500/[0.035] p-5">
                      <button
                        type="button"
                        onClick={() =>
                          setMostrarCorrecao(
                            !mostrarCorrecao
                          )
                        }
                        className="
                          flex
                          w-full
                          items-center
                          justify-between
                          gap-3
                          text-left
                        "
                      >
                        <span className="text-[10px] font-black uppercase text-red-400">
                          SOLICITAR CORREÇÃO
                        </span>

                        <span className="text-xs text-red-400">
                          {mostrarCorrecao
                            ? "▲"
                            : "▼"}
                        </span>
                      </button>

                      {mostrarCorrecao && (
                        <>
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
                            placeholder="Informe o que precisa ser corrigido..."
                          />

                          <p className="mt-2 text-right text-[8px] text-white/20">
                            {motivoRecusa.length}/1000
                          </p>

                          <button
                            type="button"
                            onClick={rejeitarPrato}
                            disabled={salvando}
                            className="
                              mt-3
                              w-full
                              rounded-xl
                              bg-red-500
                              px-5
                              py-4
                              text-[10px]
                              font-black
                              uppercase
                              text-white
                              disabled:opacity-40
                            "
                          >
                            {salvando
                              ? "PROCESSANDO..."
                              : "ENVIAR CORREÇÃO"}
                          </button>
                        </>
                      )}
                    </div>
                  )}

                {/* ERRO DE AÇÃO */}

                {erroAcao && (
                  <div
                    role="alert"
                    className="
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
                    {erroAcao}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* =================================================
            LISTA DOS PRATOS
        ================================================= */}

        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.18em] text-[#ffd429]">
                PRODUTOS
              </p>

              <h2 className="mt-2 text-2xl font-black uppercase">
                PRATOS CADASTRADOS
              </h2>
            </div>

            <span className="text-xs font-black text-white/30">
              {pratosFiltrados.length}
            </span>
          </div>

          {carregando && (
            <div className="rounded-[24px] border border-white/10 bg-[#0a0a0a] p-10 text-center text-xs text-white/35">
              CARREGANDO PRATOS...
            </div>
          )}

          {!carregando &&
            !erroConsulta &&
            pratosFiltrados.length ===
              0 && (
              <div className="rounded-[24px] border border-dashed border-white/10 p-10 text-center">
                <p className="text-sm font-black uppercase text-white/50">
                  NENHUM PRATO ENCONTRADO
                </p>
              </div>
            )}

          {!carregando &&
            pratosFiltrados.length >
              0 && (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {pratosFiltrados.map((prato) => {
                  const publicado =
                    estaPublicado(prato);

                  return (
                    <article
                      key={`${prato.restauranteId}-${prato.id}`}
                      className="
                        group
                        overflow-hidden
                        rounded-[24px]
                        border
                        border-white/10
                        bg-gradient-to-br
                        from-[#151515]
                        via-[#0b0b0b]
                        to-black
                        transition
                        hover:-translate-y-1
                        hover:border-[#ffd429]/35
                      "
                    >
                      {/* IMAGEM */}

                      <div className="relative h-48 overflow-hidden bg-black">
                        {prato.imagemUrl ? (
                          <img
                            src={prato.imagemUrl}
                            alt={`Imagem ilustrativa de ${prato.nome}`}
                            className="
                              h-full
                              w-full
                              object-contain
                              p-3
                              transition-transform
                              duration-300
                              group-hover:scale-[1.03]
                            "
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-5xl opacity-25">
                            🍽️
                          </div>
                        )}

                        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                          <span
                            className={`
                              rounded-full
                              border
                              px-3
                              py-1.5
                              text-[7px]
                              font-black
                              uppercase
                              ${
                                publicado
                                  ? "border-sky-400/30 bg-black/80 text-sky-300"
                                  : classeStatusEscuro(
                                      prato.status
                                    )
                              }
                            `}
                          >
                            {publicado
                              ? "PUBLICADO"
                              : identificarStatus(
                                  prato.status
                                ).nome}
                          </span>
                        </div>
                      </div>

                      {/* DADOS */}

                      <div className="p-5">
                        <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#ffd429]">
                          {prato.restauranteNome}
                        </p>

                        <h3 className="mt-2 break-words text-lg font-black uppercase">
                          {prato.nome}
                        </h3>

                        <div className="mt-4 flex items-end justify-between gap-3">
                          <div>
                            <p className="text-[7px] font-black uppercase text-white/25">
                              PREÇO
                            </p>

                            <p className="mt-1 text-lg font-black text-emerald-400">
                              {formatarMoeda(
                                prato.preco
                              )}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-[7px] font-black uppercase text-white/25">
                              SERVE
                            </p>

                            <p className="mt-1 text-xs font-black text-white">
                              {prato.pessoas}{" "}
                              {prato.pessoas === 1
                                ? "PESSOA"
                                : "PESSOAS"}
                            </p>
                          </div>
                        </div>

                        <p className="mt-4 line-clamp-2 text-xs leading-5 text-white/35">
                          {prato.descricao}
                        </p>

                        <p className="mt-4 text-[8px] text-white/20">
                          {formatarData(
                            prato.criadoEm
                          )}
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            abrirAnalise(prato)
                          }
                          disabled={salvando}
                          className={`
                            mt-5
                            w-full
                            rounded-xl
                            px-5
                            py-4
                            text-[9px]
                            font-black
                            uppercase
                            transition
                            disabled:opacity-40
                            ${
                              publicado
                                ? "border border-sky-400/25 bg-sky-400/10 text-sky-300"
                                : prato.status ===
                                  "pendente"
                                ? "bg-[#ffd429] text-black"
                                : "border border-white/10 bg-white/[0.04] text-white"
                            }
                          `}
                        >
                          {publicado
                            ? "GERENCIAR"
                            : prato.status ===
                              "pendente"
                            ? "ANALISAR"
                            : prato.status ===
                              "aprovado"
                            ? "PUBLICAR"
                            : "VER CORREÇÃO"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
        </section>

        {/* =================================================
            RODAPÉ
        ================================================= */}

        <footer className="mt-14 border-t border-white/10 py-10 text-center">
          <img
            src="/coroa.png"
            alt=""
            draggable={false}
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

export default AdminPratos;
