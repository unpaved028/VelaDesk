'use server';

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

import { prisma } from '@/lib/db/prisma';
import { encryptSecret } from '@/lib/services/encryption';
import { revalidatePath } from 'next/cache';

export async function saveCloudflareToken(token: string) {
  try {
    // 1. Secure Database Save (Encrypted according to SOP-05)
    // We use "SYSTEM" as tenantId for global system configurations
    const encryptedToken = encryptSecret(token, "SYSTEM");
    
    await prisma.systemConfig.upsert({
      where: { id: "global" },
      update: { cloudflareTunnelToken: encryptedToken },
      create: { 
        id: "global", 
        cloudflareTunnelToken: encryptedToken,
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      },
    });

    // 2. Local Environment Save (for Docker Zero-Touch)
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    if (envContent.includes('CLOUDFLARE_TUNNEL_TOKEN=')) {
      envContent = envContent.replace(
        /CLOUDFLARE_TUNNEL_TOKEN=.*/g,
        `CLOUDFLARE_TUNNEL_TOKEN=${token}`
      );
    } else {
      envContent += `\nCLOUDFLARE_TUNNEL_TOKEN=${token}\n`;
    }

    fs.writeFileSync(envPath, envContent, 'utf8');

    // 3. Dynamic Application (Docker only)
    try {
      await execAsync('docker compose up -d cloudflared', { cwd: process.cwd() });
    } catch (e) {
      console.warn('[NetworkActions] Container restart skipped: Not in docker or no socket access.', e);
    }

    revalidatePath('/admin/settings');
    revalidatePath('/setup');

    return { success: true, data: 'Token saved securely in DB and .env', error: null };
  } catch (error: any) {
    console.error('Failed to save cloudflare token:', error);
    return { success: false, data: null, error: error.message || 'Failed to save token' };
  }
}

export async function getCloudflareTokenStatus() {
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
      return { success: true, data: { status: 'disconnected', tokenExists: false }, error: null };
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/CLOUDFLARE_TUNNEL_TOKEN=(.+)/);
    
    if (match && match[1] && match[1].trim() !== '') {
      return { success: true, data: { status: 'connected', tokenExists: true }, error: null };
    }

    return { success: true, data: { status: 'disconnected', tokenExists: false }, error: null };
  } catch (error) {
    return { success: false, data: null, error: 'Failed to get token status' };
  }
}
