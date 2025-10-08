// Em c:\Users\04518405188\Documents\Atividades-da-sala\1023-backend-2semestre\src\carrinho\carrinho.ts

import { Request, Response } from 'express';
import { ObjectId, WithId } from 'mongodb';
import { db } from '../database/banco-mongo.js';
import { Carrinho, ItemCarrinho } from '../models/Carrinho.js';

// Interface auxiliar para o tipo Produto, garantindo consistência
export interface Produto {
    _id: ObjectId;
    nome: string;
    preco: number;
    urlfoto: string;
    descricao: string;
}

class CarrinhoController {

    // Método auxiliar para buscar um produto pelo ID
    private async buscarProduto(produtoId: string): Promise<Produto | null> {
        if (!ObjectId.isValid(produtoId)) return null;
        return db.collection<Produto>('produtos').findOne({ _id: new ObjectId(produtoId) });
    }

    // Método auxiliar para calcular o total do carrinho
    private calcularTotal(itens: ItemCarrinho[]): number {
        return itens.reduce((total, item) => total + (item.produto.preco * item.quantidade), 0);
    }

    // Adicionar item ao carrinho
    adicionar = async (req: Request, res: Response) => {
        try {
            const { produtoId, quantidade = 1, usuarioId } = req.body;
            if (!produtoId || !usuarioId) {
                return res.status(400).json({ message: 'ID do produto e do usuário são obrigatórios' });
            }

            if (Number(quantidade) <= 0) {
                return res.status(400).json({ message: 'A quantidade deve ser um número positivo.' });
            }

            const produto = await this.buscarProduto(produtoId);
            if (!produto) {
                return res.status(404).json({ message: 'Produto não encontrado' });
            }

            const query = { usuarioId: new ObjectId(usuarioId) };
            let carrinho: WithId<Carrinho> | null = await db.collection<Carrinho>('carrinhos').findOne(query);

            if (!carrinho) {
                // Se não existe, cria um novo carrinho
                const novoCarrinhoDoc: Carrinho = {
                    _id: new ObjectId(),
                    usuarioId: new ObjectId(usuarioId),
                    itens: [],
                    total: 0,
                    criadoEm: new Date(),
                    atualizadoEm: new Date(),
                };
                const insertResult = await db.collection<Carrinho>('carrinhos').insertOne(novoCarrinhoDoc);
                carrinho = { ...novoCarrinhoDoc, _id: insertResult.insertedId };
            }

            const itemIndex = carrinho.itens.findIndex(item => item.produto._id.toString() === produtoId);
            if (itemIndex > -1) {
                // Se o item já existe, atualiza a quantidade
                carrinho.itens[itemIndex].quantidade += Number(quantidade);
            } else {
                // Se não, adiciona o novo item
                carrinho.itens.push({
                    _id: new ObjectId(),
                    produto: produto,
                    quantidade: Number(quantidade),
                    criadoEm: new Date()
                });
            }

            // Recalcula o total e atualiza o documento no banco
            carrinho.total = this.calcularTotal(carrinho.itens);
            carrinho.atualizadoEm = new Date();

            const updatedDoc = await db.collection<Carrinho>('carrinhos').findOneAndUpdate(
                { _id: carrinho._id },
                { $set: { itens: carrinho.itens, total: carrinho.total, atualizadoEm: carrinho.atualizadoEm } },
                { returnDocument: 'after' }
            );

            res.status(200).json(updatedDoc);
        } catch (error) {
            console.error('Erro ao adicionar item ao carrinho:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }

    // Listar itens do carrinho
    listar = async (req: Request, res: Response) => {
        try {
            const { usuarioId } = req.query;
            if (!usuarioId) {
                return res.status(400).json({ message: 'ID do usuário é obrigatório' });
            }
            const carrinho = await db.collection<Carrinho>('carrinhos').findOne({ usuarioId: new ObjectId(usuarioId as string) });
            res.status(200).json(carrinho ? carrinho.itens : []);
        } catch (error) {
            console.error('Erro ao listar carrinho:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }

    // Atualizar quantidade de um item
    atualizarQuantidade = async (req: Request, res: Response) => {
        try {
            const { itemId } = req.params;
            const { quantidade, usuarioId } = req.body;
            if (!itemId || quantidade === undefined || !usuarioId) {
                return res.status(400).json({ message: 'IDs do item e usuário, e quantidade são obrigatórios' });
            }

            if (isNaN(Number(quantidade))) {
                return res.status(400).json({ message: 'A quantidade deve ser um número válido.' });
            }

            const carrinho = await db.collection<Carrinho>('carrinhos').findOne({ usuarioId: new ObjectId(usuarioId) });
            if (!carrinho) {
                return res.status(404).json({ message: 'Carrinho não encontrado' });
            }

            const itemIndex = carrinho.itens.findIndex(item => item._id.toString() === itemId);
            if (itemIndex === -1) {
                return res.status(404).json({ message: 'Item não encontrado no carrinho' });
            }

            if (Number(quantidade) <= 0) {
                carrinho.itens.splice(itemIndex, 1); // Remove se a quantidade for 0 ou menor
            } else {
                carrinho.itens[itemIndex].quantidade = Number(quantidade);
            }

            carrinho.total = this.calcularTotal(carrinho.itens);
            const updatedDoc = await db.collection<Carrinho>('carrinhos').findOneAndUpdate(
                { _id: carrinho._id },
                { $set: { itens: carrinho.itens, total: carrinho.total, atualizadoEm: new Date() } },
                { returnDocument: 'after' }
            );
            res.status(200).json(updatedDoc);
        } catch (error) {
            console.error('Erro ao atualizar quantidade:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }
    
    // Remover item do carrinho
    removerItem = async (req: Request, res: Response) => {
        try {
            const { carrinhoId: usuarioId, itemId } = req.params;
            if (!itemId || !usuarioId) {
                return res.status(400).json({ message: 'IDs do item e usuário são obrigatórios' });
            }

            const carrinho = await db.collection<Carrinho>('carrinhos').findOne({ usuarioId: new ObjectId(usuarioId) });
            if (!carrinho) {
                return res.status(404).json({ message: 'Carrinho não encontrado' });
            }

            const novosItens = carrinho.itens.filter(item => item._id.toString() !== itemId);
            if (novosItens.length === carrinho.itens.length) {
                return res.status(404).json({ message: 'Item não encontrado no carrinho' });
            }

            carrinho.total = this.calcularTotal(novosItens);
            const updatedDoc = await db.collection<Carrinho>('carrinhos').findOneAndUpdate(
                { _id: carrinho._id },
                { $set: { itens: novosItens, total: carrinho.total, atualizadoEm: new Date() } },
                { returnDocument: 'after' }
            );
            res.status(200).json(updatedDoc);
        } catch (error) {
            console.error('Erro ao remover item:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }

    // Remover carrinho inteiro
    removerCarrinho = async (req: Request, res: Response) => {
        try {
            const { carrinhoId: usuarioId } = req.params;
            if (!usuarioId) {
                return res.status(400).json({ message: 'ID do usuário é obrigatório' });
            }
            const result = await db.collection<Carrinho>('carrinhos').deleteOne({ usuarioId: new ObjectId(usuarioId) });
            if (result.deletedCount === 0) {
                return res.status(404).json({ message: 'Carrinho não encontrado' });
            }
            res.status(200).json({ message: 'Carrinho removido com sucesso' });
        } catch (error) {
            console.error('Erro ao remover carrinho:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }
}

export default new CarrinhoController();