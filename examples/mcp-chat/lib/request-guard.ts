const devOrigins = new Set(
  (process.env.DEV_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim().toLowerCase())
    .filter(Boolean)
);

function hostnameOf(value: string | null): string | null {
  if (!value) {
    return null;
  }
  try {
    return new URL(value.includes('://') ? value : `http://${value}`).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isAllowedOrigin(request: Request, origin: string): boolean {
  const originHost = hostnameOf(origin);
  if (!originHost) {
    return false;
  }
  const originHostWithPort = new URL(origin).host.toLowerCase();
  const requestHost = request.headers.get('host')?.toLowerCase();
  return originHostWithPort === requestHost || devOrigins.has(originHost);
}

function forbidden(reason: string): Response {
  return Response.json({ error: reason }, { status: 403 });
}

/**
 * Rejects requests another site could make on the user's behalf: the routes start agent runs and
 * change permissions, and `allowedDevOrigins` only protects `/_next`. A browser marks a cross-site
 * request with `Sec-Fetch-Site` and `Origin`; a form or a no-cors fetch cannot send JSON.
 */
export function guardRequest(request: Request, { json = true }: { json?: boolean } = {}) {
  if (json) {
    const type = request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
    if (type !== 'application/json') {
      return forbidden('Expected application/json');
    }
  }

  const origin = request.headers.get('origin');
  if (origin && !isAllowedOrigin(request, origin)) {
    return forbidden('Cross-origin requests are not accepted');
  }

  const site = request.headers.get('sec-fetch-site');
  if (
    site &&
    site !== 'same-origin' &&
    site !== 'none' &&
    !(origin && isAllowedOrigin(request, origin))
  ) {
    return forbidden('Cross-site requests are not accepted');
  }

  return null;
}
