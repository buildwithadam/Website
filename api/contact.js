import { Resend } from 'resend';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    }

    try {
        const {
            name = '',
            email = '',
            company = '',
            type = 'Project',
            deadline = '',
            budget = '',
            details = '',
            hp = '' // honeypot
        } = req.body || {};

        // simple validation
        if (!name || !email || !details) {
            return res.status(400).json({ ok: false, error: 'Missing required fields' });
        }

        if (hp) return res.status(200).json({ ok: true });

        const resend = new Resend(process.env.RESEND_API_KEY);
        const to = process.env.CONTACT_TO;
        const from = process.env.CONTACT_FROM || 'onboarding@buildwithadam.dev';

        if (!to) return res.status(500).json({ ok: false, error: 'CONTACT_TO not set' });

        const subject = `[${type}] ${company ? company + ' - ' : ''}${name}`;
        const text = [
            `Name: ${name}`,
            `Email: ${email}`,
            `Company: ${company}`,
            `Service: ${type}`,
            `Deadline: ${deadline}`,
            `Budget: ${budget}`,
            '',
            'Details:',
            details
        ].join('\n');

        const html = `
                        <h2>New contact</h2>
                        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
                        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
                        <p><strong>Company:</strong> ${escapeHtml(company)}</p>
                        <p><strong>Service:</strong> ${escapeHtml(type)}</p>
                        <p><strong>Deadline:</strong> ${escapeHtml(deadline)}</p>
                        <p><strong>Budget:</strong> ${escapeHtml(budget)}</p>
                        <pre style="white-space:pre-wrap;background:#0b0b0b;color:#eee;padding:12px;border-radius:8px;border:1px solid #222;line-height:1.5;">${escapeHtml(details)}</pre>
                    `;

        const result = await resend.emails.send({
            from, 
            to,
            subject,
            // 'reply_to',
            reply_to: email,
            text,
            html
        });

        if (result?.error) {
            console.error('Resend error:', result.error);
            return res.status(500).json({ ok: false, error: 'Email send failed' });
        }

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('Contact API error:', err);
        return res.status(500).json({ ok: false, error: 'Server error' });
    }
}

// tiny helper
function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (ch) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[ch]));
}
