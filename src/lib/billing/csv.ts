export interface BillingCsvRow {
  tenantName: string;
  ticketId: number;
  subject: string;
  agentName: string;
  agentEmail: string;
  durationMinutes: number;
  isBillable: boolean;
  notes: string;
  createdAt: string;
}

export function csvCell(value: string | number | boolean | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildBillingCsv(rows: BillingCsvRow[]): string {
  const header = [
    'tenant',
    'ticketId',
    'subject',
    'agent',
    'email',
    'minutes',
    'billable',
    'notes',
    'createdAt',
  ];
  const lines = [header.join(',')];
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.tenantName),
        csvCell(row.ticketId),
        csvCell(row.subject),
        csvCell(row.agentName),
        csvCell(row.agentEmail),
        csvCell(row.durationMinutes),
        csvCell(row.isBillable ? 'yes' : 'no'),
        csvCell(row.notes),
        csvCell(row.createdAt),
      ].join(',')
    );
  }
  return `${lines.join('\r\n')}\r\n`;
}
