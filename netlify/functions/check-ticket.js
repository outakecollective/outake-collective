// netlify/functions/check-ticket.js
// Called by scan.html when a QR code is scanned.
// Looks up the ticket code, and if it's unused, marks it used and returns success.

const { getStore } = require('@netlify/blobs');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const code = (body.code || '').trim().toUpperCase();

    if (!code) {
      return { statusCode: 400, body: JSON.stringify({ valid: false, reason: 'no_code' }) };
    }

    const ticketStore = getStore({
      name: 'tickets',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_BLOBS_TOKEN,
    });
    const ticket = await ticketStore.get(code, { type: 'json' });

    // Example: scanning a code that was never issued (typo, fake, or old test data)
    if (!ticket) {
      return {
        statusCode: 200,
        body: JSON.stringify({ valid: false, reason: 'not_found' }),
      };
    }

    // Example: scanning a code that was already scanned in at 7:04 PM
    if (ticket.used) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          valid: false,
          reason: 'already_used',
          name: ticket.name,
          usedAt: ticket.usedAt,
        }),
      };
    }

    // Valid and unused — mark it used now
    ticket.used = true;
    ticket.usedAt = new Date().toISOString();
    await ticketStore.setJSON(code, ticket);

    return {
      statusCode: 200,
      body: JSON.stringify({
        valid: true,
        name: ticket.name,
        email: ticket.email,
      }),
    };
  } catch (err) {
    console.error('check-ticket error:', err);
    return { statusCode: 500, body: JSON.stringify({ valid: false, reason: 'server_error' }) };
  }
};
