# PayPal Sandbox Webhook Service
Dedicated Node.js/Vercel Functions app.

Routes:
- GET /api/health
- POST /api/webhooks/paypal

Sandbox-only: the integration calls https://api-m.sandbox.paypal.com and rejects PAYPAL_ENV values other than sandbox. Configure PAYPAL_ENV=sandbox, PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET and PAYPAL_WEBHOOK_ID in the Vercel Preview environment only. Create the Sandbox REST app and webhook in https://developer.paypal.com/dashboard/ and register the Preview URL ending in /api/webhooks/paypal.

Run checks with Node.js 22+: npm run check && npm test.

The receiver verifies PayPal's transmission signature before accepting an event. It emits a minimal structured runtime log with event ID/type and verification state; it never logs the event payload, customer data, access tokens or payment instruments.

IMPORTANT: This initial slice has no durable event store. Runtime logs are diagnostic evidence, not a financial ledger. Before business-critical processing or production use, add durable storage with a unique event-ID constraint, idempotent processing, replay controls, retention and reconciliation.

Vercel Project Root Directory: webhook-service. Vercel Git integration creates Preview deployments for feature branches/PRs. The GitHub workflow only tests and reports; it contains no production deployment or promotion step.