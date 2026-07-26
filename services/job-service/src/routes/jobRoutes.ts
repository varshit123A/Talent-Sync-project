import { Router, Request, Response } from 'express';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';
import { redis } from '../config/redisClient';
import { publishJobCreatedEvent } from '../config/kafkaProducer';

const router = Router();
const CACHE_KEY_JOBS = 'jobs:all';
const CACHE_TTL_SECONDS = 60;

let jobsDb = [
  { id: '1', title: 'Senior Backend Engineer', company: 'TalentSync AI', location: 'Remote' },
  { id: '2', title: 'Fullstack Developer', company: 'TechCorp', location: 'New York, NY' },
];

router.get('/', async (req: Request, res: Response) => {
  try {
    const cachedJobs = await redis.get(CACHE_KEY_JOBS);

    if (cachedJobs) {
      console.log('[Cache Hit] Returning job listings from Redis');
      res.json({ source: 'cache', data: JSON.parse(cachedJobs) });
      return;
    }

    console.log('[Cache Miss] Querying database for job listings');
    await redis.setex(CACHE_KEY_JOBS, CACHE_TTL_SECONDS, JSON.stringify(jobsDb));

    res.json({ source: 'database', data: jobsDb });
  } catch (error) {
    console.error('Error in GET /jobs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/', authenticateJWT, authorizeRoles('CANDIDATE', 'RECRUITER', 'ADMIN'), async (req: Request, res: Response) => {
  const { title, company, location } = req.body;

  const newJob = {
    id: String(jobsDb.length + 1),
    title,
    company,
    location,
    postedBy: req.user?.userId || 'unknown',
  };

  // 1. Save to Database
  jobsDb.push(newJob);

  // 2. Invalidate Redis Cache
  await redis.del(CACHE_KEY_JOBS);
  console.log('[Cache Invalidation] Cleared Redis key:', CACHE_KEY_JOBS);

  // 3. Publish Async Event to Kafka
  await publishJobCreatedEvent(newJob);

  res.status(201).json({
    message: 'Job posted and event published successfully!',
    job: newJob,
  });
});

export default router;