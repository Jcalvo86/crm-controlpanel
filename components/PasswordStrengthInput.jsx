import React, { useState } from 'react';

export default function PasswordStrengthInput({
  value,
  onChange,
  id = 'password',
  placeholder = 'Crea una contraseña segura',
  required = true
}) {
  const [showPassword, setShowPassword] = useState(false);

  // Requerimientos individuales
  const checks = {
    length: value.length >= 8,
    hasUpper: /[A-Z]/.test(value),
    hasNumber: /[0-9]/.test(value),
    hasSpecial: /[^A-Za-z0-9]/.test(value)
  };

  // Calcular nivel de fuerza (0 a 4)
  const strengthScore = Object.values(checks).filter(Boolean).length;

  // Determinar color de la barra y texto descriptivo
  const getStrengthMeta = (score) => {
    if (!value) return { label: 'Sin ingresar', color: '#6b7280', bars: 0 };
    switch (score) {
      case 1:
        return { label: 'Muy Débil', color: '#ef4444', bars: 1 };
      case 2:
        return { label: 'Débil / Aceptable', color: '#f97316', bars: 2 };
      case 3:
        return { label: 'Buena', color: '#eab308', bars: 3 };
      case 4:
        return { label: 'Fuerte', color: '#10b981', bars: 4 };
      default:
        return { label: 'Muy Débil', color: '#ef4444', bars: 1 };
    }
  };

  const meta = getStrengthMeta(strengthScore);

  const requirementItem = (satisfied, text) => (
    <div className="flex items-center gap-2 text-xs transition-colors duration-200" style={{ color: satisfied ? '#10b981' : '#94a3b8' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '14px', color: satisfied ? '#10b981' : '#64748b' }}>
        {satisfied ? 'check_circle' : 'circle'}
      </span>
      <span>{text}</span>
    </div>
  );

  return (
    <div className="password-strength-container" style={{ width: '100%' }}>
      {/* Campo con Toggle de Ojo */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type={showPassword ? 'text' : 'password'}
          id={id}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className="form-control"
          style={{ paddingRight: '45px' }}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          style={{
            position: 'absolute',
            right: '10px',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '5px'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            {showPassword ? 'visibility_off' : 'visibility'}
          </span>
        </button>
      </div>

      {/* Indicador de Fuerza (Barra de 4 niveles) */}
      <div style={{ marginTop: '8px' }}>
        <div style={{ display: 'flex', gap: '4px', height: '6px' }}>
          {[1, 2, 3, 4].map((level) => {
            const isActive = meta.bars >= level;
            return (
              <div
                key={level}
                style={{
                  flex: 1,
                  borderRadius: '3px',
                  backgroundColor: isActive ? meta.color : 'var(--bg-tertiary)',
                  transition: 'background-color 0.3s ease'
                }}
              />
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Fuerza:</span>
          <span style={{ fontSize: '11px', fontWeight: 600, color: meta.color }}>{meta.meta_label || meta.label}</span>
        </div>
      </div>

      {/* Requerimientos */}
      <div style={{
        marginTop: '10px',
        padding: '10px',
        borderRadius: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        {requirementItem(checks.length, 'Mínimo 8 caracteres')}
        {requirementItem(checks.hasUpper, 'Al menos una letra mayúscula')}
        {requirementItem(checks.hasNumber, 'Al menos un número')}
        {requirementItem(checks.hasSpecial, 'Al menos un carácter especial (símbolo)')}
      </div>
    </div>
  );
}
