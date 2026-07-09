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
  const CONFIG_KEY = 'glosaurio_datasource_config';

  const Config = {
    getConfig() {
      try {
        const raw = localStorage.getItem(CONFIG_KEY);
        if (raw) return JSON.parse(raw);
      } catch {}
      return window.GLOSAURIO_DEFAULT_CONFIG || null;
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
})();
