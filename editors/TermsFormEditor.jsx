import React from 'react';
import HoldToConfirmButton from '../components/HoldToConfirmButton.jsx';
import { normalizeTaxonomies } from '../utils/formDefaults.js';

export default function TermsFormEditor({
  formData,
  setFormData,
  activePanels,
  setActivePanels,
  expandedSections,
  toggleSection,
  config,
  mergedResultsOptions,
  showAllResults,
  setShowAllResults,
  handlers: {
    handleStepChange,
    addStep,
    removeStep,
    handleVideoChange,
    addVideo,
    removeVideo
  }
}) {
  const normalizedTax = normalizeTaxonomies(config.taxonomies);

  return (
    <>
      {/* Identity Section */}
      <section id="sec-identity" className="glass-panel p-8">
        <h2 className="font-headline-sm mb-6 flex items-center gap-2" style={{ color: 'var(--on-surface)' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>fingerprint</span>
          Identidad de la Entrada
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2 flex flex-col gap-2">
            <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Título de la Entrada *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: Vibe Coding Essentials"
              className="form-input font-headline-sm"
              style={{ fontSize: '1.1rem' }}
            />
          </div>
          {Object.entries(normalizedTax).map(([taxKey, tax]) => (
            <div key={taxKey} className="flex flex-col gap-2">
              <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>{tax.label} *</label>
              <div className="relative">
                <select
                  value={formData[taxKey] || (tax.items && tax.items[0]?.val) || 'all'}
                  onChange={(e) => setFormData({ ...formData, [taxKey]: e.target.value })}
                  className="form-select font-body-sm bg-[var(--surface-container-low)]"
                  style={{ height: '42px' }}
                >
                  {(tax.items || []).map(item => (
                    <option key={item.val} value={item.val}>{item.icon} {item.label}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-lg" style={{ color: 'var(--outline)' }}>expand_more</span>
              </div>
            </div>
          ))}
          <div className="md:col-span-2 flex flex-col gap-3">
            <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Resultado Objetivo / ¿Qué necesito? *</label>
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const visibleOptions = showAllResults ? mergedResultsOptions : mergedResultsOptions.slice(0, 12);
                  const selectedResults = (formData.targetResult || '').split(',').map(x => x.trim()).filter(Boolean);
                  return (
                    <>
                      {visibleOptions.map(opt => {
                        const isSelected = selectedResults.includes(opt.val);
                        return (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() => {
                              let nextResults;
                              if (isSelected) {
                                nextResults = selectedResults.filter(r => r !== opt.val);
                              } else {
                                nextResults = [...selectedResults, opt.val];
                              }
                              setFormData({ ...formData, targetResult: nextResults.join(',') });
                            }}
                            className={`chip ${isSelected ? 'chip-secondary' : 'chip-neutral'}`}
                            style={{ cursor: 'pointer', border: '1px solid var(--outline-variant)', textTransform: 'none', padding: '6px 12px' }}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                      {mergedResultsOptions.length > 12 && (
                        <button
                          type="button"
                          onClick={() => setShowAllResults(!showAllResults)}
                          className="chip chip-neutral flex items-center gap-1 font-semibold text-xs"
                          style={{ cursor: 'pointer', border: '1px solid var(--outline-variant)', textTransform: 'none', padding: '6px 12px' }}
                        >
                          {showAllResults ? 'Ver menos' : `Ver todos (${mergedResultsOptions.length})`}
                          <span className="material-symbols-outlined text-[14px]">
                            {showAllResults ? 'expand_less' : 'expand_more'}
                          </span>
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="custom-result-input"
                  placeholder="Escribe un resultado objetivo personalizado y pulsa Añadir..."
                  className="form-input flex-1"
                  style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = e.target.value.trim();
                      if (val) {
                        const formatted = val.toLowerCase().replace(/\s+/g, '_');
                        const selectedResults = (formData.targetResult || '').split(',').map(x => x.trim()).filter(Boolean);
                        if (!selectedResults.includes(formatted)) {
                          const nextResults = [...selectedResults, formatted];
                          setFormData({ ...formData, targetResult: nextResults.join(',') });
                        }
                        e.target.value = '';
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('custom-result-input');
                    if (input && input.value.trim()) {
                      const val = input.value.trim();
                      const formatted = val.toLowerCase().replace(/\s+/g, '_');
                      const selectedResults = (formData.targetResult || '').split(',').map(x => x.trim()).filter(Boolean);
                      if (!selectedResults.includes(formatted)) {
                        const nextResults = [...selectedResults, formatted];
                        setFormData({ ...formData, targetResult: nextResults.join(',') });
                      }
                      input.value = '';
                    }
                  }}
                  className="btn-secondary text-xs"
                  style={{ padding: '6px 14px' }}
                >
                  Añadir
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Enlace URL (Documentación / Web)</label>
            <input
              type="url"
              value={formData.url || ''}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="Ej: https://ejemplo.com"
              className="form-input"
            />
          </div>
          <div className="md:col-span-2 flex flex-col gap-2">
            <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Descripción Corta *</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción del término que aparecerá en la tarjeta del glosario..."
              rows="3"
              className="form-textarea"
            />
          </div>
        </div>
      </section>

      {/* Process Steps Section */}
      {activePanels.steps && (
        <section id="sec-steps" className="glass-panel p-8">
          <div className="flex items-center justify-between cursor-pointer select-none mb-6" onClick={() => toggleSection('steps')}>
            <h2 className="font-headline-sm flex items-center gap-2" style={{ color: 'var(--on-surface)', margin: 0 }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>route</span>
              Proceso Paso a Paso
            </h2>
            <div className="flex items-center gap-2">
              <span className={`chip ${expandedSections.steps ? 'chip-primary' : 'chip-neutral'}`}>{expandedSections.steps ? 'Desplegado' : 'Plegado'}</span>
              <HoldToConfirmButton
                onConfirm={() => {
                  setActivePanels(prev => ({ ...prev, steps: false }));
                  setFormData(prev => ({ ...prev, steps: [{ label: '', detail: '' }] }));
                }}
                className="btn-icon text-[var(--error)]"
                style={{ border: 'none', background: 'transparent', width: '28px', height: '28px' }}
                title="Mantén presionado para quitar sección"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
              </HoldToConfirmButton>
              <span className="material-symbols-outlined transition-transform duration-200" style={{ transform: expandedSections.steps ? 'rotate(180deg)' : 'none' }}>expand_more</span>
            </div>
          </div>
          {expandedSections.steps && (
            <div className="space-y-4">
              {(formData.steps || []).map((step, idx) => (
                <div key={idx} className="p-4 rounded-xl space-y-2 relative" style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}>
                  <div className="flex items-center justify-between">
                    <span className="font-caption uppercase tracking-wider text-xs" style={{ color: 'var(--outline)' }}>Paso {idx + 1}</span>
                    {formData.steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStep(idx)}
                        className="text-[var(--error)] hover:underline flex items-center gap-1 text-xs"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                        Quitar
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={step.label}
                    onChange={(e) => handleStepChange(idx, 'label', e.target.value)}
                    placeholder="Título del paso"
                    className="form-input text-sm"
                    style={{ padding: '10px 14px' }}
                  />
                  <textarea
                    value={step.detail}
                    onChange={(e) => handleStepChange(idx, 'detail', e.target.value)}
                    placeholder="Descripción del paso..."
                    rows="2"
                    className="form-textarea text-sm"
                    style={{ padding: '10px 14px' }}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={addStep}
                className="btn-secondary w-full justify-center text-sm py-2.5 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Agregar Paso
              </button>
            </div>
          )}
        </section>
      )}

      {/* Problems Section */}
      {activePanels.problems && (
        <section id="sec-problems" className="glass-panel p-8">
          <div className="flex items-center justify-between cursor-pointer select-none mb-6" onClick={() => toggleSection('problems')}>
            <h2 className="font-headline-sm flex items-center gap-2" style={{ color: 'var(--on-surface)', margin: 0 }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>balance</span>
              Problemas y Beneficios
            </h2>
            <div className="flex items-center gap-2">
              <span className={`chip ${expandedSections.problems ? 'chip-primary' : 'chip-neutral'}`}>{expandedSections.problems ? 'Desplegado' : 'Plegado'}</span>
              <HoldToConfirmButton
                onConfirm={() => {
                  setActivePanels(prev => ({ ...prev, problems: false }));
                  setFormData(prev => ({ ...prev, problems: '', benefits: '' }));
                }}
                className="btn-icon text-[var(--error)]"
                style={{ border: 'none', background: 'transparent', width: '28px', height: '28px' }}
                title="Mantén presionado para quitar sección"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
              </HoldToConfirmButton>
              <span className="material-symbols-outlined transition-transform duration-200" style={{ transform: expandedSections.problems ? 'rotate(180deg)' : 'none' }}>expand_more</span>
            </div>
          </div>
          {expandedSections.problems && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Problemas que Resuelve (uno por línea)</label>
                <textarea
                  value={formData.problems}
                  onChange={(e) => setFormData({ ...formData, problems: e.target.value })}
                  placeholder="Ej: Decisiones de diseño lentas&#10;Ciclos de feedback muy largos"
                  rows="4"
                  className="form-textarea text-sm"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Beneficios Clave (uno por línea)</label>
                <textarea
                  value={formData.benefits}
                  onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                  placeholder="Ej: Reduce semanas de trabajo a días&#10;Valida ideas rápidamente"
                  rows="4"
                  className="form-textarea text-sm"
                />
              </div>
            </div>
          )}
        </section>
      )}

      {/* Results & Metrics Section */}
      {activePanels.metrics && (
        <section id="sec-metrics" className="glass-panel p-8">
          <div className="flex items-center justify-between cursor-pointer select-none mb-6" onClick={() => toggleSection('metrics')}>
            <h2 className="font-headline-sm flex items-center gap-2" style={{ color: 'var(--on-surface)', margin: 0 }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--secondary)' }}>insights</span>
              Resultados y Métricas
            </h2>
            <div className="flex items-center gap-2">
              <span className={`chip ${expandedSections.metrics ? 'chip-primary' : 'chip-neutral'}`}>{expandedSections.metrics ? 'Desplegado' : 'Plegado'}</span>
              <HoldToConfirmButton
                onConfirm={() => {
                  setActivePanels(prev => ({ ...prev, metrics: false }));
                  setFormData(prev => ({ ...prev, results: '', metrics: '' }));
                }}
                className="btn-icon text-[var(--error)]"
                style={{ border: 'none', background: 'transparent', width: '28px', height: '28px' }}
                title="Mantén presionado para quitar sección"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
              </HoldToConfirmButton>
              <span className="material-symbols-outlined transition-transform duration-200" style={{ transform: expandedSections.metrics ? 'rotate(180deg)' : 'none' }}>expand_more</span>
            </div>
          </div>
          {expandedSections.metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Entregables Esperados</label>
                <textarea
                  value={formData.results}
                  onChange={(e) => setFormData({ ...formData, results: e.target.value })}
                  placeholder="¿Qué se obtiene al aplicar este término?"
                  rows="4"
                  className="form-textarea"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Métricas de Éxito</label>
                <textarea
                  value={formData.metrics}
                  onChange={(e) => setFormData({ ...formData, metrics: e.target.value })}
                  placeholder="¿Cómo saber si se aplicó correctamente?"
                  rows="4"
                  className="form-textarea"
                />
              </div>
            </div>
          )}
        </section>
      )}

      {/* Prompt Template Section */}
      {activePanels.prompt && (
        <section id="sec-prompt" className="glass-panel p-8">
          <div className="flex items-center justify-between cursor-pointer select-none mb-6" onClick={() => toggleSection('prompt')}>
            <h2 className="font-headline-sm flex items-center gap-2" style={{ color: 'var(--on-surface)', margin: 0 }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>prompt_suggestion</span>
              Prompt Template
            </h2>
            <div className="flex items-center gap-2">
              <span className={`chip ${expandedSections.prompt ? 'chip-primary' : 'chip-neutral'}`}>{expandedSections.prompt ? 'Desplegado' : 'Plegado'}</span>
              <HoldToConfirmButton
                onConfirm={() => {
                  setActivePanels(prev => ({ ...prev, prompt: false }));
                  setFormData(prev => ({ ...prev, prompt: '', promptVars: '' }));
                }}
                className="btn-icon text-[var(--error)]"
                style={{ border: 'none', background: 'transparent', width: '28px', height: '28px' }}
                title="Mantén presionado para quitar sección"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
              </HoldToConfirmButton>
              <span className="material-symbols-outlined transition-transform duration-200" style={{ transform: expandedSections.prompt ? 'rotate(180deg)' : 'none' }}>expand_more</span>
            </div>
          </div>
          {expandedSections.prompt && (
            <>
              <div className="flex flex-col gap-2 mb-4">
                <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Variables rápidas (separadas por coma)</label>
                <input
                  type="text"
                  value={formData.promptVars}
                  onChange={(e) => setFormData({ ...formData, promptVars: e.target.value })}
                  placeholder="Ej: nombre_marca, industria, tono"
                  className="form-input"
                />
              </div>
              <div className="code-editor">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-2">
                    <span className="w-3 h-3 rounded-full bg-[var(--error)]"></span>
                    <span className="w-3 h-3 rounded-full bg-[var(--secondary)]"></span>
                    <span className="w-3 h-3 rounded-full bg-[var(--primary)]"></span>
                  </div>
                  <span className="font-caption text-[var(--outline)]">prompt.md</span>
                </div>
                <textarea
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  placeholder="/* Escribe aquí el prompt template */&#10;&#10;Actúa como un experto en [campo].&#10;Tu objetivo es..."
                  rows="10"
                  spellCheck="false"
                  className="code-textarea"
                />
              </div>
            </>
          )}
        </section>
      )}

      {/* Videos Section */}
      {activePanels.videos && (
        <section id="sec-videos" className="glass-panel p-8 space-y-6">
          <div className="flex justify-between items-center border-b border-[var(--outline-variant)] pb-4">
            <h2 className="font-headline-sm flex items-center gap-2" style={{ color: 'var(--on-surface)', margin: 0 }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>video_library</span>
              Videos Relacionados
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={addVideo}
                className="btn-secondary text-xs flex items-center gap-1"
                style={{ padding: '6px 12px' }}
              >
                <span className="material-symbols-outlined text-sm">add</span> Añadir Video
              </button>
              <HoldToConfirmButton
                onConfirm={() => {
                  setActivePanels(prev => ({ ...prev, videos: false }));
                  setFormData(prev => ({ ...prev, videos: [''] }));
                }}
                className="btn-icon text-[var(--error)]"
                style={{ border: 'none', background: 'transparent', width: '28px', height: '28px' }}
                title="Mantén presionado para quitar sección"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
              </HoldToConfirmButton>
              <span className={`chip ${expandedSections.videos ? 'chip-primary' : 'chip-neutral'}`}>{expandedSections.videos ? 'Desplegado' : 'Plegado'}</span>
              <span className="material-symbols-outlined transition-transform duration-200" onClick={() => toggleSection('videos')} style={{ transform: expandedSections.videos ? 'rotate(180deg)' : 'none', cursor: 'pointer' }}>expand_more</span>
            </div>
          </div>
          {expandedSections.videos && (
            <div className="space-y-4">
              {(formData.videos || []).map((videoUrl, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => handleVideoChange(idx, e.target.value)}
                    placeholder="Enlace del video (ej. YouTube, Loom, Vimeo)"
                    className="form-input flex-1"
                  />
                  {(formData.videos || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVideo(idx)}
                      className="btn-icon text-[var(--error)]"
                      title="Eliminar este video"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Scenarios Section */}
      {activePanels.scenarios && (
        <section id="sec-scenarios" className="glass-panel p-8">
          <div className="flex items-center justify-between cursor-pointer select-none mb-6" onClick={() => toggleSection('scenarios')}>
            <h2 className="font-headline-sm flex items-center gap-2" style={{ color: 'var(--on-surface)', margin: 0 }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>check_circle</span>
              Casos de Uso y Contraindicaciones
            </h2>
            <div className="flex items-center gap-2">
              <span className={`chip ${expandedSections.scenarios ? 'chip-primary' : 'chip-neutral'}`}>{expandedSections.scenarios ? 'Desplegado' : 'Plegado'}</span>
              <HoldToConfirmButton
                onConfirm={() => {
                  setActivePanels(prev => ({ ...prev, scenarios: false }));
                  setFormData(prev => ({ ...prev, recommendedScenarios: '', criticalExclusions: '' }));
                }}
                className="btn-icon text-[var(--error)]"
                style={{ border: 'none', background: 'transparent', width: '28px', height: '28px' }}
                title="Mantén presionado para quitar sección"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
              </HoldToConfirmButton>
              <span className="material-symbols-outlined transition-transform duration-200" style={{ transform: expandedSections.scenarios ? 'rotate(180deg)' : 'none' }}>expand_more</span>
            </div>
          </div>
          {expandedSections.scenarios && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Dónde SÍ aplicarlo / Casos de Uso Ideales (uno por línea)</label>
                <textarea
                  value={formData.recommendedScenarios}
                  onChange={(e) => setFormData({ ...formData, recommendedScenarios: e.target.value })}
                  placeholder="Ej: Pantallas iterativas de planificación (Cartas Gantt, matrices RACI)&#10;Formularios extensos o fichas de configuración"
                  rows="4"
                  className="form-textarea text-sm"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Dónde NO aplicarlo / Contraindicaciones (uno por línea)</label>
                <textarea
                  value={formData.criticalExclusions}
                  onChange={(e) => setFormData({ ...formData, criticalExclusions: e.target.value })}
                  placeholder="Ej: Colaboración multiusuario en tiempo real&#10;Creación o eliminación de entidades principales"
                  rows="4"
                  className="form-textarea text-sm"
                />
              </div>
            </div>
          )}
        </section>
      )}

      {/* Technical Example / Code Snippet Section */}
      {activePanels.code && (
        <section id="sec-code" className="glass-panel p-8">
          <div className="flex items-center justify-between cursor-pointer select-none mb-6" onClick={() => toggleSection('code')}>
            <h2 className="font-headline-sm flex items-center gap-2" style={{ color: 'var(--on-surface)', margin: 0 }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>code</span>
              Snippet de Código / Ejemplo Técnico
            </h2>
            <div className="flex items-center gap-2">
              <span className={`chip ${expandedSections.code ? 'chip-primary' : 'chip-neutral'}`}>{expandedSections.code ? 'Desplegado' : 'Plegado'}</span>
              <HoldToConfirmButton
                onConfirm={() => {
                  setActivePanels(prev => ({ ...prev, code: false }));
                  setFormData(prev => ({ ...prev, technicalExample: '' }));
                }}
                className="btn-icon text-[var(--error)]"
                style={{ border: 'none', background: 'transparent', width: '28px', height: '28px' }}
                title="Mantén presionado para quitar sección"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
              </HoldToConfirmButton>
              <span className="material-symbols-outlined transition-transform duration-200" style={{ transform: expandedSections.code ? 'rotate(180deg)' : 'none' }}>expand_more</span>
            </div>
          </div>
          {expandedSections.code && (
            <div className="code-editor">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <span className="w-3 h-3 rounded-full bg-[var(--error)]"></span>
                  <span className="w-3 h-3 rounded-full bg-[var(--secondary)]"></span>
                  <span className="w-3 h-3 rounded-full bg-[var(--primary)]"></span>
                </div>
                <span className="font-caption text-[var(--outline)]">example.ts</span>
              </div>
              <textarea
                value={formData.technicalExample}
                onChange={(e) => setFormData({ ...formData, technicalExample: e.target.value })}
                placeholder="// Escribe aquí tu snippet de código o implementación estándar..."
                rows="10"
                spellCheck="false"
                className="code-textarea"
              />
            </div>
          )}
        </section>
      )}
    </>
  );
}
