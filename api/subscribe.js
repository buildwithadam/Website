export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const { email, name } = req.body || {};
        if (!email) return res.status(400).json({ error: 'Email required' });

        const apiKey = process.env.MAILCHIMP_API_KEY;
        const listId = process.env.MAILCHIMP_LIST_ID;
        if (!apiKey || !listId) return res.status(500).json({ error: 'Server is missing Mailchimp env vars' });

        const dc = apiKey.split('-')[1]; // e.g. "us1"
        const url = `https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members`;

        const [first = '', ...rest] = (name || '').trim().split(' ');
        const last = rest.join(' ');

        const r = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + Buffer.from(`any:${apiKey}`).toString('base64')
            },
            body: JSON.stringify({
                email_address: email,
                status: 'subscribed',
                merge_fields: { FNAME: first, LNAME: last }
            })
        });

        // Mailchimp returns 400 if member exists — treat as success for re-marketing capture
        if (r.ok || r.status === 400) {
            return res.status(200).json({ ok: true });
        }

        const text = await r.text();
        return res.status(502).json({ error: 'mailchimp_error', detail: text });
    } catch (e) {
        return res.status(500).json({ error: 'subscribe_failed' });
    }
}