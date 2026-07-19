import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormTracking } from '../hooks/useFormTracking'
import { useIsAdmin } from '../hooks/useIsAdmin'
import {
  trackFormError,
  trackFormSubmit,
  trackFormSuccess,
} from '../utils/analytics'
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
  phoneCountry: DEFAULT_PHONE_COUNTRY,
  phone: '',
  preferredTime: '',
  simulateFailure: false,
}

const randomCallbacks = [
  {
    phoneCountry: 'PL',
    phone: '+48 601 222 333',
    preferredTime: 'Weekday morning',
  },
  {
    phoneCountry: 'US',
    phone: '+1 (555) 204-8821',
    preferredTime: 'Tomorrow afternoon',
  },
  {
    phoneCountry: 'GB',
    phone: '+44 7700 900456',
    preferredTime: 'Friday after 10:00',
  },
]

function getRandomItem(items) {
  return items[Math.floor(Math.random() * items.length)]
}

function validateCallbackForm(values) {
  const errors = {}
  const phoneFeedback = getPhoneFeedback(values.phone, values.phoneCountry)

  if (isPhoneFeedbackBlocking(phoneFeedback)) {
    errors.phone = phoneFeedback.message
  }

  if (!values.preferredTime.trim()) {
    errors.preferredTime = 'Preferred contact time is required.'
  }

  return errors
}

function CallbackForm() {
  const formName = 'callback_form'
  const formLocation = 'callback_page'
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [statusMessage, setStatusMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const { trackFirstInteraction } = useFormTracking(formName, formLocation)
  const isAdmin = useIsAdmin()
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
      setValues((currentValues) => ({
        ...currentValues,
        phone: formatPhoneInput(cleanPhoneValue(pastedText), currentValues.phoneCountry),
      }))
      setErrors((currentErrors) => ({ ...currentErrors, phone: '' }))
    }
  }

  function randomizeForm() {
    trackFirstInteraction()
    setValues({
      ...initialValues,
      ...getRandomItem(randomCallbacks),
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

    const nextErrors = validateCallbackForm(values)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setStatusMessage('Please fix the highlighted fields.')
      trackFormError(formName, formLocation, 'validation_error')
      return
    }

    setIsSubmitting(true)

    if (values.simulateFailure) {
      setIsSubmitting(false)
      setStatusMessage('The simulated callback request failed. Try again.')
      trackFormError(formName, formLocation, 'simulated_server_error')
      return
    }

    try {
      await sendFormEmail('callback', {
        phone: normalizePhoneNumber(values.phone, values.phoneCountry),
        preferredTime: values.preferredTime,
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
      <h2>Request a callback</h2>

      <div className="field">
        <label htmlFor="callback-phone">Phone number</label>
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
            id="callback-phone"
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
                ? 'callback-phone-error'
                : showPhoneFeedback
                  ? 'callback-phone-feedback'
                  : undefined
            }
            autoComplete="tel"
          />
        </div>
        {errors.phone && (
          <p className="error-message" id="callback-phone-error">
            {errors.phone}
          </p>
        )}
        {showPhoneFeedback && (
          <p className={`${phoneFeedback.type}-message`} id="callback-phone-feedback">
            {phoneFeedback.message}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="callback-time">Preferred contact time</label>
        <input
          id="callback-time"
          name="preferredTime"
          type="text"
          value={values.preferredTime}
          onChange={updateValue}
          onFocus={trackFirstInteraction}
          aria-invalid={Boolean(errors.preferredTime)}
          aria-describedby={
            errors.preferredTime ? 'callback-time-error' : undefined
          }
          placeholder="For example: weekday morning"
        />
        {errors.preferredTime && (
          <p className="error-message" id="callback-time-error">
            {errors.preferredTime}
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
          {isSubmitting ? 'Submitting...' : 'Request callback'}
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

export default CallbackForm
