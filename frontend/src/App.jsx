import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import FilePreviewModal from './components/FilePreviewModal';

import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import AllFilesPage from './pages/AllFilesPage';
import DuplicatesPage from './pages/DuplicatesPage';
import OrganizationPage from './pages/OrganizationPage';
import ResultsPage from './pages/ResultsPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';

import { fetchJobs, fetchJobFiles } from './services/api';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [jobs, setJobs] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedFileForInspection, setSelectedFileForInspection] = useState(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Load jobs list on mount
  const loadJobsList = async () => {
    try {
      const list = await fetchJobs();
      setJobs(list);
      if (list.length > 0 && !activeJob) {
        setActiveJob(list[0]);
      }
    } catch {
      console.error('Failed to load jobs list');
    }
  };

  useEffect(() => {
    loadJobsList();
  }, []);

  // Load files for active job
  useEffect(() => {
    if (activeJob) {
      fetchJobFiles(activeJob.id)
        .then(setFiles)
        .catch(() => setFiles([]));
    } else {
      setFiles([]);
    }
  }, [activeJob]);

  const handleJobCreated = (newJob) => {
    setActiveJob(newJob);
    loadJobsList();
  };

  const handleNavigate = (page, params = {}) => {
    if (params.category) {
      setActiveCategoryFilter(params.category);
    }
    setCurrentPage(page);
  };

  const handleSelectJobFromHistory = (job) => {
    setActiveJob(job);
    if (job.status === 'organized') {
      setCurrentPage('results');
    } else if (job.status === 'planned' || job.status === 'scanned') {
      setCurrentPage('organization');
    } else {
      setCurrentPage('dashboard');
    }
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <DashboardPage
            activeJob={activeJob}
            files={files}
            jobs={jobs}
            onNavigate={handleNavigate}
            onFileSelect={setSelectedFileForInspection}
          />
        );
      case 'upload':
        return <UploadPage onJobCreated={handleJobCreated} onNavigate={handleNavigate} />;
      case 'files':
        return (
          <AllFilesPage
            files={files}
            onFileSelect={setSelectedFileForInspection}
            activeCategoryFilter={activeCategoryFilter}
          />
        );
      case 'duplicates':
        return <DuplicatesPage jobId={activeJob?.id} activeJob={activeJob} />;
      case 'organization':
        return (
          <OrganizationPage
            jobId={activeJob?.id}
            activeJob={activeJob}
            onOrganizedSuccess={(updatedJob) => {
              setActiveJob(updatedJob);
              loadJobsList();
              setCurrentPage('results');
            }}
          />
        );
      case 'analytics':
        return (
          <DashboardPage
            activeJob={activeJob}
            files={files}
            jobs={jobs}
            onNavigate={handleNavigate}
            onFileSelect={setSelectedFileForInspection}
          />
        );
      case 'results':
        return (
          <ResultsPage
            activeJob={activeJob}
            onRestoreSuccess={(restoredJob) => {
              setActiveJob(restoredJob);
              loadJobsList();
            }}
            onNavigate={handleNavigate}
          />
        );
      case 'activity':
        return (
          <HistoryPage
            jobs={jobs}
            onSelectJob={handleSelectJobFromHistory}
            onRefreshJobs={loadJobsList}
          />
        );
      case 'settings':
        return <SettingsPage />;
      default:
        return (
          <DashboardPage
            activeJob={activeJob}
            files={files}
            jobs={jobs}
            onNavigate={handleNavigate}
            onFileSelect={setSelectedFileForInspection}
          />
        );
    }
  };

  const pageTitles = {
    dashboard: { title: 'Dashboard', subtitle: 'Your files, organized intelligently' },
    upload: { title: 'Upload Files', subtitle: 'Upload a ZIP archive to calculate real file counts and storage usage' },
    files: { title: 'All Files', subtitle: 'Search, filter, inspect metadata, and preview scanned files' },
    duplicates: { title: 'Duplicates', subtitle: 'Inspect exact matching SHA-256 files and recoverable storage' },
    organization: { title: 'Organization Plan', subtitle: 'Review proposed directory tree and approve plan' },
    analytics: { title: 'Analytics', subtitle: 'Explore file categories and storage distribution' },
    results: { title: 'Organization Results', subtitle: 'View transformed workspace, download output ZIP, or restore state' },
    activity: { title: 'Activity History', subtitle: 'Review previous upload and organization jobs' },
    settings: { title: 'Settings', subtitle: 'Manage category rules and application preferences' },
  };

  const currentHeaderInfo = pageTitles[currentPage] || pageTitles.dashboard;

  return (
    <div className="min-h-screen bg-[#DCEAF7] p-4 md:p-8 flex items-center justify-center font-sans">
      {/* Large Rounded Main Application Surface matching visual target screenshot */}
      <div className="w-full max-w-7xl bg-[#F0F6FB] rounded-3xl shadow-2xl border border-[#CDE1F3] flex min-h-[90vh] overflow-hidden">
        {/* Persistent Left Sidebar */}
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} activeJob={activeJob} />

        {/* Main Content Area */}
        <main className="flex-1 bg-white p-6 md:p-8 overflow-y-auto rounded-r-3xl">
          <Header
            title={currentHeaderInfo.title}
            subtitle={currentHeaderInfo.subtitle}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeJob={activeJob}
          />

          {renderCurrentPage()}
        </main>
      </div>

      {/* Inspection Modal */}
      {selectedFileForInspection && (
        <FilePreviewModal
          file={selectedFileForInspection}
          jobId={activeJob?.id}
          onClose={() => setSelectedFileForInspection(null)}
        />
      )}
    </div>
  );
}
