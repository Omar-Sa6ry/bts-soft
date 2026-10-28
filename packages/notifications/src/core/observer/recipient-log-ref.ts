import { createHash } from "node:crypto";

/** Stable, non-reversible reference for logs; never use this in place of the actual delivery address. */
export function recipientLogRef(recipientId: string): string {
  return createHash("sha256").update(recipientId).digest("hex").slice(0, 12);
}
