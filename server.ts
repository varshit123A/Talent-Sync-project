import express, { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const PORT = 3000;

// Initialize Google Gemini AI SDK
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// In-Memory Database and Redis Simulation Cache for full runnable demo
interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "ADMIN" | "RECRUITER" | "CANDIDATE";
  createdAt: string;
}

interface Job {
  id: string;
  recruiterId: string;
  recruiterName: string;
  title: string;
  description: string;
  skillsRequired: string[];
  salaryMin: number;
  salaryMax: number;
  location: string;
  status: "OPEN" | "PAUSED" | "CLOSED";
  postedAt: string;
}

interface Application {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobId: string;
  jobTitle: string;
  resumeUrl: string;
  resumeText: string;
  status: "PENDING" | "SCREENED" | "ACCEPTED" | "REJECTED";
  matchScore: number | null;
  recruiterSummary: string | null;
  missingSkills: string[];
  aiInsights: string | null;
  submittedAt: string;
}

// Initial Mock Seed Data
const usersDb: User[] = [
  {
    id: "usr-rec-001",
    name: "Sarah Jenkins (Senior Talent Lead)",
    email: "recruiter@talentsync.ai",
    passwordHash: "$2a$10$e8T7A.dummyhash123", // password: password123
    role: "RECRUITER",
    createdAt: new Date().toISOString(),
  },
  {
    id: "usr-can-001",
    name: "Alex Rivera",
    email: "alex.rivera@example.com",
    passwordHash: "$2a$10$e8T7A.dummyhash123",
    role: "CANDIDATE",
    createdAt: new Date().toISOString(),
  },
];

const jobsDb: Job[] = [
  {
    id: "job-101",
    recruiterId: "usr-rec-001",
    recruiterName: "Sarah Jenkins",
    title: "Senior Full-Stack Distributed Systems Engineer",
    description:
      "Looking for an expert engineer proficient in Node.js, TypeScript, PostgreSQL, Redis cache-aside patterns, Kafka event-driven architectures, React, and Tailwind CSS. You will architect high-throughput microservices and AI integrations.",
    skillsRequired: [
      "Node.js",
      "TypeScript",
      "PostgreSQL",
      "Redis",
      "Kafka",
      "React",
      "Tailwind CSS",
    ],
    salaryMin: 140000,
    salaryMax: 180000,
    location: "San Francisco, CA (Hybrid)",
    status: "OPEN",
    postedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "job-102",
    recruiterId: "usr-rec-001",
    recruiterName: "Sarah Jenkins",
    title: "AI & Machine Learning Infrastructure Architect",
    description:
      "Join our core AI team building scalable model serving pipelines using Google Gemini API, Python, Vector DBs, Kubernetes, and event-driven microservices.",
    skillsRequired: [
      "Python",
      "Gemini API",
      "Kubernetes",
      "Kafka",
      "PostgreSQL",
      "Docker",
    ],
    salaryMin: 160000,
    salaryMax: 210000,
    location: "Remote (US/Canada)",
    status: "OPEN",
    postedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "job-103",
    recruiterId: "usr-rec-001",
    recruiterName: "Sarah Jenkins",
    title: "Lead Frontend Engineer (React & Realtime Systems)",
    description:
      "Seeking a frontend wizard with deep React 19 expertise, Socket.IO real-time state management, Tailwind CSS, high-performance dashboards, and complex data visualization.",
    skillsRequired: ["React", "TypeScript", "Tailwind CSS", "Socket.IO", "Vite"],
    salaryMin: 130000,
    salaryMax: 165000,
    location: "New York, NY (Remote)",
    status: "OPEN",
    postedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

const applicationsDb: Application[] = [
  {
    id: "app-901",
    candidateId: "usr-can-001",
    candidateName: "Alex Rivera",
    candidateEmail: "alex.rivera@example.com",
    jobId: "job-101",
    jobTitle: "Senior Full-Stack Distributed Systems Engineer",
    resumeUrl: "https://talentsync-resumes.s3.amazonaws.com/alex_rivera_cv.pdf",
    resumeText:
      "Alex Rivera - Senior Software Engineer with 6 years experience in Node.js, TypeScript, React, PostgreSQL, Docker, and Express. Built REST APIs and microservices. Familiar with Redis cache and basic Kafka pub/sub systems.",
    status: "SCREENED",
    matchScore: 88,
    recruiterSummary:
      "Strong technical alignment with Node.js, TypeScript, React, and PostgreSQL experience. Possesses foundational Redis and Kafka exposure.",
    missingSkills: ["Tailwind CSS"],
    aiInsights:
      "Candidate demonstrates excellent depth in backend microservices and frontend state management. Recommended for technical phone screen.",
    submittedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
];

// Redis Cache-Aside Simulation Hash Store
const redisCacheStore: Map<string, { data: any; expiresAt: number }> = new Map();

async function startServer() {
  const app = express();
  const httpServer = createServer(app);

  // Initialize Socket.IO Server for real-time notification broadcast
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on("join", (userId: string) => {
      socket.join(userId);
      console.log(`[Socket.IO] User ${userId} joined personal room.`);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  app.use(express.json({ limit: "10mb" }));

  // Middleware logging
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // --- API ROUTES ---

  // Health check
  app.get("/api/v1/health", (req: Request, res: Response) => {
    res.json({
      status: "UP",
      timestamp: new Date().toISOString(),
      services: {
        gateway: "healthy",
        authService: "healthy",
        jobService: "healthy",
        applicationService: "healthy",
        aiService: process.env.GEMINI_API_KEY ? "healthy" : "no_key",
        notificationService: "healthy",
        redisCacheHits: redisCacheStore.size,
      },
    });
  });

  // AUTH SERVICE ENDPOINTS
  app.post("/api/v1/auth/register", (req: Request, res: Response) => {
    const { name, email, password, role } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    const existing = usersDb.find((u) => u.email === email);
    if (existing) {
      return res.status(409).json({ error: "User already exists with this email" });
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name,
      email,
      passwordHash: `$2a$10$hashed_${Date.now()}`,
      role: role || "CANDIDATE",
      createdAt: new Date().toISOString(),
    };

    usersDb.push(newUser);

    const accessToken = `access_token_${newUser.id}_${Date.now()}`;
    const refreshToken = `refresh_token_${newUser.id}_${Date.now()}`;

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      accessToken,
      refreshToken,
    });
  });

  app.post("/api/v1/auth/login", (req: Request, res: Response) => {
    const { email, password } = req.body;
    const user = usersDb.find((u) => u.email === email);

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const accessToken = `access_token_${user.id}_${Date.now()}`;
    const refreshToken = `refresh_token_${user.id}_${Date.now()}`;

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  });

  app.post("/api/v1/auth/refresh", (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    const newAccessToken = `access_token_refreshed_${Date.now()}`;
    const newRefreshToken = `refresh_token_rotated_${Date.now()}`;

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  });

  // JOB SERVICE ENDPOINTS (WITH REDIS CACHE-ASIDE SIMULATION)
  app.get("/api/v1/jobs", (req: Request, res: Response) => {
    const { q, skills, minSalary, location, cursor, limit = "10" } = req.query;

    const cacheKey = `jobs:search:${JSON.stringify(req.query)}`;
    const cached = redisCacheStore.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return res.json({
        source: "CACHE_HIT_REDIS",
        ...cached.data,
      });
    }

    let results = [...jobsDb];

    // Search filter
    if (q && typeof q === "string") {
      const term = q.toLowerCase();
      results = results.filter(
        (j) =>
          j.title.toLowerCase().includes(term) ||
          j.description.toLowerCase().includes(term) ||
          j.location.toLowerCase().includes(term)
      );
    }

    // Skills filter
    if (skills && typeof skills === "string") {
      const skillArr = skills.split(",").map((s) => s.trim().toLowerCase());
      results = results.filter((j) =>
        j.skillsRequired.some((s) => skillArr.includes(s.toLowerCase()))
      );
    }

    // Salary filter
    if (minSalary) {
      const sal = parseInt(minSalary as string, 10);
      if (!isNaN(sal)) {
        results = results.filter((j) => j.salaryMax >= sal);
      }
    }

    const responsePayload = {
      jobs: results,
      totalCount: results.length,
      nextCursor: results.length > 0 ? results[results.length - 1].id : null,
      cachedAt: new Date().toISOString(),
    };

    // Store in Cache-Aside Redis Store with 300s TTL
    redisCacheStore.set(cacheKey, {
      data: responsePayload,
      expiresAt: Date.now() + 300000,
    });

    res.json({
      source: "DATABASE_MISS_REDIS_POPULATED",
      ...responsePayload,
    });
  });

  app.post("/api/v1/jobs", (req: Request, res: Response) => {
    const { recruiterId, title, description, skillsRequired, salaryMin, salaryMax, location } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required" });
    }

    const recruiter = usersDb.find((u) => u.id === recruiterId) || usersDb[0];

    const newJob: Job = {
      id: `job-${Date.now()}`,
      recruiterId: recruiter.id,
      recruiterName: recruiter.name,
      title,
      description,
      skillsRequired: skillsRequired || ["TypeScript", "Node.js"],
      salaryMin: Number(salaryMin) || 120000,
      salaryMax: Number(salaryMax) || 160000,
      location: location || "Remote",
      status: "OPEN",
      postedAt: new Date().toISOString(),
    };

    jobsDb.unshift(newJob);

    // Invalidate Redis Cache-Aside search keys
    redisCacheStore.clear();

    res.status(201).json({
      message: "Job posted successfully & Redis cache invalidated",
      job: newJob,
    });
  });

  // APPLICATION SERVICE & EVENT-DRIVEN AI SCREENING
  app.get("/api/v1/applications", (req: Request, res: Response) => {
    const { jobId, candidateId } = req.query;
    let list = [...applicationsDb];

    if (jobId) {
      list = list.filter((a) => a.jobId === jobId);
    }
    if (candidateId) {
      list = list.filter((a) => a.candidateId === candidateId);
    }

    res.json({ applications: list });
  });

  app.post("/api/v1/applications", async (req: Request, res: Response) => {
    const { candidateId, candidateName, candidateEmail, jobId, resumeText, resumeUrl } = req.body;

    const job = jobsDb.find((j) => j.id === jobId);
    if (!job) {
      return res.status(404).json({ error: "Target job position not found" });
    }

    const newApp: Application = {
      id: `app-${Date.now()}`,
      candidateId: candidateId || "usr-can-001",
      candidateName: candidateName || "Alex Rivera",
      candidateEmail: candidateEmail || "alex.rivera@example.com",
      jobId: job.id,
      jobTitle: job.title,
      resumeUrl: resumeUrl || "https://talentsync.ai/resumes/candidate_cv.pdf",
      resumeText: resumeText || "",
      status: "PENDING",
      matchScore: null,
      recruiterSummary: null,
      missingSkills: [],
      aiInsights: null,
      submittedAt: new Date().toISOString(),
    };

    applicationsDb.unshift(newApp);

    // Emit event application.submitted (simulated Kafka Producer -> AI Consumer)
    console.log(`[Kafka] Event Emitted -> 'application.submitted':`, {
      applicationId: newApp.id,
      candidateId: newApp.candidateId,
      jobId: newApp.jobId,
    });

    // Send immediate HTTP acknowledgement
    res.status(202).json({
      message: "Application submitted! AI screening service processing in background.",
      application: newApp,
    });

    // Async AI Resume Screening Processing (Kafka AI Consumer logic)
    processAiResumeScreening(newApp, job, io);
  });

  // Helper Async Function simulating Kafka AI Service Consumer + Gemini API
  async function processAiResumeScreening(appItem: Application, job: Job, ioServer: SocketIOServer) {
    try {
      console.log(`[AI Service] Consuming application ${appItem.id} for Gemini screening...`);

      let matchScore = 85;
      let recruiterSummary = "Candidate has relevant experience in key technologies.";
      let missingSkills: string[] = [];
      let aiInsights = "Strong background for this position.";

      if (process.env.GEMINI_API_KEY) {
        try {
          const prompt = `You are an expert Enterprise HR Recruiter AI. Evaluate this candidate resume against the target job description.
          
Job Title: ${job.title}
Job Description: ${job.description}
Required Skills: ${job.skillsRequired.join(", ")}

Candidate Resume Text:
${appItem.resumeText}

Analyze and generate a strict JSON response matching this schema:
{
  "matchScore": number (0 to 100),
  "missingSkills": string[],
  "recruiterSummary": string,
  "insights": string
}`;

          const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  matchScore: { type: Type.NUMBER, description: "Match score 0-100" },
                  missingSkills: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "List of missing required skills",
                  },
                  recruiterSummary: { type: Type.STRING, description: "Recruiter executive summary" },
                  insights: { type: Type.STRING, description: "Detailed key insights and recommendations" },
                },
                required: ["matchScore", "missingSkills", "recruiterSummary", "insights"],
              },
            },
          });

          if (response.text) {
            const parsed = JSON.parse(response.text);
            matchScore = Math.min(100, Math.max(0, Math.round(parsed.matchScore || 80)));
            recruiterSummary = parsed.recruiterSummary || recruiterSummary;
            missingSkills = parsed.missingSkills || [];
            aiInsights = parsed.insights || aiInsights;
          }
        } catch (geminiErr) {
          console.error("[Gemini API Error] Falling back to heuristic evaluation:", geminiErr);
          // Fallback heuristic calculations if Gemini API call hit quota or rate limits
          const resUpper = appItem.resumeText.toUpperCase();
          const matched = job.skillsRequired.filter((sk) => resUpper.includes(sk.toUpperCase()));
          missingSkills = job.skillsRequired.filter((sk) => !resUpper.includes(sk.toUpperCase()));
          matchScore = Math.round((matched.length / Math.max(job.skillsRequired.length, 1)) * 100);
          recruiterSummary = `Candidate matched ${matched.length} out of ${job.skillsRequired.length} required core skills.`;
          aiInsights = `Missing skills identified: ${missingSkills.join(", ") || "None"}.`;
        }
      } else {
        // Simple skill matching heuristic if no key present
        const resUpper = appItem.resumeText.toUpperCase();
        const matched = job.skillsRequired.filter((sk) => resUpper.includes(sk.toUpperCase()));
        missingSkills = job.skillsRequired.filter((sk) => !resUpper.includes(sk.toUpperCase()));
        matchScore = Math.round((matched.length / Math.max(job.skillsRequired.length, 1)) * 100);
        recruiterSummary = `Evaluated candidate profile against requirements. Matched skills: ${matched.join(", ")}.`;
        aiInsights = `Found ${matched.length} skill matches out of ${job.skillsRequired.length}.`;
      }

      // Update Database state
      appItem.status = "SCREENED";
      appItem.matchScore = matchScore;
      appItem.recruiterSummary = recruiterSummary;
      appItem.missingSkills = missingSkills;
      appItem.aiInsights = aiInsights;

      console.log(`[Kafka] Event Emitted -> 'application.screened':`, {
        applicationId: appItem.id,
        matchScore,
        status: "SCREENED",
      });

      // Socket.IO Notification broadcast to Recruiter and Candidate
      const notificationPayload = {
        type: "APPLICATION_SCREENED",
        applicationId: appItem.id,
        candidateName: appItem.candidateName,
        jobTitle: job.title,
        matchScore,
        recruiterSummary,
        missingSkills,
        timestamp: new Date().toISOString(),
      };

      // Broadcast real-time notification
      io.emit("notification", notificationPayload);
      console.log(`[Socket.IO] Real-time notification emitted for app ${appItem.id}`);
    } catch (err) {
      console.error("[AI Service Error]", err);
    }
  }

  // Mount Vite middleware in development mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`=================================================`);
    console.log(`🚀 TalentSync Gateway & Server running on port ${PORT}`);
    console.log(`=================================================`);
  });
}

startServer();
