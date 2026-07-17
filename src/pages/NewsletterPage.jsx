import NewsletterForm from '../components/NewsletterForm'

function NewsletterPage() {
  return (
    <section className="narrow-page playful-page newsletter-playful">
      <img
        className="playful-image newsletter-image"
        src="/silly/silly-3.png"
        alt="Newsletter cat mascot"
      />
      <div className="page-intro">
        <p className="eyebrow">Newsletter route</p>
        <h1>Newsletter signup</h1>
        <p>
          Practice newsletter signup events with checkbox validation and
          consent-friendly parameters.
        </p>
      </div>

      <NewsletterForm />
    </section>
  )
}

export default NewsletterPage
