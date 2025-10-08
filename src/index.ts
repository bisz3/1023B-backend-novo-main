import express, { Request, Response } from 'express'
import 'dotenv/config'
import { MongoClient } from 'mongodb'
import cors from 'cors'
import rotas from './rotas.js'
import './database/banco-mongo.js';

const client = new MongoClient(process.env.MONGOURI!)
await client.connect()
const db = client.db(process.env.MONGODB!)

const app = express()
//Esse middleware faz com que o 
// express faça o parse do body da requisição para json 
app.use(express.json())
app.use(cors())
app.use(rotas)


// Criando o servidor na porta 8000 com o express
app.listen(8000, () => {
    console.log('Server is running on port 8000')
})