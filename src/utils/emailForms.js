export async function sendFormEmail(formType, payload) {
  const response = await fetch('/api/send-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ formType, payload }),
  })
  const data = await response
    .json()
    .catch(() => ({ error: `Request failed with status ${response.status}.` }))

  if (!response.ok) {
    throw new Error(data.error || 'Email could not be sent.')
  }

  return data
}
