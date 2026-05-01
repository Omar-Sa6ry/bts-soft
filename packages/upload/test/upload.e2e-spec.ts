import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Controller, Post, Delete, UploadedFile, UseInterceptors, Body } from '@nestjs/common';
import request from 'supertest';
import { UploadService } from '../src/upload/upload.service';
import { ConfigModule } from '@nestjs/config';
import { UploadProvider } from '../src/upload/utils/upload.constants';
import * as fs from 'fs';
import * as path from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import { Readable } from 'stream';

@Controller('upload-test')
class TestController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: any) {
    const stream = new Readable();
    stream.push(file.buffer);
    stream.push(null);
    return this.uploadService.uploadImageCore({ stream, filename: file.originalname, size: file.size });
  }

  @Post('video')
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideo(@UploadedFile() file: any) {
    const stream = new Readable();
    stream.push(file.buffer);
    stream.push(null);
    return this.uploadService.uploadVideoCore({ stream, filename: file.originalname, size: file.size });
  }

  @Post('audio')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAudio(@UploadedFile() file: any) {
    const stream = new Readable();
    stream.push(file.buffer);
    stream.push(null);
    return this.uploadService.uploadAudioCore({ stream, filename: file.originalname, size: file.size });
  }

  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: any) {
    const stream = new Readable();
    stream.push(file.buffer);
    stream.push(null);
    return this.uploadService.uploadFileCore({ stream, filename: file.originalname, size: file.size });
  }

  @Post('model3d')
  @UseInterceptors(FileInterceptor('file'))
  async uploadModel3d(@UploadedFile() file: any) {
    const stream = new Readable();
    stream.push(file.buffer);
    stream.push(null);
    return this.uploadService.uploadModel3dCore({ stream, filename: file.originalname, size: file.size });
  }

  @Delete('image')
  async deleteImage(@Body('url') url: string) {
    return this.uploadService.deleteImage(url);
  }

  @Delete('video')
  async deleteVideo(@Body('url') url: string) {
    return this.uploadService.deleteVideo(url);
  }

  @Delete('audio')
  async deleteAudio(@Body('url') url: string) {
    return this.uploadService.deleteAudio(url);
  }

  @Delete('file')
  async deleteFile(@Body('url') url: string) {
    return this.uploadService.deleteFile(url);
  }

  @Delete('model3d')

  async deleteModel3d(@Body('url') url: string) {
    // Note: We use deleteImage as a generic delete if specialized delete isn't implemented for raw files in this spec class
    // but the service now has uploadModel3dCore. For deletion, it follows the same logic as images/files.
    return this.uploadService.deleteImage(url); 
  }

}

describe('UploadModule (e2e) - 100% Comprehensive Suite', () => {
  let app: INestApplication;
  const testUploadPath = path.join(__dirname, 'e2e-uploads');

  beforeAll(async () => {
    if (fs.existsSync(testUploadPath)) {
      fs.rmSync(testUploadPath, { recursive: true, force: true });
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({
            UPLOAD_PROVIDER: UploadProvider.LOCAL,
            UPLOAD_LOCAL_PATH: testUploadPath,
            UPLOAD_MAX_IMAGE_SIZE: 1024 * 1024,
            UPLOAD_MAX_VIDEO_SIZE: 10 * 1024 * 1024,
            UPLOAD_MAX_AUDIO_SIZE: 5 * 1024 * 1024,
            UPLOAD_MAX_FILE_SIZE: 2 * 1024 * 1024,
            UPLOAD_MAX_MODEL_3D_SIZE: 20 * 1024 * 1024,
          })],

        }),
      ],
      controllers: [TestController],
      providers: [UploadService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    if (fs.existsSync(testUploadPath)) {
      fs.rmSync(testUploadPath, { recursive: true, force: true });
    }
  });

  describe('REST API - Positive Scenarios (All Types)', () => {
    it('should upload and delete an Image', async () => {
      const filePath = path.join(__dirname, 'test.jpg');
      fs.writeFileSync(filePath, 'img-content');
      const res = await request(app.getHttpServer()).post('/upload-test/image').attach('file', filePath);
      expect(res.status).toBe(201);
      const url = res.body.url;
      expect(fs.existsSync(url)).toBe(true);
      
      const delRes = await request(app.getHttpServer()).delete('/upload-test/image').send({ url });
      expect(delRes.status).toBe(200);
      expect(fs.existsSync(url)).toBe(false);
      fs.unlinkSync(filePath);
    });

    it('should upload and delete a Video', async () => {
      const filePath = path.join(__dirname, 'test.mp4');
      fs.writeFileSync(filePath, 'vid-content');
      const res = await request(app.getHttpServer()).post('/upload-test/video').attach('file', filePath);
      expect(res.status).toBe(201);
      const url = res.body.url;
      expect(fs.existsSync(url)).toBe(true);
      
      const delRes = await request(app.getHttpServer()).delete('/upload-test/video').send({ url });
      expect(delRes.status).toBe(200);
      expect(fs.existsSync(url)).toBe(false);
      fs.unlinkSync(filePath);
    });

    it('should upload and delete an Audio', async () => {
      const filePath = path.join(__dirname, 'test.mp3');
      fs.writeFileSync(filePath, 'aud-content');
      const res = await request(app.getHttpServer()).post('/upload-test/audio').attach('file', filePath);
      expect(res.status).toBe(201);
      const url = res.body.url;
      expect(fs.existsSync(url)).toBe(true);
      
      const delRes = await request(app.getHttpServer()).delete('/upload-test/audio').send({ url });
      expect(delRes.status).toBe(200);
      expect(fs.existsSync(url)).toBe(false);
      fs.unlinkSync(filePath);
    });

    it('should upload and delete a Raw File (PDF)', async () => {
      const filePath = path.join(__dirname, 'test.pdf');
      fs.writeFileSync(filePath, 'pdf-content');
      const res = await request(app.getHttpServer()).post('/upload-test/file').attach('file', filePath);
      expect(res.status).toBe(201);
      const url = res.body.url;
      expect(fs.existsSync(url)).toBe(true);
      
      const delRes = await request(app.getHttpServer()).delete('/upload-test/file').send({ url });
      expect(delRes.status).toBe(200);
      expect(fs.existsSync(url)).toBe(false);
      fs.unlinkSync(filePath);
    });

    it('should upload and delete a 3D Model (GLB)', async () => {
      const filePath = path.join(__dirname, 'test.glb');
      fs.writeFileSync(filePath, 'glb-binary-content');
      const res = await request(app.getHttpServer()).post('/upload-test/model3d').attach('file', filePath);
      expect(res.status).toBe(201);
      const url = res.body.url;
      expect(fs.existsSync(url)).toBe(true);
      
      const delRes = await request(app.getHttpServer()).delete('/upload-test/model3d').send({ url });
      expect(delRes.status).toBe(200);
      expect(fs.existsSync(url)).toBe(false);
      fs.unlinkSync(filePath);
    });
  });


  describe('REST API - Negative Scenarios', () => {
    it('should fail when uploading an invalid extension (e.g. .exe to image)', async () => {
      const filePath = path.join(__dirname, 'malicious.exe');
      fs.writeFileSync(filePath, 'content');
      const res = await request(app.getHttpServer()).post('/upload-test/image').attach('file', filePath);
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid image type');
      fs.unlinkSync(filePath);
    });

    it('should fail when file size exceeds specific limit', async () => {
      const filePath = path.join(__dirname, 'big.jpg');
      const largeBuffer = Buffer.alloc(1.1 * 1024 * 1024); // Over 1MB limit
      fs.writeFileSync(filePath, largeBuffer);
      const res = await request(app.getHttpServer()).post('/upload-test/image').attach('file', filePath);
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('image size exceeds limit');
      fs.unlinkSync(filePath);
    });

    it('should fail when uploading an invalid 3D model extension', async () => {

      const filePath = path.join(__dirname, 'test.txt');
      fs.writeFileSync(filePath, 'not-a-3d-model');
      const res = await request(app.getHttpServer()).post('/upload-test/model3d').attach('file', filePath);
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid model3d type');
      fs.unlinkSync(filePath);
    });


    it('should fail when deleting with an invalid URL/Path', async () => {
      const res = await request(app.getHttpServer()).delete('/upload-test/image').send({ url: 'http://invalid-path.com/unknown.jpg' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid image URL or path');
    });
  });
});
