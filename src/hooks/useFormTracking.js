import { useRef } from 'react'
import { trackFormStart } from '../utils/analytics'

export function useFormTracking(formName, formLocation) {
  const startedRef = useRef(false)

  function trackFirstInteraction() {
    if (!startedRef.current) {
      startedRef.current = true
      trackFormStart(formName, formLocation)
    }
  }

  return { trackFirstInteraction }
}
