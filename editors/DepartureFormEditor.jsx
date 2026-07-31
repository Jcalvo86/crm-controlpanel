import React from 'react';

export default function DepartureFormEditor({ formData, setFormData, travels = [] }) {
  const handleChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  return (
    <div className="glass-panel p-8 space-y-6">
      <h3 className="text-lg font-bold text-[var(--on-surface)] border-b border-[var(--outline-variant)] pb-3">
        Información de la Salida de Viaje
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Viaje Relacionado */}
        <div className="md:col-span-2">
          <label className="font-label-md block mb-2 text-[var(--on-surface-variant)]">
            Viaje / Plantilla Base *
          </label>
          <select
            value={formData.travelId || ''}
            onChange={(e) => handleChange('travelId', e.target.value)}
            className="form-input w-full"
            required
          >
            <option value="">-- Selecciona el viaje base --</option>
            {travels.map(t => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>

        {/* Fecha Salida */}
        <div>
          <label className="font-label-md block mb-2 text-[var(--on-surface-variant)]">
            Fecha de Salida *
          </label>
          <input
            type="date"
            value={formData.departureDate || ''}
            onChange={(e) => handleChange('departureDate', e.target.value)}
            className="form-input w-full"
            required
          />
        </div>

        {/* Fecha Retorno */}
        <div>
          <label className="font-label-md block mb-2 text-[var(--on-surface-variant)]">
            Fecha de Retorno (Opcional)
          </label>
          <input
            type="date"
            value={formData.endDate || ''}
            onChange={(e) => handleChange('endDate', e.target.value)}
            className="form-input w-full"
          />
        </div>

        {/* Cupo */}
        <div>
          <label className="font-label-md block mb-2 text-[var(--on-surface-variant)]">
            Cupos Totales *
          </label>
          <input
            type="number"
            min="0"
            value={formData.capacity !== undefined ? formData.capacity : 10}
            onChange={(e) => handleChange('capacity', e.target.value)}
            className="form-input w-full"
            required
          />
        </div>

        {/* Pasajeros Registrados */}
        <div>
          <label className="font-label-md block mb-2 text-[var(--on-surface-variant)]">
            Pasajeros Registrados
          </label>
          <input
            type="number"
            min="0"
            value={formData.passengersCount !== undefined ? formData.passengersCount : 0}
            onChange={(e) => handleChange('passengersCount', e.target.value)}
            className="form-input w-full"
          />
        </div>

        {/* Precio Especial */}
        <div>
          <label className="font-label-md block mb-2 text-[var(--on-surface-variant)]">
            Precio Especial (Opcional)
          </label>
          <input
            type="number"
            min="0"
            placeholder="Ej: 3200 (dejar en blanco para precio base)"
            value={formData.priceOverride || ''}
            onChange={(e) => handleChange('priceOverride', e.target.value)}
            className="form-input w-full"
          />
        </div>

        {/* Estado */}
        <div>
          <label className="font-label-md block mb-2 text-[var(--on-surface-variant)]">
            Estado de la Salida *
          </label>
          <select
            value={formData.status || 'open'}
            onChange={(e) => handleChange('status', e.target.value)}
            className="form-input w-full"
            required
          >
            <option value="open">🟢 Abierta / Recibiendo Reservas</option>
            <option value="confirmed">💎 Confirmada / Salida Asegurada</option>
            <option value="closed">🔴 Cerrada / Sin Cupos</option>
            <option value="cancelled">⚪ Cancelada</option>
          </select>
        </div>
      </div>
    </div>
  );
}
