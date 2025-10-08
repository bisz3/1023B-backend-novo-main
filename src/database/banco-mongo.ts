import { MongoClient } from 'mongodb'

const client = new MongoClient(process.env.MONGOURI!)
await client.connect()
const db = client.db(process.env.MONGODB!)

export  {db}