import { Resend } from 'resend'
import { loadLocalEnv } from './_lib/loadLocalEnv.js'
import { json, parseJsonBody } from './_lib/auth.js'

loadLocalEnv()

const allowedFormTypes = new Set(['contact', 'callback', 'newsletter'])
const resendTestSender = 'Conversion Tracking <onboarding@resend.dev>'
const publicEmailDomains = [
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'yahoo.com',
]

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function getEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.CONTACT_TO_EMAIL
  const from = normalizeSender(process.env.CONTACT_FROM_EMAIL)

  if (!apiKey || !to) {
    throw new Error('EMAIL_CONFIG_MISSING')
  }

  return { apiKey, from, to }
}

function normalizeSender(sender) {
  const trimmedSender = String(sender || '').trim()

  if (!trimmedSender || trimmedSender === 'onboarding@resend.dev') {
    return resendTestSender
  }

  const emailMatch = trimmedSender.match(/<?([^<>\s]+@[^<>\s]+)>?$/)
  const domain = emailMatch?.[1]?.split('@')[1]?.toLowerCase()

  if (publicEmailDomains.includes(domain)) {
    return resendTestSender
  }

  return trimmedSender
}

function getPublicEmailError(error) {
  const message = String(error?.message || error?.error || '').toLowerCase()

  if (
    message.includes('testing emails') ||
    message.includes('own email address') ||
    message.includes('recipient')
  ) {
    return 'Resend test mode can only send to your Resend account email. Change CONTACT_TO_EMAIL or verify a domain.'
  }

  if (message.includes('domain') || message.includes('sender')) {
    return 'Email sender is not verified. Use onboarding@resend.dev or verify a domain in Resend.'
  }

  if (message.includes('api key') || message.includes('unauthorized')) {
    return 'Resend API key is invalid or missing.'
  }

  if (message.includes('rate')) {
    return 'Email rate limit reached. Try again later.'
  }

  return 'Email could not be sent.'
}

function getSubject(formType) {
  if (formType === 'callback') {
    return 'New callback request'
  }

  if (formType === 'newsletter') {
    return 'New newsletter signup'
  }

  return 'New contact form message'
}

function getHtml(formType, payload) {
  const rows = Object.entries(payload)
    .filter(([key, value]) => key !== 'simulateFailure' && value !== '')
    .map(
      ([key, value]) => `
        <tr>
          <td style="padding:6px 10px;border:1px solid #d8e0ea;font-weight:700;">${escapeHtml(key)}</td>
          <td style="padding:6px 10px;border:1px solid #d8e0ea;">${escapeHtml(value)}</td>
        </tr>
      `,
    )
    .join('')

  return `
    <h1>${escapeHtml(getSubject(formType))}</h1>
    <table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;">
      ${rows}
    </table>
  `
}

function validateRequest(body) {
  const formType = String(body.formType || '')
  const payload = body.payload || {}

  if (!allowedFormTypes.has(formType) || typeof payload !== 'object') {
    return { error: 'Invalid email request.' }
  }

  if (formType === 'contact') {
    if (!payload.fullName || !payload.email || !payload.phone || !payload.message) {
      return { error: 'Contact form is incomplete.' }
    }
  }

  if (formType === 'callback') {
    if (!payload.phone || !payload.preferredTime) {
      return { error: 'Callback form is incomplete.' }
    }
  }

  if (formType === 'newsletter') {
    if (!payload.email || !payload.consent) {
      return { error: 'Newsletter form is incomplete.' }
    }
  }

  return { formType, payload }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    json(res, 405, { error: 'Method not allowed' })
    return
  }

  try {
    const body = await parseJsonBody(req)
    const validated = validateRequest(body)

    if (validated.error) {
      json(res, 400, { error: validated.error })
      return
    }

    const { apiKey, from, to } = getEmailConfig()
    const resend = new Resend(apiKey)

    const result = await resend.emails.send({
      from,
      to,
      subject: getSubject(validated.formType),
      html: getHtml(validated.formType, validated.payload),
      reply_to: validated.payload.email || undefined,
    })

    if (result.error) {
      console.error('Resend error:', { from, to, error: result.error })
      json(res, 502, { error: getPublicEmailError(result.error) })
      return
    }

    json(res, 200, { ok: true })
  } catch (error) {
    console.error('Email API error:', error)
    json(res, 500, {
      error:
        error.message === 'EMAIL_CONFIG_MISSING'
          ? 'Email is not configured.'
          : getPublicEmailError(error),
    })
  }
}
