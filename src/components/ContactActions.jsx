import { trackContactAction } from '../utils/analytics'

const contactActions = [
  {
    label: 'Call',
    href: 'tel:+48123456789',
    method: 'phone',
  },
  {
    label: 'Email',
    href: 'mailto:test@example.com',
    method: 'email',
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/',
    method: 'linkedin',
  },
  {
    label: 'X',
    href: 'https://x.com/',
    method: 'x',
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/',
    method: 'facebook',
  },
]

function ContactActions({ location = 'contact_page' }) {
  return (
    <section className="contact-actions" aria-labelledby="contact-actions-title">
      <h2 id="contact-actions-title">Direct contact buttons</h2>
      <div className="contact-action-list">
        {contactActions.map((action) => (
          <a
            key={action.method}
            href={action.href}
            target={action.href.startsWith('http') ? '_blank' : undefined}
            rel={action.href.startsWith('http') ? 'noreferrer' : undefined}
            onClick={() => trackContactAction(action.method, location)}
          >
            {action.label}
          </a>
        ))}
      </div>
    </section>
  )
}

export default ContactActions
