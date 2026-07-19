const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const DOMAIN_SUGGESTIONS = {
  'gmai.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.co': 'gmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outlook.con': 'outlook.com',
  'yaho.com': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
}

const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com',
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  'guerrillamail.com',
])

export function getEmailFeedback(emailValue, { required = true } = {}) {
  const email = emailValue.trim().toLowerCase()

  if (!email) {
    return required
      ? { type: 'error', message: 'Email is required.' }
      : { type: 'idle', message: '' }
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { type: 'error', message: 'Enter a valid email address.' }
  }

  const [, domain = ''] = email.split('@')
  const suggestedDomain = DOMAIN_SUGGESTIONS[domain]

  if (suggestedDomain) {
    return {
      type: 'warning',
      message: `Did you mean ${email.replace(domain, suggestedDomain)}?`,
    }
  }

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      type: 'warning',
      message: 'Temporary email domains can be blocked by some email tools.',
    }
  }

  return { type: 'success', message: 'Email format looks good.' }
}

export function isEmailFeedbackBlocking(feedback) {
  return feedback.type === 'error'
}
