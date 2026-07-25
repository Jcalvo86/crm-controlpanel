// Configuration file for ControlPanel CRM
window.CRM_CONFIG = {
  // 1. Data Source Provider Configuration
  provider: "supabase", // 'firebase' | 'supabase' | 'localStorage'
  
  supabase: {
    url: 'https://dzksclkscwljussvyrzx.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6a3NjbGtzY3dsanVzc3Z5cnp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNjAyNDEsImV4cCI6MjA5ODkzNjI0MX0.DUX9ujl-dCjYKh_nlUyVF_SHj2pmfPIYbFmkkDp3ARQ'
  },

  // 2. Active Modules for this project
  activeModules: ["terms", "design_tokens"], // Choose from: 'terms', 'blog', 'products', 'design_tokens'

  // 3. Project Branding Customizations
  branding: {
    appName: "Alexandria",
    logoUrl: "../favicon.png", // Path or URL to the logo
    backUrl: "../index.html"          // Path or URL to go back
  },

  // 4. Custom Taxonomies (Work Areas & Content Types)
  taxonomies: {
    workAreas: [
      { val: 'codigo', label: 'Código', icon: '💻', chipClass: 'chip-primary' },
      { val: 'diseño', label: 'Diseño', icon: '🎨', chipClass: 'chip-secondary' },
      { val: 'mrkt', label: 'Marketing', icon: '📈', chipClass: 'chip-tertiary' },
      { val: 'gestion', label: 'Gestión', icon: '📋', chipClass: 'chip-error' }
    ],
    contentTypes: [
      { val: 'herramienta', label: 'Herramienta', icon: '🔧', chipClass: 'chip-neutral' },
      { val: 'framework', label: 'Framework', icon: '📦', chipClass: 'chip-neutral' },
      { val: 'regla', label: 'Regla', icon: '📜', chipClass: 'chip-neutral' },
      { val: 'metodologia', label: 'Metodología', icon: '💡', chipClass: 'chip-neutral' }
    ]
  }
};

// Fallback registry for backward compatibility
window.GLOSAURIO_DEFAULT_CONFIG = window.CRM_CONFIG;

