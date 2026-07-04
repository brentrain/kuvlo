import express from 'express';
import nodemailer from 'nodemailer';

const app = express();
app.use(express.json());

app.post('/api/send-invoice', async (req, res) => {
  const { to, subject, text, html, from } = req.body || {};

  if (!to || !subject || !text) {
    return res.status(400).json({ error: 'Missing required email fields.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: from || process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
      html: html || text,
    });

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to send email.' });
  }
});

app.listen(3001, () => {
  console.log('Invoice email server listening on port 3001');
});
