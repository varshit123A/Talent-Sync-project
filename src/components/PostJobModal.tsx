import React, { useState } from 'react';
import { Plus, Briefcase } from 'lucide-react';
import { motion } from 'motion/react';

interface PostJobModalProps {
  onClose: () => void;
  onPostJob: (jobData: {
    title: string;
    description: string;
    skillsRequired: string[];
    salaryMin: number;
    salaryMax: number;
    location: string;
  }) => Promise<void>;
}

export const PostJobModal: React.FC<PostJobModalProps> = ({ onClose, onPostJob }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skillsStr, setSkillsStr] = useState('TypeScript, Node.js, PostgreSQL, Redis, Kafka');
  const [salaryMin, setSalaryMin] = useState('130000');
  const [salaryMax, setSalaryMax] = useState('175000');
  const [location, setLocation] = useState('San Francisco, CA (Hybrid)');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    setIsSubmitting(true);
    try {
      const skillsRequired = skillsStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await onPostJob({
        title,
        description,
        skillsRequired,
        salaryMin: Number(salaryMin),
        salaryMax: Number(salaryMax),
        location,
      });

      onClose();
    } catch (err) {
      console.error('Failed to post position:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="post-job-modal-root" className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white border border-black/5 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6"
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center shadow-sm">
              <Briefcase className="w-5 h-5 text-amber-700" />
            </div>
            <h3 className="text-xl font-extrabold text-gray-900">Post New Engineering Role</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center text-xs transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-gray-700 mb-1.5">Job Title</label>
            <input
              type="text"
              placeholder="e.g. Principal Distributed Systems Engineer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-400 focus:bg-white transition font-medium"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1.5">Job Description</label>
            <textarea
              rows={4}
              placeholder="Describe role responsibilities and technology stack requirements..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-400 focus:bg-white transition leading-relaxed font-medium"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1.5">
              Required Core Skills (Comma Separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Node.js, TypeScript, Kafka, Redis, Docker"
              value={skillsStr}
              onChange={(e) => setSkillsStr(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-400 focus:bg-white transition font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1.5">Salary Min ($)</label>
              <input
                type="number"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-900 focus:outline-none focus:border-amber-400 focus:bg-white transition font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1.5">Salary Max ($)</label>
              <input
                type="number"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-900 focus:outline-none focus:border-amber-400 focus:bg-white transition font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1.5">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-900 focus:outline-none focus:border-amber-400 focus:bg-white transition font-medium"
            />
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 leading-relaxed font-normal">
            <strong>Redis Invalidation Strategy Note:</strong> Posting a new position will immediately invalidate cached job search entries in Redis (<code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-amber-950">jobs:search:*</code>) to ensure consistent Cache-Aside reads.
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 transition font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-confirm-post-job"
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold rounded-2xl text-xs transition shadow-md shadow-amber-400/20 flex items-center space-x-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Publishing Position...' : 'Publish Position'}</span>
            </button>
          </div>
        </form>

      </motion.div>
    </div>
  );
};
