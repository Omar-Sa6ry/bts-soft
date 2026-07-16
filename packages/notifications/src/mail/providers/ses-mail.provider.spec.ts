import { Test, TestingModule } from "@nestjs/testing";
import { SesMailProvider } from "./ses-mail.provider";
import { NotificationConfigService } from "../../core/config/notification.config";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { NotificationClientError, NotificationProviderError } from "../../core/errors/NotificationError";

jest.mock("@aws-sdk/client-ses");

describe("SesMailProvider", () => {
  let provider: SesMailProvider;
  let configService: any;
  let mockSesClient: any;

  beforeEach(async () => {
    mockSesClient = {
      send: jest.fn().mockResolvedValue({ MessageId: "msg-123" }),
    };
    (SESClient as jest.Mock).mockReturnValue(mockSesClient);

    configService = {
      awsSesAccessKeyId: "test-access-key",
      awsSesSecretAccessKey: "test-secret-key",
      awsSesRegion: "us-east-1",
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SesMailProvider,
        { provide: NotificationConfigService, useValue: configService },
      ],
    }).compile();

    provider = module.get<SesMailProvider>(SesMailProvider);
  });

  it("should send email via AWS SES successfully with default config", async () => {
    await provider.send(
      {
        recipientId: "recipient@example.com",
        body: "Hello SES",
        subject: "Welcome",
      },
      "sender@example.com"
    );

    expect(SESClient).toHaveBeenCalledWith(
      expect.objectContaining({
        region: "us-east-1",
        credentials: {
          accessKeyId: "test-access-key",
          secretAccessKey: "test-secret-key",
        },
      })
    );

    expect(mockSesClient.send).toHaveBeenCalledWith(expect.any(SendEmailCommand));
  });

  it("should support dynamic credentials overrides", async () => {
    const dynamicClient = { send: jest.fn().mockResolvedValue({ MessageId: "dynamic-123" }) };
    (SESClient as jest.Mock).mockReturnValueOnce(dynamicClient);

    await provider.send(
      {
        recipientId: "recipient@example.com",
        body: "Hello",
        subject: "Welcome",
        channelOptions: {
          awsAccessKeyId: "dyn-key",
          awsSecretAccessKey: "dyn-secret",
          awsRegion: "us-west-2",
        },
      },
      "sender@example.com"
    );

    expect(SESClient).toHaveBeenCalledWith({
      region: "us-west-2",
      credentials: {
        accessKeyId: "dyn-key",
        secretAccessKey: "dyn-secret",
      },
    });

    expect(dynamicClient.send).toHaveBeenCalled();
  });

  it("should throw NotificationProviderError if client fails to initialize", async () => {
    (SESClient as jest.Mock).mockImplementationOnce(() => {
      throw new Error("AWS SES Init failed");
    });

    const brokenModule: TestingModule = await Test.createTestingModule({
      providers: [
        SesMailProvider,
        { provide: NotificationConfigService, useValue: configService },
      ],
    }).compile();
    const brokenProvider = brokenModule.get<SesMailProvider>(SesMailProvider);

    await expect(
      brokenProvider.send(
        {
          recipientId: "recipient@example.com",
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

  it("should throw NotificationClientError on MessageRejected exception", async () => {
    const error = new Error("Message rejected by SES");
    (error as any).name = "MessageRejected";
    (error as any).$metadata = { httpStatusCode: 400 };

    mockSesClient.send.mockRejectedValue(error);

    await expect(
      provider.send(
        {
          recipientId: "recipient@example.com",
          body: "Hello",
          subject: "Welcome",
        },
        "sender@example.com"
      )
    ).rejects.toThrow(NotificationClientError);
  });

  it("should throw NotificationProviderError on generic AWS SES SDK error", async () => {
    const error = new Error("Connection failed");
    mockSesClient.send.mockRejectedValue(error);

    await expect(
      provider.send(
        {
          recipientId: "recipient@example.com",
          body: "Hello",
          subject: "Welcome",
        },
        "sender@example.com"
      )
    ).rejects.toThrow(NotificationProviderError);
  });
});
