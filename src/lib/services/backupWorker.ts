import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { PrismaClient } from '@prisma/client';
import { GraphApiHelper } from '../api/graph';
import { decryptSecret } from './encryption';

const prisma = new PrismaClient();

export class BackupWorker {
  /**
   * Zips the database and uploads it to OneDrive/SharePoint via Graph API.
   */
  public static async executeBackup(): Promise<void> {
    console.log('🔄 [BackupWorker] Starting offsite backup process...');

    try {
      // 1. Fetch SystemConfig to get backup target settings
      const systemConfig = await prisma.systemConfig.findFirst();
      if (!systemConfig || !systemConfig.backupTargetMailbox) {
        console.log('ℹ️ [BackupWorker] No backupTargetMailbox configured. Aborting backup.');
        return;
      }

      // 2. Fetch the corresponding MailboxConfig
      const mailboxConfig = await prisma.mailboxConfig.findFirst({
        where: {
          mailboxAddress: systemConfig.backupTargetMailbox,
          isActive: true
        }
      });

      if (!mailboxConfig) {
        throw new Error(`MailboxConfig for ${systemConfig.backupTargetMailbox} not found or inactive.`);
      }

      // 3. Compress the database
      const dbPath = path.join(process.cwd(), 'prisma', 'dev.db'); // Note: adjust if in production!
      if (!fs.existsSync(dbPath)) {
        throw new Error(`Database not found at ${dbPath}`);
      }

      const backupFileName = `VelaDesk-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.db.gz`;
      const compressedBuffer = await this.gzipFile(dbPath);
      console.log(`✅ [BackupWorker] Database compressed successfully (${compressedBuffer.length} bytes).`);

      // 4. Initialize Graph API Helper
      const clientSecret = decryptSecret(mailboxConfig.clientSecret, mailboxConfig.tenantId);
      const graphHelper = new GraphApiHelper({
        tenantId: mailboxConfig.msTenantId,
        clientId: mailboxConfig.clientId,
        clientSecret: clientSecret,
      });

      const token = await graphHelper.getAccessToken();

      // 5. Upload to OneDrive / SharePoint
      const targetFolder = systemConfig.backupTargetFolder.replace(/^\/+|\/+$/g, ''); // strip slashes
      const uploadPath = targetFolder ? `${targetFolder}/${backupFileName}` : backupFileName;
      
      const endpoint = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(mailboxConfig.mailboxAddress)}/drive/root:/${uploadPath}:/content`;
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/gzip'
        },
        body: compressedBuffer
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Graph API Upload Failed: ${response.status} - ${errText}`);
      }

      console.log(`✅ [BackupWorker] Backup uploaded successfully to ${uploadPath}`);

    } catch (error) {
      console.error('❌ [BackupWorker] Backup failed:', error);
    }
  }

  private static gzipFile(filePath: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const readStream = fs.createReadStream(filePath);
      const gzip = zlib.createGzip();

      readStream.pipe(gzip);

      gzip.on('data', (chunk) => chunks.push(chunk));
      gzip.on('end', () => resolve(Buffer.concat(chunks)));
      gzip.on('error', (err) => reject(err));
      readStream.on('error', (err) => reject(err));
    });
  }
}
