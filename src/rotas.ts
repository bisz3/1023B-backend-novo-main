// No arquivo rotas.ts
import Router from 'express';
import CarrinhoController from './carrinho/carrinho.controller';
import ProdutosController from './produtos/produtos.controller';
import UsuariosController from './usuarios/usuarios.controller';

const rotas = Router();

// Rotas do carrinho
rotas.get('/carrinho', CarrinhoController.listar.bind(CarrinhoController));
rotas.post('/carrinho', CarrinhoController.adicionarItem.bind(CarrinhoController));
rotas.put('/carrinho/:carrinhoId/itens/:itemId', CarrinhoController.atualizarQuantidade.bind(CarrinhoController));
rotas.delete('/carrinho/:carrinhoId/itens/:itemId', CarrinhoController.removerItem.bind(CarrinhoController));
rotas.delete('/carrinho/:carrinhoId', CarrinhoController.remover.bind(CarrinhoController));

// Rotas de produtos
rotas.get('/produtos', ProdutosController.listar);
rotas.post('/produtos', ProdutosController.adicionar);

// Rotas de usuários
rotas.get('/usuarios', UsuariosController.listar);
rotas.post('/usuarios', UsuariosController.adicionar);
rotas.post('/usuarios/login', UsuariosController.login);

export default rotas;