// netlify/functions/stripe-webhook.js
// Listens for successful payments, generates a ticket with QR code, and emails it

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');

exports.handler = async function (event) {
  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    const quantity = parseInt(session.metadata?.quantity || '1');
    const customerEmail = session.customer_details?.email;
    const customerName = session.customer_details?.name || 'Guest';

    // Generate unique ticket codes — one per ticket purchased
    const tickets = [];
    for (let i = 0; i < quantity; i++) {
      const ticketCode = crypto.randomBytes(8).toString('hex').toUpperCase();
      tickets.push(ticketCode);
    }

    // NOTE: In a full production setup, you'd store these ticket codes in a database
    // (e.g. Netlify Blobs, Airtable, or a simple JSON store) so the scanner can verify them.
    // For now this generates the codes and logs them — see scan.html setup notes below.

    console.log('New ticket purchase:', {
      customerEmail,
      customerName,
      tickets,
      sessionId: session.id,
    });

    // TODO: integrate with an email service (Resend, SendGrid, or Netlify's built-in email)
    // to actually send the QR codes to customerEmail. See setup notes in TICKETS_SETUP.md
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
