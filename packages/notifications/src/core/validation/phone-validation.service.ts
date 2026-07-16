import { Injectable, Logger } from "@nestjs/common";
import { parsePhoneNumberFromString, CountryCode } from "libphonenumber-js";

@Injectable()
export class PhoneValidationService {
  private readonly logger = new Logger(PhoneValidationService.name);

  /**
   * Normalizes a phone number to E.164 format.
   * If parsing fails, it falls back to the original Egypt-centric fallback algorithm.
   * 
   * @param phone - The raw phone number input
   * @param defaultCountry - Default country to assume if phone doesn't have an international prefix (defaults to 'EG')
   */
  public normalizePhoneNumber(phone: string, defaultCountry: CountryCode = "EG"): string {
    const trimmed = phone.trim();

    // Convert 00 prefix to +
    let toParse = trimmed;
    if (toParse.startsWith("00")) {
      toParse = "+" + toParse.slice(2);
    }

    try {
      const parsed = parsePhoneNumberFromString(toParse, defaultCountry);
      if (parsed && parsed.isValid()) {
        const formatted = parsed.number; // E.164 formatted string
        this.logger.debug(`Normalized phone: ${phone} -> ${formatted} (parsed as ${parsed.country})`);
        return formatted;
      }
    } catch (error: unknown) {
      this.logger.warn(`libphonenumber-js parsing error for ${phone}: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Fallback logic matching original hardcoded Egyptian normalization
    let fallback = trimmed.replace(/\s|-/g, "");

    if (fallback.startsWith("00")) {
      fallback = "+" + fallback.slice(2);
    }

    if (fallback.startsWith("01") && fallback.length === 11) {
      fallback = "+20" + fallback.slice(1);
    }

    if (!fallback.startsWith("+")) {
      fallback = "+" + fallback;
    }

    this.logger.debug(`Normalized phone using fallback: ${phone} -> ${fallback}`);
    return fallback;
  }
}
