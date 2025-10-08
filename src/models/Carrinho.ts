import { ObjectId } from 'mongodb';

interface ProdutoSimplificado {
  _id: ObjectId;
  nome: string;
  preco: number;
  urlfoto: string;
  descricao: string;
}

export interface ItemCarrinho {
  _id: ObjectId;
  produto: ProdutoSimplificado;
  quantidade: number;
  criadoEm: Date;
}

export interface Carrinho {
  _id?: ObjectId;
  usuarioId: ObjectId;
  itens: ItemCarrinho[];
  total: number;
  criadoEm: Date;
  atualizadoEm: Date;
}

