import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { expect, test } from 'vitest'
import App from '../App'
import ContactForm from '../components/ContactForm'
import ConsentBanner from '../components/ConsentBanner'
import { saveConsent } from '../utils/consent'

function renderApp(initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <App />
    </MemoryRouter>,
  )
}

function renderContactForm() {
  return render(
    <MemoryRouter>
      <ContactForm
        formName="main_contact_form"
        formLocation="test_page"
        title="Test contact form"
      />
    </MemoryRouter>,
  )
}

async function completeContactForm(user) {
  await user.type(screen.getByLabelText(/full name/i), 'Ada Lovelace')
  await user.type(screen.getByLabelText(/^email$/i), 'ada@example.com')
  await user.type(screen.getByLabelText(/phone number/i), '+48 123 456 789')
  await user.type(screen.getByLabelText(/message/i), 'Please contact me.')
}

test('shows required field validation', async () => {
  const user = userEvent.setup()
  renderContactForm()

  await user.click(screen.getByRole('button', { name: /submit form/i }))

  expect(screen.getByText(/full name is required/i)).toBeInTheDocument()
  expect(screen.getByText(/email is required/i)).toBeInTheDocument()
  expect(screen.getByText(/phone number is required/i)).toBeInTheDocument()
  expect(screen.getByText(/message is required/i)).toBeInTheDocument()
})

test('shows invalid email validation', async () => {
  const user = userEvent.setup()
  renderContactForm()

  await user.type(screen.getByLabelText(/full name/i), 'Ada Lovelace')
  await user.type(screen.getByLabelText(/^email$/i), 'not-an-email')
  await user.type(screen.getByLabelText(/phone number/i), '+48 123 456 789')
  await user.type(screen.getByLabelText(/message/i), 'Please contact me.')
  await user.click(screen.getByRole('button', { name: /submit form/i }))

  expect(screen.getByText(/enter a valid email address/i)).toBeInTheDocument()
})

test('redirects to thank-you page after successful simulated submission', async () => {
  saveConsent({ necessary: true, analytics: true, advertising: true })
  const user = userEvent.setup()
  renderApp(['/contact'])

  await completeContactForm(user)
  await user.click(screen.getByRole('button', { name: /submit form/i }))

  await waitFor(() => {
    expect(screen.getByRole('heading', { name: /thank you/i })).toBeInTheDocument()
  })
})

test('pushes an analytics event on form start', async () => {
  saveConsent({ necessary: true, analytics: true, advertising: true })
  const user = userEvent.setup()
  renderContactForm()

  await user.type(screen.getByLabelText(/full name/i), 'Ada')

  expect(window.dataLayer).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        event: 'contact_form_start',
        form_name: 'main_contact_form',
        form_location: 'test_page',
      }),
    ]),
  )
})

test('pushes an analytics event on form success', async () => {
  saveConsent({ necessary: true, analytics: true, advertising: true })
  const user = userEvent.setup()
  renderApp(['/contact'])

  await completeContactForm(user)
  await user.click(screen.getByRole('button', { name: /submit form/i }))

  await waitFor(() => {
    expect(window.dataLayer).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'contact_form_success',
          form_name: 'contact_page_form',
        }),
      ]),
    )
  })
})

test('does not include personal information in analytics events', async () => {
  saveConsent({ necessary: true, analytics: true, advertising: true })
  const user = userEvent.setup()
  renderApp(['/contact'])

  await completeContactForm(user)
  await user.click(screen.getByRole('button', { name: /submit form/i }))

  await waitFor(() => {
    expect(window.dataLayer.some((event) => event.event === 'contact_form_success')).toBe(true)
  })

  const analyticsText = JSON.stringify(window.dataLayer)
  expect(analyticsText).not.toContain('Ada Lovelace')
  expect(analyticsText).not.toContain('ada@example.com')
  expect(analyticsText).not.toContain('+48 123 456 789')
  expect(analyticsText).not.toContain('Please contact me.')
})

test('saves consent preferences', async () => {
  const user = userEvent.setup()
  render(<ConsentBanner />)

  await user.click(screen.getByRole('button', { name: /customize/i }))
  await user.click(screen.getByLabelText(/analytics/i))
  await user.click(screen.getByRole('button', { name: /save settings/i }))

  expect(JSON.parse(localStorage.getItem('analytics_practice_consent'))).toEqual({
    necessary: true,
    analytics: true,
    advertising: false,
  })
})

test('pushes a page-view event on route change', async () => {
  saveConsent({ necessary: true, analytics: true, advertising: true })
  const user = userEvent.setup()
  renderApp(['/'])

  await user.click(screen.getByRole('link', { name: /contact/i }))

  await waitFor(() => {
    expect(window.dataLayer).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'page_view',
          page_path: '/contact',
        }),
      ]),
    )
  })
})
