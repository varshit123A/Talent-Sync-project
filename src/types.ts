export type UserRole = 'ADMIN' | 'RECRUITER' | 'CANDIDATE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Job {
  id: string;
  recruiterId: string;
  recruiterName: string;
  title: string;
  description: string;
  skillsRequired: string[];
  salaryMin: number;
  salaryMax: number;
  location: string;
  status: 'OPEN' | 'PAUSED' | 'CLOSED';
  postedAt: string;
}

export interface Application {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobId: string;
  jobTitle: string;
  resumeUrl: string;
  resumeText: string;
  status: 'PENDING' | 'SCREENED' | 'ACCEPTED' | 'REJECTED';
  matchScore: number | null;
  recruiterSummary: string | null;
  missingSkills: string[];
  aiInsights: string | null;
  submittedAt: string;
}

export interface NotificationPayload {
  id: string;
  type: 'APPLICATION_SCREENED' | 'APPLICATION_STATUS_UPDATED' | 'JOB_POSTED';
  applicationId?: string;
  jobTitle?: string;
  candidateName?: string;
  matchScore?: number;
  recruiterSummary?: string;
  missingSkills?: string[];
  timestamp: string;
  read: boolean;
}

export interface SystemHealth {
  status: string;
  timestamp: string;
  services: {
    gateway: string;
    authService: string;
    jobService: string;
    applicationService: string;
    aiService: string;
    notificationService: string;
    redisCacheHits: number;
  };
}
