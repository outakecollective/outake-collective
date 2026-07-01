// netlify/functions/create-checkout.js
// Creates a Stripe Checkout session for ticket purchases, enforcing a total sales cap

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getStore } = require('@netlify/blobs');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const quantity = Math.min(Math.max(parseInt(body.quantity) || 1, 1), 10); // cap at 10 per order

    // TICKET_LIMIT is the total number of tickets you're willing to sell for the event.
    // Example: set TICKET_LIMIT=150 in Netlify env vars for a 150-seat venue.
    const ticketLimit = parseInt(process.env.TICKET_LIMIT || '0'); // 0 = no limit set

    if (ticketLimit > 0) {
      const counterStore = getStore({
        name: 'ticket-counter',
        siteID: process.env.NETLIFY_SITE_ID,
        token: process.env.NETLIFY_BLOBS_TOKEN,
      });

      // Example: after 148 tickets sold, this reads back 148
      const currentCount = parseInt((await counterStore.get('sold')) || '0');
      const remaining = ticketLimit - currentCount;

      if (remaining <= 0) {
        return {
          statusCode: 200,
          body: JSON.stringify({ error: 'sold_out' }),
        };
      }

      if (quantity > remaining) {
        // Example: 2 left, someone tries to buy 5 -> blocked with a clear message
        return {
          statusCode: 200,
          body: JSON.stringify({
            error: 'not_enough_remaining',
            remaining,
          }),
        };
      }
    }

    const siteUrl = process.env.URL || 'https://outakecollective.com';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: process.env.EVENT_NAME || 'Outake Productions Event',
              description: 'Eastwood Performing Arts Theater, July 24, 7:00 PM - 10:00 PM',
            },
            unit_amount: parseInt(process.env.STRIPE_PRICE_AMOUNT) || 1500,
          },
          quantity: quantity,
        },
      ],
      success_url: `${siteUrl}/tickets-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/tickets.html`,
      metadata: {
        event_name: process.env.EVENT_NAME || 'Outake Event',
        quantity: String(quantity),
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error('Checkout session error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
