import { Request, Response } from 'express';
import { KafkaClient } from '../../shared/kafkaClient';

export class ApplicationController {
  private kafkaClient: KafkaClient;

  constructor() {
    this.kafkaClient = KafkaClient.getInstance();
  }

  /**
   * Submit Job Application
   * Uploads resume, records application in DB, and emits application.submitted Kafka event
   */
  public applyForJob = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { candidateId, jobId, resumeUrl, resumeText, jobDescription } = req.body;

      if (!candidateId || !jobId || (!resumeUrl && !resumeText)) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'candidateId, jobId, and either resumeUrl or resumeText are required.',
        });
      }

      const applicationId = `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const submittedAt = new Date().toISOString();

      const newApplication = {
        id: applicationId,
        candidateId,
        jobId,
        resumeUrl: resumeUrl || 'https://talentsync-resumes.s3.amazonaws.com/uploads/candidate_cv.pdf',
        resumeText: resumeText || '',
        status: 'PENDING',
        matchScore: null,
        recruiterSummary: null,
        missingSkills: [],
        submittedAt,
      };

      // 1. Emit Kafka Event application.submitted for async processing by AI Screening Service
      const kafkaPayload = {
        applicationId,
        candidateId,
        jobId,
        resumeText: resumeText || '',
        resumeUrl: newApplication.resumeUrl,
        jobDescription: jobDescription || '',
        submittedAt,
      };

      await this.kafkaClient.emitEvent('application.submitted', kafkaPayload);

      console.log(`[ApplicationService] Application ${applicationId} submitted & Kafka event emitted.`);

      return res.status(202).json({
        message: 'Application received successfully. AI resume screening queued.',
        application: newApplication,
      });
    } catch (error) {
      console.error('[ApplicationController.applyForJob] Error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to process job application submission.',
      });
    }
  };

  /**
   * Update Application Status (ACCEPT / REJECT)
   */
  public updateStatus = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { applicationId } = req.params;
      const { status } = req.body;

      if (!['ACCEPTED', 'REJECTED', 'SCREENED'].includes(status)) {
        return res.status(400).json({ error: 'Invalid application status' });
      }

      // Emit Kafka event application.status.updated
      await this.kafkaClient.emitEvent('application.status.updated', {
        applicationId,
        status,
        updatedAt: new Date().toISOString(),
      });

      return res.json({
        message: `Application ${applicationId} status updated to ${status}`,
        applicationId,
        status,
      });
    } catch (error) {
      console.error('[ApplicationController.updateStatus] Error:', error);
      return res.status(500).json({ error: 'Failed to update application status' });
    }
  };
}
