import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { UploadJobService } from '../services/upload-job.service';

@Controller('upload/webhooks')
export class UploadWebhookController {
  private readonly logger = new Logger(UploadWebhookController.name);

  constructor(private readonly jobService: UploadJobService) {}

  @Post('cloudinary')
  @HttpCode(HttpStatus.OK)
  async handleCloudinaryWebhook(@Body() body: any) {
    this.logger.log(`Received Cloudinary webhook notification: ${JSON.stringify(body)}`);

    const { notification_type, public_id, secure_url, status, error } = body;
    
    // Resolve jobId from context custom fields
    let jobId = body.context?.custom?.jobId;
    
    if (!jobId && public_id) {
      // Fallback: If jobId is embedded in public_id (e.g. job_xxx_filename)
      const match = public_id.match(/(job_[a-z0-9_]+)/i);
      if (match) {
        jobId = match[1];
      }
    }

    if (!jobId) {
      this.logger.warn(`Could not resolve jobId from webhook body for public_id: ${public_id}`);
      return { received: true, error: 'No jobId found' };
    }

    const job = await this.jobService.getJob(jobId);
    if (!job) {
      this.logger.warn(`No active upload job found for jobId: ${jobId}`);
      return { received: true, error: 'Job not found' };
    }

    if (notification_type === 'eager' || notification_type === 'upload') {
      if (status === 'failed') {
        const errorMsg = error?.message || 'Processing/transcoding failed';
        await this.jobService.failJob(jobId, errorMsg);
        this.logger.error(`Job ${jobId} failed via webhook callback: ${errorMsg}`);
      } else {
        // Complete the job with the webhook-updated secure url
        const resultPayload = {
          url: secure_url || job.result?.url,
          size: body.bytes || job.size,
          filename: job.filename,
          type: job.type,
          format: body.format,
          width: body.width,
          height: body.height,
          duration: body.duration,
        };
        await this.jobService.completeJob(jobId, resultPayload);
        this.logger.log(`Job ${jobId} completed successfully via webhook callback`);
      }
    }

    return { received: true };
  }
}
