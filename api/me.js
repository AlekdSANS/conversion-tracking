import { getSessionFromRequest, json, serializeUser } from './_lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    json(res, 405, { error: 'Method not allowed' })
    return
  }

  const session = getSessionFromRequest(req)

  if (!session) {
    json(res, 401, { user: null })
    return
  }

  json(res, 200, { user: serializeUser(session) })
}
