-- TalentSync PostgreSQL Database Schema Initialization SQL Script

-- Create Enums
CREATE TYPE user_role AS ENUM ('ADMIN', 'RECRUITER', 'CANDIDATE');
CREATE TYPE job_status AS ENUM ('OPEN', 'PAUSED', 'CLOSED');
CREATE TYPE application_status AS ENUM ('PENDING', 'SCREENED', 'ACCEPTED', 'REJECTED');

-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    role user_role NOT NULL DEFAULT 'CANDIDATE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recruiter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    skills_required TEXT[] NOT NULL DEFAULT '{}',
    salary_min INT NOT NULL CHECK (salary_min >= 0),
    salary_max INT NOT NULL CHECK (salary_max >= salary_min),
    location VARCHAR(255) NOT NULL,
    status job_status NOT NULL DEFAULT 'OPEN',
    posted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_jobs_recruiter ON jobs(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON jobs(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_skills ON jobs USING GIN(skills_required);

-- Create Applications Table
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    resume_url TEXT NOT NULL,
    resume_text TEXT,
    status application_status NOT NULL DEFAULT 'PENDING',
    match_score DOUBLE PRECISION,
    recruiter_summary TEXT,
    missing_skills TEXT[] DEFAULT '{}',
    ai_insights TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_candidate_job UNIQUE (candidate_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
