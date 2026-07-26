import React, { useState } from 'react';
import { Application, Job } from '../types';
import { Sparkles, CheckCircle, XCircle, AlertTriangle, Plus, UserCheck, FileSearch, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RecruiterDashboardProps {
  applications: Application[];
  jobs: Job[];
  onUpdateStatus: (applicationId: string, newStatus: 'ACCEPTED' | 'REJECTED') => Promise<void>;
  onPostJobClick: () => void;
}

export const RecruiterDashboard: React.FC<RecruiterDashboardProps> = ({
  applications,
  jobs,
  onUpdateStatus,
  onPostJobClick,
}) => {
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>('ALL');
  const [selectedAppModal, setSelectedAppModal] = useState<Application | null>(null);

  const filteredApplications = applications.filter((app) => {
    if (selectedJobFilter === 'ALL') return true;
    return app.jobId === selectedJobFilter;
  });

  const acceptedCount = applications.filter((a) => a.status === 'ACCEPTED').length;
  const rejectedCount = applications.filter((a) => a.status === 'REJECTED').length;
  const screenedCount = applications.filter((a) => a.status === 'SCREENED' || a.matchScore !== null).length;
  
  const avgScore = screenedCount > 0 
    ? Math.round(applications.reduce((acc, curr) => acc + (curr.matchScore || 0), 0) / screenedCount)
    : 0;

  const getScoreBadgeColor = (score: number | null) => {
    if (score === null) return 'bg-gray-100 text-gray-500 border-gray-200';
    if (score >= 85) return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-black';
    if (score >= 65) return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
    if (score >= 45) return 'bg-amber-50 text-amber-800 border-amber-200 font-semibold';
    return 'bg-rose-100 text-rose-800 border-rose-300 font-semibold';
  };

  return (
    <div id="recruiter-dashboard-root" className="space-y-10 pb-16">
      
      {/* Header Banner for Recruiter */}
      <section id="recruiter-banner" className="relative overflow-hidden bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 border border-amber-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-amber-100 border border-amber-300/80 text-xs text-amber-900 font-bold">
              <UserCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>Recruiter Command Center</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              AI Candidate Evaluation Pipeline
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-normal">
              Automated applicant screening powered by Google Gemini AI, Kafka event microservices, and Redis cache invalidation.
            </p>
          </div>

          <div className="flex items-center space-x-3 self-start md:self-auto">
            <button
              id="btn-post-new-position"
              onClick={onPostJobClick}
              className="px-5 py-3 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold rounded-2xl text-xs transition shadow-md shadow-amber-400/20 flex items-center space-x-2 cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>Post New Role</span>
            </button>
          </div>
        </div>

        {/* Bento Stat Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-amber-200/60">
          <div className="bg-white border border-black/5 rounded-2xl p-4 space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
              <span>Total Applicants</span>
              <Users className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-gray-900">{applications.length}</div>
          </div>

          <div className="bg-white border border-black/5 rounded-2xl p-4 space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
              <span>Average AI Match</span>
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-600">{avgScore}%</div>
          </div>

          <div className="bg-white border border-black/5 rounded-2xl p-4 space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
              <span>Accepted</span>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600">{acceptedCount}</div>
          </div>

          <div className="bg-white border border-black/5 rounded-2xl p-4 space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
              <span>Rejected</span>
              <XCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-black text-rose-600">{rejectedCount}</div>
          </div>
        </div>
      </section>

      {/* Filter Bar & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-black/5 p-5 rounded-3xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <label className="text-xs font-bold text-gray-800">Filter Position Opening:</label>
          <select
            id="select-job-filter"
            value={selectedJobFilter}
            onChange={(e) => setSelectedJobFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-900 focus:outline-none focus:border-amber-400 focus:bg-white transition font-medium"
          >
            <option value="ALL">All Posted Positions ({applications.length} total applications)</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-gray-500 font-medium">
          Showing <strong className="text-gray-900 font-bold">{filteredApplications.length}</strong> candidate profiles
        </div>
      </div>

      {/* Candidate Applicants List Grid */}
      <div className="space-y-5">
        <h2 className="text-lg font-extrabold text-gray-900 tracking-tight flex items-center space-x-2">
          <FileSearch className="w-5 h-5 text-amber-600" />
          <span>Candidate Pipeline ({filteredApplications.length})</span>
        </h2>

        {filteredApplications.length === 0 ? (
          <div className="bg-white border border-black/5 rounded-3xl p-12 text-center text-gray-600 space-y-2 shadow-sm">
            <Users className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="font-bold text-gray-900">No candidate applications submitted for this filter yet.</p>
            <p className="text-xs text-gray-500">Switch to Candidate view to submit test applications.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApplications.map((app, index) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                id={`recruiter-app-card-${app.id}`}
                className="bg-white border border-black/5 hover:border-amber-400/40 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 space-y-5 flex flex-col justify-between hover:-translate-y-0.5"
              >
                <div className="space-y-4">
                  {/* Candidate Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center font-extrabold text-amber-800 text-sm">
                        {app.candidateName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">{app.candidateName}</h3>
                        <p className="text-[11px] text-gray-500">{app.candidateEmail}</p>
                      </div>
                    </div>

                    {/* AI Score Badge */}
                    <div
                      className={`px-3 py-1 rounded-2xl border text-xs font-black flex items-center space-x-1 ${getScoreBadgeColor(
                        app.matchScore
                      )}`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{app.matchScore !== null ? `${app.matchScore}% Match` : 'Pending AI'}</span>
                    </div>
                  </div>

                  {/* Applied Position */}
                  <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200/80 text-xs space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Applied Position</span>
                    <span className="text-gray-900 font-bold">{app.jobTitle}</span>
                  </div>

                  {/* Recruiter Summary */}
                  {app.recruiterSummary && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                        Gemini AI Executive Summary
                      </span>
                      <p className="text-xs text-gray-700 leading-relaxed italic bg-amber-50/50 p-3 rounded-2xl border border-amber-200/60">
                        "{app.recruiterSummary}"
                      </p>
                    </div>
                  )}

                  {/* Missing Skills */}
                  {app.missingSkills && app.missingSkills.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>Missing Target Skills ({app.missingSkills.length})</span>
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {app.missingSkills.map((sk, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-mono"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Actions */}
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>
                      Status: <strong className="text-gray-900 font-bold">{app.status}</strong>
                    </span>
                    <button
                      onClick={() => setSelectedAppModal(app)}
                      className="text-amber-600 hover:text-amber-800 underline font-bold text-[11px] transition cursor-pointer"
                    >
                      View Resume
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      id={`btn-reject-${app.id}`}
                      onClick={() => onUpdateStatus(app.id, 'REJECTED')}
                      disabled={app.status === 'REJECTED'}
                      className={`py-2 rounded-2xl text-xs font-bold flex items-center justify-center space-x-1.5 border transition cursor-pointer ${
                        app.status === 'REJECTED'
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>

                    <button
                      id={`btn-accept-${app.id}`}
                      onClick={() => onUpdateStatus(app.id, 'ACCEPTED')}
                      disabled={app.status === 'ACCEPTED'}
                      className={`py-2 rounded-2xl text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                        app.status === 'ACCEPTED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-not-allowed'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Accept</span>
                    </button>
                  </div>
                </div>

              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Candidate Deep-Dive Inspector Modal */}
      <AnimatePresence>
        {selectedAppModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-black/5 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-xl font-extrabold text-gray-900">{selectedAppModal.candidateName}</h3>
                  <p className="text-xs text-amber-700 font-bold">{selectedAppModal.jobTitle}</p>
                </div>
                <button
                  onClick={() => setSelectedAppModal(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center text-xs transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 space-y-2">
                  <span className="font-bold text-gray-900 text-sm block flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Gemini AI Resume Screening Insights:</span>
                  </span>
                  <p className="text-gray-700 leading-relaxed text-xs font-normal">
                    {selectedAppModal.aiInsights || 'No additional insights generated.'}
                  </p>
                </div>

                <div>
                  <span className="font-bold text-gray-900 block mb-2">Parsed Resume Content:</span>
                  <pre className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-gray-800 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                    {selectedAppModal.resumeText}
                  </pre>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-gray-100">
                <button
                  onClick={() => setSelectedAppModal(null)}
                  className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-2xl text-xs font-bold transition cursor-pointer"
                >
                  Close Inspector
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
