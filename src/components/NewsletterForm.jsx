import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormTracking } from '../hooks/useFormTracking'
import {
  trackFormError,
  trackFormSubmit,
  trackFormSuccess,
} from '../utils/analytics'
import { sendFormEmail } from '../utils/emailForms'
import FormStatus from './FormStatus'

const initialValues = {
  email: '',
  consent: false,
  simulateFailure: false,
}

const randomNewsletterEmails = [
  'newsletter.test@example.com',
  'subscriber.test@example.com',
  'ga4.practice@example.com',
]

function getRandomItem(items) {
  return items[Math.floor(Math.random() * items.length)]
}

function validateNewsletterForm(values) {
  const errors = {}

  if (!values.email.trim()) {
    errors.email = 'Email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Enter a valid email address.'
  }

  if (!values.consent) {
    errors.consent = 'Please confirm newsletter consent.'
  }

  return errors
}

function NewsletterForm() {
  const formName = 'newsletter_form'
  const formLocation = 'newsletter_page'
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [statusMessage, setStatusMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const { trackFirstInteraction } = useFormTracking(formName, formLocation)

  function updateValue(event) {
    const { checked, name, type, value } = event.target
    trackFirstInteraction()
    setValues((currentValues) => ({
      ...currentValues,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setErrors((currentErrors) => ({ ...currentErrors, [name]: '' }))
  }

  function randomizeForm() {
    trackFirstInteraction()
    setValues({
      ...initialValues,
      email: getRandomItem(randomNewsletterEmails),
      consent: true,
      simulateFailure: values.simulateFailure,
    })
    setErrors({})
    setStatusMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    trackFirstInteraction()
    trackFormSubmit(formName, formLocation)
    setStatusMessage('')

    const nextErrors = validateNewsletterForm(values)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setStatusMessage('Please fix the highlighted fields.')
      trackFormError(formName, formLocation, 'validation_error')
      return
    }

    setIsSubmitting(true)

    if (values.simulateFailure) {
      setIsSubmitting(false)
      setStatusMessage('The simulated newsletter signup failed. Try again.')
      trackFormError(formName, formLocation, 'simulated_server_error')
      return
    }

    try {
      await sendFormEmail('newsletter', {
        email: values.email,
        consent: values.consent,
        formName,
        formLocation,
      })
    } catch (error) {
      setIsSubmitting(false)
      setStatusMessage(error.message)
      trackFormError(formName, formLocation, 'email_send_error')
      return
    }

    trackFormSuccess(formName, formLocation)
    navigate('/thank-you', {
      state: { formName, formLocation },
    })
  }

  return (
    <form className="form-card" onSubmit={handleSubmit} noValidate>
      <h2>Newsletter signup</h2>

      <div className="field">
        <label htmlFor="newsletter-email">Email</label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          value={values.email}
          placeholder="newsletter.test@example.com"
          onChange={updateValue}
          onFocus={trackFirstInteraction}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'newsletter-email-error' : undefined}
          autoComplete="email"
        />
        {errors.email && (
          <p className="error-message" id="newsletter-email-error">
            {errors.email}
          </p>
        )}
      </div>

      <label className="checkbox-field">
        <input
          name="consent"
          type="checkbox"
          checked={values.consent}
          onChange={updateValue}
          aria-invalid={Boolean(errors.consent)}
          aria-describedby={errors.consent ? 'newsletter-consent-error' : undefined}
        />
        I agree to receive the newsletter.
      </label>
      {errors.consent && (
        <p className="error-message" id="newsletter-consent-error">
          {errors.consent}
        </p>
      )}

      <label className="checkbox-field">
        <input
          name="simulateFailure"
          type="checkbox"
          checked={values.simulateFailure}
          onChange={updateValue}
        />
        Simulate submission failure
      </label>

      <div className="form-actions">
        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Sign up'}
        </button>
        <button className="secondary-button" type="button" onClick={randomizeForm}>
          Fill with random test data
        </button>
      </div>

      <FormStatus errorMessage={statusMessage} />
    </form>
  )
}

export default NewsletterForm
