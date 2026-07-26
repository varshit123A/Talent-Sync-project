import React, { useState } from 'react';
import { Job, Application } from '../types';
import { Search, MapPin, DollarSign, Sparkles, Send, CheckCircle2, Clock, Database, Zap, Bookmark, Building2, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CandidateDashboardProps {
  jobs: Job[];
  applications: Application[];
  onApplyJob: (jobId: string, resumeText: string, resumeUrl: string) => Promise<void>;
  searchSource: string;
  onSearch: (q: string, skills: string, minSalary: string) => void;
  isLoading: boolean;
}

export const CandidateDashboard: React.FC<CandidateDashboardProps> = ({
  jobs,
  applications,
  onApplyJob,
  searchSource,
  onSearch,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [minSalary, setMinSalary] = useState('');
  const [bookmarkedJobIds, setBookmarkedJobIds] = useState<Record<string, boolean>>({});
  
  const [applyingJob, setApplyingJob] = useState<Job | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [resumeUrl, setResumeUrl] = useState('https://talentsync-resumes.s3.amazonaws.com/candidate_alex_rivera_cv.pdf');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm, selectedSkill, minSalary);
  };

  const handleQuickTagClick = (tagType: 'q' | 'skill' | 'salary' | 'reset', value: string) => {
    if (tagType === 'reset') {
      setSearchTerm('');
      setSelectedSkill('');
      setMinSalary('');
      onSearch('', '', '');
      return;
    }
    if (tagType === 'q') {
      setSearchTerm(value);
      onSearch(value, selectedSkill, minSalary);
    } else if (tagType === 'skill') {
      setSelectedSkill(value);
      onSearch(searchTerm, value, minSalary);
    } else if (tagType === 'salary') {
      setMinSalary(value);
      onSearch(searchTerm, selectedSkill, value);
    }
  };

  const toggleBookmark = (jobId: string) => {
    setBookmarkedJobIds((prev) => ({
      ...prev,
      [jobId]: !prev[jobId],
    }));
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingJob) return;

    setIsSubmitting(true);
    try {
      await onApplyJob(applyingJob.id, resumeText, resumeUrl);
      setApplyingJob(null);
      setResumeText('');
    } catch (err) {
      console.error('Failed to submit application:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="candidate-dashboard-root" className="space-y-10 pb-16">
      
      {/* Hero Section & Search Header */}
      <section className="relative pt-4 pb-2">
        <div className="relative text-center max-w-3xl mx-auto space-y-4 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs text-amber-800"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-semibold">Event-Driven AI Matching Engine</span>
            <span className="w-1 h-1 rounded-full bg-amber-400"></span>
            <span className="text-gray-900 font-bold">Gemini + Kafka</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight"
          >
            Find Your Next <span className="text-amber-500 underline decoration-amber-300/60 decoration-wavy">Dream Job</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-base text-gray-600 leading-relaxed max-w-2xl mx-auto font-normal"
          >
            Discover high-impact engineering roles evaluated instantly by Google Gemini AI with automated skill match scoring and real-time Kafka event streams.
          </motion.p>
        </div>

        {/* Floating Glassmorphism Search Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          id="search-filter-card"
          className="bg-white/90 backdrop-blur-2xl border border-black/5 rounded-3xl p-6 shadow-xl shadow-amber-950/5 space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/5 pb-4">
            <div className="flex items-center space-x-2">
              <SlidersHorizontal className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-bold text-gray-900 tracking-wide">Search & Filter Roles</span>
            </div>

            {/* Redis Cache Indicator Badge */}
            <div id="cache-status-badge" className="flex items-center space-x-2 text-xs font-mono px-3.5 py-1.5 rounded-full bg-amber-50/80 border border-amber-200/80 self-start sm:self-auto">
              {searchSource.includes('CACHE_HIT') ? (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  <span className="text-amber-800 font-bold">Redis Cache HIT (Hash SHA256)</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-800 font-bold">PostgreSQL Query (Miss/Populated)</span>
                </>
              )}
            </div>
          </div>

          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                id="input-search-q"
                type="text"
                placeholder="Title, keywords, tech stack..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20 transition-all font-medium"
              />
            </div>

            <input
              id="input-search-skill"
              type="text"
              placeholder="Required Skill (e.g. Node.js, Kafka)"
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20 transition-all font-medium"
            />

            <input
              id="input-search-salary"
              type="number"
              placeholder="Min Salary ($)"
              value={minSalary}
              onChange={(e) => setMinSalary(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20 transition-all font-medium"
            />

            <button
              id="btn-search-submit"
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold rounded-2xl text-xs transition shadow-md shadow-amber-400/20 flex items-center justify-center space-x-2 active:scale-98 cursor-pointer disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              <span>{isLoading ? 'Searching...' : 'Search Positions'}</span>
            </button>
          </form>

          {/* Quick Filter Tag Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-semibold text-gray-500 mr-1">Popular Filters:</span>
            
            <button
              type="button"
              onClick={() => handleQuickTagClick('reset', '')}
              className="px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200 text-[11px] font-medium text-gray-700 transition cursor-pointer"
            >
              All Roles
            </button>

            {['Node.js', 'Kafka', 'TypeScript', 'React', 'PostgreSQL', 'Redis'].map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => handleQuickTagClick('skill', skill)}
                className={`px-3 py-1 rounded-full border text-[11px] font-medium transition-all cursor-pointer ${
                  selectedSkill === skill
                    ? 'bg-amber-400 text-gray-900 border-amber-400 font-bold shadow-sm'
                    : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700'
                }`}
              >
                {skill}
              </button>
            ))}

            <button
              type="button"
              onClick={() => handleQuickTagClick('salary', '140000')}
              className={`px-3 py-1 rounded-full border text-[11px] font-medium transition-all cursor-pointer ${
                minSalary === '140000'
                  ? 'bg-emerald-500 text-white border-emerald-500 font-bold shadow-sm'
                  : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700'
              }`}
            >
              $140k+
            </button>
          </div>
        </motion.div>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Job Listings Main Column */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-lg font-extrabold text-gray-900 tracking-tight flex items-center space-x-2">
              <span>Open Engineering Roles</span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                {jobs.length}
              </span>
            </h2>

            <span className="text-xs text-gray-500 font-medium">Real-time Stream</span>
          </div>

          {jobs.length === 0 ? (
            <div className="bg-white border border-black/5 rounded-3xl p-12 text-center text-gray-600 space-y-3 shadow-sm">
              <Building2 className="w-10 h-10 text-gray-400 mx-auto opacity-50" />
              <p className="font-bold text-gray-900 text-base">No matching engineering positions found</p>
              <p className="text-xs text-gray-500">Try resetting your filter parameters or clearing salary constraints.</p>
              <button
                onClick={() => handleQuickTagClick('reset', '')}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold rounded-xl text-xs shadow-sm transition mt-2 cursor-pointer"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job, index) => {
                const hasApplied = applications.some((a) => a.jobId === job.id);
                const isBookmarked = !!bookmarkedJobIds[job.id];

                return (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    id={`job-card-${job.id}`}
                    className="group bg-white border border-black/5 hover:border-amber-400/50 rounded-3xl p-6 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-0.5 space-y-4"
                  >
                    {/* Top Row: Avatar, Title, Location, Salary, Bookmark */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start space-x-4">
                        {/* Company Logo Avatar */}
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-800 font-extrabold text-lg shadow-sm group-hover:scale-105 transition-transform">
                          {job.title.charAt(0)}
                        </div>

                        <div className="space-y-1">
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-amber-600 transition-colors leading-snug">
                            {job.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                            <span className="flex items-center space-x-1 font-semibold text-gray-700">
                              <Building2 className="w-3.5 h-3.5 text-gray-400" />
                              <span>{job.recruiterName || 'TalentSync Enterprise'}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <MapPin className="w-3.5 h-3.5 text-gray-400" />
                              <span>{job.location}</span>
                            </span>
                            <span className="flex items-center space-x-1 text-emerald-600 font-extrabold">
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>
                                ${(job.salaryMin / 1000).toFixed(0)}k - ${(job.salaryMax / 1000).toFixed(0)}k/yr
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bookmark Action */}
                      <button
                        type="button"
                        onClick={() => toggleBookmark(job.id)}
                        className={`p-2.5 rounded-2xl border transition cursor-pointer ${
                          isBookmarked
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-gray-50 text-gray-400 hover:text-gray-700 border-gray-200'
                        }`}
                        title="Bookmark position"
                      >
                        <Bookmark className="w-4 h-4 fill-current" />
                      </button>
                    </div>

                    {/* Description excerpt */}
                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 font-normal">
                      {job.description}
                    </p>

                    {/* Bottom Row: Skills Chips & Apply CTA */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-gray-100">
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold uppercase tracking-wider">
                          Full-Time
                        </span>
                        {job.skillsRequired.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-xl bg-gray-100 text-gray-700 border border-gray-200/80 text-xs font-mono font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      <div>
                        {hasApplied ? (
                          <span className="px-4 py-2 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center space-x-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Application Submitted</span>
                          </span>
                        ) : (
                          <button
                            id={`btn-apply-${job.id}`}
                            onClick={() => {
                              setApplyingJob(job);
                              setResumeText(
                                `Alex Rivera\nSenior Software Engineer\n\nExperience:\n- 6+ years with Node.js, TypeScript, PostgreSQL, and Express.\n- Architected microservices communicating via Kafka topics and cached with Redis.\n- Proficient with React 19, Tailwind CSS, and WebSockets.`
                              );
                            }}
                            className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold rounded-2xl text-xs transition shadow-md shadow-amber-400/20 flex items-center space-x-2 active:scale-98 cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Apply with AI Screening</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Real-time Candidate Applications Sidebar */}
        <div className="space-y-5">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-lg font-extrabold text-gray-900 tracking-tight flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <span>Application Pipeline</span>
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">{applications.length} Active</span>
          </div>

          <div className="bg-white border border-black/5 rounded-3xl p-5 shadow-sm space-y-4">
            {applications.length === 0 ? (
              <div className="text-center py-8 px-2 space-y-3 text-gray-500">
                <Clock className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-xs font-semibold text-gray-700">No active applications</p>
                <p className="text-[11px] text-gray-500">
                  Click "Apply with AI Screening" on any job to trigger real-time Gemini evaluation and Kafka event streams.
                </p>
              </div>
            ) : (
              applications.map((app) => (
                <div
                  key={app.id}
                  id={`app-status-card-${app.id}`}
                  className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-3 text-xs transition hover:border-gray-300"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm leading-snug line-clamp-1">{app.jobTitle}</h4>
                      <p className="text-[11px] text-gray-500">Submitted {new Date(app.submittedAt).toLocaleDateString()}</p>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] tracking-wide border ${
                        app.status === 'SCREENED'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : app.status === 'ACCEPTED'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : app.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                      }`}
                    >
                      {app.status === 'PENDING' ? 'Kafka AI Screening...' : app.status}
                    </span>
                  </div>

                  {app.status === 'SCREENED' && app.matchScore !== null && (
                    <div className="space-y-3 pt-2 border-t border-gray-200">
                      <div>
                        <div className="flex items-center justify-between mb-1 text-xs">
                          <span className="text-gray-600 font-semibold">AI Match Score</span>
                          <span className="font-black text-emerald-600">{app.matchScore}%</span>
                        </div>
                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${app.matchScore}%` }}
                          ></div>
                        </div>
                      </div>

                      {app.missingSkills.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold text-gray-500">Missing Target Skills:</span>
                          <div className="flex flex-wrap gap-1">
                            {app.missingSkills.map((sk, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-mono">
                                {sk}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {app.recruiterSummary && (
                        <div className="p-3 bg-white rounded-xl border border-gray-200 italic text-[11px] text-gray-600 leading-relaxed">
                          "{app.recruiterSummary}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Modal: Application Submission */}
      <AnimatePresence>
        {applyingJob && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white border border-black/5 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-xl font-extrabold text-gray-900">Apply for Position</h3>
                  <p className="text-xs text-amber-700 font-bold mt-0.5">{applyingJob.title}</p>
                </div>
                <button
                  onClick={() => setApplyingJob(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center text-xs transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleApplySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Resume Cloud Storage URL</label>
                  <input
                    type="text"
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-900 focus:outline-none focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20 transition font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Resume Plain Text Content (Evaluated by Gemini AI Microservice)
                  </label>
                  <textarea
                    rows={6}
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste CV or resume text..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-900 font-mono focus:outline-none focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20 transition leading-relaxed"
                    required
                  />
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-1.5">
                  <p className="font-bold text-gray-900 flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Kafka Event Engine Workflow:</span>
                  </p>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Submitting emits an <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-mono">application.submitted</code> Kafka event. The AI Consumer invokes Google Gemini API asynchronously.
                  </p>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setApplyingJob(null)}
                    className="px-5 py-2.5 rounded-2xl text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-confirm-apply"
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold rounded-2xl text-xs transition shadow-md shadow-amber-400/20 flex items-center space-x-2 active:scale-98 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Emitting Kafka Event...' : 'Submit Application'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
