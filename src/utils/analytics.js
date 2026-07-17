import { getSafeCampaignParams } from './campaignParams'
import { getStoredConsent, hasConsent } from './consent'

const EVENTS_THAT_ALWAYS_PUSH = new Set(['consent_update'])

function getPagePath() {
  if (typeof window === 'undefined') {
    return '/'
  }

  return window.location.pathname
}

function canPushEvent(eventName) {
  if (EVENTS_THAT_ALWAYS_PUSH.has(eventName)) {
    return true
  }

  return hasConsent('analytics')
}

export function trackEvent(eventName, parameters = {}) {
  if (typeof window === 'undefined') {
    return null
  }

  window.dataLayer = window.dataLayer || []

  const eventPayload = {
    event: eventName,
    timestamp: new Date().toISOString(),
    page_path: getPagePath(),
    ...getSafeCampaignParams(),
    ...parameters,
  }

  const allowed = canPushEvent(eventName)

  if (allowed) {
    window.dataLayer.push(eventPayload)
  }

  window.dispatchEvent(
    new CustomEvent('analytics:event', {
      detail: {
        ...eventPayload,
        pushed_to_data_layer: allowed,
        consent_state: getStoredConsent(),
      },
    }),
  )

  if (import.meta.env.DEV) {
    console.log(
      allowed ? '[analytics]' : '[analytics blocked by consent]',
      eventName,
      eventPayload,
    )
  }

  return eventPayload
}

export function trackPageView(path) {
  return trackEvent('page_view', {
    page_path: path,
  })
}

export function trackThankYouPageView(formName, formLocation) {
  return trackEvent('thank_you_page_view', {
    form_name: formName,
    form_location: formLocation,
    submission_status: 'success',
  })
}

export function trackFormStart(formName, formLocation) {
  return trackEvent('contact_form_start', {
    form_name: formName,
    form_location: formLocation,
    submission_status: 'started',
  })
}

export function trackFormSubmit(formName, formLocation) {
  return trackEvent('contact_form_submit', {
    form_name: formName,
    form_location: formLocation,
    submission_status: 'submitted',
  })
}

export function trackFormSuccess(formName, formLocation) {
  trackEvent('contact_form_success', {
    form_name: formName,
    form_location: formLocation,
    submission_status: 'success',
  })

  if (formName === 'newsletter_form') {
    trackEvent('newsletter_signup', {
      form_name: formName,
      form_location: formLocation,
      submission_status: 'success',
    })
  }

  if (formName === 'callback_form') {
    trackEvent('callback_request', {
      form_name: formName,
      form_location: formLocation,
      submission_status: 'success',
    })
  }
}

export function trackFormError(formName, formLocation, errorType) {
  return trackEvent('contact_form_error', {
    form_name: formName,
    form_location: formLocation,
    submission_status: 'error',
    error_type: errorType,
  })
}

export function trackContactAction(contactMethod, contactLocation) {
  return trackEvent('contact_action_click', {
    contact_method: contactMethod,
    contact_location: contactLocation,
  })
}

export function trackConsentUpdate(consentSettings) {
  // Later, Google Consent Mode can be connected here before GTM tags fire.
  return trackEvent('consent_update', {
    consent_state: consentSettings,
  })
}
