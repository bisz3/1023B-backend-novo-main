import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import rotas from './rotas.js'
import { inMemoryProducts } from './produtos/produtos.controller.js'

const app = express()

// Parse JSON bodies
app.use(express.json())

// Enable CORS. If FRONTEND_ORIGIN is set, restrict to that origin; otherwise allow all origins.
const corsOptions = process.env.FRONTEND_ORIGIN ? { origin: process.env.FRONTEND_ORIGIN } : undefined
app.use(cors(corsOptions))

// Usando as rotas definidas em rotas.ts
app.use(rotas)

// Health endpoint to help debugging (reports DB promise state and in-memory product count)
app.get('/health', async (req, res) => {
    let dbConnected = false
    try {
        // try to see if dbPromise resolves
        // import inside to avoid top-level require issues
        const { dbPromise } = await import('./database/banco-mongo.js')
        try {
            const db = await dbPromise
            dbConnected = !!db
        } catch {
            dbConnected = false
        }
    } catch (err) {
        dbConnected = false
    }

    return res.status(200).json({ ok: true, dbConnected, inMemoryProducts: inMemoryProducts.length })
})

// Criando o servidor na porta 8000 com o express
app.listen(8000, () => {
    console.log('Server is running on port 8000')
})