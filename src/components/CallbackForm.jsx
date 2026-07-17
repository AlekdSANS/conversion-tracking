import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormTracking } from '../hooks/useFormTracking'
import {
  trackFormError,
  trackFormSubmit,
  trackFormSuccess,
} from '../utils/analytics'
import FormStatus from './FormStatus'

const initialValues = {
  phone: '',
  preferredTime: '',
  simulateFailure: false,
}

const PHONE_ALLOWED_PATTERN = /^[0-9+\-\s()]*$/

const randomCallbacks = [
  {
    phone: '+48 601 222 333',
    preferredTime: 'Weekday morning',
  },
  {
    phone: '+1 (555) 204-8821',
    preferredTime: 'Tomorrow afternoon',
  },
  {
    phone: '+44 7700 900456',
    preferredTime: 'Friday after 10:00',
  },
]

function getRandomItem(items) {
  return items[Math.floor(Math.random() * items.length)]
}

function cleanPhoneValue(value) {
  return value.replace(/[^0-9+\-\s()]/g, '')
}

function validateCallbackForm(values) {
  const errors = {}

  if (!values.phone.trim()) {
    errors.phone = 'Phone number is required.'
  } else if (!/^[0-9+\-\s()]{7,}$/.test(values.phone)) {
    errors.phone = 'Enter a valid phone number.'
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
      setValues((currentValues) => ({
        ...currentValues,
        phone: cleanPhoneValue(pastedText),
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
    await new Promise((resolve) => window.setTimeout(resolve, 500))

    if (values.simulateFailure) {
      setIsSubmitting(false)
      setStatusMessage('The simulated callback request failed. Try again.')
      trackFormError(formName, formLocation, 'simulated_server_error')
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
        <input
          id="callback-phone"
          name="phone"
          type="tel"
          value={values.phone}
          placeholder="+48 601 222 333"
          onChange={updateValue}
          onBeforeInput={handlePhoneBeforeInput}
          onPaste={handlePhonePaste}
          onFocus={trackFirstInteraction}
          inputMode="tel"
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? 'callback-phone-error' : undefined}
          autoComplete="tel"
        />
        {errors.phone && (
          <p className="error-message" id="callback-phone-error">
            {errors.phone}
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
          {isSubmitting ? 'Submitting...' : 'Request callback'}
        </button>
        <button className="secondary-button" type="button" onClick={randomizeForm}>
          Fill with random test data
        </button>
      </div>

      <FormStatus errorMessage={statusMessage} />
    </form>
  )
}

export default CallbackForm
