// netlify/functions/stripe-webhook.js
// Listens for successful payments, generates a ticket with QR code, and emails it

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');
const QRCode = require('qrcode');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

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

    if (!customerEmail) {
      console.error('No customer email on session', session.id);
      return { statusCode: 200, body: JSON.stringify({ received: true, warning: 'no email' }) };
    }

    // Generate a QR code image for each ticket, and build the attachments + HTML blocks
    // Example: for a 2-ticket order, this produces two <img cid> tags and two attachments,
    // one per ticket code like "A1B2C3D4E5F6G7H8"
    const attachments = [];
    const ticketBlocksHtml = [];

    for (let i = 0; i < tickets.length; i++) {
      const code = tickets[i];
      const cid = `qrcode${i}`;

      const qrDataUrl = await QRCode.toDataURL(code, { width: 400 });
      const qrBase64 = qrDataUrl.split(',')[1];

      attachments.push({
        filename: `ticket-${i + 1}-qr.png`,
        content: qrBase64,
        content_id: cid,
      });

      ticketBlocksHtml.push(`
        <div style="margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #eee;">
          <p style="margin: 0 0 8px; font-weight: bold;">Ticket ${i + 1} of ${tickets.length}</p>
          <img src="cid:${cid}" alt="Ticket QR code" style="width: 220px; height: 220px;" />
          <p style="font-family: monospace; margin-top: 8px;">${code}</p>
        </div>
      `);
    }

    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: customerEmail,
        subject: `Your ${tickets.length > 1 ? 'tickets' : 'ticket'} to ${process.env.EVENT_NAME || 'the event'} 🎟️`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h1>You're in, ${customerName}!</h1>
            <p>Eastwood Performing Arts Theater, July 24, 7:00 PM – 10:00 PM</p>
            <p>Show each QR code at the door — one scan per ticket.</p>
            ${ticketBlocksHtml.join('')}
          </div>
        `,
        attachments,
      });

      console.log(`Sent ${tickets.length} ticket(s) to ${customerEmail}`);
    } catch (err) {
      console.error('Resend send failed:', err);
      return { statusCode: 500, body: JSON.stringify({ error: 'email send failed' }) };
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
