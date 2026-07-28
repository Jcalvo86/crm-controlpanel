import React from 'react';

export default function LoginView({
  email,
  setEmail,
  password,
  setPassword,
  authError,
  loadingAuth,
  onSubmit,
  renderHeader
}) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {renderHeader()}
      <div className="pt-[72px] flex items-center justify-center min-h-[calc(100vh-72px)] py-12 px-4">
        <div className="max-w-md w-full p-8 glass-card space-y-6">
          <div className="text-center">
            <span className="text-5xl block mb-2">🔒</span>
            <h2 className="font-headline-md text-[var(--on-surface)]">Área Privada CRM</h2>
            <p className="font-body-md text-[var(--on-surface-variant)] mt-1">Inicia sesión para gestionar el contenido.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="font-label-md block mb-1 text-[var(--on-surface-variant)]">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@glosaurio.com"
                className="form-input w-full"
              />
            </div>

            <div>
              <label className="font-label-md block mb-1 text-[var(--on-surface-variant)]">Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input w-full"
              />
            </div>

            {authError && (
              <div className="p-3 rounded-lg bg-[color-mix(in_srgb,var(--error)_15%,transparent)] border border-[var(--error)] text-xs text-[var(--error)]">
                ⚠️ {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={loadingAuth}
              className="btn-primary w-full justify-center py-3 flex items-center gap-2"
            >
              {loadingAuth ? (
                <span className="material-symbols-outlined spin text-lg">sync</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">login</span>
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
