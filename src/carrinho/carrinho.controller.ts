// Em c:\Users\04518405188\Documents\Atividades-da-sala\1023-backend-2semestre\src\carrinho\carrinho.ts

import { Request, Response } from 'express'
import { ObjectId } from 'bson'
import { db } from '../database/banco-mongo.js'

const database: any = db

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
  async adicionarItem(req: Request, res: Response) {
    const { usuarioId, produtoId, quantidade } = req.body

    if (!usuarioId || !produtoId || quantidade === undefined) {
      return res.status(400).json({ error: 'usuarioId, produtoId e quantidade são obrigatórios' })
    }
    if (typeof quantidade !== 'number' || quantidade <= 0) {
      return res.status(400).json({ error: 'Quantidade deve ser maior que zero' })
    }

    if (!ObjectId.isValid(produtoId)) return res.status(400).json({ error: 'produtoId inválido' })

    try {
      const produto = await database.collection('produtos').findOne({ _id: new ObjectId(produtoId) })
      if (!produto) return res.status(404).json({ error: 'Produto não encontrado' })

      const item: ItemCarrinho = {
        produtoId: produto._id.toString(),
        quantidade,
        precoUnitario: produto.preco,
        nome: produto.nome,
      }

      const carrinho = await database.collection('carrinhos').findOne({ usuarioId }) as Carrinho | null

      if (!carrinho) {
        const novoCarrinho: Carrinho = {
          usuarioId,
          itens: [item],
          dataAtualizacao: new Date(),
          total: item.precoUnitario * item.quantidade,
        }
        await database.collection('carrinhos').insertOne(novoCarrinho)
        return res.status(201).json(novoCarrinho)
      }

      const itens = [...(carrinho.itens || [])]
      const idx = itens.findIndex(i => i.produtoId === item.produtoId)
      if (idx >= 0) {
        itens[idx].quantidade = (itens[idx].quantidade || 0) + item.quantidade
      } else {
        itens.push(item)
      }

      const total = itens.reduce((s, it) => s + it.precoUnitario * it.quantidade, 0)
      const dataAtualizacao = new Date()

      await database.collection('carrinhos').updateOne({ usuarioId }, { $set: { itens, total, dataAtualizacao } })
      const carrinhoAtualizado = { usuarioId, itens, total, dataAtualizacao }
      return res.status(200).json(carrinhoAtualizado)
    } catch (err: any) {
      console.error('Erro ao adicionar item ao carrinho:', err && err.message ? err.message : err)
      return res.status(500).json({ error: 'Erro no servidor ao processar o pedido. Por favor, tente novamente.' })
    }
  }

  async removerItem(req: Request, res: Response) {
    const { usuarioId, produtoId } = req.body
    if (!usuarioId || !produtoId) return res.status(400).json({ error: 'usuarioId e produtoId são obrigatórios' })
    try {
      const carrinho = await database.collection('carrinhos').findOne({ usuarioId }) as Carrinho | null
      if (!carrinho) return res.status(404).json({ error: 'Carrinho não encontrado' })

      const itens = (carrinho.itens || []).filter(i => i.produtoId !== produtoId)
      if (itens.length === (carrinho.itens || []).length) return res.status(404).json({ error: 'Item não encontrado no carrinho' })

      if (itens.length === 0) {
        await database.collection('carrinhos').deleteOne({ usuarioId })
        return res.status(200).json({ message: 'Item removido. Carrinho vazio e removido.' })
      }

  const total = itens.reduce((s, it) => s + it.precoUnitario * it.quantidade, 0)
  const dataAtualizacao = new Date()
  await database.collection('carrinhos').updateOne({ usuarioId }, { $set: { itens, total, dataAtualizacao } })
  const carrinhoAtualizado = { usuarioId, itens, total, dataAtualizacao }
  return res.status(200).json(carrinhoAtualizado)
    } catch (err: any) {
      console.error('Erro ao remover item do carrinho:', err && err.message ? err.message : err)
      return res.status(500).json({ error: 'Erro no servidor ao processar o pedido. Por favor, tente novamente.' })
    }
  }

  async atualizarQuantidade(req: Request, res: Response) {
    const { usuarioId, produtoId, quantidade } = req.body
    if (!usuarioId || !produtoId || quantidade === undefined) return res.status(400).json({ error: 'usuarioId, produtoId e quantidade são obrigatórios' })
    try {
      const carrinho = await database.collection('carrinhos').findOne({ usuarioId }) as Carrinho | null
      if (!carrinho) return res.status(404).json({ error: 'Carrinho não encontrado' })

      const itens = [...(carrinho.itens || [])]
      const idx = itens.findIndex(i => i.produtoId === produtoId)
      if (idx === -1) return res.status(404).json({ error: 'Item não encontrado no carrinho' })

      if (quantidade <= 0) {
        return this.removerItem(req, res)
      }

      itens[idx].quantidade = quantidade
      const total = itens.reduce((s, it) => s + it.precoUnitario * it.quantidade, 0)

  const dataAtualizacao = new Date()
  await database.collection('carrinhos').updateOne({ usuarioId }, { $set: { itens, total, dataAtualizacao } })
  const carrinhoAtualizado = { usuarioId, itens, total, dataAtualizacao }
  return res.status(200).json(carrinhoAtualizado)
    } catch (err: any) {
      console.error('Erro ao atualizar quantidade:', err && err.message ? err.message : err)
      return res.status(500).json({ error: 'Erro no servidor ao processar o pedido. Por favor, tente novamente.' })
    }
  }

  async listar(req: Request, res: Response) {
    const usuarioId = (req.query.usuarioId as string) || (req.body && req.body.usuarioId)
    try {
      if (usuarioId) {
        const carrinho = await database.collection('carrinhos').findOne({ usuarioId })
        if (!carrinho) return res.status(404).json({ error: 'Carrinho não encontrado' })
        return res.status(200).json(carrinho)
      }
      const carrinhos = await database.collection('carrinhos').find().toArray()
      return res.status(200).json(carrinhos)
    } catch (err: any) {
      console.error('Erro ao listar carrinhos:', err && err.message ? err.message : err)
      return res.status(500).json({ error: 'Erro no servidor ao processar o pedido. Por favor, tente novamente.' })
    }
  }

  async remover(req: Request, res: Response) {
    const usuarioId = (req.body && req.body.usuarioId) || (req.query && req.query.usuarioId)
    if (!usuarioId) return res.status(400).json({ error: 'usuarioId é obrigatório' })
    try {
      await database.collection('carrinhos').deleteOne({ usuarioId })
      return res.status(200).json({ message: 'Carrinho removido' })
    } catch (err: any) {
      console.error('Erro ao remover carrinho:', err && err.message ? err.message : err)
      return res.status(500).json({ error: 'Erro no servidor ao processar o pedido. Por favor, tente novamente.' })
    }
  }
}

export default new CarrinhoController()