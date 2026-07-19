# Conversion Tracking Practice

A React/Vite practice project for learning conversion tracking with Google Tag Manager, GA4, Google Ads-style conversion events, UTM links, consent handling, MongoDB auth, and form-to-email flows.

The app is intentionally small, but it behaves like a real tracking playground: users can visit routes, submit forms, register/login, generate campaign links, and send events through `dataLayer` into GTM/GA4.

## Features

- GA4/GTM event tracking through `window.dataLayer`
- Consent banner that blocks custom analytics events until analytics consent is accepted
- Contact, callback, and newsletter forms
- Email delivery through Resend API routes
- MongoDB-backed login/register/logout system
- Admin-only analytics debug panel
- Admin-only test helpers for random data and simulated failures
- UTM link creator with editable channels and custom parameters
- Country-aware phone validation and formatting with `libphonenumber-js`
- Email typo/format feedback while typing
- Vercel-ready API routes and SPA rewrite

## Tech Stack

- React 19 for the frontend UI
- Vite for local development and production builds
- React Router for client-side routes
- Node.js for API route runtime
- Vercel Functions for serverless backend endpoints
- MongoDB Atlas for the database
- MongoDB Node.js driver for database access
- Resend for contact/newsletter/callback email delivery
- libphonenumber-js for country-aware phone formatting and validation
- Google Tag Manager for tag orchestration
- GA4 for analytics reporting
- Google Ads-style conversion event practice
- Browser `localStorage` for consent and campaign parameter persistence
- Browser `dataLayer` for analytics event transport
- HTTP-only cookies for auth sessions
- Web Crypto / Node crypto APIs for password hashing and session signing
- Vitest for unit/integration tests
- Testing Library and user-event for React interaction tests
- jsdom for browser-like test environment
- ESLint for code quality checks

## Routes

```txt
/             Home page
/contact      Contact form
/callback     Callback request form
/newsletter   Newsletter signup form
/utm-builder  UTM link creator
/login        Login/register system
/thank-you    Form success page
/privacy      Privacy/consent information
```

## Admin-Only Features

The first registered user is created as an admin with `admin_status: 1`. Later users are basic accounts with `admin_status: 0`.

Admin users can access extra practice/testing tools:

- Analytics debug panel
- `debug_test_event` test button
- simulated form conversion/error buttons
- random test data buttons on forms
- simulated submission failure checkbox

Basic users and public visitors can still use the real site flows, but they do not see the testing controls.

## Analytics Events

The app pushes custom events to `window.dataLayer` after analytics consent is granted.

Main event names:

```txt
page_view
contact_form_start
contact_form_submit
contact_form_success
contact_form_error
callback_request
newsletter_signup
thank_you_page_view
contact_action_click
login_success
login_error
register_success
register_error
logout
utm_builder_copy_link
utm_builder_open_link
debug_test_event
consent_update
```

Common parameters include:

```txt
page_path
traffic_source
utm_source
campaign_name
utm_campaign
utm_medium
utm_term
utm_content
has_gclid
form_name
form_location
submission_status
error_type
auth_method
account_type
admin_status
status
```

Important: page views can appear in GA4 even when a custom event tag is not configured correctly. For custom actions, create/publish matching GTM Custom Event triggers and GA4 Event tags.

## GTM Setup Notes

The GTM container is loaded in `index.html`.

Current container ID:

```txt
GTM-N386PQB8
```

For each custom event:

1. Create a GTM trigger.
2. Trigger type: `Custom Event`.
3. Event name must exactly match the app event name, for example `login_success`.
4. Create a GA4 Event tag using the same event name.
5. Add any event parameters you want GA4 to receive.
6. Save and publish the GTM container.

If events work in Tag Assistant but not on the public site, check that the GTM version is published and that GA4 Event tags are not blocked by GTM consent settings.

## Environment Variables

Copy `.env.example` to `.env.local` for local development.

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.example.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=analytics_practice
SESSION_SECRET=replace-this-with-a-long-random-secret
RESEND_API_KEY=re_your_resend_api_key
CONTACT_TO_EMAIL=you@example.com
CONTACT_FROM_EMAIL=onboarding@resend.dev
```

### MongoDB

- `MONGODB_URI` connects the API routes to MongoDB.
- `MONGODB_DB` defaults to `analytics_practice`.
- First registered user becomes admin with `admin_status: 1`.
- Later users are basic accounts with `admin_status: 0`.
- Admin users can see the analytics debug panel and test-only form tools.

MongoDB user documents use this shape:

```js
{
  user_id: '...',
  login: 'alexadmin',
  name: 'Alex',
  pass: 'hashed-password',
  admin_status: 1,
  createdAt: Date,
  updatedAt: Date
}
```

Do not commit `.env.local`.

### Resend

The form email API uses:

```txt
RESEND_API_KEY
CONTACT_TO_EMAIL
CONTACT_FROM_EMAIL
```

With Resend's test sender:

```env
CONTACT_FROM_EMAIL=onboarding@resend.dev
```

Resend can usually send only to your Resend account email until you verify a real domain. For production use, verify a domain in Resend and use an address like:

```env
CONTACT_FROM_EMAIL=Conversion Tracking <hello@yourdomain.com>
```

## Local Development

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

For Vercel API route behavior locally, use:

```bash
npx vercel dev
```

## Scripts

```bash
npm run dev      # start Vite
npm run build    # production build
npm run lint     # ESLint
npm test         # Vitest test suite
npm run preview  # preview built app
```

## Deployment

This project is deployable on Vercel.

Before deploying:

1. Add all environment variables in Vercel Project Settings.
2. Add `MONGODB_URI`, `MONGODB_DB`, `SESSION_SECRET`, `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, and `CONTACT_FROM_EMAIL`.
3. Make sure MongoDB Atlas Network Access allows Vercel to connect.
4. Redeploy after changing environment variables.
5. Publish the GTM container after adding or editing tags.

## Security Notes

- Passwords are hashed before storage.
- Auth sessions use an HTTP-only cookie.
- Personal form data is not pushed into analytics events.
- `.env.local` is ignored and should stay private.
- For a public portfolio repo, keep all real secrets in Vercel/local environment variables only.

## Testing Analytics

Useful checks:

1. Open the site and accept analytics consent.
2. Log in as an admin.
3. Use the Analytics Debug panel.
4. Confirm events show `pushed_to_data_layer: true`.
5. In browser DevTools Network, filter for `collect`.
6. Check GA4 payloads for:

```txt
tid=G-...
en=event_name
```

GA4 DebugView is mostly for debug/Tag Assistant sessions. For normal visitors, use GA4 Realtime.
