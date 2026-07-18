import { ObjectId } from 'mongodb'
import { getUsersCollection } from './_lib/mongodb.js'
import {
  createSessionToken,
  hashPassword,
  json,
  parseJsonBody,
  serializeUser,
  setSessionCookie,
} from './_lib/auth.js'

function isValidLogin(login) {
  return /^[a-zA-Z0-9_.-]{3,32}$/.test(login)
}

function getRegisterErrorMessage(error) {
  if (error.message === 'MONGODB_URI is not configured') {
    return 'MongoDB is not configured.'
  }

  if (
    error.name === 'MongoServerSelectionError' ||
    error.message?.includes('querySrv') ||
    error.message?.includes('timed out') ||
    error.message?.includes('ENOTFOUND')
  ) {
    return 'Public access is restricted right now. Ask an admin for permission.'
  }

  return 'Could not create account.'
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    json(res, 405, { error: 'Method not allowed' })
    return
  }

  try {
    const body = await parseJsonBody(req)
    const login = String(body.login || '').trim().toLowerCase()
    const name = String(body.name || '').trim()
    const password = String(body.password || '')

    if (!isValidLogin(login) || password.length < 8) {
      json(res, 400, {
        error:
          'Use a 3-32 character login and a password with at least 8 characters.',
      })
      return
    }

    const users = await getUsersCollection()
    const now = new Date()
    const existingUsers = await users.estimatedDocumentCount()
    const userObjectId = new ObjectId()
    const result = await users.insertOne({
      _id: userObjectId,
      user_id: userObjectId.toString(),
      login,
      name,
      pass: hashPassword(password),
      admin_status: existingUsers === 0 ? 1 : 0,
      createdAt: now,
      updatedAt: now,
    })
    const user = {
      _id: result.insertedId,
      user_id: result.insertedId.toString(),
      login,
      name,
      admin_status: existingUsers === 0 ? 1 : 0,
    }

    setSessionCookie(res, createSessionToken(user))
    json(res, 201, { user: serializeUser(user) })
  } catch (error) {
    if (error.code === 11000) {
      json(res, 409, { error: 'An account with this login already exists.' })
      return
    }

    console.error('Register API error:', error)
    json(res, 500, { error: getRegisterErrorMessage(error) })
  }
}
