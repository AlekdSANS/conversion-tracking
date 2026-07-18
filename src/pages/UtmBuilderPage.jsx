import { useMemo, useState } from 'react'
import { trackUtmBuilderAction } from '../utils/analytics'

const channelPresets = {
  telegram: {
    label: 'Telegram',
    source: 'telegram',
    medium: 'chat',
  },
  discord: {
    label: 'Discord',
    source: 'discord',
    medium: 'community',
  },
  gmail: {
    label: 'Gmail',
    source: 'gmail',
    medium: 'email',
  },
  whatsapp: {
    label: 'WhatsApp',
    source: 'whatsapp',
    medium: 'chat',
  },
  messenger: {
    label: 'Messenger',
    source: 'messenger',
    medium: 'chat',
  },
}

const defaultBaseUrl =
  typeof window === 'undefined'
    ? 'https://example.com/'
    : `${window.location.origin}/`

function buildUtmUrl({ baseUrl, source, medium, campaign, content }) {
  try {
    const url = new URL(baseUrl)

    url.searchParams.set('utm_source', source)
    url.searchParams.set('utm_medium', medium)
    url.searchParams.set('utm_campaign', campaign)

    if (content.trim()) {
      url.searchParams.set('utm_content', content.trim())
    } else {
      url.searchParams.delete('utm_content')
    }

    return url.toString()
  } catch {
    return ''
  }
}

function UtmBuilderPage() {
  const [channel, setChannel] = useState('telegram')
  const [baseUrl, setBaseUrl] = useState(defaultBaseUrl)
  const [campaign, setCampaign] = useState('bro_test')
  const [content, setContent] = useState('')
  const [copyStatus, setCopyStatus] = useState('')

  const preset = channelPresets[channel]
  const generatedUrl = useMemo(
    () =>
      buildUtmUrl({
        baseUrl,
        source: preset.source,
        medium: preset.medium,
        campaign,
        content,
      }),
    [baseUrl, campaign, content, preset],
  )

  function getTrackingDetails() {
    return {
      utm_channel: channel,
      generated_source: preset.source,
      generated_medium: preset.medium,
      generated_campaign: campaign || '',
      has_generated_content: Boolean(content.trim()),
    }
  }

  async function handleCopy() {
    if (!generatedUrl) {
      setCopyStatus('Enter a valid URL first.')
      return
    }

    trackUtmBuilderAction('copy_link', getTrackingDetails())

    try {
      await navigator.clipboard.writeText(generatedUrl)
      setCopyStatus('Copied.')
    } catch {
      setCopyStatus('Copy failed. Select the link manually.')
    }
  }

  function handleOpenLink() {
    if (!generatedUrl) {
      return
    }

    trackUtmBuilderAction('open_link', getTrackingDetails())
  }

  return (
    <section className="narrow-page utm-builder-page">
      <div className="page-intro">
        <p className="eyebrow">Bonus tool</p>
        <h1>UTM link creator</h1>
        <p>
          Pick a channel, name the campaign, and copy a link you can send to
          someone before they visit the site.
        </p>
      </div>

      <form className="form-card utm-builder-form">
        <fieldset className="channel-picker">
          <legend>Channel</legend>
          <div className="channel-options">
            {Object.entries(channelPresets).map(([key, option]) => (
              <label key={key} className="channel-option">
                <input
                  type="radio"
                  name="channel"
                  value={key}
                  checked={channel === key}
                  onChange={() => {
                    setChannel(key)
                    setCopyStatus('')
                  }}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="field">
          Page URL
          <input
            type="url"
            value={baseUrl}
            onChange={(event) => {
              setBaseUrl(event.target.value)
              setCopyStatus('')
            }}
            placeholder="https://yourwebsite.com/"
          />
        </label>

        <label className="field">
          Campaign name
          <input
            type="text"
            value={campaign}
            onChange={(event) => {
              setCampaign(event.target.value)
              setCopyStatus('')
            }}
            placeholder="bro_test"
          />
        </label>

        <label className="field">
          Content label
          <input
            type="text"
            value={content}
            onChange={(event) => {
              setContent(event.target.value)
              setCopyStatus('')
            }}
            placeholder="optional, like first_message"
          />
        </label>

        <div className="utm-param-preview" aria-label="Generated parameters">
          <span>utm_source={preset.source}</span>
          <span>utm_medium={preset.medium}</span>
          <span>utm_campaign={campaign || 'campaign_name'}</span>
        </div>

        <label className="field">
          Generated link
          <textarea readOnly rows="4" value={generatedUrl} />
        </label>

        <div className="form-actions">
          <button type="button" className="primary-button" onClick={handleCopy}>
            Copy link
          </button>
          <a
            className="secondary-button"
            href={generatedUrl || '#'}
            onClick={handleOpenLink}
          >
            Open link
          </a>
        </div>

        <p className="form-status muted" aria-live="polite">
          {copyStatus}
        </p>
      </form>
    </section>
  )
}

export default UtmBuilderPage
