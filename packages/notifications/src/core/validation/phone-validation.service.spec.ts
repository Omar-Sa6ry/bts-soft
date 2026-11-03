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
      expect(service.normalizePhoneNumber("202 555 0125", "US")).toBe("+12025550125");
      expect(service.normalizePhoneNumber("07911 123456", "GB")).toBe("+447911123456");
      expect(service.normalizePhoneNumber("0501234567", "SA")).toBe("+966501234567");
    });

    it("should fall back to standard normalization if number is unparseable", () => {
      // Starts with 00
      expect(service.normalizePhoneNumber("00123456", "ZZ" as any)).toBe("+123456");
      // Starts with 01 but invalid length
      expect(service.normalizePhoneNumber("012345", "ZZ" as any)).toBe("+012345");
      // Starts with 01 and length 11 -> slice(1) prefixed with +20 -> +201999999999
      expect(service.normalizePhoneNumber("01999999999", "ZZ" as any)).toBe("+201999999999");
      // Already has +
      expect(service.normalizePhoneNumber("+99999", "ZZ" as any)).toBe("+99999");
    });
  });
});
