import { Request, Response } from 'express';
import crypto from 'crypto';
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://:secure_redis_pass_2026@localhost:6379';
const redis = new Redis(redisUrl, { lazyConnect: true });

// Mock Job Repository for Standalone Microservice
const mockJobsDb = [
  {
    id: 'job_001',
    recruiterId: 'rec_1001',
    title: 'Senior Distributed Systems Engineer',
    description: 'Lead backend architect responsible for high throughput microservices, Redis caching, and Kafka event streaming.',
    skillsRequired: ['Node.js', 'TypeScript', 'PostgreSQL', 'Redis', 'Kafka', 'Docker'],
    salaryMin: 140000,
    salaryMax: 185000,
    location: 'San Francisco, CA',
    status: 'OPEN',
    postedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'job_002',
    recruiterId: 'rec_1001',
    title: 'Full Stack React & Node Engineer',
    description: 'Build modern user-facing applications using React 19, Tailwind CSS, TypeScript, and Socket.IO real-time websockets.',
    skillsRequired: ['React', 'TypeScript', 'Tailwind CSS', 'Node.js', 'Socket.IO'],
    salaryMin: 120000,
    salaryMax: 160000,
    location: 'Remote',
    status: 'OPEN',
    postedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
];

export class JobController {
  /**
   * Deterministic SHA256 Key Generator for Redis Cache-Aside
   */
  private generateCacheKey(queryParams: any): string {
    const sortedString = JSON.stringify(queryParams, Object.keys(queryParams).sort());
    const hash = crypto.createHash('sha256').update(sortedString).digest('hex');
    return `jobs:search:${hash}`;
  }

  /**
   * GET /api/v1/jobs - Dynamic Search with Redis Cache-Aside & Cursor Pagination
   */
  public searchJobs = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { q, skills, minSalary, maxSalary, location, cursor, limit = '10' } = req.query;

      const cacheKey = this.generateCacheKey(req.query);

      // 1. Redis Cache-Aside Lookup
      try {
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
          console.log(`[JobService - Redis CACHE HIT] Key: ${cacheKey}`);
          return res.json({
            source: 'REDIS_CACHE_HIT',
            ...JSON.parse(cachedData),
          });
        }
      } catch (redisErr) {
        console.warn('[JobService] Redis read failed, falling back to database query:', redisErr);
      }

      console.log(`[JobService - Database Query MISS] Key: ${cacheKey}`);

      // 2. Query DB with Dynamic Filtering & Cursor Pagination
      let filteredJobs = [...mockJobsDb];

      if (q && typeof q === 'string') {
        const term = q.toLowerCase();
        filteredJobs = filteredJobs.filter(
          (j) => j.title.toLowerCase().includes(term) || j.description.toLowerCase().includes(term)
        );
      }

      if (skills) {
        const skillList = String(skills)
          .split(',')
          .map((s) => s.trim().toLowerCase());
        filteredJobs = filteredJobs.filter((j) =>
          j.skillsRequired.some((sk) => skillList.includes(sk.toLowerCase()))
        );
      }

      if (minSalary) {
        const minSal = parseInt(String(minSalary), 10);
        if (!isNaN(minSal)) {
          filteredJobs = filteredJobs.filter((j) => j.salaryMax >= minSal);
        }
      }

      if (location && typeof location === 'string') {
        const loc = location.toLowerCase();
        filteredJobs = filteredJobs.filter((j) => j.location.toLowerCase().includes(loc));
      }

      // Cursor Pagination Logic
      const pageSize = parseInt(String(limit), 10) || 10;
      let startIndex = 0;

      if (cursor && typeof cursor === 'string') {
        const foundIndex = filteredJobs.findIndex((j) => j.id === cursor);
        if (foundIndex !== -1) {
          startIndex = foundIndex + 1;
        }
      }

      const paginatedJobs = filteredJobs.slice(startIndex, startIndex + pageSize);
      const nextCursor = paginatedJobs.length > 0 ? paginatedJobs[paginatedJobs.length - 1].id : null;

      const responsePayload = {
        jobs: paginatedJobs,
        totalCount: filteredJobs.length,
        nextCursor,
        fetchedAt: new Date().toISOString(),
      };

      // 3. Populate Redis Cache with 300 Seconds TTL
      try {
        await redis.set(cacheKey, JSON.stringify(responsePayload), 'EX', 300);
        console.log(`[JobService] Populated Redis Cache for key: ${cacheKey}`);
      } catch (redisWriteErr) {
        console.warn('[JobService] Failed to set Redis cache:', redisWriteErr);
      }

      return res.json({
        source: 'POSTGRES_DB_QUERY',
        ...responsePayload,
      });
    } catch (error) {
      console.error('[JobController.searchJobs] Error:', error);
      return res.status(500).json({ error: 'Internal Server Error during job search' });
    }
  };

  /**
   * POST /api/v1/jobs - Create Job & Invalidate Redis Cache-Aside Keys
   */
  public createJob = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { recruiterId, title, description, skillsRequired, salaryMin, salaryMax, location } = req.body;

      if (!title || !description) {
        return res.status(400).json({ error: 'Job title and description are required' });
      }

      const newJob = {
        id: `job_${Date.now()}`,
        recruiterId: recruiterId || 'rec_1001',
        title,
        description,
        skillsRequired: skillsRequired || [],
        salaryMin: Number(salaryMin) || 100000,
        salaryMax: Number(salaryMax) || 150000,
        location: location || 'Remote',
        status: 'OPEN',
        postedAt: new Date().toISOString(),
      };

      mockJobsDb.unshift(newJob);

      // Invalidate all job search cache keys in Redis
      try {
        const keys = await redis.keys('jobs:search:*');
        if (keys.length > 0) {
          await redis.del(...keys);
          console.log(`[JobService Cache Invalidation] Cleared ${keys.length} cached search keys.`);
        }
      } catch (redisDelErr) {
        console.warn('[JobService Cache Invalidation Error]', redisDelErr);
      }

      return res.status(201).json({
        message: 'Job posting created successfully. Redis cache invalidated.',
        job: newJob,
      });
    } catch (error) {
      console.error('[JobController.createJob] Error:', error);
      return res.status(500).json({ error: 'Internal Server Error while creating job posting' });
    }
  };
}

