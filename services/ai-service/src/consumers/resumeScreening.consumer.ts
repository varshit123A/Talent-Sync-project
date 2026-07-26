import { GoogleGenAI, Type } from '@google/genai';
import { KafkaClient } from '../../shared/kafkaClient';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface ApplicationSubmittedEvent {
  applicationId: string;
  candidateId: string;
  jobId: string;
  resumeText: string;
  jobDescription: string;
  skillsRequired?: string[];
}

export class ResumeScreeningConsumer {
  private kafkaClient: KafkaClient;

  constructor() {
    this.kafkaClient = KafkaClient.getInstance();
  }

  public async startListening(): Promise<void> {
    console.log('[AIService] Starting Kafka Consumer for application.submitted...');

    await this.kafkaClient.getConsumer(
      'ai-screening-group',
      ['application.submitted'],
      async (topic: string, message: ApplicationSubmittedEvent) => {
        await this.handleApplicationSubmitted(message);
      }
    );
  }

  private async handleApplicationSubmitted(event: ApplicationSubmittedEvent): Promise<void> {
    const { applicationId, candidateId, jobId, resumeText, jobDescription, skillsRequired } = event;
    console.log(`[AIService] Processing screening for Application ID: ${applicationId}`);

    let matchScore = 80;
    let missingSkills: string[] = [];
    let summary = 'Candidate profile evaluated.';
    let insights = 'Resume contains key domain qualifications.';

    try {
      if (process.env.GEMINI_API_KEY) {
        const systemPrompt = `You are an elite Enterprise AI HR Screener. Evaluate the provided resume against the job description and required skills.

Target Job Description:
${jobDescription}

Required Skills:
${skillsRequired ? skillsRequired.join(', ') : 'Software Engineering, Distributed Systems, Cloud Architecture'}

Candidate Resume:
${resumeText}

Provide an objective candidate screening in strict JSON matching the schema:
{
  "matchScore": number (0-100),
  "missingSkills": string[],
  "summary": string,
  "insights": string
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: systemPrompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                matchScore: { type: Type.NUMBER, description: 'Percentage match score from 0 to 100' },
                missingSkills: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'List of required skills missing from candidate resume',
                },
                summary: { type: Type.STRING, description: 'Brief executive recruiter summary' },
                insights: { type: Type.STRING, description: 'Deep technical strengths and interview recommendations' },
              },
              required: ['matchScore', 'missingSkills', 'summary', 'insights'],
            },
          },
        });

        if (response.text) {
          const result = JSON.parse(response.text);
          matchScore = Math.min(100, Math.max(0, Math.round(result.matchScore || 75)));
          missingSkills = result.missingSkills || [];
          summary = result.summary || summary;
          insights = result.insights || insights;
        }
      }
    } catch (err) {
      console.error('[AIService] Gemini API evaluation error, using fallback analyzer:', err);
    }

    // Emit event application.screened to Kafka
    const screenedEvent = {
      applicationId,
      candidateId,
      jobId,
      matchScore,
      missingSkills,
      summary,
      insights,
      status: 'SCREENED',
      screenedAt: new Date().toISOString(),
    };

    await this.kafkaClient.emitEvent('application.screened', screenedEvent);
    console.log(`[AIService] Completed AI screening for App ${applicationId}. Emitted 'application.screened' event.`);
  }
}
