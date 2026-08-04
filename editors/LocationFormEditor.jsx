import React from 'react';
import { genUploader } from "uploadthing/client";

const uploader = genUploader({
  url: "https://project-organizer-one.vercel.app/api/uploadthing"
});

export default function LocationFormEditor({
  formData,
  setFormData,
  locations = [],
  activePanels = {},
  expandedSections = {},
  toggleSection = () => {},
  isEditing = false
}) {
  // Filter regions from locations prop
  const regionOptions = (locations || []).filter(l => l.type === 'region' || l.type === undefined);
  const cityOptions = (locations || []).filter(l => l.type === 'city');

  const fileInputRef = React.useRef(null);
  const [uploadingField, setUploadingField] = React.useState(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const handleUploadFile = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await uploader.uploadFiles("imageUploader", {
        files: [file]
      });
      if (res && res[0]) {
        handleChange(field, res[0].url);
      }
    } catch (err) {
      console.error(err);
      alert(`Error al subir el archivo: ${err.message}. Asegúrate de que el endpoint 'imageUploader' existe y la API de tu otro proyecto permite peticiones de origen cruzado (CORS) para http://localhost:5173.`);
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset
    }
  };

  const triggerUpload = (field) => {
    setUploadingField(field);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const parentRegion = React.useMemo(() => {
    if (!formData.parentRegionId) return null;
    return (locations || []).find(l => l.id === formData.parentRegionId);
  }, [formData.parentRegionId, locations]);

  const parentRegionMapUrl = parentRegion ? (parentRegion.mapUrl || parentRegion.map_url) : null;

  const handleMapClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    handleChange('mapPosX', parseFloat(x.toFixed(1)));
    handleChange('mapPosY', parseFloat(y.toFixed(1)));
  };

  const cityCategories = ['Ciudad Costera', 'Ciudad Antigua', 'Metrópolis', 'Pueblo Pintoresco', 'Ciudad Imperial', 'Oasis', 'Zona de Montaña'];
  const attractionCategories = ['Museo / Galería', 'Sitio Arqueológico', 'Monumento Histórico', 'Atracción Natural', 'Parque Nacional', 'Templo / Mezquita', 'Mercado / Bazar', 'Viñedo / Enoturismo', 'Restaurante / Gastronomía'];

  const currentCategories = React.useMemo(() => {
    if (!formData.locationType) return [];
    return formData.locationType.split(',').map(s => s.trim()).filter(Boolean);
  }, [formData.locationType]);

  const toggleCategory = (cat) => {
    let next;
    if (currentCategories.includes(cat)) {
      next = currentCategories.filter(c => c !== cat);
    } else {
      next = [...currentCategories, cat];
    }
    handleChange('locationType', next.join(', '));
  };

  const handleParentLocationChange = (value) => {
    if (!value) {
      handleChange('parentRegionId', '');
      handleChange('parentCityId', '');
      return;
    }
    const [type, id] = value.split(':');
    if (type === 'region') {
      handleChange('parentRegionId', id);
      handleChange('parentCityId', '');
    } else if (type === 'city') {
      handleChange('parentCityId', id);
      const parentCity = (locations || []).find(l => l.id === id);
      if (parentCity) {
        const regionId = parentCity.parentRegionId || parentCity.parent_region_id || '';
        handleChange('parentRegionId', regionId);
      }
    }
  };

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
  const categoriesToOffer = formData.type === 'city' ? cityCategories : attractionCategories;

  return (
    <div className="space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleUploadFile(e, uploadingField)}
        className="hidden"
        accept="image/*"
      />
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
              disabled={isEditing}
              onClick={() => !isEditing && handleChange('type', 'region')}
              className={`px-4 py-2 rounded-lg font-label-md flex items-center gap-2 transition-all ${
                isRegion 
                  ? 'bg-[var(--primary)] text-[var(--on-primary)] shadow-md' 
                  : 'text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]'
              } ${isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <span className="material-symbols-outlined text-sm">map</span>
              Región (Macro)
            </button>
            <button
              type="button"
              disabled={isEditing}
              onClick={() => !isEditing && handleChange('type', 'city')}
              className={`px-4 py-2 rounded-lg font-label-md flex items-center gap-2 transition-all ${
                formData.type === 'city' 
                  ? 'bg-[var(--primary)] text-[var(--on-primary)] shadow-md' 
                  : 'text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]'
              } ${isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <span className="material-symbols-outlined text-sm">apartment</span>
              Ciudad o Área
            </button>
            <button
              type="button"
              disabled={isEditing}
              onClick={() => !isEditing && handleChange('type', 'attraction')}
              className={`px-4 py-2 rounded-lg font-label-md flex items-center gap-2 transition-all ${
                formData.type === 'attraction' || (!formData.type || formData.type === 'location')
                  ? 'bg-[var(--primary)] text-[var(--on-primary)] shadow-md' 
                  : 'text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]'
              } ${isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <span className="material-symbols-outlined text-sm">attractions</span>
              Atracción (Micro)
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
              placeholder={
                isRegion 
                  ? 'Ej: Chile Costa, Patagonia, Valle de Colchagua' 
                  : formData.type === 'city'
                    ? 'Ej: Cairo, Viña del Mar, Lúxor'
                    : 'Ej: Casa de Pablo Neruda (La Sebastiana), Pirámides de Giza'
              }
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
              <div className="md:col-span-2 flex flex-col gap-2">
                <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Categorías / Tipos de Ubicación (Puedes seleccionar varias)</label>
                <div className="flex flex-wrap gap-2 mb-1">
                  {categoriesToOffer.map(cat => {
                    const isSelected = currentCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-[var(--primary-container)] text-[var(--on-primary-container)] border-[var(--primary)] shadow-sm'
                            : 'bg-[var(--surface-container-low)] text-[var(--on-surface-variant)] border-[var(--outline-variant)] hover:border-[var(--outline)]'
                        }`}
                      >
                        {isSelected ? '✓ ' : ''}{cat}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={formData.locationType || ''}
                  onChange={(e) => handleChange('locationType', e.target.value)}
                  placeholder="Escribe categorías personalizadas separadas por comas"
                  className="form-input"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Ubicación Padre (Región o Ciudad) {formData.type === 'city' && '*'}</label>
                <select
                  value={formData.parentCityId ? `city:${formData.parentCityId}` : (formData.parentRegionId ? `region:${formData.parentRegionId}` : '')}
                  onChange={(e) => handleParentLocationChange(e.target.value)}
                  required={formData.type === 'city'}
                  className="form-select bg-[var(--surface-container-low)]"
                >
                  <option value="">-- Selecciona Ubicación Padre --</option>
                  {formData.type === 'city' ? (
                    regionOptions.map(reg => (
                      <option key={reg.id} value={`region:${reg.id}`}>{reg.name} (Región)</option>
                    ))
                  ) : (
                    regionOptions.map(reg => (
                      <React.Fragment key={reg.id}>
                        <option value={`region:${reg.id}`} style={{ fontWeight: 'bold' }}>{reg.name} (Región)</option>
                        {cityOptions.filter(city => {
                          const pReg = city.parentRegionId || city.parent_region_id;
                          return pReg === reg.id;
                        }).map(city => (
                          <option key={city.id} value={`city:${city.id}`}>
                            &nbsp;&nbsp;— {city.name} (Ciudad/Área)
                          </option>
                        ))}
                      </React.Fragment>
                    ))
                  )}
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
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={formData.mapUrl || ''}
                        onChange={(e) => handleChange('mapUrl', e.target.value)}
                        placeholder="https://ejemplo.com/mapa.jpg"
                        className="form-input flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => triggerUpload('mapUrl')}
                        disabled={isUploading}
                        className="btn-secondary flex items-center gap-1.5 shrink-0"
                        style={{ height: '48px', padding: '0 16px' }}
                      >
                        <span className={`material-symbols-outlined text-sm ${isUploading && uploadingField === 'mapUrl' ? 'animate-spin' : ''}`}>
                          {isUploading && uploadingField === 'mapUrl' ? 'sync' : 'upload'}
                        </span>
                        {isUploading && uploadingField === 'mapUrl' ? 'Subiendo...' : 'Subir Mapa'}
                      </button>
                    </div>
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
          {/* Ubicación en el Mapa */}
          {activePanels.mapPosition && (
            <section id="sec-mapPosition" className="glass-panel">
              <div 
                onClick={() => toggleSection('mapPosition')}
                className="p-6 flex items-center justify-between cursor-pointer border-b border-[var(--outline-variant)]"
              >
                <h3 className="font-headline-sm flex items-center gap-2" style={{ color: 'var(--on-surface)' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>map</span>
                  Ubicación en el Mapa
                </h3>
                <span className="material-symbols-outlined transition-transform duration-200" style={{ transform: expandedSections.mapPosition ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  expand_more
                </span>
              </div>

              <div className="transition-all duration-300 overflow-hidden" style={{ display: expandedSections.mapPosition ? 'block' : 'none' }}>
                <div className="p-8 space-y-5">
                  {!parentRegionMapUrl ? (
                    <div className="p-4 bg-[color-mix(in_srgb,var(--error)_10%,transparent)] border border-[color-mix(in_srgb,var(--error)_30%,transparent)] rounded-xl text-sm text-[var(--on-surface)]">
                      ⚠️ Para usar la ubicación en el mapa, primero debes seleccionar una <strong>Ubicación Padre (Región)</strong> en la sección Identidad que tenga un mapa subido.
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-[var(--on-surface-variant)] mb-2">
                        Haz clic en cualquier punto del mapa para posicionar este destino (Ciudad o Atracción) dentro de la región de <strong>{parentRegion.name}</strong>. Los valores de X e Y se actualizarán automáticamente.
                      </p>
                      <div 
                        className="relative cursor-crosshair overflow-hidden rounded-lg border border-[var(--outline)] shadow-inner"
                        style={{ maxWidth: '100%', width: '500px', height: 'auto', aspectRatio: '4/3', backgroundColor: 'var(--surface-container-highest)', margin: '0 auto' }}
                        onClick={handleMapClick}
                      >
                        <img 
                          src={parentRegionMapUrl} 
                          alt={`Mapa de ${parentRegion.name}`}
                          className="w-full h-full object-cover select-none"
                        />
                        {formData.mapPosX !== undefined && formData.mapPosY !== undefined && formData.mapPosX !== '' && formData.mapPosY !== '' && (
                          <div 
                            className="absolute flex items-center justify-center -translate-x-1/2 -translate-y-1/2 select-none animate-bounce"
                            style={{
                              left: `${formData.mapPosX}%`,
                              top: `${formData.mapPosY}%`,
                              width: '32px',
                              height: '32px',
                              pointerEvents: 'none'
                            }}
                          >
                            <span className="material-symbols-outlined text-[var(--error)] text-3xl" style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.4))' }}>
                              pin_drop
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-4 mt-2 justify-center">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[var(--on-surface-variant)]">Posición X:</span>
                          <input 
                            type="number" 
                            min="0" 
                            max="100" 
                            step="0.1"
                            value={formData.mapPosX !== undefined ? formData.mapPosX : ''}
                            onChange={(e) => handleChange('mapPosX', e.target.value === '' ? '' : parseFloat(e.target.value))}
                            className="form-input text-xs w-20 px-2 py-1"
                          />
                          <span className="text-xs">%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[var(--on-surface-variant)]">Posición Y:</span>
                          <input 
                            type="number" 
                            min="0" 
                            max="100" 
                            step="0.1"
                            value={formData.mapPosY !== undefined ? formData.mapPosY : ''}
                            onChange={(e) => handleChange('mapPosY', e.target.value === '' ? '' : parseFloat(e.target.value))}
                            className="form-input text-xs w-20 px-2 py-1"
                          />
                          <span className="text-xs">%</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>
          )}

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
