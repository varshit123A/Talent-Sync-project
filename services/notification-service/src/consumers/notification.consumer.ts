import nodemailer from 'nodemailer';
import { Server as SocketIOServer } from 'socket.io';
import { KafkaClient } from '../../shared/kafkaClient';

export interface ScreenedNotificationEvent {
  applicationId: string;
  candidateId: string;
  jobId: string;
  matchScore: number;
  summary: string;
  screenedAt: string;
}

export interface StatusUpdatedNotificationEvent {
  applicationId: string;
  candidateId?: string;
  status: 'ACCEPTED' | 'REJECTED' | 'SCREENED';
  updatedAt: string;
}

export class NotificationConsumer {
  private kafkaClient: KafkaClient;
  private mailTransporter: nodemailer.Transporter;
  private io: SocketIOServer | null = null;

  constructor(ioServer?: SocketIOServer) {
    this.kafkaClient = KafkaClient.getInstance();
    this.io = ioServer || null;

    // Initialize Nodemailer SMTP Transporter
    this.mailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
      port: parseInt(process.env.SMTP_PORT || '2525', 10),
      auth: {
        user: process.env.SMTP_USER || 'dummy_user',
        pass: process.env.SMTP_PASS || 'dummy_pass',
      },
    });
  }

  public async startListening(): Promise<void> {
    console.log('[NotificationService] Listening for Kafka notification topics...');

    await this.kafkaClient.getConsumer(
      'notification-service-group',
      ['application.screened', 'application.status.updated'],
      async (topic: string, message: any) => {
        if (topic === 'application.screened') {
          await this.handleApplicationScreened(message);
        } else if (topic === 'application.status.updated') {
          await this.handleStatusUpdated(message);
        }
      }
    );
  }

  private async handleApplicationScreened(event: ScreenedNotificationEvent): Promise<void> {
    console.log(`[NotificationService] Processing 'application.screened' for App ${event.applicationId}`);

    const payload = {
      type: 'APPLICATION_SCREENED',
      applicationId: event.applicationId,
      matchScore: event.matchScore,
      summary: event.summary,
      timestamp: new Date().toISOString(),
    };

    // 1. Emit Real-Time Event via Socket.IO
    if (this.io) {
      this.io.to(event.candidateId).emit('notification', payload);
      this.io.emit('recruiter_alert', payload);
      console.log(`[NotificationService] Emitted Socket.IO event to room ${event.candidateId}`);
    }

    // 2. Send Email Notification via Nodemailer
    try {
      await this.mailTransporter.sendMail({
        from: '"TalentSync AI" <notifications@talentsync.ai>',
        to: 'candidate@example.com',
        subject: `[TalentSync] AI Screening Completed - Match Score: ${event.matchScore}%`,
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>AI Screening Results Ready</h2>
            <p>Your application <strong>${event.applicationId}</strong> has been screened by our AI Engine.</p>
            <p><strong>Match Score:</strong> ${event.matchScore}%</p>
            <p><strong>Summary:</strong> ${event.summary}</p>
          </div>
        `,
      });
      console.log(`[NotificationService] Email sent successfully for App ${event.applicationId}`);
    } catch (mailErr) {
      console.warn('[NotificationService] Email delivery warning (SMTP mock):', mailErr);
    }
  }

  private async handleStatusUpdated(event: StatusUpdatedNotificationEvent): Promise<void> {
    console.log(`[NotificationService] Processing 'application.status.updated' for App ${event.applicationId}`);

    const payload = {
      type: 'APPLICATION_STATUS_UPDATED',
      applicationId: event.applicationId,
      status: event.status,
      timestamp: new Date().toISOString(),
    };

    if (this.io && event.candidateId) {
      this.io.to(event.candidateId).emit('notification', payload);
    }
  }
}
