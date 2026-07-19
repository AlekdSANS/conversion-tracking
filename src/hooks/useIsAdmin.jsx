import { useOutletContext } from 'react-router-dom'

export function useIsAdmin() {
  const context = useOutletContext() || {}

  return context.user?.admin_status === 1
}
