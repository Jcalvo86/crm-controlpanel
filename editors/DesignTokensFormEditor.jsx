import React from 'react';

export default function DesignTokensFormEditor({
  formData,
  setFormData,
  activePanels,
  handlers: {
    handleColorChange,
    addColor,
    removeColor,
    handleTypographyChange,
    addTypography,
    removeTypography,
    handleLogoChange,
    addLogo,
    removeLogo
  }
}) {
  return (
    <>
      {/* Token Identity Section */}
      <section id="sec-identity" className="glass-panel p-8">
        <h2 className="font-headline-sm mb-6 flex items-center gap-2" style={{ color: 'var(--on-surface)' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>palette</span>
          Identidad del Sistema de Diseño
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-2">
            <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Nombre de la Marca *</label>
            <input
              type="text"
              required
              value={formData.brandName}
              onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
              placeholder="Ej: Glosaurio, Nike"
              className="form-input"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Enlace URL (UI Kit / Web)</label>
            <input
              type="url"
              value={formData.url || ''}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="Ej: https://figma.com/... o https://ejemplo.com"
              className="form-input"
            />
          </div>
        </div>
      </section>

      {/* Conditional Token Settings Section */}
      {activePanels.color && (
        <section id="sec-color" className="glass-panel p-8 space-y-6">
          <div className="flex justify-between items-center border-b border-[var(--outline-variant)] pb-4">
            <h2 className="font-headline-sm flex items-center gap-2" style={{ color: 'var(--on-surface)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>color_lens</span>
              Paleta de Colores
            </h2>
            <button
              type="button"
              onClick={addColor}
              className="btn-secondary text-xs flex items-center gap-1"
              style={{ padding: '6px 12px' }}
            >
              <span className="material-symbols-outlined text-sm">add</span> Añadir Color
            </button>
          </div>
          <div className="space-y-6 divide-y divide-[var(--outline-variant)]">
            {(formData.colors || []).map((color, idx) => (
              <div key={idx} className="pt-6 first:pt-0 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="chip chip-neutral text-xs font-mono">Color #{idx + 1}</span>
                  {(formData.colors || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeColor(idx)}
                      className="btn-icon text-[var(--error)]"
                      title="Eliminar este color"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Código Color (HEX/RGB/HSL)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={color.hex || ''}
                        onChange={(e) => handleColorChange(idx, 'hex', e.target.value)}
                        placeholder="Ej: #2563EB"
                        className="form-input flex-1"
                      />
                      <div
                        className="w-12 h-12 rounded-xl border border-[var(--outline-variant)] shadow-sm shrink-0"
                        style={{ backgroundColor: color.hex || 'transparent' }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Rol / Nombre del Color</label>
                    <input
                      type="text"
                      value={color.role || ''}
                      onChange={(e) => handleColorChange(idx, 'role', e.target.value)}
                      placeholder="Ej: Primary Button, Text Accent"
                      className="form-input"
                    />
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Descripción de la Paleta & Uso</label>
                    <textarea
                      value={color.description || ''}
                      onChange={(e) => handleColorChange(idx, 'description', e.target.value)}
                      placeholder="Describe cómo y cuándo debe utilizarse este color..."
                      rows="3"
                      className="form-textarea"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activePanels.typography && (
        <section id="sec-typography" className="glass-panel p-8 space-y-6">
          <div className="flex justify-between items-center border-b border-[var(--outline-variant)] pb-4">
            <h2 className="font-headline-sm flex items-center gap-2" style={{ color: 'var(--on-surface)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>text_fields</span>
              Tipografías
            </h2>
            <button
              type="button"
              onClick={addTypography}
              className="btn-secondary text-xs flex items-center gap-1"
              style={{ padding: '6px 12px' }}
            >
              <span className="material-symbols-outlined text-sm">add</span> Añadir Fuente
            </button>
          </div>
          <div className="space-y-6 divide-y divide-[var(--outline-variant)]">
            {(formData.typographies || []).map((typo, idx) => (
              <div key={idx} className="pt-6 first:pt-0 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="chip chip-neutral text-xs font-mono">Fuente #{idx + 1}</span>
                  {(formData.typographies || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTypography(idx)}
                      className="btn-icon text-[var(--error)]"
                      title="Eliminar esta fuente"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Google Font Family</label>
                    <input
                      type="text"
                      value={typo.fontFamily || ''}
                      onChange={(e) => handleTypographyChange(idx, 'fontFamily', e.target.value)}
                      placeholder="Ej: Plus Jakarta Sans o Inter"
                      className="form-input"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Tamaño de Fuente (Base)</label>
                    <input
                      type="text"
                      value={typo.fontSize || ''}
                      onChange={(e) => handleTypographyChange(idx, 'fontSize', e.target.value)}
                      placeholder="Ej: 16px o 1.25rem"
                      className="form-input"
                    />
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Pesos Disponibles (Separados por coma)</label>
                    <input
                      type="text"
                      value={Array.isArray(typo.weights) ? typo.weights.join(', ') : typo.weights || ''}
                      onChange={(e) => handleTypographyChange(idx, 'weights', e.target.value.split(',').map(x => x.trim()))}
                      placeholder="Ej: 400, 600, 700"
                      className="form-input"
                    />
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Texto de Muestra</label>
                    <textarea
                      value={typo.fontSampleText || ''}
                      onChange={(e) => handleTypographyChange(idx, 'fontSampleText', e.target.value)}
                      placeholder="Muestra de texto para probar la tipografía..."
                      rows="3"
                      className="form-textarea"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activePanels.logo && (
        <section id="sec-logo" className="glass-panel p-8 space-y-6">
          <div className="flex justify-between items-center border-b border-[var(--outline-variant)] pb-4">
            <h2 className="font-headline-sm flex items-center gap-2" style={{ color: 'var(--on-surface)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>crop_schema</span>
              Logos SVG
            </h2>
            <button
              type="button"
              onClick={addLogo}
              className="btn-secondary text-xs flex items-center gap-1"
              style={{ padding: '6px 12px' }}
            >
              <span className="material-symbols-outlined text-sm">add</span> Añadir Logo
            </button>
          </div>
          <div className="space-y-6 divide-y divide-[var(--outline-variant)]">
            {(formData.logos || []).map((logo, idx) => (
              <div key={idx} className="pt-6 first:pt-0 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="chip chip-neutral text-xs font-mono">Logo #{idx + 1}</span>
                  {(formData.logos || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLogo(idx)}
                      className="btn-icon text-[var(--error)]"
                      title="Eliminar este logo"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Nombre del Logotipo</label>
                    <input
                      type="text"
                      value={logo.name || ''}
                      onChange={(e) => handleLogoChange(idx, 'name', e.target.value)}
                      placeholder="Ej: Logo Principal, Isotipo, Logo Versión Oscura"
                      className="form-input"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Código SVG Crudo</label>
                    <div className="code-editor">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex gap-2">
                          <span className="w-3 h-3 rounded-full bg-[var(--error)]"></span>
                          <span className="w-3 h-3 rounded-full bg-[var(--secondary)]"></span>
                          <span className="w-3 h-3 rounded-full bg-[var(--primary)]"></span>
                        </div>
                        <span className="font-caption text-[var(--outline)]">logo-{idx + 1}.svg</span>
                      </div>
                      <textarea
                        value={logo.svgContent || ''}
                        onChange={(e) => handleLogoChange(idx, 'svgContent', e.target.value)}
                        placeholder="<svg viewBox='0 0 100 100' ...>&#10;  <path ... />&#10;</svg>"
                        rows="10"
                        spellCheck="false"
                        className="code-textarea"
                      />
                    </div>
                  </div>

                  {/* SVG Live Preview */}
                  {logo.svgContent && (
                    <div className="flex flex-col gap-2">
                      <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Previsualización SVG</label>
                      <div
                        className="p-8 rounded-2xl flex items-center justify-center border border-dashed border-[var(--outline-variant)] bg-[var(--surface-container-low)] min-h-[140px] max-h-[260px] overflow-auto"
                        dangerouslySetInnerHTML={{ __html: logo.svgContent }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
