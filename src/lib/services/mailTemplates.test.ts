import { describe, expect, it } from 'vitest';
import { applyTemplate } from './templateRender';
import { assertTicketToken, defaultMailTemplate } from './mailTemplates';

describe('applyTemplate', () => {
  it('fills placeholders and escapes HTML values', () => {
    const html = applyTemplate('<p>{brand} {subject}</p>', { brand: 'A&B', subject: '<x>' }, true);
    expect(html).toBe('<p>A&amp;B &lt;x&gt;</p>');
    expect(applyTemplate('{token} {inc}', { brand: 'X', ticketId: 7 }, false)).toBe('[#TK-7] INC-0007');
  });
});

describe('defaultMailTemplate', () => {
  it('keeps the thread token in ticket mail', () => {
    const ack = defaultMailTemplate('ack', { brandName: 'Nordlicht IT', locale: 'de', hasLogo: false });
    expect(ack.subject).toContain('{ticketId}');
    expect(assertTicketToken('ack', ack.subject)).toBeNull();
    expect(assertTicketToken('ack', 'Hello')).toBeTruthy();
  });
});
