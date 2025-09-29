import {Router} from 'express'

import carrinhoController from './carrinho/carrinho.controller.js'
import produtosController from './produtos/produtos.controller.js'
import { flushInMemoryProductsToMongo } from './produtos/produtos.controller.js'

const rotas = Router()

// Rotas do Carrinho
rotas.get('/carrinho', carrinhoController.listar)
// POST /carrinho agora funciona como atalho para adicionarItem — facilita requests do frontend/render
rotas.post('/carrinho', carrinhoController.adicionarItem)
rotas.post('/carrinho/adicionar', carrinhoController.adicionarItem)
rotas.post('/carrinho/remover-item', carrinhoController.removerItem)
rotas.put('/carrinho/atualizar', carrinhoController.atualizarQuantidade)
rotas.delete('/carrinho', carrinhoController.remover)

// Rotas dos produtos
rotas.get('/produtos',produtosController.listar)
rotas.post('/produtos',produtosController.adicionar)

// Admin route to flush in-memory products into MongoDB. Protected by x-admin-token header.
rotas.post('/admin/flush-produtos', async (req, res) => {
	const token = req.headers['x-admin-token'] as string | undefined
	if (!process.env.ADMIN_TOKEN) return res.status(500).json({ error: 'ADMIN_TOKEN não configurado no servidor' })
	if (!token || token !== process.env.ADMIN_TOKEN) return res.status(401).json({ error: 'Token inválido' })
	try {
		const result = await flushInMemoryProductsToMongo()
		return res.status(200).json({ message: 'Flush executado', inserted: result.inserted })
	} catch (err: any) {
		console.error('Erro ao forçar flush de produtos:', err && err.message ? err.message : err)
		return res.status(500).json({ error: 'Falha ao executar flush' })
	}
})


export default rotas