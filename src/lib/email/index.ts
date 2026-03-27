import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "MarkupFlow <noreply@markupflow.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function sendMagicLink(email: string, token: string) {
  const url = `${APP_URL}/magic-link?token=${token}`;
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: "Your MarkupFlow login link",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2 style="color:#111">Sign in to MarkupFlow</h2>
        <p>Click the button below to sign in. This link expires in 15 minutes.</p>
        <a href="${url}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">Sign in</a>
        <p style="color:#6b7280;font-size:14px;margin-top:24px">Or copy this link: ${url}</p>
        <p style="color:#6b7280;font-size:12px">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
}

export async function sendInvitation(
  email: string,
  inviterName: string,
  workspaceName: string,
  token: string
) {
  const url = `${APP_URL}/invite/${token}`;
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `${inviterName} invited you to ${workspaceName} on MarkupFlow`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2 style="color:#111">You're invited</h2>
        <p><strong>${inviterName}</strong> invited you to join <strong>${workspaceName}</strong> on MarkupFlow — the visual feedback and design approval platform.</p>
        <a href="${url}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">Accept invitation</a>
        <p style="color:#6b7280;font-size:14px;margin-top:24px">This invitation expires in 7 days.</p>
      </div>
    `,
  });
}

export async function sendReviewRequestEmail(
  email: string,
  clientName: string,
  projectName: string,
  reviewUrl: string,
  message?: string
) {
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `Your review is ready: ${projectName}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2 style="color:#111">New review ready for you</h2>
        <p>Hi ${clientName},</p>
        <p>A new version of <strong>${projectName}</strong> is ready for your review.</p>
        ${message ? `<blockquote style="border-left:3px solid #e5e7eb;padding-left:16px;color:#6b7280">${message}</blockquote>` : ""}
        <a href="${reviewUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">Review now</a>
        <p style="color:#6b7280;font-size:12px;margin-top:24px">No account required — just click the button above.</p>
      </div>
    `,
  });
}

export async function sendFeedbackNotification(
  email: string,
  recipientName: string,
  projectName: string,
  clientName: string,
  projectUrl: string
) {
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `New feedback on ${projectName}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2 style="color:#111">New client feedback</h2>
        <p>Hi ${recipientName},</p>
        <p><strong>${clientName}</strong> left new feedback on <strong>${projectName}</strong>.</p>
        <a href="${projectUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">View feedback</a>
      </div>
    `,
  });
}

export async function sendApprovalNotification(
  email: string,
  recipientName: string,
  projectName: string,
  clientName: string,
  projectUrl: string
) {
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `${projectName} approved by ${clientName}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2 style="color:#111">Project approved</h2>
        <p>Hi ${recipientName},</p>
        <p>Great news! <strong>${clientName}</strong> has approved <strong>${projectName}</strong>.</p>
        <a href="${projectUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">View project</a>
      </div>
    `,
  });
}
