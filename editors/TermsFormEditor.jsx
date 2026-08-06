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
        <h2 className="font-headline-sm mb-2 flex items-center gap-2" style={{ color: 'var(--on-surface)' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>fingerprint</span>
          Identidad de la Entrada
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          Define los datos básicos de este concepto: su título, a qué área de trabajo pertenece y el formato del contenido.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-slate-700 flex items-center">
              Título de la Entrada <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: Vibe Coding Essentials"
              className="h-[38px] px-3 py-2 text-sm text-slate-900 placeholder-slate-400 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:bg-slate-50 transition-colors w-full"
            />
          </div>
          {Object.entries(normalizedTax).map(([taxKey, tax]) => (
            <div key={taxKey} className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-slate-700 flex items-center">
                {tax.label} <span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData[taxKey] || (tax.items && tax.items[0]?.val) || 'all'}
                  onChange={async (e) => {
                    const val = e.target.value;
                    if (val === '__ADD_NEW__') {
                      const name = prompt('Ingresa el nombre de la nueva área de trabajo:');
                      if (name) {
                        const icon = prompt('Ingresa un emoji para esta área (opcional):') || '📌';
                        const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
                        const newItem = { val: slug, label: name, icon: icon, chipClass: 'chip-neutral' };
                        
                        const currentConfig = window.DataSourceConfig?.getConfig() || config;
                        const updatedWorkAreas = [...(currentConfig.taxonomies?.workAreas || []), newItem];
                        const newConfig = {
                          ...currentConfig,
                          taxonomies: {
                            ...currentConfig.taxonomies,
                            workAreas: updatedWorkAreas
                          }
                        };
                        if (window.DataSourceConfig) {
                          await window.DataSourceConfig.saveConfig(newConfig);
                        }
                        window.dispatchEvent(new CustomEvent('GlosaurioConfigUpdated', { detail: newConfig }));
                        setFormData({ ...formData, [taxKey]: slug });
                      }
                      // Reset value to old if prompt cancelled
                      e.target.value = formData[taxKey] || (tax.items && tax.items[0]?.val) || 'all';
                    } else {
                      setFormData({ ...formData, [taxKey]: val });
                    }
                  }}
                  className="h-[38px] w-full pl-3 pr-10 py-2 text-sm text-slate-900 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:bg-slate-50 transition-colors appearance-none"
                >
                  {(tax.items || []).map(item => (
                    <option key={item.val} value={item.val}>{item.icon} {item.label}</option>
                  ))}
                  {taxKey === 'workArea' && (
                    <option value="__ADD_NEW__">➕ Añadir nueva área...</option>
                  )}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-lg">expand_more</span>
              </div>
            </div>
          ))}
          <div className="md:col-span-2 flex flex-col gap-3">
            <label className="text-[13px] font-semibold text-slate-700 flex items-center">
              Resultado Objetivo / ¿Qué necesito? <span className="text-red-500 ml-0.5">*</span>
            </label>
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
              <div className="flex rounded-md shadow-sm w-full">
                <input
                  type="text"
                  id="custom-result-input"
                  placeholder="Escribe un resultado objetivo personalizado y pulsa Añadir..."
                  className="h-[38px] flex-1 rounded-l-md border border-r-0 border-slate-200 px-3 text-sm text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:bg-slate-50 transition-colors"
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
                  className="h-[38px] px-4 rounded-r-md bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors shrink-0"
                >
                  Añadir
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-slate-700">Enlace URL (Documentación / Web)</label>
            <input
              type="url"
              value={formData.url || ''}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="Ej: https://ejemplo.com"
              className="h-[38px] px-3 py-2 text-sm text-slate-900 placeholder-slate-400 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:bg-slate-50 transition-colors w-full"
            />
          </div>
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-slate-700 flex items-center">
              Descripción Corta <span className="text-red-500 ml-0.5">*</span>
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción del término que aparecerá en la tarjeta del glosario..."
              rows="3"
              className="px-3 py-2 text-sm text-slate-900 placeholder-slate-400 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:bg-slate-50 transition-colors w-full min-h-[96px] resize-y"
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
                    className="h-[38px] px-3 py-2 text-sm text-slate-900 placeholder-slate-400 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:bg-slate-50 transition-colors w-full"
                  />
                  <textarea
                    value={step.detail}
                    onChange={(e) => handleStepChange(idx, 'detail', e.target.value)}
                    placeholder="Descripción del paso..."
                    rows="2"
                    className="px-3 py-2 text-sm text-slate-900 placeholder-slate-400 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:bg-slate-50 transition-colors w-full min-h-[64px] resize-y"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-slate-700 flex items-center">Problemas que Resuelve (uno por línea)</label>
                <textarea
                  value={formData.problems}
                  onChange={(e) => setFormData({ ...formData, problems: e.target.value })}
                  placeholder="Ej: Decisiones de diseño lentas&#10;Ciclos de feedback muy largos"
                  rows="4"
                  className="px-3 py-2 text-sm text-slate-900 placeholder-slate-400 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:bg-slate-50 transition-colors w-full min-h-[96px] resize-y"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-slate-700 flex items-center">Beneficios Clave (uno por línea)</label>
                <textarea
                  value={formData.benefits}
                  onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                  placeholder="Ej: Reduce semanas de trabajo a días&#10;Valida ideas rápidamente"
                  rows="4"
                  className="px-3 py-2 text-sm text-slate-900 placeholder-slate-400 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:bg-slate-50 transition-colors w-full min-h-[96px] resize-y"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-slate-700 flex items-center">Entregables Esperados</label>
                <textarea
                  value={formData.results}
                  onChange={(e) => setFormData({ ...formData, results: e.target.value })}
                  placeholder="¿Qué se obtiene al aplicar este término?"
                  rows="4"
                  className="px-3 py-2 text-sm text-slate-900 placeholder-slate-400 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:bg-slate-50 transition-colors w-full min-h-[96px] resize-y"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-slate-700 flex items-center">Métricas de Éxito</label>
                <textarea
                  value={formData.metrics}
                  onChange={(e) => setFormData({ ...formData, metrics: e.target.value })}
                  placeholder="¿Cómo saber si se aplicó correctamente?"
                  rows="4"
                  className="px-3 py-2 text-sm text-slate-900 placeholder-slate-400 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:bg-slate-50 transition-colors w-full min-h-[96px] resize-y"
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
              <div className="flex flex-col gap-1.5 mb-4">
                <label className="text-[13px] font-semibold text-slate-700 flex items-center">Variables rápidas (separadas por coma)</label>
                <input
                  type="text"
                  value={formData.promptVars}
                  onChange={(e) => setFormData({ ...formData, promptVars: e.target.value })}
                  placeholder="Ej: nombre_marca, industria, tono"
                  className="h-[38px] px-3 py-2 text-sm text-slate-900 placeholder-slate-400 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:bg-slate-50 transition-colors w-full"
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
                    className="h-[38px] px-3 py-2 text-sm text-slate-900 placeholder-slate-400 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:bg-slate-50 transition-colors flex-1"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-slate-700 flex items-center">Dónde SÍ aplicarlo / Casos de Uso Ideales (uno por línea)</label>
                <textarea
                  value={formData.recommendedScenarios}
                  onChange={(e) => setFormData({ ...formData, recommendedScenarios: e.target.value })}
                  placeholder="Ej: Pantallas iterativas de planificación (Cartas Gantt, matrices RACI)&#10;Formularios extensos o fichas de configuración"
                  rows="4"
                  className="px-3 py-2 text-sm text-slate-900 placeholder-slate-400 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:bg-slate-50 transition-colors w-full min-h-[96px] resize-y"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-slate-700 flex items-center">Dónde NO aplicarlo / Contraindicaciones (uno por línea)</label>
                <textarea
                  value={formData.criticalExclusions}
                  onChange={(e) => setFormData({ ...formData, criticalExclusions: e.target.value })}
                  placeholder="Ej: Colaboración multiusuario en tiempo real&#10;Creación o eliminación de entidades principales"
                  rows="4"
                  className="px-3 py-2 text-sm text-slate-900 placeholder-slate-400 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:bg-slate-50 transition-colors w-full min-h-[96px] resize-y"
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
