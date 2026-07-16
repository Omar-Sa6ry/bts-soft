import { Test, TestingModule } from "@nestjs/testing";
import { PhoneValidationService } from "./phone-validation.service";

describe("PhoneValidationService", () => {
  let service: PhoneValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PhoneValidationService],
    }).compile();

    service = module.get<PhoneValidationService>(PhoneValidationService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("normalizePhoneNumber", () => {
    it("should normalize valid Egyptian mobile numbers (01xxxxxxxxx -> +201xxxxxxxxx)", () => {
      expect(service.normalizePhoneNumber("01012345678")).toBe("+201012345678");
      expect(service.normalizePhoneNumber("01112345678")).toBe("+201112345678");
      expect(service.normalizePhoneNumber("01212345678")).toBe("+201212345678");
      expect(service.normalizePhoneNumber("01512345678")).toBe("+201512345678");
    });

    it("should normalize valid Egyptian mobile numbers with spaces or dashes", () => {
      expect(service.normalizePhoneNumber("010-1234-5678")).toBe("+201012345678");
      expect(service.normalizePhoneNumber(" 010 1234 5678 ")).toBe("+201012345678");
    });

    it("should normalize Egyptian numbers starting with 00 to +", () => {
      expect(service.normalizePhoneNumber("00201012345678")).toBe("+201012345678");
    });

    it("should normalize Egyptian numbers already having +20", () => {
      expect(service.normalizePhoneNumber("+201012345678")).toBe("+201012345678");
    });

    it("should normalize international numbers correctly", () => {
      // US number
      expect(service.normalizePhoneNumber("202 555 0125", "US")).toBe("+12025550125");
      // UK number
      expect(service.normalizePhoneNumber("07911 123456", "GB")).toBe("+447911123456");
      // Saudi Arabia
      expect(service.normalizePhoneNumber("0501234567", "SA")).toBe("+966501234567");
    });

    it("should fall back to standard normalization if number is invalid/unparseable", () => {
      // Unparseable nonsense
      expect(service.normalizePhoneNumber("not-a-number")).toBe("+notanumber");
      // Short fallback
      expect(service.normalizePhoneNumber("123")).toBe("+123");
    });
  });
});
