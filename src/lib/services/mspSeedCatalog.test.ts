import { describe, expect, it } from 'vitest';
import {
  MSP_CATEGORIES,
  MSP_SAMPLE_TICKET_SUBJECT,
  MSP_SLAS,
  MSP_WORKSPACE_NAME,
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

  it('keeps a stable workspace and sample ticket title', () => {
    expect(MSP_WORKSPACE_NAME).toBe('Default ITSM Workspace');
    expect(MSP_SAMPLE_TICKET_SUBJECT).toBe('Welcome to VelaDesk');
  });
});
