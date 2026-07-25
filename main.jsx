import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import CRMControlPanel from './CRMControlPanel';
import '../style.css';

function StandaloneCRM() {
  const [crmSession, setCrmSession] = useState(null);
  const [crmConfig, setCrmConfig] = useState(window.DataSourceConfig?.getConfig() || window.GLOSAURIO_DEFAULT_CONFIG || {});

  useEffect(() => {
    const handleConfigUpdated = () => {
      setCrmConfig(window.DataSourceConfig?.getConfig() || {});
    };
    window.addEventListener('GlosaurioConfigUpdated', handleConfigUpdated);
    return () => window.removeEventListener('GlosaurioConfigUpdated', handleConfigUpdated);
  }, []);

  const config = React.useMemo(() => ({
    provider: crmConfig.provider || 'supabase',
    supabase: crmConfig.supabase,
    activeModules: crmConfig.activeModules || ['terms', 'design_tokens'],
    branding: crmConfig.branding,
    taxonomies: crmConfig.taxonomies
  }), [crmConfig]);

  useEffect(() => {
    if (config.provider === 'supabase') {
      const url = config.supabase?.url;
      if (url) {
        const cached = localStorage.getItem(`crm_session_${url}`);
        if (cached) {
          try {
            setCrmSession(JSON.parse(cached));
          } catch (e) {
            localStorage.removeItem(`crm_session_${url}`);
          }
        }
      }
    } else {
      setCrmSession({ local: true });
    }
  }, []);

  return (
    <CRMControlPanel 
      config={config} 
      session={crmSession} 
      setSession={setCrmSession} 
    />
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StandaloneCRM />
  </React.StrictMode>
);
