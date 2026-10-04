export type Categoria =
  | "Hambúrgueres"
  | "Pizzarias"
  | "Jantinhas e Espetinhos"
  | "Almoço e Comida Caseira"
  | "Gastronomia Especial"
  | "Cafeterias e Sobremesas";

export type ModalidadeEntrega =
  | "entrega_propria"
  | "retirada_anfitriao";

export type Atendimento =
  | "entrega"
  | "retirada_restaurante"
  | "retirada_anfitriao";

export type Pagamento =
  | "pix"
  | "credito"
  | "debito"
  | "dinheiro";

export interface RestaurantePublico {
  id: string;

  nome: string;

  categoria: string;

  descricao: string;

  whatsapp: string;

  telefone: string;

  modalidadeEntrega: ModalidadeEntrega;

  horarioFuncionamento: string;

  logoUrl: string;

  imagemCapa: string;

  endereco: string;

  ativo: boolean;

  aceitaRetirada: boolean;
}

export interface PratoPublico {
  id: string;

  nome: string;

  descricao: string;

  preco: number;

  pessoas: number;

  imagemUrl: string;

  disponivel: boolean;

  status: string;
}

export interface ItemCarrinho {
  restauranteId: string;

  restauranteNome: string;

  pratoId: string;

  imagemUrl: string;

  nome: string;

  preco: number;

  quantidade: number;

  observacao: string;
}

export interface ItemConsultaValidado {
  pratoId: string;

  nome: string;

  descricao: string;

  imagemUrl: string;

  precoUnitario: number;

  quantidade: number;

  subtotal: number;

  observacao: string;
}

export interface RespostaConsulta {
  sucesso: boolean;

  erro?: string;

  consultaId?: string;

  restauranteNome?: string;

  restauranteWhatsapp?: string;

  subtotal?: number;

  taxaEntrega?: number;

  totalEstimado?: number;

  atendimento?: Atendimento;

  atendimentoDescricao?: string;

  pagamento?: Pagamento;

  pagamentoDescricao?: string;

  totalItens?: number;

  itens?: ItemConsultaValidado[];
}