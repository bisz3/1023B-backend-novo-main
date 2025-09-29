import { Request, Response } from 'express'
import { dbPromise, db as dbSync } from '../database/banco-mongo.js'
import { ObjectId } from 'mongodb'

// In-memory fallback for products when MongoDB is unavailable (development convenience)
export const inMemoryProducts: Array<any> = []
let nextInMemoryId = 1

class ProdutosController {
    async adicionar(req: Request, res: Response) {
        const { nome, preco, urlfoto, descricao } = req.body
        if (!nome || !preco || !urlfoto || !descricao)
            return res.status(400).json({ error: "Nome, preço, urlfoto e descrição são obrigatórios" })

        const produto = { nome, preco, urlfoto, descricao }
        try {
            const db = dbPromise ? await dbPromise : dbSync
                if (!db) throw new Error('DB not available')
                const resultado = await db.collection('produtos').insertOne(produto)
            // normalize response to include an id field for frontend convenience
            return res.status(201).json({ id: resultado.insertedId.toString(), nome, preco, urlfoto, descricao })
        } catch (err: any) {
            // fallback to in-memory store so frontend can continue working in dev
            console.warn('MongoDB insert failed, using in-memory fallback for produto:', err && err.message ? err.message : err)
            const idStr = (nextInMemoryId++).toString()
            const created = { id: idStr, nome, preco, urlfoto, descricao }
            inMemoryProducts.push(created)
            return res.status(201).json(created)
        }
    }

    async listar(req: Request, res: Response) {
        try {
            const db = dbPromise ? await dbPromise : dbSync
            if (!db) throw new Error('DB not available')
            const produtos = await db.collection('produtos').find().toArray()
            // Normalize _id to id (string) for frontend convenience
            const mapped = produtos.map((p: any) => ({ id: p._id?.toString ? p._id.toString() : p.id, nome: p.nome, preco: p.preco, urlfoto: p.urlfoto, descricao: p.descricao }))
            return res.status(200).json(mapped)
        } catch (err: any) {
            console.warn('MongoDB list failed, returning in-memory products as fallback:', err && err.message ? err.message : err)
            return res.status(200).json(inMemoryProducts)
        }
    }

}

export default new ProdutosController()

// Helper: try to find a product by id, supporting both Mongo _id and in-memory ids
export async function obterProdutoPorId(produtoId: string): Promise<any | null> {
    // Try Mongo first (if available)
    try {
        const db = dbPromise ? await dbPromise : dbSync
        if (!db) throw new Error('DB not available')
        // If produtoId looks like an ObjectId, try that first
        if (ObjectId.isValid(produtoId)) {
            const found = await db.collection('produtos').findOne({ _id: new ObjectId(produtoId) })
            if (found) return found
        }
        // Try a document with an 'id' field (string) — covers normalized inserts
        const foundById = await db.collection('produtos').findOne({ id: produtoId })
        if (foundById) return foundById
    } catch (err) {
        // Mongo not available — fall through to in-memory lookup
    }

    // In-memory fallback
    const mem = inMemoryProducts.find(p => String(p.id) === String(produtoId))
    return mem || null
}

// Flush helper: attempt to persist in-memory products into MongoDB
export async function flushInMemoryProductsToMongo(): Promise<{ inserted: number }>
{
    const db = dbPromise ? await dbPromise : dbSync
    if (!db) throw new Error('DB not available')
    if (inMemoryProducts.length === 0) return { inserted: 0 }
    console.log('Flushing in-memory products to MongoDB:', inMemoryProducts.length)
    let inserted = 0
    for (const p of inMemoryProducts) {
        const exists = await db.collection('produtos').findOne({ nome: p.nome })
        if (!exists) {
            await db.collection('produtos').insertOne({ nome: p.nome, preco: p.preco, urlfoto: p.urlfoto, descricao: p.descricao })
            inserted++
        }
    }
    inMemoryProducts.length = 0
    nextInMemoryId = 1
    return { inserted }
}

// When the DB connection becomes available, try to flush existing in-memory products
if (dbPromise) {
    dbPromise.then(() => {
        // call but ignore errors — admin route can be used to retry
        flushInMemoryProductsToMongo().catch(err => { console.warn('Auto-flush failed:', err && err.message ? err.message : err) })
    }).catch(() => { /* ignore connection errors */ })
}