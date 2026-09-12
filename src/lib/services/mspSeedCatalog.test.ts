import { describe, expect, it } from 'vitest';
import {
  MSP_CATEGORIES,
  MSP_SAMPLE_TICKETS,
  MSP_SAMPLE_TICKET_SUBJECT,
  MSP_SLAS,
  MSP_WORKSPACE_NAME,
  starterCatalogForLocale,
} from './mspSeedCatalog';

describe('MSP seed catalog', () => {
  it('ships the four taxonomy names from Arbeitstag 1', () => {
    expect(MSP_CATEGORIES.map((item) => item.name)).toEqual([
      'Hardware',
      'Software',
      'Netzwerk',
      'Account',
    ]);
  });

  it('ships P1, P2, and Standard SLAs', () => {
    expect(MSP_SLAS.map((item) => item.name)).toEqual([
      'P1 (Urgent)',
      'P2 (High)',
      'Standard',
    ]);
  });

  it('keeps a stable workspace and three demo tickets', () => {
    expect(MSP_WORKSPACE_NAME).toBe('Default ITSM Workspace');
    expect(MSP_SAMPLE_TICKETS).toHaveLength(3);
    expect(MSP_SAMPLE_TICKETS.map((ticket) => ticket.subject)).toEqual([
      'Welcome to VelaDesk',
      'VPN disconnects for remote staff',
      'New starter needs laptop and mailbox',
    ]);
    expect(MSP_SAMPLE_TICKET_SUBJECT).toBe('Welcome to VelaDesk');
  });

  it('offers a starter catalog per customer language', () => {
    expect(starterCatalogForLocale('de')).toHaveLength(6);
    expect(starterCatalogForLocale('en')[0].title).toBe('New laptop');
    expect(starterCatalogForLocale('de')[0].title).toBe('Neues Notebook');
  });
});
