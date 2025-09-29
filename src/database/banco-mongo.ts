import { MongoClient } from 'mongodb'

const client = new MongoClient(process.env.MONGO_URI!)

// Connect and export both a promise (dbPromise) and a mutable `db` variable.
// Tests can mock `db` (jest.mock) while runtime code should prefer awaiting dbPromise.
const connectPromise = client.connect().then(() => client.db(process.env.MONGO_DB!))

export const dbPromise = connectPromise
export let db: any = undefined

// When the connection resolves, set the exported `db` as well for compatibility.
connectPromise.then(d => { db = d }).catch(() => { /* ignore connection errors at startup */ })