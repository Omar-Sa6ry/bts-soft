import { InputProcessorService } from './input-processor.service';
import { Readable } from 'stream';

describe('InputProcessorService', () => {
  let service: InputProcessorService;

  beforeEach(() => {
    service = new InputProcessorService();
  });

  it('should process base64 strings into stream and buffer metadata', async () => {
    const base64Str = 'data:image/png;base64,aGVsbG8='; // "hello" in base64
    const res = await service.processInput(base64Str, 'image');

    expect(res).toBeDefined();
    expect(res?.filename).toContain('.png');
    expect(res?.size).toBe(5); // length of "hello"
    expect(res?.stream).toBeInstanceOf(Readable);
  });

  it('should process raw Buffer inputs', async () => {
    const buf = Buffer.from('hello buffer');
    const res = await service.processInput(buf, 'file');

    expect(res).toBeDefined();
    expect(res?.filename).toContain('.bin');
    expect(res?.size).toBe(buf.length);
    expect(res?.stream).toBeInstanceOf(Readable);
  });

  it('should process Multer file objects', async () => {
    const multerFile = {
      buffer: Buffer.from('multer-data'),
      originalname: 'report.pdf',
      size: 11,
    };
    const res = await service.processInput(multerFile, 'file');

    expect(res).toBeDefined();
    expect(res?.filename).toBe('report.pdf');
    expect(res?.size).toBe(11);
    expect(res?.stream).toBeInstanceOf(Readable);
  });

  it('should bypass already processed streams', async () => {
    const stream = new Readable();
    const processed = { stream, filename: 'already.glb' };
    const res = await service.processInput(processed, 'model3d');

    expect(res).toBe(processed);
  });

  it('should handle GraphQL FileUpload objects with createReadStream method', async () => {
    const fileUpload = {
      createReadStream: () => new Readable(),
      filename: 'graphql.jpg',
    };
    const res = await service.processInput(fileUpload, 'image');

    expect(res).toBeDefined();
    expect(res?.filename).toBe('graphql.jpg');
    expect(res?.stream).toBeDefined();
  });
});
