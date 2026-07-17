import '@testing-library/jest-dom/vitest'
import { beforeEach } from 'vitest'

beforeEach(() => {
  window.dataLayer = []
  window.localStorage.clear()
  window.sessionStorage.clear()
})
