import { MongoClient, Db } from 'mongodb'

// Exported bindings. We'll assign to these at runtime depending on environment.
export let dbPromise: Promise<Db>
export let db: Db | undefined = undefined

// If no MONGO_URI is provided, avoid constructing MongoClient (avoids errors like
// "Cannot read properties of undefined (reading 'startsWith')").
if (!process.env.MONGO_URI) {
	// Provide a rejected promise so callers that await dbPromise get a clear error.
	dbPromise = Promise.reject(new Error('MONGO_URI is not defined'))
} else {
	const client = new MongoClient(process.env.MONGO_URI)

	// Connect and export both a promise (dbPromise) and set the mutable `db` when ready.
	// Tests can mock `db` while runtime code should prefer awaiting dbPromise.
	const connectPromise = client.connect().then(() => client.db(process.env.MONGO_DB!))

	dbPromise = connectPromise

	// When the connection resolves, set the exported `db` as well for compatibility.
	connectPromise.then(d => { db = d }).catch(() => { /* ignore connection errors at startup */ })
}