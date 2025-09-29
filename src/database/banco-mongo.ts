import { MongoClient } from 'mongodb'

// Export a mutable `db` and a `dbPromise` that resolves when connected.
// Use multiple env var names for compatibility and fallbacks.
export let db: any = undefined

const uri = process.env.MONGO_URI || process.env.MONGOURI || process.env.MONGODB_URI
const dbName = process.env.MONGO_DB || process.env.MONGODB || process.env.MONGODB_NAME || '1023b'

export const dbPromise = (async () => {
	if (!uri) {
		console.warn('MONGO URI not provided, skipping mongo connection (db will be undefined). Set MONGO_URI to enable DB.');
		return undefined
	}

	const client = new MongoClient(uri)
	await client.connect()
	db = client.db(dbName)
	console.info('Connected to MongoDB', dbName)
	return db
})()

export { db as default }