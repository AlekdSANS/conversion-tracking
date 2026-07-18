import { getUsersCollection } from './_lib/mongodb.js'
import {
  createSessionToken,
  json,
  parseJsonBody,
  serializeUser,
  setSessionCookie,
  verifyPassword,
} from './_lib/auth.js'

function getLoginErrorMessage(error) {
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

  return 'Could not log in.'
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    json(res, 405, { error: 'Method not allowed' })
    return
  }

  try {
    const body = await parseJsonBody(req)
    const login = String(body.login || '').trim().toLowerCase()
    const password = String(body.password || '')

    const users = await getUsersCollection()
    const user = await users.findOne({ login })

    if (!user || !verifyPassword(password, user.pass)) {
      json(res, 401, { error: 'Login or password is incorrect.' })
      return
    }

    setSessionCookie(res, createSessionToken(user))
    json(res, 200, { user: serializeUser(user) })
  } catch (error) {
    console.error('Login API error:', error)
    json(res, 500, { error: getLoginErrorMessage(error) })
  }
}
