import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { storeRefreshToken, validateRefreshToken, invalidateRefreshToken } from '../utils/redis';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_access_key_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super_secret_jwt_refresh_key_2026';

// Mock DB reference for standalone service structure
const userDbMock = new Map<string, any>();

export class AuthController {
  /**
   * Local Registration with Password Hashing
   */
  public async register(req: Request, res: Response): Promise<Response> {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
      }

      if (userDbMock.has(email)) {
        return res.status(409).json({ error: 'User already exists with this email address.' });
      }

      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const userId = `usr_${Date.now()}`;
      const userRole = role && ['ADMIN', 'RECRUITER', 'CANDIDATE'].includes(role) ? role : 'CANDIDATE';

      const newUser = {
        id: userId,
        name,
        email,
        passwordHash,
        role: userRole,
        createdAt: new Date().toISOString(),
      };

      userDbMock.set(email, newUser);

      // Generate Tokens
      const accessToken = jwt.sign(
        { id: newUser.id, email: newUser.email, role: newUser.role },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { id: newUser.id, email: newUser.email },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      // Store Refresh Token in Redis with TTL (7 days = 604800s)
      await storeRefreshToken(newUser.id, refreshToken, 604800);

      return res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error('[AuthController.register] Error:', error);
      return res.status(500).json({ error: 'Internal Server Error during registration' });
    }
  }

  /**
   * Local Login
   */
  public async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const user = userDbMock.get(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      // Generate Pair Tokens
      const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { id: user.id, email: user.email },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      // Store Refresh Token in Redis
      await storeRefreshToken(user.id, refreshToken, 604800);

      return res.json({
        message: 'Authentication successful',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error('[AuthController.login] Error:', error);
      return res.status(500).json({ error: 'Internal Server Error during login' });
    }
  }

  /**
   * Refresh Token Rotation Mechanism:
   * 1. Validates access token / refresh token
   * 2. Checks active status in Redis
   * 3. Invalidates/blacklists the used refresh token
   * 4. Issues a fresh pair of access & refresh tokens
   */
  public async refreshTokenRotation(req: Request, res: Response): Promise<Response> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
      }

      let payload: any;
      try {
        payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
      } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired refresh token' });
      }

      const userId = payload.id;

      // Validate in Redis Token Store
      const isActive = await validateRefreshToken(userId, refreshToken);
      if (!isActive) {
        return res.status(401).json({ error: 'Refresh token has been revoked or reused' });
      }

      // Invalidate used refresh token
      await invalidateRefreshToken(userId, refreshToken);

      // Fetch user details
      const user = Array.from(userDbMock.values()).find((u) => u.id === userId) || {
        id: userId,
        email: payload.email,
        role: 'CANDIDATE',
      };

      // Issue NEW Access and Refresh Token pair
      const newAccessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      const newRefreshToken = jwt.sign(
        { id: user.id, email: user.email },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      // Store fresh Refresh Token in Redis
      await storeRefreshToken(user.id, newRefreshToken, 604800);

      return res.json({
        message: 'Token rotated successfully',
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      console.error('[AuthController.refreshTokenRotation] Error:', error);
      return res.status(500).json({ error: 'Internal Server Error during token refresh' });
    }
  }

  /**
   * Google OAuth Callback Endpoint
   */
  public async googleOAuthCallback(req: Request, res: Response): Promise<Response> {
    try {
      const { googleId, name, email } = req.body;

      let user = Array.from(userDbMock.values()).find((u) => u.googleId === googleId || u.email === email);

      if (!user) {
        user = {
          id: `usr_g_${Date.now()}`,
          name: name || 'Google User',
          email,
          googleId,
          role: 'CANDIDATE',
          createdAt: new Date().toISOString(),
        };
        userDbMock.set(email, user);
      }

      const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { id: user.id, email: user.email },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      await storeRefreshToken(user.id, refreshToken, 604800);

      return res.json({
        message: 'Google OAuth authentication successful',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error('[AuthController.googleOAuthCallback] Error:', error);
      return res.status(500).json({ error: 'Google OAuth processing failed' });
    }
  }
}
