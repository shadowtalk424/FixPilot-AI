/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { LandingPage } from './pages/LandingPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { NewInvestigationPage } from './pages/NewInvestigationPage.tsx';
import { InvestigationResultsPage } from './pages/InvestigationResultsPage.tsx';
import { InvestigationHistoryPage } from './pages/InvestigationHistoryPage.tsx';
import { ProjectSettingsPage } from './pages/ProjectSettingsPage.tsx';
import { AccountSettingsPage } from './pages/AccountSettingsPage.tsx';
import { PrivacyTermsPages } from './pages/PrivacyTermsPages.tsx';
import { InvestigationData } from './types/investigation.ts';

function MainApp() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [selectedSampleKey, setSelectedSampleKey] = useState<string | undefined>(undefined);
  const [currentInvestigation, setCurrentInvestigation] = useState<InvestigationData | null>(null);
  const [filterProjectId, setFilterProjectId] = useState<string | undefined>(undefined);
  const [privacyTab, setPrivacyTab] = useState<'privacy' | 'terms'>('privacy');

  // Handle URL hash or default routing
  useEffect(() => {
    // If user signs in while on landing, suggest dashboard
    if (user && currentPage === 'landing') {
      setCurrentPage('dashboard');
    }
  }, [user]);

  const handleNavigate = (page: string, params?: any) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (page === 'investigation' && params?.investigation) {
      setCurrentInvestigation(params.investigation);
    }
    if (page === 'history') {
      setFilterProjectId(params?.projectId);
    }
    if (page === 'privacy') {
      setPrivacyTab('privacy');
    }
    if (page === 'terms') {
      setPrivacyTab('terms');
    }
    if (page === 'new') {
      if (params?.sampleKey) {
        setSelectedSampleKey(params.sampleKey);
      }
    }

    setCurrentPage(page);
  };

  const handleSelectSample = (sampleKey: string) => {
    setSelectedSampleKey(sampleKey);
    setCurrentPage('new');
  };

  const renderCurrentPage = () => {
    if (loading) {
      return (
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-mono">Initializing FixPilot AI workspace...</p>
          </div>
        </div>
      );
    }

    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={handleNavigate} onSelectSample={handleSelectSample} />;
      case 'dashboard':
        return user ? (
          <DashboardPage onNavigate={handleNavigate} onSelectSample={handleSelectSample} />
        ) : (
          <LandingPage onNavigate={handleNavigate} onSelectSample={handleSelectSample} />
        );
      case 'new':
        return (
          <NewInvestigationPage
            onNavigate={handleNavigate}
            initialSampleKey={selectedSampleKey}
          />
        );
      case 'investigation':
        return currentInvestigation ? (
          <InvestigationResultsPage
            investigation={currentInvestigation}
            onNavigate={handleNavigate}
            onUpdateInvestigation={(updated) => setCurrentInvestigation(updated)}
          />
        ) : (
          <DashboardPage onNavigate={handleNavigate} onSelectSample={handleSelectSample} />
        );
      case 'history':
        return (
          <InvestigationHistoryPage
            onNavigate={handleNavigate}
            filterProjectId={filterProjectId}
          />
        );
      case 'projects':
        return <ProjectSettingsPage onNavigate={handleNavigate} />;
      case 'settings':
        return <AccountSettingsPage onNavigate={handleNavigate} />;
      case 'privacy':
      case 'terms':
        return (
          <PrivacyTermsPages
            initialTab={privacyTab}
            onNavigate={handleNavigate}
          />
        );
      default:
        return <LandingPage onNavigate={handleNavigate} onSelectSample={handleSelectSample} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-[#e2e8f0] selection:bg-violet-500/30 selection:text-violet-200">
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />
      <main className="flex-1 pb-16">{renderCurrentPage()}</main>
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
