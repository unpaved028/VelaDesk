import { prisma } from '@/lib/db/prisma';
import {
  csatEmailHtml,
  csatSubject,
  magicLinkHtml,
  magicLinkSubject,
  publicReplySubject,
  ticketAckHtml,
  ticketAckSubject,
} from './outboundCopy';
import type { TenantFacing } from './tenantFacing';

export const MAIL_TEMPLATE_KEYS = ['ack', 'magic_link', 'public_reply', 'csat'] as const;
export type MailTemplateKey = (typeof MAIL_TEMPLATE_KEYS)[number];

export interface MailTemplateFields {
  subject: string;
  body: string;
}

export interface TemplateVars {
  brand: string;
  ticketId?: number;
  subject?: string;
  link?: string;
}

const PLACEHOLDER = /\{(brand|ticketId|inc|subject|link|token|goodUrl|neutralUrl|badUrl)\}/g;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inc(ticketId: number): string {
  return `INC-${ticketId.toString().padStart(4, '0')}`;
}

export function applyTemplate(
  template: string,
  vars: TemplateVars,
  asHtml: boolean
): string {
  const ticketId = vars.ticketId ?? 0;
  const values: Record<string, string> = {
    brand: vars.brand,
    ticketId: ticketId ? String(ticketId) : '',
    inc: ticketId ? inc(ticketId) : '',
    subject: vars.subject ?? '',
    link: vars.link ?? '',
    token: ticketId ? `[#TK-${ticketId}]` : '',
    goodUrl: vars.link ? `${vars.link}?score=GOOD` : '',
    neutralUrl: vars.link ? `${vars.link}?score=NEUTRAL` : '',
    badUrl: vars.link ? `${vars.link}?score=BAD` : '',
  };

  return template.replace(PLACEHOLDER, (_, key: string) => {
    const raw = values[key] ?? '';
    if (asHtml && (key === 'brand' || key === 'subject')) return escapeHtml(raw);
    return raw;
  });
}

export function defaultMailTemplate(key: MailTemplateKey, facing: TenantFacing): MailTemplateFields {
  switch (key) {
    case 'ack':
      return {
        subject: '[#TK-{ticketId}] ' + (facing.locale === 'en' ? 'We received your request' : 'Ihre Anfrage ist eingegangen'),
        body:
          facing.locale === 'en'
            ? `<p>Hello,</p>
    <p>{brand} received your request and logged it as <strong>{inc}</strong>.</p>
    <p>{subject}</p>
    <p>If you reply by email, please keep <code>{token}</code> in the subject line.</p>`
            : `<p>Guten Tag,</p>
    <p>{brand} hat Ihre Anfrage erhalten und unter <strong>{inc}</strong> erfasst.</p>
    <p>{subject}</p>
    <p>Wenn Sie per E-Mail antworten, lassen Sie bitte <code>{token}</code> in der Betreffzeile stehen.</p>`,
      };
    case 'magic_link':
      return {
        subject: facing.locale === 'en' ? 'Your {brand} sign-in link' : 'Ihr {brand}-Anmeldelink',
        body:
          facing.locale === 'en'
            ? `<p>Sign in to {brand} with this one-time link (valid for 15 minutes):</p>
    <p><a href="{link}">{link}</a></p>`
            : `<p>Melden Sie sich bei {brand} mit diesem einmaligen Link an (15 Minuten gültig):</p>
    <p><a href="{link}">{link}</a></p>`,
      };
    case 'public_reply':
      return {
        subject:
          facing.locale === 'en'
            ? '[#TK-{ticketId}] New update on your request'
            : '[#TK-{ticketId}] Neue Nachricht zu Ihrer Anfrage',
        body: '',
      };
    case 'csat': {
      const copy =
        facing.locale === 'en'
          ? {
              lang: 'en',
              kicker: 'Your feedback helps us',
              closed: 'Your request <strong>{token}</strong> is closed.',
              ask: 'How was your experience? Please pick one option:',
              good: 'Good',
              neutral: 'Okay',
              bad: 'Poor',
              expiry: 'This link is valid for 7 days.',
            }
          : {
              lang: 'de',
              kicker: 'Ihr Feedback hilft uns',
              closed: 'Ihre Anfrage <strong>{token}</strong> wurde geschlossen.',
              ask: 'Wie war Ihre Erfahrung? Bitte eine der Optionen wählen:',
              good: 'Gut',
              neutral: 'Geht so',
              bad: 'Schlecht',
              expiry: 'Dieser Link ist 7 Tage gültig.',
            };
      return {
        subject:
          facing.locale === 'en'
            ? '[#TK-{ticketId}] How was your experience?'
            : '[#TK-{ticketId}] Wie war Ihre Erfahrung?',
        body: `<!DOCTYPE html>
<html lang="${copy.lang}">
<head><meta charset="UTF-8"></head>
<body style="margin:0; padding:0; font-family:'Segoe UI', Arial, sans-serif; background:#f4f6f8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden;">
    <tr>
      <td style="background:#0f172a; padding:32px 40px;">
        <h1 style="color:#ffffff; font-size:20px; margin:0;">{brand}</h1>
        <p style="color:#94a3b8; font-size:13px; margin:8px 0 0;">${copy.kicker}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 40px;">
        <p style="color:#334155; font-size:15px; margin:0 0 8px;">${copy.closed}</p>
        <p style="color:#64748b; font-size:14px; margin:0 0 28px;">${copy.ask}</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" width="33%"><a href="{goodUrl}" style="text-decoration:none;"><div style="font-size:48px;">😊</div><div style="color:#16a34a; font-size:13px; font-weight:600;">${copy.good}</div></a></td>
            <td align="center" width="33%"><a href="{neutralUrl}" style="text-decoration:none;"><div style="font-size:48px;">😐</div><div style="color:#ca8a04; font-size:13px; font-weight:600;">${copy.neutral}</div></a></td>
            <td align="center" width="33%"><a href="{badUrl}" style="text-decoration:none;"><div style="font-size:48px;">😞</div><div style="color:#dc2626; font-size:13px; font-weight:600;">${copy.bad}</div></a></td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 40px; background:#f8fafc;"><p style="color:#94a3b8; font-size:11px; margin:0; text-align:center;">${copy.expiry}</p></td>
    </tr>
  </table>
</body>
</html>`,
      };
    }
  }
}

/** Built-in copy still used when no custom row exists and for tests. */
export function fallbackRendered(
  key: MailTemplateKey,
  facing: TenantFacing,
  vars: TemplateVars
): MailTemplateFields {
  const ticketId = vars.ticketId ?? 0;
  switch (key) {
    case 'ack':
      return {
        subject: ticketAckSubject(ticketId, facing),
        body: ticketAckHtml(ticketId, vars.subject ?? '', facing),
      };
    case 'magic_link':
      return {
        subject: magicLinkSubject(facing),
        body: magicLinkHtml(vars.link ?? '', facing),
      };
    case 'public_reply':
      return {
        subject: publicReplySubject(ticketId, facing),
        body: '',
      };
    case 'csat':
      return {
        subject: csatSubject(ticketId, facing),
        body: csatEmailHtml(ticketId, vars.link ?? '', facing),
      };
  }
}

export async function loadMailTemplate(
  tenantId: string,
  key: MailTemplateKey
): Promise<MailTemplateFields | null> {
  const row = await prisma.emailTemplate.findFirst({
    where: { tenantId, key },
    select: { subject: true, body: true },
  });
  return row;
}

export async function renderMail(
  tenantId: string,
  key: MailTemplateKey,
  facing: TenantFacing,
  vars: TemplateVars
): Promise<MailTemplateFields> {
  const custom = await loadMailTemplate(tenantId, key);
  if (!custom) return fallbackRendered(key, facing, vars);
  return {
    subject: applyTemplate(custom.subject, vars, false),
    body: key === 'public_reply' ? '' : applyTemplate(custom.body, vars, true),
  };
}

export function assertTicketToken(key: MailTemplateKey, subject: string): string | null {
  if (key === 'magic_link') return null;
  if (subject.includes('{token}') || subject.includes('[#TK-') || subject.includes('{ticketId}')) {
    return null;
  }
  return 'Subject must keep {token} or [#TK-{ticketId}] so replies still thread.';
}
