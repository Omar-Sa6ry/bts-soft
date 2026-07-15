import { Test, TestingModule } from "@nestjs/testing";
import { HttpService } from "@nestjs/axios";
import { of } from "rxjs";
import { TwilioMailProvider } from "./twilio-mail.provider";
import { NotificationConfigService } from "../../core/config/notification.config";
import { NotificationClientError, NotificationProviderError } from "../../core/errors/NotificationError";

describe("TwilioMailProvider", () => {
  let provider: TwilioMailProvider;
  let configService: any;
  let httpService: any;

  beforeEach(async () => {
    httpService = {
      post: jest.fn().mockReturnValue(of({ data: {} })),
    };

    configService = {
      sendgridApiKey: "SG.test_key",
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwilioMailProvider,
        { provide: HttpService, useValue: httpService },
        { provide: NotificationConfigService, useValue: configService },
      ],
    }).compile();

    provider = module.get<TwilioMailProvider>(TwilioMailProvider);
  });

  it("should send email via Twilio SendGrid successfully", async () => {
    await provider.send(
      {
        recipientId: "test@example.com",
        body: "Hello SendGrid",
        subject: "Welcome",
      },
      "sender@example.com"
    );

    expect(httpService.post).toHaveBeenCalledWith(
      "https://api.sendgrid.com/v3/mail/send",
      expect.objectContaining({
        personalizations: [{ to: [{ email: "test@example.com" }] }],
        from: { email: "sender@example.com" },
        subject: "Welcome",
        content: expect.arrayContaining([
          { type: "text/plain", value: "Hello SendGrid" },
        ]),
      }),
      expect.objectContaining({
        headers: {
          Authorization: "Bearer SG.test_key",
          "Content-Type": "application/json",
        },
      })
    );
  });

  it("should support dynamic HTML content", async () => {
    await provider.send(
      {
        recipientId: "test@example.com",
        body: "Hello",
        subject: "Welcome",
        channelOptions: { htmlTemplate: "<h1>Hello</h1>" },
      },
      "sender@example.com"
    );

    expect(httpService.post).toHaveBeenCalledWith(
      "https://api.sendgrid.com/v3/mail/send",
      expect.objectContaining({
        content: [
          { type: "text/plain", value: "Hello" },
          { type: "text/html", value: "<h1>Hello</h1>" },
        ],
      }),
      expect.any(Object)
    );
  });

  it("should support dynamic sendgridOptions overrides", async () => {
    await provider.send(
      {
        recipientId: "test@example.com",
        body: "Hello",
        subject: "Welcome",
        channelOptions: {
          sendgridOptions: {
            template_id: "d-123456",
            ip_pool_name: "marketing_ip",
          },
        },
      },
      "sender@example.com"
    );

    expect(httpService.post).toHaveBeenCalledWith(
      "https://api.sendgrid.com/v3/mail/send",
      expect.objectContaining({
        template_id: "d-123456",
        ip_pool_name: "marketing_ip",
      }),
      expect.any(Object)
    );
  });

  it("should throw NotificationProviderError if API key is missing", async () => {
    configService.sendgridApiKey = undefined;

    await expect(
      provider.send(
        {
          recipientId: "test@example.com",
          body: "Hello",
          subject: "Welcome",
        },
        "sender@example.com"
      )
    ).rejects.toThrow(NotificationProviderError);
  });

  it("should throw NotificationClientError if recipientId is missing", async () => {
    await expect(
      provider.send(
        {
          body: "Hello",
          subject: "Welcome",
        } as any,
        "sender@example.com"
      )
    ).rejects.toThrow(NotificationClientError);
  });

  it("should throw NotificationClientError if subject is missing", async () => {
    await expect(
      provider.send(
        {
          recipientId: "test@example.com",
          body: "Hello",
        } as any,
        "sender@example.com"
      )
    ).rejects.toThrow(NotificationClientError);
  });

  it("should throw NotificationClientError on 4xx error response", async () => {
    const error: any = { response: { status: 400, data: { errors: ["Invalid key"] } } };
    httpService.post.mockReturnValue({
      toPromise: () => Promise.reject(error),
      subscribe: (obs: any) => obs.error(error),
    });

    await expect(
      provider.send(
        {
          recipientId: "test@example.com",
          body: "Hello",
          subject: "Welcome",
        },
        "sender@example.com"
      )
    ).rejects.toThrow(NotificationClientError);
  });

  it("should throw NotificationProviderError on 5xx error response", async () => {
    const error: any = { response: { status: 500, data: "Internal Server Error" } };
    httpService.post.mockReturnValue({
      toPromise: () => Promise.reject(error),
      subscribe: (obs: any) => obs.error(error),
    });

    await expect(
      provider.send(
        {
          recipientId: "test@example.com",
          body: "Hello",
          subject: "Welcome",
        },
        "sender@example.com"
      )
    ).rejects.toThrow(NotificationProviderError);
  });
});
