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
  fullName: '',
  email: '',
  phone: '',
  message: '',
  simulateFailure: false,
}

const PHONE_ALLOWED_PATTERN = /^[0-9+\-\s()]*$/

const randomContacts = [
  {
    fullName: 'Alex Morgan',
    email: 'alex.test@example.com',
    phone: '+48 501 234 567',
    message: 'I would like to test the main contact form.',
  },
  {
    fullName: 'Jamie Taylor',
    email: 'jamie.test@example.com',
    phone: '+1 (555) 123-0199',
    message: 'Please send me more information about analytics tracking.',
  },
  {
    fullName: 'Casey Novak',
    email: 'casey.test@example.com',
    phone: '+44 7700 900123',
    message: 'This is a simulated conversion tracking test.',
  },
]

function getRandomItem(items) {
  return items[Math.floor(Math.random() * items.length)]
}

function cleanPhoneValue(value) {
  return value.replace(/[^0-9+\-\s()]/g, '')
}

function validateContactForm(values) {
  const errors = {}

  if (!values.fullName.trim()) {
    errors.fullName = 'Full name is required.'
  }

  if (!values.email.trim()) {
    errors.email = 'Email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Enter a valid email address.'
  }

  if (!values.phone.trim()) {
    errors.phone = 'Phone number is required.'
  } else if (!/^[0-9+\-\s()]{7,}$/.test(values.phone)) {
    errors.phone = 'Enter a valid phone number.'
  }

  if (!values.message.trim()) {
    errors.message = 'Message is required.'
  }

  return errors
}

function ContactForm({
  formName = 'main_contact_form',
  formLocation = 'home_page',
  title = 'Contact form',
}) {
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
      [name]:
        type === 'checkbox'
          ? checked
          : name === 'phone'
            ? cleanPhoneValue(value)
            : value,
    }))
    setErrors((currentErrors) => ({ ...currentErrors, [name]: '' }))
  }

  function handlePhoneBeforeInput(event) {
    if (event.data && !PHONE_ALLOWED_PATTERN.test(event.data)) {
      event.preventDefault()
    }
  }

  function handlePhonePaste(event) {
    const pastedText = event.clipboardData.getData('text')
    if (!PHONE_ALLOWED_PATTERN.test(pastedText)) {
      event.preventDefault()
      const cleanedPhone = cleanPhoneValue(pastedText)
      setValues((currentValues) => ({
        ...currentValues,
        phone: cleanedPhone,
      }))
      setErrors((currentErrors) => ({ ...currentErrors, phone: '' }))
    }
  }

  function randomizeForm() {
    trackFirstInteraction()
    setValues({
      ...initialValues,
      ...getRandomItem(randomContacts),
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

    const nextErrors = validateContactForm(values)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setStatusMessage('Please fix the highlighted fields.')
      trackFormError(formName, formLocation, 'validation_error')
      return
    }

    setIsSubmitting(true)

    if (values.simulateFailure) {
      setIsSubmitting(false)
      setStatusMessage('The simulated request failed. Try again.')
      trackFormError(formName, formLocation, 'simulated_server_error')
      return
    }

    try {
      await sendFormEmail('contact', {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        message: values.message,
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
    setValues(initialValues)
    navigate('/thank-you', {
      state: { formName, formLocation },
    })
  }

  return (
    <form className="form-card" onSubmit={handleSubmit} noValidate>
      <h2>{title}</h2>

      <div className="field">
        <label htmlFor={`${formName}-fullName`}>Full name</label>
        <input
          id={`${formName}-fullName`}
          name="fullName"
          type="text"
          value={values.fullName}
          placeholder="Alex Morgan"
          onChange={updateValue}
          onFocus={trackFirstInteraction}
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={errors.fullName ? `${formName}-fullName-error` : undefined}
          autoComplete="name"
        />
        {errors.fullName && (
          <p className="error-message" id={`${formName}-fullName-error`}>
            {errors.fullName}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor={`${formName}-email`}>Email</label>
        <input
          id={`${formName}-email`}
          name="email"
          type="email"
          value={values.email}
          placeholder="alex.test@example.com"
          onChange={updateValue}
          onFocus={trackFirstInteraction}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? `${formName}-email-error` : undefined}
          autoComplete="email"
        />
        {errors.email && (
          <p className="error-message" id={`${formName}-email-error`}>
            {errors.email}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor={`${formName}-phone`}>Phone number</label>
        <input
          id={`${formName}-phone`}
          name="phone"
          type="tel"
          value={values.phone}
          placeholder="+48 501 234 567"
          onChange={updateValue}
          onBeforeInput={handlePhoneBeforeInput}
          onPaste={handlePhonePaste}
          onFocus={trackFirstInteraction}
          inputMode="tel"
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? `${formName}-phone-error` : undefined}
          autoComplete="tel"
        />
        {errors.phone && (
          <p className="error-message" id={`${formName}-phone-error`}>
            {errors.phone}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor={`${formName}-message`}>Message</label>
        <textarea
          id={`${formName}-message`}
          name="message"
          value={values.message}
          placeholder="Write a short test message"
          onChange={updateValue}
          onFocus={trackFirstInteraction}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? `${formName}-message-error` : undefined}
          rows="5"
        />
        {errors.message && (
          <p className="error-message" id={`${formName}-message-error`}>
            {errors.message}
          </p>
        )}
      </div>

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
          {isSubmitting ? 'Submitting...' : 'Submit form'}
        </button>
        <button className="secondary-button" type="button" onClick={randomizeForm}>
          Fill with random test data
        </button>
      </div>

      <FormStatus errorMessage={statusMessage} />
    </form>
  )
}

export default ContactForm
