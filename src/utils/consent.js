export const CONSENT_STORAGE_KEY = 'analytics_practice_consent'

export const defaultConsent = {
  necessary: true,
  analytics: false,
  advertising: false,
}

export function getStoredConsent() {
  if (typeof window === 'undefined') {
    return defaultConsent
  }

  try {
    const storedConsent = window.localStorage.getItem(CONSENT_STORAGE_KEY)
    return storedConsent
      ? { ...defaultConsent, ...JSON.parse(storedConsent), necessary: true }
      : defaultConsent
  } catch {
    return defaultConsent
  }
}

export function saveConsent(preferences) {
  const nextConsent = {
    necessary: true,
    analytics: Boolean(preferences.analytics),
    advertising: Boolean(preferences.advertising),
  }

  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(nextConsent))
  return nextConsent
}

export function hasConsent(category) {
  return Boolean(getStoredConsent()[category])
}

export function clearConsent() {
  window.localStorage.removeItem(CONSENT_STORAGE_KEY)
}
