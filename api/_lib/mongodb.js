import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB || 'analytics_practice'

let clientPromise

export async function getDb() {
  if (!uri) {
    throw new Error('MONGODB_URI is not configured')
  }

  if (!clientPromise) {
    const client = new MongoClient(uri)
    clientPromise = client.connect()
  }

  const client = await clientPromise
  return client.db(dbName)
}

export async function getUsersCollection() {
  const db = await getDb()
  const users = db.collection('users')

  await users.createIndex({ login: 1 }, { unique: true })
  await users.createIndex({ user_id: 1 }, { unique: true })
  return users
}
