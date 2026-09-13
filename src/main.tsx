import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { LandingPage } from './components/landing/LandingPage.tsx';
import { DownloadPage } from './components/landing/DownloadPage.tsx';
import { isNativeDesktop } from './core/platform.ts';

type ActiveView = 'landing' | 'download' | 'studio';

export function RootApp() {
  const [activeView, setActiveView] = useState<ActiveView>(() => {
    // If running in native desktop app, jump straight into CAD Studio!
    if (isNativeDesktop()) {
      return 'studio';
    }
    // In web browser, check URL hash or query params
    const hash = window.location.hash.toLowerCase();
    if (hash === '#studio' || hash === '#/studio' || hash === '#app') {
      return 'studio';
    }
    if (hash === '#download' || hash === '#/download') {
      return 'download';
    }
    return 'landing';
  });

  // Sync hash routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#studio' || hash === '#/studio' || hash === '#app') {
        setActiveView('studio');
      } else if (hash === '#download' || hash === '#/download') {
        setActiveView('download');
      } else {
        if (!isNativeDesktop()) {
          setActiveView('landing');
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (view: ActiveView) => {
    setActiveView(view);
    if (view === 'studio') {
      window.location.hash = '#studio';
    } else if (view === 'download') {
      window.location.hash = '#download';
    } else {
      window.location.hash = '';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (activeView === 'studio') {
    return <App onNavigateHome={() => navigateTo('landing')} onNavigateDownload={() => navigateTo('download')} />;
  }

  if (activeView === 'download') {
    return (
      <DownloadPage
        onBackToHome={() => navigateTo('landing')}
        onLaunchStudio={() => navigateTo('studio')}
      />
    );
  }

  return (
    <LandingPage
      onStartDesigning={() => navigateTo('studio')}
      onNavigateDownload={() => navigateTo('download')}
    />
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>
);
