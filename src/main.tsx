import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { LandingPage } from './components/landing/LandingPage.tsx';
import { DownloadPage } from './components/landing/DownloadPage.tsx';
import { isNativeDesktop } from './core/platform.ts';

type ActiveView = 'landing' | 'download';

export function RootApp() {
  // If running inside native Tauri desktop app (Mac / Windows), directly render CAD Studio!
  if (isNativeDesktop()) {
    return <App />;
  }

  // On the hosted web page (Vercel), show the Landing Page and Download Hub
  const [activeView, setActiveView] = useState<ActiveView>(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash === '#download' || hash === '#/download') {
      return 'download';
    }
    return 'landing';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#download' || hash === '#/download') {
        setActiveView('download');
      } else {
        setActiveView('landing');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (view: ActiveView) => {
    setActiveView(view);
    if (view === 'download') {
      window.location.hash = '#download';
    } else {
      window.location.hash = '';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (activeView === 'download') {
    return <DownloadPage onBackToHome={() => navigateTo('landing')} />;
  }

  return <LandingPage onNavigateDownload={() => navigateTo('download')} />;
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>
);


