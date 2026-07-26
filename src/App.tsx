import React, { useState, useEffect } from 'react';
import { io as socketIOClient, Socket } from 'socket.io-client';
import { UserRole, Job, Application, NotificationPayload, SystemHealth } from './types';
import { Header } from './components/Header';
import { CandidateDashboard } from './components/CandidateDashboard';
import { RecruiterDashboard } from './components/RecruiterDashboard';
import { ArchitectureModal } from './components/ArchitectureModal';
import { PostJobModal } from './components/PostJobModal';
import { NotificationToast } from './components/NotificationToast';

export function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('CANDIDATE');
  const [activeTab, setActiveTab] = useState<'jobs' | 'applications' | 'post-job' | 'architecture'>('jobs');
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [searchSource, setSearchSource] = useState<string>('DATABASE');
  const [isLoadingJobs, setIsLoadingJobs] = useState<boolean>(false);

  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const [showNotificationsToast, setShowNotificationsToast] = useState<boolean>(false);
  const [showArchitectureModal, setShowArchitectureModal] = useState<boolean>(false);
  const [showPostJobModal, setShowPostJobModal] = useState<boolean>(false);
  
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);

  // Initialize Socket.IO Client connection
  useEffect(() => {
    const socket: Socket = socketIOClient(window.location.origin, {
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('[Socket.IO Client] Connected to server.');
      socket.emit('join', 'usr-can-001');
    });

    socket.on('notification', (payload: any) => {
      console.log('[Socket.IO Notification Received]', payload);
      const notifItem: NotificationPayload = {
        id: `notif_${Date.now()}_${Math.random()}`,
        type: payload.type || 'APPLICATION_SCREENED',
        applicationId: payload.applicationId,
        candidateName: payload.candidateName,
        jobTitle: payload.jobTitle,
        matchScore: payload.matchScore,
        recruiterSummary: payload.recruiterSummary,
        missingSkills: payload.missingSkills,
        timestamp: payload.timestamp || new Date().toISOString(),
        read: false,
      };

      setNotifications((prev) => [notifItem, ...prev]);
      setShowNotificationsToast(true);

      // Re-fetch applications to reflect AI screening update immediately
      fetchApplications();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Initial Data Fetch & Health Poll
  useEffect(() => {
    fetchJobs();
    fetchApplications();
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/v1/health');
      if (res.ok) {
        const data = await res.json();
        setSystemHealth(data);
      }
    } catch (err) {
      console.error('Failed to fetch system health:', err);
    }
  };

  const fetchJobs = async (q: string = '', skills: string = '', minSalary: string = '') => {
    setIsLoadingJobs(true);
    try {
      const queryParams = new URLSearchParams();
      if (q) queryParams.append('q', q);
      if (skills) queryParams.append('skills', skills);
      if (minSalary) queryParams.append('minSalary', minSalary);

      const res = await fetch(`/api/v1/jobs?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        setSearchSource(data.source || 'DATABASE');
      }
    } catch (err) {
      console.error('Error searching jobs:', err);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/v1/applications');
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
    }
  };

  const handleApplyJob = async (jobId: string, resumeText: string, resumeUrl: string) => {
    try {
      const res = await fetch('/api/v1/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: 'usr-can-001',
          candidateName: 'Alex Rivera',
          candidateEmail: 'alex.rivera@example.com',
          jobId,
          resumeText,
          resumeUrl,
        }),
      });

      if (res.ok) {
        await fetchApplications();
      }
    } catch (err) {
      console.error('Error applying for job:', err);
    }
  };

  const handlePostJob = async (jobData: {
    title: string;
    description: string;
    skillsRequired: string[];
    salaryMin: number;
    salaryMax: number;
    location: string;
  }) => {
    try {
      const res = await fetch('/api/v1/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recruiterId: 'usr-rec-001',
          ...jobData,
        }),
      });

      if (res.ok) {
        await fetchJobs();
      }
    } catch (err) {
      console.error('Error posting job:', err);
    }
  };

  const handleUpdateApplicationStatus = async (applicationId: string, newStatus: 'ACCEPTED' | 'REJECTED') => {
    try {
      const app = applications.find((a) => a.id === applicationId);
      if (app) {
        app.status = newStatus;
        setApplications([...applications]);
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleTabSelect = (tab: 'jobs' | 'applications' | 'post-job' | 'architecture') => {
    if (tab === 'architecture') {
      setShowArchitectureModal(true);
    } else if (tab === 'post-job') {
      setShowPostJobModal(true);
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div id="app-root" className="min-h-screen bg-[#FFFDF8] text-[#111827] font-sans selection:bg-[#FFE082] selection:text-[#111827] relative overflow-x-hidden antialiased">
      
      {/* Background Ambient Glow Accent Blobs */}
      <div className="fixed -top-20 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-[#FFE082]/30 via-[#FFF8E1]/20 to-transparent rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="fixed top-1/2 right-10 w-[400px] h-[400px] bg-[#D1FAE5]/30 rounded-full blur-[100px] pointer-events-none -z-10"></div>

      {/* Top Navigation Header */}
      <Header
        currentRole={currentRole}
        onRoleChange={(role) => {
          setCurrentRole(role);
          if (role === 'RECRUITER') {
            setActiveTab('applications');
          } else {
            setActiveTab('jobs');
          }
        }}
        activeTab={activeTab}
        onTabChange={handleTabSelect}
        unreadNotificationsCount={notifications.filter((n) => !n.read).length}
        onOpenNotifications={() => setShowNotificationsToast(true)}
        health={systemHealth}
      />

      {/* Main Content View Container */}
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {currentRole === 'CANDIDATE' ? (
          <CandidateDashboard
            jobs={jobs}
            applications={applications}
            onApplyJob={handleApplyJob}
            searchSource={searchSource}
            onSearch={fetchJobs}
            isLoading={isLoadingJobs}
          />
        ) : (
          <RecruiterDashboard
            applications={applications}
            jobs={jobs}
            onUpdateStatus={handleUpdateApplicationStatus}
            onPostJobClick={() => setShowPostJobModal(true)}
          />
        )}

      </main>

      {/* Post Job Modal */}
      {showPostJobModal && (
        <PostJobModal
          onClose={() => setShowPostJobModal(false)}
          onPostJob={handlePostJob}
        />
      )}

      {/* Architecture System Topology Modal */}
      {showArchitectureModal && (
        <ArchitectureModal onClose={() => setShowArchitectureModal(false)} />
      )}

      {/* Real-time Notification Toast Drawer */}
      {showNotificationsToast && (
        <NotificationToast
          notifications={notifications}
          onClose={() => setShowNotificationsToast(false)}
        />
      )}

    </div>
  );
}

export default App;
