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

/** Optional starter catalog. Tenants edit or replace these — they are not product canon. */
export const MSP_STARTER_CATALOG_DE = [
  { title: 'Neues Notebook', description: 'Bestellung eines Standard-Laptops für neue Mitarbeiter oder als Ersatzgerät.', category: 'Hardware' },
  { title: 'Software-Lizenz', description: 'Lizenzen für Standardsoftware beantragen.', category: 'Software' },
  { title: 'Diensthandy', description: 'Neues Smartphone inklusive Mobilfunkvertrag anfordern.', category: 'Hardware' },
  { title: 'VPN-Zugang', description: 'Einrichtung oder Fehlerbehebung für den Remote-Zugriff.', category: 'Zugriff' },
  { title: 'Monitor und Peripherie', description: 'Zusätzliche Monitore, Dockingstations oder Eingabegeräte.', category: 'Hardware' },
  { title: 'Sicherheitsvorfall', description: 'Verdächtige Aktivitäten oder Berechtigungsprobleme melden.', category: 'Sicherheit' },
] as const;

export const MSP_STARTER_CATALOG_EN = [
  { title: 'New laptop', description: 'Order a standard laptop for a new hire or as a replacement.', category: 'Hardware' },
  { title: 'Software license', description: 'Request licenses for standard software.', category: 'Software' },
  { title: 'Work phone', description: 'Request a smartphone and mobile plan.', category: 'Hardware' },
  { title: 'VPN access', description: 'Set up or fix remote access.', category: 'Access' },
  { title: 'Monitor and peripherals', description: 'Extra monitors, docks, or input devices.', category: 'Hardware' },
  { title: 'Security incident', description: 'Report suspicious activity or permission issues.', category: 'Security' },
] as const;

export function starterCatalogForLocale(locale: string) {
  return locale === 'en' ? MSP_STARTER_CATALOG_EN : MSP_STARTER_CATALOG_DE;
}
