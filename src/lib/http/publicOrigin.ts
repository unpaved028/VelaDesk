/**
 * Public origin for browser redirects.
 *
 * Next.js standalone sets HOSTNAME=0.0.0.0 so the process can bind on all
 * interfaces. request.url then becomes http://0.0.0.0:3000/... which browsers
 * cannot follow. Always prefer the Host / forwarded headers the client sent.
 */

export function isUnspecifiedBindHost(hostHeader: string): boolean {
  const hostname = hostnameOf(hostHeader);
  return hostname === '0.0.0.0' || hostname === '::';
}

export function publicRequestOrigin(request: {
  url: string;
  headers: { get(name: string): string | null };
}): string {
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const host = forwardedHost || request.headers.get('host')?.trim() || '';
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();

  if (host && !isUnspecifiedBindHost(host)) {
    return `${forwardedProto || protocolOf(request.url, host)}://${host}`;
  }

  try {
    const url = new URL(request.url);
    if (!isUnspecifiedBindHost(url.host)) {
      return url.origin;
    }
  } catch {
    // ignore malformed request.url
  }

  return 'http://localhost:3000';
}

export function publicAbsoluteUrl(
  request: {
    url: string;
    headers: { get(name: string): string | null };
  },
  path: string
): URL {
  return new URL(path, `${publicRequestOrigin(request)}/`);
}

function hostnameOf(hostHeader: string): string {
  const trimmed = hostHeader.trim().toLowerCase();
  if (trimmed.startsWith('[')) {
    const end = trimmed.indexOf(']');
    return end === -1 ? trimmed : trimmed.slice(1, end);
  }
  return trimmed.split(':')[0] ?? trimmed;
}

function protocolOf(requestUrl: string, host: string): string {
  try {
    const url = new URL(requestUrl);
    if (url.protocol === 'https:') return 'https';
  } catch {
    // ignore
  }
  if (host.endsWith(':443')) return 'https';
  return 'http';
}
