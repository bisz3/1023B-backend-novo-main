import { Request, Response } from 'express'
import { db } from '../database/banco-mongo.js'
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

        const resultado = await db.collection('usuarios').insertOne(usuario)
        res.status(201).json({nome,idade,email,_id: resultado.insertedId })
    }
    async listar(req: Request, res: Response) {
        const usuarios = await db.collection('usuarios').find().toArray()
        const usuariosSemSenha = usuarios.map(({ senha, ...resto }) => resto)
        res.status(200).json(usuariosSemSenha)
    }
}

export default new UsuariosController()