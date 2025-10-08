// No arquivo rotas.ts
import Router from 'express';
import CarrinhoController from './carrinho/carrinho.js';
import ProdutosController from './produtos/produtos.js';
import UsuariosController from './usuarios/usuarios.js';

const rotas = Router();

// Rotas do carrinho
rotas.get('/carrinho', CarrinhoController.listar);
rotas.post('/carrinho', CarrinhoController.adicionar);
rotas.put('/carrinho/:carrinhoId/itens/:itemId', CarrinhoController.atualizarQuantidade);
rotas.delete('/carrinho/:carrinhoId/itens/:itemId', CarrinhoController.removerItem);
rotas.delete('/carrinho/:carrinhoId', CarrinhoController.removerCarrinho);

// Rotas de produtos
rotas.get('/produtos', ProdutosController.listar);
rotas.post('/produtos', ProdutosController.adicionar);

// Rotas de usuários
rotas.get('/usuarios', UsuariosController.listar);
rotas.post('/usuarios', UsuariosController.adicionar);
rotas.post('/usuarios/login', UsuariosController.login);

export default rotas;