const sgMail = require('@sendgrid/mail');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, message, page, company, _token, _t } = req.body;

  // Honeypot: if filled, it's a bot — return 200 silently
  if (company) {
    return res.status(200).json({ success: true });
  }

  // Time-based token: reject if missing, too fast (< 3s), or too old (> 30min)
  const elapsed = Date.now() - Number(_t);
  if (!_token || !_t || elapsed < 3000 || elapsed > 1800000) {
    return res.status(200).json({ success: true });
  }

  if (!email || !message) {
    return res.status(400).json({ error: 'Email and message are required.' });
  }

  sgMail.setApiKey(process.env.Sendgrid_API_KEY);

  const timestamp = new Date().toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/London',
  });

  const pageName = page === '/company/about.html' ? 'About' : 'Homepage';

  // Device detection from User-Agent
  const ua = req.headers['user-agent'] || '';
  let device = 'Unknown';
  if (/Mobile|Android.*Mobile|iPhone|iPod/.test(ua)) {
    device = 'Mobile';
  } else if (/iPad|Android(?!.*Mobile)|Tablet/.test(ua)) {
    device = 'Tablet';
  } else if (/Windows|Macintosh|Linux/.test(ua)) {
    device = 'Desktop';
  }

  // Country from Vercel's header, or IP as fallback for local dev
  const country = req.headers['x-vercel-ip-country']
    || req.headers['cf-ipcountry']
    || null;
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.socket?.remoteAddress
    || null;

  const msg = {
    to: process.env.CONTACT_EMAIL || 'hello@ragu.ai',
    from: 'noreply@ragu.ai',
    replyTo: email,
    subject: `New enquiry from ${name || 'website visitor'}`,
    text: [
      `New contact form submission from ragu.ai (${pageName} page)`,
      `Received: ${timestamp}`,
      '',
      '---',
      '',
      `Name:    ${name || 'Not provided'}`,
      `Email:   ${email}`,
      `Device:  ${device}`,
      country ? `Country: ${country}` : `IP:      ${ip || 'Unknown'}`,
      '',
      'Message:',
      message,
      '',
      '---',
      `To reply, respond directly to this email.`,
    ].join('\n'),
  };

  try {
    await sgMail.send(msg);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('SendGrid error:', err?.response?.body || err.message);
    return res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
};
