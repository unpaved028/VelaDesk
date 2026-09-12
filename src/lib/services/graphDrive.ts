import type { CloudBackupItem } from '@/types/backup';
import {
  BACKUP_RETENTION_COUNT,
  encodeDrivePath,
  formatDriveDestination,
  isVelaDeskBackupName,
  type DriveTarget,
} from './backupTarget';

const SIMPLE_UPLOAD_LIMIT = 3_500_000;
const UPLOAD_CHUNK_SIZE = 3_276_800; // 10 * 320 KiB, required by Graph upload sessions

interface GraphSite {
  id?: string;
}

interface GraphDriveItem {
  id?: string;
  name?: string;
  size?: number;
  lastModifiedDateTime?: string;
  webUrl?: string;
}

interface GraphChildrenResponse {
  value?: GraphDriveItem[];
}

interface GraphUploadSession {
  uploadUrl?: string;
}

function truncateGraphBody(body: string): string {
  return body.replace(/\s+/g, ' ').trim().slice(0, 240);
}

async function driveError(response: Response, context: 'onedrive' | 'sharepoint' | 'upload' | 'list' | 'download'): Promise<string> {
  const body = truncateGraphBody(await response.text());

  if (response.status === 403) {
    return context === 'sharepoint'
      ? 'Graph denied SharePoint access. Grant Sites.ReadWrite.All (and admin consent), then retry.'
      : 'Graph denied Files access. Grant Files.ReadWrite.All (and admin consent), then retry.';
  }

  if (response.status === 404) {
    if (context === 'onedrive') {
      return 'This mailbox has no OneDrive. Shared mailboxes usually do not — use a licensed user or a SharePoint site.';
    }
    if (context === 'sharepoint') {
      return 'SharePoint site or library was not found. Check the site URL.';
    }
    if (context === 'list') {
      return 'Backup folder not found yet.';
    }
    return 'Drive item not found.';
  }

  return `Graph ${context} failed (${response.status}): ${body || response.statusText}`;
}

export class GraphDriveClient {
  constructor(
    private readonly accessToken: string,
    private readonly target: DriveTarget
  ) {}

  destination(): string {
    return formatDriveDestination(this.target);
  }

  private async graph(url: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${this.accessToken}`);
    return fetch(url, { ...init, headers });
  }

  private async driveBase(): Promise<string> {
    if (this.target.kind === 'onedrive') {
      const user = encodeURIComponent(this.target.mailboxAddress);
      const response = await this.graph(`https://graph.microsoft.com/v1.0/users/${user}/drive`);
      if (!response.ok) throw new Error(await driveError(response, 'onedrive'));
      return `https://graph.microsoft.com/v1.0/users/${user}/drive`;
    }

    const siteUrl = `https://graph.microsoft.com/v1.0/sites/${this.target.hostname}:${this.target.serverRelativePath}`;
    const siteResponse = await this.graph(siteUrl);
    if (!siteResponse.ok) throw new Error(await driveError(siteResponse, 'sharepoint'));
    const site = (await siteResponse.json()) as GraphSite;
    if (!site.id) throw new Error('SharePoint site response did not include an id.');
    return `https://graph.microsoft.com/v1.0/sites/${encodeURIComponent(site.id)}/drive`;
  }

  async probe(): Promise<{ destination: string }> {
    const base = await this.driveBase();
    await this.ensureFolder(base, this.target.folder);
    return { destination: this.destination() };
  }

  private async ensureFolder(driveBase: string, folder: string): Promise<void> {
    const segments = folder.split('/').filter(Boolean);
    let current = '';

    for (const segment of segments) {
      current = current ? `${current}/${segment}` : segment;
      const encoded = encodeDrivePath(current);
      const existing = await this.graph(`${driveBase}/root:/${encoded}`);
      if (existing.ok) continue;
      if (existing.status !== 404) {
        throw new Error(await driveError(existing, this.target.kind));
      }

      const parent = current.includes('/') ? current.slice(0, current.lastIndexOf('/')) : '';
      const createUrl = parent
        ? `${driveBase}/root:/${encodeDrivePath(parent)}:/children`
        : `${driveBase}/root/children`;

      const created = await this.graph(createUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: segment,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'fail',
        }),
      });

      if (!created.ok && created.status !== 409) {
        throw new Error(await driveError(created, this.target.kind));
      }
    }
  }

  async upload(buffer: Buffer, fileName: string): Promise<void> {
    const base = await this.driveBase();
    await this.ensureFolder(base, this.target.folder);
    const remote = encodeDrivePath(`${this.target.folder}/${fileName}`);

    if (buffer.length <= SIMPLE_UPLOAD_LIMIT) {
      const response = await this.graph(`${base}/root:/${remote}:/content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: new Uint8Array(buffer),
      });
      if (!response.ok) throw new Error(await driveError(response, 'upload'));
      return;
    }

    const sessionResponse = await this.graph(`${base}/root:/${remote}:/createUploadSession`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item: { '@microsoft.graph.conflictBehavior': 'replace' },
      }),
    });
    if (!sessionResponse.ok) throw new Error(await driveError(sessionResponse, 'upload'));

    const session = (await sessionResponse.json()) as GraphUploadSession;
    if (!session.uploadUrl) throw new Error('Graph upload session did not return uploadUrl.');

    for (let start = 0; start < buffer.length; start += UPLOAD_CHUNK_SIZE) {
      const end = Math.min(start + UPLOAD_CHUNK_SIZE, buffer.length);
      const chunk = buffer.subarray(start, end);
      const chunkResponse = await fetch(session.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Length': String(chunk.length),
          'Content-Range': `bytes ${start}-${end - 1}/${buffer.length}`,
        },
        body: new Uint8Array(chunk),
      });
      if (!chunkResponse.ok && chunkResponse.status !== 202) {
        throw new Error(await driveError(chunkResponse, 'upload'));
      }
    }
  }

  async list(): Promise<CloudBackupItem[]> {
    const base = await this.driveBase();
    const folder = encodeDrivePath(this.target.folder);
    const response = await this.graph(
      `${base}/root:/${folder}:/children?$select=id,name,size,lastModifiedDateTime,webUrl`
    );

    if (response.status === 404) return [];
    if (!response.ok) throw new Error(await driveError(response, 'list'));

    const payload = (await response.json()) as GraphChildrenResponse;
    return (payload.value ?? [])
      .filter((item): item is GraphDriveItem & { id: string; name: string } => Boolean(item.id && item.name))
      .filter((item) => isVelaDeskBackupName(item.name))
      .map((item) => ({
        id: item.id,
        name: item.name,
        size: item.size ?? 0,
        lastModifiedDateTime: item.lastModifiedDateTime ?? '',
        webUrl: item.webUrl,
      }))
      .sort((left, right) => right.lastModifiedDateTime.localeCompare(left.lastModifiedDateTime));
  }

  async download(itemId: string): Promise<Buffer> {
    const base = await this.driveBase();
    const response = await this.graph(`${base}/items/${encodeURIComponent(itemId)}/content`);
    if (!response.ok) throw new Error(await driveError(response, 'download'));
    return Buffer.from(await response.arrayBuffer());
  }

  async prune(keep = BACKUP_RETENTION_COUNT): Promise<number> {
    const items = await this.list();
    const stale = items.slice(keep);
    let removed = 0;
    const base = await this.driveBase();

    for (const item of stale) {
      const response = await this.graph(`${base}/items/${encodeURIComponent(item.id)}`, { method: 'DELETE' });
      if (response.ok || response.status === 204) removed += 1;
    }

    return removed;
  }
}
