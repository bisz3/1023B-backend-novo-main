import { Request, Response } from 'express'
import { dbPromise, db as dbSync } from '../database/banco-mongo.js'

// In-memory fallback for products when MongoDB is unavailable (development convenience)
const inMemoryProducts: Array<any> = []
let nextInMemoryId = 1
class ProdutosController {
    async adicionar(req: Request, res: Response) {
        const { nome, preco, urlfoto, descricao } = req.body
        if (!nome || !preco || !urlfoto || !descricao)
            return res.status(400).json({ error: "Nome, preço, urlfoto e descrição são obrigatórios" })

        const produto = { nome, preco, urlfoto, descricao }
    try {
        const db = dbPromise ? await dbPromise : dbSync
        const resultado = await db.collection('produtos').insertOne(produto)
        // normalize response to include an id field for frontend convenience
        return res.status(201).json({ nome, preco, urlfoto, descricao, _id: resultado.insertedId })
    } catch (err: any) {
        // fallback to in-memory store so frontend can continue working in dev
        console.warn('MongoDB insert failed, using in-memory fallback for produto:', err && err.message ? err.message : err)
        const created = { id: nextInMemoryId++, nome, preco, urlfoto, descricao }
        inMemoryProducts.push(created)
        return res.status(201).json(created)
    }
    }
    async listar(req: Request, res: Response) {
    try {
    const db = dbPromise ? await dbPromise : dbSync
    const produtos = await db.collection('produtos').find().toArray()
        return res.status(200).json(produtos)
    } catch (err: any) {
        console.warn('MongoDB list failed, returning in-memory products as fallback:', err && err.message ? err.message : err)
        return res.status(200).json(inMemoryProducts)
    }
    }
}

export default new ProdutosController()