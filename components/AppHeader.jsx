import React, { useState, useEffect } from 'react';

export default function AppHeader({
  config,
  session,
  onLogout,
  guessSetupUrl,
  appName,
  logoUrl,
  backUrl
}) {
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const toggleTheme = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
      localStorage.setItem('theme_preference', 'light');
    } else {
      document.documentElement.classList.add('dark');
      setIsDark(true);
      localStorage.setItem('theme_preference', 'dark');
    }
  };

  // Sync theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme_preference');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  return (
    <header className="nav-shell">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-[72px]">
        <div className="flex items-center gap-3">
          <a href={backUrl} className="flex items-center gap-3 group cursor-pointer text-left no-underline bg-transparent border-none p-0">
            <img src={logoUrl} alt={`${appName} Logo`} className="w-10 h-10 rounded-xl shadow-lg object-cover" />
            <span className="font-headline-md" style={{ color: 'var(--primary)', letterSpacing: '-0.02em' }}>{appName}</span>
          </a>
          <span className="chip chip-neutral text-xs">CRM Panel</span>
          <span className="chip chip-tertiary text-xs font-mono uppercase tracking-wider">Provider: {config.provider}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Light/Dark mode switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            className="btn-secondary flex items-center justify-center"
            style={{ width: '40px', height: '40px', padding: '0', borderRadius: '50%' }}
            title={isDark ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
          >
            <span className="material-symbols-outlined text-sm">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          <a
            href={guessSetupUrl()}
            className="btn-secondary flex items-center gap-2"
            style={{ padding: '10px 20px', fontSize: '0.8rem', textDecoration: 'none' }}
          >
            <span className="material-symbols-outlined text-sm">settings</span>
            Configuración
          </a>
          {session && config.provider === 'supabase' && (
            <button
              onClick={onLogout}
              className="btn-secondary flex items-center gap-2"
              style={{ padding: '10px 20px', fontSize: '0.8rem' }}
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              Cerrar Sesión
            </button>
          )}
          <a
            href={backUrl}
            className="btn-secondary flex items-center gap-2"
            style={{ padding: '10px 20px', fontSize: '0.8rem', textDecoration: 'none' }}
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Volver al Sitio
          </a>
        </div>
      </div>
    </header>
  );
}
