import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormTracking } from '../hooks/useFormTracking'
import { useIsAdmin } from '../hooks/useIsAdmin'
import {
  trackFormError,
  trackFormSubmit,
  trackFormSuccess,
} from '../utils/analytics'
import { getEmailFeedback, isEmailFeedbackBlocking } from '../utils/emailValidation'
import { sendFormEmail } from '../utils/emailForms'
import {
  DEFAULT_PHONE_COUNTRY,
  PHONE_ALLOWED_PATTERN,
  PHONE_COUNTRIES,
  applyCountryDialCode,
  cleanPhoneValue,
  formatPhoneInput,
  getDialCodePrefix,
  getPhoneFeedback,
  getPhonePlaceholder,
  isPhoneFeedbackBlocking,
  normalizePhoneNumber,
} from '../utils/phoneValidation'
import FormStatus from './FormStatus'

const initialValues = {
  fullName: '',
  email: '',
  phoneCountry: DEFAULT_PHONE_COUNTRY,
  phone: '',
  message: '',
  simulateFailure: false,
}

const randomContacts = [
  {
    fullName: 'Alex Morgan',
    email: 'alex.test@example.com',
    phoneCountry: 'PL',
    phone: '+48 501 234 567',
    message: 'I would like to test the main contact form.',
  },
  {
    fullName: 'Jamie Taylor',
    email: 'jamie.test@example.com',
    phoneCountry: 'US',
    phone: '+1 (555) 123-0199',
    message: 'Please send me more information about analytics tracking.',
  },
  {
    fullName: 'Casey Novak',
    email: 'casey.test@example.com',
    phoneCountry: 'GB',
    phone: '+44 7700 900123',
    message: 'This is a simulated conversion tracking test.',
  },
]

function getRandomItem(items) {
  return items[Math.floor(Math.random() * items.length)]
}

function validateContactForm(values) {
  const errors = {}
  const emailFeedback = getEmailFeedback(values.email)
  const phoneFeedback = getPhoneFeedback(values.phone, values.phoneCountry)

  if (!values.fullName.trim()) {
    errors.fullName = 'Full name is required.'
  }

  if (isEmailFeedbackBlocking(emailFeedback)) {
    errors.email = emailFeedback.message
  }

  if (isPhoneFeedbackBlocking(phoneFeedback)) {
    errors.phone = phoneFeedback.message
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
  const isAdmin = useIsAdmin()
  const emailFeedback = getEmailFeedback(values.email, { required: false })
  const showEmailFeedback = values.email.trim() && !errors.email
  const phoneFeedback = getPhoneFeedback(values.phone, values.phoneCountry, {
    required: false,
  })
  const showPhoneFeedback = values.phone.trim() && !errors.phone && phoneFeedback.type !== 'idle'

  function updateValue(event) {
    const { checked, name, type, value } = event.target
    trackFirstInteraction()
    setValues((currentValues) => ({
      ...currentValues,
      [name]:
        type === 'checkbox'
          ? checked
          : name === 'phone'
            ? formatPhoneInput(value, currentValues.phoneCountry)
            : value,
    }))
    setErrors((currentErrors) => ({ ...currentErrors, [name]: '' }))
  }

  function handlePhoneFocus() {
    trackFirstInteraction()
    setValues((currentValues) => ({
      ...currentValues,
      phone: currentValues.phone || getDialCodePrefix(currentValues.phoneCountry),
    }))
  }

  function updatePhoneCountry(event) {
    const nextCountry = event.target.value
    trackFirstInteraction()
    setValues((currentValues) => ({
      ...currentValues,
      phoneCountry: nextCountry,
      phone: applyCountryDialCode(
        currentValues.phone,
        nextCountry,
        currentValues.phoneCountry,
      ),
    }))
    setErrors((currentErrors) => ({ ...currentErrors, phone: '' }))
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
        phone: formatPhoneInput(cleanedPhone, currentValues.phoneCountry),
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
        phone: normalizePhoneNumber(values.phone, values.phoneCountry),
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
        {showEmailFeedback && (
          <p
            className={`${emailFeedback.type}-message`}
            id={`${formName}-email-feedback`}
          >
            {emailFeedback.message}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor={`${formName}-phone`}>Phone number</label>
        <div className="phone-field-grid">
          <select
            aria-label="Phone country"
            name="phoneCountry"
            value={values.phoneCountry}
            onChange={updatePhoneCountry}
          >
            {PHONE_COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.label} ({getDialCodePrefix(country.code)})
              </option>
            ))}
          </select>
          <input
            id={`${formName}-phone`}
            name="phone"
            type="tel"
            value={values.phone}
            placeholder={getPhonePlaceholder(values.phoneCountry)}
            onChange={updateValue}
            onBeforeInput={handlePhoneBeforeInput}
            onPaste={handlePhonePaste}
            onFocus={handlePhoneFocus}
            inputMode="tel"
            aria-invalid={Boolean(errors.phone || phoneFeedback.type === 'error')}
            aria-describedby={
              errors.phone
                ? `${formName}-phone-error`
                : showPhoneFeedback
                  ? `${formName}-phone-feedback`
                  : undefined
            }
            autoComplete="tel"
          />
        </div>
        {errors.phone && (
          <p className="error-message" id={`${formName}-phone-error`}>
            {errors.phone}
          </p>
        )}
        {showPhoneFeedback && (
          <p
            className={`${phoneFeedback.type}-message`}
            id={`${formName}-phone-feedback`}
          >
            {phoneFeedback.message}
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

      {isAdmin && (
        <label className="checkbox-field">
          <input
            name="simulateFailure"
            type="checkbox"
            checked={values.simulateFailure}
            onChange={updateValue}
          />
          Simulate submission failure
        </label>
      )}

      <div className="form-actions">
        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit form'}
        </button>
        {isAdmin && (
          <button className="secondary-button" type="button" onClick={randomizeForm}>
            Fill with random test data
          </button>
        )}
      </div>

      <FormStatus errorMessage={statusMessage} />
    </form>
  )
}

export default ContactForm
