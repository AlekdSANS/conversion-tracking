import { Link } from 'react-router-dom'

function HomePage() {
  return (
    <section className="home-page">
      <div className="page-intro home-intro">
        <p className="eyebrow">Analytics practice</p>
        <h1>Learn conversion tracking with simple forms</h1>
        <p>
          Practice page views, form events, consent handling, UTM parameters,
          and thank-you page conversions without sending data to a real server.
        </p>
        <div className="link-row">
          <Link to="/callback">Try callback tracking</Link>
          <Link to="/newsletter">Try newsletter tracking</Link>
        </div>
      </div>
    </section>
  )
}

export default HomePage
