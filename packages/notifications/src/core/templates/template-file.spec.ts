import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { TemplateService } from "./template.service";
import * as fs from "fs";
import * as path from "path";

describe("TemplateService - renderFile", () => {
  let service: TemplateService;
  const testFilePath = path.join(__dirname, "test-temp-template.hbs");

  beforeEach(() => {
    service = new TemplateService();
    fs.writeFileSync(testFilePath, "Hello, {{name}}!");
  });

  afterEach(() => {
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  it("should render file from disk and cache it", () => {
    const rendered = service.renderFile({
      filePath: testFilePath,
      context: { name: "Antigravity" },
    });
    expect(rendered).toBe("Hello, Antigravity!");

    // Second call should hit cache
    const second = service.renderFile({
      filePath: testFilePath,
      context: { name: "User" },
    });
    expect(second).toBe("Hello, User!");
  });

  it("should throw error if template file is missing", () => {
    expect(() =>
      service.renderFile({
        filePath: "/non/existent/path/template.hbs",
        context: {},
      }),
    ).toThrow(/Failed to render template file/);
  });
});

