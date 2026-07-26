import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'RECRUITER' | 'CANDIDATE';
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Role-Based Access Control (RBAC) Middleware
 * Verifies that the authenticated request user has one of the required roles.
 */
export function verifyRole(allowedRoles: Array<'ADMIN' | 'RECRUITER' | 'CANDIDATE'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication token is required to access this endpoint',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `User role '${req.user.role}' is not authorized. Allowed roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
}
