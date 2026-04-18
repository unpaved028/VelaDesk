import fs from 'fs';
import path from 'path';

const REPO_OWNER = 'unpaved028';
const REPO_NAME = 'VelaDesk';

export interface UpdateStatus {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  releaseNotes: string;
}

export const getUpdateStatus = async (): Promise<UpdateStatus> => {
  let currentVersion = '0.1.0'; // Default
  
  try {
    const pkgPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkgJson.version) {
        currentVersion = pkgJson.version;
      }
    }
  } catch (err) {
    console.error('Failed to read package.json version:', err);
  }

  let latestVersion = currentVersion;
  let hasUpdate = false;
  let releaseNotes = '';

  try {
    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`, {
      next: { revalidate: 3600 },
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'VelaDesk-Update-Engine'
      }
    });
    
    if (res.ok) {
      const data = await res.json();
      latestVersion = data.tag_name ? data.tag_name.replace(/^v/, '') : currentVersion;
      hasUpdate = latestVersion !== currentVersion && !!latestVersion;
      releaseNotes = data.body || '';
    } else {
      console.error(`Failed to fetch release from GitHub: ${res.status} ${res.statusText}`);
    }
  } catch (error) {
    console.error('Failed to check for updates:', error);
  }

  return {
    currentVersion,
    latestVersion,
    hasUpdate,
    releaseNotes
  };
};
