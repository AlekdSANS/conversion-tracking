const CAMPAIGN_STORAGE_KEY = 'analytics_practice_campaign'

const CAMPAIGN_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
]

export function captureCampaignParams(search = window.location.search) {
  if (typeof window === 'undefined') {
    return {}
  }

  const params = new URLSearchParams(search)
  const campaign = getStoredCampaignParams()

  CAMPAIGN_KEYS.forEach((key) => {
    const value = params.get(key)
    if (value) {
      campaign[key] = value
    }
  })

  window.sessionStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(campaign))
  return campaign
}

export function getStoredCampaignParams() {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const storedParams = window.sessionStorage.getItem(CAMPAIGN_STORAGE_KEY)
    return storedParams ? JSON.parse(storedParams) : {}
  } catch {
    return {}
  }
}

export function getSafeCampaignParams() {
  const campaign = getStoredCampaignParams()

  return {
    traffic_source: campaign.utm_source || 'direct',
    campaign_name: campaign.utm_campaign || '',
    utm_medium: campaign.utm_medium || '',
    utm_term: campaign.utm_term || '',
    utm_content: campaign.utm_content || '',
    has_gclid: Boolean(campaign.gclid),
  }
}

export function clearCampaignParams() {
  window.sessionStorage.removeItem(CAMPAIGN_STORAGE_KEY)
}
