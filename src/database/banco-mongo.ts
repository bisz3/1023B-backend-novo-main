import { MongoClient } from 'mongodb'

const client = new MongoClient(process.env.MONGOURI!, {
  tls: true,
  tlsAllowInvalidCertificates: true,
  tlsAllowInvalidHostnames: true,
})
await client.connect()
const db = client.db(process.env.MONGODB!)

export  {db}