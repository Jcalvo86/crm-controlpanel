import React from 'react';

export default function LocationFormEditor({
  formData,
  setFormData,
  locations = [],
  activePanels = {},
  expandedSections = {},
  toggleSection = () => {}
}) {
  // Filter regions from locations prop
  const regionOptions = (locations || []).filter(l => l.type === 'region' || l.type === undefined);

  // Common change handler
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Amenities change handler
  const handleAmenityChange = (key, checked) => {
    setFormData(prev => ({
      ...prev,
      amenities: {
        ...(prev.amenities || {}),
        [key]: checked
      }
    }));
  };

  // Dynamic list handler for Highlights (simple text array)
  const addHighlight = () => {
    const nextHighlights = [...(formData.highlights || []), ''];
    handleChange('highlights', nextHighlights);
  };

  const handleHighlightChange = (index, value) => {
    const nextHighlights = [...(formData.highlights || [])];
    nextHighlights[index] = value;
    handleChange('highlights', nextHighlights);
  };

  const removeHighlight = (index) => {
    const nextHighlights = [...(formData.highlights || [])];
    nextHighlights.splice(index, 1);
    handleChange('highlights', nextHighlights);
  };

  // Dynamic list handler for Nearby Locations (simple text array)
  const addNearby = () => {
    const nextNearby = [...(formData.nearbyLocations || []), ''];
    handleChange('nearbyLocations', nextNearby);
  };

  const handleNearbyChange = (index, value) => {
    const nextNearby = [...(formData.nearbyLocations || [])];
    nextNearby[index] = value;
    handleChange('nearbyLocations', nextNearby);
  };

  const removeNearby = (index) => {
    const nextNearby = [...(formData.nearbyLocations || [])];
    nextNearby.splice(index, 1);
    handleChange('nearbyLocations', nextNearby);
  };

  // Dynamic list handler for Suggested Itineraries (objects with title, duration, desc)
  const addItinerary = () => {
    const nextItineraries = [...(formData.suggestedItineraries || []), { title: '', duration: '', description: '' }];
    handleChange('suggestedItineraries', nextItineraries);
  };

  const handleItineraryChange = (index, field, value) => {
    const nextItineraries = [...(formData.suggestedItineraries || [])];
    nextItineraries[index] = { ...nextItineraries[index], [field]: value };
    handleChange('suggestedItineraries', nextItineraries);
  };

  const removeItinerary = (index) => {
    const nextItineraries = [...(formData.suggestedItineraries || [])];
    nextItineraries.splice(index, 1);
    handleChange('suggestedItineraries', nextItineraries);
  };

  const isRegion = formData.type === 'region';

  return (
    <div className="space-y-6">
      {/* 1. Identity Section (Always Visible) */}
      <section id="sec-identity" className="glass-panel p-8">
        <h2 className="font-headline-sm mb-6 flex items-center gap-2" style={{ color: 'var(--on-surface)' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>pin_drop</span>
          Identidad de la Ubicación
        </h2>
        
        {/* Selector de Tipo (Pestañas premium) */}
        <div className="mb-6">
          <label className="font-label-md block mb-2" style={{ color: 'var(--on-surface-variant)' }}>Tipo de Entrada</label>
          <div className="flex gap-3 bg-[var(--surface-container-low)] p-1.5 rounded-xl border border-[var(--outline-variant)] w-fit">
            <button
              type="button"
              onClick={() => handleChange('type', 'region')}
              className={`px-4 py-2 rounded-lg font-label-md flex items-center gap-2 transition-all ${
                isRegion 
                  ? 'bg-[var(--primary)] text-[var(--on-primary)] shadow-md' 
                  : 'text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]'
              }`}
            >
              <span className="material-symbols-outlined text-sm">map</span>
              Región (Macro)
            </button>
            <button
              type="button"
              onClick={() => handleChange('type', 'location')}
              className={`px-4 py-2 rounded-lg font-label-md flex items-center gap-2 transition-all ${
                !isRegion 
                  ? 'bg-[var(--primary)] text-[var(--on-primary)] shadow-md' 
                  : 'text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]'
              }`}
            >
              <span className="material-symbols-outlined text-sm">location_on</span>
              Ubicación (Micro)
            </button>
          </div>
        </div>

        {/* Campos dinámicos de identidad */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2 flex flex-col gap-2">
            <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Nombre / Título *</label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder={isRegion ? 'Ej: Chile Costa, Patagonia, Valle de Colchagua' : 'Ej: Casa de Pablo Neruda (La Sebastiana), Viña del Mar'}
              className="form-input font-headline-sm"
              style={{ fontSize: '1.1rem' }}
            />
          </div>

          {isRegion ? (
            <>
              <div className="md:col-span-2 flex flex-col gap-2">
                <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Subtítulo Inspirador</label>
                <input
                  type="text"
                  value={formData.subtitle || ''}
                  onChange={(e) => handleChange('subtitle', e.target.value)}
                  placeholder="Ej: Playas, gastronomía marina y atardeceres sobre el Pacífico"
                  className="form-input"
                />
              </div>
              <div className="md:col-span-2 flex flex-col gap-2">
                <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Estilos de Viaje (Separados por coma)</label>
                <input
                  type="text"
                  value={Array.isArray(formData.travelStyles) ? formData.travelStyles.join(', ') : (formData.travelStyles || '')}
                  onChange={(e) => handleChange('travelStyles', e.target.value)}
                  placeholder="Ej: Familiar, Gastronomía, Relax, Surf"
                  className="form-input"
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Categoría / Tipo de Ubicación</label>
                <input
                  type="text"
                  value={formData.locationType || ''}
                  onChange={(e) => handleChange('locationType', e.target.value)}
                  placeholder="Ej: Museo / Sitio Histórico, Ciudad Costera / Balneario"
                  className="form-input"
                  list="location-type-suggestions"
                />
                <datalist id="location-type-suggestions">
                  <option value="Museo / Sitio Histórico" />
                  <option value="Ciudad Costera / Balneario" />
                  <option value="Atracción Natural" />
                  <option value="Parque Nacional" />
                  <option value="Restaurante / Gastronomía" />
                  <option value="Viñedo / Enoturismo" />
                </datalist>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Región Padre (Macro)</label>
                <select
                  value={formData.parentRegionId || ''}
                  onChange={(e) => handleChange('parentRegionId', e.target.value)}
                  className="form-select bg-[var(--surface-container-low)]"
                  style={{ height: '42px' }}
                >
                  <option value="">-- Selecciona una Región --</option>
                  {regionOptions.map(reg => (
                    <option key={reg.id} value={reg.id}>{reg.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── SECCIONES DE REGIÓN ─────────────────────────────────── */}
      {isRegion && (
        <>
          {/* Guía Logística */}
          {activePanels.logistics && (
            <section id="sec-logistics" className="glass-panel">
              <div 
                onClick={() => toggleSection('logistics')}
                className="p-6 flex items-center justify-between cursor-pointer border-b border-[var(--outline-variant)]"
              >
                <h3 className="font-headline-sm flex items-center gap-2" style={{ color: 'var(--on-surface)' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>local_shipping</span>
                  Guía Logística General
                </h3>
                <span className="material-symbols-outlined transition-transform duration-200" style={{ transform: expandedSections.logistics ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  expand_more
                </span>
              </div>

              <div className="transition-all duration-300 overflow-hidden" style={{ display: expandedSections.logistics ? 'block' : 'none' }}>
                <div className="p-8 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-2">
                      <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Mejor época para visitar</label>
                      <input
                        type="text"
                        value={formData.guideBestSeason || ''}
                        onChange={(e) => handleChange('guideBestSeason', e.target.value)}
                        placeholder="Ej: Clima templado Octubre a Abril. Temporada alta de Enero a Febrero."
                        className="form-input"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Duración recomendada</label>
                      <input
                        type="text"
                        value={formData.guideRecommendedDuration || ''}
                        onChange={(e) => handleChange('guideRecommendedDuration', e.target.value)}
                        placeholder="Ej: Ideal para recorrer en 3 a 5 días"
                        className="form-input"
                      />
                    </div>
                    <div className="md:col-span-2 flex flex-col gap-2">
                      <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Cómo moverse por la región</label>
                      <textarea
                        value={formData.guideHowToGetAround || ''}
                        onChange={(e) => handleChange('guideHowToGetAround', e.target.value)}
                        rows={2}
                        placeholder="Ej: Conviene rentar auto para visitar caletas alejadas, o usar buses interurbanos."
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Organización de Contenido / Rutas */}
          {activePanels.routes && (
            <section id="sec-routes" className="glass-panel">
              <div 
                onClick={() => toggleSection('routes')}
                className="p-6 flex items-center justify-between cursor-pointer border-b border-[var(--outline-variant)]"
              >
                <h3 className="font-headline-sm flex items-center gap-2" style={{ color: 'var(--on-surface)' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>route</span>
                  Organización del Contenido y Rutas
                </h3>
                <span className="material-symbols-outlined transition-transform duration-200" style={{ transform: expandedSections.routes ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  expand_more
                </span>
              </div>

              <div className="transition-all duration-300 overflow-hidden" style={{ display: expandedSections.routes ? 'block' : 'none' }}>
                <div className="p-8 space-y-6">
                  {/* Mapa */}
                  <div className="flex flex-col gap-2">
                    <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>URL de Imagen del Mapa de la Región</label>
                    <input
                      type="text"
                      value={formData.mapUrl || ''}
                      onChange={(e) => handleChange('mapUrl', e.target.value)}
                      placeholder="https://ejemplo.com/mapa.jpg"
                      className="form-input"
                    />
                  </div>

                  {/* Itinerarios Sugeridos */}
                  <div className="space-y-4">
                    <h4 className="font-title-md border-b border-[var(--outline-variant)] pb-2" style={{ color: 'var(--on-surface)' }}>Itinerarios Sugeridos</h4>
                    
                    {(formData.suggestedItineraries || []).map((it, idx) => (
                      <div key={idx} className="relative bg-[var(--surface-container-low)] p-6 rounded-xl border border-[var(--outline-variant)] space-y-4">
                        {/* Botón flotante eliminar */}
                        <button
                          type="button"
                          onClick={() => removeItinerary(idx)}
                          className="absolute top-4 right-4 btn-icon text-[var(--error)]"
                          title="Eliminar Itinerario"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pr-10">
                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold" style={{ color: 'var(--on-surface-variant)' }}>Título de la Ruta</label>
                            <input
                              type="text"
                              value={it.title || ''}
                              onChange={(e) => handleItineraryChange(idx, 'title', e.target.value)}
                              placeholder="Ej: Ruta de 3 días por la Costa"
                              className="form-input text-sm"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold" style={{ color: 'var(--on-surface-variant)' }}>Duración</label>
                            <input
                              type="text"
                              value={it.duration || ''}
                              onChange={(e) => handleItineraryChange(idx, 'duration', e.target.value)}
                              placeholder="Ej: 3 días"
                              className="form-input text-sm"
                            />
                          </div>
                          <div className="md:col-span-3 flex flex-col gap-1">
                            <label className="text-xs font-semibold" style={{ color: 'var(--on-surface-variant)' }}>Descripción de la Ruta</label>
                            <textarea
                              value={it.description || ''}
                              onChange={(e) => handleItineraryChange(idx, 'description', e.target.value)}
                              rows={2}
                              placeholder="Describe brevemente las paradas o atractivos de este itinerario..."
                              className="form-input text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Botón Añadir abajo */}
                    <button
                      type="button"
                      onClick={addItinerary}
                      className="btn-secondary flex items-center gap-2 text-xs"
                      style={{ padding: '6px 12px' }}
                    >
                      <span className="material-symbols-outlined text-xs">add</span>
                      Añadir Itinerario Sugerido
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* ── SECCIONES DE UBICACIÓN ──────────────────────────────── */}
      {!isRegion && (
        <>
          {/* Datos Prácticos */}
          {activePanels.practicalData && (
            <section id="sec-practicalData" className="glass-panel">
              <div 
                onClick={() => toggleSection('practicalData')}
                className="p-6 flex items-center justify-between cursor-pointer border-b border-[var(--outline-variant)]"
              >
                <h3 className="font-headline-sm flex items-center gap-2" style={{ color: 'var(--on-surface)' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>info</span>
                  Datos Prácticos de Visita
                </h3>
                <span className="material-symbols-outlined transition-transform duration-200" style={{ transform: expandedSections.practicalData ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  expand_more
                </span>
              </div>

              <div className="transition-all duration-300 overflow-hidden" style={{ display: expandedSections.practicalData ? 'block' : 'none' }}>
                <div className="p-8 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="md:col-span-2 flex flex-col gap-2">
                      <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Dirección</label>
                      <input
                        type="text"
                        value={formData.address || ''}
                        onChange={(e) => handleChange('address', e.target.value)}
                        placeholder="Ej: Av. Marina s/n, Viña del Mar"
                        className="form-input"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Tiempo de Visita Estimado</label>
                      <input
                        type="text"
                        value={formData.estimatedVisitTime || ''}
                        onChange={(e) => handleChange('estimatedVisitTime', e.target.value)}
                        placeholder="Ej: 1 a 2 horas"
                        className="form-input"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Ciudad</label>
                      <input
                        type="text"
                        value={formData.city || ''}
                        onChange={(e) => handleChange('city', e.target.value)}
                        placeholder="Ej: Viña del Mar"
                        className="form-input"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>País</label>
                      <input
                        type="text"
                        value={formData.country || ''}
                        onChange={(e) => handleChange('country', e.target.value)}
                        placeholder="Ej: Chile"
                        className="form-input"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Google Maps / Waze URL</label>
                      <input
                        type="text"
                        value={formData.geolocationUrl || ''}
                        onChange={(e) => handleChange('geolocationUrl', e.target.value)}
                        placeholder="https://maps.app.goo.gl/..."
                        className="form-input"
                      />
                    </div>
                    <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="flex flex-col gap-2">
                        <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Horarios y Días de apertura</label>
                        <textarea
                          value={formData.openingHours || ''}
                          onChange={(e) => handleChange('openingHours', e.target.value)}
                          rows={2}
                          placeholder="Ej: Martes a Domingo de 10:00 a 18:00 hrs. Lunes cerrado."
                          className="form-input"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Precios / Entradas</label>
                        <textarea
                          value={formData.pricing || ''}
                          onChange={(e) => handleChange('pricing', e.target.value)}
                          rows={2}
                          placeholder="Ej: General: $4.000. Niños y estudiantes: $1.500."
                          className="form-input"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-3 flex flex-col gap-2">
                      <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Enlace de Compra de Tickets</label>
                      <input
                        type="text"
                        value={formData.ticketUrl || ''}
                        onChange={(e) => handleChange('ticketUrl', e.target.value)}
                        placeholder="https://compra-entradas.com/la-sebastiana"
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Servicios y Amenidades */}
          {activePanels.amenities && (
            <section id="sec-amenities" className="glass-panel">
              <div 
                onClick={() => toggleSection('amenities')}
                className="p-6 flex items-center justify-between cursor-pointer border-b border-[var(--outline-variant)]"
              >
                <h3 className="font-headline-sm flex items-center gap-2" style={{ color: 'var(--on-surface)' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>room_service</span>
                  Servicios y Amenidades
                </h3>
                <span className="material-symbols-outlined transition-transform duration-200" style={{ transform: expandedSections.amenities ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  expand_more
                </span>
              </div>

              <div className="transition-all duration-300 overflow-hidden" style={{ display: expandedSections.amenities ? 'block' : 'none' }}>
                <div className="p-8">
                  <p className="text-xs text-[var(--on-surface-variant)] mb-5">Marca los servicios disponibles en este punto de interés:</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                      { key: 'parking', label: '🚗 Estacionamiento', icon: 'local_parking' },
                      { key: 'accessibility', label: '♿ Accesibilidad', icon: 'accessible' },
                      { key: 'restrooms', label: '🚻 Baños públicos', icon: 'wc' },
                      { key: 'petFriendly', label: '🐾 Pet friendly', icon: 'pets' },
                      { key: 'kidsFriendly', label: '👶 Apto niños', icon: 'child_care' }
                    ].map(item => (
                      <label 
                        key={item.key} 
                        className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer select-none transition-all ${
                          formData.amenities?.[item.key] 
                            ? 'bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] border-[var(--primary)] text-[var(--on-surface)]'
                            : 'bg-[var(--surface-container-low)] border-[var(--outline-variant)] text-[var(--on-surface-variant)] hover:border-[var(--outline)]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!formData.amenities?.[item.key]}
                          onChange={(e) => handleAmenityChange(item.key, e.target.checked)}
                          className="rounded text-primary focus:ring-primary h-4 w-4"
                          style={{ accentColor: 'var(--primary)' }}
                        />
                        <span className="text-xs font-semibold">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Experiencia, Highlights y Tips */}
          {activePanels.highlightsAndTips && (
            <section id="sec-highlightsAndTips" className="glass-panel">
              <div 
                onClick={() => toggleSection('highlightsAndTips')}
                className="p-6 flex items-center justify-between cursor-pointer border-b border-[var(--outline-variant)]"
              >
                <h3 className="font-headline-sm flex items-center gap-2" style={{ color: 'var(--on-surface)' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>explore</span>
                  Contenido de la Experiencia
                </h3>
                <span className="material-symbols-outlined transition-transform duration-200" style={{ transform: expandedSections.highlightsAndTips ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  expand_more
                </span>
              </div>

              <div className="transition-all duration-300 overflow-hidden" style={{ display: expandedSections.highlightsAndTips ? 'block' : 'none' }}>
                <div className="p-8 space-y-6">
                  {/* Descripción / Qué es */}
                  <div className="flex flex-col gap-2">
                    <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Descripción / ¿Qué es?</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => handleChange('description', e.target.value)}
                      rows={4}
                      placeholder="Escribe una reseña atractiva sobre la historia o la experiencia principal de visitar este lugar..."
                      className="form-input"
                    />
                  </div>

                  {/* Highlights (Qué no te puedes perder) */}
                  <div className="space-y-3">
                    <label className="font-label-md block" style={{ color: 'var(--on-surface-variant)' }}>Highlights / Imperdibles</label>
                    {(formData.highlights || []).map((highlight, idx) => (
                      <div key={idx} className="relative flex items-center">
                        <input
                          type="text"
                          value={highlight}
                          onChange={(e) => handleHighlightChange(idx, e.target.value)}
                          placeholder="Ej: Sube a la terraza del tercer piso para la mejor vista del puerto."
                          className="form-input w-full pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => removeHighlight(idx)}
                          className="absolute right-2 text-[var(--error)] flex items-center justify-center"
                          style={{ width: '28px', height: '28px' }}
                          title="Eliminar Highlight"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addHighlight}
                      className="btn-secondary flex items-center gap-2 text-xs"
                      style={{ padding: '6px 12px' }}
                    >
                      <span className="material-symbols-outlined text-xs">add</span>
                      Añadir Highlight
                    </button>
                  </div>

                  {/* Tips de viajero */}
                  <div className="flex flex-col gap-2">
                    <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Tips del Viajero (Evitar multitudes, vestimenta, dónde comer)</label>
                    <textarea
                      value={formData.travelerTips || ''}
                      onChange={(e) => handleChange('travelerTips', e.target.value)}
                      rows={3}
                      placeholder="Ej: Mejor hora para visitarlo es a las 11 AM para evitar los buses turísticos. Hay una cafetería de especialidad cruzando la calle."
                      className="form-input"
                    />
                  </div>

                  {/* Conexiones / Lugares cercanos */}
                  <div className="space-y-3">
                    <label className="font-label-md block" style={{ color: 'var(--on-surface-variant)' }}>Lugares Cercanos Recomendados</label>
                    {(formData.nearbyLocations || []).map((place, idx) => (
                      <div key={idx} className="relative flex items-center">
                        <input
                          type="text"
                          value={place}
                          onChange={(e) => handleNearbyChange(idx, e.target.value)}
                          placeholder="Ej: Playa Caleta Abarca (a menos de 10 min)"
                          className="form-input w-full pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => removeNearby(idx)}
                          className="absolute right-2 text-[var(--error)] flex items-center justify-center"
                          style={{ width: '28px', height: '28px' }}
                          title="Eliminar Conexión"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addNearby}
                      className="btn-secondary flex items-center gap-2 text-xs"
                      style={{ padding: '6px 12px' }}
                    >
                      <span className="material-symbols-outlined text-xs">add</span>
                      Añadir Lugar Cercano
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
