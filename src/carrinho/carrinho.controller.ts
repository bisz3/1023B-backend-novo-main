import { Request, Response } from 'express'
import { dbPromise, db as dbSync } from '../database/banco-mongo.js'
import { ObjectId } from 'mongodb'

interface ItemCarrinho {
    produtoId: string
    quantidade: number
    precoUnitario: number
    nome: string
}

interface Carrinho {
    usuarioId: string
    itens: ItemCarrinho[]
    dataAtualizacao: Date
    total: number
}

class CarrinhoController {
    // Adicionar item ao carrinho
    async adicionarItem(req: Request, res: Response) {
        const { usuarioId, produtoId, quantidade } = req.body

        if (!usuarioId || !produtoId || quantidade === undefined)
            return res.status(400).json({ error: 'usuarioId, produtoId e quantidade são obrigatórios' })
        if (quantidade <= 0) return res.status(400).json({ error: 'Quantidade deve ser maior que zero' })

        let produto: any
        try {
            const db = dbPromise ? await dbPromise : dbSync
            produto = await db.collection('produtos').findOne({ _id: new ObjectId(produtoId) })
        } catch (err) {
            return res.status(400).json({ error: 'produtoId inválido' })
        }

        if (!produto) return res.status(404).json({ error: 'Produto não encontrado' })

        const item: ItemCarrinho = {
            produtoId: produto._id.toString(),
            quantidade,
            precoUnitario: produto.preco,
            nome: produto.nome,
        }

    const db = dbPromise ? await dbPromise : dbSync
        const carrinho = await db.collection('carrinhos').findOne({ usuarioId }) as Carrinho | null

        if (!carrinho) {
            const novoCarrinho: Carrinho = {
                usuarioId,
                itens: [item],
                dataAtualizacao: new Date(),
                total: item.precoUnitario * item.quantidade,
            }
            await db.collection('carrinhos').insertOne(novoCarrinho)
            return res.status(201).json(novoCarrinho)
        }

        // Se carrinho já existe
        const itens = [...carrinho.itens]
        const idx = itens.findIndex(i => i.produtoId === item.produtoId)
        if (idx >= 0) {
            const existente = itens[idx]!
            existente.quantidade = (existente.quantidade || 0) + item.quantidade
            itens[idx] = existente
        } else {
            itens.push(item)
        }

        const total = itens.reduce((s, it) => s + it.precoUnitario * it.quantidade, 0)

        const dataAtualizacao = new Date()
        await db.collection('carrinhos').updateOne(
            { usuarioId },
            { $set: { itens, total, dataAtualizacao } }
        )

        const carrinhoAtualizado: Carrinho = {
            usuarioId,
            itens,
            total,
            dataAtualizacao,
        }
        return res.status(200).json(carrinhoAtualizado)
    }

    // Remover um item do carrinho
    async removerItem(req: Request, res: Response) {
        const { usuarioId, produtoId } = req.body
        if (!usuarioId || !produtoId)
            return res.status(400).json({ error: 'usuarioId e produtoId são obrigatórios' })

        const db = dbPromise ? await dbPromise : dbSync
        const carrinho = await db.collection('carrinhos').findOne({ usuarioId }) as Carrinho | null
        if (!carrinho) return res.status(404).json({ error: 'Carrinho não encontrado' })

        const itens = carrinho.itens.filter(i => i.produtoId !== produtoId)
        if (itens.length === carrinho.itens.length)
            return res.status(404).json({ error: 'Item não encontrado no carrinho' })

        if (itens.length === 0) {
            await db.collection('carrinhos').deleteOne({ usuarioId })
            return res.status(200).json({ message: 'Item removido. Carrinho vazio e removido.' })
        }

        const total = itens.reduce((s, it) => s + it.precoUnitario * it.quantidade, 0)
        await db.collection('carrinhos').updateOne(
            { usuarioId },
            { $set: { itens, total, dataAtualizacao: new Date() } }
        )

        const carrinhoAtualizado = await db.collection('carrinhos').findOne({ usuarioId })
        return res.status(200).json(carrinhoAtualizado)
    }

    // Atualizar quantidade de um item
    async atualizarQuantidade(req: Request, res: Response) {
        const { usuarioId, produtoId, quantidade } = req.body
        if (!usuarioId || !produtoId || quantidade === undefined)
            return res.status(400).json({ error: 'usuarioId, produtoId e quantidade são obrigatórios' })

        const db = dbPromise ? await dbPromise : dbSync
        const carrinho = await db.collection('carrinhos').findOne({ usuarioId }) as Carrinho | null
        if (!carrinho) return res.status(404).json({ error: 'Carrinho não encontrado' })

        const itens = [...carrinho.itens]
        const idx = itens.findIndex(i => i.produtoId === produtoId)
        if (idx === -1) return res.status(404).json({ error: 'Item não encontrado no carrinho' })

        if (quantidade <= 0) {
            // remover o item
            return this.removerItem(req, res)
        }

        const encontrado = itens[idx]!
        encontrado.quantidade = quantidade
        itens[idx] = encontrado
        const total = itens.reduce((s, it) => s + it.precoUnitario * it.quantidade, 0)

        await db.collection('carrinhos').updateOne(
            { usuarioId },
            { $set: { itens, total, dataAtualizacao: new Date() } }
        )

        const carrinhoAtualizado = await db.collection('carrinhos').findOne({ usuarioId })
        return res.status(200).json(carrinhoAtualizado)
    }

    // Listar carrinho(s). Se passar ?usuarioId=... retorna o carrinho do usuário, senão retorna todos
    async listar(req: Request, res: Response) {
        const usuarioId = (req.query.usuarioId as string) || (req.body && req.body.usuarioId)
        const db = dbPromise ? await dbPromise : dbSync
        if (usuarioId) {
            const carrinho = await db.collection('carrinhos').findOne({ usuarioId })
            if (!carrinho) return res.status(404).json({ error: 'Carrinho não encontrado' })
            return res.status(200).json(carrinho)
        }

        const carrinhos = await db.collection('carrinhos').find().toArray()
        return res.status(200).json(carrinhos)
    }

    // Remover todo o carrinho do usuário
    async remover(req: Request, res: Response) {
        const usuarioId = (req.body && req.body.usuarioId) || (req.query && req.query.usuarioId)
        if (!usuarioId) return res.status(400).json({ error: 'usuarioId é obrigatório' })

        const db = dbPromise ? await dbPromise : dbSync
        await db.collection('carrinhos').deleteOne({ usuarioId })
        return res.status(200).json({ message: 'Carrinho removido' })
    }
}

export default new CarrinhoController()