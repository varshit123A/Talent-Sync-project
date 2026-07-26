declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: 'CANDIDATE' | 'RECRUITER' | 'ADMIN';
      };
    }
  }
}
export {};
