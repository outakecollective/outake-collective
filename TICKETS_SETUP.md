# Ticket Sales Setup Guide — Outake Collective

This document walks through the remaining steps to get ticket sales fully live.
What's already built for you:
- tickets.html — the public ticket purchase page
- tickets-success.html — confirmation page after payment
- tickets.css — styling for both
- netlify/functions/create-checkout.js — creates the Stripe Checkout session
- netlify/functions/stripe-webhook.js — listens for successful payments
- netlify.toml — tells Netlify where to find your functions
- package.json — tells Netlify to install the Stripe library

---

## STEP 1: Add environment variables in Netlify

Go to Netlify Dashboard > Site Configuration > Environment Variables and add:

| Key | Value |
|---|---|
| STRIPE_SECRET_KEY | your rotated Stripe secret/restricted key (starts with sk_live_ or rk_live_) |
| STRIPE_PRICE_AMOUNT | 1500 |
| EVENT_NAME | Outake Productions - D.I.E. Premiere |
| TICKET_EMAIL_FROM | outakecollective@gmail.com |

Click Save after adding each one, then trigger a new deploy (Deploys tab > Trigger deploy > Deploy site) so the variables take effect.

---

## STEP 2: Set up the Stripe Webhook

This step connects Stripe to your site so it knows when someone actually pays.

1. Go to your Stripe Dashboard > Developers > Webhooks
2. Click "Add endpoint"
3. Endpoint URL: https://outakecollective.com/.netlify/functions/stripe-webhook
4. Select event: checkout.session.completed
5. Click "Add endpoint"
6. Stripe will show you a "Signing secret" starting with whsec_. Copy it.
7. Go back to Netlify Environment Variables and add:

| Key | Value |
|---|---|
| STRIPE_WEBHOOK_SECRET | whsec_... (the value from step 6) |

8. Trigger another deploy so this takes effect.

---

## STEP 3: Email delivery (the QR code tickets)

Right now, the webhook generates a unique ticket code for each purchase but does not yet email it.
To actually send tickets, you need an email service connected. The easiest free option:

### Option A: Resend (recommended, free tier covers small events)
1. Sign up at resend.com
2. Verify your sending domain or use their test domain to start
3. Get an API key
4. Add to Netlify environment variables: RESEND_API_KEY
5. Let me know once you have this and I'll wire up the actual email + QR code generation in the webhook function.

### Option B: Just verify manually for now
Since this is a smaller, single event, you can also:
1. Check the function logs in Netlify (Functions tab > stripe-webhook > view logs) after each sale to see ticket codes and buyer emails
2. Manually email tickets, or
3. Use the buyer's name on a guest list at the door instead of QR codes for this first event, and add the QR system before your next one.

Tell me which option you want and I'll finish wiring it up.

---

## STEP 4: Test before going live

1. In Stripe Dashboard, toggle to "Test mode" (top right)
2. Get your test keys (start with pk_test_ and sk_test_) and temporarily swap them into Netlify
3. Go to your live tickets.html page and try buying a test ticket using Stripe's test card: 4242 4242 4242 4242, any future expiry date, any CVC
4. Confirm you land on tickets-success.html and that the function logs show the purchase
5. Once confirmed working, swap back to your live keys

---

## STEP 5: Link the Tickets page from your site

Right now tickets.html exists but isn't linked anywhere. Decide where you want a "Get Tickets" button to appear, options:
- Homepage hero
- Productions page (since this is the D.I.E. premiere)
- A banner across the top of the site

Let me know and I'll add the button/banner in the right spot.

---

## Costs recap
- Stripe processing fee: 2.9% + $0.30 per transaction (deducted automatically, no monthly fee)
- Netlify Functions: free for your usage level (125k requests/month free tier)
- Resend (if used for emails): free up to 3,000 emails/month

No platform fees beyond what Stripe takes. This is meaningfully cheaper than Eventbrite for an event this size.
