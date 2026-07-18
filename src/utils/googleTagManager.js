const GTM_ID = 'GTM-N386PQB8'

export function loadGoogleTagManager() {
  if (typeof window === 'undefined' || window.__gtmLoaded) {
    return
  }

  window.__gtmLoaded = true
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({
    'gtm.start': new Date().getTime(),
    event: 'gtm.js',
  })

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`
  document.head.appendChild(script)
}
