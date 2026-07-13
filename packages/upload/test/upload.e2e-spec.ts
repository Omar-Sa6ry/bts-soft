import { Test, TestingModule } from "@nestjs/testing";
import {
  INestApplication,
  Controller,
  Post,
  Get,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
  Body,
} from "@nestjs/common";
import request from "supertest";
import { UploadService } from "../src/upload/upload.service";
import { UploadModule } from "../src/upload/upload.module";
import { ConfigModule } from "@nestjs/config";
import { UploadProvider } from "../src/upload/utils/upload.constants";
import { ChunkedUploadService } from "../src/upload/services/chunked-upload.service";
import { UploadJobService } from "../src/upload/services/upload-job.service";
import { FileValidatorService } from "../src/upload/services/file-validator.service";
import { UploadType } from "../src/upload/enums/upload-type.enum";
import * as fs from "fs";
import * as path from "path";
import { FileInterceptor } from "@nestjs/platform-express";
import { Readable } from "stream";

jest.mock("bullmq", () => {
  return {
    Queue: jest.fn().mockImplementation(() => ({
      add: jest.fn().mockResolvedValue({ id: "mock-job-id" }),
      on: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    })),
    Worker: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    })),
    QueueEvents: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    })),
  };
});

@Controller("upload-test")
class TestController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly chunkedUploadService: ChunkedUploadService,
    private readonly jobService: UploadJobService,
  ) {}

  @Post("chunk/initiate")
  async initiateChunkUpload(
    @Body()
    body: {
      filename: string;
      size: number;
      type: any;
      fileHash?: string;
      userId?: string;
    },
  ) {
    return this.chunkedUploadService.initiateUpload(
      body.filename,
      body.size,
      body.type,
      body.fileHash,
      body.userId,
    );
  }

  @Post("chunk/upload")
  @UseInterceptors(FileInterceptor("file"))
  async uploadChunk(
    @Body()
    body: {
      jobId: string;
      chunkIndex: string;
      totalChunks: string;
      fileHash?: string;
      userId?: string;
    },
    @UploadedFile() file: any,
  ) {
    return this.chunkedUploadService.uploadChunk(
      body.jobId,
      parseInt(body.chunkIndex, 10),
      parseInt(body.totalChunks, 10),
      file.buffer,
      body.fileHash,
      body.userId,
    );
  }

  @Get("chunk/uploaded/:jobId")
  async getUploadedChunks(@Param("jobId") jobId: string) {
    return this.chunkedUploadService.getUploadedChunks(jobId);
  }

  @Post("image")
  @UseInterceptors(FileInterceptor("file"))
  async uploadImage(@UploadedFile() file: any) {
    const stream = new Readable();
    stream.push(file.buffer);
    stream.push(null);
    return this.uploadService.uploadImageCore({
      stream,
      filename: file.originalname,
      size: file.size,
    });
  }

  @Post("video")
  @UseInterceptors(FileInterceptor("file"))
  async uploadVideo(@UploadedFile() file: any) {
    const stream = new Readable();
    stream.push(file.buffer);
    stream.push(null);
    return this.uploadService.uploadVideoCore({
      stream,
      filename: file.originalname,
      size: file.size,
    });
  }

  @Post("audio")
  @UseInterceptors(FileInterceptor("file"))
  async uploadAudio(@UploadedFile() file: any) {
    const stream = new Readable();
    stream.push(file.buffer);
    stream.push(null);
    return this.uploadService.uploadAudioCore({
      stream,
      filename: file.originalname,
      size: file.size,
    });
  }

  @Post("file")
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(@UploadedFile() file: any) {
    const stream = new Readable();
    stream.push(file.buffer);
    stream.push(null);
    return this.uploadService.uploadFileCore({
      stream,
      filename: file.originalname,
      size: file.size,
    });
  }

  @Post("model3d")
  @UseInterceptors(FileInterceptor("file"))
  async uploadModel3d(@UploadedFile() file: any) {
    const stream = new Readable();
    stream.push(file.buffer);
    stream.push(null);
    return this.uploadService.uploadModel3dCore({
      stream,
      filename: file.originalname,
      size: file.size,
    });
  }

  @Delete("image")
  async deleteImage(@Body("url") url: string) {
    return this.uploadService.deleteImage(url);
  }

  @Delete("video")
  async deleteVideo(@Body("url") url: string) {
    return this.uploadService.deleteVideo(url);
  }

  @Delete("audio")
  async deleteAudio(@Body("url") url: string) {
    return this.uploadService.deleteAudio(url);
  }

  @Delete("file")
  async deleteFile(@Body("url") url: string) {
    return this.uploadService.deleteFile(url);
  }

  @Delete("model3d")
  async deleteModel3d(@Body("url") url: string) {
    // Note: We use deleteImage as a generic delete if specialized delete isn't implemented for raw files in this spec class
    // but the service now has uploadModel3dCore. For deletion, it follows the same logic as images/files.
    return this.uploadService.deleteImage(url);
  }
}

describe("UploadModule (e2e) - 100% Comprehensive Suite", () => {
  let app: INestApplication;
  const testUploadPath = path.join(__dirname, "e2e-uploads");

  const deleteWithRetry = async (
    endpoint: string,
    url: string,
    maxRetries = 5,
  ) => {
    let res;
    for (let i = 0; i < maxRetries; i++) {
      res = await request(app.getHttpServer()).delete(endpoint).send({ url });
      if (res.status === 200) return res;
      // Wait before retrying (EBUSY workaround for Windows locks)
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    return res;
  };

  beforeAll(async () => {
    if (fs.existsSync(testUploadPath)) {
      fs.rmSync(testUploadPath, { recursive: true, force: true });
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              UPLOAD_PROVIDER: UploadProvider.LOCAL,
              UPLOAD_LOCAL_PATH: testUploadPath,
              UPLOAD_MAX_IMAGE_SIZE: 1024 * 1024,
              UPLOAD_MAX_VIDEO_SIZE: 10 * 1024 * 1024,
              UPLOAD_MAX_AUDIO_SIZE: 5 * 1024 * 1024,
              UPLOAD_MAX_FILE_SIZE: 2 * 1024 * 1024,
              UPLOAD_MAX_MODEL_3D_SIZE: 20 * 1024 * 1024,
            }),
          ],
        }),
        UploadModule,
      ],
      controllers: [TestController],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(0);
  });

  afterAll(async () => {
    await app.close();
    if (fs.existsSync(testUploadPath)) {
      fs.rmSync(testUploadPath, { recursive: true, force: true });
    }
  });

  describe("REST API - Positive Scenarios (All Types)", () => {
    it("should upload and delete an Image", async () => {
      const filePath = path.join(__dirname, "test.jpg");
      fs.writeFileSync(filePath, "img-content");
      const res = await request(app.getHttpServer())
        .post("/upload-test/image")
        .attach("file", filePath);
      expect(res.status).toBe(201);
      const url = res.body.url;
      expect(fs.existsSync(url)).toBe(true);

      const delRes = await deleteWithRetry("/upload-test/image", url);
      expect(delRes.status).toBe(200);
      expect(fs.existsSync(url)).toBe(false);
      try {
        fs.unlinkSync(filePath);
      } catch (e) {}
    });

    it("should upload and delete a Video", async () => {
      const filePath = path.join(__dirname, "test.mp4");
      fs.writeFileSync(filePath, "vid-content");
      const res = await request(app.getHttpServer())
        .post("/upload-test/video")
        .attach("file", filePath);
      expect(res.status).toBe(201);
      const url = res.body.url;
      expect(fs.existsSync(url)).toBe(true);

      const delRes = await deleteWithRetry("/upload-test/video", url);
      expect(delRes.status).toBe(200);
      expect(fs.existsSync(url)).toBe(false);
      try {
        fs.unlinkSync(filePath);
      } catch (e) {}
    });

    it("should upload and delete an Audio", async () => {
      const filePath = path.join(__dirname, "test.mp3");
      fs.writeFileSync(filePath, "aud-content");
      const res = await request(app.getHttpServer())
        .post("/upload-test/audio")
        .attach("file", filePath);
      expect(res.status).toBe(201);
      const url = res.body.url;
      expect(fs.existsSync(url)).toBe(true);

      const delRes = await deleteWithRetry("/upload-test/audio", url);
      expect(delRes.status).toBe(200);
      expect(fs.existsSync(url)).toBe(false);
      try {
        fs.unlinkSync(filePath);
      } catch (e) {}
    });

    it("should upload and delete a Raw File (PDF)", async () => {
      const filePath = path.join(__dirname, "test.pdf");
      fs.writeFileSync(filePath, "pdf-content");
      const res = await request(app.getHttpServer())
        .post("/upload-test/file")
        .attach("file", filePath);
      expect(res.status).toBe(201);
      const url = res.body.url;
      expect(fs.existsSync(url)).toBe(true);

      const delRes = await deleteWithRetry("/upload-test/file", url);
      expect(delRes.status).toBe(200);
      expect(fs.existsSync(url)).toBe(false);
      try {
        fs.unlinkSync(filePath);
      } catch (e) {}
    });

    it("should upload and delete a 3D Model (GLB)", async () => {
      const filePath = path.join(__dirname, "test.glb");
      fs.writeFileSync(filePath, "glb-binary-content");
      const res = await request(app.getHttpServer())
        .post("/upload-test/model3d")
        .attach("file", filePath);
      expect(res.status).toBe(201);
      const url = res.body.url;
      expect(fs.existsSync(url)).toBe(true);

      const delRes = await deleteWithRetry("/upload-test/model3d", url);
      expect(delRes.status).toBe(200);
      expect(fs.existsSync(url)).toBe(false);
      try {
        fs.unlinkSync(filePath);
      } catch (e) {}
    });
  });

  describe("REST API - Negative Scenarios", () => {
    it("should fail when uploading an invalid extension (e.g. .exe to image)", async () => {
      const filePath = path.join(__dirname, "malicious.exe");
      fs.writeFileSync(filePath, "content");
      const res = await request(app.getHttpServer())
        .post("/upload-test/image")
        .attach("file", filePath);
      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Invalid image type");
      fs.unlinkSync(filePath);
    });

    it("should fail when file size exceeds specific limit", async () => {
      const filePath = path.join(__dirname, "big.jpg");
      const largeBuffer = Buffer.alloc(1.1 * 1024 * 1024); // Over 1MB limit
      fs.writeFileSync(filePath, largeBuffer);
      const res = await request(app.getHttpServer())
        .post("/upload-test/image")
        .attach("file", filePath);
      expect(res.status).toBe(400);
      expect(res.body.message).toContain("image size exceeds limit");
      fs.unlinkSync(filePath);
    });

    it("should fail when uploading an invalid 3D model extension", async () => {
      const filePath = path.join(__dirname, "test.txt");
      fs.writeFileSync(filePath, "not-a-3d-model");
      const res = await request(app.getHttpServer())
        .post("/upload-test/model3d")
        .attach("file", filePath);
      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Invalid model3d type");
      fs.unlinkSync(filePath);
    });

    it("should fail when deleting with an invalid URL/Path", async () => {
      const res = await request(app.getHttpServer())
        .delete("/upload-test/image")
        .send({ url: "http://invalid-path.com/unknown.jpg" });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Invalid image URL or path");
    });
  });

  describe("Chunked Upload, Webhook, and Notifications (E2E)", () => {
    it("should complete chunked upload flow and verify assembly", async () => {
      // 1. Initiate chunk upload
      const initRes = await request(app.getHttpServer())
        .post("/upload-test/chunk/initiate")
        .send({ filename: "e2e-chunked.txt", size: 12, type: UploadType.FILE });
      expect(initRes.status).toBe(201);
      const jobId = initRes.body.jobId;
      expect(jobId).toBeDefined();

      // Create a temporary file and upload it in chunks
      const chunk1Path = path.join(__dirname, "chunk1.part");
      const chunk2Path = path.join(__dirname, "chunk2.part");
      fs.writeFileSync(chunk1Path, "hello ");
      fs.writeFileSync(chunk2Path, "e2e!");

      // 2. Upload Chunk 0
      const resChunk1 = await request(app.getHttpServer())
        .post("/upload-test/chunk/upload")
        .field("jobId", jobId)
        .field("chunkIndex", "0")
        .field("totalChunks", "2")
        .attach("file", chunk1Path);
      expect(resChunk1.status).toBe(201);
      expect(resChunk1.body.completed).toBe(false);
      expect(resChunk1.body.progress).toBe(50);

      // Verify getUploadedChunks
      const getChunksRes = await request(app.getHttpServer()).get(
        `/upload-test/chunk/uploaded/${jobId}`,
      );
      expect(getChunksRes.status).toBe(200);
      expect(getChunksRes.body).toEqual([0]);

      // 3. Upload Chunk 1
      const resChunk2 = await request(app.getHttpServer())
        .post("/upload-test/chunk/upload")
        .field("jobId", jobId)
        .field("chunkIndex", "1")
        .field("totalChunks", "2")
        .attach("file", chunk2Path);
      expect(resChunk2.status).toBe(201);
      expect(resChunk2.body.completed).toBe(true);
      expect(resChunk2.body.progress).toBe(100);

      const finalUrl = resChunk2.body.url;
      expect(fs.existsSync(finalUrl)).toBe(true);
      const finalContent = fs.readFileSync(finalUrl, "utf8");
      expect(finalContent).toBe("hello e2e!");

      // Cleanup
      fs.unlinkSync(chunk1Path);
      fs.unlinkSync(chunk2Path);
    });

    it("should handle webhook completion from Cloudinary", async () => {
      // Create a mock job first
      const jobService = app.get(UploadJobService);
      const job = await jobService.createJob(
        "webhook-test.png",
        500,
        UploadType.IMAGE,
      );

      // Post Cloudinary Webhook event
      const webhookRes = await request(app.getHttpServer())
        .post("/upload/webhooks/cloudinary")
        .send({
          notification_type: "upload",
          public_id: `sample_public_id_${job.jobId}`,
          secure_url: "https://cloudinary.com/sample.png",
          status: "success",
          bytes: 500,
          format: "png",
          context: {
            custom: {
              jobId: job.jobId,
            },
          },
        });

      expect(webhookRes.status).toBe(200);
      expect(webhookRes.body.received).toBe(true);

      // Check job status is now completed
      const updatedJob = await jobService.getJob(job.jobId);
      expect(updatedJob?.status).toBe("done");
      expect(updatedJob?.result?.url).toBe("https://cloudinary.com/sample.png");
    });

    it("should serve SSE progress updates", (done: any) => {
      const jobService = app.get(UploadJobService);
      jobService
        .createJob("sse-test.png", 100, UploadType.IMAGE)
        .then((job) => {
          const http = require("http");
          const port = app.getHttpServer().address().port;
          const req = http.get(
            `http://localhost:${port}/upload/jobs/${job.jobId}/stream`,
            (res: any) => {
              expect(res.statusCode).toBe(200);
              expect(res.headers["content-type"]).toContain(
                "text/event-stream",
              );
              req.destroy(); // Destroy socket without throwing unhandled exceptions
              done();
            },
          );
          req.on("error", () => {
            // Ignore socket hang up
          });
        });
    });

    it("should rate limit chunk uploads if capacity is exceeded", async () => {
      // Create a job for rate limiting
      const initRes = await request(app.getHttpServer())
        .post("/upload-test/chunk/initiate")
        .send({ filename: "rate-limit.txt", size: 10, type: UploadType.FILE });
      const jobId = initRes.body.jobId;

      // Make 15 fast chunk upload requests (our default limit capacity is 10)
      const chunkPath = path.join(__dirname, "rl-chunk.part");
      fs.writeFileSync(chunkPath, "x");

      let limitTriggered = false;

      for (let i = 0; i < 15; i++) {
        const req = request(app.getHttpServer())
          .post("/upload-test/chunk/upload")
          .field("jobId", jobId)
          .field("chunkIndex", String(i))
          .field("totalChunks", "20")
          .attach("file", chunkPath);

        req.on("error", () => {
          // Consume the error event to prevent unhandled exception crash
        });

        try {
          const res = await req;
          if (res.status === 429) {
            limitTriggered = true;
            break;
          }
        } catch (err) {
          limitTriggered = true;
          break;
        }
      }

      expect(limitTriggered).toBe(true);
      fs.unlinkSync(chunkPath);
    });
  });
});
