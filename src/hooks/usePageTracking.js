import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { captureCampaignParams } from '../utils/campaignParams'
import { trackPageView } from '../utils/analytics'

export function usePageTracking() {
  const location = useLocation()
  const lastTrackedPathRef = useRef('')

  useEffect(() => {
    captureCampaignParams(location.search)

    const path = `${location.pathname}${location.search}`
    if (lastTrackedPathRef.current === path) {
      return
    }

    lastTrackedPathRef.current = path
    trackPageView(path)
  }, [location.pathname, location.search])
}
