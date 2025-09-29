import express from 'express'
import 'dotenv/config'
import rotas from './rotas.js'
const app = express()
//Esse middleware faz com que o 
// express faça o parse do body da requisição para json 
app.use(express.json())

// Usando as rotas definidas em rotas.ts
app.use(rotas)

// Criando o servidor na porta 8000 com o express
app.listen(8000, () => {
    console.log('Server is running on port 8000')
})