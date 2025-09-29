import { Request, Response } from 'express'
import {db} from '../database/banco-mongo'

class ProdutosController {
    async adicionar(req:Request, res:Response){
        const {nome, preco, urlfoto, descricao} = req.body
    if (!nome || !preco || !urlfoto || !descricao) {
        return res.status(400).json({message: 'Missing required fields'})
    }
    const produto = {nome, preco, urlfoto, descricao}
    const result = await db.collection('produtos').insertOne(produto)
    res.json({
        nome,
        preco,
        urlfoto,
        descricao,
        _id: result.insertedId
    })
    }
    async listar(req:Request, res:Response){
        const produtos = await db.collection('produtos').find().toArray()
        res.json(produtos)
    }
}

export default new ProdutosController()