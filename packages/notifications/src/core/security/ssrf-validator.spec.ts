import { describe, it, expect } from "vitest";
import { SsrfValidator } from "./ssrf-validator";
import { NotificationClientError } from "../errors/NotificationError";

describe("SsrfValidator", () => {
  it("should reject invalid URL syntax", async () => {
    await expect(SsrfValidator.validateUrl("not-a-valid-url")).rejects.toThrow(
      /Invalid URL provided/,
    );
  });

  it("should reject localhost and 127.0.0.1 and ::1", async () => {
    await expect(
      SsrfValidator.validateUrl("http://localhost:8080/hook"),
    ).rejects.toThrow(NotificationClientError);

    await expect(
      SsrfValidator.validateUrl("http://app.localhost/hook"),
    ).rejects.toThrow(NotificationClientError);

    await expect(
      SsrfValidator.validateUrl("http://127.0.0.1/hook"),
    ).rejects.toThrow(NotificationClientError);

    await expect(
      SsrfValidator.validateUrl("http://[::1]/hook"),
    ).rejects.toThrow(NotificationClientError);
  });

  it("should allow localhost when allowLocalhost option is true", async () => {
    await expect(
      SsrfValidator.validateUrl("http://127.0.0.1:8080/hook", { allowLocalhost: true }),
    ).resolves.not.toThrow();

    await expect(
      SsrfValidator.validateUrl("http://[::1]:8080/hook", { allowLocalhost: true }),
    ).resolves.not.toThrow();
  });

  it("should reject AWS/Cloud instance metadata IP (169.254.169.254)", async () => {
    await expect(
      SsrfValidator.validateUrl("http://169.254.169.254/latest/meta-data"),
    ).rejects.toThrow(/SSRF Protection/);
  });

  it("should reject private RFC 1918 IPs and Carrier Grade NAT", async () => {
    await expect(
      SsrfValidator.validateUrl("http://10.0.0.1/webhook"),
    ).rejects.toThrow(/SSRF Protection/);

    await expect(
      SsrfValidator.validateUrl("http://192.168.1.100/webhook"),
    ).rejects.toThrow(/SSRF Protection/);

    await expect(
      SsrfValidator.validateUrl("http://172.20.5.1/webhook"),
    ).rejects.toThrow(/SSRF Protection/);

    await expect(
      SsrfValidator.validateUrl("http://100.64.0.5/webhook"),
    ).rejects.toThrow(/SSRF Protection/);
  });

  it("should reject disallowed protocols like ftp:// or file://", async () => {
    await expect(
      SsrfValidator.validateUrl("ftp://example.com/file"),
    ).rejects.toThrow(/Disallowed URL protocol/);
  });

  it("should reject private IPv6 addresses", () => {
    expect(() => SsrfValidator.assertPublicIp("::1", {})).toThrow(/SSRF Protection: Requests to private\/loopback IPv6/);
    expect(() => SsrfValidator.assertPublicIp("::", {})).toThrow(/SSRF Protection: Requests to private\/loopback IPv6/);
    expect(() => SsrfValidator.assertPublicIp("fe80::1", {})).toThrow(/SSRF Protection: Requests to private\/loopback IPv6/);
    expect(() => SsrfValidator.assertPublicIp("fc00::1", {})).toThrow(/SSRF Protection: Requests to private\/loopback IPv6/);
    expect(() => SsrfValidator.assertPublicIp("fd00::1", {})).toThrow(/SSRF Protection: Requests to private\/loopback IPv6/);
    expect(() => SsrfValidator.assertPublicIp("2001:4860:4860::8888", {})).not.toThrow();
  });

  it("should reject non-resolvable hostnames", async () => {
    await expect(SsrfValidator.validateUrl("https://this-domain-does-not-exist-at-all-xyz987.invalid")).rejects.toThrow(NotificationClientError);
  });

  it("should allow safe public endpoints", async () => {
    await expect(
      SsrfValidator.validateUrl("https://api.github.com/webhook"),
    ).resolves.not.toThrow();
  });
});
