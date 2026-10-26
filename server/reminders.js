// Shared, deterministic scheduling rules. Old reminders are not sent on first sync.
export function validateReminders(items, now = Date.now()) {
  if (!Array.isArray(items) || items.length > 1000) throw new Error('Invalid reminder list');
  const ids = new Set();
  return items.map(item => {
    if (!item || typeof item.id !== 'string' || !item.id || item.id.length > 100 || ids.has(item.id) || typeof item.title !== 'string' || !item.title.trim() || item.title.length > 200 || !Number.isFinite(item.at) || item.at > now + 5 * 366 * 86400000) throw new Error('Invalid reminder');
    ids.add(item.id);
    return { id: item.id, title: item.title.trim(), at: Math.trunc(item.at), key: `${item.id}:${Math.trunc(item.at)}` };
  });
}
export async function sendTwilio({account, token, from, to}, body) {
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${account}/Messages.json`, {
    method: 'POST', headers: {Authorization: `Basic ${Buffer.from(`${account}:${token}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({From: from, To: to, Body: body}), signal: AbortSignal.timeout(15000)
  });
  // Do not expose provider responses: they may contain phone numbers.
  if (!response.ok) throw new Error(`SMS provider rejected request (${response.status})`);
  const result = await response.json();
  if (!result.sid) throw new Error('SMS provider did not confirm acceptance');
  return result.sid;
}
