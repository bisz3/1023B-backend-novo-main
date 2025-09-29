import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import rotas from './rotas.js'

const app = express()

// Parse JSON bodies
app.use(express.json())

// Enable CORS. If FRONTEND_ORIGIN is set, restrict to that origin; otherwise allow all origins.
const corsOptions = process.env.FRONTEND_ORIGIN ? { origin: process.env.FRONTEND_ORIGIN } : undefined
app.use(cors(corsOptions))

// Usando as rotas definidas em rotas.ts
app.use(rotas)

// Criando o servidor na porta 8000 com o express
app.listen(8000, () => {
    console.log('Server is running on port 8000')
})