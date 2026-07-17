/**
 * Extracts the real client IP address from an incoming request.
 *
 * Strategy (in order of preference):
 *   1. X-Forwarded-For header — set by nginx, Cloudflare, AWS ELB, etc.
 *      Only the leftmost (first) IP is used, which is the originating client.
 *   2. X-Real-IP header — used by some reverse-proxy configurations.
 *   3. req.ip — Express / Fastify built-in; respects the `trust proxy` setting.
 *   4. req.socket.remoteAddress — raw socket address; last resort.
 *   5. 'unknown' — when nothing is available (e.g., unit-test stubs).
 *
 * This logic works correctly whether or not a reverse proxy is present.
 * When behind nginx, the X-Forwarded-For header is populated automatically;
 * when connecting directly, req.ip / remoteAddress contain the real IP.
 */
export function extractIp(req: any): string {
  // X-Forwarded-For may contain a comma-separated list: "clientIP, proxy1, proxy2"
  const forwarded: string | undefined = req?.headers?.['x-forwarded-for'];
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }

  const realIp: string | undefined = req?.headers?.['x-real-ip'];
  if (realIp) return realIp.trim();

  if (req?.ip) return req.ip;

  if (req?.socket?.remoteAddress) return req.socket.remoteAddress;
  if (req?.connection?.remoteAddress) return req.connection.remoteAddress;

  return 'unknown';
}
