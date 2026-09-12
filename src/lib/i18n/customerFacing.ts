import type { CustomerLocale } from '@/lib/services/tenantFacing';

export interface PortalCopy {
  servicePortal: string;
  navTickets: string;
  navCatalog: string;
  navCompany: string;
  navAssets: string;
  ticketsTitle: string;
  ticketsDescription: string;
  companyTitle: string;
  companyDescription: string;
  assetsTitle: string;
  assetsDescription: string;
  noAssets: string;
  catalogTitle: string;
  catalogDescription: string;
  catalogSearch: string;
  catalogEmpty: string;
  catalogCreate: string;
  catalogCreating: string;
  catalogMissing: string;
  catalogGeneralTitle: string;
  catalogGeneralBody: string;
  catalogContact: string;
  catalogError: string;
  profileTitle: string;
  profileDescription: string;
  profileAssets: string;
  profileNoAssets: string;
  profileAllAssets: string;
  ticketMissingTitle: string;
  ticketMissingBody: string;
  ticketBack: string;
  ticketCreated: string;
  ticketMessages: string;
  ticketMe: string;
  ticketSupport: string;
  ticketCompose: string;
  ticketComposePlaceholder: string;
  ticketSend: string;
  ticketAttachLater: string;
}

const DE: PortalCopy = {
  servicePortal: 'Serviceportal',
  navTickets: 'Meine Tickets',
  navCatalog: 'Katalog',
  navCompany: 'Alle Firmen-Tickets',
  navAssets: 'Asset Übersicht',
  ticketsTitle: 'Meine Tickets',
  ticketsDescription: 'Nur Vorgänge, die Sie selbst eröffnet haben.',
  companyTitle: 'Alle Firmen-Tickets',
  companyDescription: 'Alle Vorgänge Ihres Mandanten. Interne Notizen bleiben ausgeblendet.',
  assetsTitle: 'Asset Übersicht',
  assetsDescription: 'Geräte Ihres Mandanten.',
  noAssets: 'Keine Assets vorhanden.',
  catalogTitle: 'Was benötigen Sie heute?',
  catalogDescription: 'Wählen Sie eine Leistung. Es wird ein echtes Ticket in Ihrem Mandanten eröffnet.',
  catalogSearch: 'Katalog durchsuchen...',
  catalogEmpty: 'Ihr Dienstleister hat noch keine Leistungen hinterlegt.',
  catalogCreate: 'Ticket erstellen',
  catalogCreating: 'Ticket wird erstellt…',
  catalogMissing: 'Nicht gefunden?',
  catalogGeneralTitle: 'Allgemeine Anfrage',
  catalogGeneralBody: 'Bitte um Unterstützung.',
  catalogContact: 'Support kontaktieren',
  catalogError: 'Ticket konnte nicht erstellt werden.',
  profileTitle: 'Profil',
  profileDescription: 'Angemeldete Portal-Session. Es gibt kein Passwort — Anmeldung läuft über Magic Link.',
  profileAssets: 'Meine Geräte',
  profileNoAssets: 'Diesem Konto sind keine Geräte zugeordnet.',
  profileAllAssets: 'Alle Geräte des Mandanten',
  ticketMissingTitle: 'Ticket nicht gefunden',
  ticketMissingBody: 'Das angefragte Ticket existiert nicht oder Sie haben keine Berechtigung.',
  ticketBack: 'Zurück zur Übersicht',
  ticketCreated: 'Erstellt am',
  ticketMessages: 'Nachrichten',
  ticketMe: 'Ich',
  ticketSupport: 'Support',
  ticketCompose: 'Nachricht schreiben',
  ticketComposePlaceholder: 'Schreiben Sie hier Ihr Update...',
  ticketSend: 'Antwort senden',
  ticketAttachLater: 'Anhänge können demnächst hinzugefügt werden.',
};

const EN: PortalCopy = {
  servicePortal: 'Service portal',
  navTickets: 'My tickets',
  navCatalog: 'Catalog',
  navCompany: 'All company tickets',
  navAssets: 'Assets',
  ticketsTitle: 'My tickets',
  ticketsDescription: 'Only requests you opened yourself.',
  companyTitle: 'All company tickets',
  companyDescription: 'Every request in your organization. Internal notes stay hidden.',
  assetsTitle: 'Assets',
  assetsDescription: 'Devices in your organization.',
  noAssets: 'No assets yet.',
  catalogTitle: 'What do you need today?',
  catalogDescription: 'Pick a service. This opens a real ticket in your organization.',
  catalogSearch: 'Search the catalog…',
  catalogEmpty: 'Your provider has not published any services yet.',
  catalogCreate: 'Create ticket',
  catalogCreating: 'Creating ticket…',
  catalogMissing: 'Not listed?',
  catalogGeneralTitle: 'General request',
  catalogGeneralBody: 'Please help.',
  catalogContact: 'Contact support',
  catalogError: 'Could not create the ticket.',
  profileTitle: 'Profile',
  profileDescription: 'Signed-in portal session. There is no password — sign-in uses a Magic Link.',
  profileAssets: 'My devices',
  profileNoAssets: 'No devices are assigned to this account.',
  profileAllAssets: 'All organization devices',
  ticketMissingTitle: 'Ticket not found',
  ticketMissingBody: 'This ticket does not exist or you do not have access.',
  ticketBack: 'Back to the list',
  ticketCreated: 'Created',
  ticketMessages: 'messages',
  ticketMe: 'Me',
  ticketSupport: 'Support',
  ticketCompose: 'Write a message',
  ticketComposePlaceholder: 'Write your update here…',
  ticketSend: 'Send reply',
  ticketAttachLater: 'Attachments will be available later.',
};

export function portalCopy(locale: CustomerLocale): PortalCopy {
  return locale === 'en' ? EN : DE;
}
