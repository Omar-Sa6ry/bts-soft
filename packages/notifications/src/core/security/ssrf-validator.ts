import * as dns from "node:dns/promises";
import * as net from "node:net";
import { NotificationClientError } from "../errors/NotificationError";

export interface SsrfValidationOptions {
  allowLocalhost?: boolean;
  allowedProtocols?: string[];
}

export class SsrfValidator {
  private static readonly DISALLOWED_IP_RANGES = [
    // IPv4 Loopback (127.0.0.0/8)
    { start: "127.0.0.0", end: "127.255.255.255" },
    // RFC 1918 Private Class A (10.0.0.0/8)
    { start: "10.0.0.0", end: "10.255.255.255" },
    // RFC 1918 Private Class B (172.16.0.0/12)
    { start: "172.16.0.0", end: "172.31.255.255" },
    // RFC 1918 Private Class C (192.168.0.0/16)
    { start: "192.168.0.0", end: "192.168.255.255" },
    // Link-Local / Cloud Instance Metadata (169.254.0.0/16) - AWS, GCP, Azure, DigitalOcean
    { start: "169.254.0.0", end: "169.254.255.255" },
    // Carrier-Grade NAT (100.64.0.0/10)
    { start: "100.64.0.0", end: "100.127.255.255" },
    // Broadcast & 0.0.0.0/8
    { start: "0.0.0.0", end: "0.255.255.255" },
  ];

  /**
   * Validates a target URL against SSRF threats.
   * Throws NotificationClientError if the target resolves to a forbidden or private address.
   */
  public static async validateUrl(
    urlString: string,
    options: SsrfValidationOptions = {},
  ): Promise<void> {
    let parsed: URL;
    try {
      parsed = new URL(urlString);
    } catch {
      throw new NotificationClientError(`Invalid URL provided: '${urlString}'`);
    }

    const protocols = options.allowedProtocols ?? ["http:", "https:"];
    if (!protocols.includes(parsed.protocol)) {
      throw new NotificationClientError(
        `Disallowed URL protocol '${parsed.protocol}'. Allowed: ${protocols.join(", ")}`,
      );
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check common localhost aliases
    if (
      !options.allowLocalhost &&
      (hostname === "localhost" ||
        hostname.endsWith(".localhost") ||
        hostname === "127.0.0.1" ||
        hostname === "::1")
    ) {
      throw new NotificationClientError(
        `SSRF Protection: Requests to localhost or loopback are strictly forbidden (${hostname})`,
      );
    }

    // Resolve IP address
    if (net.isIP(hostname)) {
      this.assertPublicIp(hostname, options);
      return;
    }

    // Resolve DNS records to verify resolved destination
    try {
      const addresses = await dns.lookup(hostname, { all: true });
      if (!addresses || addresses.length === 0) {
        throw new NotificationClientError(
          `Unable to resolve hostname '${hostname}'`,
        );
      }

      for (const record of addresses) {
        this.assertPublicIp(record.address, options);
      }
    } catch (err: unknown) {
      if (err instanceof NotificationClientError) {
        throw err;
      }
      const msg = err instanceof Error ? err.message : String(err);
      throw new NotificationClientError(
        `DNS resolution failed for webhook host '${hostname}': ${msg}`,
      );
    }
  }

  private static assertPublicIp(
    ip: string,
    options: SsrfValidationOptions,
  ): void {
    if (options.allowLocalhost && (ip === "127.0.0.1" || ip === "::1")) {
      return;
    }

    // Check IPv6 loopback and private ranges
    if (net.isIPv6(ip)) {
      const normalized = ip.toLowerCase();
      if (
        normalized === "::1" ||
        normalized === "::" ||
        normalized.startsWith("fe80:") || // Link-local
        normalized.startsWith("fc00:") || // Unique local
        normalized.startsWith("fd00:")
      ) {
        throw new NotificationClientError(
          `SSRF Protection: Requests to private/loopback IPv6 '${ip}' are forbidden`,
        );
      }
      return;
    }

    // Check IPv4 ranges
    const ipNum = this.ipToLong(ip);
    for (const range of this.DISALLOWED_IP_RANGES) {
      const startNum = this.ipToLong(range.start);
      const endNum = this.ipToLong(range.end);
      if (ipNum >= startNum && ipNum <= endNum) {
        throw new NotificationClientError(
          `SSRF Protection: Requests to private or metadata IP '${ip}' are strictly forbidden`,
        );
      }
    }
  }

  private static ipToLong(ip: string): number {
    return (
      ip
        .split(".")
        .reduce((acc, octet) => ((acc << 8) + parseInt(octet, 10)) >>> 0, 0) >>>
      0
    );
  }
}
