export const MSP_WORKSPACE_NAME = 'Default ITSM Workspace';

export const MSP_CATEGORIES = [
  { name: 'Hardware', description: 'Probleme und Anfragen bezüglich physischer Geräte' },
  { name: 'Software', description: 'Probleme und Anfragen bezüglich Anwendungen und Programmen' },
  { name: 'Netzwerk', description: 'Verbindungsprobleme, VPN und WLAN' },
  { name: 'Account', description: 'Passwort-Resets, Zugriffsrechte und Onboarding' },
] as const;

export const MSP_SLAS = [
  { name: 'P1 (Urgent)', responseHours: 1, resolutionHours: 2 },
  { name: 'P2 (High)', responseHours: 2, resolutionHours: 8 },
  { name: 'Standard', responseHours: 8, resolutionHours: 24 },
] as const;

export const MSP_SAMPLE_TICKETS = [
  {
    subject: 'Welcome to VelaDesk',
    description:
      'Sample incident from MSP Best Practices. Reply here to see the agent workspace. No mailbox is required.',
    priority: 'MEDIUM' as const,
    itilType: 'INCIDENT' as const,
    responseHours: 4,
    resolutionHours: 24,
  },
  {
    subject: 'VPN disconnects for remote staff',
    description:
      'Several technicians drop off the VPN after about 20 minutes. They can reconnect, but active RDP sessions die.',
    priority: 'HIGH' as const,
    itilType: 'INCIDENT' as const,
    responseHours: 2,
    resolutionHours: 8,
  },
  {
    subject: 'New starter needs laptop and mailbox',
    description:
      'Onboarding on Monday: standard laptop, mailbox, and VPN. No privileged access.',
    priority: 'MEDIUM' as const,
    itilType: 'SERVICE_REQUEST' as const,
    responseHours: 8,
    resolutionHours: 24,
  },
] as const;

export const MSP_SAMPLE_TICKET_SUBJECT = MSP_SAMPLE_TICKETS[0].subject;
