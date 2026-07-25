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
  // Obtener config de archivo para leer el appName y crear un namespace para localStorage
  const fileConfig = window.CRM_CONFIG || window.GLOSAURIO_DEFAULT_CONFIG || null;
  const projectSuffix = fileConfig?.branding?.appName 
    ? `_${fileConfig.branding.appName.toLowerCase().replace(/[^a-z0-9]/g, '')}` 
    : '';

  const CONFIG_KEY = `glosaurio_datasource_config${projectSuffix}`;
  const THEME_KEY = `glosaurio_theme${projectSuffix}`;

  // Inicialización inmediata de tema para evitar flashes blancos
  const isDark = localStorage.getItem(THEME_KEY) !== 'light';
  document.documentElement.classList.toggle('dark', isDark);

  const Config = {
    getConfig() {
      let local = null;
      try {
        const raw = localStorage.getItem(CONFIG_KEY);
        if (raw) local = JSON.parse(raw);
      } catch {}

      let cachedDb = null;
      try {
        const rawDb = localStorage.getItem('glosaurio_cached_db_config');
        if (rawDb) cachedDb = JSON.parse(rawDb);
      } catch {}

      const fileConfig = window.CRM_CONFIG || window.GLOSAURIO_DEFAULT_CONFIG || null;

      return {
        ...fileConfig,
        ...cachedDb,
        ...local,
        branding: { ...(fileConfig?.branding || {}), ...(cachedDb?.branding || {}), ...(local?.branding || {}) },
        taxonomies: local?.taxonomies || cachedDb?.taxonomies || fileConfig?.taxonomies,
        activeModules: local?.activeModules || cachedDb?.activeModules || fileConfig?.activeModules
      };
    },

    async saveConfig(config) {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
      _initAdapter();

      if (window.DataSource && typeof window.DataSource.saveDbConfig === 'function') {
        try {
          await window.DataSource.saveDbConfig(config);
          localStorage.setItem('glosaurio_cached_db_config', JSON.stringify({
            activeModules: config.activeModules,
            taxonomies: config.taxonomies,
            branding: config.branding
          }));
        } catch (e) {
          console.error('[Glosaurio] Error al guardar la configuración en la base de datos:', e);
        }
      }
    },

    getProvider() {
      const c = this.getConfig();
      return c ? c.provider : 'localStorage';
    },

    clearConfig() {
      localStorage.removeItem(CONFIG_KEY);
      localStorage.removeItem('glosaurio_cached_db_config');
      _initAdapter();
    },

    isConfigured() {
      return window.DataSource && !(window.DataSource instanceof window.Glosaurio.LocalStorageAdapter);
    }
  };

  function _initAdapter() {
    const config = Config.getConfig();

    if (!config || config.provider === 'localStorage') {
      window.DataSource = new window.Glosaurio.LocalStorageAdapter();
    } else if (config.provider === 'supabase' && 
        config.supabase?.url && 
        config.supabase?.anonKey &&
        !config.supabase.url.includes('PLACEHOLDER') &&
        !config.supabase.anonKey.includes('PLACEHOLDER')) {
      window.DataSource = new window.Glosaurio.SupabaseAdapter(config.supabase);
    } else if (config.provider === 'firebase' && config.firebase?.apiKey && config.firebase?.projectId) {
      window.DataSource = new window.Glosaurio.FirebaseAdapter(config.firebase);
    } else {
      console.warn('[Glosaurio] Config incompleta, usando localStorage como fallback.');
      window.DataSource = new window.Glosaurio.LocalStorageAdapter();
    }

    // Consulta asíncrona en segundo plano para obtener la config de la base de datos
    if (window.DataSource && typeof window.DataSource.getDbConfig === 'function') {
      (async function() {
        try {
          const dbConfig = await window.DataSource.getDbConfig();
          if (dbConfig) {
            const currentCached = localStorage.getItem('glosaurio_cached_db_config');
            const stringified = JSON.stringify(dbConfig);
            if (currentCached !== stringified) {
              localStorage.setItem('glosaurio_cached_db_config', stringified);
              window.dispatchEvent(new CustomEvent('GlosaurioConfigUpdated', { detail: dbConfig }));
            }
          }
        } catch (e) {
          console.warn('[Glosaurio] Error cargando config dinámica de la BD:', e);
        }
      })();
    }
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
      localStorage.setItem(THEME_KEY, nextDark ? 'dark' : 'light');
      
      // Sincronizar estado con CRM si está definido en crm-app.js
      if (window.CRM) {
        window.CRM.isDark = nextDark;
      }
    });
  });
})();
