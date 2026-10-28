import { describe, it, expect } from "vitest";
import { SsrfValidator } from "./ssrf-validator";
import { NotificationClientError } from "../errors/NotificationError";

describe("SsrfValidator", () => {
  it("should reject localhost and 127.0.0.1", async () => {
    await expect(
      SsrfValidator.validateUrl("http://localhost:8080/hook"),
    ).rejects.toThrow(NotificationClientError);

    await expect(
      SsrfValidator.validateUrl("http://127.0.0.1/hook"),
    ).rejects.toThrow(NotificationClientError);
  });

  it("should reject AWS/Cloud instance metadata IP (169.254.169.254)", async () => {
    await expect(
      SsrfValidator.validateUrl("http://169.254.169.254/latest/meta-data"),
    ).rejects.toThrow(/SSRF Protection/);
  });

  it("should reject private RFC 1918 IPs", async () => {
    await expect(
      SsrfValidator.validateUrl("http://10.0.0.1/webhook"),
    ).rejects.toThrow(/SSRF Protection/);

    await expect(
      SsrfValidator.validateUrl("http://192.168.1.100/webhook"),
    ).rejects.toThrow(/SSRF Protection/);

    await expect(
      SsrfValidator.validateUrl("http://172.20.5.1/webhook"),
    ).rejects.toThrow(/SSRF Protection/);
  });

  it("should reject disallowed protocols like ftp:// or file://", async () => {
    await expect(
      SsrfValidator.validateUrl("ftp://example.com/file"),
    ).rejects.toThrow(/Disallowed URL protocol/);
  });

  it("should allow safe public endpoints", async () => {
    await expect(
      SsrfValidator.validateUrl("https://api.github.com/webhook"),
    ).resolves.not.toThrow();
  });
});
