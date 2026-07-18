import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { usePageTracking } from './hooks/usePageTracking'
import AuthPage from './pages/AuthPage'
import CallbackPage from './pages/CallbackPage'
import ContactPage from './pages/ContactPage'
import HomePage from './pages/HomePage'
import NewsletterPage from './pages/NewsletterPage'
import PrivacyPage from './pages/PrivacyPage'
import ThankYouPage from './pages/ThankYouPage'
import UtmBuilderPage from './pages/UtmBuilderPage'

function App() {
  usePageTracking()

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="callback" element={<CallbackPage />} />
        <Route path="newsletter" element={<NewsletterPage />} />
        <Route path="utm-builder" element={<UtmBuilderPage />} />
        <Route path="login" element={<AuthPage />} />
        <Route path="thank-you" element={<ThankYouPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
      </Route>
    </Routes>
  )
}

export default App
