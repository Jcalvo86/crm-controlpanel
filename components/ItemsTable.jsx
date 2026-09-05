import React from 'react';
import HoldToConfirmButton from './HoldToConfirmButton.jsx';
import { parseCategory } from '../utils/parseCategory.js';

export default function ItemsTable({
  items,
  activeModule,
  searchTerm,
  setSearchTerm,
  filterCategory,
  setFilterCategory,
  sortAlphabetical,
  setSortAlphabetical,
  workAreas,
  contentTypes,
  loadingData,
  startEdit,
  handleDelete,
  handleToggleStatus,
  handleImportFile,
  setIsEditing,
  setSelectedId,
  setFormData,
  setActivePanels,
  setCreatingTypeSelected,
  setShowForm,
  travels = [],
  departures = []
}) {
  const [filterLocation, setFilterLocation] = React.useState('all');

  // Reset local filters when module changes
  React.useEffect(() => {
    setFilterLocation('all');
  }, [activeModule]);

  // Derive unique location options from current items
  const locationOptions = React.useMemo(() => {
    if (activeModule === 'travel') {
      const countries = items.flatMap(i => (i.countriesSummaryList || []).map(c => c.country).filter(Boolean));
      return [...new Set(countries)].sort().map(c => ({ id: c, label: c }));
    }
    if (activeModule === 'location') {
      return items
        .filter(i => i.type === 'region')
        .map(r => ({ id: r.id, label: r.name }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }
    if (activeModule === 'departure') {
      const travelIds = items.map(i => i.travelId).filter(Boolean);
      const associatedTravels = travels.filter(t => travelIds.includes(t.id));
      const countries = associatedTravels.flatMap(i => (i.countriesSummaryList || []).map(c => c.country).filter(Boolean));
      return [...new Set(countries)].sort().map(c => ({ id: c, label: c }));
    }
    return [];
  }, [items, activeModule, travels]);

  // Derive dynamic category options
  const categoryOptions = React.useMemo(() => {
    if (activeModule === 'location') {
      const types = items.map(i => i.type).filter(Boolean);
      return [...new Set(types)].sort().map(t => ({ id: t, label: t === 'region' ? 'Región' : t === 'city' ? 'Ciudad' : t === 'point_of_interest' ? 'Atracción' : t }));
    }
    if (activeModule === 'terms') {
      return workAreas || [];
    }
    if (activeModule !== 'design_tokens' && activeModule !== 'travel' && activeModule !== 'departure') {
      const cats = items.map(i => i.category).filter(Boolean);
      return [...new Set(cats)].sort().map(c => ({ id: c, label: c }));
    }
    return [];
  }, [items, activeModule, workAreas]);

  return (
    <div className="space-y-6">
      {/* Search & Actions Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--on-surface-variant)]">search</span>
          <input
            type="text"
            placeholder={activeModule === 'design_tokens' ? 'Buscar marca...' : 'Buscar registro...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input w-full pl-10 text-sm h-9 rounded-md"
          />
        </div>

        {/* Categories Dropdown & Add Button */}
        <div className="flex items-center gap-3">
          {activeModule === 'travel' && (
            <div className="relative">
              <button
                type="button"
                onClick={() => document.getElementById('travel-import-input').click()}
                className="btn-secondary flex items-center gap-2 text-sm h-9 rounded-md px-4"
              >
                <span className="material-symbols-outlined text-sm">upload_file</span>
                Importar JSON
              </button>
              <input
                type="file"
                id="travel-import-input"
                accept=".json"
                className="hidden"
                onChange={handleImportFile}
              />
            </div>
          )}

          <button
            onClick={() => {
              setIsEditing(false);
              setSelectedId(null);
              if (activeModule === 'travel') {
                setFormData({
                  title: '',
                  agency: 'Sueño Travel Chile',
                  durationDays: 1,
                  durationNights: 0,
                  destinationsSummary: '',
                  destinationsSummaryList: [''],
                  countriesSummaryList: [{ country: '', cities: [''] }],
                  visaCostUSD: 0,
                  hotelTaxUSD: 0,
                  disclaimer: '',
                  servicesIncludedEgypt: '',
                  servicesIncludedTurkey: '',
                  servicesExcluded: '',
                  itinerary: [],
                  servicesIncludedList: [],
                  servicesExcludedList: [''],
                  hotelsPlanned: [],
                  isDraft: true
                });
                setCreatingTypeSelected(true);
              } else if (activeModule === 'location') {
                setFormData({
                  name: '',
                  type: 'location',
                  subtitle: '',
                  travelStyles: [],
                  guideBestSeason: '',
                  guideHowToGetAround: '',
                  guideRecommendedDuration: '',
                  mapUrl: '',
                  suggestedItineraries: [],
                  locationType: '',
                  parentRegionId: '',
                  address: '',
                  city: '',
                  country: '',
                  geolocationUrl: '',
                  openingHours: '',
                  pricing: '',
                  ticketUrl: '',
                  estimatedVisitTime: '',
                  amenities: {
                    parking: false,
                    accessibility: false,
                    restrooms: false,
                    petFriendly: false,
                    kidsFriendly: false
                  },
                  highlights: [],
                  travelerTips: '',
                  nearbyLocations: [],
                  isDraft: true
                });
                setActivePanels({
                  logistics: false,
                  routes: false,
                  practicalData: false,
                  amenities: false,
                  highlightsAndTips: false
                });
                setCreatingTypeSelected(true);
              } else if (activeModule === 'design_tokens') {
                setFormData({
                  brandName: '',
                  colors: [],
                  typographies: [],
                  logos: [],
                  isDraft: true
                });
                setCreatingTypeSelected(true);
              } else {
                setFormData({
                  title: '',
                  category: '',
                  description: '',
                  url: '',
                  video_url: '',
                  tools: [],
                  isDraft: true,
                  prompt: '',
                  promptVars: [],
                  problems: [],
                  benefits: [],
                  recommendedScenarios: [],
                  criticalExclusions: [],
                  technicalExample: '',
                  steps: []
                });
                setActivePanels({
                  steps: false,
                  problems: false,
                  scenarios: false,
                  metrics: false,
                  prompt: false,
                  code: false,
                  videos: false
                });
                setCreatingTypeSelected(true);
              }
              setShowForm(true);
            }}
            className="btn-primary flex items-center justify-center gap-2 text-sm whitespace-nowrap h-9 rounded-md px-4"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Añadir Nuevo
          </button>
        </div>
      </div>

      {loadingData ? (
        <div className="text-center py-10">
          <span className="material-symbols-outlined spin text-3xl" style={{ color: 'var(--primary)' }}>sync</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr className="border-b border-[var(--outline-variant)] text-xs font-semibold uppercase tracking-wider text-[var(--on-surface)]">
                <th className="pb-3 pr-2" style={{ width: '28%' }}>
                  <div className="flex flex-col gap-2 items-start">
                    <div className="flex items-center gap-2">
                      <span>{activeModule === 'design_tokens' ? 'Marca / Sistema de Diseño' : 'Nombre'}</span>
                      <button
                        type="button"
                        onClick={() => setSortAlphabetical(!sortAlphabetical)}
                        className="inline-flex items-center justify-center rounded-md p-1 transition-colors"
                        style={{
                          background: sortAlphabetical ? 'var(--primary-container)' : 'transparent',
                          color: sortAlphabetical ? 'var(--primary)' : 'var(--outline)',
                          border: '1px solid var(--outline-variant)',
                          cursor: 'pointer',
                          width: '24px',
                          height: '24px'
                        }}
                        title={sortAlphabetical ? "Ordenado A-Z (clic para desactivar)" : "Ordenar A-Z"}
                      >
                        <span className="material-symbols-outlined text-xs">
                          {sortAlphabetical ? 'sort_by_alpha' : 'sort'}
                        </span>
                      </button>
                    </div>
                    {activeModule === 'departure' && (
                      <select
                        value={filterLocation}
                        onChange={(e) => setFilterLocation(e.target.value)}
                        className="form-select text-xs h-7 rounded bg-[var(--surface-container)] border-[var(--outline-variant)] text-[var(--on-surface)]"
                        style={{ padding: '0 8px', maxWidth: '100%', fontSize: '11px' }}
                      >
                        <option value="all">Todas las regiones</option>
                        {locationOptions.map(opt => (
                          <option key={opt.id || opt} value={opt.id || opt}>{opt.label || opt}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </th>
                <th className="pb-3 pr-2" style={{ width: activeModule === 'travel' ? '21%' : '37%' }}>
                  <div className="flex flex-col gap-2 items-start">
                    <span className="whitespace-nowrap">
                      {activeModule === 'design_tokens'
                        ? 'Elementos'
                        : activeModule === 'departure'
                          ? 'Fecha Salida'
                          : 'Categoría'}
                    </span>
                    {activeModule !== 'design_tokens' && activeModule !== 'travel' && activeModule !== 'departure' && (
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="form-select text-xs h-7 rounded bg-[var(--surface-container)] border-[var(--outline-variant)] text-[var(--on-surface)]"
                        style={{ padding: '0 8px', maxWidth: '100%', fontSize: '11px' }}
                      >
                        <option value="all">Todas las categorías</option>
                        {categoryOptions.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.label}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </th>
                <th className="pb-3 pr-2" style={{ width: '33%' }}>
                  <div className="flex flex-col gap-2 items-start">
                    <span className="whitespace-nowrap">
                      {activeModule === 'departure' ? 'Cupos / Pasajeros' : 'Ubicación'}
                    </span>
                    {(activeModule === 'travel' || activeModule === 'location') && (
                      <select
                        value={filterLocation}
                        onChange={(e) => setFilterLocation(e.target.value)}
                        className="form-select text-xs h-7 rounded bg-[var(--surface-container)] border-[var(--outline-variant)] text-[var(--on-surface)]"
                        style={{ padding: '0 8px', maxWidth: '100%', fontSize: '11px' }}
                      >
                        <option value="all">{activeModule === 'location' ? 'Todas las regiones' : 'Todos los países'}</option>
                        {locationOptions.map(opt => (
                          <option key={opt.id || opt} value={opt.id || opt}>{opt.label || opt}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </th>
                <th className="pb-3 pr-2" style={{ width: '9%' }}>Estado</th>
                <th className="pb-3 text-right" style={{ width: '9%' }}>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--outline-variant)]">
              {items
                .filter(i => {
                  const searchStr = activeModule === 'design_tokens'
                    ? `${i.brandName || i.brand_name || ''}`
                    : activeModule === 'departure'
                      ? `${i.departureDate || ''} ${((travels || []).find(t => t.id === i.travelId)?.title || '')}`
                      : activeModule === 'location'
                        ? `${i.name || ''} ${i.locationType || ''} ${i.city || ''}`
                        : `${i.title} ${activeModule === 'travel' ? '' : i.category}`;
                  const matchesSearch = (searchStr || '').toLowerCase().includes(searchTerm.toLowerCase());

                  let matchesCategory = true;
                  if (activeModule !== 'design_tokens' && activeModule !== 'travel' && activeModule !== 'departure' && filterCategory !== 'all') {
                    if (activeModule === 'terms') {
                      const parsed = parseCategory(i.category);
                      matchesCategory = parsed.workArea === filterCategory;
                    } else if (activeModule === 'location') {
                      matchesCategory = i.type === filterCategory;
                    } else {
                      matchesCategory = i.category === filterCategory;
                    }
                  }

                  let matchesLocation = true;
                  if (filterLocation !== 'all') {
                    if (activeModule === 'travel') {
                      matchesLocation = (i.countriesSummaryList || []).some(c => c.country === filterLocation);
                    } else if (activeModule === 'location') {
                      const isRegionItself = i.id === filterLocation;
                      const isDirectChild = i.parentRegionId === filterLocation || i.parent_region_id === filterLocation;
                      const parentCity = items.find(loc => loc.id === (i.parentCityId || i.parent_city_id));
                      const isGrandChild = parentCity && (parentCity.parentRegionId === filterLocation || parentCity.parent_region_id === filterLocation);
                      matchesLocation = isRegionItself || isDirectChild || isGrandChild;
                    } else if (activeModule === 'departure') {
                      const pTravel = (travels || []).find(t => t.id === i.travelId);
                      matchesLocation = pTravel ? (pTravel.countriesSummaryList || []).some(c => c.country === filterLocation) : false;
                    }
                  }

                  return matchesSearch && matchesCategory && matchesLocation;
                })
                .sort((a, b) => {
                  if (!sortAlphabetical) return 0;
                  const valA = (activeModule === 'design_tokens' || activeModule === 'location' ? a.brandName || a.name : activeModule === 'departure' ? a.departureDate : a.title) || '';
                  const valB = (activeModule === 'design_tokens' || activeModule === 'location' ? b.brandName || b.name : activeModule === 'departure' ? b.departureDate : b.title) || '';
                  return valA.localeCompare(valB);
                })
                .map(item => {
                  const isDraft = activeModule === 'travel' ? !item.isPublished : item.isDraft;
                  return (
                    <tr key={item.id} className="text-sm">
                      <td className="py-3 font-semibold text-[var(--on-surface)] pr-2 truncate">
                        {activeModule === 'design_tokens' ? (
                          <span className="flex items-center gap-2 truncate">
                            <span className="truncate">{item.brandName}</span>
                          </span>
                        ) : activeModule === 'location' ? (
                          <span className="flex items-center gap-2 truncate">
                            <span className="truncate">{item.name}</span>
                          </span>
                        ) : activeModule === 'departure' ? (
                          (() => {
                            const pTravel = (travels || []).find(t => t.id === item.travelId);
                            return (
                              <span className="flex items-center gap-2 truncate">
                                <span className="truncate"><strong>{pTravel ? pTravel.title : 'Viaje no encontrado'}</strong></span>
                              </span>
                            );
                          })()
                        ) : (
                          <span className="truncate block">{item.title}</span>
                        )}
                      </td>
                      <td className="py-3 text-[var(--on-surface-variant)] pr-2">
                        {activeModule === 'travel' ? (
                          (() => {
                            const tripDepartures = departures.filter(d => d.travelId === item.id && d.status !== 'cancelled');
                            tripDepartures.sort((a, b) => new Date(a.departureDate) - new Date(b.departureDate));
                            const now = new Date();
                            const nextDep = tripDepartures.find(d => new Date(d.departureDate) >= now) || tripDepartures[0];
                            return (
                              <div className="flex flex-col gap-1 text-xs">
                                <div className="flex flex-wrap gap-1">
                                  <span className="chip chip-neutral font-bold">{item.durationDays} Días / {item.durationNights} Noches</span>
                                </div>
                                {nextDep && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    <span className="chip chip-primary font-bold">📅 {nextDep.departureDate}</span>
                                    <span className="chip chip-neutral">👥 {nextDep.passengersCount} / {nextDep.capacity}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })()
                        ) : activeModule === 'departure' ? (
                          <div className="flex flex-wrap gap-1 text-xs">
                            <span className="chip chip-neutral font-bold">📅 {item.departureDate}</span>
                            {item.endDate && <span className="chip chip-neutral">🔄 {item.endDate}</span>}
                          </div>
                        ) : activeModule === 'design_tokens' ? (
                          <div className="flex flex-wrap gap-2 text-xs">
                            {item.colors && item.colors.length > 0 && <span className="chip chip-neutral">{item.colors.length} Colores</span>}
                            {item.typographies && item.typographies.length > 0 && <span className="chip chip-neutral">{item.typographies.length} Fuentes</span>}
                            {item.logos && item.logos.length > 0 && <span className="chip chip-neutral">{item.logos.length} Logos</span>}
                          </div>
                        ) : activeModule === 'location' ? (
                          <div className="flex flex-wrap gap-1 text-xs">
                            <span className="chip chip-neutral font-mono font-bold">
                              {item.type === 'region' ? '📍 Región' : item.type === 'city' ? '🏙️ Ciudad/Área' : '📌 Atracción'}
                            </span>
                            {item.locationType && (
                              item.locationType.split(',').map((typePart, idx) => {
                                const trimmed = typePart.trim();
                                if (!trimmed) return null;
                                return (
                                  <span key={idx} className="chip chip-neutral font-mono">
                                    {trimmed}
                                  </span>
                                );
                              })
                            )}
                          </div>
                        ) : (
                          (() => {
                            const parsed = parseCategory(item.category);
                            return (
                              <div className="flex flex-wrap gap-1 text-xs">
                                <span className="chip chip-neutral font-mono">{parsed.workArea}</span>
                                <span className="chip chip-neutral font-mono">{parsed.contentType}</span>
                              </div>
                            );
                          })()
                        )}
                      </td>
                      <td className="py-3 pr-2 text-xs">
                        {activeModule === 'travel' ? (
                          <div
                            className="flex flex-wrap gap-1 max-w-full overflow-hidden"
                            style={{
                              maxHeight: '36px',
                              lineHeight: '1.2'
                            }}
                          >
                            {item.destinationsSummary && (
                              (() => {
                                const parts = (Array.isArray(item.destinationsSummary) ? item.destinationsSummary.join(', ') : item.destinationsSummary)
                                  .split(/,\s*(?![^(]*\))/g)
                                  .map(x => x.trim())
                                  .filter(Boolean);

                                return parts.map((part, pIdx) => {
                                  const match = part.match(/^([^(]+)(?:\(([^)]+)\))?$/);
                                  const country = match ? match[1].trim() : part;
                                  return (
                                    <span key={pIdx} className="chip chip-primary font-bold">
                                      {country}
                                    </span>
                                  );
                                });
                              })()
                            )}
                          </div>
                        ) : activeModule === 'departure' ? (
                          <div className="flex flex-wrap gap-1 text-xs">
                            <span className={`chip ${item.passengersCount >= item.capacity ? 'chip-error font-bold' : 'chip-primary font-bold'}`}>
                              👥 {item.passengersCount} / {item.capacity} Pasajeros
                            </span>
                            {item.priceOverride && (
                              <span className="chip chip-tertiary font-mono">
                                💲 {item.priceOverride}
                              </span>
                            )}
                          </div>
                        ) : activeModule === 'location' ? (
                          <div className="flex flex-col gap-0.5 text-xs truncate max-w-full">
                            {item.type === 'region' ? (
                              <span className="text-[var(--on-surface-variant)] truncate font-semibold">
                                {item.subtitle || 'Sin subtítulo'}
                              </span>
                            ) : (
                              <>
                                <span className="text-[var(--on-surface-variant)] truncate">
                                  {item.city ? `${item.city}, ${item.country || ''}` : item.address || '-'}
                                </span>
                                {item.parentRegionId && (
                                  <span className="text-[var(--outline)] text-[10px] truncate">
                                    Región: <strong>{items.find(i => i.id === item.parentRegionId)?.name || item.parentRegionId}</strong>
                                  </span>
                                )}
                                {item.parentCityId && (
                                  <span className="text-[var(--outline)] text-[10px] truncate">
                                    Ciudad: <strong>{items.find(i => i.id === item.parentCityId)?.name || item.parentCityId}</strong>
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-[var(--outline)] italic text-xs">-</span>
                        )}
                      </td>

                      <td className="py-3 pr-2">
                    {activeModule === 'departure' ? (
                      (() => {
                        let chipColor = 'chip-primary';
                        let statusLabel = 'Abierta';
                        if (item.status === 'confirmed') { chipColor = 'chip-tertiary'; statusLabel = 'Confirmada'; }
                        if (item.status === 'closed') { chipColor = 'chip-error'; statusLabel = 'Cerrada'; }
                        if (item.status === 'cancelled') { chipColor = 'chip-neutral'; statusLabel = 'Cancelada'; }
                        return (
                          <span className={`chip ${chipColor} font-bold`}>
                            {statusLabel}
                          </span>
                        );
                      })()
                    ) : (
                      <span className={`chip ${isDraft ? 'chip-neutral' : 'chip-tertiary'}`}>
                        {isDraft ? 'Borrador' : 'Publicado'}
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-right space-x-2">
                    <button
                      onClick={() => handleToggleStatus && handleToggleStatus(item)}
                      className="btn-icon text-sm inline-flex items-center justify-center"
                      title={isDraft ? 'Activar/Publicar' : 'Desactivar/Ocultar'}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {isDraft ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                    <button
                      onClick={() => startEdit(item)}
                      className="btn-icon text-sm inline-flex items-center justify-center"
                      title="Editar"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <HoldToConfirmButton
                      onConfirm={() => handleDelete(item.id)}
                      className="btn-icon text-sm inline-flex items-center justify-center text-[var(--error)]"
                      title="Mantén presionado para eliminar"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </HoldToConfirmButton>
                  </td>
                    </tr>
            );
                })}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
