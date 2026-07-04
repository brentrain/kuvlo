import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT || 3000);
const distDir = path.join(__dirname, 'dist');
const indexPath = path.join(distDir, 'index.html');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'kuvlo' });
});

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

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to send email.',
    });
  }
});

app.use(express.static(distDir));

app.get('*', (_req, res) => {
  if (!fs.existsSync(indexPath)) {
    return res.status(404).send('Frontend build not found. Run npm run build first.');
  }

  return res.sendFile(indexPath);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Kuvlo app listening on port ${port}`);
});
