import React, { useState } from 'react';
import { Network, Radio } from 'lucide-react';
import { motion } from 'motion/react';

interface ArchitectureModalProps {
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'topology' | 'kafka' | 'redis' | 'schema' | 'docker'>('topology');

  return (
    <div id="architecture-modal-root" className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white border border-black/5 rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 border border-amber-300/80 flex items-center justify-center shadow-sm">
              <Network className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">TalentSync Microservices Architecture</h2>
              <p className="text-xs text-gray-500 font-medium">Production Event-Driven Kafka, Redis Cache-Aside & Gemini AI Stack</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center text-xs transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-4 text-xs font-semibold">
          {[
            { id: 'topology', label: '1. Microservices Map' },
            { id: 'kafka', label: '2. Kafka Topics & Events' },
            { id: 'redis', label: '3. Redis Cache Pattern' },
            { id: 'schema', label: '4. PostgreSQL Schema' },
            { id: 'docker', label: '5. Docker Containers' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-2xl transition duration-200 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-amber-400 text-gray-900 font-bold shadow-md shadow-amber-400/20'
                  : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200 border border-gray-200/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          
          {activeTab === 'topology' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                  <span className="text-xs font-extrabold text-amber-700 uppercase tracking-wider block">API Gateway Service (Port 3000)</span>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Express Reverse Proxy gateway directing incoming candidate & recruiter REST/WebSocket requests to downstream services.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                  <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider block">Auth Service (Port 4001)</span>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    JWT + Refresh Token Rotation in Redis, bcrypt password hashing, Google OAuth 2.0 via Passport.js, and RBAC middleware.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                  <span className="text-xs font-extrabold text-amber-800 uppercase tracking-wider block">Job Service (Port 4002)</span>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    PostgreSQL full-text job search, dynamic skill filters, cursor-based pagination, and Redis Cache-Aside pattern.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                  <span className="text-xs font-extrabold text-teal-700 uppercase tracking-wider block">Application Service (Port 4003)</span>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Multer file handling, candidate state machine, and Kafka Producer emitting <code className="text-amber-800 font-mono bg-amber-100 px-1 rounded">application.submitted</code>.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                  <span className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider block">AI Service (Port 4004)</span>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Kafka Consumer reading applications, invoking Google Gemini API (<code className="text-indigo-800 font-mono bg-indigo-50 px-1 rounded">@google/genai</code>) for JSON resume screening.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                  <span className="text-xs font-extrabold text-rose-700 uppercase tracking-wider block">Notification Service (Port 4005)</span>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Kafka Consumer for screened events, Nodemailer SMTP email dispatcher, and Socket.IO real-time notification engine.
                  </p>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'kafka' && (
            <div className="space-y-4">
              <h4 className="text-sm font-extrabold text-gray-900">Event-Driven Kafka Topics Architecture</h4>
              
              <div className="space-y-3 text-xs">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 font-mono space-y-1.5">
                  <div className="flex items-center space-x-2 text-amber-800 font-bold">
                    <Radio className="w-4 h-4 text-amber-600" />
                    <span>Topic: application.submitted</span>
                  </div>
                  <p className="text-gray-600 text-[11px]">
                    Producer: Application Service ➜ Consumer: AI Screening Service
                  </p>
                  <p className="text-gray-900 font-semibold text-[11px]">
                    Payload: {'{ applicationId, candidateId, jobId, resumeText, jobDescription }'}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 font-mono space-y-1.5">
                  <div className="flex items-center space-x-2 text-emerald-800 font-bold">
                    <Radio className="w-4 h-4 text-emerald-600" />
                    <span>Topic: application.screened</span>
                  </div>
                  <p className="text-gray-600 text-[11px]">
                    Producer: AI Service ➜ Consumers: Application Service & Notification Service
                  </p>
                  <p className="text-gray-900 font-semibold text-[11px]">
                    Payload: {'{ applicationId, matchScore, missingSkills, recruiterSummary, insights }'}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 font-mono space-y-1.5">
                  <div className="flex items-center space-x-2 text-rose-800 font-bold">
                    <Radio className="w-4 h-4 text-rose-600" />
                    <span>Topic: application.status.updated</span>
                  </div>
                  <p className="text-gray-600 text-[11px]">
                    Producer: Application Service ➜ Consumer: Notification Service
                  </p>
                  <p className="text-gray-900 font-semibold text-[11px]">
                    Payload: {'{ applicationId, candidateId, status: "ACCEPTED" | "REJECTED" }'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'redis' && (
            <div className="space-y-3 text-xs text-gray-700 leading-relaxed">
              <h4 className="text-sm font-extrabold text-gray-900">Redis Cache-Aside Strategy (Job Search Endpoint)</h4>
              <p>1. Client requests <code className="text-amber-900 bg-amber-100 px-1 rounded font-mono">GET /api/v1/jobs?q=Node&skills=TypeScript</code>.</p>
              <p>2. Job Controller generates deterministic key: <code className="text-amber-900 bg-amber-100 px-1 rounded font-mono">jobs:search:&lt;sha256_hash&gt;</code>.</p>
              <p>3. Checks Redis. If key exists (CACHE HIT), returns JSON instantly.</p>
              <p>4. On CACHE MISS, executes PostgreSQL query, stores result in Redis with 300s TTL, and returns payload.</p>
              <p>5. On recruiter job creation or update, cache invalidation clears matching <code className="text-rose-800 bg-rose-100 px-1 rounded font-mono">jobs:search:*</code> keys automatically.</p>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-2">
              <h4 className="text-sm font-extrabold text-gray-900">Unified PostgreSQL Prisma Schema Summary</h4>
              <pre className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-gray-800 font-mono text-[11px] overflow-x-auto leading-relaxed">
{`model User {
  id           String        @id @default(uuid())
  name         String
  email        String        @unique
  role         Role          // ADMIN, RECRUITER, CANDIDATE
  createdAt    DateTime      @default(now())
}

model Job {
  id             String        @id @default(uuid())
  recruiterId    String
  title          String
  description    String
  skillsRequired String[]
  salaryMin      Int
  salaryMax      Int
  status         JobStatus     // OPEN, PAUSED, CLOSED
}

model Application {
  id               String            @id @default(uuid())
  candidateId      String
  jobId            String
  resumeUrl        String
  status           ApplicationStatus // PENDING, SCREENED, ACCEPTED, REJECTED
  matchScore       Float?
  recruiterSummary String?
  missingSkills    String[]
}`}
              </pre>
            </div>
          )}

          {activeTab === 'docker' && (
            <div className="space-y-3">
              <h4 className="text-sm font-extrabold text-gray-900">Docker Compose Container Services</h4>
              <div className="grid grid-cols-2 gap-3 text-xs font-mono font-medium">
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900">
                  ✔ postgres:16-alpine (5432)
                </div>
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900">
                  ✔ redis:7-alpine (6379)
                </div>
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900">
                  ✔ bitnami/zookeeper (2181)
                </div>
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900">
                  ✔ bitnami/kafka:3.6 (9092)
                </div>
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900">
                  ✔ gateway-service (3000)
                </div>
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900">
                  ✔ auth-service (4001)
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-2xl text-xs font-bold transition cursor-pointer"
          >
            Close Topology Inspector
          </button>
        </div>

      </motion.div>
    </div>
  );
};
