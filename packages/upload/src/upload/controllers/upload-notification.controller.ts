import { Controller, Sse, Param, MessageEvent, Logger } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { UploadJobService } from '../services/upload-job.service';
import { IUploadObserver } from '../interfaces/IUploadObserver.interface';

@Controller('upload/jobs')
export class UploadNotificationController implements IUploadObserver {
  private readonly logger = new Logger(UploadNotificationController.name);
  private readonly eventSubject = new Subject<{ jobId: string; type: string; data: any }>();

  constructor(private readonly jobService: UploadJobService) {
    // Register self as an observer to get job events
    this.jobService.addObserver(this);
  }

  // Implementing IUploadObserver callbacks
  onJobCreated(job: any): void {
    this.eventSubject.next({ jobId: job.jobId, type: 'created', data: job });
  }

  onJobProgress(jobId: string, progress: number): void {
    this.eventSubject.next({ jobId, type: 'progress', data: { progress } });
  }

  onJobCompleted(jobId: string, result: any): void {
    this.eventSubject.next({ jobId, type: 'completed', data: result });
  }

  onJobFailed(jobId: string, error: string): void {
    this.eventSubject.next({ jobId, type: 'failed', data: { error } });
  }

  // Empty implementations for other observer actions
  onUploadSuccess(): void {}
  onUploadError(): void {}
  onDeleteSuccess(): void {}
  onDeleteError(): void {}

  @Sse(':jobId/stream')
  streamJobProgress(@Param('jobId') jobId: string): Observable<MessageEvent> {
    this.logger.log(`Client subscribed to SSE updates for job: ${jobId}`);
    return this.eventSubject.asObservable().pipe(
      filter(event => event.jobId === jobId),
      map(event => ({
        data: {
          type: event.type,
          ...event.data
        }
      }))
    );
  }
}
