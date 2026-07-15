/**
 * GLOSAURIO — data-source-config.js
 *
 * Factory: lee la configuración guardada en localStorage
 * y establece window.DataSource con el adapter correcto.
 *
 * Claves en localStorage:
 *   glosaurio_datasource_config  → { provider, supabase?, firebase? }
 *
 * Uso:
 *   const terms = await window.DataSource.getTerms({ published: true });
 *   window.DataSourceConfig.getConfig()   → config actual
 *   window.DataSourceConfig.saveConfig(c) → guarda nueva config
 *   window.DataSourceConfig.getProvider() → 'supabase'|'firebase'|'localStorage'
 *   window.DataSourceConfig.clearConfig() → vuelve a localStorage
 */

(function () {
  // Inicialización inmediata de tema para evitar flashes blancos
  const isDark = localStorage.getItem('glosaurio_theme') !== 'light';
  document.documentElement.classList.toggle('dark', isDark);

  const CONFIG_KEY = 'glosaurio_datasource_config';

  const Config = {
    getConfig() {
      let local = null;
      try {
        const raw = localStorage.getItem(CONFIG_KEY);
        if (raw) local = JSON.parse(raw);
      } catch {}

      const fileConfig = window.CRM_CONFIG || window.GLOSAURIO_DEFAULT_CONFIG || null;

      if (!local) return fileConfig;
      
      // Merge local config (db credentials) with file config (modules + branding)
      return {
        ...fileConfig,
        ...local,
        branding: { ...(fileConfig?.branding || {}), ...(local?.branding || {}) },
        activeModules: local?.activeModules || fileConfig?.activeModules
      };
    },

    saveConfig(config) {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
      // Reinicializa el adapter con la nueva config
      _initAdapter();
    },

    getProvider() {
      const c = this.getConfig();
      return c ? c.provider : 'localStorage';
    },

    clearConfig() {
      localStorage.removeItem(CONFIG_KEY);
      _initAdapter();
    },

    isConfigured() {
      const c = this.getConfig();
      return c && c.provider !== 'localStorage';
    }
  };

  function _initAdapter() {
    const config = Config.getConfig();

    if (!config || config.provider === 'localStorage') {
      window.DataSource = new window.Glosaurio.LocalStorageAdapter();
      return;
    }

    if (config.provider === 'supabase' && 
        config.supabase?.url && 
        config.supabase?.anonKey &&
        !config.supabase.url.includes('PLACEHOLDER') &&
        !config.supabase.anonKey.includes('PLACEHOLDER')) {
      window.DataSource = new window.Glosaurio.SupabaseAdapter(config.supabase);
      return;
    }

    if (config.provider === 'firebase' && config.firebase?.apiKey && config.firebase?.projectId) {
      window.DataSource = new window.Glosaurio.FirebaseAdapter(config.firebase);
      return;
    }

    // Fallback si config incompleta
    console.warn('[Glosaurio] Config incompleta, usando localStorage como fallback.');
    window.DataSource = new window.Glosaurio.LocalStorageAdapter();
  }

  // Inicializa al cargar
  _initAdapter();

  // Expone Config globalmente
  window.DataSourceConfig = Config;

  // Debug info en consola
  const provider = Config.getProvider();
  const emoji = { supabase: '🟢', firebase: '🔥', localStorage: '💾' }[provider] || '❓';
  console.log(`%c${emoji} DataSource activo: ${provider}`, 'color: #b4c5ff; font-weight: bold;');

  // Aplicar branding y tema dinámicamente al cargar el DOM
  document.addEventListener('DOMContentLoaded', () => {
    // 1. Branding
    const config = Config.getConfig();
    if (config && config.branding) {
      const branding = config.branding;
      const appNameEl = document.getElementById('app-name');
      const logoImgEl = document.getElementById('logo-img');
      const backLinkEl = document.getElementById('back-link');
      const homeLinkEl = document.getElementById('home-link');

      if (appNameEl && branding.appName) appNameEl.textContent = branding.appName;
      if (logoImgEl && branding.logoUrl) logoImgEl.src = branding.logoUrl;
      if (backLinkEl && branding.backUrl) backLinkEl.href = branding.backUrl;
      if (homeLinkEl && branding.backUrl) homeLinkEl.href = branding.backUrl;
    }

    // 2. Control de tema (Light/Dark mode)
    const activeDark = document.documentElement.classList.contains('dark');
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
      themeIcon.textContent = activeDark ? 'light_mode' : 'dark_mode';
    }

    document.getElementById('btn-theme')?.addEventListener('click', () => {
      const currentDark = document.documentElement.classList.contains('dark');
      const nextDark = !currentDark;
      document.documentElement.classList.toggle('dark', nextDark);
      
      const icon = document.getElementById('theme-icon');
      if (icon) icon.textContent = nextDark ? 'light_mode' : 'dark_mode';
      localStorage.setItem('glosaurio_theme', nextDark ? 'dark' : 'light');
      
      // Sincronizar estado con CRM si está definido en crm-app.js
      if (window.CRM) {
        window.CRM.isDark = nextDark;
      }
    });
  });
})();
