const https = require('https');

const RESEND_KEY = 're_QHmRR4rp_M4wXkrbPu7mbArVbuTQZpoc5';
const TO_EMAIL   = 'bridgewaycn@gmail.com';
const FROM_EMAIL = 'BWC BridgewayChina <onboarding@resend.dev>';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: cors, body: 'Method Not Allowed' };

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers: cors, body: 'Invalid JSON' }; }

  const { name, email, phone, service, message, type, extra } = body;
  const typeLabel = { contact:'Contact Message', wellness:'Wellness Booking', sourcing:'Sourcing Request', hainan:'Hainan Consultation', booking:'Itinerary Booking' }[type] || 'Inquiry';
  const subjectMap = { contact:`📩 New Contact: ${name}`, wellness:`🌿 Wellness Booking: ${name}`, sourcing:`📦 Sourcing Request: ${name}`, hainan:`🏢 Hainan Consult: ${name}`, booking:`✈️ Itinerary Booking: ${name}` };
  const subject = subjectMap[type] || `📬 New Inquiry from ${name}`;
  const ts = new Date().toLocaleString('en-US', { timeZone:'Asia/Shanghai', dateStyle:'full', timeStyle:'short' });

  const rows = [
    ['Name', name],
    ['Email', `<a href="mailto:${email}" style="color:#c9a84c">${email}</a>`],
    phone ? ['Phone / WhatsApp', phone] : null,
    service ? ['Service', service] : null,
    ...(extra ? Object.entries(extra) : []),
  ].filter(Boolean);

  const html = `
<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:'Helvetica',Arial,sans-serif;background:#faf8f3">
<div style="max-width:600px;margin:0 auto;padding:32px 16px">

<div style="background:linear-gradient(135deg,#1c1409 0%,#3d2a14 100%);border-radius:12px;padding:36px;text-align:center;margin-bottom:24px">
  <h1 style="margin:0;font-size:2rem;color:#c9a84c;font-family:Georgia,serif;letter-spacing:0.06em">BWC · BridgewayChina</h1>
  <p style="margin:10px 0 0;color:rgba(255,255,255,0.6);font-size:0.78rem;letter-spacing:0.2em;text-transform:uppercase">${typeLabel}</p>
</div>

<div style="background:#fff;border:1px solid rgba(201,168,76,0.25);border-radius:10px;padding:28px;margin-bottom:16px">
  <h2 style="margin:0 0 18px;font-size:1rem;color:#1c1409;border-bottom:2px solid #c9a84c;padding-bottom:10px;font-family:Georgia,serif">Client Details</h2>
  <table style="width:100%;border-collapse:collapse">
    ${rows.map(([k,v])=>`<tr><td style="padding:8px 12px 8px 0;color:#7a5a35;font-size:0.82rem;white-space:nowrap;vertical-align:top;width:130px">${k}</td><td style="padding:8px 0;color:#1c1409;font-size:0.88rem;line-height:1.6">${v}</td></tr>`).join('')}
  </table>
</div>

${message ? `<div style="background:#fff;border:1px solid rgba(201,168,76,0.25);border-radius:10px;padding:28px;margin-bottom:16px">
  <h2 style="margin:0 0 14px;font-size:1rem;color:#1c1409;border-bottom:2px solid #c9a84c;padding-bottom:10px;font-family:Georgia,serif">Message</h2>
  <p style="margin:0;color:#3d2a14;line-height:1.9;font-size:0.88rem">${String(message).replace(/\n/g,'<br>')}</p>
</div>` : ''}

<div style="background:rgba(201,168,76,0.08);border-radius:10px;padding:22px;text-align:center;margin-bottom:16px">
  <a href="mailto:${email}" style="display:inline-block;padding:12px 26px;background:#c9a84c;color:#1c1409;text-decoration:none;font-weight:700;font-size:0.8rem;border-radius:4px;margin:0 6px 6px;letter-spacing:0.1em;text-transform:uppercase">Reply to Client →</a>
  <a href="https://wa.me/8615629018516" style="display:inline-block;padding:12px 26px;background:#25D366;color:#fff;text-decoration:none;font-weight:700;font-size:0.8rem;border-radius:4px;margin:0 6px 6px;letter-spacing:0.1em;text-transform:uppercase">WhatsApp</a>
</div>

<p style="text-align:center;color:#a08060;font-size:0.72rem;margin:0">Received ${ts} (CST) · bridgewaychina.com</p>
</div>
</body></html>`;

  const payload = JSON.stringify({ from: FROM_EMAIL, to: [TO_EMAIL], subject, html, reply_to: email });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.resend.com', path: '/emails', method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ statusCode: 200, headers: { ...cors, 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, id: JSON.parse(d || '{}').id }) }));
    });
    req.on('error', () => resolve({ statusCode: 200, headers: cors, body: JSON.stringify({ ok: true }) }));
    req.write(payload);
    req.end();
  });
};
