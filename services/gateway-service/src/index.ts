import express, { Request, Response } from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:5001';
const JOB_SERVICE_URL = process.env.JOB_SERVICE_URL || 'http://job-service:5002';
const APPLICATION_SERVICE_URL = process.env.APPLICATION_SERVICE_URL || 'http://application-service:5003';

// 1. Auth Service Proxy (/api/auth/register -> http://auth-service:5001/register)
app.use('/api/auth', createProxyMiddleware({
  target: AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '', // Strips /api/auth prefix before forwarding
  },
  onError: (err, req, res) => {
    console.error('[gateway-service] Auth Proxy Error:', err);
    res.status(502).json({ error: 'Bad Gateway: Could not connect to Auth Service' });
  }
}));

// 2. Job Service Proxy
app.use('/api/jobs', createProxyMiddleware({
  target: JOB_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/jobs': '',
  },
}));

// 3. Application Service Proxy
app.use('/api/applications', createProxyMiddleware({
  target: APPLICATION_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/applications': '',
  },
}));

// Gateway Health Check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'gateway-service' });
});

app.listen(PORT, () => {
  console.log(`[gateway-service] Running on port ${PORT}`);
});