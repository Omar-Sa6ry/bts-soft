import { Readable } from 'stream';

export interface IChunkStorage {
  /**
   * Saves a chunk's buffer for a specific upload job.
   */
  saveChunk(jobId: string, chunkIndex: number, buffer: Buffer): Promise<void>;

  /**
   * Retrieves indices of all successfully uploaded chunks for the job.
   */
  getUploadedChunks(jobId: string): Promise<number[]>;

  /**
   * Returns a readable stream for a specific chunk index.
   */
  getChunkStream(jobId: string, chunkIndex: number): Promise<Readable>;

  /**
   * Deletes all temporary chunks and resources for the job.
   */
  cleanChunks(jobId: string): Promise<void>;
}
