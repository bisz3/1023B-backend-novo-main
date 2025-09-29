import { ObjectId } from 'bson'

// Mock do db do Mongo
const mockProdutosFindOne = jest.fn()
const mockCarrinhosFindOne = jest.fn()
const mockCarrinhosInsertOne = jest.fn()
const mockCarrinhosUpdateOne = jest.fn()
const mockCarrinhosFind = jest.fn()
const mockCarrinhosDeleteOne = jest.fn()

jest.mock('../database/banco-mongo.js', () => ({
  db: {
    collection: (name: string) => {
      if (name === 'produtos') {
        return { findOne: mockProdutosFindOne }
      }
      if (name === 'carrinhos') {
        return {
          findOne: mockCarrinhosFindOne,
          insertOne: mockCarrinhosInsertOne,
          updateOne: mockCarrinhosUpdateOne,
          find: mockCarrinhosFind,
          deleteOne: mockCarrinhosDeleteOne,
        }
      }
      throw new Error('colecao desconhecida: ' + name)
    },
  },
}))

import controller from '../carrinho/carrinho.controller.js'

function createMockRes() {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

describe('CarrinhoController.adicionarItem', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('deve validar campos obrigatórios', async () => {
    const req: any = { body: { usuarioId: 'u1', produtoId: '', quantidade: 1 } }
    const res = createMockRes()

    await controller.adicionarItem(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'usuarioId, produtoId e quantidade são obrigatórios' })
  })

  test('deve retornar 400 para ObjectId inválido', async () => {
    const req: any = { body: { usuarioId: 'u1', produtoId: 'abc', quantidade: 1 } }
    const res = createMockRes()

    await controller.adicionarItem(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'produtoId inválido' })
  })

  test('deve retornar 404 se produto não encontrado', async () => {
    const pid = new ObjectId().toHexString()
    mockProdutosFindOne.mockResolvedValueOnce(null)

    const req: any = { body: { usuarioId: 'u1', produtoId: pid, quantidade: 2 } }
    const res = createMockRes()

    await controller.adicionarItem(req, res)

    expect(mockProdutosFindOne).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ error: 'Produto não encontrado' })
  })

  test('deve criar um novo carrinho quando não existe', async () => {
    const pid = new ObjectId().toHexString()
    const produto = { _id: new ObjectId(pid), nome: 'P1', preco: 10 }
    mockProdutosFindOne.mockResolvedValueOnce(produto)
    mockCarrinhosFindOne.mockResolvedValueOnce(null)
    mockCarrinhosInsertOne.mockResolvedValueOnce({ insertedId: new ObjectId() })

    const req: any = { body: { usuarioId: 'u1', produtoId: pid, quantidade: 3 } }
    const res = createMockRes()

    await controller.adicionarItem(req, res)

    expect(mockCarrinhosInsertOne).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
    const resposta = (res.json as jest.Mock).mock.calls[0][0]
    expect(resposta).toMatchObject({
      usuarioId: 'u1',
      total: 30,
    })
    expect(resposta.itens).toHaveLength(1)
    expect(resposta.itens[0]).toMatchObject({ nome: 'P1', precoUnitario: 10, quantidade: 3 })
  })

  test('deve adicionar ao carrinho existente e somar quantidade', async () => {
    const pid = new ObjectId().toHexString()
    const produto = { _id: new ObjectId(pid), nome: 'P1', preco: 10 }
    mockProdutosFindOne.mockResolvedValueOnce(produto)

    const existente = {
      usuarioId: 'u1',
      itens: [{ produtoId: pid, quantidade: 1, precoUnitario: 10, nome: 'P1' }],
      dataAtualizacao: new Date(),
      total: 10,
    }
    mockCarrinhosFindOne.mockResolvedValueOnce(existente)
    mockCarrinhosUpdateOne.mockResolvedValueOnce({ modifiedCount: 1 })

    const req: any = { body: { usuarioId: 'u1', produtoId: pid, quantidade: 2 } }
    const res = createMockRes()

    await controller.adicionarItem(req, res)

    expect(mockCarrinhosUpdateOne).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    const resposta = (res.json as jest.Mock).mock.calls[0][0]
    expect(resposta.total).toBe(30)
    expect(resposta.itens[0].quantidade).toBe(3)
  })
})

describe('CarrinhoController.listar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('deve listar todos os carrinhos quando não há usuarioId', async () => {
    const carrinhos = [{ usuarioId: 'u1', itens: [], dataAtualizacao: new Date(), total: 0 }]
    mockCarrinhosFind.mockReturnValueOnce({ toArray: () => Promise.resolve(carrinhos) })
    const req: any = { query: {} }
    const res = createMockRes()

    await controller.listar(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(carrinhos)
  })

  test('deve retornar 404 quando carrinho do usuário não existe', async () => {
    mockCarrinhosFindOne.mockResolvedValueOnce(null)
    const req: any = { query: { usuarioId: 'u1' } }
    const res = createMockRes()

    await controller.listar(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ error: 'Carrinho não encontrado' })
  })

  test('deve retornar carrinho do usuário quando existe', async () => {
    const carrinho = { usuarioId: 'u1', itens: [], dataAtualizacao: new Date(), total: 0 }
    mockCarrinhosFindOne.mockResolvedValueOnce(carrinho)
    const req: any = { query: { usuarioId: 'u1' } }
    const res = createMockRes()

    await controller.listar(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(carrinho)
  })
})
