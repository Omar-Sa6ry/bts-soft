import * as crypto from 'crypto';
import { Readable } from 'stream';

/**
 * Computes SHA-256 hash of a buffer.
 */
export function computeBufferHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Computes SHA-256 hash of a stream by consuming it.
 * Note: The stream will be fully consumed. Use with care.
 */
export async function computeStreamHash(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    stream.on('data', (chunk) => {
      hash.update(chunk);
    });
    stream.on('end', () => {
      resolve(hash.digest('hex'));
    });
    stream.on('error', (err) => {
      reject(err);
    });
  });
}
