// src/data/restaurantes.ts

export type CategoriaRestaurante =
  | "Hambúrgueres"
  | "Pizzarias"
  | "Jantinhas e Espetinhos"
  | "Almoço e Comida Caseira"
  | "Gastronomia Especial"
  | "Cafeterias e Sobremesas";

export type ModalidadeEntrega =
  | "entrega_propria"
  | "retirada_anfitriao";

export interface Prato {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  imagem?: string;
  disponivel: boolean;
}

export interface Restaurante {
  id: string;
  nome: string;
  categoria: CategoriaRestaurante;

  descricao: string;
  endereco: string;

  telefone: string;
  whatsapp: string;

  logo?: string;
  imagemCapa?: string;

  horarioFuncionamento: string;
  diasFuncionamento: string[];

  modalidadeEntrega: ModalidadeEntrega;

  taxaEntrega?: number;
  pedidoMinimo?: number;

  formasPagamento: string[];

  pratos: Prato[];

  ativo: boolean;

  // Informações privadas da administração
  comissao: number;
}

// Restaurantes serão adicionados somente
// após confirmação das parcerias.

export const restaurantes: Restaurante[] = [];

// Calcula a comissão somente sobre
// o valor dos alimentos confirmados.

export function calcularComissao(
  valorAlimentos: number,
  percentual: number
): number {
  return Number(
    (valorAlimentos * percentual / 100).toFixed(2)
  );
}

// Retorna o percentual de acordo
// com a modalidade de entrega.

export function obterComissao(
  modalidade: ModalidadeEntrega
): number {
  return modalidade === "entrega_propria"
    ? 10
    : 15;
}