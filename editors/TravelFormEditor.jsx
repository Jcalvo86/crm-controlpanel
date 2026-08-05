import React, { useState, useEffect } from 'react';
import HoldToConfirmButton from '../components/HoldToConfirmButton.jsx';
import { uploadFile } from '../utils/upload.js';

const formatOptionLabel = (loc) => {
  if (!loc) return '';
  const parts = [];
  if (loc.city) parts.push(loc.city);
  if (loc.country) parts.push(loc.country);
  return parts.length > 0 ? `${loc.name} (${parts.join(', ')})` : loc.name;
};

export default function TravelFormEditor({ formData, setFormData, locations = [] }) {
  // Estado para mantener la lista de días colapsados
  const [collapsedDays, setCollapsedDays] = useState({});
  const fileInputRef = React.useRef(null);
  const [uploadingDayIndex, setUploadingDayIndex] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadFile = async (e, dayIdx) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadFile(file);
      handleItineraryChange(dayIdx, 'imageUrl', url);
    } catch (err) {
      console.error(err);
      alert(`Error al subir el archivo: ${err.message}`);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const triggerUpload = (dayIdx) => {
    setUploadingDayIndex(dayIdx);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Efecto para colapsar todos los días al cambiar de item (o al iniciar)
  useEffect(() => {
    if (formData.itinerary && formData.itinerary.length > 0) {
      const initialCollapseState = {};
      formData.itinerary.forEach((_, idx) => {
        initialCollapseState[idx] = true;
      });
      setCollapsedDays(initialCollapseState);
    }
  }, [formData.id]);

  const toggleDayCollapse = (idx) => {
    setCollapsedDays(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // ── AUTO-RESIZE TEXTAREAS ON MOUNT/UPDATE ──────────────────────────
  useEffect(() => {
    const textareas = document.querySelectorAll('.activity-textarea');
    textareas.forEach(ta => {
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    });
  }, [formData.itinerary, collapsedDays]);

  // ── ITINERARIO MANAGEMENT ──────────────────────────────────────────
  const itinerary = formData.itinerary || [];

  const handleItineraryChange = (idx, fieldOrObject, val) => {
    setFormData(prev => {
      const nextIt = [...(prev.itinerary || [])];
      if (typeof fieldOrObject === 'object' && fieldOrObject !== null) {
        nextIt[idx] = { ...nextIt[idx], ...fieldOrObject };
      } else {
        nextIt[idx] = { ...nextIt[idx], [fieldOrObject]: val };
      }
      return { ...prev, itinerary: nextIt };
    });
  };

  const addItineraryDay = () => {
    const nextCollapse = {};
    itinerary.forEach((_, i) => {
      nextCollapse[i] = true;
    });
    nextCollapse[itinerary.length] = false;
    setCollapsedDays(nextCollapse);

    const nextIt = [
      ...itinerary,
      {
        dayNumber: itinerary.length + 1,
        locationId: '',
        customLocationName: '',
        accommodationType: '',
        imageUrl: '',
        activities: [{ type: '', description: '' }]
      }
    ];
    setFormData({ ...formData, itinerary: nextIt });
  };

  const removeItineraryDay = (idx) => {
    const nextIt = itinerary.filter((_, i) => i !== idx).map((day, i) => ({
      ...day,
      dayNumber: i + 1
    }));
    setFormData({ ...formData, itinerary: nextIt });
  };

  // ── ITINERARIO ACTIVITIES DYNAMICS ─────────────────────────────────
  const addDayActivity = (dayIdx) => {
    const nextIt = [...itinerary];
    const dayActs = nextIt[dayIdx].activities || [];
    nextIt[dayIdx].activities = [...dayActs, { type: '', description: '' }];
    setFormData({ ...formData, itinerary: nextIt });
  };

  const removeDayActivity = (dayIdx, actIdx) => {
    const nextIt = [...itinerary];
    const dayActs = nextIt[dayIdx].activities || [];
    nextIt[dayIdx].activities = dayActs.filter((_, i) => i !== actIdx);
    setFormData({ ...formData, itinerary: nextIt });
  };

  const handleDayActivityChange = (dayIdx, actIdx, field, val) => {
    const nextIt = [...itinerary];
    const dayActs = [...(nextIt[dayIdx].activities || [])];
    dayActs[actIdx] = { ...dayActs[actIdx], [field]: val };
    nextIt[dayIdx].activities = dayActs;
    setFormData({ ...formData, itinerary: nextIt });
  };

  // ── PAÍSES Y LOCALIZACIONES DE RESUMEN (Restructurado) ─────────────
  const countriesSummaryList = formData.countriesSummaryList || [{ country: '', cities: [''] }];

  const handleCountrySummaryChange = (cIdx, val) => {
    const nextList = [...countriesSummaryList];
    nextList[cIdx].country = val;
    syncDestinationsSummary(nextList);
  };

  const handleCountryCitySummaryChange = (cIdx, cityIdx, val) => {
    const nextList = [...countriesSummaryList];
    const cities = [...(nextList[cIdx].cities || [''])];
    cities[cityIdx] = val;
    nextList[cIdx].cities = cities;
    syncDestinationsSummary(nextList);
  };

  const addCountryCitySummaryField = (cIdx) => {
    const nextList = [...countriesSummaryList];
    const cities = [...(nextList[cIdx].cities || [''])];
    nextList[cIdx].cities = [...cities, ''];
    syncDestinationsSummary(nextList);
  };

  const removeCountryCitySummaryField = (cIdx, cityIdx) => {
    const nextList = [...countriesSummaryList];
    const cities = (nextList[cIdx].cities || ['']).filter((_, i) => i !== cityIdx);
    nextList[cIdx].cities = cities;
    syncDestinationsSummary(nextList);
  };

  const addCountrySummaryField = () => {
    const nextList = [...countriesSummaryList, { country: '', cities: [''] }];
    syncDestinationsSummary(nextList);
  };

  const removeCountrySummaryField = (cIdx) => {
    const nextList = countriesSummaryList.filter((_, i) => i !== cIdx);
    syncDestinationsSummary(nextList);
  };

  const syncDestinationsSummary = (nextList) => {
    const formattedArray = nextList.map(c => {
      const countryName = c.country?.trim();
      const validCities = (c.cities || []).map(ci => ci.trim()).filter(Boolean);
      if (!countryName) return '';
      if (validCities.length > 0) {
        return `${countryName} (${validCities.join(', ')})`;
      }
      return countryName;
    }).filter(Boolean);

    setFormData({
      ...formData,
      countriesSummaryList: nextList,
      destinationsSummary: formattedArray.join(', ')
    });
  };

  // Sync Destinations Summary back when editing loads
  useEffect(() => {
    if (formData.destinationsSummary && (!formData.countriesSummaryList || formData.countriesSummaryList.length <= 1 && !formData.countriesSummaryList[0]?.country)) {
      const parts = formData.destinationsSummary.split(/,\s*(?![^(]*\))/g).map(x => x.trim()).filter(Boolean);
      const parsed = parts.map(part => {
        const match = part.match(/^([^(]+)(?:\(([^)]+)\))?$/);
        if (match) {
          const country = match[1].trim();
          const citiesStr = match[2] ? match[2] : '';
          const cities = citiesStr.split(',').map(c => c.trim()).filter(Boolean);
          return {
            country,
            cities: cities.length > 0 ? cities : ['']
          };
        }
        return { country: part, cities: [''] };
      });
      if (parsed.length > 0) {
        setFormData(prev => ({ ...prev, countriesSummaryList: parsed }));
      }
    }
  }, [formData.destinationsSummary]);

  // ── SERVICIOS INCLUIDOS MANAGEMENT ─────────────────────────────────
  const servicesIncluded = formData.servicesIncludedList || [];

  const handleServiceIncludedChange = (idx, field, val) => {
    const nextServices = [...servicesIncluded];
    nextServices[idx] = { ...nextServices[idx], [field]: val };
    setFormData({ ...formData, servicesIncludedList: nextServices });
  };

  const addServiceIncluded = () => {
    setFormData({
      ...formData,
      servicesIncludedList: [
        ...servicesIncluded,
        { locationId: '', customLocationName: '', items: [''] }
      ]
    });
  };

  const removeServiceIncluded = (idx) => {
    setFormData({
      ...formData,
      servicesIncludedList: servicesIncluded.filter((_, i) => i !== idx)
    });
  };

  const addServiceIncludedItem = (serviceIdx) => {
    const nextServices = [...servicesIncluded];
    nextServices[serviceIdx].items = [...nextServices[serviceIdx].items, ''];
    setFormData({ ...formData, servicesIncludedList: nextServices });
  };

  const removeServiceIncludedItem = (serviceIdx, itemIdx) => {
    const nextServices = [...servicesIncluded];
    nextServices[serviceIdx].items = nextServices[serviceIdx].items.filter((_, i) => i !== itemIdx);
    setFormData({ ...formData, servicesIncludedList: nextServices });
  };

  const handleServiceIncludedItemChange = (serviceIdx, itemIdx, val) => {
    const nextServices = [...servicesIncluded];
    nextServices[serviceIdx].items[itemIdx] = val;
    setFormData({ ...formData, servicesIncludedList: nextServices });
  };

  // ── SERVICIOS EXCLUIDOS (NO INCLUIDOS) MANAGEMENT ──────────────────
  const servicesExcludedList = formData.servicesExcludedList || [''];

  const handleServiceExcludedChange = (idx, val) => {
    const nextExcluded = [...servicesExcludedList];
    nextExcluded[idx] = val;
    setFormData({ ...formData, servicesExcludedList: nextExcluded });
  };

  const addServiceExcluded = () => {
    setFormData({
      ...formData,
      servicesExcludedList: [...servicesExcludedList, '']
    });
  };

  const removeServiceExcluded = (idx) => {
    setFormData({
      ...formData,
      servicesExcludedList: servicesExcludedList.filter((_, i) => i !== idx)
    });
  };

  // ── HOTELES PREVISTOS MANAGEMENT (CIUDADES Y HOTELES NESTED) ────────
  const hotelsPlanned = formData.hotelsPlanned || [];

  const handleHotelRowChange = (hotelIdx, field, val) => {
    const nextHotels = [...hotelsPlanned];
    nextHotels[hotelIdx] = { ...nextHotels[hotelIdx], [field]: val };
    setFormData({ ...formData, hotelsPlanned: nextHotels });
  };

  const handleNestedCityChange = (hotelIdx, cityIdx, field, val) => {
    const nextHotels = [...hotelsPlanned];
    const citiesList = [...(nextHotels[hotelIdx].citiesList || [])];
    citiesList[cityIdx] = { ...citiesList[cityIdx], [field]: val };
    nextHotels[hotelIdx].citiesList = citiesList;
    
    nextHotels[hotelIdx].city = citiesList.map(c => c.cityName).filter(Boolean).join(', ');
    const allHotelsArray = [];
    citiesList.forEach(c => {
      if (c.hotelNames && c.hotelNames.length > 0) {
        allHotelsArray.push(...c.hotelNames);
      }
    });
    nextHotels[hotelIdx].hotelName = allHotelsArray.filter(Boolean).join(', ');

    setFormData({ ...formData, hotelsPlanned: nextHotels });
  };

  const addNestedCityField = (hotelIdx) => {
    const nextHotels = [...hotelsPlanned];
    const citiesList = [...(nextHotels[hotelIdx].citiesList || [])];
    nextHotels[hotelIdx].citiesList = [...citiesList, { cityName: '', hotelNames: [''] }];
    setFormData({ ...formData, hotelsPlanned: nextHotels });
  };

  const removeNestedCityField = (hotelIdx, cityIdx) => {
    const nextHotels = [...hotelsPlanned];
    const citiesList = (nextHotels[hotelIdx].citiesList || []).filter((_, i) => i !== cityIdx);
    nextHotels[hotelIdx].citiesList = citiesList;
    
    nextHotels[hotelIdx].city = citiesList.map(c => c.cityName).filter(Boolean).join(', ');
    const allHotelsArray = [];
    citiesList.forEach(c => {
      if (c.hotelNames && c.hotelNames.length > 0) {
        allHotelsArray.push(...c.hotelNames);
      }
    });
    nextHotels[hotelIdx].hotelName = allHotelsArray.filter(Boolean).join(', ');

    setFormData({ ...formData, hotelsPlanned: nextHotels });
  };

  const handleNestedHotelListChange = (hotelIdx, cityIdx, nameIdx, val) => {
    const nextHotels = [...hotelsPlanned];
    const citiesList = [...(nextHotels[hotelIdx].citiesList || [])];
    const hotelNames = [...(citiesList[cityIdx].hotelNames || [''])];
    hotelNames[nameIdx] = val;
    citiesList[cityIdx].hotelNames = hotelNames;
    nextHotels[hotelIdx].citiesList = citiesList;

    const allHotelsArray = [];
    citiesList.forEach(c => {
      if (c.hotelNames && c.hotelNames.length > 0) {
        allHotelsArray.push(...c.hotelNames);
      }
    });
    nextHotels[hotelIdx].hotelName = allHotelsArray.filter(Boolean).join(', ');

    setFormData({ ...formData, hotelsPlanned: nextHotels });
  };

  const addNestedHotelNameField = (hotelIdx, cityIdx) => {
    const nextHotels = [...hotelsPlanned];
    const citiesList = [...(nextHotels[hotelIdx].citiesList || [])];
    const hotelNames = [...(citiesList[cityIdx].hotelNames || [''])];
    citiesList[cityIdx].hotelNames = [...hotelNames, ''];
    nextHotels[hotelIdx].citiesList = citiesList;
    setFormData({ ...formData, hotelsPlanned: nextHotels });
  };

  const removeNestedHotelNameField = (hotelIdx, cityIdx, nameIdx) => {
    const nextHotels = [...hotelsPlanned];
    const citiesList = [...(nextHotels[hotelIdx].citiesList || [])];
    const hotelNames = (citiesList[cityIdx].hotelNames || ['']).filter((_, i) => i !== nameIdx);
    citiesList[cityIdx].hotelNames = hotelNames;
    nextHotels[hotelIdx].citiesList = citiesList;

    const allHotelsArray = [];
    citiesList.forEach(c => {
      if (c.hotelNames && c.hotelNames.length > 0) {
        allHotelsArray.push(...c.hotelNames);
      }
    });
    nextHotels[hotelIdx].hotelName = allHotelsArray.filter(Boolean).join(', ');

    setFormData({ ...formData, hotelsPlanned: nextHotels });
  };

  const addHotelPlanned = () => {
    setFormData({
      ...formData,
      hotelsPlanned: [
        ...hotelsPlanned,
        {
          country: '',
          category: '',
          city: '',
          hotelName: '',
          citiesList: [{ cityName: '', hotelNames: [''] }]
        }
      ]
    });
  };

  const removeHotelPlanned = (idx) => {
    setFormData({
      ...formData,
      hotelsPlanned: hotelsPlanned.filter((_, i) => i !== idx)
    });
  };

  // Convert legacy/flat hotelsPlanned structure to nested citiesList on mount
  useEffect(() => {
    if (hotelsPlanned.length > 0 && hotelsPlanned.some(h => !h.citiesList)) {
      const nextHotels = hotelsPlanned.map(h => {
        if (!h.citiesList) {
          const citiesArray = h.city ? h.city.split(',').map(c => c.trim()).filter(Boolean) : [''];
          const hotelsArray = h.hotelName ? h.hotelName.split(',').map(ho => ho.trim()).filter(Boolean) : [''];
          
          const citiesList = citiesArray.map((cityName, index) => ({
            cityName,
            hotelNames: index === 0 ? (hotelsArray.length > 0 ? hotelsArray : ['']) : ['']
          }));

          return {
            ...h,
            citiesList
          };
        }
        return h;
      });
      setFormData(prev => ({ ...prev, hotelsPlanned: nextHotels }));
    }
  }, [formData.id]);

  return (
    <div className="space-y-8 max-w-full overflow-hidden">
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleUploadFile(e, uploadingDayIndex)}
        className="hidden"
        accept="image/*"
      />
      {/* Travel Identity Section */}
      <section className="glass-panel p-8 max-w-full overflow-hidden">
        <h2 className="font-headline-sm mb-6 flex items-center gap-2" style={{ color: 'var(--on-surface)' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>flight_takeoff</span>
          Detalles del Plan de Viaje
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-2">
            <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Título del Viaje *</label>
            <input
              type="text"
              required
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: Plan de Viaje: Egipto Clásico & Turquía Atractiva"
              className="form-input"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Agencia / Operador *</label>
            <input
              type="text"
              required
              value={formData.agency || ''}
              onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
              placeholder="Ej: Sueño Travel Chile"
              className="form-input"
            />
          </div>
          <div className="md:col-span-2 flex flex-col gap-2">
            <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Texto de Introducción / Copete (Flavor Text)</label>
            <input
              type="text"
              value={formData.subtitle || ''}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="Ej: Un recorrido exclusivo de lujo por el Nilo y las costas doradas del Bósforo."
              className="form-input"
            />
          </div>
          <div className="md:col-span-2 flex flex-col gap-2">
            <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Descripción General del Viaje (Overview)</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              placeholder="Escribe una introducción detallada que se mostrará como el resumen o 'overview' del viaje en la web..."
              className="form-input"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Duración (Días) *</label>
            <input
              type="number"
              required
              value={formData.durationDays || ''}
              onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) || 0 })}
              placeholder="Ej: 16"
              className="form-input"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Duración (Noches) *</label>
            <input
              type="number"
              required
              value={formData.durationNights || ''}
              onChange={(e) => setFormData({ ...formData, durationNights: parseInt(e.target.value) || 0 })}
              placeholder="Ej: 15"
              className="form-input"
            />
          </div>
          
          {/* Countries & Locations dynamic groups */}
          <div className="md:col-span-2 space-y-4">
            <div className="border-b border-[var(--outline-variant)] pb-2">
              <label className="font-label-md" style={{ color: 'var(--on-surface)' }}>Destinos y Países del Viaje *</label>
            </div>
            
            <div className="space-y-6">
              {countriesSummaryList.map((countryRow, cIdx) => (
                <div key={cIdx} className="bg-[var(--surface-container-low)] p-6 rounded-xl border border-[var(--outline)] relative space-y-4">
                  {/* Delete Country Button - Circled icon top-right */}
                  {countriesSummaryList.length > 1 && (
                    <div className="absolute top-4 right-4 animate-fade-in">
                      <HoldToConfirmButton
                        onConfirm={() => removeCountrySummaryField(cIdx)}
                        className="btn-icon text-[var(--error)]"
                        title="Mantén presionado 2s para eliminar la región"
                        duration={2000}
                        style={{ width: '32px', height: '32px' }}
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </HoldToConfirmButton>
                    </div>
                  )}

                  {/* 3-Column Layout: Left (Region), Right (Cities/Attractions) */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pt-2">
                    {/* Column 1: Country (Span 4) */}
                    <div className="md:col-span-4 flex flex-col gap-2">
                      <label className="font-label-md text-xs" style={{ color: 'var(--on-surface-variant)' }}>Región *</label>
                      <input
                        type="text"
                        required
                        value={countryRow.country || ''}
                        onChange={(e) => handleCountrySummaryChange(cIdx, e.target.value)}
                        placeholder="Ej: Egipto"
                        className="form-input text-sm w-full"
                      />
                    </div>

                    {/* Column 2 & 3: Cities List (Span 8) */}
                    <div className="md:col-span-8 space-y-3 pl-0 md:pl-4 md:border-l border-[var(--outline-variant)]">
                      <label className="font-label-md text-xs" style={{ color: 'var(--on-surface-variant)' }}>Ciudades / Atractivos visitados</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(countryRow.cities || ['']).map((city, cityIdx) => (
                          <div key={cityIdx} className="flex gap-2 items-center">
                            <span className="text-[var(--primary)] font-bold shrink-0">•</span>
                            {/* Input container with relative button nested inside */}
                            <div className="relative flex-1">
                              <input
                                type="text"
                                required
                                value={city || ''}
                                onChange={(e) => handleCountryCitySummaryChange(cIdx, cityIdx, e.target.value)}
                                placeholder="Ej: El Cairo o Karnak"
                                className="form-input text-xs w-full pr-8"
                                style={{ paddingRight: '32px' }}
                              />
                              {(countryRow.cities || []).length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeCountryCitySummaryField(cIdx, cityIdx)}
                                  className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center text-[var(--error)] hover:bg-[color-mix(in_srgb,var(--error)_10%,transparent)] border-none bg-transparent cursor-pointer rounded-full"
                                  title="Eliminar este destino"
                                  style={{ width: '24px', height: '24px' }}
                                >
                                  <span className="material-symbols-outlined text-[14px]">close</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add City Button - Placed at the bottom of list */}
                      <div className="flex justify-start pt-1">
                        <button
                           type="button"
                           onClick={() => addCountryCitySummaryField(cIdx)}
                           className="text-xs text-[var(--primary)] hover:underline flex items-center gap-0.5 border-none bg-transparent cursor-pointer font-bold"
                        >
                          <span className="material-symbols-outlined text-[14px]">add</span> Añadir Ciudad / Atractivo
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Country Button - Placed at the bottom of the list */}
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={addCountrySummaryField}
                className="btn-secondary text-xs flex items-center gap-1"
                style={{ padding: '8px 20px' }}
              >
                <span className="material-symbols-outlined text-sm">add</span> Añadir Región de Resumen
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing and Notes Section */}
      <section className="glass-panel p-8 max-w-full overflow-hidden">
        <h2 className="font-headline-sm mb-6 flex items-center gap-2" style={{ color: 'var(--on-surface)' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>payments</span>
          Precios y Notas Adicionales
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-2">
            <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Costo de Visa (USD)</label>
            <input
              type="number"
              value={formData.visaCostUSD || ''}
              onChange={(e) => setFormData({ ...formData, visaCostUSD: parseFloat(e.target.value) || 0 })}
              placeholder="Ej: 30"
              className="form-input"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Tasa Hotelera (USD)</label>
            <input
              type="number"
              value={formData.hotelTaxUSD || ''}
              onChange={(e) => setFormData({ ...formData, hotelTaxUSD: parseFloat(e.target.value) || 0 })}
              placeholder="Ej: 55"
              className="form-input"
            />
          </div>
          <div className="md:col-span-2 flex flex-col gap-2">
            <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Nota de Descargo (Disclaimer)</label>
            <textarea
              value={formData.disclaimer || ''}
              onChange={(e) => setFormData({ ...formData, disclaimer: e.target.value })}
              placeholder="Ej: El itinerario puede sufrir modificaciones manteniendo siempre los servicios incluidos."
              rows="2"
              className="form-textarea"
            />
          </div>
        </div>
      </section>

      {/* Itinerary Days Section */}
      <section className="glass-panel p-8 space-y-6 max-w-full overflow-hidden">
        <div className="flex justify-between items-center border-b border-[var(--outline-variant)] pb-4">
          <h2 className="font-headline-sm flex items-center gap-2" style={{ color: 'var(--on-surface)' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>calendar_today</span>
            Itinerario Diario
          </h2>
        </div>

        <div className="space-y-6 divide-y divide-[var(--outline-variant)]">
          {itinerary.map((day, idx) => {
            const isCollapsed = collapsedDays[idx] !== false; 
            return (
              <div key={idx} className="pt-6 first:pt-0 space-y-4 max-w-full overflow-hidden">
                {/* Cabecera del día colapsable sin borde */}
                <div className="flex justify-between items-center bg-[var(--surface-container-low)] p-3 rounded-lg border-none cursor-pointer" onClick={() => toggleDayCollapse(idx)}>
                  <div className="flex items-center gap-2 select-none flex-grow">
                    <span className="material-symbols-outlined text-[var(--primary)] text-md transition-transform" style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0)' }}>
                      expand_more
                    </span>
                    <span className="chip chip-primary text-xs font-bold font-mono">Día {day.dayNumber}</span>
                    <span className="text-sm font-semibold truncate max-w-md">
                      {day.customLocationName || (locations.find(l => l.id === day.locationId)?.name || 'Sin ubicación seleccionada')}
                    </span>
                  </div>
                </div>

                {/* Contenedor animado */}
                <div
                  className="grid transition-all duration-300 ease-in-out overflow-hidden max-w-full"
                  style={{
                    gridTemplateRows: isCollapsed ? '0fr' : '1fr',
                    opacity: isCollapsed ? 0 : 1,
                    visibility: isCollapsed ? 'hidden' : 'visible'
                  }}
                >
                  <div className="min-h-0 max-w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 pl-1">
                      {/* Left Column: Location & Accommodation (Under Location) */}
                      <div className="space-y-4">
                        {/* Location selector */}
                        <div className="flex flex-col gap-2">
                          <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Ubicación / Destino</label>
                          <input
                            type="text"
                            list={`location-options-${idx}`}
                            value={day.customLocationName || (locations.find(l => l.id === day.locationId) ? formatOptionLabel(locations.find(l => l.id === day.locationId)) : '')}
                            onChange={(e) => {
                              const val = e.target.value;
                              const matchedLoc = locations.find(l => formatOptionLabel(l) === val || l.name === val);
                              if (matchedLoc) {
                                handleItineraryChange(idx, { locationId: matchedLoc.id, customLocationName: '' });
                              } else {
                                handleItineraryChange(idx, { locationId: 'custom', customLocationName: val });
                              }
                            }}
                            placeholder="Escribe o haz doble clic para ver ubicaciones..."
                            className="form-input w-full"
                          />
                          <datalist id={`location-options-${idx}`}>
                            {locations.map(loc => (
                              <option key={loc.id} value={formatOptionLabel(loc)} />
                            ))}
                          </datalist>
                        </div>

                        {/* Accommodation Type (Positioned below Location) */}
                        <div className="flex flex-col gap-2">
                          <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Tipo de Alojamiento y Régimen</label>
                          <input
                            type="text"
                            list={`accommodation-options-${idx}`}
                            value={day.accommodationType || ''}
                            onChange={(e) => handleItineraryChange(idx, 'accommodationType', e.target.value)}
                            placeholder="Selecciona o escribe el tipo de alojamiento/régimen..."
                            className="form-input w-full"
                          />
                          <datalist id={`accommodation-options-${idx}`}>
                            <option value="Desayuno" />
                            <option value="Alojamiento" />
                            <option value="Alojamiento y cena" />
                            <option value="Alojamiento y pensión completa" />
                            <option value="Alojamiento y pensión completa a bordo" />
                          </datalist>
                        </div>
                      </div>

                      {/* Right Column: Image URL / Photo (Positioned beside Location) */}
                      <div className="flex flex-col gap-2 justify-start">
                        <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>URL de Foto del Día (Vacío para usar foto de Destino)</label>
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={day.imageUrl || ''}
                            onChange={(e) => handleItineraryChange(idx, 'imageUrl', e.target.value)}
                            placeholder="Ej: https://images.unsplash.com/photo-pyramids..."
                            className="form-input flex-1"
                            style={{ height: '48px' }}
                          />
                          <button
                            type="button"
                            onClick={() => triggerUpload(idx)}
                            disabled={isUploading}
                            className="btn-secondary flex items-center gap-1.5 shrink-0"
                            style={{ height: '48px', padding: '0 16px' }}
                          >
                            <span className={`material-symbols-outlined text-sm ${isUploading && uploadingDayIndex === idx ? 'animate-spin' : ''}`}>
                              {isUploading && uploadingDayIndex === idx ? 'sync' : 'upload'}
                            </span>
                            {isUploading && uploadingDayIndex === idx ? 'Subiendo...' : 'Subir Foto'}
                          </button>
                        </div>
                        {day.imageUrl && (
                          <img
                            src={day.imageUrl}
                            alt="Previsualización del día"
                            className="mt-2 w-full h-24 object-cover rounded-lg border border-[var(--outline)]"
                          />
                        )}
                      </div>

                      {/* Actividades del Día */}
                      <div className="md:col-span-2 space-y-4 max-w-full">
                        <div className="flex justify-between items-center pb-1.5 mt-2">
                          <label className="font-label-lg" style={{ color: 'var(--on-surface)' }}>Actividades del Día</label>
                        </div>

                        <div className="space-y-3">
                          {(day.activities || []).map((activity, actIdx) => (
                            <div key={actIdx} className="flex flex-col sm:flex-row gap-3 items-start bg-[var(--surface-container-highest)] p-3 rounded-lg border border-[var(--outline-variant)] relative animate-fade-in max-w-full">
                              {/* Momento */}
                              <div className="w-full sm:w-1/4">
                                <input
                                  type="text"
                                  list={`activity-moment-options-${idx}-${actIdx}`}
                                  value={
                                    activity.type === 'morning' ? 'Por la mañana' :
                                    activity.type === 'lunch' ? 'Almuerzo' :
                                    activity.type === 'afternoon' ? 'Por la tarde' :
                                    activity.type === 'night' ? 'Por la noche' :
                                    activity.type === 'arrival' ? 'Llegada' :
                                    activity.type === 'departure' ? 'Salida' :
                                    activity.type === 'breakfast' ? 'Desayuno' :
                                    activity.type === 'optional' ? 'Opcional' :
                                    activity.type === 'transfer' ? 'Traslado' :
                                    (activity.type || '')
                                  }
                                  onChange={(e) => {
                                    const rawVal = e.target.value;
                                    let mappedVal = rawVal;
                                    if (rawVal === 'Por la mañana') mappedVal = 'morning';
                                    else if (rawVal === 'Almuerzo') mappedVal = 'lunch';
                                    else if (rawVal === 'Por la tarde') mappedVal = 'afternoon';
                                    else if (rawVal === 'Por la noche') mappedVal = 'night';
                                    else if (rawVal === 'Llegada') mappedVal = 'arrival';
                                    else if (rawVal === 'Salida') mappedVal = 'departure';
                                    else if (rawVal === 'Desayuno') mappedVal = 'breakfast';
                                    else if (rawVal === 'Opcional') mappedVal = 'optional';
                                    else if (rawVal === 'Traslado') mappedVal = 'transfer';
                                    handleDayActivityChange(idx, actIdx, 'type', mappedVal);
                                  }}
                                  placeholder="Ej: Por la mañana..."
                                  className="form-input text-xs w-full"
                                />
                                <datalist id={`activity-moment-options-${idx}-${actIdx}`}>
                                  <option value="Desayuno" />
                                  <option value="Por la mañana" />
                                  <option value="Almuerzo" />
                                  <option value="Por la tarde" />
                                  <option value="Por la noche" />
                                  <option value="Llegada" />
                                  <option value="Salida" />
                                  <option value="Opcional" />
                                  <option value="Traslado" />
                                </datalist>
                              </div>

                              {/* Detalle */}
                              <div className="flex-1 w-full">
                                <textarea
                                  value={activity.description || ''}
                                  onChange={(e) => {
                                    handleDayActivityChange(idx, actIdx, 'description', e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                  }}
                                  onFocus={(e) => {
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                  }}
                                  placeholder="Escribe el itinerario detallado de este momento o actividad..."
                                  className="form-textarea w-full activity-textarea"
                                  style={{
                                    fontSize: '0.85rem',
                                    lineHeight: '1.6',
                                    padding: '10px 12px',
                                    minHeight: '60px',
                                    resize: 'none',
                                    overflow: 'hidden'
                                  }}
                                  rows="2"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => removeDayActivity(idx, actIdx)}
                                className="btn-icon text-[var(--error)] shrink-0 self-center"
                                title="Remover actividad"
                              >
                                <span className="material-symbols-outlined text-sm">close</span>
                              </button>
                            </div>
                          ))}

                          {(day.activities || []).length === 0 && (
                            <p className="text-xs text-[var(--on-surface-variant)] italic">No hay actividades configuradas para este día.</p>
                          )}

                          <div className="flex justify-between items-center pt-4 border-t border-[var(--outline-variant)]">
                            <button
                              type="button"
                              onClick={() => addDayActivity(idx)}
                              className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1 border-none bg-transparent cursor-pointer font-bold"
                            >
                              <span className="material-symbols-outlined text-xs">add</span> Añadir Actividad
                            </button>

                            <HoldToConfirmButton
                              onConfirm={() => removeItineraryDay(idx)}
                              className="btn-text text-[var(--error)] flex items-center gap-1.5 text-xs font-bold"
                              title="Mantén presionado 2s para eliminar este día completo"
                              duration={2000}
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                              Eliminar Día {day.dayNumber}
                            </HoldToConfirmButton>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Añadir Día */}
        <div className="flex justify-center pt-6 border-t border-[var(--outline-variant)]">
          <button
            type="button"
            onClick={addItineraryDay}
            className="btn-secondary text-sm flex items-center gap-1"
            style={{ padding: '8px 24px' }}
          >
            <span className="material-symbols-outlined text-sm">add</span> Añadir Día de Itinerario
          </button>
        </div>
      </section>

      {/* Services Included Section */}
      <section className="glass-panel p-8 space-y-6 max-w-full overflow-hidden">
        <div className="flex justify-between items-center border-b border-[var(--outline-variant)] pb-4">
          <h2 className="font-headline-sm flex items-center gap-2" style={{ color: 'var(--on-surface)' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>done_all</span>
            Servicios Incluidos
          </h2>
        </div>

        <div className="space-y-6 divide-y divide-[var(--outline-variant)]">
          {servicesIncluded.map((group, serviceIdx) => (
            <div key={serviceIdx} className="pt-6 first:pt-0 space-y-4">
              <div className="flex items-center gap-3 justify-between">
                <div className="flex gap-2 flex-1 items-center">
                  <label className="font-label-md text-sm whitespace-nowrap" style={{ color: 'var(--on-surface-variant)' }}>Ubicación / Destino:</label>
                  <input
                    type="text"
                    list={`service-location-options-${serviceIdx}`}
                    value={group.customLocationName || (locations.find(l => l.id === group.locationId)?.name || '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      const matchedLoc = locations.find(l => `${l.name} (${l.city}, {loc.country})` === val || l.name === val);
                      if (matchedLoc) {
                        handleServiceIncludedChange(serviceIdx, 'locationId', matchedLoc.id);
                        handleServiceIncludedChange(serviceIdx, 'customLocationName', '');
                      } else {
                        handleServiceIncludedChange(serviceIdx, 'locationId', 'custom');
                        handleServiceIncludedChange(serviceIdx, 'customLocationName', val);
                      }
                    }}
                    placeholder="Selecciona o escribe la ubicación..."
                    className="form-input max-w-xs"
                  />
                  <datalist id={`service-location-options-${serviceIdx}`}>
                    {locations.map(loc => (
                      <option key={loc.id} value={`${loc.name} (${loc.city}, {loc.country})`} />
                    ))}
                  </datalist>
                </div>
                
                <HoldToConfirmButton
                  onConfirm={() => removeServiceIncluded(serviceIdx)}
                  className="btn-icon text-[var(--error)]"
                  title="Mantén presionado 2s para eliminar"
                  duration={2000}
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </HoldToConfirmButton>
              </div>

              <div className="space-y-3 pl-4 border-l-2 border-[var(--primary)]">
                {(group.items || []).map((bullet, bulletIdx) => (
                  <div key={bulletIdx} className="flex gap-2 items-center">
                    <span className="text-[var(--primary)] font-bold">•</span>
                    <input
                      type="text"
                      value={bullet}
                      onChange={(e) => handleServiceIncludedItemChange(serviceIdx, bulletIdx, e.target.value)}
                      placeholder="Ej: Traslado aeropuerto - hotel incluido en servicio privado"
                      className="form-input flex-1"
                    />
                    {group.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeServiceIncludedItem(serviceIdx, bulletIdx)}
                        className="btn-icon text-[var(--error)]"
                        title="Eliminar este punto"
                      >
                        <span className="material-symbols-outlined text-xs">close</span>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addServiceIncludedItem(serviceIdx)}
                  className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1 border-none bg-transparent cursor-pointer font-bold mt-2"
                >
                  <span className="material-symbols-outlined text-xs">add</span> Añadir Punto de Servicio
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Añadir Grupo por Destino ubicado al final */}
        <div className="flex justify-center pt-4 border-t border-[var(--outline-variant)]">
          <button
            type="button"
            onClick={addServiceIncluded}
            className="btn-secondary text-sm flex items-center gap-1"
            style={{ padding: '8px 24px' }}
          >
            <span className="material-symbols-outlined text-sm">add</span> Añadir Grupo de Servicios por Destino
          </button>
        </div>
      </section>

      {/* Services Excluded Section */}
      <section className="glass-panel p-8 space-y-6 max-w-full overflow-hidden">
        <div className="flex justify-between items-center border-b border-[var(--outline-variant)] pb-4">
          <h2 className="font-headline-sm flex items-center gap-2" style={{ color: 'var(--on-surface)' }}>
            <span className="material-symbols-outlined text-[var(--error)]">cancel</span>
            Servicios No Incluidos
          </h2>
        </div>

        <div className="space-y-3">
          {servicesExcludedList.map((bullet, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <span className="text-[var(--error)] font-bold">•</span>
              <input
                type="text"
                value={bullet}
                onChange={(e) => handleServiceExcludedChange(idx, e.target.value)}
                placeholder="Ej: Tasas hoteleras o propinas a guías locales"
                className="form-input flex-1"
              />
              {servicesExcludedList.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeServiceExcluded(idx)}
                  className="btn-icon text-[var(--error)]"
                  title="Eliminar este punto"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Añadir punto No Incluido ubicado al final */}
        <div className="flex justify-center pt-4 border-t border-[var(--outline-variant)]">
          <button
            type="button"
            onClick={addServiceExcluded}
            className="btn-secondary text-sm flex items-center gap-1"
            style={{ padding: '8px 24px' }}
          >
            <span className="material-symbols-outlined text-sm">add</span> Añadir Servicio Excluido
          </button>
        </div>
      </section>

      {/* Hotels Planned (Previstos) Section */}
      <section className="glass-panel p-8 space-y-6 max-w-full overflow-hidden">
        <div className="flex justify-between items-center border-b border-[var(--outline-variant)] pb-4">
          <h2 className="font-headline-sm flex items-center gap-2" style={{ color: 'var(--on-surface)' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>apartment</span>
            Hoteles Previstos o Similares
          </h2>
        </div>

        <div className="space-y-8 divide-y divide-[var(--outline-variant)]">
          {hotelsPlanned.map((hotelRow, idx) => (
            <div key={idx} className="pt-6 first:pt-0 space-y-4 relative">
              {/* Delete Country Button - Circled icon top-right */}
              <div className="absolute top-4 right-4 animate-fade-in">
                <HoldToConfirmButton
                  onConfirm={() => removeHotelPlanned(idx)}
                  className="btn-icon text-[var(--error)]"
                  title="Mantén presionado 2s para eliminar el país de hoteles"
                  duration={2000}
                  style={{ width: '32px', height: '32px' }}
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </HoldToConfirmButton>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="flex flex-col gap-2">
                  <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>País</label>
                  <input
                    type="text"
                    value={hotelRow.country || ''}
                    onChange={(e) => handleHotelRowChange(idx, 'country', e.target.value)}
                    placeholder="Ej: Egipto"
                    className="form-input w-full"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Categoría de Alojamiento</label>
                  <input
                    type="text"
                    value={hotelRow.category || ''}
                    onChange={(e) => handleHotelRowChange(idx, 'category', e.target.value)}
                    placeholder="Ej: 5★ Lujo / Boutique"
                    className="form-input w-full"
                  />
                </div>
              </div>

              {/* Múltiples Ciudades dentro de este País */}
              <div className="bg-[var(--surface-container-low)] p-6 rounded-xl border border-[var(--outline)] space-y-6">
                <div className="space-y-6">
                  {(hotelRow.citiesList || []).map((cityGroup, cityIdx) => (
                    <div key={cityIdx} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pb-4 border-b border-[var(--outline-variant)] last:border-none last:pb-0 relative pt-2">
                      
                      {/* Column 1: City (Span 4) */}
                      <div className="md:col-span-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="font-label-md text-xs" style={{ color: 'var(--on-surface-variant)' }}>Ciudad</label>
                          {(hotelRow.citiesList || []).length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeNestedCityField(idx, cityIdx)}
                              className="btn-icon text-[var(--error)]"
                              title="Eliminar esta ciudad"
                              style={{ width: '24px', height: '24px' }}
                            >
                              <span className="material-symbols-outlined text-[12px]">close</span>
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          required
                          value={cityGroup.cityName || ''}
                          onChange={(e) => handleNestedCityChange(idx, cityIdx, 'cityName', e.target.value)}
                          placeholder="Ej: El Cairo"
                          className="form-input text-sm w-full"
                        />
                      </div>

                      {/* Column 2 & 3: Hotels under this City (Span 8) */}
                      <div className="md:col-span-8 space-y-3 pl-0 md:pl-4 md:border-l border-[var(--outline-variant)]">
                        <label className="font-label-md text-xs" style={{ color: 'var(--on-surface-variant)' }}>Hoteles Previstos</label>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(cityGroup.hotelNames || ['']).map((hName, nameIdx) => (
                            <div key={nameIdx} className="flex gap-2 items-center">
                              <span className="text-[var(--secondary)] font-bold shrink-0">•</span>
                              {/* Relative wrapper to place delete close button inside the input */}
                              <div className="relative flex-1">
                                <input
                                  type="text"
                                  value={hName || ''}
                                  onChange={(e) => handleNestedHotelListChange(idx, cityIdx, nameIdx, e.target.value)}
                                  placeholder="Ej: Grand Nile Tower"
                                  className="form-input text-xs w-full pr-8"
                                  style={{ paddingRight: '32px' }}
                                />
                                {(cityGroup.hotelNames || []).length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeNestedHotelNameField(idx, cityIdx, nameIdx)}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center text-[var(--error)] hover:bg-[color-mix(in_srgb,var(--error)_10%,transparent)] border-none bg-transparent cursor-pointer rounded-full"
                                    title="Eliminar este hotel"
                                    style={{ width: '22px', height: '22px' }}
                                  >
                                    <span className="material-symbols-outlined text-[14px]">close</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add Hotel Button - Placed at the bottom of the hotels list */}
                        <div className="flex justify-start pt-1">
                          <button
                            type="button"
                            onClick={() => addNestedHotelNameField(idx, cityIdx)}
                            className="text-[11px] text-[var(--primary)] hover:underline flex items-center gap-0.5 border-none bg-transparent cursor-pointer font-bold"
                          >
                            <span className="material-symbols-outlined text-xs">add</span> Añadir Hotel Alternativo
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add City Button - Placed at the bottom of the cities list */}
                <div className="flex justify-start pt-2 border-t border-[var(--outline-variant)]">
                  <button
                    type="button"
                    onClick={() => addNestedCityField(idx)}
                    className="text-xs text-[var(--primary)] hover:underline flex items-center gap-0.5 border-none bg-transparent cursor-pointer font-bold"
                  >
                    <span className="material-symbols-outlined text-sm">add</span> Añadir Ciudad en {hotelRow.country || 'este país'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Añadir País de Hoteles al final */}
        <div className="flex justify-center pt-6 border-t border-[var(--outline-variant)]">
          <button
            type="button"
            onClick={addHotelPlanned}
            className="btn-secondary text-sm flex items-center gap-1"
            style={{ padding: '8px 24px' }}
          >
            <span className="material-symbols-outlined text-sm">add</span> Añadir País de Hoteles
          </button>
        </div>
      </section>
    </div>
  );
}
