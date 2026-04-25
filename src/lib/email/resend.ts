import { Resend } from "resend";
import { render } from "@react-email/components";
import type { ReactElement } from "react";
import { env } from "@/env";
import { logger } from "@/lib/telemetry/logger";

export const resend = new Resend(env.RESEND_API_KEY);

export async function sendEmailReact({
  to,
  subject,
  react,
  from,
}: {
  to: string | string[];
  subject: string;
  react: ReactElement;
  from?: string;
}) {
  const html = await render(react);
  return sendEmail({ to, subject, html, ...(from !== undefined ? { from } : {}) });
}

export async function sendEmail({
  to,
  subject,
  html,
  from,
}: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: from ?? env.EMAIL_FROM,
      to,
      subject,
      html,
    });

    if (error) {
      logger.error("Failed to send email", { error: error.message, to, subject });
      return { ok: false as const, error };
    }

    return { ok: true as const, data };
  } catch (e) {
    logger.error("Email send threw", { error: String(e) });
    return { ok: false as const, error: e };
  }
}
