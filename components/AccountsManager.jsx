import React, { useState } from 'react';
import PasswordStrengthInput from './PasswordStrengthInput.jsx';
import HoldToConfirmButton from './HoldToConfirmButton.jsx';

export default function AccountsManager() {
  const [accounts, setAccounts] = useState([
    { id: '1', name: 'Andrea Calvo', email: 'admin@glosaurio.com', role: 'Administrador', date: '2026-08-10' },
    { id: '2', name: 'Javier Calvo', email: 'javier@suenotravel.com', role: 'Administrador', date: '2026-08-12' }
  ]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Real-time strength score check to block/allow submission
  const isPasswordValid = 
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isPasswordValid) return;

    const newAccount = {
      id: String(Date.now()),
      name,
      email,
      role: 'Administrador',
      date: new Date().toISOString().split('T')[0]
    };

    setAccounts([...accounts, newAccount]);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setShowModal(false);
  };

  const handleDelete = (id) => {
    setAccounts(accounts.filter(acc => acc.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-headline-md text-[var(--on-surface)]">Gestión de Cuentas</h2>
          <p className="text-sm text-[var(--on-surface-variant)] mt-1">Administra los accesos de usuario para este panel de control.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2 text-sm whitespace-nowrap self-start sm:self-center"
          style={{ padding: '8px 16px', borderRadius: '10px' }}
        >
          <span className="material-symbols-outlined text-sm">person_add</span>
          Crear Cuenta
        </button>
      </div>

      {/* Accounts List Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" style={{ minWidth: '600px' }}>
          <thead>
            <tr className="border-b border-[var(--outline-variant)] text-xs font-semibold uppercase tracking-wider text-[var(--on-surface)]">
              <th className="pb-3 pr-2" style={{ width: '30%' }}>Nombre Completo</th>
              <th className="pb-3 pr-2" style={{ width: '30%' }}>Email</th>
              <th className="pb-3 pr-2" style={{ width: '20%' }}>Rol</th>
              <th className="pb-3 pr-2" style={{ width: '10%' }}>Fecha Creado</th>
              <th className="pb-3 text-right" style={{ width: '10%' }}>Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--outline-variant)]">
            {accounts.map(acc => (
              <tr key={acc.id} className="text-sm">
                <td className="py-4 font-semibold text-[var(--on-surface)] pr-2">{acc.name}</td>
                <td className="py-4 text-[var(--on-surface-variant)] pr-2">{acc.email}</td>
                <td className="py-4 text-[var(--on-surface-variant)] pr-2">
                  <span className="px-2 py-1 rounded bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-[var(--primary)] text-xs font-medium">
                    {acc.role}
                  </span>
                </td>
                <td className="py-4 text-[var(--on-surface-variant)] pr-2">{acc.date}</td>
                <td className="py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <HoldToConfirmButton
                      onConfirm={() => handleDelete(acc.id)}
                      message="¿Eliminar?"
                      confirmMessage="Ok"
                      className="px-2 py-1 text-xs"
                      style={{ padding: '4px 8px', borderRadius: '6px' }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '480px',
            backgroundColor: '#111827', // Fondo sólido premium para evitar interferencia visual con el fondo difuminado
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.7), 0 10px 10px -5px rgba(0, 0, 0, 0.7)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff' }}>Crear Nueva Cuenta</h3>
              <button 
                type="button" 
                onClick={resetForm}
                style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="font-label-md block mb-1 text-xs uppercase tracking-wider font-semibold" style={{ color: '#e2e8f0' }}>Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Andrea Calvo"
                  className="form-control"
                />
              </div>

              <div>
                <label className="font-label-md block mb-1 text-xs uppercase tracking-wider font-semibold" style={{ color: '#e2e8f0' }}>Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ej: admin@glosaurio.com"
                  className="form-control"
                />
              </div>

              <div>
                <label className="font-label-md block mb-1 text-xs uppercase tracking-wider font-semibold" style={{ color: '#e2e8f0' }}>Contraseña</label>
                <PasswordStrengthInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ej: Mypass123!"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{ 
                    padding: '8px 16px', 
                    borderRadius: '10px', 
                    backgroundColor: '#374151', 
                    color: '#ffffff', 
                    border: '1px solid rgba(255,255,255,0.15)',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!isPasswordValid}
                  className="btn-primary"
                  style={{ 
                    padding: '8px 16px', 
                    borderRadius: '10px',
                    opacity: isPasswordValid ? 1 : 0.5,
                    cursor: isPasswordValid ? 'pointer' : 'not-allowed'
                  }}
                >
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
