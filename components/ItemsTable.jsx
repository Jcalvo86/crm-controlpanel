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
  handleImportFile,
  setIsEditing,
  setSelectedId,
  setFormData,
  setActivePanels,
  setCreatingTypeSelected,
  setShowForm
}) {
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
            className="form-input w-full pl-10 text-sm"
            style={{ padding: '8px 16px' }}
          />
        </div>

        {/* Categories Dropdown & Add Button */}
        <div className="flex items-center gap-3">
          {activeModule !== 'design_tokens' && activeModule !== 'travel' && (
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="form-select text-sm"
              style={{ padding: '8px 16px' }}
            >
              <option value="all">Todas las Áreas de Trabajo</option>
              {workAreas.map(wa => (
                <option key={wa.id} value={wa.id}>{wa.label}</option>
              ))}
            </select>
          )}

          {activeModule === 'travel' && (
            <div className="relative">
              <button
                type="button"
                onClick={() => document.getElementById('travel-import-input').click()}
                className="btn-secondary flex items-center gap-2 text-sm"
                style={{ padding: '6px 16px' }}
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
                setCreatingTypeSelected(false);
              }
              setShowForm(true);
            }}
            className="btn-primary flex items-center gap-2 text-sm whitespace-nowrap"
            style={{ padding: '6px 16px' }}
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
              <tr className="border-b border-[var(--outline-variant)] text-xs uppercase tracking-wider text-[var(--outline)]">
                <th className="pb-3 pr-2" style={{ width: '28%' }}>
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
                </th>
                <th className="pb-3 pr-2" style={{ width: '21%' }}>
                  <div className="flex items-center gap-2">
                    <span>{activeModule === 'design_tokens' ? 'Elementos' : 'Categoría'}</span>
                  </div>
                </th>
                <th className="pb-3 pr-2" style={{ width: '33%' }}>Ubicación</th>
                <th className="pb-3 pr-2" style={{ width: '9%' }}>Estado</th>
                <th className="pb-3 text-right" style={{ width: '9%' }}>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--outline-variant)]">
              {items
                .filter(i => {
                  const searchStr = activeModule === 'design_tokens'
                    ? `${i.brandName || i.brand_name || ''}`
                    : `${i.title} ${activeModule === 'travel' ? '' : i.category}`;
                  const matchesSearch = searchStr.toLowerCase().includes(searchTerm.toLowerCase());

                  let matchesCategory = true;
                  if (activeModule !== 'design_tokens' && activeModule !== 'travel' && filterCategory !== 'all') {
                    const parsed = parseCategory(i.category);
                    matchesCategory = parsed.workArea === filterCategory;
                  }

                  return matchesSearch && matchesCategory;
                })
                .sort((a, b) => {
                  if (!sortAlphabetical) return 0;
                  const valA = (activeModule === 'design_tokens' || activeModule === 'location' ? a.brandName || a.name : a.title) || '';
                  const valB = (activeModule === 'design_tokens' || activeModule === 'location' ? b.brandName || b.name : b.title) || '';
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
                        ) : (
                          <span className="truncate block">{item.title}</span>
                        )}
                      </td>
                      <td className="py-3 text-[var(--on-surface-variant)] pr-2">
                        {activeModule === 'travel' ? (
                          <div className="flex flex-wrap gap-1 text-xs">
                            <span className="chip chip-neutral font-bold">{item.durationDays} Días / {item.durationNights} Noches</span>
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
                              {item.type === 'region' ? '📍 Región' : '📌 Ubicación'}
                            </span>
                            {item.locationType && (
                              <span className="chip chip-neutral font-mono">
                                {item.locationType}
                              </span>
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
                      
                      {/* Location column displaying only countries summary */}
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
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-[var(--outline)] italic text-xs">-</span>
                        )}
                      </td>

                      <td className="py-3 pr-2">
                        <span className={`chip ${isDraft ? 'chip-neutral' : 'chip-tertiary'}`}>
                          {isDraft ? 'Borrador' : 'Publicado'}
                        </span>
                      </td>
                      <td className="py-3 text-right space-x-2">
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
