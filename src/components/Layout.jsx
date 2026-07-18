import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import AnalyticsDebugPanel from './AnalyticsDebugPanel'
import ConsentBanner from './ConsentBanner'
import Waves from './Waves'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/contact', label: 'Contact' },
  { to: '/callback', label: 'Callback' },
  { to: '/newsletter', label: 'Newsletter' },
  { to: '/privacy', label: 'Privacy' },
]

function Layout() {
  const [showConsentSettings, setShowConsentSettings] = useState(false)

  return (
    <>
      <Waves
        className="site-waves"
        lineColor="rgba(25, 103, 210, 0.16)"
        backgroundColor="rgba(255, 255, 255, 0.22)"
        waveSpeedX={0.0125}
        waveSpeedY={0.01}
        waveAmpX={40}
        waveAmpY={20}
        friction={0.9}
        tension={0.01}
        maxCursorMove={120}
        xGap={12}
        yGap={36}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <header className="site-header">
        <a className="site-title" href="/">
          Tracking Practice
        </a>
        <nav aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
              end={item.to === '/'}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="page-shell">
        <Outlet />
      </main>

      <footer className="site-footer">
        <p>Practice project for GA4, GTM, Google Ads, UTM, and consent testing.</p>
        <button type="button" onClick={() => setShowConsentSettings(true)}>
          Reopen consent settings
        </button>
      </footer>

      <ConsentBanner />
      {showConsentSettings && (
        <ConsentBanner
          forceOpen
          onClose={() => setShowConsentSettings(false)}
        />
      )}
      <AnalyticsDebugPanel />
    </>
  )
}

export default Layout
