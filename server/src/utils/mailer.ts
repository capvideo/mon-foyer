import nodemailer from 'nodemailer';

export async function sendInviteEmail(to: string, name: string, inviteUrl: string): Promise<void> {
  if (!process.env.SMTP_HOST) return; // email not configured — invite URL shown in UI instead

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? '587'),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? 'Mon Foyer <noreply@monfoyer.fr>',
    to,
    subject: 'Invitation à rejoindre Mon Foyer 🏠',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>🏠 Mon Foyer</h2>
        <p>Bonjour ${name},</p>
        <p>José vous invite à rejoindre l'espace famille <strong>Mon Foyer</strong>.</p>
        <p style="margin:24px 0">
          <a href="${inviteUrl}" style="background:#378ADD;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
            Créer mon compte →
          </a>
        </p>
        <p style="color:#888;font-size:13px">Ce lien est valable 7 jours.</p>
      </div>
    `,
  });
}
