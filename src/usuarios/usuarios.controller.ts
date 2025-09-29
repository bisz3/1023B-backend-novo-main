import { Request, Response } from 'express'
import { dbPromise, db as dbSync } from '../database/banco-mongo.js'
import bcrypt from 'bcrypt'
class UsuariosController {
    async adicionar(req: Request, res: Response) {
        const { nome, idade, email, senha } = req.body
        if (!nome || !idade || !email || !senha)
            return res.status(400).json({ error: "Nome, idade, email e senha são obrigatórios" })
        if (senha.length < 6)
            return res.status(400).json({ error: "A senha deve ter no mínimo 6 caracteres" })
        if (!email.includes('@') || !email.includes('.'))
            return res.status(400).json({ error: "Email inválido" })

        const senhaCriptografada = await bcrypt.hash(senha, 10)
        const usuario = { nome, idade, email, senha: senhaCriptografada }

    try {
        const db = dbPromise ? await dbPromise : dbSync
        if (!db) throw new Error('DB not available')
        const resultado = await db.collection('usuarios').insertOne(usuario)
        return res.status(201).json({nome,idade,email,_id: resultado.insertedId })
    } catch (err: any) {
        console.error('Erro ao inserir usuário:', err && err.message ? err.message : err)
        return res.status(500).json({ error: 'Erro ao cadastrar usuário. Por favor, tente novamente.' })
    }
    }
    async listar(req: Request, res: Response) {
    try {
        const db = dbPromise ? await dbPromise : dbSync
        if (!db) throw new Error('DB not available')
        const usuarios = await db.collection('usuarios').find().toArray()
        const usuariosSemSenha = usuarios.map((u: any) => {
            const { senha, ...resto } = u
            return resto
        })
        return res.status(200).json(usuariosSemSenha)
    } catch (err: any) {
        console.error('Erro ao listar usuários:', err && err.message ? err.message : err)
        return res.status(500).json({ error: 'Erro ao listar usuários. Por favor, tente novamente.' })
    }
    }
}

export default new UsuariosController()