
import { auth } from "../firebase/config";

// ==========================================
// CONFIGURAÇÕES
// ==========================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const NOME_FUNCAO = "upload-imagem-prato";

const TAMANHO_MAXIMO = 5 * 1024 * 1024;

const TIPOS_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

// ==========================================
// TIPOS
// ==========================================

interface DadosUpload {
  arquivo: File;
  restauranteId: string;
  pratoId: string;
}

interface RespostaUpload {
  sucesso: boolean;
  mensagem?: string;
  erro?: string;
  imagemUrl?: string;
  caminho?: string;
  bucket?: string;
}

export interface ResultadoUpload {
  imagemUrl: string;
  caminho: string;
}

// ==========================================
// VALIDAR ARQUIVO
// ==========================================

function validarArquivo(arquivo: File): void {
  if (!arquivo) {
    throw new Error(
      "Selecione uma imagem antes de continuar."
    );
  }

  if (!TIPOS_PERMITIDOS.includes(arquivo.type)) {
    throw new Error(
      "Formato inválido. Utilize JPG, PNG ou WEBP."
    );
  }

  if (arquivo.size === 0) {
    throw new Error("O arquivo selecionado está vazio.");
  }

  if (arquivo.size > TAMANHO_MAXIMO) {
    throw new Error(
      "A imagem deve ter no máximo 5 MB."
    );
  }
}

// ==========================================
// VALIDAR IDENTIFICADORES
// ==========================================

function validarIdentificador(
  valor: string,
  nome: string
): void {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(valor)) {
    throw new Error(
      `Identificação inválida: ${nome}.`
    );
  }
}

// ==========================================
// UPLOAD SEGURO
// ==========================================

export async function uploadImagemPrato({
  arquivo,
  restauranteId,
  pratoId,
}: DadosUpload): Promise<ResultadoUpload> {
  // ----------------------------------------
  // VERIFICAR CONFIGURAÇÕES PÚBLICAS
  // ----------------------------------------

  if (
    !SUPABASE_URL ||
    !SUPABASE_PUBLISHABLE_KEY
  ) {
    throw new Error(
      "A integração com o Supabase ainda não está configurada."
    );
  }

  // ----------------------------------------
  // VALIDAR DADOS
  // ----------------------------------------

  validarArquivo(arquivo);

  validarIdentificador(
    restauranteId,
    "restaurante"
  );

  validarIdentificador(pratoId, "prato");

  // ----------------------------------------
  // VERIFICAR SESSÃO DO FIREBASE
  // ----------------------------------------

  const usuario = auth.currentUser;

  if (!usuario) {
    throw new Error(
      "Sua sessão expirou. Faça login novamente."
    );
  }

  // Obtém o token Firebase atualizado.
  // A autorização real será feita na função,
  // não somente no navegador.

  const firebaseToken = await usuario.getIdToken();

  // ----------------------------------------
  // PREPARAR ARQUIVO
  // ----------------------------------------

  const formulario = new FormData();

  formulario.append("imagem", arquivo);

  formulario.append(
    "restauranteId",
    restauranteId
  );

  formulario.append("pratoId", pratoId);

  // ----------------------------------------
  // CHAMAR A EDGE FUNCTION
  // ----------------------------------------

  const url =
    `${SUPABASE_URL.replace(/\/$/, "")}` +
    `/functions/v1/${NOME_FUNCAO}`;

  let resposta: Response;

  try {
    resposta = await fetch(url, {
      method: "POST",

      headers: {
        Authorization: `Bearer ${firebaseToken}`,

        apikey: SUPABASE_PUBLISHABLE_KEY,
      },

      body: formulario,
    });
  } catch (erro) {
    console.error(
      "Falha de comunicação com a função:",
      erro
    );

    throw new Error(
      "Não foi possível conectar ao serviço de imagens. " +
      "Confira sua conexão e as configurações da função."
    );
  }

  // ----------------------------------------
  // LER RESPOSTA
  // ----------------------------------------

  let dados: RespostaUpload;

  try {
    dados = (await resposta.json()) as RespostaUpload;
  } catch {
    throw new Error(
      `O servidor retornou uma resposta inválida (${resposta.status}).`
    );
  }

  // ----------------------------------------
  // TRATAR ERROS
  // ----------------------------------------

  if (!resposta.ok || !dados.sucesso) {
    throw new Error(
      dados.erro ||
        `Não foi possível enviar a imagem (${resposta.status}).`
    );
  }

  // ----------------------------------------
  // VALIDAR RESULTADO
  // ----------------------------------------

  if (
    typeof dados.imagemUrl !== "string" ||
    !dados.imagemUrl.startsWith(
      `${SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/imagens-pratos/`
    ) ||
    typeof dados.caminho !== "string" ||
    !dados.caminho
  ) {
    throw new Error(
      "A imagem foi processada, mas o servidor não retornou uma URL válida."
    );
  }

  return {
    imagemUrl: dados.imagemUrl,
    caminho: dados.caminho,
  };
}