import { Test, TestingModule } from "@nestjs/testing";
import { NodemailerMailProvider } from "./nodemailer.provider";
import { NotificationConfigService } from "../../core/config/notification.config";
import * as nodemailer from "nodemailer";
import { NotificationClientError, NotificationProviderError } from "../../core/errors/NotificationError";

jest.mock("nodemailer");

describe("NodemailerMailProvider", () => {
  let provider: NodemailerMailProvider;
  let configService: any;
  let mockTransporter: any;

  beforeEach(async () => {
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: "123" }),
    };
    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    configService = {
      emailUser: "test@user.com",
      emailPass: "password",
      emailHost: "smtp.test.com",
      emailPort: 587,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NodemailerMailProvider,
        { provide: NotificationConfigService, useValue: configService },
      ],
    }).compile();

    provider = module.get<NodemailerMailProvider>(NodemailerMailProvider);
    provider.onModuleInit();
  });

  it("should send email via nodemailer transport successfully", async () => {
    const message = {
      recipientId: "user@test.com",
      subject: "Test Subject",
      body: "Hello",
    };

    await provider.send(message, "default@test.com");

    expect(mockTransporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "default@test.com",
        to: "user@test.com",
        subject: "Test Subject",
        text: "Hello",
      })
    );
  });

  it("should support dynamic SMTP override", async () => {
    const dynamicTransporter = { sendMail: jest.fn().mockResolvedValue({}) };
    (nodemailer.createTransport as jest.Mock).mockReturnValueOnce(dynamicTransporter);

    const message = {
      recipientId: "user@test.com",
      subject: "Dynamic",
      body: "Hello",
      channelOptions: {
        smtpConfig: { host: "smtp.new.com" },
      },
    };

    await provider.send(message, "default@test.com");

    expect(nodemailer.createTransport).toHaveBeenCalledWith({ host: "smtp.new.com" });
    expect(dynamicTransporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "default@test.com",
      })
    );
  });

  it("should throw NotificationClientError if recipientId is missing", async () => {
    await expect(
      provider.send({ subject: "s", body: "b" } as any, "sender@test.com")
    ).rejects.toThrow(NotificationClientError);
  });

  it("should throw NotificationClientError if subject is missing", async () => {
    await expect(
      provider.send({ recipientId: "x", body: "b" } as any, "sender@test.com")
    ).rejects.toThrow(NotificationClientError);
  });

  it("should throw NotificationClientError on 4xx rejection", async () => {
    mockTransporter.sendMail.mockRejectedValue({ responseCode: 450, message: "Rejected" });

    await expect(
      provider.send({ recipientId: "x", subject: "s", body: "b" }, "sender@test.com")
    ).rejects.toThrow(NotificationClientError);
  });

  it("should throw NotificationProviderError on 5xx rejection", async () => {
    mockTransporter.sendMail.mockRejectedValue({ responseCode: 550, message: "Failed" });

    await expect(
      provider.send({ recipientId: "x", subject: "s", body: "b" }, "sender@test.com")
    ).rejects.toThrow(NotificationProviderError);
  });
});
