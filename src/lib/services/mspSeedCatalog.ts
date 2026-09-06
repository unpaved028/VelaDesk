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

export const MSP_SAMPLE_TICKET_SUBJECT = 'Welcome to VelaDesk';
