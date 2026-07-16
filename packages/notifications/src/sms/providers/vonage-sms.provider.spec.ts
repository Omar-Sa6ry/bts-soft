import { Test, TestingModule } from "@nestjs/testing";
import { VonageSmsProvider } from "./vonage-sms.provider";
import { NotificationConfigService } from "../../core/config/notification.config";
import { HttpService } from "@nestjs/axios";
import { of } from "rxjs";
import { NotificationClientError, NotificationProviderError } from "../../core/errors/NotificationError";
import { PhoneValidationService } from "../../core/validation/phone-validation.service";

describe("VonageSmsProvider", () => {
  let provider: VonageSmsProvider;
  let configService: any;
  let httpService: any;

  beforeEach(async () => {
    httpService = {
      post: jest.fn().mockReturnValue(
        of({
          data: {
            "message-count": "1",
            messages: [
              {
                to: "201012345678",
                "message-id": "12345",
                status: "0",
                "remaining-balance": "10.0",
                "message-price": "0.01",
                network: "12345",
              },
            ],
          },
        })
      ),
    };

    configService = {
      vonageApiKey: "test-key",
      vonageApiSecret: "test-secret",
      vonageSender: "TEST_SMS",
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VonageSmsProvider,
        PhoneValidationService,
        { provide: HttpService, useValue: httpService },
        { provide: NotificationConfigService, useValue: configService },
      ],
    }).compile();

    provider = module.get<VonageSmsProvider>(VonageSmsProvider);
  });

  it("should send SMS successfully using default credentials", async () => {
    await provider.send({
      recipientId: "+201012345678",
      body: "Hello Vonage",
    });

    expect(httpService.post).toHaveBeenCalledWith(
      "https://rest.nexmo.com/sms/json",
      expect.any(URLSearchParams),
      expect.objectContaining({
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })
    );

    const callArgs = httpService.post.mock.calls[0][1] as URLSearchParams;
    expect(callArgs.get("api_key")).toBe("test-key");
    expect(callArgs.get("api_secret")).toBe("test-secret");
    expect(callArgs.get("from")).toBe("TEST_SMS");
    expect(callArgs.get("to")).toBe("201012345678");
    expect(callArgs.get("text")).toBe("Hello Vonage");
  });

  it("should support dynamic config overrides via channelOptions", async () => {
    await provider.send({
      recipientId: "+201012345678",
      body: "Dynamic payload",
      channelOptions: {
        apiKey: "dyn-key",
        apiSecret: "dyn-secret",
        from: "DYN_SENDER",
      },
    });

    const callArgs = httpService.post.mock.calls[0][1] as URLSearchParams;
    expect(callArgs.get("api_key")).toBe("dyn-key");
    expect(callArgs.get("api_secret")).toBe("dyn-secret");
    expect(callArgs.get("from")).toBe("DYN_SENDER");
  });

  it("should throw NotificationProviderError if credentials are not configured", async () => {
    configService.vonageApiKey = undefined;

    await expect(
      provider.send({
        recipientId: "+201012345678",
        body: "Hello",
      })
    ).rejects.toThrow(NotificationProviderError);
  });

  it("should throw NotificationProviderError if sender is not configured", async () => {
    configService.vonageSender = undefined;

    await expect(
      provider.send({
        recipientId: "+201012345678",
        body: "Hello",
      })
    ).rejects.toThrow(NotificationProviderError);
  });

  it("should throw NotificationClientError if phone number is missing", async () => {
    await expect(
      provider.send({
        recipientId: "",
        body: "Hello",
      })
    ).rejects.toThrow(NotificationClientError);
  });

  it("should throw NotificationClientError on client error status (e.g. status 3 - Invalid params)", async () => {
    httpService.post.mockReturnValue(
      of({
        data: {
          "message-count": "1",
          messages: [
            {
              status: "3",
              "error-text": "Invalid params",
            },
          ],
        },
      })
    );

    await expect(
      provider.send({
        recipientId: "+201012345678",
        body: "Test",
      })
    ).rejects.toThrow(NotificationClientError);
  });

  it("should throw NotificationProviderError on provider error status (e.g. status 4 - Invalid credentials)", async () => {
    httpService.post.mockReturnValue(
      of({
        data: {
          "message-count": "1",
          messages: [
            {
              status: "4",
              "error-text": "Invalid credentials",
            },
          ],
        },
      })
    );

    await expect(
      provider.send({
        recipientId: "+201012345678",
        body: "Test",
      })
    ).rejects.toThrow(NotificationProviderError);
  });

  it("should throw NotificationClientError on Axios 4xx HTTP error", async () => {
    const error: any = { response: { status: 400, data: "Bad Request" } };
    httpService.post.mockReturnValue({
      toPromise: () => Promise.reject(error),
      subscribe: (obs: any) => obs.error(error),
    });

    await expect(
      provider.send({
        recipientId: "+201012345678",
        body: "Test",
      })
    ).rejects.toThrow(NotificationClientError);
  });

  it("should throw NotificationProviderError on Axios 5xx HTTP error", async () => {
    const error: any = { response: { status: 502, data: "Bad Gateway" } };
    httpService.post.mockReturnValue({
      toPromise: () => Promise.reject(error),
      subscribe: (obs: any) => obs.error(error),
    });

    await expect(
      provider.send({
        recipientId: "+201012345678",
        body: "Test",
      })
    ).rejects.toThrow(NotificationProviderError);
  });
});
