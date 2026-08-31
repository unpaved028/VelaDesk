export function extractInboundToken(request: Request): string | null {
  const url = new URL(request.url);
  const queryToken = url.searchParams.get('token')?.trim();
  if (queryToken) return queryToken;

  const headerToken = request.headers.get('x-veladesk-token')?.trim();
  if (headerToken) return headerToken;

  const authorization = request.headers.get('authorization');
  if (authorization?.toLowerCase().startsWith('bearer ')) {
    const bearer = authorization.slice(7).trim();
    return bearer || null;
  }

  return null;
}
