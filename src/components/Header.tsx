import React from 'react';
import { UserRole, SystemHealth } from '../types';
import { Cpu, Bell, User, Shield, Briefcase, Network, Sparkles, Activity } from 'lucide-react';
import { motion } from 'motion/react';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeTab: 'jobs' | 'applications' | 'post-job' | 'architecture';
  onTabChange: (tab: 'jobs' | 'applications' | 'post-job' | 'architecture') => void;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  health: SystemHealth | null;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  activeTab,
  onTabChange,
  unreadNotificationsCount,
  onOpenNotifications,
  health,
}) => {
  return (
    <header id="header-root" className="sticky top-4 z-40 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
      <div id="header-container" className="h-20 px-6 bg-white/80 backdrop-blur-xl border border-black/5 rounded-3xl shadow-sm shadow-amber-950/5 flex items-center justify-between gap-4 transition-all duration-300">
        
        {/* Brand & Logo */}
        <div id="header-brand" className="flex items-center space-x-3 cursor-pointer group" onClick={() => onTabChange('jobs')}>
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-600 shadow-sm group-hover:scale-105 transition-transform duration-300">
              <Cpu className="w-5 h-5 text-amber-600" />
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-extrabold tracking-tight text-gray-900 font-sans">
                Talent<span className="text-amber-500 font-black">Sync</span>
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                AI SaaS
              </span>
            </div>
            <p className="text-[11px] text-gray-500 hidden sm:block font-medium">Event-Driven AI Microservices ATS</p>
          </div>
        </div>

        {/* Navigation Tabs - Pill Navigation */}
        <nav id="header-nav" className="hidden md:flex items-center p-1.5 rounded-2xl bg-gray-100/70 border border-black/5">
          <button
            id="nav-tab-jobs"
            onClick={() => onTabChange('jobs')}
            className={`relative px-4 py-2 rounded-xl text-xs font-semibold transition-colors duration-200 flex items-center space-x-2 ${
              activeTab === 'jobs' ? 'text-gray-900 font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {activeTab === 'jobs' && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 bg-amber-400 rounded-xl shadow-md shadow-amber-400/20"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center space-x-2">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Job Explorer</span>
            </span>
          </button>

          <button
            id="nav-tab-applications"
            onClick={() => onTabChange('applications')}
            className={`relative px-4 py-2 rounded-xl text-xs font-semibold transition-colors duration-200 flex items-center space-x-2 ${
              activeTab === 'applications' ? 'text-gray-900 font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {activeTab === 'applications' && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 bg-amber-400 rounded-xl shadow-md shadow-amber-400/20"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center space-x-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{currentRole === 'RECRUITER' ? 'Candidate Pipeline' : 'My Applications'}</span>
            </span>
          </button>

          {currentRole === 'RECRUITER' && (
            <button
              id="nav-tab-post-job"
              onClick={() => onTabChange('post-job')}
              className={`relative px-4 py-2 rounded-xl text-xs font-semibold transition-colors duration-200 flex items-center space-x-2 ${
                activeTab === 'post-job' ? 'text-gray-900 font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {activeTab === 'post-job' && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-amber-400 rounded-xl shadow-md shadow-amber-400/20"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center space-x-2">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Post Role</span>
              </span>
            </button>
          )}

          <button
            id="nav-tab-architecture"
            onClick={() => onTabChange('architecture')}
            className={`relative px-4 py-2 rounded-xl text-xs font-semibold transition-colors duration-200 flex items-center space-x-2 ${
              activeTab === 'architecture' ? 'text-gray-900 font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {activeTab === 'architecture' && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 bg-amber-400 rounded-xl shadow-md shadow-amber-400/20"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center space-x-2">
              <Network className="w-3.5 h-3.5 text-amber-700" />
              <span>System Topology</span>
            </span>
          </button>
        </nav>

        {/* Right Actions: Health, Notifications, Role Toggle */}
        <div id="header-actions" className="flex items-center space-x-3">
          
          {/* System Health Indicator */}
          <div id="health-indicator" className="hidden lg:flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-xs text-emerald-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-mono text-emerald-700 font-semibold">Kafka + Redis Active</span>
          </div>

          {/* Notification Bell */}
          <button
            id="btn-notifications"
            onClick={onOpenNotifications}
            className="relative p-2.5 rounded-2xl bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition border border-black/5 shadow-sm group cursor-pointer"
            title="Real-Time Socket Notifications"
          >
            <Bell className="w-4 h-4 group-hover:scale-110 transition-transform" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Role Toggle Switcher */}
          <div id="role-toggle-group" className="flex items-center bg-gray-100/80 p-1 rounded-2xl border border-black/5">
            <button
              id="btn-role-candidate"
              onClick={() => onRoleChange('CANDIDATE')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center space-x-1.5 cursor-pointer ${
                currentRole === 'CANDIDATE'
                  ? 'bg-white text-gray-900 font-bold shadow-sm border border-black/5'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <User className="w-3.5 h-3.5 text-amber-600" />
              <span>Candidate</span>
            </button>

            <button
              id="btn-role-recruiter"
              onClick={() => onRoleChange('RECRUITER')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center space-x-1.5 cursor-pointer ${
                currentRole === 'RECRUITER'
                  ? 'bg-amber-400 text-gray-900 font-bold shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-gray-800" />
              <span>Recruiter</span>
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
