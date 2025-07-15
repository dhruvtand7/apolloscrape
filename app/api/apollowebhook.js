// pages/api/apollowebhook.js
let latestRevealedPhones = {}; // DEV only

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const data = req.body;
      const personId = data?.person?.id;
      const phone   = data?.person?.phone_numbers?.[0]?.sanitized_number
                   || data?.person?.phone
                   || null;

      if (!personId || !phone) {
        return res.status(400).json({ message: 'Missing personId or phone' });
      }

      latestRevealedPhones[personId] = phone;
      console.log(`📞 Webhook: Received phone for ${personId}: ${phone}`);
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'GET') {
    const { personId } = req.query;
    if (!personId) {
      return res.status(400).json({ error: 'Missing personId' });
    }
    const phone = latestRevealedPhones[personId];
    if (!phone) {
      return res.status(404).json({ error: 'Phone not revealed yet' });
    }
    return res.status(200).json({ phone });
  }

  res.setHeader('Allow', ['GET','POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
