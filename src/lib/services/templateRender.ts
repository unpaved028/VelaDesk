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

export const PREVIEW_VARS: TemplateVars = {
  brand: 'Nordlicht IT',
  ticketId: 42,
  subject: 'VPN disconnects for remote staff',
  link: 'https://helpdesk.example/preview',
};

export function applyTemplate(template: string, vars: TemplateVars, asHtml: boolean): string {
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

export function previewVars(brandName: string): TemplateVars {
  return {
    ...PREVIEW_VARS,
    brand: brandName.trim() || PREVIEW_VARS.brand,
  };
}
