import * as http from "node:http";
import * as https from "node:https";
import * as dns from "node:dns";
import { SsrfValidator, SsrfValidationOptions } from "./ssrf-validator";
import { NotificationClientError } from "../errors/NotificationError";

export interface SafeAgentOptions extends SsrfValidationOptions {
  keepAlive?: boolean;
  timeout?: number;
}

/**
 * Creates http and https agents configured to validate IP addresses at the DNS resolution
 * stage immediately preceding socket connection. This eliminates the Time-Of-Check To Time-Of-Use
 * (TOCTOU) DNS Rebinding attack vector.
 */
export class SafeAgentFactory {
  public static createAgents(options: SafeAgentOptions = {}): {
    httpAgent: http.Agent;
    httpsAgent: https.Agent;
  } {
    const customLookup: any = (
      hostname: string,
      lookupOptions: any,
      callback: (err: NodeJS.ErrnoException | null, address: string | dns.LookupAddress[], family?: number) => void,
    ) => {
      dns.lookup(hostname, { all: true }, (err, addresses) => {
        if (err) {
          return callback(err, "", 4);
        }

        try {
          if (!addresses || addresses.length === 0) {
            throw new NotificationClientError(`No DNS records found for host '${hostname}'`);
          }

          // Validate every resolved IP against private, metadata, and loopback ranges
          for (const record of addresses) {
            SsrfValidator.assertPublicIp(record.address, options);
          }

          // Check if caller requested all addresses or just one
          const requestedAll = typeof lookupOptions === "object" && lookupOptions?.all;
          if (requestedAll) {
            return callback(null, addresses as any);
          }

          const primary = addresses[0];
          return callback(null, primary.address, primary.family);
        } catch (validationErr: any) {
          const clientError: NodeJS.ErrnoException = new Error(
            validationErr?.message || "SSRF Protection: Blocked destination address",
          );
          clientError.code = "ESSRFBLOCKED";
          return callback(clientError, "", 4);
        }
      });
    };

    const agentOptions = {
      keepAlive: options.keepAlive ?? false,
      timeout: options.timeout ?? 10000,
      lookup: customLookup,
    };

    return {
      httpAgent: new http.Agent(agentOptions),
      httpsAgent: new https.Agent(agentOptions),
    };
  }
}
