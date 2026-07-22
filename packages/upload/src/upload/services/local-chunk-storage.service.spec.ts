import { LocalChunkStorage } from './local-chunk-storage.service';

import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';

describe('LocalChunkStorage', () => {
  let storage: LocalChunkStorage;
  const testRoot = path.join(__dirname, 'test-storage-root');

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'UPLOAD_LOCAL_PATH') return testRoot;
      return null;
    }),
  } as any;

  beforeEach(() => {
    if (fs.existsSync(testRoot)) {
      try {
        fs.rmSync(testRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
      } catch {}
    }
    storage = new LocalChunkStorage(mockConfigService);
  });

  afterEach(() => {
    if (fs.existsSync(testRoot)) {
      try {
        fs.rmSync(testRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
      } catch {}
    }
  });

  it('should save chunks and list them', async () => {
    const jobId = 'test-job-1';
    await storage.saveChunk(jobId, 0, Buffer.from('hello '));
    await storage.saveChunk(jobId, 2, Buffer.from('!!!'));
    await storage.saveChunk(jobId, 1, Buffer.from('world'));

    const chunks = await storage.getUploadedChunks(jobId);
    expect(chunks).toEqual([0, 1, 2]);
  });

  it('should return empty array for non-existent job', async () => {
    const chunks = await storage.getUploadedChunks('non-existent');
    expect(chunks).toEqual([]);
  });

  it('should retrieve a readable stream for a chunk', async () => {
    const jobId = 'test-job-2';
    await storage.saveChunk(jobId, 0, Buffer.from('chunk content'));

    const stream = await storage.getChunkStream(jobId, 0);
    expect(stream).toBeInstanceOf(Readable);

    const data = await new Promise<string>((resolve, reject) => {
      let chunks = '';
      stream.on('data', chunk => chunks += chunk.toString());
      stream.on('end', () => resolve(chunks));
      stream.on('error', err => reject(err));
    });

    expect(data).toBe('chunk content');
  });

  it('should throw error when chunk is not found', async () => {
    await expect(storage.getChunkStream('job-abc', 99)).rejects.toThrow('Chunk 99 for job job-abc not found.');
  });

  it('should clean up chunks', async () => {
    const jobId = 'test-job-3';
    await storage.saveChunk(jobId, 0, Buffer.from('content'));
    
    const jobDir = path.join(testRoot, 'temp', jobId);
    expect(fs.existsSync(jobDir)).toBe(true);

    await storage.cleanChunks(jobId);
    expect(fs.existsSync(jobDir)).toBe(false);
  });
});
