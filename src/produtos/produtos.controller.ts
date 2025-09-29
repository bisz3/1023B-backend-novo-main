import { Request, Response } from 'express'
import { dbPromise, db as dbSync } from '../database/banco-mongo.js'
class ProdutosController {
    async adicionar(req: Request, res: Response) {
        const { nome, preco, urlfoto, descricao } = req.body
        if (!nome || !preco || !urlfoto || !descricao)
            return res.status(400).json({ error: "Nome, preço, urlfoto e descrição são obrigatórios" })

        const produto = { nome, preco, urlfoto, descricao }
    try {
        const db = dbPromise ? await dbPromise : dbSync
        const resultado = await db.collection('produtos').insertOne(produto)
        return res.status(201).json({ nome, preco, urlfoto, descricao, _id: resultado.insertedId })
    } catch (err: any) {
        console.error('Erro ao inserir produto no banco:', err && err.message ? err.message : err)
        return res.status(500).json({ error: 'Erro ao cadastrar produto. Por favor, tente novamente.' })
    }
    }
    async listar(req: Request, res: Response) {
    try {
    const db = dbPromise ? await dbPromise : dbSync
    const produtos = await db.collection('produtos').find().toArray()
        return res.status(200).json(produtos)
    } catch (err: any) {
        console.error('Erro ao listar produtos:', err && err.message ? err.message : err)
        return res.status(500).json({ error: 'Erro ao listar produtos. Por favor, tente novamente.' })
    }
    }
}

export default new ProdutosController()