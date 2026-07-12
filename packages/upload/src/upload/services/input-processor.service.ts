import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';
import { UploadFile } from '../upload.service';

@Injectable()
export class InputProcessorService {
  async processInput(
    input: unknown,
    type: string,
  ): Promise<(UploadFile & { size?: number }) | null> {
    if (!input) return null;

    let processedInput: unknown = input;

    // 1. Handle GraphQL DTOs
    const possibleFields = ['image', 'video', 'audio', 'file'];
    if (typeof input === 'object' && input !== null && !('createReadStream' in input) && !('buffer' in input)) {
      const inputObj = input as Record<string, unknown>;
      for (const field of possibleFields) {
        if (inputObj[field]) {
          processedInput = inputObj[field];
          break;
        }
      }
    }

    // 2. Handle Promise
    if (
      processedInput instanceof Promise ||
      (typeof processedInput === 'object' &&
        processedInput !== null &&
        typeof (processedInput as Record<string, unknown>).then === 'function')
    ) {
      processedInput = await (processedInput as Promise<unknown>);
    }

    // 3. Handle GraphQL FileUpload Object
    if (
      processedInput &&
      typeof processedInput === 'object' &&
      typeof (processedInput as Record<string, unknown>).createReadStream === 'function'
    ) {
      const fileUpload = processedInput as { createReadStream: () => Readable; filename: string };
      return {
        stream: fileUpload.createReadStream(),
        filename: fileUpload.filename,
      };
    }

    // 4. Handle Base64 String
    if (typeof processedInput === 'string') {
      let base64Data = processedInput;
      let extension = 'png';

      if (processedInput.startsWith('data:')) {
        const parts = processedInput.split(',');
        base64Data = parts[parts.length - 1];
        const mimeMatch = processedInput.match(/data:(.*?);/);
        if (mimeMatch) {
          extension = mimeMatch[1].split('/')[1] || extension;
        }
      }

      const buffer = Buffer.from(base64Data, 'base64');
      return {
        stream: Readable.from(buffer),
        filename: `upload-${Date.now()}.${extension}`,
        size: buffer.length,
      };
    }

    // 5. Handle Buffer
    if (Buffer.isBuffer(processedInput)) {
      return {
        stream: Readable.from(processedInput),
        filename: `upload-${Date.now()}.bin`,
        size: processedInput.length,
      };
    }

    // 6. Handle Multer File
    if (
      processedInput &&
      typeof processedInput === 'object' &&
      'buffer' in processedInput &&
      'originalname' in processedInput
    ) {
      const multerFile = processedInput as { buffer: Buffer; originalname: string; size: number };
      return {
        stream: Readable.from(multerFile.buffer),
        filename: multerFile.originalname,
        size: multerFile.size,
      };
    }

    // 7. Handle already processed stream
    if (
      processedInput &&
      typeof processedInput === 'object' &&
      'stream' in processedInput &&
      'filename' in processedInput
    ) {
      const uploadFile = processedInput as UploadFile;
      return uploadFile;
    }

    return null;
  }
}
