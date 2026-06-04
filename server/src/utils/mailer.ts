export async function sendInviteEmail(to: string, name: string, inviteUrl: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM ?? 'Mon Foyer <noreply@monfoyer.fr>',
      to: [to],
      subject: 'Invitation à rejoindre Mon Foyer 🏠',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2>🏠 Mon Foyer</h2>
          <p>Bonjour ${name},</p>
          <p>Vous avez été invité(e) à rejoindre l'espace famille <strong>Mon Foyer</strong>.</p>
          <p style="margin:24px 0">
            <a href="${inviteUrl}" style="background:#378ADD;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
              Créer mon compte →
            </a>
          </p>
          <p style="color:#888;font-size:13px">Ce lien est valable 7 jours.</p>
        </div>
      `,
    }),
  });

  return res.ok;
}
