import type {
  Categoria,
} from "./catalogoTypes";

/* =========================================================
   CONFIGURAÇÕES
========================================================= */

export const TAXA_ENTREGA_ESTIMADA = 20;

export const CHECKOUT_VALIDADO_NO_SERVIDOR = true;

/* =========================================================
   CATEGORIAS
========================================================= */

export const categorias: Array<{
  nome: "Todos" | Categoria;
  icone: string;
}> = [
  {
    nome: "Todos",
    icone: "✨",
  },

  {
    nome: "Hambúrgueres",
    icone: "🍔",
  },

  {
    nome: "Pizzarias",
    icone: "🍕",
  },

  {
    nome: "Jantinhas e Espetinhos",
    icone: "🍢",
  },

  {
    nome: "Almoço e Comida Caseira",
    icone: "🍛",
  },

  {
    nome: "Gastronomia Especial",
    icone: "🍝",
  },

  {
    nome: "Cafeterias e Sobremesas",
    icone: "☕",
  },
];