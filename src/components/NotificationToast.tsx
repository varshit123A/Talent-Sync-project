import React from 'react';
import { NotificationPayload } from '../types';
import { Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationToastProps {
  notifications: NotificationPayload[];
  onClose: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ notifications, onClose }) => {
  if (notifications.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        id="notification-toast-drawer"
        className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white/95 border border-black/5 rounded-3xl p-5 shadow-2xl space-y-3 backdrop-blur-xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2 text-xs font-extrabold text-gray-900">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>Real-Time Socket Events ({notifications.length})</span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center text-xs transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
          {notifications.map((notif) => (
            <div key={notif.id} className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200/80 text-xs space-y-1.5 transition hover:border-gray-300">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-700 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>{notif.type}</span>
                </span>
                <span className="text-[10px] text-gray-400 font-mono">
                  {new Date(notif.timestamp).toLocaleTimeString()}
                </span>
              </div>

              {notif.candidateName && (
                <p className="text-gray-600">
                  Candidate: <strong className="text-gray-900">{notif.candidateName}</strong>
                </p>
              )}

              {notif.jobTitle && (
                <p className="text-gray-600">
                  Role: <strong className="text-gray-900">{notif.jobTitle}</strong>
                </p>
              )}

              {notif.matchScore !== undefined && (
                <p className="text-emerald-600 font-extrabold text-xs">
                  AI Match Score: {notif.matchScore}%
                </p>
              )}

              {notif.recruiterSummary && (
                <p className="text-gray-600 italic text-[11px] line-clamp-2 bg-white p-2 rounded-xl border border-gray-200">
                  "{notif.recruiterSummary}"
                </p>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
