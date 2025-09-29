import {Router} from 'express'

import carrinhoController from './carrinho/carrinho.controller.js'
import produtosController from './produtos/produtos.controller.js'

const rotas = Router()

// Rotas do Carrinho
rotas.get('/carrinho', carrinhoController.listar)
rotas.post('/carrinho/adicionar', carrinhoController.adicionarItem)
rotas.post('/carrinho/remover-item', carrinhoController.removerItem)
rotas.put('/carrinho/atualizar', carrinhoController.atualizarQuantidade)
rotas.delete('/carrinho', carrinhoController.remover)

// Rotas dos produtos
rotas.get('/produtos',produtosController.listar)
rotas.post('/produtos',produtosController.adicionar)


export default rotas