import { Request, Response } from 'express'
import {db} from '../database/banco-mongo.js'
import bcrypt from 'bcrypt'

class UsuariosController {
    async adicionar(req: Request, res: Response) {
        try {
            const { nome, email, senha } = req.body;
    
            // Validações básicas
            if (!nome || !email || !senha) {
                return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
            }
            if (senha.length < 6) {
                return res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres' });
            }
    
            // Validação de e-mail corrigida
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ message: 'O formato do e-mail é inválido' });
            }
    
            // Verifica se o e-mail já está em uso
            const usuarioExistente = await db.collection('usuarios').findOne({ email });
            if (usuarioExistente) {
                return res.status(409).json({ message: 'Este e-mail já está cadastrado' });
            }
    
            // Criptografa a senha e salva o usuário
            const senhaCript = await bcrypt.hash(senha, 10);
            const result = await db.collection('usuarios').insertOne({ nome, email, senhaCript });

            // Retorna o usuário criado para login automático no frontend
            res.status(201).json({
                usuario: {
                    _id: result.insertedId,
                    nome,
                    email
                }
            });

        } catch (error) {
            console.error('Erro ao adicionar usuário:', error);
            res.status(500).json({ message: 'Ocorreu um erro interno no servidor' });
        }
    }

    async listar(req: Request, res: Response) {
        const usuarios = await db.collection('usuarios').find().toArray()
        const usuariosSemSenha = usuarios.map(usuario => ({
            ...usuario,
            senha: undefined
        }))
        res.json(usuariosSemSenha)
    }

    async login(req: Request, res: Response) {
        try {
            const { email, senha } = req.body;

            if (!email || !senha) {
                return res.status(400).json({ message: 'E-mail e senha são obrigatórios' });
            }

            // Encontra o usuário pelo e-mail
            const usuario = await db.collection('usuarios').findOne({ email });
            if (!usuario) {
                return res.status(404).json({ message: 'Usuário não encontrado' });
            }

            // Compara a senha fornecida com a senha criptografada no banco
            // Adicionado suporte para o campo legado 'senha' para retrocompatibilidade
            const hashDaSenha = usuario.senhaCript || usuario.senha;
            if (!hashDaSenha) {
                return res.status(500).json({ message: 'Hash da senha não encontrado no documento do usuário.' });
            }
            const senhaCorreta = await bcrypt.compare(senha, hashDaSenha);
            if (!senhaCorreta) {
                return res.status(401).json({ message: 'Credenciais inválidas' });
            }

            // Retorna os dados do usuário (sem a senha)
            res.json({
                message: 'Login bem-sucedido',
                usuario: {
                    _id: usuario._id,
                    nome: usuario.nome,
                    email: usuario.email
                }
            });

        } catch (error) {
            console.error('Erro no login:', error);
            res.status(500).json({ message: 'Ocorreu um erro interno no servidor' });
        }
    }
}

export default new UsuariosController()