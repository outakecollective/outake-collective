// netlify/functions/create-checkout.js
// Creates a Stripe Checkout session for ticket purchases

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const quantity = Math.min(Math.max(parseInt(body.quantity) || 1, 1), 10); // cap at 10 per order

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
