import { Test, TestingModule } from "@nestjs/testing";
import { SmsMisrProvider } from "./smsmisr.provider";
import { NotificationConfigService } from "../../core/config/notification.config";
import { HttpService } from "@nestjs/axios";
import { of } from "rxjs";
import { NotificationClientError, NotificationProviderError } from "../../core/errors/NotificationError";
import { PhoneValidationService } from "../../core/validation/phone-validation.service";

describe("SmsMisrProvider", () => {
  let provider: SmsMisrProvider;
  let configService: any;
  let httpService: any;

  beforeEach(async () => {
    httpService = {
      post: jest.fn().mockReturnValue(of({ data: { code: "1901" } })),
    };

    configService = {
      smsmisrUsername: "test-user",
      smsmisrPassword: "test-password",
      smsmisrSender: "TEST_SMS",
      smsmisrEnvironment: 1,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsMisrProvider,
        PhoneValidationService,
        { provide: HttpService, useValue: httpService },
        { provide: NotificationConfigService, useValue: configService },
      ],
    }).compile();

    provider = module.get<SmsMisrProvider>(SmsMisrProvider);
  });

  it("should send SMS successfully using default credentials", async () => {
    await provider.send({
      recipientId: "+201012345678",
      body: "Hello SMS Misr",
    });

    expect(httpService.post).toHaveBeenCalledWith(
      "https://smsmisr.com/api/SMS/",
      expect.any(URLSearchParams),
      expect.objectContaining({
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })
    );

    const callArgs = httpService.post.mock.calls[0][1] as URLSearchParams;
    expect(callArgs.get("username")).toBe("test-user");
    expect(callArgs.get("password")).toBe("test-password");
    expect(callArgs.get("sender")).toBe("TEST_SMS");
    expect(callArgs.get("mobile")).toBe("201012345678");
    expect(callArgs.get("message")).toBe("Hello SMS Misr");
    expect(callArgs.get("language")).toBe("1");
    expect(callArgs.get("environment")).toBe("1");
  });

  it("should auto-detect Arabic language when message contains Arabic characters", async () => {
    await provider.send({
      recipientId: "+201012345678",
      body: "مرحبا بك",
    });

    const callArgs = httpService.post.mock.calls[0][1] as URLSearchParams;
    expect(callArgs.get("language")).toBe("2");
  });

  it("should support dynamic config overrides via channelOptions", async () => {
    await provider.send({
      recipientId: "201200000000",
      body: "Dynamic payload",
      channelOptions: {
        username: "dyn-user",
        password: "dyn-password",
        sender: "DYN_SENDER",
        language: 1,
        environment: 2,
      },
    });

    expect(httpService.post).toHaveBeenCalledWith(
      "https://smsmisr.com/api/SMS/",
      expect.any(URLSearchParams),
      expect.any(Object)
    );

    const callArgs = httpService.post.mock.calls[0][1] as URLSearchParams;
    expect(callArgs.get("username")).toBe("dyn-user");
    expect(callArgs.get("password")).toBe("dyn-password");
    expect(callArgs.get("sender")).toBe("DYN_SENDER");
    expect(callArgs.get("language")).toBe("1");
    expect(callArgs.get("environment")).toBe("2");
  });

  it("should accept 6000 code as success response", async () => {
    httpService.post.mockReturnValue(of({ data: { code: "6000" } }));

    await expect(
      provider.send({
        recipientId: "201200000000",
        body: "Success code 6000",
      })
    ).resolves.not.toThrow();
  });

  it("should throw NotificationProviderError if credentials are not configured", async () => {
    configService.smsmisrUsername = undefined;

    await expect(
      provider.send({
        recipientId: "201200000000",
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

  it("should throw NotificationClientError on code 1905 (invalid mobile)", async () => {
    httpService.post.mockReturnValue(of({ data: { code: "1905" } }));

    await expect(
      provider.send({
        recipientId: "invalid",
        body: "Test",
      })
    ).rejects.toThrow(NotificationClientError);
  });

  it("should throw NotificationProviderError on code 1903 (auth failed)", async () => {
    httpService.post.mockReturnValue(of({ data: { code: "1903" } }));

    await expect(
      provider.send({
        recipientId: "20100000000",
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
        recipientId: "20100000000",
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
        recipientId: "20100000000",
        body: "Test",
      })
    ).rejects.toThrow(NotificationProviderError);
  });
});
