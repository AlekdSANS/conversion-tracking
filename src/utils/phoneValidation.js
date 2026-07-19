import {
  AsYouType,
  getExampleNumber,
  getCountryCallingCode,
  isPossiblePhoneNumber,
  parsePhoneNumberFromString,
} from 'libphonenumber-js'
import examples from 'libphonenumber-js/examples.mobile.json'

export const PHONE_COUNTRIES = [
  { code: 'AL', label: 'Albania' },
  { code: 'AD', label: 'Andorra' },
  { code: 'AT', label: 'Austria' },
  { code: 'BY', label: 'Belarus' },
  { code: 'BE', label: 'Belgium' },
  { code: 'BA', label: 'Bosnia and Herzegovina' },
  { code: 'BG', label: 'Bulgaria' },
  { code: 'HR', label: 'Croatia' },
  { code: 'CY', label: 'Cyprus' },
  { code: 'CZ', label: 'Czechia' },
  { code: 'DK', label: 'Denmark' },
  { code: 'EE', label: 'Estonia' },
  { code: 'FI', label: 'Finland' },
  { code: 'FR', label: 'France' },
  { code: 'DE', label: 'Germany' },
  { code: 'GR', label: 'Greece' },
  { code: 'HU', label: 'Hungary' },
  { code: 'IS', label: 'Iceland' },
  { code: 'IE', label: 'Ireland' },
  { code: 'IT', label: 'Italy' },
  { code: 'XK', label: 'Kosovo' },
  { code: 'LV', label: 'Latvia' },
  { code: 'LI', label: 'Liechtenstein' },
  { code: 'LT', label: 'Lithuania' },
  { code: 'LU', label: 'Luxembourg' },
  { code: 'MT', label: 'Malta' },
  { code: 'MD', label: 'Moldova' },
  { code: 'MC', label: 'Monaco' },
  { code: 'ME', label: 'Montenegro' },
  { code: 'NL', label: 'Netherlands' },
  { code: 'MK', label: 'North Macedonia' },
  { code: 'NO', label: 'Norway' },
  { code: 'PL', label: 'Poland' },
  { code: 'PT', label: 'Portugal' },
  { code: 'RO', label: 'Romania' },
  { code: 'SM', label: 'San Marino' },
  { code: 'RS', label: 'Serbia' },
  { code: 'SK', label: 'Slovakia' },
  { code: 'SI', label: 'Slovenia' },
  { code: 'ES', label: 'Spain' },
  { code: 'SE', label: 'Sweden' },
  { code: 'CH', label: 'Switzerland' },
  { code: 'UA', label: 'Ukraine' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'US', label: 'United States' },
  { code: 'CA', label: 'Canada' },
]

export const DEFAULT_PHONE_COUNTRY = 'PL'

export const PHONE_ALLOWED_PATTERN = /^\d*$/

export function getDialCodePrefix(countryCode) {
  return `+${getCountryCallingCode(countryCode)}`
}

export function cleanPhoneValue(value) {
  return value.replace(/[^0-9+\-\s()]/g, '')
}

function getNationalDigits(phoneValue, countryCode) {
  const callingCode = getCountryCallingCode(countryCode)
  const digits = phoneValue.replace(/\D/g, '')

  return digits.startsWith(callingCode) ? digits.slice(callingCode.length) : digits
}

export function getPhoneExample(countryCode) {
  return getExampleNumber(countryCode, examples)
}

export function getPhonePlaceholder(countryCode) {
  const exampleNumber = getPhoneExample(countryCode)
  const dialCodePrefix = getDialCodePrefix(countryCode)

  if (!exampleNumber) {
    return `${dialCodePrefix} --- --- ---`
  }

  const internationalExample = exampleNumber.formatInternational()

  if (internationalExample.startsWith(dialCodePrefix)) {
    return `${dialCodePrefix}${internationalExample
      .slice(dialCodePrefix.length)
      .replace(/\d/g, '-')}`
  }

  return internationalExample.replace(/\d/g, '-')
}

export function getMaxNationalDigits(countryCode) {
  return getPhoneExample(countryCode)?.nationalNumber.length || 15
}

export function formatPhoneInput(phoneValue, countryCode) {
  const callingCode = getCountryCallingCode(countryCode)
  const nationalDigits = getNationalDigits(phoneValue, countryCode).slice(
    0,
    getMaxNationalDigits(countryCode),
  )

  if (!nationalDigits) {
    return `${getDialCodePrefix(countryCode)} `
  }

  return new AsYouType().input(`+${callingCode}${nationalDigits}`)
}

export function applyCountryDialCode(phoneValue, nextCountry, previousCountry) {
  const previousCountryCode = previousCountry || nextCountry
  const nationalDigits = getNationalDigits(phoneValue, previousCountryCode)

  return formatPhoneInput(`${getDialCodePrefix(nextCountry)} ${nationalDigits}`, nextCountry)
}

export function normalizePhoneNumber(phoneValue, countryCode) {
  const parsedPhone = parsePhoneNumberFromString(phoneValue, countryCode)

  return parsedPhone?.isPossible() ? parsedPhone.number : phoneValue.trim()
}

export function getPhoneFeedback(phoneValue, countryCode, { required = true } = {}) {
  const phone = phoneValue.trim()
  const nationalDigits = getNationalDigits(phone, countryCode)

  if (!phone || !nationalDigits) {
    return required
      ? { type: 'error', message: 'Phone number is required.' }
      : { type: 'idle', message: '' }
  }

  try {
    if (isPossiblePhoneNumber(phone, countryCode)) {
      return { type: 'success', message: 'Phone number format looks good.' }
    }
  } catch {
    return { type: 'error', message: 'Enter a valid phone number.' }
  }

  return { type: 'error', message: `Enter a valid phone number for ${countryCode}.` }
}

export function isPhoneFeedbackBlocking(feedback) {
  return feedback.type === 'error'
}
