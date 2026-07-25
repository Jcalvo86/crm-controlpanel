import React from 'react';
import ReactDOM from 'react-dom/client';
import CRMControlPanel from './CRMControlPanel';
import { Agentation } from 'agentation';

// Obtiene la configuración global cargada desde crm-config.js (o un fallback local)
const config = window.CRM_CONFIG || {
  provider: 'localStorage',
  activeModules: ['terms', 'products', 'design_tokens'],
  branding: {
    appName: 'Sueño Travel',
    logoUrl: '../favicon.png',
    backUrl: '../index.html'
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CRMControlPanel config={config} />
    <Agentation />
  </React.StrictMode>
);
