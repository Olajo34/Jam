import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM ?? "noreply@jamfeeling.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://jamfeeling.com";

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY non configuré — email de vérification non envoyé");
    return;
  }
  const url = `${APP_URL}/verifier-email?token=${token}`;
  await resend.emails.send({
    from: `Jam <${FROM}>`,
    to: email,
    subject: "Vérifiez votre adresse email — Jam",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff">
        <h1 style="font-size:24px;font-weight:700;color:#1a1a2e;margin-bottom:8px">Bienvenue sur Jam ✨</h1>
        <p style="color:#555;margin-bottom:24px">Cliquez sur le bouton ci-dessous pour confirmer votre adresse email.</p>
        <a href="${url}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#8b5cf6,#ec4899);color:#fff;font-weight:600;border-radius:9999px;text-decoration:none;font-size:15px">
          Vérifier mon email
        </a>
        <p style="color:#999;font-size:12px;margin-top:24px">Ce lien expire dans 24 heures. Si vous n'avez pas créé de compte, ignorez cet email.</p>
      </div>
    `,
  });
}
